import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { getBlogCoverUrl } from "@/lib/cloudinary";
import type { BlogPost } from "@/types";

export type FeaturedStoryPost = Pick<
  BlogPost,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "author"
  | "category"
  | "published_at"
  | "cover_url"
>;

type FeaturedStorySectionProps = {
  post: FeaturedStoryPost | null;
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

export default function FeaturedStorySection({
  post,
}: FeaturedStorySectionProps) {
  if (!post) {
    if (process.env.NODE_ENV === "development") {
      return (
        <section className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 xl:px-12">
            <h2 className="font-mono text-3xl font-bold text-[#121F38] md:text-[40px]">
              Featured Story
            </h2>
            <p className="mt-8 font-sans text-sm text-[#6B7896]">
              Publish a blog post to feature the latest company story here.
            </p>
          </div>
        </section>
      );
    }

    return null;
  }

  return (
    <section id="featured-story" className="scroll-mt-24 bg-white py-20 md:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 xl:px-12">
        <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
          Featured Story
        </h2>

        <article className="mt-10 grid items-stretch border-y border-[#C4CAD6] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col justify-between gap-12 py-10 lg:pr-14">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>{post.category}</Badge>
                <span className="font-sans text-sm text-[#6B7896]">
                  {formatDate(post.published_at)}
                </span>
              </div>
              <div className="space-y-4">
                <h3 className="font-mono text-3xl font-bold leading-[1.15] text-[#121F38] md:text-4xl lg:text-5xl">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="max-w-2xl font-sans text-lg leading-[1.75] text-[#2C3A52]">
                  {post.excerpt}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-5">
              <p className="font-sans text-sm text-[#6B7896]">By {post.author}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-[#121F38] hover:text-[#1A2D4F]"
              >
                Read the story
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {post.cover_url ? (
            <Link
              href={`/blog/${post.slug}`}
              aria-label={`Read ${post.title}`}
              className="relative min-h-[300px] overflow-hidden bg-[#D1D6E0] lg:min-h-[520px]"
            >
              <Image
                src={getBlogCoverUrl(post.cover_url)}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </Link>
          ) : (
            <div className="flex min-h-[300px] items-end bg-[#121F38] p-8 lg:min-h-[520px] lg:p-12">
              <p className="max-w-md font-mono text-2xl font-semibold leading-[1.3] text-white md:text-3xl">
                Stories, releases, and progress from CodedDevs.
              </p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
