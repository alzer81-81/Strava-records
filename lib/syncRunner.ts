import { prisma } from "./db";
import { syncActivities } from "./sync";
import { computeAllTimeRecordsFromStreams } from "./recordsStreams";

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

    if (streams) {
      await prisma.syncJob.update({
        where: { id: jobId },
        data: { phase: "Computing all-time PRs" }
      });

      await computeAllTimeRecordsFromStreams({
        userId,
        accessToken: user.accessToken,
        limit: 200,
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
