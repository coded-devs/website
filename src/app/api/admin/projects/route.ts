import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, projects } from "@/db";

const projectCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  cover_url: z.string().url().nullable().optional(),
  external_url: z.string().url().nullable().optional(),
  github_url: z.string().url().nullable().optional(),
  status: z.enum(["development", "live", "archived"]),
  is_featured: z.boolean().optional(),
  order_index: z.number().int().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projectList = await db
      .select()
      .from(projects)
      .orderBy(asc(projects.order_index));

    return NextResponse.json(projectList, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
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
    const parsed = projectCreateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const [project] = await db
      .insert(projects)
      .values(parsed.data)
      .returning();

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
