import { PeriodType, SportType } from "@prisma/client";
import { prisma } from "./db";
import { computeTotals, extractBestEfforts, mergeDistanceRecords, resolveEffortForTarget, selectDistanceTargets } from "./analytics";
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
  const bestActivityIds = {
    longestRunId: activities.sort((a, b) => b.distance - a.distance)[0]?.id ?? null,
    fastestAvgId: activities.sort((a, b) => b.averageSpeed - a.averageSpeed)[0]?.id ?? null,
    biggestClimbId: activities.sort((a, b) => b.elevationGain - a.elevationGain)[0]?.id ?? null
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
  const targetDistances = selectDistanceTargets(plan);

  const recordMap = new Map<number, { distanceTarget: number; bestTimeSeconds: number; activityId: string; achievedAt: Date }>();

  for (const activity of activities) {
    const cache = cacheByActivity.get(activity.id) ?? null;
    const efforts = extractBestEfforts(cache);

    for (const target of targetDistances) {
      const effort = resolveEffortForTarget(efforts, target);
      if (!effort) continue;
      mergeDistanceRecords(recordMap, {
        distanceTarget: target,
        bestTimeSeconds: effort.elapsed_time,
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
