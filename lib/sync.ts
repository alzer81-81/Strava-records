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
  const { after, before } = getSyncRange(options.full ?? false);

  let page = 1;
  const perPage = 100;
  let totalUpserted = 0;
  let detailFetched = 0;
  const maxDetail = options.maxDetail ?? 25;
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

    for (const activity of activities) {
      const sportType = mapSportType(activity.sport_type);
      await prisma.activity.upsert({
        where: { id: String(activity.id) },
        create: {
          id: String(activity.id),
          userId: user.id,
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

      totalUpserted += 1;
      processedSteps += 1;

      if (sportType === "RUN" && (detailsAll || (!(options.full ?? false) && detailFetched < maxDetail))) {
        const cached = await prisma.effortCache.findUnique({
          where: {
            userId_activityId_kind: {
              userId: user.id,
              activityId: String(activity.id),
              kind: BEST_EFFORT_KIND
            }
          }
        });

        if (!cached) {
          const detail = await getActivityDetail({
            accessToken: user.accessToken,
            activityId: String(activity.id)
          });

          if (detail.best_efforts) {
            await prisma.effortCache.upsert({
              where: {
                userId_activityId_kind: {
                  userId: user.id,
                  activityId: String(activity.id),
                  kind: BEST_EFFORT_KIND
                }
              },
              create: {
                userId: user.id,
                activityId: String(activity.id),
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
            await sleep(200);
          }
        }
        if (detailsAll) {
          processedSteps += 1;
        }
      }
      if (options.onProgress && processedSteps % 20 === 0) {
        await options.onProgress({
          phase: detailsAll ? "Fetching activities + best efforts" : "Fetching activities",
          totalSteps,
          processedSteps,
          totalActivities,
          detailFetched
        });
      }
    }

    page += 1;
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

function getSyncRange(full: boolean) {
  const now = Math.floor(Date.now() / 1000);
  if (full) {
    return { after: 0, before: now };
  }
  const days = 400;
  const after = now - days * 24 * 60 * 60;
  return { after, before: now };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
