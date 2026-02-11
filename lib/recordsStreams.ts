import { prisma } from "./db";
import { getActivityStreams } from "./strava";
import { mergeDistanceRecords } from "./analytics";
import { FULL_DISTANCE_TARGETS } from "./entitlements";

export async function computeAllTimeRecordsFromStreams(params: {
  userId: string;
  accessToken: string;
  limit?: number;
  onProgress?: (progress: { processed: number; total: number }) => Promise<void>;
}) {
  const { userId, accessToken, onProgress, limit } = params;
  const activities = await prisma.activity.findMany({
    where: { userId, sportType: "RUN" },
    orderBy: { startDate: "desc" },
    take: limit
  });

  const recordMap = new Map<number, { distanceTarget: number; bestTimeSeconds: number; activityId: string; achievedAt: Date }>();
  let processed = 0;
  const total = activities.length;

  for (const activity of activities) {
    const streams = await getActivityStreams({
      accessToken,
      activityId: activity.id,
      keys: ["distance", "time"]
    });

    if (!streams.distance?.length || !streams.time?.length) {
      processed += 1;
      if (onProgress && processed % 10 === 0) {
        await onProgress({ processed, total });
      }
      continue;
    }

    for (const target of FULL_DISTANCE_TARGETS) {
      const best = bestEffortFromStreams(streams.distance, streams.time, target);
      if (best === null) continue;
      mergeDistanceRecords(recordMap, {
        distanceTarget: target,
        bestTimeSeconds: best,
        activityId: activity.id,
        achievedAt: activity.startDate
      });
    }

    processed += 1;
    if (onProgress && processed % 10 === 0) {
      await onProgress({ processed, total });
    }

    await sleep(200);
  }

  for (const record of recordMap.values()) {
    await prisma.record.upsert({
      where: {
        userId_windowType_windowKey_sportType_distanceTarget: {
          userId,
          windowType: "ALL_TIME",
          windowKey: "all-time",
          sportType: "RUN",
          distanceTarget: record.distanceTarget
        }
      },
      create: {
        userId,
        windowType: "ALL_TIME",
        windowKey: "all-time",
        sportType: "RUN",
        distanceTarget: record.distanceTarget,
        bestTimeSeconds: record.bestTimeSeconds,
        activityId: record.activityId,
        achievedAt: record.achievedAt
      },
      update: {
        bestTimeSeconds: record.bestTimeSeconds,
        activityId: record.activityId,
        achievedAt: record.achievedAt
      }
    });
  }
}

export function bestEffortFromStreams(distance: number[], time: number[], targetMeters: number) {
  if (distance.length < 2 || time.length < 2) return null;
  let best = Infinity;
  let j = 0;

  for (let i = 0; i < distance.length; i += 1) {
    if (j < i) j = i;
    const startDist = distance[i];
    const startTime = time[i];

    while (j < distance.length && distance[j] - startDist < targetMeters) {
      j += 1;
    }
    if (j >= distance.length) break;

    const d1 = distance[j - 1];
    const t1 = time[j - 1];
    const d2 = distance[j];
    const t2 = time[j];
    if (d2 === d1) continue;

    const targetDist = startDist + targetMeters;
    const ratio = (targetDist - d1) / (d2 - d1);
    const targetTime = t1 + ratio * (t2 - t1);
    const elapsed = targetTime - startTime;

    if (elapsed > 0 && elapsed < best) best = elapsed;
  }

  return Number.isFinite(best) ? Math.round(best) : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
