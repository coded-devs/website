import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, teamMembers } from "@/db";

const idSchema = z.string().uuid();
const teamMemberUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  bio: z.string().min(1).optional(),
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
  const params = await context.params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const params = await context.params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const params = await context.params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
