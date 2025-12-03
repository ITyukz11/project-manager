import path from "node:path";
import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  // Specify a custom location for your Prisma schema
  schema: path.join("prisma", "schema"),

  // Configure a custom path and seed command for migrations
  migrations: {
    path: path.join("db", "migrations"),
    // The command to execute for seeding, using 'tsx' to run the TS file
    seed: "tsx .config/prisma/seed/user.seed.ts",
  },
});
