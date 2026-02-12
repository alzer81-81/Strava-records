"use client";

import { useEffect } from "react";

export function AutoSync({
  enabled,
  full = false,
  streams = false
}: {
  enabled: boolean;
  full?: boolean;
  streams?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;
    const params = new URLSearchParams();
    if (full) params.set("full", "1");
    if (streams) params.set("streams", "1");
    fetch(`/api/sync/start?${params.toString()}`).catch(() => {});
  }, [enabled, full, streams]);

  return null;
}
