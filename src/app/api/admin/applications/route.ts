import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { careerApplications, careers, db } from "@/db";

const statusSchema = z.enum(["pending", "reviewed", "rejected"]).optional();

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsedStatus = statusSchema.safeParse(
      searchParams.get("status") ?? undefined,
    );

    if (!parsedStatus.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsedStatus.error.flatten() },
        { status: 400 },
      );
    }

    const whereClause = parsedStatus.data
      ? eq(careerApplications.status, parsedStatus.data)
      : undefined;

    const applications = await db
      .select({
        id: careerApplications.id,
        career_id: careerApplications.career_id,
        career_title: careers.title,
        full_name: careerApplications.full_name,
        email: careerApplications.email,
        portfolio_url: careerApplications.portfolio_url,
        github_url: careerApplications.github_url,
        cover_letter: careerApplications.cover_letter,
        status: careerApplications.status,
        created_at: careerApplications.created_at,
      })
      .from(careerApplications)
      .leftJoin(careers, eq(careerApplications.career_id, careers.id))
      .where(whereClause)
      .orderBy(desc(careerApplications.created_at));

    return NextResponse.json(applications, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
