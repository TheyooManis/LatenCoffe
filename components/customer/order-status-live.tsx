"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 10_000;

/**
 * Refreshes the customer's order page while they wait.
 *
 * Kept as a plain poll rather than the kasir board's push stream: this page is
 * public, and an unauthenticated long-lived connection per waiting customer is
 * a much bigger cost than one request every ten seconds. Noticing "Selesai" a
 * few seconds late is harmless; the barista calls the number anyway.
 */
export function OrderStatusLive({ done }: { done: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (done) return;

    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [done, router]);

  return null;
}
