// ─────────────────────────────────────────────
// EBOS — Prisma 7 Configuration
// Connection URL is managed HERE (not in schema.prisma)
// Docs: https://pris.ly/d/prisma7-client-config
// ─────────────────────────────────────────────
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Use a placeholder during `prisma generate` (build phase).
// The real DATABASE_URL is injected by Render at runtime.
// The actual DB connection is made via PrismaPg adapter in PrismaService.
const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder";

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
