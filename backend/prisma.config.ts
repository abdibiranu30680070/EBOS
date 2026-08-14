// ─────────────────────────────────────────────
// EBOS — Prisma 7 Configuration
// Connection URL is managed HERE (not in schema.prisma)
// Docs: https://pris.ly/d/prisma7-client-config
// ─────────────────────────────────────────────
import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "[EBOS] DATABASE_URL is not set.\n" +
    "  → Create a '.env' file in the backend directory\n" +
    "  → Add: DATABASE_URL=\"postgresql://USER:PASSWORD@HOST:5432/DATABASE\"\n" +
    "  → See '.env.example' for reference."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx ts-node --transpile-only prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
