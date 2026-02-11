import { Activity, EffortCache, SportType } from "@prisma/client";
import { FREE_DISTANCE_TARGETS, FULL_DISTANCE_TARGETS } from "./entitlements";

export type Totals = {
  totalDistance: number;
  totalMovingTime: number;
  totalElevationGain: number;
  activityCount: number;
  avgSpeed: number;
};

export function computeTotals(activities: Activity[]): Totals {
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
  const totalMovingTime = activities.reduce((sum, a) => sum + a.movingTime, 0);
  const totalElevationGain = activities.reduce((sum, a) => sum + a.elevationGain, 0);
  const activityCount = activities.length;
  const avgSpeed = totalMovingTime > 0 ? totalDistance / totalMovingTime : 0;
  return { totalDistance, totalMovingTime, totalElevationGain, activityCount, avgSpeed };
}

export function findLongestRun(activities: Activity[]) {
  return activities
    .filter((a) => a.sportType === "RUN")
    .sort((a, b) => b.distance - a.distance)[0];
}

export function findFastestAverageSpeed(activities: Activity[]) {
  return activities
    .filter((a) => a.averageSpeed > 0)
    .sort((a, b) => b.averageSpeed - a.averageSpeed)[0];
}

export function findBiggestClimb(activities: Activity[]) {
  return activities.sort((a, b) => b.elevationGain - a.elevationGain)[0];
}

type BestEffort = {
  name: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
};

export function extractBestEfforts(cache: EffortCache | null): BestEffort[] {
  if (!cache) return [];
  const payload = cache.payload as { bestEfforts?: BestEffort[] };
  return payload.bestEfforts ?? [];
}

export function selectDistanceTargets() {
  return FULL_DISTANCE_TARGETS;
}

export function mapBestEffortByDistance(bestEfforts: BestEffort[]) {
  const map = new Map<number, BestEffort>();
  for (const effort of bestEfforts) {
    const rounded = Math.round(effort.distance);
    if (!map.has(rounded) || map.get(rounded)!.elapsed_time > effort.elapsed_time) {
      map.set(rounded, effort);
    }
  }
  return map;
}

export type DistanceRecord = {
  distanceTarget: number;
  bestTimeSeconds: number;
  activityId: string;
  achievedAt: Date;
};

export function mergeDistanceRecords(
  existing: Map<number, DistanceRecord>,
  candidate: DistanceRecord
) {
  const current = existing.get(candidate.distanceTarget);
  if (!current || candidate.bestTimeSeconds < current.bestTimeSeconds) {
    existing.set(candidate.distanceTarget, candidate);
  }
}

export function resolveEffortForTarget(bestEfforts: BestEffort[], target: number) {
  const byDistance = mapBestEffortByDistance(bestEfforts);
  const exact = byDistance.get(target);
  if (exact) return exact;
  const byName = bestEfforts.find((effort) => nameMatchesTarget(effort.name, target));
  if (byName) return byName;
  return null;
}

function nameMatchesTarget(name: string, target: number) {
  const normalized = name.toLowerCase();
  const targetMap: Record<number, string[]> = {
    400: ["400m"],
    805: ["1/2 mile", "half mile", "0.5 mile"],
    1000: ["1k", "1 km", "1000m"],
    1609: ["1 mile", "mile"],
    3219: ["2 mile", "2 miles"],
    5000: ["5k", "5 km"],
    10000: ["10k", "10 km"],
    15000: ["15k", "15 km"],
    16093: ["10 mile", "10 miles"],
    20000: ["20k", "20 km"],
    21097: ["half", "half marathon", "hm"],
    42195: ["marathon"]
  };
  const labels = targetMap[target] || [];
  return labels.some((label) => normalized.includes(label));
}

export function sportKey(sportType: SportType) {
  return sportType === "RUN" ? "run" : sportType === "RIDE" ? "ride" : "other";
}
