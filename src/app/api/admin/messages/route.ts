import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { contactSubmissions, db } from "@/db";

const isReadSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsedIsRead = isReadSchema.safeParse(
      searchParams.get("is_read") ?? undefined,
    );

    if (!parsedIsRead.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsedIsRead.error.flatten() },
        { status: 400 },
      );
    }

    const whereClause =
      typeof parsedIsRead.data === "boolean"
        ? eq(contactSubmissions.is_read, parsedIsRead.data)
        : undefined;

    const messages = await db
      .select()
      .from(contactSubmissions)
      .where(whereClause)
      .orderBy(desc(contactSubmissions.created_at));

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
