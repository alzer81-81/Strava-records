import { prisma } from "./db";
import { refreshAccessToken, listActivities, getActivityDetail, getAthleteStats } from "./strava";
import { mapSportType } from "./activityMap";
import { EffortKind } from "@prisma/client";

const BEST_EFFORT_KIND: EffortKind = "best_effort";

export async function ensureFreshToken(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const now = Math.floor(Date.now() / 1000);
  if (user.expiresAt > now + 60) return user;

  const refreshed = await refreshAccessToken(user.refreshToken);
  return prisma.user.update({
    where: { id: userId },
    data: {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: refreshed.expires_at
    }
  });
}

export async function syncActivities(
  userId: string,
  options: {
    full?: boolean;
    maxDetail?: number;
    details?: boolean;
    onProgress?: (progress: {
      phase: string;
      totalSteps?: number;
      processedSteps: number;
      totalActivities?: number;
      detailFetched?: number;
    }) => Promise<void>;
  } = {}
) {
  const user = await ensureFreshToken(userId);
  const { after, before, backfillBefore } = await getSyncRange(userId, options.full ?? false);

  let page = 1;
  const perPage = 100;
  let totalUpserted = 0;
  let detailFetched = 0;
  const maxDetail = options.maxDetail ?? (options.full ? 250 : 60);
  const detailsAll = options.details ?? false;
  let processedSteps = 0;
  let totalSteps: number | undefined;
  let totalActivities: number | undefined;

  if (options.full) {
    const stats = await getAthleteStats({ accessToken: user.accessToken, athleteId: user.stravaAthleteId });
    const runCount = stats.all_run_totals?.count ?? 0;
    const rideCount = stats.all_ride_totals?.count ?? 0;
    const swimCount = stats.all_swim_totals?.count ?? 0;
    totalActivities = runCount + rideCount + swimCount;
    const totalRunDetails = detailsAll ? runCount : 0;
    totalSteps = totalActivities + totalRunDetails;
    if (options.onProgress) {
      await options.onProgress({
        phase: "Fetching activities",
        totalSteps,
        processedSteps,
        totalActivities,
        detailFetched
      });
    }
  }

  while (true) {
    const activities = await listActivities({
      accessToken: user.accessToken,
      after,
      before,
      page,
      perPage
    });
    if (activities.length === 0) break;
    const result = await processActivities({
      activities,
      userId: user.id,
      accessToken: user.accessToken,
      detailsAll,
      detailFetched,
      maxDetail
    });
    totalUpserted += result.upserted;
    detailFetched = result.detailFetched;
    processedSteps += result.processedSteps;

    if (options.onProgress && processedSteps % 20 === 0) {
      await options.onProgress({
        phase: detailsAll ? "Fetching activities + best efforts" : "Fetching activities",
        totalSteps,
        processedSteps,
        totalActivities,
        detailFetched
      });
    }
    page += 1;
  }

  // Lightweight historical backfill: on quick sync, pull one older page so
  // users gradually converge to full history without forcing long syncs.
  if (!options.full && backfillBefore) {
    const historical = await listActivities({
      accessToken: user.accessToken,
      after: 0,
      before: backfillBefore,
      page: 1,
      perPage
    });
    if (historical.length > 0) {
      const result = await processActivities({
        activities: historical,
        userId: user.id,
        accessToken: user.accessToken,
        detailsAll,
        detailFetched,
        maxDetail
      });
      totalUpserted += result.upserted;
      detailFetched = result.detailFetched;
      processedSteps += result.processedSteps;
    }
  }

  // Best-effort cache coverage pass: fetch detail for uncached runs until budget.
  if (!detailsAll && detailFetched < maxDetail) {
    const remainingBudget = maxDetail - detailFetched;
    const uncachedRuns = await findUncachedRunActivityIds(user.id, remainingBudget);
    for (const activityId of uncachedRuns) {
      const detail = await getActivityDetail({
        accessToken: user.accessToken,
        activityId
      });
      if (detail.best_efforts) {
        await prisma.effortCache.upsert({
          where: {
            userId_activityId_kind: {
              userId: user.id,
              activityId,
              kind: BEST_EFFORT_KIND
            }
          },
          create: {
            userId: user.id,
            activityId,
            kind: BEST_EFFORT_KIND,
            payload: { bestEfforts: detail.best_efforts }
          },
          update: {
            payload: { bestEfforts: detail.best_efforts }
          }
        });
        detailFetched += 1;
      }
      await sleep(120);
    }
  }

  if (options.onProgress) {
    await options.onProgress({
      phase: "Finishing",
      totalSteps,
      processedSteps,
      totalActivities,
      detailFetched
    });
  }

  return { totalUpserted, detailFetched };
}

async function getSyncRange(userId: string, full: boolean) {
  const now = Math.floor(Date.now() / 1000);
  if (full) {
    return { after: 0, before: now, backfillBefore: null as number | null };
  }
  const latest = await prisma.activity.findFirst({
    where: { userId },
    orderBy: { startDate: "desc" },
    select: { startDate: true }
  });
  const oldest = await prisma.activity.findFirst({
    where: { userId },
    orderBy: { startDate: "asc" },
    select: { startDate: true }
  });
  const after = latest
    ? Math.floor(latest.startDate.getTime() / 1000) - 14 * 24 * 60 * 60
    : now - 800 * 24 * 60 * 60;
  const backfillBefore = oldest
    ? Math.floor(oldest.startDate.getTime() / 1000) - 1
    : null;
  return { after, before: now, backfillBefore };
}

async function processActivities(params: {
  activities: Awaited<ReturnType<typeof listActivities>>;
  userId: string;
  accessToken: string;
  detailsAll: boolean;
  detailFetched: number;
  maxDetail: number;
}) {
  const { activities, userId, accessToken, detailsAll, maxDetail } = params;
  let detailFetched = params.detailFetched;
  let processedSteps = 0;
  let upserted = 0;

  for (const activity of activities) {
    const sportType = mapSportType(activity.sport_type);
    await prisma.activity.upsert({
      where: { id: String(activity.id) },
      create: {
        id: String(activity.id),
        userId,
        startDate: new Date(activity.start_date),
        timezone: activity.timezone,
        sportType,
        name: activity.name ?? null,
        distance: activity.distance,
        movingTime: activity.moving_time,
        elapsedTime: activity.elapsed_time,
        elevationGain: activity.total_elevation_gain,
        averageSpeed: activity.average_speed ?? 0,
        maxSpeed: activity.max_speed ?? 0,
        averageHeartrate: activity.average_heartrate ?? null,
        startLat: activity.start_latlng?.[0] ?? null,
        startLng: activity.start_latlng?.[1] ?? null,
        summaryPolyline: activity.map?.summary_polyline ?? null
      },
      update: {
        startDate: new Date(activity.start_date),
        timezone: activity.timezone,
        sportType,
        name: activity.name ?? null,
        distance: activity.distance,
        movingTime: activity.moving_time,
        elapsedTime: activity.elapsed_time,
        elevationGain: activity.total_elevation_gain,
        averageSpeed: activity.average_speed ?? 0,
        maxSpeed: activity.max_speed ?? 0,
        averageHeartrate: activity.average_heartrate ?? null,
        startLat: activity.start_latlng?.[0] ?? null,
        startLng: activity.start_latlng?.[1] ?? null,
        summaryPolyline: activity.map?.summary_polyline ?? null
      }
    });

    upserted += 1;
    processedSteps += 1;

    const allowDetail = detailsAll || detailFetched < maxDetail;
    if (sportType !== "RUN" || !allowDetail) continue;

    const activityId = String(activity.id);
    const cached = await prisma.effortCache.findUnique({
      where: {
        userId_activityId_kind: {
          userId,
          activityId,
          kind: BEST_EFFORT_KIND
        }
      }
    });

    if (cached) continue;

    const detail = await getActivityDetail({
      accessToken,
      activityId
    });

    if (detail.best_efforts) {
      await prisma.effortCache.upsert({
        where: {
          userId_activityId_kind: {
            userId,
            activityId,
            kind: BEST_EFFORT_KIND
          }
        },
        create: {
          userId,
          activityId,
          kind: BEST_EFFORT_KIND,
          payload: { bestEfforts: detail.best_efforts }
        },
        update: {
          payload: { bestEfforts: detail.best_efforts }
        }
      });
      detailFetched += 1;
    }
    if (detailsAll) {
      processedSteps += 1;
      await sleep(120);
    }
  }

  return { upserted, detailFetched, processedSteps };
}

async function findUncachedRunActivityIds(userId: string, limit: number) {
  if (limit <= 0) return [];
  const runs = await prisma.activity.findMany({
    where: { userId, sportType: "RUN" },
    orderBy: { startDate: "asc" },
    select: { id: true },
    take: Math.max(limit * 5, 200)
  });
  if (runs.length === 0) return [];

  const cached = await prisma.effortCache.findMany({
    where: {
      userId,
      kind: BEST_EFFORT_KIND,
      activityId: { in: runs.map((run) => run.id) }
    },
    select: { activityId: true }
  });
  const cachedSet = new Set(cached.map((entry) => entry.activityId));
  return runs
    .map((run) => run.id)
    .filter((id) => !cachedSet.has(id))
    .slice(0, limit);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
