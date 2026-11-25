"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { playOrderNotificationSound } from "@/lib/audio";

/**
 * Only used while the push stream is down (server restart, network blip), so a
 * missed order can never sit unseen. The live path is push, not this.
 */
const FALLBACK_POLL_MS = 15_000;

type Connection = "connecting" | "live" | "offline";

/**
 * Keeps the kasir/dapur board current without anyone touching the page.
 * Includes real-time audio chime, visual toast, and connection indicator.
 */
export function OrdersLiveUpdates() {
  const router = useRouter();
  const [connection, setConnection] = useState<Connection>("connecting");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Load sound preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("laten_orders_sound_enabled");
    if (saved === "true") {
      setSoundEnabled(true);
    }
  }, []);

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("laten_orders_sound_enabled", String(next));
    if (next) {
      playOrderNotificationSound();
      toast.success("Suara notifikasi aktif", {
        description: "Bel akan berbunyi saat pesanan baru masuk.",
      });
    } else {
      toast.info("Suara notifikasi dinonaktifkan");
    }
  }

  useEffect(() => {
    const source = new EventSource("/api/orders/stream");

    source.addEventListener("ready", () => setConnection("live"));
    source.addEventListener("order-changed", () => {
      // 1. Refresh server component data
      router.refresh();

      // 2. Play audio if enabled
      if (soundEnabledRef.current) {
        playOrderNotificationSound();
      }

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
        onClick={toggleSound}
        className="h-8 gap-1.5 text-xs font-normal"
        title={soundEnabled ? "Matikan suara notifikasi" : "Nyalakan suara notifikasi"}
      >
        {soundEnabled ? (
          <>
            <Volume2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Suara Aktif</span>
          </>
        ) : (
          <>
            <VolumeX className="size-3.5 text-zinc-400" />
            <span className="text-zinc-500">Suara Mati</span>
          </>
        )}
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
