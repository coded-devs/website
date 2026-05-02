import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, projects } from "@/db";

const idSchema = z.string().uuid();
const projectUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  tagline: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  cover_url: z.string().url().nullable().optional(),
  external_url: z.string().url().nullable().optional(),
  github_url: z.string().url().nullable().optional(),
  status: z.enum(["development", "live", "archived"]).optional(),
  is_featured: z.boolean().optional(),
  order_index: z.number().int().optional(),
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsedId = idSchema.safeParse(params.id);

    if (!parsedId.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, parsedId.data))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsedId = idSchema.safeParse(params.id);
    const parsedBody = projectUpdateSchema.safeParse(await request.json());

    if (!parsedId.success || !parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsedBody.success ? undefined : parsedBody.error.flatten(),
        },
        { status: 400 },
      );
    }

    const [project] = await db
      .update(projects)
      .set({ ...parsedBody.data, updated_at: new Date() })
      .where(eq(projects.id, parsedId.data))
      .returning();

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsedId = idSchema.safeParse(params.id);

    if (!parsedId.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [project] = await db
      .delete(projects)
      .where(eq(projects.id, parsedId.data))
      .returning({ id: projects.id });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
