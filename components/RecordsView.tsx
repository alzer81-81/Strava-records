import Link from "next/link";
import { prisma } from "../lib/db";
import { getWindowRange, WindowType } from "../lib/time";
import { selectDistanceTargets } from "../lib/analytics";
import { MapPreview } from "./MapPreview";
import { AutoSync } from "./AutoSync";

export async function RecordsView({
  userId,
  windowParam
}: {
  userId: string;
  windowParam?: string;
}) {
  const windowType = normalizeWindow(windowParam);
  const now = new Date();
  const { start, end, key } = getWindowRange(windowType, now);

  const summary = await prisma.periodSummary.findFirst({
    where: {
      userId,
      periodType: windowType,
      periodKey: key,
      sportType: "RUN"
    }
  });
  const totals = getTotals(summary?.totals);
  const bestIds = getBestIds(summary?.bestActivityIds);

  const prevRange = windowType === "ALL_TIME"
    ? null
    : getWindowRange(windowType, new Date(start.getTime() - 1));
  const prevSummary = prevRange
    ? await prisma.periodSummary.findFirst({
      where: {
        userId,
        periodType: windowType,
        periodKey: prevRange.key,
        sportType: "RUN"
      }
    })
    : null;
  const prevTotals = getTotals(prevSummary?.totals);

  const records = await prisma.record.findMany({
    where: {
      userId,
      windowType: windowType,
      windowKey: key,
      sportType: "RUN"
    }
  });
  const prevRecords = prevRange
    ? await prisma.record.findMany({
      where: {
        userId,
        windowType,
        windowKey: prevRange.key,
        sportType: "RUN"
      }
    })
    : [];
  const recordActivities = await prisma.activity.findMany({
    where: {
      id: { in: records.map((r) => r.activityId) }
    },
    select: { id: true, summaryPolyline: true }
  });
  const activitiesById = new Map(recordActivities.map((activity) => [activity.id, activity]));

  const longestRun = await prisma.activity.findFirst({
    where: {
      userId,
      sportType: "RUN",
      startDate: { gte: start, lt: end }
    },
    orderBy: { distance: "desc" }
  });


  const fastestAvg = bestIds.fastestAvgId
    ? await prisma.activity.findUnique({ where: { id: bestIds.fastestAvgId } })
    : null;
  const biggestClimb = bestIds.biggestClimbId
    ? await prisma.activity.findUnique({ where: { id: bestIds.biggestClimbId } })
    : null;

  const targets = selectDistanceTargets();
  const hasAnyData = records.length > 0 || totals.activityCount > 0 || !!longestRun;

  return (
    <div className="flex flex-col gap-6 text-black">
      <AutoSync enabled />
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold md:text-5xl">Your Best Efforts</h1>
        </div>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-card md:p-6">
        <h3 className="text-2xl font-semibold md:text-3xl">Total</h3>
        <div className="mt-4 grid grid-cols-2 gap-4 md:mt-6 md:grid-cols-4">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 md:text-xs">Distance</p>
            <p className="mt-2 text-2xl font-semibold text-black md:text-4xl">{formatKm(totals.totalDistance)} km</p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 md:text-xs">Moving Time</p>
            <p className="mt-2 text-2xl font-semibold text-black md:text-4xl">{formatTime(totals.totalMovingTime)}</p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 md:text-xs">Elevation</p>
            <p className="mt-2 text-2xl font-semibold text-black md:text-4xl">{Math.round(totals.totalElevationGain)} m</p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 md:text-xs">Activities</p>
            <p className="mt-2 text-2xl font-semibold text-black md:text-4xl">{totals.activityCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold md:text-3xl">Trend vs Last Month</h3>
        </div>
        {!prevSummary ? (
          <p className="mt-4 text-sm text-slate-500">No previous data available.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TrendCard
              label="Total Distance"
              current={`${formatKm(totals.totalDistance)} km`}
              previous={`${formatKm(prevTotals.totalDistance)} km`}
              change={percentChange(totals.totalDistance, prevTotals.totalDistance)}
              betterDirection="up"
            />
            <TrendCard
              label="Average Pace"
              current={formatPaceFromTotals(totals)}
              previous={formatPaceFromTotals(prevTotals)}
              change={paceChangeSeconds(totals, prevTotals)}
              betterDirection="up"
              changeSuffix="/km"
              isTimeDiff
            />
            <TrendCard
              label="Total Elevation"
              current={`${Math.round(totals.totalElevationGain)} m`}
              previous={`${Math.round(prevTotals.totalElevationGain)} m`}
              change={percentChange(totals.totalElevationGain, prevTotals.totalElevationGain)}
              betterDirection="up"
            />
            <div className="rounded-lg border border-black/10 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Key Distance Improvements</p>
              <div className="mt-3 grid gap-3">
                {[1000, 5000, 10000].map((target) => {
                  const current = records.find((r) => r.distanceTarget === target);
                  const previous = prevRecords.find((r) => r.distanceTarget === target);
                  const improvement = current && previous
                    ? ((previous.bestTimeSeconds - current.bestTimeSeconds) / previous.bestTimeSeconds) * 100
                    : null;
                  const isNewPr = current && previous && current.bestTimeSeconds < previous.bestTimeSeconds;
                  return (
                    <div key={target} className="flex items-center justify-between rounded-md bg-[#f8f8f8] px-3 py-2 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{formatTarget(target)}</p>
                        <p className="text-sm font-semibold text-black">
                          {current ? formatTime(current.bestTimeSeconds) : "--"}
                          {isNewPr ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">New PR 🎉</span> : null}
                        </p>
                      </div>
                      <div className={`text-right text-xs ${trendColor(improvement, "up")}`}>
                        {improvement === null ? "0%" : `${formatPct(improvement)}%`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-card">
          <h3 className="text-lg font-semibold">Longest Run</h3>
          {longestRun ? (
            <div className="mt-3 text-sm text-slate-600">
              <p className="text-base font-semibold text-black">{longestRun.name ?? "Run"}</p>
              <p>{formatDate(longestRun.startDate)} • {formatKm(longestRun.distance)} km</p>
              <p>Moving: {formatTime(longestRun.movingTime)} • Pace: {formatPace(longestRun)} • Elev: {Math.round(longestRun.elevationGain)} m</p>
              <MapPreview polyline={longestRun.summaryPolyline} label="Route" />
              <a
                href={`https://www.strava.com/activities/${longestRun.id}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-amber-600"
              >
                View on Strava
              </a>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No runs in this window yet.</p>
          )}
        </div>
        <div className="rounded-lg bg-white p-6 shadow-card">
          <h3 className="text-lg font-semibold">Fastest Avg Speed</h3>
          {fastestAvg ? (
            <div className="mt-3 text-sm text-slate-600">
              <p className="text-base font-semibold text-black">{fastestAvg.name ?? "Run"}</p>
              <p>{formatDate(fastestAvg.startDate)} • {formatKm(fastestAvg.distance)} km</p>
              <p>Avg speed: {formatSpeed(fastestAvg.averageSpeed)}</p>
              <MapPreview polyline={fastestAvg.summaryPolyline} label="Route" />
              <a
                href={`https://www.strava.com/activities/${fastestAvg.id}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-amber-600"
              >
                View on Strava
              </a>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No data yet.</p>
          )}
        </div>
        <div className="rounded-lg bg-white p-6 shadow-card">
          <h3 className="text-lg font-semibold">Biggest Climb</h3>
          {biggestClimb ? (
            <div className="mt-3 text-sm text-slate-600">
              <p className="text-base font-semibold text-black">{biggestClimb.name ?? "Run"}</p>
              <p>{formatDate(biggestClimb.startDate)} • {formatKm(biggestClimb.distance)} km</p>
              <p>Elevation: {Math.round(biggestClimb.elevationGain)} m</p>
              <MapPreview polyline={biggestClimb.summaryPolyline} label="Route" />
              <a
                href={`https://www.strava.com/activities/${biggestClimb.id}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-amber-600"
              >
                View on Strava
              </a>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No data yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-semibold">Distance Records</h3>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {targets.map((target) => {
            const record = records.find((r) => r.distanceTarget === target);
            const recordActivity = record
              ? activitiesById.get(record.activityId) ?? null
              : null;
            return (
              <div key={target} className="rounded-lg border border-black/10 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <MapPreview polyline={recordActivity?.summaryPolyline ?? null} label="Route" compact />
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">{formatTarget(target)}</p>
                    {record ? (
                      <div className="mt-1 text-sm">
                        <p className="text-lg font-semibold text-black">{formatTime(record.bestTimeSeconds)}</p>
                        <a
                          href={`https://www.strava.com/activities/${record.activityId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-600"
                        >
                          View activity
                        </a>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-slate-500">No record yet</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>


    </div>
  );
}

function normalizeWindow(value?: string): WindowType {
  if (!value) return "MONTH";
  const upper = value.toUpperCase();
  if (["WEEK", "MONTH", "LAST_2M", "LAST_6M", "YEAR", "ALL_TIME"].includes(upper)) {
    return upper as WindowType;
  }
  return "MONTH";
}

const WINDOW_LABELS: Record<WindowType, string> = {
  WEEK: "This Week",
  MONTH: "This Month",
  LAST_2M: "2 Months",
  LAST_6M: "6 Months",
  YEAR: "This Year",
  LAST_YEAR: "Last Year",
  ALL_TIME: "All Time",
};

function labelWindow(value: WindowType) {
  return WINDOW_LABELS[value];
}

function formatKm(distanceMeters: number) {
  return (distanceMeters / 1000).toFixed(1);
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  const remSecs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}h ${remMins}m`;
  return `${remMins}m ${String(remSecs).padStart(2, "0")}s`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatTarget(distance: number) {
  if (distance === 805) return "1/2 mile";
  if (distance === 1609) return "1 mile";
  if (distance === 3219) return "2 mile";
  if (distance === 15000) return "15 km";
  if (distance === 16093) return "10 mile";
  if (distance === 20000) return "20 km";
  if (distance === 21097) return "Half Marathon";
  if (distance === 42195) return "Marathon";
  if (distance >= 1000) return `${distance / 1000} km`;
  return `${distance} m`;
}


function getTotals(value: unknown) {
  const fallback = {
    totalDistance: 0,
    totalMovingTime: 0,
    totalElevationGain: 0,
    activityCount: 0,
    avgSpeed: 0
  };
  if (!value || typeof value !== "object") return fallback;
  return { ...fallback, ...(value as Record<string, number>) };
}

function getBestIds(value: unknown) {
  const fallback = {
    longestRunId: null as string | null,
    fastestAvgId: null as string | null,
    biggestClimbId: null as string | null
  };
  if (!value || typeof value !== "object") return fallback;
  return { ...fallback, ...(value as Record<string, string | null>) };
}

function TrendCard({
  label,
  current,
  previous,
  change,
  betterDirection,
  changeSuffix,
  isTimeDiff
}: {
  label: string;
  current: string;
  previous: string;
  change: number | null;
  betterDirection: "up" | "down";
  changeSuffix?: string;
  isTimeDiff?: boolean;
}) {
  const direction = trendDirection(change, betterDirection);
  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "–";
  const value = isTimeDiff ? formatTimeDiff(change ?? 0) : change !== null ? `${formatPct(change)}%` : "0%";
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-black">{current}</p>
      <p className="text-xs text-slate-500">Prev: {previous}</p>
      <div className={`mt-3 flex items-center justify-end gap-2 text-sm font-semibold ${trendColor(change, betterDirection)}`}>
        <span>{arrow}</span>
        <span>{value}{changeSuffix ?? ""}</span>
      </div>
    </div>
  );
}

function formatSpeed(speedMetersPerSecond: number) {
  const kmh = speedMetersPerSecond * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

function formatPace(activity: { distance: number; movingTime: number }) {
  if (activity.distance <= 0 || activity.movingTime <= 0) return "--";
  const paceSecondsPerKm = activity.movingTime / (activity.distance / 1000);
  const mins = Math.floor(paceSecondsPerKm / 60);
  const secs = Math.round(paceSecondsPerKm % 60);
  return `${mins}:${String(secs).padStart(2, "0")} /km`;
}

function formatPaceFromTotals(totals: { totalDistance: number; totalMovingTime: number }) {
  if (totals.totalDistance <= 0 || totals.totalMovingTime <= 0) return "--";
  const paceSecondsPerKm = totals.totalMovingTime / (totals.totalDistance / 1000);
  const mins = Math.floor(paceSecondsPerKm / 60);
  const secs = Math.round(paceSecondsPerKm % 60);
  return `${mins}:${String(secs).padStart(2, "0")} /km`;
}

function percentChange(current: number, previous: number) {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function paceChangeSeconds(
  current: { totalDistance: number; totalMovingTime: number },
  previous: { totalDistance: number; totalMovingTime: number }
) {
  if (current.totalDistance <= 0 || previous.totalDistance <= 0) return null;
  const curr = current.totalMovingTime / (current.totalDistance / 1000);
  const prev = previous.totalMovingTime / (previous.totalDistance / 1000);
  return prev - curr;
}

function formatTimeDiff(seconds: number) {
  const sign = seconds > 0 ? "-" : seconds < 0 ? "+" : "";
  const abs = Math.abs(seconds);
  const mins = Math.floor(abs / 60);
  const secs = Math.round(abs % 60);
  if (mins > 0) return `${sign}${mins}m ${String(secs).padStart(2, "0")}s`;
  return `${sign}${secs}s`;
}

function trendDirection(change: number | null, betterDirection: "up" | "down") {
  if (change === null || change === 0) return "neutral";
  if (betterDirection === "up") return change > 0 ? "up" : "down";
  return change > 0 ? "down" : "up";
}

function trendColor(change: number | null, betterDirection: "up" | "down") {
  const direction = trendDirection(change, betterDirection);
  if (direction === "up") return "text-emerald-600";
  if (direction === "down") return "text-red-600";
  return "text-slate-500";
}

function formatPct(value: number) {
  return Math.abs(value).toFixed(0);
}
