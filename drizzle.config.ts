import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema/auth.ts",
    out: "./src/db/migrations",
    dialect: "mysql",
    dbCredentials: {
        url: process.env.DATABASE_URL || '',
    },
    breakpoints: true,
    strict: true,
    verbose: true,
});
