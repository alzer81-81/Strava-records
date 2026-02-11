"use client";

import { useState } from "react";

export function SyncButton({
  label = "Sync now",
  full = true,
  details = false,
  streams = true
}: {
  label?: string;
  full?: boolean;
  details?: boolean;
  streams?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState("Starting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSync() {
    setOpen(true);
    setStatus("syncing");
    try {
      const params = new URLSearchParams();
      if (full) params.set("full", "1");
      if (details) params.set("details", "1");
      if (streams) params.set("streams", "1");
      const res = await fetch(`/api/sync/start?${params.toString()}`);
      if (!res.ok) throw new Error("Sync failed");
      const data = (await res.json()) as { jobId: string };
      await pollStatus(data.jobId);
    } catch {
      setStatus("error");
    }
  }

  async function pollStatus(jobId: string) {
    while (true) {
      const res = await fetch(`/api/sync/status?id=${jobId}`);
      if (!res.ok) throw new Error("Sync failed");
      const data = await res.json();
      if (typeof data.totalSteps === "number" && data.totalSteps > 0) {
        const pct = Math.min(100, Math.round((data.processedSteps / data.totalSteps) * 100));
        setPercent(pct);
      }
      if (data.phase) setPhase(data.phase);
      if (data.status === "DONE") {
        setStatus("done");
        setTimeout(() => {
          setOpen(false);
          window.location.reload();
        }, 800);
        return;
      }
      if (data.status === "ERROR") {
        if (data.errorMessage) setErrorMessage(data.errorMessage);
        setStatus("error");
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  return (
    <>
      <button
        className="rounded-full bg-ember px-4 py-2 text-sm text-white"
        type="button"
        onClick={handleSync}
      >
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold">Gathering all your activities</h3>
            <p className="mt-2 text-sm text-slateish">
              This can take a few minutes. Please keep this tab open while we sync.
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-sand">
              <div className="h-full rounded-full bg-ember transition-all" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-3 text-sm text-slateish">{phase}</div>
            <div className="mt-2 text-xs text-slateish">{percent}%</div>
            <div className="mt-2 text-sm text-slateish">
              {status === "syncing" && "Syncing from Strava..."}
              {status === "done" && "All set! Refreshing..."}
              {status === "error" && "Sync failed. Please try again."}
            </div>
            {status === "error" && errorMessage && (
              <div className="mt-2 rounded-xl bg-sand/60 p-3 text-xs text-slateish">
                {errorMessage}
              </div>
            )}
            {status === "error" && (
              <div className="mt-4 text-right">
                <button
                  className="rounded-full border border-slateish/20 px-4 py-2 text-sm"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
