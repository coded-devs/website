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

export default function LatestReleasesSection({
  posts,
}: LatestReleasesSectionProps) {
  const isDev = process.env.NODE_ENV === "development";

  if (posts.length === 0) {
    if (isDev) {
      return (
        <section className="bg-white py-24 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
              Latest Releases
            </h2>
            <div className="mt-10 rounded-lg bg-[#F4F5F8] p-8 text-center font-sans text-sm text-[#6B7896]">
              No posts published yet — add one via the admin dashboard
            </div>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
          Latest Releases
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="flex h-full flex-col bg-[#F4F5F8]">
              <div className="flex h-full flex-col justify-between gap-8">
                <div className="space-y-4">
                  <h3 className="font-mono text-xl font-semibold leading-[1.3] text-[#121F38]">
                    {post.title}
                  </h3>
                  <p className="font-sans text-sm leading-[1.7] text-[#2C3A52]">
                    {post.excerpt}
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-4 font-sans text-xs">
                    <div>
                      <p className="font-medium uppercase text-[#6B7896]">
                        Date
                      </p>
                      <p className="mt-1 text-[#121F38]">
                        {formatDate(post.published_at)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium uppercase text-[#6B7896]">
                        Category
                      </p>
                      <div className="mt-2">
                        <Badge>{post.category}</Badge>
                      </div>
                    </div>
                  </div>

                  <Button asChild variant="ghost" className="px-0">
                    <Link href={`/blog/${post.slug}`}>
                      <span>{ctaByCategory[post.category]}</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
