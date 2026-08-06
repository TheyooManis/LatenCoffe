"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 10_000;

/**
 * Keeps the kasir/dapur board current without anyone touching the page — a
 * missed order costs the cafe money. Polling (rather than a socket) keeps the
 * moving parts down; the board also refreshes the moment the tab regains
 * focus, so stepping away and back never shows a stale list.
 */
export function OrdersAutoRefresh() {
  const router = useRouter();
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const refresh = () => router.refresh();

    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_INTERVAL_MS);

    const onVisible = () => {
      const visible = document.visibilityState === "visible";
      setIsLive(visible);
      if (visible) refresh();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return (
    <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isLive ? "animate-pulse bg-emerald-500" : "bg-zinc-400"
        }`}
      />
      Diperbarui otomatis
    </span>
  );
}
