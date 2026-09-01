import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

/** Formats an integer amount of rupiah, e.g. 22000 -> "Rp 22.000". */
export function formatRupiah(amount: number) {
  return rupiah.format(amount)
}

// Manado is WITA (UTC+8); pin the zone so the server's locale can't shift
// the clock times staff read off the order cards.
const clock = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Makassar",
})

export function formatClock(date: Date) {
  return clock.format(date)
}

const WITA_OFFSET_MS = 8 * 60 * 60 * 1000

/**
 * Start of today in WITA (UTC+8). The cafe's day — not the server's — is what
 * decides which orders are "today" and where the queue numbering restarts.
 */
export function startOfTodayWita() {
  const nowWita = new Date(Date.now() + WITA_OFFSET_MS)
  const midnightWita = Date.UTC(
    nowWita.getUTCFullYear(),
    nowWita.getUTCMonth(),
    nowWita.getUTCDate()
  )
  return new Date(midnightWita - WITA_OFFSET_MS)
}
