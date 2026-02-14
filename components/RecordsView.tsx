import { prisma } from "../lib/db";
import { getWindowRange, WindowType } from "../lib/time";
import { selectDistanceTargets } from "../lib/analytics";
import { MapPreview } from "./MapPreview";
import { AutoSync } from "./AutoSync";
import { AnimatedNumber } from "./AnimatedNumber";

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

  const summary = await prisma.periodSummary.findFirst({
    where: {
      userId,
      periodType: windowType,
      periodKey: key,
      sportType: "RUN"
    }
  });
  const totals = getTotals(summary?.totals);

  const records = await prisma.record.findMany({
    where: {
      userId,
      windowType: windowType,
      windowKey: key,
      sportType: "RUN"
    }
  });
  const allTimeRecords = await prisma.record.findMany({
    where: {
      userId,
      windowType: "ALL_TIME",
      windowKey: "all-time",
      sportType: "RUN"
    }
  });
  const racePredictions = buildRacePredictions(allTimeRecords.length > 0 ? allTimeRecords : records);
  const recordActivities = await prisma.activity.findMany({
    where: {
      id: { in: records.map((r) => r.activityId) }
    },
    select: { id: true, summaryPolyline: true }
  });
  const activitiesById = new Map(recordActivities.map((activity) => [activity.id, activity]));

  const longestRuns = await prisma.activity.findMany({
    where: {
      userId,
      sportType: "RUN",
      startDate: { gte: start, lt: end }
    },
    orderBy: { distance: "desc" },
    take: 3
  });

  const fastestAvgRuns = await prisma.activity.findMany({
    where: {
      userId,
      sportType: "RUN",
      startDate: { gte: start, lt: end },
      averageSpeed: { gt: 0 }
    },
    orderBy: { averageSpeed: "desc" },
    take: 3
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

  return (
    <div className="flex flex-col gap-6 text-black">
      <AutoSync enabled windowType={windowType} />
      <section className="px-1 py-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-[var(--font-fraunces)] text-3xl font-black text-black md:text-5xl">Your Fastest Moments</h1>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-blaze">
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


      <section className="rounded-xl border border-black/10 bg-white p-6 shadow-card">
        <h3 className="text-xl font-black md:text-3xl">Longest Run</h3>
        {longestRuns.length > 0 ? (
          <div className="-mx-1 mt-4 overflow-x-auto pb-2">
            <div className="flex gap-3 px-1 md:grid md:grid-cols-3 md:gap-4 md:px-0">
              {longestRuns.map((run, index) => (
                <article
                  key={run.id}
                  className="min-w-[84%] rounded-xl border border-black/10 bg-white p-4 shadow-card sm:min-w-[70%] md:min-w-0"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{rankLabel(index)}</p>
                  <p className="mt-2 text-base font-bold text-black">{run.name ?? "Run"}</p>
                  <p className="mt-1 text-sm text-slate-600">{formatDate(run.startDate)} • {formatKm(run.distance)} km</p>
                  <p className="text-sm text-slate-600">Moving: {formatTime(run.movingTime)} • Pace: {formatPace(run)}</p>
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

      <section className="rounded-xl border border-black/10 bg-white p-6 shadow-card">
        <h3 className="text-xl font-black md:text-3xl">Fastest Avg Speed</h3>
        {fastestAvgRuns.length > 0 ? (
          <div className="-mx-1 mt-4 overflow-x-auto pb-2">
            <div className="flex gap-3 px-1 md:grid md:grid-cols-3 md:gap-4 md:px-0">
              {fastestAvgRuns.map((run, index) => (
                <article
                  key={run.id}
                  className="min-w-[84%] rounded-xl border border-black/10 bg-white p-4 shadow-card sm:min-w-[70%] md:min-w-0"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{rankLabel(index)}</p>
                  <p className="mt-2 text-base font-bold text-black">{run.name ?? "Run"}</p>
                  <p className="mt-1 text-sm text-slate-600">{formatDate(run.startDate)} • {formatKm(run.distance)} km</p>
                  <p className="text-sm text-slate-600">Avg speed: {formatSpeed(run.averageSpeed)}</p>
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
          <p className="mt-3 text-sm text-slate-500">No data yet.</p>
        )}
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="font-[var(--font-fraunces)] text-2xl font-black md:text-4xl">PB Records</h3>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 min-[800px]:grid-cols-2">
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
                className="group block rounded-lg border border-black/10 bg-white px-3 py-3 shadow-sm transition duration-200 hover:scale-[1.01] hover:border-black/20 hover:shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <MapPreview polyline={recordActivity?.summaryPolyline ?? null} label="Route" compact />
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{formatTarget(target)}</p>
                    <span className="mt-1 block whitespace-nowrap text-sm font-black text-black md:text-base">{formatTime(record.bestTimeSeconds)}</span>
                  </div>
                  <span className="whitespace-nowrap text-xs font-semibold text-[#FC5200] md:text-sm">View activity</span>
                </div>
              </a>
            ) : (
              <div key={target} className="rounded-lg border border-black/10 bg-white px-3 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <MapPreview polyline={recordActivity?.summaryPolyline ?? null} label="Route" compact />
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{formatTarget(target)}</p>
                    <span className="mt-1 block whitespace-nowrap text-sm font-black text-slate-500 md:text-base">No record yet</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black md:text-3xl">When You Usually Run</h3>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {timeOfDay.summary.map((bucket) => (
            <div key={bucket.label} className="rounded-lg border border-black/10 bg-white p-4">
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

      <section className="rounded-xl border border-black/10 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black md:text-3xl">Race Predictions</h3>
        </div>
        {racePredictions.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {racePredictions.map((prediction) => (
              <div key={prediction.target} className="rounded-lg border border-black/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{formatTarget(prediction.target)}</p>
                <p className="mt-2 text-2xl font-black text-black md:text-3xl">{formatTime(prediction.seconds)}</p>
                <p className="mt-2 text-xs text-slate-500">{prediction.basis}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No PB data yet to calculate predictions.</p>
        )}
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
    <div className="rounded-xl border border-black/10 bg-white p-4 shadow-card transition-transform duration-200 hover:-translate-y-0.5 md:p-5">
      <p className="stat-pop text-xl font-black leading-none text-black sm:text-2xl md:text-5xl">
        {display ?? <AnimatedNumber value={value ?? null} decimals={decimals} />}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-[11px] md:mt-2 md:text-xs">{label}</p>
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

function rankLabel(index: number) {
  if (index === 0) return "1st";
  if (index === 1) return "2nd";
  if (index === 2) return "3rd";
  return `${index + 1}th`;
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

function buildRacePredictions(records: { distanceTarget: number; bestTimeSeconds: number }[]) {
  const predictors = records
    .filter((record) => record.bestTimeSeconds > 0 && record.distanceTarget >= 400)
    .sort((a, b) => a.distanceTarget - b.distanceTarget);

  const targets = [5000, 10000, 21097, 42195];
  const predictions: { target: number; seconds: number; basis: string }[] = [];

  for (const target of targets) {
    const exact = predictors.find((record) => record.distanceTarget === target);
    if (exact) {
      predictions.push({
        target,
        seconds: exact.bestTimeSeconds,
        basis: "Current PB"
      });
      continue;
    }

    const source = findNearestPredictor(predictors, target);
    if (!source) continue;

    // Riegel model with exponent 1.06.
    const projectedSeconds = Math.round(
      source.bestTimeSeconds * Math.pow(target / source.distanceTarget, 1.06)
    );

    predictions.push({
      target,
      seconds: projectedSeconds,
      basis: `Based on ${formatTarget(source.distanceTarget)} PB`
    });
  }

  return predictions;
}

function findNearestPredictor(
  predictors: { distanceTarget: number; bestTimeSeconds: number }[],
  target: number
) {
  if (predictors.length === 0) return null;
  return predictors.reduce((best, current) => {
    if (!best) return current;
    const bestDelta = Math.abs(Math.log(best.distanceTarget / target));
    const currentDelta = Math.abs(Math.log(current.distanceTarget / target));
    return currentDelta < bestDelta ? current : best;
  }, predictors[0] ?? null);
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
