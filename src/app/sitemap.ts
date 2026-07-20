import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { blogPosts, db } from "@/db";

export const revalidate = 3600;

const baseUrl = "https://codeddevs.com";

const staticRoutes = [
  "",
  "/blog",
  "/team",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
  }));

  try {
    const postEntries = await db
      .select({
        slug: blogPosts.slug,
        updated_at: blogPosts.updated_at,
      })
      .from(blogPosts)
      .where(eq(blogPosts.is_published, true))
      .orderBy(desc(blogPosts.published_at));

    return [
      ...staticEntries,
      ...postEntries.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updated_at,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
