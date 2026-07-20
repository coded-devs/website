"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getBlogThumbnailUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/types";

type BlogCategory = BlogPost["category"];
type FilterValue = "All" | "Featured" | "Popular" | BlogCategory;

export type BlogListPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  category: BlogCategory;
  published_at: string | null;
  cover_url: string | null;
};

type BlogListProps = {
  posts: BlogListPost[];
};

const filters: Array<{ label: string; value: FilterValue }> = [
  { label: "All", value: "All" },
  { label: "Announcements", value: "Announcement" },
  { label: "Featured", value: "Featured" },
  { label: "Popular", value: "Popular" },
  { label: "Product", value: "Product Update" },
];

const ctaByCategory: Record<BlogCategory, string> = {
  "Product Update": "Read the product note",
  Announcement: "Read the announcement",
  Roadmap: "Read the roadmap",
  Story: "Read the story",
};

function formatDate(date: string | null) {
  if (!date) {
    return "Unscheduled";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function postMatchesQuery(post: BlogListPost, query: string) {
  const searchableText = [
    post.title,
    post.excerpt,
    post.author,
    post.category,
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query.toLowerCase());
}

function BlogCover({ post, priority = false }: { post: BlogListPost; priority?: boolean }) {
  const imageUrl = getBlogThumbnailUrl(post.cover_url);

  if (!imageUrl) {
    return (
      <div className="flex aspect-[16/9] items-end rounded-lg bg-[#D1D6E0] p-5">
        <p className="max-w-[12rem] font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[#121F38]">
          CodedDevs Blog
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-[#D1D6E0]">
      <Image
        src={imageUrl}
        alt={post.title}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}

function BlogCard({
  post,
  priority = false,
  compact = false,
}: {
  post: BlogListPost;
  priority?: boolean;
  compact?: boolean;
}) {
  return (
    <article className="group flex h-full flex-col rounded-lg border border-transparent bg-white p-0">
      <Link href={`/blog/${post.slug}`} aria-label={post.title}>
        <BlogCover post={post} priority={priority} />
      </Link>

      <div className="flex flex-1 flex-col pt-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="font-sans text-sm text-[#6B7896]">
            {formatDate(post.published_at)}
          </span>
          <span className="h-1 w-1 rounded-full bg-[#C4CAD6]" />
          <Badge>{post.category}</Badge>
        </div>

        <div className="space-y-3">
          <h2
            className={cn(
              "font-mono font-semibold leading-[1.25] text-[#121F38]",
              compact ? "text-lg md:text-xl" : "text-xl md:text-2xl",
            )}
          >
            <Link href={`/blog/${post.slug}`} className="hover:text-[#1A2D4F]">
              {post.title}
            </Link>
          </h2>
          <p className="line-clamp-3 font-sans text-base leading-[1.7] text-[#2C3A52]">
            {post.excerpt}
          </p>
        </div>

        <div className="mt-7 flex items-center justify-between gap-4 border-t border-[#C4CAD6] pt-4">
          <p className="font-sans text-sm text-[#6B7896]">By {post.author}</p>
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-2 font-sans text-sm font-medium text-[#121F38] hover:text-[#1A2D4F]"
          >
            <span>{ctaByCategory[post.category]}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function FeaturedArticle({ post }: { post: BlogListPost }) {
  return (
    <article className="grid overflow-hidden rounded-lg border border-[#C4CAD6] bg-[#F4F5F8] lg:grid-cols-[1.08fr_0.92fr]">
      <Link href={`/blog/${post.slug}`} aria-label={post.title}>
        <BlogCover post={post} priority />
      </Link>

      <div className="flex flex-col justify-between gap-10 p-6 md:p-8 lg:p-10">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-sans text-sm text-[#6B7896]">
              {formatDate(post.published_at)}
            </span>
            <span className="h-1 w-1 rounded-full bg-[#C4CAD6]" />
            <Badge>{post.category}</Badge>
          </div>
          <div className="space-y-4">
            <h2 className="font-mono text-2xl font-bold leading-[1.2] text-[#121F38] md:text-3xl lg:text-[40px]">
              <Link href={`/blog/${post.slug}`} className="hover:text-[#1A2D4F]">
                {post.title}
              </Link>
            </h2>
            <p className="font-sans text-lg leading-[1.75] text-[#2C3A52]">
              {post.excerpt}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#C4CAD6] pt-5">
          <p className="font-sans text-sm text-[#6B7896]">By {post.author}</p>
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-2 font-sans text-sm font-medium text-[#121F38] hover:text-[#1A2D4F]"
          >
            <span>{ctaByCategory[post.category]}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function BlogList({ posts }: BlogListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(9);

  const filteredPosts = useMemo(() => {
    const categoryFiltered =
      activeFilter === "All" || activeFilter === "Featured" || activeFilter === "Popular"
        ? posts
        : posts.filter((post) => post.category === activeFilter);

    const queryFiltered = query.trim()
      ? categoryFiltered.filter((post) => postMatchesQuery(post, query.trim()))
      : categoryFiltered;

    return activeFilter === "Featured"
      ? queryFiltered.slice(0, 3)
      : activeFilter === "Popular"
        ? queryFiltered.slice(0, 6)
      : queryFiltered;
  }, [activeFilter, posts, query]);

  const featuredPosts = filteredPosts.slice(0, 3);
  const allPosts = filteredPosts;
  const visiblePosts = allPosts.slice(0, visibleCount);
  const hasMorePosts = visiblePosts.length < allPosts.length;
  const leadPost = posts[0];

  return (
    <div className="space-y-16 md:space-y-20">
      {leadPost ? <FeaturedArticle post={leadPost} /> : null}

      <div className="mx-auto max-w-4xl space-y-5">
        <label
          htmlFor="blog-search"
          className="sr-only"
        >
          Search blog posts
        </label>
        <div className="flex items-center gap-3 rounded-full border border-[#C4CAD6] bg-white px-5 py-4 shadow-sm">
          <Search className="h-5 w-5 text-[#6B7896]" aria-hidden="true" />
          <input
            id="blog-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles"
            className="w-full bg-transparent font-sans text-base text-[#121F38] outline-none placeholder:text-[#6B7896]"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {filters.map((filter) => {
            const isActive = filter.value === activeFilter;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setActiveFilter(filter.value);
                  setVisibleCount(9);
                }}
                className={cn(
                  "rounded-full border px-4 py-2 font-sans text-sm font-medium",
                  isActive
                    ? "border-[#121F38] bg-[#121F38] text-white"
                    : "border-[#C4CAD6] bg-[#F4F5F8] text-[#121F38] hover:bg-[#D1D6E0]",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {featuredPosts.length > 0 ? (
        <section className="space-y-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-mono text-3xl font-bold text-[#121F38] md:text-[40px]">
              Featured
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post, index) => (
              <BlogCard
                key={post.id}
                post={post}
                priority={index === 0}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-mono text-3xl font-bold text-[#121F38] md:text-[40px]">
              All articles
            </h2>
            <p className="mt-2 font-sans text-sm text-[#6B7896]">
              Browse every published post from CodedDevs.
            </p>
          </div>
          <p className="font-sans text-sm text-[#6B7896]">
            {allPosts.length} {allPosts.length === 1 ? "article" : "articles"}
          </p>
        </div>

        {allPosts.length > 0 ? (
          <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {visiblePosts.map((post) => (
              <BlogCard key={post.id} post={post} compact />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-[#C4CAD6] bg-[#F4F5F8] p-8 text-center">
            <p className="font-sans text-base leading-[1.7] text-[#2C3A52]">
              No blog posts published yet. Check back soon.
            </p>
          </div>
        )}

        {hasMorePosts ? (
          <div className="flex justify-center pt-6">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setVisibleCount((count) => count + 6)}
            >
              Load more articles
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
