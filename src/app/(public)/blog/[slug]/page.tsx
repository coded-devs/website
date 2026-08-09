import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import PostContent, {
  type TiptapJson,
} from "@/components/blog/PostContent";
import PostCard from "@/components/blog/PostCard";
import Reveal from "@/components/ui/Reveal";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import {
  getAllPostSlugs,
  getLatestPosts,
  getPostBySlug,
} from "@/db/queries";
import { getBlogCoverUrl } from "@/lib/cloudinary";
import { formatDate, toDateTimeAttribute } from "@/lib/date";
import { getReadingTime, slugify } from "@/lib/utils";

export const revalidate = 3600;

const getCachedPostBySlug = cache(getPostBySlug);

type UpdatePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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
        headings.push({ id: slugify(text), text, level });
      }
    }

    node.content?.forEach(walk);
  }

  walk(content);

  return headings;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export async function generateStaticParams() {
  if (process.env.CI === "true") {
    return [];
  }

  return await getAllPostSlugs();
}

export async function generateMetadata({
  params,
}: UpdatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedPostBySlug(slug);

  if (!post) {
    return {
      title: "Blog Post — CodedDevs Blog",
    };
  }

  const title = `${post.title} — CodedDevs Blog`;
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
  const cover = getBlogCoverUrl(post.cover_url);
  const relatedPosts = latestPosts
    .filter((relatedPost) => relatedPost.slug !== post.slug)
    .slice(0, 3);

  return (
    <main id="main">
      <section className="pagehead pagehead--article">
        <div className="rail">
          <article className="article">
            <aside className="article__aside">
              <Link className="backlink" href="/blog">
                <ArrowLeftIcon aria-hidden="true" />
                <span>All posts</span>
              </Link>

              <div className="article__facts">
                <div>
                  <p className="article__factk">Published</p>
                  <p className="article__factv">
                    <time dateTime={toDateTimeAttribute(post.published_at)}>
                      {formatDate(post.published_at)}
                    </time>
                  </p>
                </div>
                <div>
                  <p className="article__factk">Read time</p>
                  <p className="article__factv">{readingTime}</p>
                </div>
              </div>

              {tableOfContents.length > 0 ? (
                <nav className="article__toc" aria-label="Article contents">
                  <p className="article__factk">Contents</p>
                  <ul>
                    {tableOfContents.map((heading) => (
                      <li key={heading.id} data-level={heading.level}>
                        <a href={`#${heading.id}`}>{heading.text}</a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </aside>

            <div className="article__main">
              <p className="eyebrow">{post.category}</p>
              <h1>{post.title}</h1>

              <div className="article__byline">
                <span className="article__avatar" aria-hidden="true">
                  {getInitials(post.author)}
                </span>
                <span className="article__author">{post.author}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={toDateTimeAttribute(post.published_at)}>
                  {formatDate(post.published_at)}
                </time>
              </div>

              {cover ? (
                <div className="article__cover">
                  <Image
                    src={cover}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 720px, 100vw"
                    priority
                  />
                </div>
              ) : null}

              <div className="article__body">
                <PostContent content={content} />
              </div>
            </div>
          </article>
        </div>
      </section>

      {relatedPosts.length > 0 ? (
        <section className="band band--mist" aria-labelledby="related-h2">
          <div className="rail">
            <Reveal className="sectionhead">
              <div>
                <p className="eyebrow">Keep reading</p>
                <h2 className="h2" id="related-h2">
                  More from the team
                </h2>
              </div>
              <Link className="link" href="/blog">
                View all posts
                <ArrowRightIcon width={16} height={16} aria-hidden="true" />
              </Link>
            </Reveal>

            <Reveal stagger className="related">
              {relatedPosts.map((relatedPost) => (
                <PostCard key={relatedPost.id} post={relatedPost} />
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}
    </main>
  );
}
