import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import PostContent, {
  type TiptapJson,
} from "@/components/blog/PostContent";
import Badge from "@/components/ui/Badge";
import { blogPosts, db } from "@/db";
import { getOptimisedUrl } from "@/lib/cloudinary-url";

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

async function getPublishedPostBySlug(slug: string) {
  try {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.is_published, true)))
      .limit(1);

    return post ?? null;
  } catch {
    return null;
  }
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
  const post = await getPublishedPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Update — CodedDevs Updates",
    };
  }

  const title = `${post.title} — CodedDevs Updates`;
  const description = post.excerpt;
  const url = `https://codeddevs.com/blog/${post.slug}`;
  const images = post.cover_url
    ? [{ url: getOptimisedUrl(post.cover_url), alt: post.title }]
    : undefined;

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
      images: images?.map((image) => image.url),
    },
  };
}

export default async function UpdatePage({ params }: UpdatePageProps) {
  const post = await getPublishedPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const content = isTiptapJson(post.content)
    ? post.content
    : { type: "doc", content: [] };

  return (
    <main className="bg-white">
      <article>
        <header className="py-24 md:py-32">
          <div className="mx-auto max-w-5xl px-6">
            <div className="max-w-4xl space-y-6">
              <Badge>{post.category}</Badge>
              <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-[56px]">
                {post.title}
              </h1>
              <p className="font-sans text-sm leading-[1.6] text-[#6B7896]">
                {post.author} - {formatDate(post.published_at)}
              </p>
            </div>
          </div>
        </header>

        {post.cover_url ? (
          <section className="pb-16">
            <div className="mx-auto max-w-5xl px-6">
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-[#F4F5F8]">
                <Image
                  src={getOptimisedUrl(post.cover_url)}
                  alt={post.title}
                  fill
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </section>
        ) : null}

        <section className="pb-24 md:pb-32">
          <div className="mx-auto max-w-5xl px-6">
            <PostContent content={content} />
          </div>
        </section>
      </article>
    </main>
  );
}
