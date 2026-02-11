import Link from "next/link";
import { prisma } from "../lib/db";
import { getRollingRange, getWindowRange } from "../lib/time";

export async function DashboardHome({ userId }: { userId: string }) {
  const now = new Date();
  const week = getWindowRange("WEEK", now);
  const rollingWeek = getRollingRange(7, now);
  const month = getWindowRange("MONTH", now);

  const summaries = await prisma.periodSummary.findMany({
    where: {
      userId,
      periodType: { in: ["WEEK", "MONTH"] }
    }
  });

  const weekSummary = summaries.find((s) => s.periodType === "WEEK" && s.periodKey === week.key);
  const rollingSummary = summaries.find((s) => s.periodType === "WEEK" && s.periodKey === rollingWeek.key);
  const monthSummary = summaries.find((s) => s.periodType === "MONTH" && s.periodKey === month.key);
  const weekTotals = getTotals(weekSummary?.totals);
  const rollingTotals = getTotals(rollingSummary?.totals);
  const monthTotals = getTotals(monthSummary?.totals);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl bg-gradient-to-br from-white via-sand to-[#ffe9d5] p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slateish">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold">Welcome back</h1>
            <p className="mt-2 text-sm text-slateish">Your weekly rhythm and monthly momentum at a glance.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/records" className="rounded-full border border-slateish/20 px-4 py-2 text-sm">
              View records
            </Link>
            <form action="/api/sync" method="get">
              <button className="rounded-full bg-ember px-4 py-2 text-sm text-white" type="submit">
                Sync now
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Rolling 7 days" value={`${formatKm(rollingTotals.totalDistance)} km`} subtitle="Always rolling" />
        <MetricCard title="Calendar week" value={`${formatKm(weekTotals.totalDistance)} km`} subtitle="Week to date" />
        <MetricCard title="This month" value={`${formatKm(monthTotals.totalDistance)} km`} subtitle="Calendar month totals" />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold">This week</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slateish">
            <Stat label="Distance" value={`${formatKm(weekTotals.totalDistance)} km`} />
            <Stat label="Moving time" value={formatTime(weekTotals.totalMovingTime)} />
            <Stat label="Elevation" value={`${Math.round(weekTotals.totalElevationGain)} m`} />
            <Stat label="Activities" value={`${weekTotals.activityCount}`} />
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold">This month</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slateish">
            <Stat label="Distance" value={`${formatKm(monthTotals.totalDistance)} km`} />
            <Stat label="Moving time" value={formatTime(monthTotals.totalMovingTime)} />
            <Stat label="Elevation" value={`${Math.round(monthTotals.totalElevationGain)} m`} />
            <Stat label="Activities" value={`${monthTotals.activityCount}`} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <p className="mt-2 text-sm text-slateish">Sync Strava to refresh records and summaries.</p>
        <div className="mt-4">
          <form action="/api/sync" method="get">
            <button className="rounded-full bg-ember px-5 py-2 text-white" type="submit">
              Sync now
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <p className="text-xs uppercase tracking-[0.2em] text-slateish">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm text-slateish">{subtitle}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p>{label}</p>
      <p className="text-base font-semibold text-ink">{value}</p>
    </div>
  );
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
