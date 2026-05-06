import { BlogPostForm } from "@/components/admin/ResourceForms";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-mono text-3xl font-bold text-[#121F38]">
        Add Blog Post
      </h1>
      <BlogPostForm mode="create" endpoint="/api/admin/blog" />
    </div>
  );
}
