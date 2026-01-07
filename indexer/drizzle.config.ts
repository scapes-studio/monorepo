import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/offchain.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ["offchain"],
});
