import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { blogPosts, db, products } from "@/db";

export const revalidate = 3600;

const baseUrl = "https://codeddevs.com";

const staticRoutes = [
  "",
  "/about",
  "/products",
  "/blog",
  "/team",
  "/careers",
  "/contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
  }));

  try {
    const [productEntries, postEntries] = await Promise.all([
      db
        .select({
          slug: products.slug,
          updated_at: products.updated_at,
        })
        .from(products)
        .orderBy(products.order_index),
      db
        .select({
          slug: blogPosts.slug,
          updated_at: blogPosts.updated_at,
        })
        .from(blogPosts)
        .where(eq(blogPosts.is_published, true))
        .orderBy(desc(blogPosts.published_at)),
    ]);

    return [
      ...staticEntries,
      ...productEntries.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updated_at,
      })),
      ...postEntries.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updated_at,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
