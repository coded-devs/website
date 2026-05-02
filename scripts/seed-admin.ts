import { existsSync, readFileSync } from "node:fs";
import { hash } from "bcryptjs";

function loadLocalEnv() {
  if (!existsSync(".env.local")) {
    return;
  }

  const envFile = readFileSync(".env.local", "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);

    if (match) {
      const value = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
      process.env[match[1].trim()] ??= value;
    }
  }
}

async function main() {
  loadLocalEnv();

  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    throw new Error(
      "Usage: pnpm dlx tsx scripts/seed-admin.ts admin@example.com secure-password",
    );
  }

  const { adminUsers, db } = await import("@/db");
  const password_hash = await hash(password, 12);

  await db.insert(adminUsers).values({
    email,
    password_hash,
  });

  console.log(`Admin user created successfully: ${email}`);
  console.log(
    "Run this once only. Delete this script or remove the credentials after use.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
