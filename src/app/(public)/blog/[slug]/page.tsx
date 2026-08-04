import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { desc, eq } from "drizzle-orm";
import PostContent, {
  type TiptapJson,
} from "@/components/blog/PostContent";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { blogPosts, db } from "@/db";
import { getLatestPosts, getPostBySlug } from "@/db/queries";
import { getBlogCoverUrl, getBlogThumbnailUrl } from "@/lib/cloudinary";
import { getReadingTime, slugify } from "@/lib/utils";

export const revalidate = 3600;

const getCachedPostBySlug = cache(getPostBySlug);

type UpdatePageProps = {
  params: Promise<{
    slug: string;
  }>;
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

function isTiptapJson(value: unknown): value is TiptapJson {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNodeText(node: TiptapJson): string {
  const ownText = typeof node.text === "string" ? node.text : "";
  const childText = Array.isArray(node.content)
    ? node.content.map(getNodeText).join(" ")
    : "";

  return `${ownText} ${childText}`.trim();
}

function getTableOfContents(content: TiptapJson) {
  const headings: Array<{ id: string; text: string; level: number }> = [];

  function walk(node: TiptapJson) {
    if (node.type === "heading") {
      const text = getNodeText(node);
      const level =
        typeof node.attrs?.level === "number" ? node.attrs.level : 2;

      if (text) {
        headings.push({
          id: slugify(text),
          text,
          level,
        });
      }
    }

    node.content?.forEach(walk);
  }

  walk(content);

  return headings;
}

export async function generateStaticParams() {
  if (process.env.CI === "true") {
    return [];
  }

  try {
    const postSlugs = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.is_published, true))
      .orderBy(desc(blogPosts.published_at));

    return postSlugs;
  } catch (error) {
    console.error("[blog/[slug]] generateStaticParams failed:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: UpdatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedPostBySlug(slug);

  if (!post) {
    return {
      title: "Blog Post - CodedDevs Blog",
    };
  }

  const title = `${post.title} - CodedDevs Blog`;
  const description = post.excerpt;
  const url = `https://codeddevs.com/blog/${post.slug}`;
  const images = post.cover_url ? [getBlogCoverUrl(post.cover_url)] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "CodedDevs Technology LTD",
      type: "article",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function UpdatePage({ params }: UpdatePageProps) {
  const { slug } = await params;
  const [post, latestPosts] = await Promise.all([
    getCachedPostBySlug(slug),
    getLatestPosts(4),
  ]);

  if (!post) {
    notFound();
  }

  const content = isTiptapJson(post.content)
    ? post.content
    : { type: "doc", content: [] };
  const readingTime = getReadingTime(post.content);
  const tableOfContents = getTableOfContents(content);
  const relatedPosts = latestPosts
    .filter((relatedPost) => relatedPost.slug !== post.slug)
    .slice(0, 3);

  return (
    <main className="bg-white">
      <article className="pb-24 md:pb-32">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="order-2 lg:order-1">
              <div className="space-y-8 lg:sticky lg:top-28">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 font-sans text-sm font-medium text-[#121F38] hover:text-[#1A2D4F]"
                >
                  <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                  <span>Back to blog</span>
                </Link>

                <div className="grid grid-cols-2 gap-4 border-y border-[#C4CAD6] py-5 lg:grid-cols-1">
                  <div>
                    <p className="font-sans text-xs font-medium uppercase text-[#6B7896]">
                      Published
                    </p>
                    <p className="mt-1 font-sans text-sm text-[#121F38]">
                      {formatDate(post.published_at)}
                    </p>
                  </div>
                  <div>
                    <p className="font-sans text-xs font-medium uppercase text-[#6B7896]">
                      Read time
                    </p>
                    <p className="mt-1 font-sans text-sm text-[#121F38]">
                      {readingTime}
                    </p>
                  </div>
                </div>

                {tableOfContents.length > 0 ? (
                  <nav aria-label="Article contents" className="space-y-3">
                    <p className="font-sans text-xs font-medium uppercase text-[#6B7896]">
                      Contents
                    </p>
                    <ul className="space-y-2 border-l border-[#C4CAD6] pl-4">
                      {tableOfContents.map((heading) => (
                        <li key={heading.id}>
                          <a
                            href={`#${heading.id}`}
                            className="block font-sans text-sm leading-[1.5] text-[#6B7896] hover:text-[#121F38]"
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ) : null}
              </div>
            </aside>

            <div className="order-1 min-w-0 lg:order-2">
              <header className="mx-auto max-w-3xl space-y-6">
                <Badge>{post.category}</Badge>
                <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-[56px]">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 font-sans text-sm leading-[1.6] text-[#6B7896]">
                  <span>By {post.author}</span>
                  <span className="h-1 w-1 rounded-full bg-[#C4CAD6]" />
                  <span>{formatDate(post.published_at)}</span>
                  <span className="h-1 w-1 rounded-full bg-[#C4CAD6]" />
                  <span>{readingTime}</span>
                </div>
              </header>

              {post.cover_url ? (
                <div className="relative mt-12 aspect-[1200/630] w-full overflow-hidden rounded-lg bg-[#F4F5F8]">
                  <Image
                    src={getBlogCoverUrl(post.cover_url)}
                    alt={post.title}
                    fill
                    sizes="(min-width: 1024px) 804px, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
              ) : null}

              <div className="mx-auto mt-12 max-w-3xl border-t border-[#C4CAD6] pt-10">
                <PostContent content={content} />
              </div>
            </div>
          </div>
        </div>
      </article>

      {relatedPosts.length > 0 ? (
        <section className="border-t border-[#C4CAD6] bg-[#F4F5F8] py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-mono text-2xl font-bold text-[#121F38] md:text-3xl">
                  Keep reading
                </h2>
                <p className="mt-2 font-sans text-sm text-[#6B7896]">
                  More notes from the CodedDevs team.
                </p>
              </div>
              <Button asChild variant="secondary">
                <Link href="/blog">
                  <span>View all posts</span>
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <article
                  key={relatedPost.id}
                  className="flex h-full flex-col rounded-lg border border-[#C4CAD6] bg-white p-5"
                >
                  {relatedPost.cover_url ? (
                    <div className="relative mb-5 aspect-[16/9] overflow-hidden rounded-md bg-[#D1D6E0]">
                      <Image
                        src={getBlogThumbnailUrl(relatedPost.cover_url)}
                        alt={relatedPost.title}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Badge>{relatedPost.category}</Badge>
                    <span className="font-sans text-xs text-[#6B7896]">
                      {formatDate(relatedPost.published_at)}
                    </span>
                  </div>
                  <h3 className="font-mono text-lg font-semibold leading-[1.3] text-[#121F38]">
                    <Link
                      href={`/blog/${relatedPost.slug}`}
                      className="hover:text-[#1A2D4F]"
                    >
                      {relatedPost.title}
                    </Link>
                  </h3>
                  <p className="mt-3 line-clamp-3 font-sans text-sm leading-[1.7] text-[#2C3A52]">
                    {relatedPost.excerpt}
                  </p>
                  <Link
                    href={`/blog/${relatedPost.slug}`}
                    className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-medium text-[#121F38] hover:text-[#1A2D4F]"
                  >
                    <span>Read post</span>
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
