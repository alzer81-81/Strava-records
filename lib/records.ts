import { PeriodType, SportType } from "@prisma/client";
import { prisma } from "./db";
import {
  computeTotals,
  estimateFromLongerEffort,
  extractBestEfforts,
  mergeDistanceRecords,
  resolveEffortForTarget,
  selectDistanceTargets
} from "./analytics";
import { WindowType } from "./time";

export async function recomputeWindow(params: {
  userId: string;
  windowType: WindowType;
  windowKey: string;
  start: Date;
  end: Date;
  sportType: SportType;
  plan: "FREE" | "PRO";
}) {
  const { userId, windowType, windowKey, start, end, sportType, plan } = params;

  const activities = await prisma.activity.findMany({
    where: {
      userId,
      sportType,
      startDate: { gte: start, lt: end }
    },
    orderBy: { startDate: "desc" }
  });

  const totals = computeTotals(activities);
  const byFastestPace = [...activities].sort((a, b) => paceSecondsPerKm(a) - paceSecondsPerKm(b));
  const bestActivityIds = {
    longestRunId: [...activities].sort((a, b) => b.distance - a.distance)[0]?.id ?? null,
    fastestAvgId: byFastestPace[0]?.id ?? null,
    biggestClimbId: [...activities].sort((a, b) => b.elevationGain - a.elevationGain)[0]?.id ?? null
  };

  await prisma.periodSummary.upsert({
    where: {
      userId_periodType_periodKey_sportType: {
        userId,
        periodType: windowType as PeriodType,
        periodKey: windowKey,
        sportType
      }
    },
    create: {
      userId,
      periodType: windowType as PeriodType,
      periodKey: windowKey,
      sportType,
      totals,
      avgSpeed: totals.avgSpeed,
      bestActivityIds
    },
    update: {
      totals,
      avgSpeed: totals.avgSpeed,
      bestActivityIds
    }
  });

  if (sportType !== "RUN") return { totals };

  const caches = await prisma.effortCache.findMany({
    where: {
      userId,
      activityId: { in: activities.map((a) => a.id) },
      kind: "best_effort"
    }
  });

  const cacheByActivity = new Map(caches.map((cache) => [cache.activityId, cache]));
  const targetDistances = selectDistanceTargets();

  const recordMap = new Map<number, { distanceTarget: number; bestTimeSeconds: number; activityId: string; achievedAt: Date }>();

  for (const activity of activities) {
    const cache = cacheByActivity.get(activity.id) ?? null;
    const efforts = extractBestEfforts(cache);

    for (const target of targetDistances) {
      const effort = resolveEffortForTarget(efforts, target);
      if (effort) {
        mergeDistanceRecords(recordMap, {
          distanceTarget: target,
          bestTimeSeconds: effort.elapsed_time,
          activityId: activity.id,
          achievedAt: activity.startDate
        });
        continue;
      }

      const derivedFromEffort = estimateFromLongerEffort(efforts, target);
      if (derivedFromEffort) {
        mergeDistanceRecords(recordMap, {
          distanceTarget: target,
          bestTimeSeconds: derivedFromEffort,
          activityId: activity.id,
          achievedAt: activity.startDate
        });
        continue;
      }

      // Fallback when Strava best_efforts are not cached:
      // use full-run moving time if activity distance closely matches the target.
      const estimatedTime = estimateFromActivityDistance(activity.distance, activity.movingTime, target);
      if (!estimatedTime) continue;
      mergeDistanceRecords(recordMap, {
        distanceTarget: target,
        bestTimeSeconds: estimatedTime,
        activityId: activity.id,
        achievedAt: activity.startDate
      });
    }
  }

  for (const record of recordMap.values()) {
    await prisma.record.upsert({
      where: {
        userId_windowType_windowKey_sportType_distanceTarget: {
          userId,
          windowType: windowType as PeriodType,
          windowKey,
          sportType,
          distanceTarget: record.distanceTarget
        }
      },
      create: {
        userId,
        windowType: windowType as PeriodType,
        windowKey,
        sportType,
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

  return { totals };
}

function paceSecondsPerKm(activity: { distance: number; movingTime: number; averageSpeed: number }) {
  if (activity.distance > 0 && activity.movingTime > 0) {
    return activity.movingTime / (activity.distance / 1000);
  }
  if (activity.averageSpeed > 0) {
    return 1000 / activity.averageSpeed;
  }
  return Number.POSITIVE_INFINITY;
}

function estimateFromActivityDistance(distanceMeters: number, movingTimeSeconds: number, targetMeters: number) {
  if (distanceMeters <= 0 || movingTimeSeconds <= 0) return null;
  if (targetMeters <= 10000) {
    const tolerance = distanceTolerance(targetMeters);
    if (Math.abs(distanceMeters - targetMeters) > tolerance) return null;
  } else {
    if (distanceMeters < targetMeters) return null;
    if (distanceMeters > targetMeters * 1.25) return null;
  }
  return Math.round(movingTimeSeconds * (targetMeters / distanceMeters));
}

function distanceTolerance(targetMeters: number) {
  if (targetMeters <= 400) return 40;
  if (targetMeters <= 1000) return 90;
  if (targetMeters <= 5000) return 220;
  if (targetMeters <= 10000) return 380;
  if (targetMeters <= 21097) return 650;
  return 1200;
}
