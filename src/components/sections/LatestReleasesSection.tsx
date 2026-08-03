import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { BlogPost } from "@/types";

export type LatestReleasePost = Pick<
  BlogPost,
  "id" | "title" | "slug" | "excerpt" | "category" | "published_at"
>;

type LatestReleasesSectionProps = {
  posts: LatestReleasePost[];
};

const ctaByCategory: Record<BlogPost["category"], string> = {
  "Product Update": "Read the update",
  Announcement: "Read announcement",
  Roadmap: "Read roadmap",
  Story: "Read story",
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Unscheduled";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function LatestReleasesSection({
  posts,
}: LatestReleasesSectionProps) {
  const isDev = process.env.NODE_ENV === "development";

  if (posts.length === 0) {
    if (isDev) {
      return (
        <section
          id="latest-releases"
          className="scroll-mt-24 bg-white py-24 md:py-28"
        >
          <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 xl:px-12">
            <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
              Latest Releases
            </h2>
            <div className="mt-10 bg-[#F4F5F8] p-8 text-center font-sans text-sm text-[#6B7896]">
              No posts published yet. Add one via the admin dashboard.
            </div>
          </div>
        </section>
      );
    }

    return null;
  }

  return (
    <section
      id="latest-releases"
      className="scroll-mt-24 bg-white py-24 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#C98A3A]">
              Blog
            </p>
            <h2 className="mt-3 font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
              Latest Releases
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-[#121F38] hover:text-[#1A2D4F]"
          >
            View all posts
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="flex min-h-[460px] flex-col justify-between border border-[#C4CAD6] bg-[#F4F5F8] p-8"
            >
              <div className="space-y-4">
                <h3 className="font-mono text-2xl font-bold leading-[1.25] text-[#121F38]">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="font-sans text-lg leading-7 text-[#121F38]">
                  {post.excerpt}
                </p>
              </div>

              <div className="space-y-8">
                <div className="space-y-0 font-sans text-sm text-[#121F38]">
                  <div className="grid grid-cols-[90px_1fr] border-y border-[#C4CAD6] py-4">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">
                      Date
                    </p>
                    <p className="text-right">{formatDate(post.published_at)}</p>
                  </div>
                  <div className="grid grid-cols-[90px_1fr] border-b border-[#C4CAD6] py-4">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">
                      Category
                    </p>
                    <p className="text-right">{post.category}</p>
                  </div>
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 rounded-md bg-[#121F38] px-4 py-3 font-sans text-sm font-semibold text-white hover:bg-[#1A2D4F]"
                >
                  <span>{ctaByCategory[post.category]}</span>
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
