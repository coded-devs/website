import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, blogPosts } from "@/db";
import { slugify } from "@/lib/utils";

const idSchema = z.string().uuid();
const contentSchema = z
  .unknown()
  .refine((value) => value !== undefined && value !== null, {
    message: "Content is required",
  });
const blogPostUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  category: z
    .enum(["Product Update", "Announcement", "Roadmap", "Story"])
    .optional(),
  excerpt: z.string().min(1).optional(),
  content: contentSchema.optional(),
  cover_url: z.string().url().nullable().optional(),
  author: z.string().min(1).optional(),
  is_published: z.boolean().optional(),
  showInRecognition: z.boolean().optional(),
  placement: z.enum(["1st", "2nd", "3rd", "winner"]).nullable().optional(),
  published_at: z.coerce.date().nullable().optional(),
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

    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, parsedId.data))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
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
    const parsedBody = blogPostUpdateSchema.safeParse(await request.json());

    if (!parsedId.success || !parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsedBody.success ? undefined : parsedBody.error.flatten(),
        },
        { status: 400 },
      );
    }

    const [existingPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, parsedId.data))
      .limit(1);

    if (!existingPost) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData = {
      ...parsedBody.data,
      slug: parsedBody.data.slug ? slugify(parsedBody.data.slug) : undefined,
      updated_at: new Date(),
    };

    if (
      parsedBody.data.is_published === true &&
      existingPost.published_at === null &&
      parsedBody.data.published_at === undefined
    ) {
      updateData.published_at = new Date();
    }

    const [post] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, parsedId.data))
      .returning();

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error("Failed to update blog post:", error);
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

    const [post] = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, parsedId.data))
      .returning({ id: blogPosts.id });

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
