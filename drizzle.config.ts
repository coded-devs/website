import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

if (existsSync(".env.local")) {
  const envFile = readFileSync(".env.local", "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);

    if (match) {
      const value = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
      process.env[match[1].trim()] ??= value;
    }
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
