import { prisma } from "../lib/db";
import { getWindowRange, WindowType } from "../lib/time";
import { extractBestEfforts, mergeDistanceRecords, resolveEffortForTarget, selectDistanceTargets } from "../lib/analytics";
import { MapPreview } from "./MapPreview";
import { AutoSync } from "./AutoSync";
import { AnimatedNumber } from "./AnimatedNumber";
import { TopTenModal } from "./TopTenModal";
import { FastestRunByDistance } from "./FastestRunByDistance";
import { BestTimesGroupedList, type PRRecord } from "./BestTimesGroupedList";

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
  const earliestActivity = await prisma.activity.findFirst({
    where: { userId },
    orderBy: { startDate: "asc" },
    select: { startDate: true }
  });
  const displayedRange = formatWindowRange(windowType, start, end, earliestActivity?.startDate ?? null);
  const displayedRangeMobile = formatWindowRange(windowType, start, end, earliestActivity?.startDate ?? null, true);
  const windowTitle = getWindowTitle(windowType);

  const summary = await prisma.periodSummary.findFirst({
    where: {
      userId,
      periodType: windowType,
      periodKey: key,
      sportType: "RUN"
    }
  });
  const totals = getTotals(summary?.totals);

  const longestRunsTop10 = await prisma.activity.findMany({
    where: {
      userId,
      sportType: "RUN",
      startDate: { gte: start, lt: end }
    },
    orderBy: { distance: "desc" },
    take: 10
  });
  const longestRuns = longestRunsTop10.slice(0, 3);

  const runsForFastest = await prisma.activity.findMany({
    where: {
      userId,
      sportType: "RUN",
      startDate: { gte: start, lt: end },
      distance: { gt: 0 },
      movingTime: { gt: 0 }
    },
    orderBy: { startDate: "desc" }
  });

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
      pace: formatPaceForTarget(run.bestTimeSeconds, group.targetMeters),
      time: formatTime(run.bestTimeSeconds),
      summaryPolyline: run.summaryPolyline
    }));

    return {
      key: group.key,
      label: group.label,
      runs
    };
  });

  const activitiesForTimeOfDay = await prisma.activity.findMany({
    where: {
      userId,
      sportType: "RUN",
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
    <div className="flex flex-col gap-7 text-black">
      <AutoSync enabled windowType={windowType} />
      <section className="px-1 py-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-[var(--font-fraunces)] text-2xl font-extrabold tracking-tight text-black md:text-4xl">{windowTitle}</h1>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blaze md:text-sm">
            <span className="md:hidden">{displayedRangeMobile}</span>
            <span className="hidden md:inline">{displayedRange}</span>
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <TopStatCard
          value={totals.activityCount}
          label="Activities"
        />
        <TopStatCard
          value={totals.totalDistance / 1000}
          decimals={1}
          label="Kilometers"
        />
        <TopStatCard
          display={formatMovingTimeCard(totals.totalMovingTime)}
          label="Hours moving"
        />
        <TopStatCard
          value={Math.round(totals.totalElevationGain)}
          label="Meters climbed"
        />
        <TopStatCard
          value={Math.round(estimateCalories(totals.totalDistance))}
          label="Calories burned"
        />
        <TopStatCard
          value={avgHeartrate ? Math.round(avgHeartrate) : null}
          label="Average HR"
        />
      </section>


      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-extrabold tracking-tight text-black md:text-2xl">Longest Run</h3>
          <TopTenModal
            title="Longest Run"
            rows={longestRunsTop10.map((run, index) => ({
              rank: rankLabel(index),
              date: formatDate(run.startDate),
              name: run.name ?? "Run",
              distance: `${formatKm(run.distance)} km`,
              pace: formatPace(run),
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
                      <p className="mt-1 whitespace-nowrap text-[17px] font-semibold leading-tight text-black">{formatKm(run.distance)} km</p>
                    </div>
                    <div className="px-3">
                      <p className="text-sm text-slate-600">Pace</p>
                      <p className="mt-1 whitespace-nowrap text-[17px] font-semibold leading-tight text-black">{formatPace(run)}</p>
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
        <BestTimesGroupedList records={prRecords} />
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl font-extrabold tracking-tight text-black md:text-2xl">When You Usually Run</h3>
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
  if (["WEEK", "MONTH", "LAST_2M", "LAST_6M", "YEAR", "ALL_TIME"].includes(upper)) {
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

function formatMovingTimeCard(seconds: number) {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
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

function averageHeartRate(values: { averageHeartrate: number | null }[]) {
  const filtered = values.map((item) => item.averageHeartrate).filter((value): value is number => value !== null);
  if (filtered.length === 0) return null;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function estimateCalories(distanceMeters: number) {
  const km = distanceMeters / 1000;
  const caloriesPerKm = 62;
  return km * caloriesPerKm;
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

function formatSpeed(speedMetersPerSecond: number) {
  const kmh = speedMetersPerSecond * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

function formatPace(activity: { distance: number; movingTime: number }) {
  if (activity.distance <= 0 || activity.movingTime <= 0) return "--";
  const paceSecondsPerKm = activity.movingTime / (activity.distance / 1000);
  const mins = Math.floor(paceSecondsPerKm / 60);
  const secs = Math.round(paceSecondsPerKm % 60);
  return `${mins}:${String(secs).padStart(2, "0")}/km`;
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

function formatPaceForTarget(timeSeconds: number, targetMeters: number) {
  if (timeSeconds <= 0 || targetMeters <= 0) return "--";
  const paceSeconds = timeSeconds / (targetMeters / 1000);
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}/km`;
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
