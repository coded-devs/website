import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z, ZodError } from "zod";
import { careerApplications, careers } from "@/db/schema";
import { sendApplicationNotification } from "@/lib/email";

const applicationSchema = z.object({
  career_id: z.string().uuid(),
  full_name: z.string().min(2),
  email: z.string().email(),
  cover_letter: z.string().min(50),
  portfolio_url: z.string().url().optional(),
  github_url: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const data = applicationSchema.parse(body);
    const { db } = await import("@/db");

    const [career] = await db
      .select()
      .from(careers)
      .where(and(eq(careers.id, data.career_id), eq(careers.is_open, true)))
      .limit(1);

    if (!career) {
      return NextResponse.json(
        { error: "This position is no longer accepting applications" },
        { status: 404 },
      );
    }

    await db.insert(careerApplications).values(data);

    await sendApplicationNotification({
      ...data,
      career_title: career.title,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    console.error("Failed to process career application:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
