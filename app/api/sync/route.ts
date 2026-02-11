import { NextResponse } from "next/server";
import { readSessionCookie } from "../../../lib/session";
import { prisma } from "../../../lib/db";
import { syncActivities } from "../../../lib/sync";
import { getRollingRange, getWindowRange, WindowType } from "../../../lib/time";
import { recomputeWindow } from "../../../lib/records";
import { isWindowAllowed } from "../../../lib/entitlements";

const windowTypes: WindowType[] = ["WEEK", "MONTH", "LAST_2M", "LAST_6M", "YEAR", "ALL_TIME"];

export async function GET(request: Request) {
  const session = readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const full = searchParams.get("full") === "1";
  const details = searchParams.get("details") === "1";
  const syncResult = await syncActivities(user.id, { full, details, maxDetail: full ? 0 : 25 });

  const now = new Date();
  for (const windowType of windowTypes) {
    if (!isWindowAllowed(user.plan, windowType)) continue;
    const { start, end, key } = getWindowRange(windowType, now);
    await recomputeWindow({
      userId: user.id,
      windowType,
      windowKey: key,
      start,
      end,
      sportType: "RUN",
      plan: user.plan
    });
    await recomputeWindow({
      userId: user.id,
      windowType,
      windowKey: key,
      start,
      end,
      sportType: "RIDE",
      plan: user.plan
    });

    if (windowType === "WEEK") {
      const rolling = getRollingRange(7, now);
      await recomputeWindow({
        userId: user.id,
        windowType,
        windowKey: rolling.key,
        start: rolling.start,
        end: rolling.end,
        sportType: "RUN",
        plan: user.plan
      });
      await recomputeWindow({
        userId: user.id,
        windowType,
        windowKey: rolling.key,
        start: rolling.start,
        end: rolling.end,
        sportType: "RIDE",
        plan: user.plan
      });
    }
  }

  return NextResponse.json({ ok: true, ...syncResult });
}
