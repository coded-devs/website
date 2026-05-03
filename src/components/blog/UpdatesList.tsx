"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
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
  "Product Update": "Read the update \u2192",
  Announcement: "Read the announcement \u2192",
  Roadmap: "Read the roadmap \u2192",
  Story: "Read the story \u2192",
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
      <p className="font-sans text-lg leading-[1.75] text-[#2C3A52]">
        No updates published yet. Check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => {
          const isActive = filter === activeFilter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "rounded-md px-4 py-2 font-sans text-sm font-medium",
                isActive
                  ? "bg-[#121F38] text-white"
                  : "bg-[#F4F5F8] text-[#121F38] hover:bg-[#D1D6E0]",
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
            <Card key={post.id} className="bg-[#F4F5F8]">
              <article className="flex h-full flex-col justify-between gap-8">
                <div className="space-y-5">
                  <Badge>{post.category}</Badge>
                  <div className="space-y-3">
                    <h2 className="font-mono text-[28px] font-semibold leading-[1.3] text-[#121F38]">
                      {post.title}
                    </h2>
                    <p className="font-sans text-base leading-[1.7] text-[#2C3A52]">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="font-sans text-sm leading-[1.6] text-[#6B7896]">
                    {post.author} - {formatDate(post.published_at)}
                  </p>

                  <Button asChild variant="ghost" className="px-0">
                    <Link href={`/blog/${post.slug}`}>
                      {ctaByCategory[post.category]}
                    </Link>
                  </Button>
                </div>
              </article>
            </Card>
          ))}
        </div>
      ) : (
        <p className="font-sans text-lg leading-[1.75] text-[#2C3A52]">
          No updates published yet. Check back soon.
        </p>
      )}
    </div>
  );
}
