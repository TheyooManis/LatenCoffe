import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * Server Actions compile to public POST endpoints, so every mutating action
 * must re-check the session itself — the proxy's route matcher does not cover
 * them.
 */
export async function requireUser(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Anda harus masuk terlebih dahulu.");
  }
  return session;
}

export async function requireOwner(): Promise<Session> {
  const session = await requireUser();
  if (session.user.role !== "OWNER") {
    throw new Error("Hanya owner yang dapat melakukan tindakan ini.");
  }
  return session;
}
