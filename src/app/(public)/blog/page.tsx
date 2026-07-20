import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import BlogList, {
  type BlogListPost,
} from "@/components/blog/UpdatesList";
import { blogPosts, db } from "@/db";

export const revalidate = 3600;

const title = "Blog - CodedDevs Technology LTD";
const description =
  "Blog posts, announcements, and stories from the CodedDevs team.";

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

async function getPublishedPosts(): Promise<BlogListPost[]> {
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

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <main className="bg-white">
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-4xl space-y-6 text-center">
            <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-5xl lg:text-[64px]">
              CodedDevs Blog
            </h1>
            <p className="mx-auto max-w-2xl font-sans text-lg leading-[1.75] text-[#2C3A52]">
              Engineering notes, product announcements, and company stories
              from the team building software for African markets.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <BlogList posts={posts} />
        </div>
      </section>
    </main>
  );
}
