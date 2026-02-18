import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getMockDistanceSeries } from "../../../lib/mockDistanceData";
import type { DistanceGranularity, DistancePoint } from "../../../lib/distanceSeriesUtils";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const granularity = normalizeGranularity(url.searchParams.get("granularity"));
  const month = url.searchParams.get("month");
  const weekStart = url.searchParams.get("weekStart");
  const day = url.searchParams.get("day");

  if (!userId || !granularity) {
    return NextResponse.json({ error: "Missing userId or granularity" }, { status: 400 });
  }

  try {
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        sportType: "RUN"
      },
      select: {
        startDate: true,
        distance: true,
        id: true
      },
      orderBy: {
        startDate: "asc"
      }
    });

    let points: DistancePoint[] = [];

    if (activities.length === 0) {
      const range = granularity === "week" ? (month ?? "") : granularity === "day" ? (weekStart ?? "") : day ?? "";
      return NextResponse.json({ points: getMockDistanceSeries(granularity, range) });
    }

    if (granularity === "month") {
      points = buildMonthlyPoints(activities);
    } else if (granularity === "week") {
      if (!month) return NextResponse.json({ error: "Missing month" }, { status: 400 });
      points = buildWeekPoints(activities, month);
    } else if (granularity === "day") {
      if (!weekStart) return NextResponse.json({ error: "Missing weekStart" }, { status: 400 });
      points = buildDayPoints(activities, weekStart);
    } else {
      if (!day) return NextResponse.json({ error: "Missing day" }, { status: 400 });
      points = buildActivityPoints(activities, day);
    }

    return NextResponse.json({ points });
  } catch {
    const range = granularity === "week" ? (month ?? "") : granularity === "day" ? (weekStart ?? "") : day ?? "";
    return NextResponse.json({ points: getMockDistanceSeries(granularity, range) });
  }
}

function normalizeGranularity(value: string | null): DistanceGranularity | null {
  if (value === "month" || value === "week" || value === "day" || value === "activity") {
    return value;
  }
  return null;
}

type ActivityPoint = { startDate: Date; distance: number; id: string };

function buildMonthlyPoints(activities: ActivityPoint[]) {
  const first = activities[0].startDate;
  const last = activities[activities.length - 1].startDate;

  const start = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));
  const end = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1));

  const points: DistancePoint[] = [];

  while (start < end) {
    const next = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    const valueKm = sumKm(activities, (d) => d >= start && d < next);
    points.push({
      start: start.toISOString(),
      end: next.toISOString(),
      valueKm,
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(start)
    });
    start.setUTCMonth(start.getUTCMonth() + 1);
  }

  return points;
}

function buildWeekPoints(activities: ActivityPoint[], month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, monthNum - 1, 1));
  const monthEnd = new Date(Date.UTC(year, monthNum, 1));

  const firstWeekStart = startOfIsoWeek(monthStart);
  const points: DistancePoint[] = [];
  let weekIndex = 1;

  for (let cursor = new Date(firstWeekStart); cursor < monthEnd; cursor.setUTCDate(cursor.getUTCDate() + 7)) {
    const next = new Date(cursor);
    next.setUTCDate(next.getUTCDate() + 7);
    const valueKm = sumKm(activities, (d) => d >= cursor && d < next && d >= monthStart && d < monthEnd);
    points.push({
      start: cursor.toISOString(),
      end: next.toISOString(),
      valueKm,
      label: `Week ${weekIndex}`
    });
    weekIndex += 1;
  }

  return points;
}

function buildDayPoints(activities: ActivityPoint[], weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const points: DistancePoint[] = [];

  for (let i = 0; i < 7; i += 1) {
    const dayStart = new Date(start);
    dayStart.setUTCDate(start.getUTCDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const valueKm = sumKm(activities, (d) => d >= dayStart && d < dayEnd);
    points.push({
      start: dayStart.toISOString(),
      end: dayEnd.toISOString(),
      valueKm,
      label: new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric" }).format(dayStart)
    });
  }

  return points;
}

function buildActivityPoints(activities: ActivityPoint[], day: string) {
  const dayStart = new Date(`${day}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  return activities
    .filter((activity) => activity.startDate >= dayStart && activity.startDate < dayEnd)
    .map((activity) => ({
      start: activity.startDate.toISOString(),
      valueKm: activity.distance / 1000,
      label: new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(activity.startDate)
    }));
}

function sumKm(activities: ActivityPoint[], predicate: (d: Date) => boolean) {
  return Number(
    (
      activities
        .filter((activity) => predicate(activity.startDate))
        .reduce((sum, activity) => sum + activity.distance, 0) / 1000
    ).toFixed(1)
  );
}

function startOfIsoWeek(date: Date) {
  const d = new Date(date);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
