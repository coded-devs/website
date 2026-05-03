import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import PostContent, {
  type TiptapJson,
} from "@/components/blog/PostContent";
import Badge from "@/components/ui/Badge";
import { blogPosts, db } from "@/db";
import { getPostBySlug } from "@/db/queries";
import { getBlogCoverUrl } from "@/lib/cloudinary";
import { getReadingTime } from "@/lib/utils";

export const revalidate = 3600;

type UpdatePageProps = {
  params: {
    slug: string;
  };
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
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: UpdatePageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Update - CodedDevs Updates",
    };
  }

  const title = `${post.title} - CodedDevs Updates`;
  const description = post.excerpt;
  const url = `https://codeddevs.com/blog/${post.slug}`;
  const images = post.cover_url ? [post.cover_url] : undefined;

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
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const content = isTiptapJson(post.content)
    ? post.content
    : { type: "doc", content: [] };
  const readingTime = getReadingTime(post.content);

  return (
    <main className="bg-white">
      <article className="pb-24 md:pb-32">
        {post.cover_url ? (
          <div className="relative aspect-[1200/630] w-full overflow-hidden bg-[#F4F5F8]">
            <Image
              src={getBlogCoverUrl(post.cover_url)}
              alt={post.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </div>
        ) : null}

        <div className="mx-auto max-w-3xl px-6 pt-16 md:pt-20">
          <header className="space-y-6">
            <Badge>{post.category}</Badge>
            <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-[56px]">
              {post.title}
            </h1>
            <p className="font-sans text-sm leading-[1.6] text-[#6B7896]">
              By {post.author} &middot; {formatDate(post.published_at)}{" "}
              &middot; {readingTime}
            </p>
          </header>

          <div className="my-10 border-t border-[#C4CAD6]" />

          <PostContent content={content} />
        </div>
      </article>
    </main>
  );
}
