import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, teamMembers } from "@/db";
import { countWords, TEAM_BIO_MAX_WORDS } from "@/lib/utils";

const bioSchema = z
  .string()
  .min(1)
  .refine((value) => countWords(value) <= TEAM_BIO_MAX_WORDS, {
    message: `Bio must be ${TEAM_BIO_MAX_WORDS} words or fewer`,
  });

const teamMemberCreateSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  bio: bioSchema,
  photo_url: z.string().url().nullable().optional(),
  linkedin_url: z.string().url().nullable().optional(),
  github_url: z.string().url().nullable().optional(),
  twitter_url: z.string().url().nullable().optional(),
  order_index: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const members = await db
      .select()
      .from(teamMembers)
      .orderBy(asc(teamMembers.order_index));

    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch team members:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = teamMemberCreateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const [member] = await db
      .insert(teamMembers)
      .values(parsed.data)
      .returning();

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Failed to create team member:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
