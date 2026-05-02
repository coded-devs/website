import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { careers, db } from "@/db";

const careerCreateSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["full-time", "contract", "volunteer"]),
  location: z.string().min(1).optional(),
  description: z.string().min(1),
  requirements: z.string().min(1),
  is_open: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const careerList = await db
      .select()
      .from(careers)
      .orderBy(desc(careers.created_at));

    return NextResponse.json(careerList, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch careers:", error);
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
    const parsed = careerCreateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const [career] = await db.insert(careers).values(parsed.data).returning();

    return NextResponse.json(career, { status: 201 });
  } catch (error) {
    console.error("Failed to create career:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
