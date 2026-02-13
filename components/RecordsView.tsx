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


  const records = await prisma.record.findMany({
    where: {
      userId,
      windowType: windowType,
      windowKey: key,
      sportType: "RUN"
    }
  });
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

  const activitiesForTimeOfDay = await prisma.activity.findMany({
    where: {
      userId,
      startDate: { gte: start, lt: end }
    },
    select: { startDate: true }
  });
  const timeOfDay = buildTimeOfDayData(activitiesForTimeOfDay.map((activity) => activity.startDate));

  const hrValues = await prisma.activity.findMany({
    where: {
      userId,
      sportType: "RUN",
      startDate: { gte: start, lt: end },
      averageHeartrate: { not: null }
    },
    select: { averageHeartrate: true }
  });
  const avgHeartrate = averageHeartRate(hrValues);

  const targets = selectDistanceTargets();

  return (
    <div className="flex flex-col gap-6 text-black">
      <AutoSync enabled />
      <section className="px-1 py-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold text-black md:text-4xl">Your Best Efforts</h1>
        </div>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-card md:p-6">
        <h3 className="text-2xl font-semibold md:text-3xl">Total</h3>
        <div className="mt-4 grid grid-cols-2 gap-4 md:mt-6 md:grid-cols-5">
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
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 md:text-xs">Avg HR</p>
            <p className="mt-2 text-2xl font-semibold text-black md:text-4xl">
              {avgHeartrate ? `${Math.round(avgHeartrate)} bpm` : "--"}
            </p>
          </div>
        </div>
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
            return record ? (
              <a
                key={target}
                href={`https://www.strava.com/activities/${record.activityId}`}
                target="_blank"
                rel="noreferrer"
                className="group block rounded-lg border border-black/10 bg-white px-3 py-2 shadow-sm transition-transform duration-150 hover:scale-[1.01] hover:border-black/20"
              >
                <div className="flex items-center gap-3">
                  <MapPreview polyline={recordActivity?.summaryPolyline ?? null} label="Route" compact />
                  <div className="flex flex-1 items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2 text-lg font-semibold text-black">
                      <span>{formatTarget(target)}</span>
                      <span className="text-slate-400">:</span>
                      <span>{formatTime(record.bestTimeSeconds)}</span>
                    </div>
                    <span className="text-sm font-semibold text-amber-600">View activity</span>
                  </div>
                </div>
              </a>
            ) : (
              <div key={target} className="rounded-lg border border-black/10 bg-white px-3 py-2 shadow-sm">
                <div className="flex items-center gap-3">
                  <MapPreview polyline={recordActivity?.summaryPolyline ?? null} label="Route" compact />
                  <div className="flex flex-1 items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2 text-lg font-semibold text-black">
                      <span>{formatTarget(target)}</span>
                      <span className="text-slate-400">:</span>
                      <span className="text-slate-500">No record yet</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold md:text-3xl">Activity by Time of Day</h3>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-4 sm:grid-cols-2">
          {timeOfDay.summary.map((bucket) => (
            <div key={bucket.label} className="rounded-lg border border-black/10 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{bucket.label}</p>
              <p className="mt-2 text-sm text-slate-500">{bucket.range}</p>
              <p className="mt-3 text-3xl font-semibold text-black">{bucket.count}</p>
              <p className="text-xs text-slate-500">Activities</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-4 md:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">24-Hour Activity Count</p>
          </div>
          <div className="mt-4 flex max-h-[300px] flex-col gap-2 overflow-y-auto pr-1" aria-label="24-hour activity count chart">
            {timeOfDay.hours.map((count, hour) => {
              const widthPercent = Math.max(4, Math.round((count / timeOfDay.max) * 100));
              const label = `${count} activities at ${formatHourLabel(hour)}`;
              return (
                <div key={hour} className="grid grid-cols-[42px_1fr_36px] items-center gap-2">
                  <span className="text-[11px] text-slate-500">{formatHourLabel(hour)}</span>
                  <div
                    role="button"
                    tabIndex={0}
                    title={label}
                    aria-label={label}
                    className="h-3 rounded-sm bg-black/90 transition-colors hover:bg-black"
                    style={{ width: `${widthPercent}%` }}
                  />
                  <span className="text-right text-[11px] text-slate-500">{count}</span>
                </div>
              );
            })}
          </div>
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

function averageHeartRate(values: { averageHeartrate: number | null }[]) {
  const filtered = values.map((item) => item.averageHeartrate).filter((value): value is number => value !== null);
  if (filtered.length === 0) return null;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function buildTimeOfDayData(dates: Date[]) {
  const hours = new Array(24).fill(0);
  dates.forEach((date) => {
    const hour = date.getHours();
    hours[hour] += 1;
  });

  const summary = [
    { label: "Early Morning", range: "12AM–6AM", count: sumRange(hours, 0, 6) },
    { label: "Morning", range: "6AM–12PM", count: sumRange(hours, 6, 12) },
    { label: "Afternoon", range: "12PM–6PM", count: sumRange(hours, 12, 18) },
    { label: "Evening", range: "6PM–12AM", count: sumRange(hours, 18, 24) }
  ];

  const max = Math.max(1, ...hours);
  return { hours, summary, max };
}

function sumRange(values: number[], start: number, end: number) {
  return values.slice(start, end).reduce((sum, value) => sum + value, 0);
}

function formatHourLabel(hour: number) {
  if (hour === 0) return "12AM";
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return "12PM";
  return `${hour - 12}PM`;
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
