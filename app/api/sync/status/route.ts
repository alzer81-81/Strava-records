import { NextResponse } from "next/server";
import { z } from "zod";
import { readSessionCookie } from "../../../../lib/session";
import { prisma } from "../../../../lib/db";

const QuerySchema = z.object({
  id: z.string().uuid()
});

export async function GET(request: Request) {
  const session = readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const job = await prisma.syncJob.findUnique({ where: { id: parsed.data.id } });
  if (!job || job.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    phase: job.phase,
    processedSteps: job.processedSteps,
    totalSteps: job.totalSteps,
    totalActivities: job.totalActivities,
    detailFetched: job.detailFetched,
    errorMessage: job.errorMessage
  });
}
