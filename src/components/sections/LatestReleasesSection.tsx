import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon } from "@/components/ui/icons";
import { getBlogThumbnailUrl } from "@/lib/cloudinary";
import { formatDate, toDateTimeAttribute } from "@/lib/date";
import type { BlogPost } from "@/types";

export type LatestReleasePost = Pick<
  BlogPost,
  "id" | "title" | "slug" | "excerpt" | "category" | "published_at" | "cover_url"
>;

type LatestReleasesSectionProps = {
  posts: LatestReleasePost[];
};

/** The link names what the reader is about to open, so it changes with the
 *  category rather than repeating "Read more" three times down the page. */
const ctaByCategory: Record<BlogPost["category"], string> = {
  "Product Update": "Read the update",
  Announcement: "Read the announcement",
  Roadmap: "Read the roadmap",
  Story: "Read the story",
};

function PostBody({ post }: { post: LatestReleasePost }) {
  return (
    <>
      <div className="post__meta">
        <span className="post__cat">{post.category}</span>
        <span className="post__sep" aria-hidden="true">
          ·
        </span>
        <time
          className="post__date"
          dateTime={toDateTimeAttribute(post.published_at)}
        >
          {formatDate(post.published_at)}
        </time>
      </div>
      <h3 className="post__title">{post.title}</h3>
      <p className="post__excerpt">{post.excerpt}</p>
      <Link className="link post__link" href={`/blog/${post.slug}`}>
        {ctaByCategory[post.category]}
        <ArrowRightIcon width={16} height={16} />
      </Link>
    </>
  );
}

export default function LatestReleasesSection({
  posts,
}: LatestReleasesSectionProps) {
  const isDev = process.env.NODE_ENV === "development";

  if (posts.length === 0) {
    if (isDev) {
      return (
        <section className="band" id="releases">
          <div className="rail">
            <div className="sectionhead">
              <div>
                <p className="eyebrow">From the blog</p>
                <h2 className="h2">Latest releases</h2>
              </div>
            </div>
            <div className="rounded-lg bg-[#F4F5F8] p-8 text-center font-sans text-sm text-[#626F8B]">
              No posts published yet. Add one via the admin dashboard.
            </div>
          </div>
        </section>
      );
    }

    return null;
  }

  const [lead, ...rest] = posts;
  const side = rest.slice(0, 2);
  const leadCover = getBlogThumbnailUrl(lead.cover_url);

  return (
    <section className="band" id="releases" aria-labelledby="releases-h2">
      <div className="rail">
        <Reveal className="sectionhead">
          <div>
            <p className="eyebrow">From the blog</p>
            <h2 className="h2" id="releases-h2">
              Latest releases
            </h2>
          </div>
          <Link className="link" href="/blog">
            View all posts
            <ArrowRightIcon width={16} height={16} />
          </Link>
        </Reveal>

        <Reveal stagger className="posts">
          <article className="post post--lead">
            <div className="cover">
              {leadCover ? (
                <Image
                  src={leadCover}
                  alt={`${lead.title} cover`}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                />
              ) : (
                <span className="cover__ph cover__ph--post" aria-hidden="true">
                  CodedDevs
                </span>
              )}
            </div>
            <PostBody post={lead} />
          </article>

          {side.length > 0 ? (
            <div className="post-side">
              {side.map((post) => (
                <article className="post post-side__item" key={post.id}>
                  <PostBody post={post} />
                </article>
              ))}
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
