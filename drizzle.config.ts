import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
  // Force HTTP-only mode for Windows ARM64 compatibility
  strictDriver: false,
} satisfies Config;
