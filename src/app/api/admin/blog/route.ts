import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, blogPosts } from "@/db";
import { slugify } from "@/lib/utils";

const contentSchema = z
  .unknown()
  .refine((value) => value !== undefined && value !== null, {
    message: "Content is required",
  });

const blogPostCreateSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1).optional(),
  category: z.enum(["Product Update", "Announcement", "Roadmap", "Story"]),
  excerpt: z.string().trim().min(1),
  content: contentSchema,
  cover_url: z.string().url().nullable().optional(),
  author: z.string().trim().min(1).optional(),
  is_published: z.boolean().optional(),
  showInRecognition: z.boolean().optional().default(false),
  placement: z.enum(["1st", "2nd", "3rd", "winner"]).nullable().optional(),
  published_at: z.coerce.date().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.created_at));

    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
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
    const parsed = blogPostCreateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const shouldStampPublishedAt =
      parsed.data.is_published === true && !parsed.data.published_at;

    const [post] = await db
      .insert(blogPosts)
      .values({
        ...parsed.data,
        slug: slugify(parsed.data.slug ?? parsed.data.title),
        published_at: shouldStampPublishedAt
          ? new Date()
          : parsed.data.published_at,
      })
      .returning();

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Failed to create blog post:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
