"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import PostCard, { PostMeta } from "@/components/blog/PostCard";
import { ArrowRightIcon, SearchIcon } from "@/components/ui/icons";
import { getBlogThumbnailUrl } from "@/lib/cloudinary";
import type { BlogPost } from "@/types";

type BlogCategory = BlogPost["category"];
type FilterValue = "All" | BlogCategory;

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
  { label: "Product Update", value: "Product Update" },
  { label: "Announcement", value: "Announcement" },
  { label: "Roadmap", value: "Roadmap" },
  { label: "Story", value: "Story" },
];

const PAGE_SIZE = 9;

function postMatchesQuery(post: BlogListPost, query: string) {
  return [post.title, post.excerpt, post.author, post.category]
    .join(" ")
    .toLowerCase()
    .includes(query.toLowerCase());
}

/**
 * The newest post, at full width. Only ever rendered for the unfiltered,
 * unsearched view — promoting an arbitrary result to "lead" once someone has
 * filtered is a lie about ranking, and it was the source of the old triple
 * render (lead + featured + all, from one list).
 */
function LeadPost({ post }: { post: BlogListPost }) {
  const src = getBlogThumbnailUrl(post.cover_url);

  return (
    <article className="bloglead">
      <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true">
        <div className="cover cover--wide">
          {src ? (
            <Image
              src={src}
              alt=""
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              priority
            />
          ) : (
            <span className="cover__ph cover__ph--post" aria-hidden="true">
              CodedDevs
            </span>
          )}
        </div>
      </Link>

      <div>
        <PostMeta category={post.category} publishedAt={post.published_at} />

        <h2 className="bloglead__title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>

        <p className="bloglead__excerpt">{post.excerpt}</p>

        <div className="bloglead__foot">
          <span className="bloglead__by">By {post.author}</span>
          <Link className="link" href={`/blog/${post.slug}`}>
            Read the post
            <ArrowRightIcon width={16} height={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function BlogList({ posts }: BlogListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const trimmedQuery = query.trim();
  const isBrowsing = activeFilter === "All" && trimmedQuery === "";

  const filteredPosts = useMemo(() => {
    const byCategory =
      activeFilter === "All"
        ? posts
        : posts.filter((post) => post.category === activeFilter);

    return trimmedQuery
      ? byCategory.filter((post) => postMatchesQuery(post, trimmedQuery))
      : byCategory;
  }, [activeFilter, posts, trimmedQuery]);

  // Each post appears exactly once: the lead is sliced OFF the grid, never
  // repeated in it.
  const lead = isBrowsing ? filteredPosts[0] : undefined;
  const gridPosts = lead ? filteredPosts.slice(1) : filteredPosts;
  const visiblePosts = gridPosts.slice(0, visibleCount);
  const hasMore = visiblePosts.length < gridPosts.length;

  function resetPaging() {
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <>
      <div className="blogsearch">
        <SearchIcon aria-hidden="true" />
        <label className="sr-only" htmlFor="blog-search">
          Search blog posts
        </label>
        <input
          id="blog-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            resetPaging();
          }}
          placeholder="Search articles"
        />
      </div>

      <div className="filterbar" role="group" aria-label="Filter by category">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className="filterbar__btn"
            aria-pressed={filter.value === activeFilter}
            onClick={() => {
              setActiveFilter(filter.value);
              resetPaging();
            }}
          >
            {filter.label}
          </button>
        ))}

        <p className="filterbar__count" aria-live="polite">
          {filteredPosts.length}{" "}
          {filteredPosts.length === 1 ? "article" : "articles"}
        </p>
      </div>

      {lead ? <LeadPost post={lead} /> : null}

      {/* Guarded, not always-rendered: with a single post the lead consumes the
          whole list, and an empty .postgrid would still draw its separator. */}
      {visiblePosts.length > 0 ? (
        <div className="postgrid">
          {visiblePosts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              priority={!lead && index === 0}
            />
          ))}
        </div>
      ) : null}

      {/* Two different situations, and only one of them is an empty state. A
          search that matches nothing needs an answer in production — silence
          reads as a broken filter. An empty database is the dev-only
          .emptystate per AGENTS.md, and ships as nothing at all. */}
      {filteredPosts.length > 0 ? null : posts.length > 0 ? (
        <p className="postgrid__empty">
          No posts match that search. Try another category or term.
        </p>
      ) : process.env.NODE_ENV === "development" ? (
        <p className="emptystate">
          No posts published yet — add one via the admin dashboard.
        </p>
      ) : null}

      {hasMore ? (
        <div className="blogmore">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setVisibleCount((count) => count + 6)}
          >
            Load more articles
          </button>
        </div>
      ) : null}
    </>
  );
}
