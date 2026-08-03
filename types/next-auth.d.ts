import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "OWNER" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      role: "OWNER" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "OWNER" | "ADMIN";
  }
}
