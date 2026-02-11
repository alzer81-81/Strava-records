"use client";

import { useEffect } from "react";

export function AutoSync({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const params = new URLSearchParams({ full: "1", streams: "1" });
    fetch(`/api/sync/start?${params.toString()}`).catch(() => {});
  }, [enabled]);

  return null;
}
