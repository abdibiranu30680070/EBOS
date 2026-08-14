"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("prisma/config");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("[EBOS] DATABASE_URL is not set.\n" +
        "  → Create a '.env' file in the backend directory\n" +
        "  → Add: DATABASE_URL=\"postgresql://USER:PASSWORD@HOST:5432/DATABASE\"\n" +
        "  → See '.env.example' for reference.");
}
exports.default = (0, config_1.defineConfig)({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "npx ts-node --transpile-only prisma/seed.ts",
    },
    datasource: {
        url: databaseUrl,
    },
});
//# sourceMappingURL=prisma.config.js.map