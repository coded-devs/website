"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/types";

type UpdateCategory = BlogPost["category"];
type FilterCategory = "All" | UpdateCategory;

export type UpdateListPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  category: UpdateCategory;
  published_at: string | null;
  cover_url: string | null;
};

type UpdatesListProps = {
  posts: UpdateListPost[];
};

const filters: FilterCategory[] = [
  "All",
  "Product Update",
  "Announcement",
  "Roadmap",
  "Story",
];

const ctaByCategory: Record<UpdateCategory, string> = {
  "Product Update": "Read the update",
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

export default function UpdatesList({ posts }: UpdatesListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All");

  const filteredPosts = useMemo(() => {
    if (activeFilter === "All") {
      return posts;
    }

    return posts.filter((post) => post.category === activeFilter);
  }, [activeFilter, posts]);

  if (posts.length === 0) {
    return (
      <div className="space-y-12">
        <div className="flex flex-wrap items-center gap-6 border-b border-[#C4CAD6] pb-px">
          {filters.map((filter) => {
            const isActive = filter === activeFilter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "cursor-pointer select-none -mb-px border-b pb-3 font-sans text-[13px] font-medium transition-colors",
                  isActive
                    ? "border-[#121F38] text-[#121F38]"
                    : "border-transparent text-[#6B7896] hover:text-[#121F38]"
                )}
              >
                {filter}
              </button>
            );
          })}
        </div>
        
        <div className="rounded-md border border-[#C4CAD6] bg-[#F4F5F8] p-8 md:p-12">
          <div className="mx-auto max-w-xl text-center space-y-4">
            <span className="font-mono text-[13px] font-medium uppercase tracking-wider text-[#6B7896]">
              Awaiting first post
            </span>
            <p className="font-sans text-[15px] leading-relaxed text-[#2C3A52]">
              No updates have been published yet. The latest company news, product releases, and engineering stories will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center gap-6 border-b border-[#C4CAD6] pb-px">
        {filters.map((filter) => {
          const isActive = filter === activeFilter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "cursor-pointer select-none -mb-px border-b pb-3 font-sans text-[13px] font-medium transition-colors",
                isActive
                  ? "border-[#121F38] text-[#121F38]"
                  : "border-transparent text-[#6B7896] hover:text-[#121F38]",
              )}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="group relative flex h-full flex-col justify-between rounded-md border border-[#C4CAD6] bg-white p-6 md:p-8"
            >
              <article className="flex h-full flex-col justify-between gap-8">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2.5 font-sans text-[12px] font-medium text-[#6B7896]">
                    <span className="uppercase tracking-wide text-[#121F38]">
                      {post.category}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[#C4CAD6]"></span>
                    <span>{formatDate(post.published_at)}</span>
                    <span className="h-1 w-1 rounded-full bg-[#C4CAD6]"></span>
                    <span>3 min read</span>
                  </div>
                  <div className="space-y-3">
                    <h2 className="font-mono text-[24px] font-semibold leading-[1.3] text-[#121F38]">
                      {post.title}
                    </h2>
                    <p className="font-sans text-[15px] leading-[1.7] text-[#2C3A52]">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#C4CAD6] pt-5">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 font-sans text-[13px] font-medium text-[#121F38] transition-colors hover:text-[#1A2D4F] before:absolute before:inset-0"
                  >
                    <span>{ctaByCategory[post.category]}</span>
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-[#C4CAD6] bg-[#F4F5F8] px-6 py-16 text-center md:px-12">
          <p className="font-sans text-[15px] leading-relaxed text-[#6B7896]">
            No updates found for this category.
          </p>
        </div>
      )}
    </div>
  );
}
