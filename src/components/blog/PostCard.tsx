import Image from "next/image";
import Link from "next/link";
import { getBlogThumbnailUrl } from "@/lib/cloudinary";
import { formatDate, toDateTimeAttribute } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/types";

/**
 * The shape every public post list needs. `cover_url` is selected by
 * blogPostSummaryColumns in db/queries.ts, so callers already have it.
 * `published_at` widens to string because client components receive the value
 * already serialised across the server/client boundary.
 */
export type PostCardPost = Pick<
  BlogPost,
  "id" | "title" | "slug" | "excerpt" | "category" | "cover_url"
> & {
  published_at: Date | string | null;
  author?: string;
};

type PostCardProps = {
  post: PostCardPost;
  /** Cards above the fold need eager loading for LCP. */
  priority?: boolean;
  className?: string;
};

export function PostMeta({
  category,
  publishedAt,
}: {
  category: string;
  publishedAt: Date | string | null;
}) {
  return (
    <div className="post__meta">
      <span className="post__cat">{category}</span>
      <span className="post__sep" aria-hidden="true">
        ·
      </span>
      <time className="post__date" dateTime={toDateTimeAttribute(publishedAt)}>
        {formatDate(publishedAt)}
      </time>
    </div>
  );
}

/**
 * The grid card for /blog and the related-posts row on an article. The home
 * page's Latest Releases uses the .posts lead/side composition instead — same
 * tokens, different arrangement.
 */
export default function PostCard({
  post,
  priority = false,
  className,
}: PostCardProps) {
  const src = getBlogThumbnailUrl(post.cover_url);

  return (
    <article className={cn("postcard", className)}>
      <div className="cover cover--wide">
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
          />
        ) : (
          <span className="cover__ph cover__ph--post" aria-hidden="true">
            CodedDevs
          </span>
        )}
      </div>

      <PostMeta category={post.category} publishedAt={post.published_at} />

      <h3 className="postcard__title">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>

      <p className="postcard__excerpt">{post.excerpt}</p>

      {post.author ? <p className="postcard__foot">By {post.author}</p> : null}
    </article>
  );
}
