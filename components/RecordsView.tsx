import { prisma } from "../lib/db";
import { getWindowRange, WindowType } from "../lib/time";
import { extractBestEfforts, mergeDistanceRecords, resolveEffortForTarget, selectDistanceTargets } from "../lib/analytics";
import { MapPreview } from "./MapPreview";
import { AutoSync } from "./AutoSync";
import { AnimatedNumber } from "./AnimatedNumber";
import { TopTenModal } from "./TopTenModal";
import { FastestRunByDistance } from "./FastestRunByDistance";
import { BestTimesGroupedList, type PRRecord } from "./BestTimesGroupedList";
import { DistanceChart } from "./DistanceChart";
import { cookies } from "next/headers";

type DistanceUnit = "km" | "mi";

export async function RecordsView({
  userId,
  windowParam
}: {
  userId: string;
  windowParam?: string;
}) {
  const distanceUnit = getDistanceUnitPreference();
  const windowType = normalizeWindow(windowParam);
  const now = new Date();
  const { start, end, key } = getWindowRange(windowType, now);
  const earliestActivity = await prisma.activity.findFirst({
    where: { userId },
    orderBy: { startDate: "asc" },
    select: { startDate: true }
  });
  const displayedRange = formatWindowRange(windowType, start, end, earliestActivity?.startDate ?? null);
  const displayedRangeMobile = formatWindowRange(windowType, start, end, earliestActivity?.startDate ?? null, true);
  const windowTitle = getWindowTitle(windowType);
  const usesPeriodSummary = windowType !== "LAST_365";

  const summary = usesPeriodSummary
    ? await prisma.periodSummary.findFirst({
        where: {
          userId,
          periodType: windowType,
          periodKey: key,
          sportType: "RUN"
        }
      })
    : null;

  const runActivities = await prisma.activity.findMany({
    where: {
      userId,
      sportType: "RUN",
      startDate: { gte: start, lt: end }
    },
    orderBy: { startDate: "desc" }
  });
  const totals = summary ? getTotals(summary?.totals) : computeRunTotals(runActivities);

  const longestRunsTop10 = [...runActivities].sort((a, b) => b.distance - a.distance).slice(0, 10);
  const longestRuns = longestRunsTop10.slice(0, 3);

  const runsForFastest = runActivities.filter((run) => run.distance > 0 && run.movingTime > 0);

  const effortCaches = await prisma.effortCache.findMany({
    where: {
      userId,
      activityId: { in: runsForFastest.map((run) => run.id) },
      kind: "best_effort"
    }
  });
  const cacheByActivity = new Map(effortCaches.map((cache) => [cache.activityId, cache]));
  const fastestDistanceGroups = [
    { key: "1000", label: "1K", targetMeters: 1000, toleranceMeters: 120 },
    { key: "5000", label: "5K", targetMeters: 5000, toleranceMeters: 320 },
    { key: "10000", label: "10K", targetMeters: 10000, toleranceMeters: 500 },
    { key: "21097", label: "HM", targetMeters: 21097, toleranceMeters: 900 },
    { key: "42195", label: "M", targetMeters: 42195, toleranceMeters: 1800 }
  ] as const;

  const fastestRunsByDistance = fastestDistanceGroups.map((group) => {
    const candidates = runsForFastest
      .map((run) => {
        const cache = cacheByActivity.get(run.id) ?? null;
        const efforts = extractBestEfforts(cache);
        const effort = resolveEffortForTarget(efforts, group.targetMeters);
        if (effort) {
          return {
            id: run.id,
            startDate: run.startDate,
            name: run.name ?? "Run",
            summaryPolyline: run.summaryPolyline ?? null,
            bestTimeSeconds: effort.elapsed_time
          };
        }

        const estimatedTime = estimateFromActivityDistance(run.distance, run.movingTime, group.targetMeters);
        if (!estimatedTime) return null;
        return {
          id: run.id,
          startDate: run.startDate,
          name: run.name ?? "Run",
          summaryPolyline: run.summaryPolyline ?? null,
          bestTimeSeconds: estimatedTime
        };
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
      .sort((a, b) => a.bestTimeSeconds - b.bestTimeSeconds)
      .slice(0, 10);

    const runs = candidates.map((run) => ({
      id: run.id,
      date: formatDate(run.startDate),
      name: run.name,
      distance: formatTargetDistance(group.targetMeters),
      pace: formatPaceForTarget(run.bestTimeSeconds, group.targetMeters, distanceUnit),
      time: formatTime(run.bestTimeSeconds),
      summaryPolyline: run.summaryPolyline
    }));

    return {
      key: group.key,
      label: group.label,
      runs
    };
  });

  const timeOfDay = buildTimeOfDayData(runActivities.map((activity) => activity.startDate));
  const avgHeartrate = averageHeartRate(
    runActivities.map((activity) => ({
      averageHeartrate: activity.averageHeartrate
    }))
  );
  const avgDistance = totals.activityCount > 0 ? metersToUnit(totals.totalDistance / totals.activityCount, distanceUnit) : 0;
  const avgPace = formatAveragePace(totals.totalDistance, totals.totalMovingTime, distanceUnit);
  const distanceChartPoints = buildDistanceChartPoints(runsForFastest, windowType, start, end);

  const targets = selectDistanceTargets();
  const recordsByDistance = new Map<number, { distanceTarget: number; bestTimeSeconds: number; activityId: string; achievedAt: Date }>();

  for (const run of runsForFastest) {
    const cache = cacheByActivity.get(run.id) ?? null;
    const efforts = extractBestEfforts(cache);
    for (const target of targets) {
      const effort = resolveEffortForTarget(efforts, target);
      if (effort && isEffortUsableForTarget(run.distance, target)) {
        mergeDistanceRecords(recordsByDistance, {
          distanceTarget: target,
          bestTimeSeconds: effort.elapsed_time,
          activityId: run.id,
          achievedAt: run.startDate
        });
        continue;
      }
      const estimatedTime = estimateFromActivityDistance(run.distance, run.movingTime, target);
      if (!estimatedTime) continue;
      mergeDistanceRecords(recordsByDistance, {
        distanceTarget: target,
        bestTimeSeconds: estimatedTime,
        activityId: run.id,
        achievedAt: run.startDate
      });
    }
  }

  const prRecords: PRRecord[] = targets.map((target) => {
    const record = recordsByDistance.get(target);
    return {
      id: `pr-${target}`,
      distanceKey: distanceKeyFromMeters(target),
      distanceLabel: formatTarget(target),
      distanceMeters: target,
      bestTimeSeconds: record?.bestTimeSeconds ?? null,
      activityId: record?.activityId,
      achievedAt: record?.achievedAt?.toISOString()
    };
  });

  return (
    <div className="flex flex-col gap-0 text-black">
      <AutoSync enabled />

      <section className="-mx-[max(1.5rem,calc((100vw-72rem)/2))] bg-[#0F8CD2] px-[max(1.5rem,calc((100vw-72rem)/2))] pb-20 pt-6 md:pb-24 md:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-[var(--font-fraunces)] text-2xl font-extrabold tracking-tight text-white md:text-4xl">{windowTitle}</h1>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/90 md:text-sm">
            <span className="md:hidden">{displayedRangeMobile}</span>
            <span className="hidden md:inline">{displayedRange}</span>
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <TopStatCard value={totals.activityCount} label="Activities" />
          <TopStatCard display={formatDistanceWithUnit(totals.totalDistance, distanceUnit, 1)} label={`Total Distance (${distanceUnit})`} />
          <TopStatCard value={avgDistance} decimals={1} label={`Avg Distance (${distanceUnit})`} />
          <TopStatCard value={Math.round(totals.totalElevationGain)} label="Elevation (m)" />
          <TopStatCard display={avgPace} label={`Avg Pace (/${distanceUnit})`} />
          <TopStatCard value={avgHeartrate ? Math.round(avgHeartrate) : null} label="Average HR" />
        </div>
      </section>

      <div className="-mx-[max(1.5rem,calc((100vw-72rem)/2))] bg-[#F6F6F6] px-[max(1.5rem,calc((100vw-72rem)/2))] py-7 md:py-8">
      <div className="-mt-32 md:-mt-36">
        <DistanceChart points={distanceChartPoints} scopeLabel={windowTitle} />
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="pt-5 text-xl font-extrabold tracking-tight text-black md:text-2xl">Longest Run</h3>
          <TopTenModal
            title="Longest Run"
            rows={longestRunsTop10.map((run, index) => ({
              rank: rankLabel(index),
              date: formatDate(run.startDate),
              name: run.name ?? "Run",
              distance: formatDistanceWithUnit(run.distance, distanceUnit),
              pace: formatPaceForActivity(run, distanceUnit),
              time: formatTime(run.movingTime),
              url: `https://www.strava.com/activities/${run.id}`
            }))}
          />
        </div>
        {longestRuns.length > 0 ? (
          <div className="-mx-6 mt-4 overflow-x-auto pb-2 pl-6 pr-2 md:mx-0 md:pl-0 md:pr-0">
            <div className="flex gap-3 px-0 md:grid md:grid-cols-3 md:gap-4 md:px-0">
              {longestRuns.map((run, index) => (
                <article
                  key={run.id}
                  className="min-w-[84%] overflow-hidden rounded-xl border border-black/10 bg-white p-4 shadow-card sm:min-w-[70%] md:min-w-0"
                >
                  <p className="text-xs font-medium text-slate-500">{formatDate(run.startDate)} • {rankLabel(index)}</p>
                  <p className="mt-2 text-lg font-semibold leading-tight text-black sm:text-xl">{run.name ?? "Run"}</p>
                  <div className="mt-4 grid grid-cols-3 divide-x divide-black/10">
                    <div className="pr-3">
                      <p className="text-sm text-slate-600">Distance</p>
                      <p className="mt-1 whitespace-nowrap text-[17px] font-semibold leading-tight text-black">{formatDistanceWithUnit(run.distance, distanceUnit)}</p>
                    </div>
                    <div className="px-3">
                      <p className="text-sm text-slate-600">Pace</p>
                      <p className="mt-1 whitespace-nowrap text-[17px] font-semibold leading-tight text-black">{formatPaceForActivity(run, distanceUnit)}</p>
                    </div>
                    <div className="pl-3">
                      <p className="text-sm text-slate-600">Time</p>
                      <p className="mt-1 whitespace-nowrap text-[17px] font-semibold leading-tight text-black">{formatTime(run.movingTime)}</p>
                    </div>
                  </div>
                  <MapPreview polyline={run.summaryPolyline} label="Route" />
                  <a
                    href={`https://www.strava.com/activities/${run.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex font-semibold text-[#FC5200]"
                  >
                    View on Strava
                  </a>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No runs in this window yet.</p>
        )}
      </section>

      <FastestRunByDistance groups={fastestRunsByDistance} />

      <section>
        <BestTimesGroupedList records={prRecords} distanceUnit={distanceUnit} />
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="pt-5 text-xl font-extrabold tracking-tight text-black md:text-2xl">When You Usually Run</h3>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {timeOfDay.summary.map((bucket) => (
            <div key={bucket.label} className="rounded-lg border border-black/10 bg-white p-3 md:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{bucket.label}</p>
              <div className="mt-3 flex items-end gap-2">
                <p className="stat-pop text-2xl font-black text-black md:text-3xl">{bucket.count}</p>
                <p className="mb-1 text-xs font-semibold text-slate-500">{bucket.percent}%</p>
              </div>
              <p className="text-xs text-slate-500">Activities</p>
            </div>
          ))}
        </div>
      </section>

      </div>
    </div>
  );
}

function TopStatCard({
  value,
  display,
  decimals = 0,
  label
}: {
  value?: number | null;
  display?: string;
  decimals?: number;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-black/10 bg-white p-4 shadow-card transition-transform duration-200 hover:-translate-y-0.5 md:p-5">
      <p className="stat-pop whitespace-nowrap text-[1.7rem] font-extrabold leading-none text-black sm:text-4xl md:text-[2.8rem]">
        {display ?? <AnimatedNumber value={value ?? null} decimals={decimals} />}
      </p>
      <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px] md:mt-2 md:text-xs">{label}</p>
    </div>
  );
}

function normalizeWindow(value?: string): WindowType {
  if (!value) return "MONTH";
  const upper = value.toUpperCase();
  if (["WEEK", "MONTH", "LAST_2M", "LAST_6M", "LAST_365", "YEAR"].includes(upper)) {
    return upper as WindowType;
  }
  return "MONTH";
}

function getWindowTitle(windowType: WindowType) {
  switch (windowType) {
    case "WEEK":
      return "This Week";
    case "MONTH":
      return "This Month";
    case "LAST_2M":
      return "2 Months";
    case "LAST_6M":
      return "6 Months";
    case "LAST_365":
      return "Last 365 Days";
    case "YEAR":
      return "This Year";
    case "ALL_TIME":
      return "All Time";
    default:
      return "This Month";
  }
}

function formatWindowRange(
  windowType: WindowType,
  start: Date,
  endExclusive: Date,
  earliestActivity: Date | null,
  shortMonth = false
) {
  const end = new Date(endExclusive.getTime() - 1000);
  const startForDisplay = windowType === "ALL_TIME" && earliestActivity ? earliestActivity : start;
  return `${formatReadableDate(startForDisplay, shortMonth)} - ${formatReadableDate(end, shortMonth)}`;
}

function formatReadableDate(date: Date, shortMonth = false) {
  return `${ordinal(date.getDate())} ${new Intl.DateTimeFormat("en-US", {
    month: shortMonth ? "short" : "long",
    year: "numeric"
  }).format(date)}`;
}

function ordinal(day: number) {
  const mod10 = day % 10;
  const mod100 = day % 100;
  if (mod10 === 1 && mod100 !== 11) return `${day}st`;
  if (mod10 === 2 && mod100 !== 12) return `${day}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${day}rd`;
  return `${day}th`;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  const remSecs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}h ${remMins}m`;
  return `${remMins}m ${String(remSecs).padStart(2, "0")}s`;
}

function formatAveragePace(distanceMeters: number, movingTimeSeconds: number, unit: DistanceUnit) {
  if (distanceMeters <= 0 || movingTimeSeconds <= 0) return "--";
  const secondsPerUnit = movingTimeSeconds / metersToUnit(distanceMeters, unit);
  const mins = Math.floor(secondsPerUnit / 60);
  const secs = Math.round(secondsPerUnit % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
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

function formatTargetDistance(targetMeters: number) {
  if (targetMeters === 1000) return "1.0 km";
  if (targetMeters === 5000) return "5.0 km";
  if (targetMeters === 10000) return "10.0 km";
  if (targetMeters === 21097) return "21.1 km";
  if (targetMeters === 42195) return "42.2 km";
  return `${(targetMeters / 1000).toFixed(1)} km`;
}

function rankLabel(index: number) {
  if (index === 0) return "1st";
  if (index === 1) return "2nd";
  if (index === 2) return "3rd";
  return `${index + 1}th`;
}

function distanceKeyFromMeters(distance: number): PRRecord["distanceKey"] {
  if (distance === 400) return "400m";
  if (distance === 805) return "half_mile";
  if (distance === 1000) return "1k";
  if (distance === 1609) return "1_mile";
  if (distance === 3219) return "2_mile";
  if (distance === 5000) return "5k";
  if (distance === 10000) return "10k";
  if (distance === 15000) return "15k";
  if (distance === 16093) return "10_mile";
  if (distance === 21097) return "half_marathon";
  if (distance === 42195) return "marathon";
  return `distance_${distance}`;
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

function computeRunTotals(
  activities: Array<{ distance: number; movingTime: number; elevationGain: number }>
) {
  const totalDistance = activities.reduce((sum, activity) => sum + activity.distance, 0);
  const totalMovingTime = activities.reduce((sum, activity) => sum + activity.movingTime, 0);
  const totalElevationGain = activities.reduce((sum, activity) => sum + activity.elevationGain, 0);
  const activityCount = activities.length;
  return {
    totalDistance,
    totalMovingTime,
    totalElevationGain,
    activityCount,
    avgSpeed: totalMovingTime > 0 ? totalDistance / totalMovingTime : 0
  };
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

  const total = hours.reduce((sum, value) => sum + value, 0);
  const withPercent = (count: number) => ({
    count,
    percent: total > 0 ? Math.round((count / total) * 100) : 0
  });

  const overnight = withPercent(sumRange(hours, 0, 4));
  const earlyMorning = withPercent(sumRange(hours, 4, 8));
  const lateMorning = withPercent(sumRange(hours, 8, 12));
  const afternoon = withPercent(sumRange(hours, 12, 16));
  const earlyEvening = withPercent(sumRange(hours, 16, 20));
  const lateEvening = withPercent(sumRange(hours, 20, 24));

  const summary = [
    { label: "12AM–4AM", range: "12AM–4AM", ...overnight },
    { label: "4AM–8AM", range: "4AM–8AM", ...earlyMorning },
    { label: "8AM–12PM", range: "8AM–12PM", ...lateMorning },
    { label: "12PM–4PM", range: "12PM–4PM", ...afternoon },
    { label: "4PM–8PM", range: "4PM–8PM", ...earlyEvening },
    { label: "8PM–12AM", range: "8PM–12AM", ...lateEvening }
  ];

  const max = Math.max(1, ...hours);
  return { hours, summary, max };
}

function sumRange(values: number[], start: number, end: number) {
  return values.slice(start, end).reduce((sum, value) => sum + value, 0);
}

function formatPaceForActivity(activity: { distance: number; movingTime: number }, unit: DistanceUnit) {
  if (activity.distance <= 0 || activity.movingTime <= 0) return "--";
  const paceSecondsPerUnit = activity.movingTime / metersToUnit(activity.distance, unit);
  const mins = Math.floor(paceSecondsPerUnit / 60);
  const secs = Math.round(paceSecondsPerUnit % 60);
  return `${mins}:${String(secs).padStart(2, "0")}/${unit}`;
}

function formatPaceForTarget(timeSeconds: number, targetMeters: number, unit: DistanceUnit) {
  if (timeSeconds <= 0 || targetMeters <= 0) return "--";
  const paceSeconds = timeSeconds / metersToUnit(targetMeters, unit);
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}/${unit}`;
}

function getDistanceUnitPreference(): DistanceUnit {
  const unit = cookies().get("bt_distance_unit")?.value;
  return unit === "mi" ? "mi" : "km";
}

function metersToUnit(distanceMeters: number, unit: DistanceUnit) {
  return unit === "mi" ? distanceMeters / 1609.344 : distanceMeters / 1000;
}

function buildDistanceChartPoints(
  runs: Array<{ startDate: Date; distance: number }>,
  windowType: WindowType,
  start: Date,
  endExclusive: Date
) {
  if (runs.length === 0) return [];

  const effectiveStart =
    windowType === "ALL_TIME"
      ? new Date(Math.min(...runs.map((run) => run.startDate.getTime())))
      : start;
  const now = new Date();
  const tomorrowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const effectiveEnd = endExclusive.getTime() > tomorrowUtc.getTime() ? tomorrowUtc : endExclusive;
  const useMonthly =
    windowType === "YEAR" || windowType === "LAST_6M" || windowType === "LAST_365" || windowType === "ALL_TIME" || windowType === "LAST_YEAR";
  return useMonthly
    ? aggregateByMonth(runs, effectiveStart, effectiveEnd)
    : aggregateByDay(runs, effectiveStart, effectiveEnd);
}

function aggregateByDay(runs: Array<{ startDate: Date; distance: number }>, start: Date, endExclusive: Date) {
  const sums = new Map<string, number>();
  for (const run of runs) {
    const key = run.startDate.toISOString().slice(0, 10);
    sums.set(key, (sums.get(key) ?? 0) + run.distance / 1000);
  }

  const points: Array<{ start: string; end: string; valueKm: number; label: string }> = [];
  for (let cursor = new Date(start); cursor < endExclusive; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = cursor.toISOString().slice(0, 10);
    const dayStart = new Date(`${key}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    points.push({
      start: dayStart.toISOString(),
      end: dayEnd.toISOString(),
      valueKm: Number((sums.get(key) ?? 0).toFixed(1)),
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(dayStart)
    });
  }
  return points;
}

function aggregateByMonth(runs: Array<{ startDate: Date; distance: number }>, start: Date, endExclusive: Date) {
  const sums = new Map<string, number>();
  for (const run of runs) {
    const key = `${run.startDate.getUTCFullYear()}-${String(run.startDate.getUTCMonth() + 1).padStart(2, "0")}`;
    sums.set(key, (sums.get(key) ?? 0) + run.distance / 1000);
  }

  const points: Array<{ start: string; end: string; valueKm: number; label: string }> = [];
  for (
    let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    cursor < endExclusive;
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  ) {
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
    const monthStart = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    points.push({
      start: monthStart.toISOString(),
      end: monthEnd.toISOString(),
      valueKm: Number((sums.get(key) ?? 0).toFixed(1)),
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(monthStart)
    });
  }
  return points;
}

function formatDistanceWithUnit(distanceMeters: number, unit: DistanceUnit, decimals = 1) {
  const value = metersToUnit(distanceMeters, unit);
  return `${value.toFixed(decimals)} ${unit}`;
}

function estimateFromActivityDistance(distanceMeters: number, movingTimeSeconds: number, targetMeters: number) {
  if (distanceMeters <= 0 || movingTimeSeconds <= 0) return null;
  // Only use proportional fallback for shorter distances.
  // Longer targets are too noisy when inferred from whole-run summaries.
  if (targetMeters > 10000) return null;
  const tolerance = distanceTolerance(targetMeters);
  if (Math.abs(distanceMeters - targetMeters) > tolerance) return null;
  return Math.round(movingTimeSeconds * (targetMeters / distanceMeters));
}

function isEffortUsableForTarget(activityDistanceMeters: number, targetMeters: number) {
  if (targetMeters <= 10000) return true;
  // For HM/M records, require activity distance to be close to the target.
  // This avoids selecting a split from a much longer/shorter run.
  return Math.abs(activityDistanceMeters - targetMeters) <= distanceTolerance(targetMeters);
}

function distanceTolerance(targetMeters: number) {
  if (targetMeters <= 400) return 40;
  if (targetMeters <= 1000) return 90;
  if (targetMeters <= 5000) return 220;
  if (targetMeters <= 10000) return 380;
  if (targetMeters <= 21097) return 650;
  return 1200;
}
