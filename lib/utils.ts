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
