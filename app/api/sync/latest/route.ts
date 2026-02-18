import { NextResponse } from "next/server";
import { readSessionCookie } from "../../../../lib/session";
import { prisma } from "../../../../lib/db";

export async function GET() {
  const session = readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const latestJob = await prisma.syncJob.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      phase: true,
      processedSteps: true,
      totalSteps: true,
      totalActivities: true,
      detailFetched: true,
      errorMessage: true,
      updatedAt: true
    }
  });

  const latestAllTimeSync = await prisma.syncJob.findFirst({
    where: {
      userId: user.id,
      status: "DONE",
      totalActivities: { not: null }
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, updatedAt: true }
  });

  return NextResponse.json({
    allTimeReady: Boolean(latestAllTimeSync),
    latestAllTimeSyncedAt: latestAllTimeSync?.updatedAt ?? null,
    latestJob
  });
}
