import { NextResponse } from "next/server";
import { z } from "zod";
import { readSessionCookie } from "../../../lib/session";
import { prisma } from "../../../lib/db";
import { getWindowRange } from "../../../lib/time";
import { isWindowAllowed } from "../../../lib/entitlements";

const QuerySchema = z.object({
  windowType: z.enum(["WEEK", "MONTH", "LAST_2M", "LAST_6M", "LAST_365", "YEAR", "LAST_YEAR", "ALL_TIME"]).default("MONTH"),
  sportType: z.enum(["RUN", "RIDE"]).default("RUN")
});

export async function GET(request: Request) {
  const session = readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const windowType = parsed.data.windowType;
  if (!isWindowAllowed(user.plan, windowType)) {
    return NextResponse.json({ error: "Plan limit" }, { status: 403 });
  }

  const { start, end, key } = getWindowRange(windowType, new Date());

  const usesPeriodEnum = windowType !== "LAST_365";

  const summary = usesPeriodEnum
    ? await prisma.periodSummary.findFirst({
        where: {
          userId: user.id,
          periodType: windowType,
          periodKey: key,
          sportType: parsed.data.sportType
        }
      })
    : null;

  const records = usesPeriodEnum
    ? await prisma.record.findMany({
        where: {
          userId: user.id,
          windowType,
          windowKey: key,
          sportType: parsed.data.sportType
        }
      })
    : [];

  return NextResponse.json({ summary, records });
}
