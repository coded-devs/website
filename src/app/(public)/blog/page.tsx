import type { Metadata } from "next";
import BlogList, { type BlogListPost } from "@/components/blog/BlogList";
import { getAllPublishedPosts } from "@/db/queries";

export const revalidate = 3600;

const title = "Blog — CodedDevs Technology LTD";
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

export default async function BlogPage() {
  const rows = await getAllPublishedPosts();

  // BlogList is a client component, so the Date has to cross the boundary as a
  // string. Serialising here keeps the component's props honest about it.
  const posts: BlogListPost[] = rows.map((post) => ({
    ...post,
    published_at: post.published_at?.toISOString() ?? null,
  }));

  return (
    <main id="main">
      <section className="pagehead">
        <div className="rail">
          <p className="eyebrow">Blog</p>
          <h1>Notes from the build</h1>
          <p className="pagehead__sub">
            Engineering notes, product announcements, and company stories from
            the team building software for African markets.
          </p>
        </div>
      </section>

      <section className="band">
        <div className="rail">
          <BlogList posts={posts} />
        </div>
      </section>
    </main>
  );
}
