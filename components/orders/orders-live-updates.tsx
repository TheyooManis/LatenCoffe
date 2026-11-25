"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { playOrderNotificationSound, unlockAudioContext } from "@/lib/audio";

/**
 * Only used while the push stream is down (server restart, network blip), so a
 * missed order can never sit unseen. The live path is push, not this.
 */
const FALLBACK_POLL_MS = 15_000;

type Connection = "connecting" | "live" | "offline";

/**
 * Keeps the kasir/dapur board current without anyone touching the page.
 * Sound notification is always active and unlocks on first user interaction.
 */
export function OrdersLiveUpdates() {
  const router = useRouter();
  const [connection, setConnection] = useState<Connection>("connecting");

  // Unlock browser AudioContext automatically on the first tap/click/keypress
  useEffect(() => {
    const unlock = () => unlockAudioContext();
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  function testSound() {
    unlockAudioContext();
    playOrderNotificationSound();
    toast.success("Notifikasi suara aktif", {
      description: "Bel berbunyi otomatis setiap ada pesanan masuk.",
    });
  }

  useEffect(() => {
    const source = new EventSource("/api/orders/stream");

    source.addEventListener("ready", () => setConnection("live"));
    source.addEventListener("order-changed", () => {
      // 1. Refresh server component data
      router.refresh();

      // 2. Always play notification sound
      playOrderNotificationSound();

      // 3. Show toast notification
      toast.info("Papan Pesanan Diperbarui", {
        description: "Ada pembaruan atau pesanan baru masuk.",
        icon: <Bell className="size-4 text-emerald-500" />,
        duration: 4000,
      });

      // 4. Update title if tab is inactive
      if (document.hidden) {
        const originalTitle = document.title;
        document.title = "(🔔) Pesanan Baru! - Laten Coffee";
        const handleVisibility = () => {
          if (!document.hidden) {
            document.title = originalTitle;
            document.removeEventListener("visibilitychange", handleVisibility);
          }
        };
        document.addEventListener("visibilitychange", handleVisibility);
      }
    });

    // EventSource reconnects on its own; reflect the gap in the UI meanwhile.
    source.onerror = () => setConnection("offline");
    source.onopen = () => setConnection("live");

    return () => source.close();
  }, [router]);

  useEffect(() => {
    if (connection === "live") return;

    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, FALLBACK_POLL_MS);

    return () => clearInterval(id);
  }, [connection, router]);

  // A stale board looks identical to a quiet one, so say which it is.
  const label =
    connection === "live"
      ? "Terhubung langsung"
      : connection === "connecting"
        ? "Menyambungkan..."
        : "Sambungan putus, mencoba lagi";

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={testSound}
        className="h-8 gap-1.5 border-emerald-200/80 bg-emerald-50/50 text-xs font-medium text-emerald-800 hover:bg-emerald-100/70 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
        title="Notifikasi suara selalu aktif (klik untuk tes bunyi)"
      >
        <Volume2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Suara Aktif</span>
      </Button>

      <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            connection === "live"
              ? "animate-pulse bg-emerald-500"
              : connection === "connecting"
                ? "bg-zinc-400"
                : "bg-amber-500"
          }`}
        />
        {label}
      </span>
    </div>
  );
}
