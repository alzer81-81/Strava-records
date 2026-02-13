import { prisma } from "./db";
import { syncActivities } from "./sync";
import { computeAllTimeRecordsFromStreams } from "./recordsStreams";
import { getRollingRange, getWindowRange, WindowType } from "./time";
import { recomputeWindow } from "./records";
import { isWindowAllowed } from "./entitlements";

const windowTypes: WindowType[] = ["WEEK", "MONTH", "LAST_2M", "LAST_6M", "YEAR", "LAST_YEAR", "ALL_TIME"];

export async function runSyncJob(params: {
  jobId: string;
  userId: string;
  full: boolean;
  details: boolean;
  streams: boolean;
}) {
  const { jobId, userId, full, details, streams } = params;
  try {
    await prisma.syncJob.update({
      where: { id: jobId },
      data: { status: "RUNNING", startedAt: new Date(), phase: "Starting" }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    await syncActivities(userId, {
      full,
      details,
      onProgress: async (progress) => {
        await prisma.syncJob.update({
          where: { id: jobId },
          data: {
            phase: progress.phase,
            totalSteps: progress.totalSteps,
            processedSteps: progress.processedSteps,
            detailFetched: progress.detailFetched,
            totalActivities: progress.totalActivities
          }
        });
      }
    });

    const now = new Date();
    await prisma.syncJob.update({
      where: { id: jobId },
      data: { phase: "Recomputing windows" }
    });

    for (const windowType of windowTypes) {
      if (!isWindowAllowed(user.plan, windowType)) continue;
      const { start, end, key } = getWindowRange(windowType, now);
      const prevRange = windowType === "ALL_TIME" ? null : getWindowRange(windowType, new Date(start.getTime() - 1));
      await recomputeWindow({
        userId,
        windowType,
        windowKey: key,
        start,
        end,
        sportType: "RUN",
        plan: user.plan
      });
      await recomputeWindow({
        userId,
        windowType,
        windowKey: key,
        start,
        end,
        sportType: "RIDE",
        plan: user.plan
      });

      if (prevRange) {
        await recomputeWindow({
          userId,
          windowType,
          windowKey: prevRange.key,
          start: prevRange.start,
          end: prevRange.end,
          sportType: "RUN",
          plan: user.plan
        });
        await recomputeWindow({
          userId,
          windowType,
          windowKey: prevRange.key,
          start: prevRange.start,
          end: prevRange.end,
          sportType: "RIDE",
          plan: user.plan
        });
      }

      if (windowType === "WEEK") {
        const rolling = getRollingRange(7, now);
        await recomputeWindow({
          userId,
          windowType,
          windowKey: rolling.key,
          start: rolling.start,
          end: rolling.end,
          sportType: "RUN",
          plan: user.plan
        });
        await recomputeWindow({
          userId,
          windowType,
          windowKey: rolling.key,
          start: rolling.start,
          end: rolling.end,
          sportType: "RIDE",
          plan: user.plan
        });
      }
    }

    if (streams) {
      await prisma.syncJob.update({
        where: { id: jobId },
        data: { phase: "Computing all-time PRs" }
      });

      await computeAllTimeRecordsFromStreams({
        userId,
        accessToken: user.accessToken,
        onProgress: async ({ processed, total }) => {
          await prisma.syncJob.update({
            where: { id: jobId },
            data: {
              phase: "Computing all-time PRs",
              processedSteps: processed,
              totalSteps: total
            }
          });
        }
      });
    }

    await prisma.syncJob.update({
      where: { id: jobId },
      data: { status: "DONE", finishedAt: new Date(), phase: "Complete" }
    });
  } catch (error) {
    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: "ERROR",
        finishedAt: new Date(),
        phase: "Error",
        errorMessage: error instanceof Error ? error.message : "Sync failed"
      }
    });
  }
}
