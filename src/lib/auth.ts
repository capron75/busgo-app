import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { authDatabase } from "@/lib/auth-adapter";

export const auth = betterAuth({
  database: authDatabase,
  emailAndPassword: {
    enabled: true,
  },
  user: { modelName: "User" },
  session: { modelName: "Session" },
  account: { modelName: "Account" },
  verification: { modelName: "Verification" },
  plugins: [nextCookies()],
});
