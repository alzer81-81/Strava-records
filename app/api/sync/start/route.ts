import { NextResponse } from "next/server";
import { readSessionCookie } from "../../../../lib/session";
import { prisma } from "../../../../lib/db";
import { runSyncJob } from "../../../../lib/syncRunner";

export async function GET(request: Request) {
  const session = readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const full = searchParams.get("full") === "1";
  const details = searchParams.get("details") === "1";
  const streams = searchParams.get("streams") === "1";

  const job = await prisma.syncJob.create({
    data: {
      userId: user.id,
      status: "PENDING",
      phase: "Queued",
      processedSteps: 0
    }
  });

  runSyncJob({ jobId: job.id, userId: user.id, full, details, streams });

  return NextResponse.json({ ok: true, jobId: job.id });
}
