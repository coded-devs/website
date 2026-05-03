import Link from "next/link";
import { desc } from "drizzle-orm";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import Button from "@/components/ui/Button";
import { blogPosts, db } from "@/db";
import { requireAdminSession } from "@/lib/admin-auth";

function formatDate(date: Date | null) {
  if (!date) {
    return "Unpublished";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function AdminBlogPage() {
  await requireAdminSession();

  const posts = await db
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.created_at));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold text-[#121F38]">Blog</h1>
          <p className="mt-2 font-sans text-sm text-[#6B7896]">
            Manage public updates and announcements.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">Add New</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#C4CAD6] bg-white shadow-sm">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-[#F4F5F8] text-[#121F38]">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-t border-[#C4CAD6]">
                <td className="px-4 py-3 text-[#121F38]">{post.title}</td>
                <td className="px-4 py-3 text-[#2C3A52]">{post.category}</td>
                <td className="px-4 py-3 text-[#2C3A52]">{post.is_published ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-[#2C3A52]">{formatDate(post.published_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/admin/blog/${post.id}`}>Edit</Link>
                    </Button>
                    <AdminDeleteButton endpoint={`/api/admin/blog/${post.id}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
