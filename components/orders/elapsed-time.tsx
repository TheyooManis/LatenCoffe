"use client";

import { useSyncExternalStore } from "react";

const TICK_INTERVAL_MS = 30_000;

// One shared clock for every order card on the board, instead of one timer
// each. `tick` only exists to notify subscribers that "now" moved.
const listeners = new Set<() => void>();
let tick = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  intervalId ??= setInterval(() => {
    tick += 1;
    for (const listener of listeners) listener();
  }, TICK_INTERVAL_MS);

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

const getSnapshot = () => tick;
// Rendering nothing on the server (and on the hydrating pass) keeps the
// server's "now" from disagreeing with the browser's.
const getServerSnapshot = () => null;

function formatElapsed(fromIso: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(fromIso).getTime()) / 60000),
  );
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  return `${hours} jam ${minutes % 60} menit lalu`;
}

/**
 * How long an order has been waiting — the number a busy barista actually
 * scans for.
 */
export function ElapsedTime({ since }: { since: string }) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (snapshot === null) return null;
  return <span>{formatElapsed(since)}</span>;
}
