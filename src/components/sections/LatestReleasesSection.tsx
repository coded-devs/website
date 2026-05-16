import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
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
  Announcement: "Read the announcement",
  Roadmap: "Read the roadmap",
  Story: "Read the story",
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Unscheduled";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function ReleasesIllustration() {
  return (
    <div className="relative isolate overflow-hidden rounded-[32px] border border-[#D1D6E0] bg-[#F4F5F8] p-8 sm:p-10">
      <div className="absolute left-6 top-6 h-3 w-3 rounded-full bg-[#121F38]/10" />
      <div className="absolute right-8 bottom-10 h-2 w-10 rounded-full bg-[#121F38]/10" />
      <div className="relative grid h-[340px] gap-4">
        <div className="rounded-[28px] border border-[#D1D6E0] bg-white p-5">
          <div className="h-3 w-24 rounded-full bg-[#D1E0E9]" />
          <div className="mt-4 grid gap-3">
            <div className="h-3 w-16 rounded-full bg-[#E1E6EC]" />
            <div className="h-3 w-10 rounded-full bg-[#E9EDF3]" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-[#D1D6E0] bg-white p-5">
            <div className="h-3 w-20 rounded-full bg-[#D1E0E9]" />
            <div className="mt-5 h-20 rounded-[24px] bg-[#E9EDF3]" />
          </div>
          <div className="rounded-[28px] border border-[#D1D6E0] bg-[#E9EDF3] p-5">
            <div className="h-3 w-14 rounded-full bg-[#D1D6E0]" />
            <div className="mt-5 h-20 rounded-[24px] bg-white" />
          </div>
        </div>

        <div className="rounded-[32px] border border-[#D1D6E0] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="h-3 w-16 rounded-full bg-[#D1E0E9]" />
            <div className="h-3 w-10 rounded-full bg-[#E1E6EC]" />
          </div>
          <div className="mt-5 grid gap-3">
            <div className="h-3 w-24 rounded-full bg-[#E9EDF3]" />
            <div className="h-3 w-14 rounded-full bg-[#E1E6EC]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LatestReleasesSection({
  posts,
}: LatestReleasesSectionProps) {
  const isDev = process.env.NODE_ENV === "development";

  if (posts.length === 0) {
    if (isDev) {
      return (
        <section className="bg-white py-24 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <div className="max-w-2xl space-y-4">
                  <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
                    Latest Releases
                  </h2>
                  <p className="font-sans text-base leading-[1.7] text-[#6B7896]">
                    Recent product updates, announcements, and roadmap notes from our engineering team.
                  </p>
                </div>
                <div className="rounded-[32px] border border-[#D1D6E0] bg-[#F4F5F8] p-8 text-sm text-[#6B7896]">
                  No posts published yet
                </div>
              </div>

              <ReleasesIllustration />
            </div>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="max-w-2xl space-y-4">
              <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
                Latest Releases
              </h2>
              <p className="font-sans text-base leading-[1.7] text-[#6B7896]">
                Recent product updates, announcements, and roadmap notes from our engineering team.
              </p>
            </div>

            <Card className="rounded-[32px] border-[#D1D6E0] bg-[#F4F5F8] p-6 shadow-none">
              <div className="space-y-5">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-[28px] border border-[#D1D6E0] bg-white p-6"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <Badge>{post.category}</Badge>
                        <p className="font-sans text-xs uppercase tracking-[0.18em] text-[#6B7896]">
                          {formatDate(post.published_at)}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-mono text-xl font-semibold leading-[1.3] text-[#121F38]">
                          {post.title}
                        </h3>
                        <p className="font-sans text-sm leading-[1.7] text-[#2C3A52]">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center justify-end">
                        <Button asChild variant="ghost" className="px-0">
                          <Link href={`/blog/${post.slug}`}>
                            <span>{ctaByCategory[post.category]}</span>
                            <ArrowRightIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          </div>

          <ReleasesIllustration />
        </div>
      </div>
    </section>
  );
}
