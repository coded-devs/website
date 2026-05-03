import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import UpdatesList, {
  type UpdateListPost,
} from "@/components/blog/UpdatesList";
import { blogPosts, db } from "@/db";

export const revalidate = 3600;

const title = "Updates — CodedDevs Technology LTD";
const description =
  "Product updates, announcements, and stories from the CodedDevs team.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://codeddevs.com/blog",
    siteName: "CodedDevs Technology LTD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

async function getPublishedPosts(): Promise<UpdateListPost[]> {
  try {
    const posts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        author: blogPosts.author,
        category: blogPosts.category,
        published_at: blogPosts.published_at,
        cover_url: blogPosts.cover_url,
      })
      .from(blogPosts)
      .where(eq(blogPosts.is_published, true))
      .orderBy(desc(blogPosts.published_at));

    return posts.map((post) => ({
      ...post,
      published_at: post.published_at?.toISOString() ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function UpdatesPage() {
  const posts = await getPublishedPosts();

  return (
    <main className="bg-white">
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-3xl space-y-6">
            <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-[56px]">
              Updates
            </h1>
            <p className="font-sans text-lg leading-[1.75] text-[#2C3A52]">
              Product updates, announcements, and stories from the CodedDevs
              team.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-5xl px-6">
          <UpdatesList posts={posts} />
        </div>
      </section>
    </main>
  );
}
