import type { NextAuthConfig } from "next-auth";

/** Dashboard areas only the owner may open. Kasir/dapur get the rest. */
const OWNER_ONLY_PREFIXES = ["/dashboard/menu", "/dashboard/meja"];

export const authConfig = {
  pages: {
    signIn: "/",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    // jwt/session live here (not in auth.ts) so the edge instance used by
    // proxy.ts also populates `role` — `authorized` below depends on it.
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "OWNER" | "ADMIN";
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;
      const isOnDashboard = pathname.startsWith("/dashboard");
      const requiresOwner = OWNER_ONLY_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix),
      );

      if (isOnDashboard && !isLoggedIn) {
        return false;
      }
      if (requiresOwner && auth?.user?.role !== "OWNER") {
        return false;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
