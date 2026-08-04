import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, teamMembers } from "@/db";
import { countWords, TEAM_BIO_MAX_WORDS } from "@/lib/utils";

const idSchema = z.string().uuid();

// See the create route: .trim() before .min(1) stops a whitespace-only value
// slipping past both the length check and the word-count check.
const requiredText = z.string().trim().min(1);

const bioSchema = requiredText.refine(
  (value) => countWords(value) <= TEAM_BIO_MAX_WORDS,
  { message: `Bio must be ${TEAM_BIO_MAX_WORDS} words or fewer` },
);

const teamMemberUpdateSchema = z.object({
  name: requiredText.optional(),
  role: requiredText.optional(),
  bio: bioSchema.optional(),
  photo_url: z.string().url().nullable().optional(),
  linkedin_url: z.string().url().nullable().optional(),
  github_url: z.string().url().nullable().optional(),
  twitter_url: z.string().url().nullable().optional(),
  order_index: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const parsedId = idSchema.safeParse(params.id);

    if (!parsedId.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [member] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, parsedId.data))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(member, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch team member:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const parsedId = idSchema.safeParse(params.id);
    const parsedBody = teamMemberUpdateSchema.safeParse(await request.json());

    if (!parsedId.success || !parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsedBody.success ? undefined : parsedBody.error.flatten(),
        },
        { status: 400 },
      );
    }

    const [member] = await db
      .update(teamMembers)
      .set({ ...parsedBody.data, updated_at: new Date() })
      .where(eq(teamMembers.id, parsedId.data))
      .returning();

    if (!member) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(member, { status: 200 });
  } catch (error) {
    console.error("Failed to update team member:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const parsedId = idSchema.safeParse(params.id);

    if (!parsedId.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [member] = await db
      .delete(teamMembers)
      .where(eq(teamMembers.id, parsedId.data))
      .returning({ id: teamMembers.id });

    if (!member) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete team member:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
