import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load env files for local dev only (dotenv never overrides existing env vars)
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

export default defineConfig({
  schema: "./offchain.schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ["offchain"],
});
