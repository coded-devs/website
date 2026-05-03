import { and, desc, eq } from "drizzle-orm";
import { blogPosts, db } from "@/db";

const blogPostSummaryColumns = {
  id: blogPosts.id,
  title: blogPosts.title,
  slug: blogPosts.slug,
  excerpt: blogPosts.excerpt,
  author: blogPosts.author,
  category: blogPosts.category,
  published_at: blogPosts.published_at,
  cover_url: blogPosts.cover_url,
};

export async function getLatestPosts(limit: number) {
  try {
    return await db
      .select(blogPostSummaryColumns)
      .from(blogPosts)
      .where(eq(blogPosts.is_published, true))
      .orderBy(desc(blogPosts.published_at))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function getRecognitionPosts(limit: number) {
  try {
    return await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      category: blogPosts.category,
      placement: blogPosts.placement,
      published_at: blogPosts.published_at,
    })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.is_published, true),
          eq(blogPosts.showInRecognition, true),
        ),
      )
      .orderBy(desc(blogPosts.published_at))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.is_published, true)))
      .limit(1);

    return post ?? null;
  } catch {
    return null;
  }
}

export async function getAllPublishedPosts() {
  try {
    return await db
      .select(blogPostSummaryColumns)
      .from(blogPosts)
      .where(eq(blogPosts.is_published, true))
      .orderBy(desc(blogPosts.published_at));
  } catch {
    return [];
  }
}
