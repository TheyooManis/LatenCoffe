"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  ClipboardListIcon,
  UtensilsCrossedIcon,
  QrCodeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  isOwner: boolean;
}

export function DashboardNav({ isOwner }: DashboardNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Ringkasan",
      icon: LayoutDashboardIcon,
      exact: true,
    },
    {
      href: "/dashboard/orders",
      label: "Pesanan",
      icon: ClipboardListIcon,
      exact: false,
    },
    {
      href: "/dashboard/menu",
      label: "Kelola Menu",
      icon: UtensilsCrossedIcon,
      exact: false,
    },
    ...(isOwner
      ? [
          {
            href: "/dashboard/meja",
            label: "Meja & QR",
            icon: QrCodeIcon,
            exact: false,
          },
        ]
      : []),
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop / Tablet Topbar Nav (Hidden on Mobile) */}
      <nav className="hidden items-center gap-1.5 sm:flex">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 active:scale-95",
                active
                  ? "bg-[#2C1F1A] text-white shadow-xs dark:bg-[#C87D43] dark:text-[#1A1412]"
                  : "text-zinc-600 hover:bg-amber-50 hover:text-amber-900 dark:text-zinc-400 dark:hover:bg-amber-950/40 dark:hover:text-amber-200",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Bottom Navigation Bar (Visible only on Mobile screens < 640px) */}
      <nav
        aria-label="Navigasi Bawah Ponsel"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-900/10 bg-white/95 px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md transition-colors print:hidden sm:hidden dark:border-amber-950/40 dark:bg-[#1A1412]/95"
      >
        <div className="mx-auto flex max-w-md items-center justify-around">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-xl py-1 text-center transition-all duration-150 active:scale-95",
                  active
                    ? "font-semibold text-[#C87D43] dark:text-[#E09B67]"
                    : "font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active
                      ? "bg-[#C87D43]/15 text-[#C87D43] dark:bg-[#C87D43]/25 dark:text-[#E09B67]"
                      : "bg-transparent",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                </div>
                <span className="mt-0.5 text-[11px] leading-tight tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
