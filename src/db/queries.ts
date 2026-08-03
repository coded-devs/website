import { and, asc, eq, sql } from "drizzle-orm";
import { blogPosts, db, products } from "@/db";

// Postgres treats NULL as larger than any value, so a plain DESC sort puts
// unpublished-date posts first. NULLS LAST keeps them at the bottom.
const newestFirst = sql`${blogPosts.published_at} DESC NULLS LAST`;

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
      .orderBy(newestFirst)
      .limit(limit);
  } catch (error) {
    console.error("[queries] getLatestPosts failed:", error);
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
      .orderBy(newestFirst)
      .limit(limit);
  } catch (error) {
    console.error("[queries] getRecognitionPosts failed:", error);
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
  } catch (error) {
    console.error("[queries] getPostBySlug failed:", error);
    return null;
  }
}

export async function getAllPublishedPosts() {
  try {
    return await db
      .select(blogPostSummaryColumns)
      .from(blogPosts)
      .where(eq(blogPosts.is_published, true))
      .orderBy(newestFirst);
  } catch (error) {
    console.error("[queries] getAllPublishedPosts failed:", error);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Products                                                                    */
/* -------------------------------------------------------------------------- */

const productSummaryColumns = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  tagline: products.tagline,
  cover_url: products.cover_url,
  external_url: products.external_url,
  status: products.status,
};

export async function getAllProducts() {
  try {
    return await db
      .select(productSummaryColumns)
      .from(products)
      .orderBy(asc(products.order_index));
  } catch (error) {
    console.error("[queries] getAllProducts failed:", error);
    return [];
  }
}

export async function getFeaturedProducts() {
  try {
    return await db
      .select(productSummaryColumns)
      .from(products)
      .where(eq(products.is_featured, true))
      .orderBy(asc(products.order_index));
  } catch (error) {
    console.error("[queries] getFeaturedProducts failed:", error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    return product ?? null;
  } catch (error) {
    console.error("[queries] getProductBySlug failed:", error);
    return null;
  }
}

export async function getAllProductSlugs() {
  try {
    return await db
      .select({ slug: products.slug })
      .from(products)
      .orderBy(asc(products.order_index));
  } catch (error) {
    console.error("[queries] getAllProductSlugs failed:", error);
    return [];
  }
}
