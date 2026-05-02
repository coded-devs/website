import { hash } from "bcryptjs";
import { adminUsers, db } from "@/db";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  throw new Error(
    "Usage: pnpm tsx scripts/seed-admin.ts admin@example.com secure-password",
  );
}

const password_hash = await hash(password, 12);

await db.insert(adminUsers).values({
  email,
  password_hash,
});

console.log(`Admin user created successfully: ${email}`);
console.log(
  "Run this once only. Delete this script or remove the credentials after use.",
);
