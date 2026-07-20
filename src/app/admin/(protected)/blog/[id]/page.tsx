import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { BlogPostForm } from "@/components/admin/forms/ResourceForms";
import type { TiptapJson } from "@/components/admin/editors/RichTextEditor";
import { blogPosts, db } from "@/db";
import { requireAdminSession } from "@/lib/admin-auth";

type EditBlogPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function isTiptapJson(value: unknown): value is TiptapJson {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePlacement(value: string | null) {
  if (
    value === "1st" ||
    value === "2nd" ||
    value === "3rd" ||
    value === "winner"
  ) {
    return value;
  }

  return "";
}

export default async function EditBlogPostPage({
  params,
}: EditBlogPostPageProps) {
  await requireAdminSession();
  const { id } = await params;

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-mono text-3xl font-bold text-[#121F38]">
        Edit Blog Post
      </h1>
      <BlogPostForm
        mode="edit"
        endpoint={`/api/admin/blog/${post.id}`}
        initialValues={{
          title: post.title,
          slug: post.slug,
          category: post.category,
          excerpt: post.excerpt,
          content: isTiptapJson(post.content) ? post.content : undefined,
          cover_url: post.cover_url ?? "",
          author: post.author,
          is_published: post.is_published,
          showInRecognition: post.showInRecognition,
          placement: normalizePlacement(post.placement),
        }}
      />
    </div>
  );
}
