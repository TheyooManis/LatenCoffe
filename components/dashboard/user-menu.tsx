"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  name,
  email,
  signOutAction,
}: {
  name?: string | null;
  email?: string | null;
  signOutAction: () => Promise<void>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full text-sm font-medium text-zinc-700 outline-none dark:text-zinc-300">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {(name ?? "?").slice(0, 1).toUpperCase()}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Base UI's GroupLabel reads its group from context, so it must sit
            inside a Group — outside one it throws when the menu opens. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="font-medium">{name}</p>
            <p className="text-xs font-normal text-zinc-500">{email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Plain form (not a DropdownMenuItem) so sign-out still works as a
            real POST if client-side event handling ever fails. */}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full cursor-default items-center rounded-md px-1.5 py-1 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground"
          >
            Keluar
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
