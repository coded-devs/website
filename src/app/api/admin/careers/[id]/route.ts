import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { careers, db } from "@/db";

const idSchema = z.string().uuid();
const careerUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(["full-time", "contract", "volunteer"]).optional(),
  location: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  requirements: z.string().min(1).optional(),
  is_open: z.boolean().optional(),
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

    const [career] = await db
      .select()
      .from(careers)
      .where(eq(careers.id, parsedId.data))
      .limit(1);

    if (!career) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(career, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch career:", error);
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
    const parsedBody = careerUpdateSchema.safeParse(await request.json());

    if (!parsedId.success || !parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsedBody.success ? undefined : parsedBody.error.flatten(),
        },
        { status: 400 },
      );
    }

    const [career] = await db
      .update(careers)
      .set({ ...parsedBody.data, updated_at: new Date() })
      .where(eq(careers.id, parsedId.data))
      .returning();

    if (!career) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(career, { status: 200 });
  } catch (error) {
    console.error("Failed to update career:", error);
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

    const [career] = await db
      .delete(careers)
      .where(eq(careers.id, parsedId.data))
      .returning({ id: careers.id });

    if (!career) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete career:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
