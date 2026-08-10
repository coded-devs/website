import { count } from "drizzle-orm";
import { blogPosts, db, products, teamMembers } from "@/db";
import { requireAdminSession } from "@/lib/admin-auth";

async function getDashboardData() {
  const [[teamCount], [productCount], [postCount]] = await Promise.all([
    db.select({ value: count() }).from(teamMembers),
    db.select({ value: count() }).from(products),
    db.select({ value: count() }).from(blogPosts),
  ]);

  return {
    stats: [
      { label: "Team Members", value: teamCount.value },
      { label: "Products", value: productCount.value },
      { label: "Blog Posts", value: postCount.value },
    ],
  };
}

export default async function AdminDashboardPage() {
  await requireAdminSession();

  const { stats } = await getDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold text-[#121F38]">
          Dashboard
        </h1>
        <p className="mt-2 font-sans text-sm text-[#6B7896]">
          Overview of website content.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <section
            key={stat.label}
            className="rounded-lg border border-[#C4CAD6] bg-white p-5 shadow-sm"
          >
            <p className="font-sans text-sm text-[#6B7896]">{stat.label}</p>
            <p className="mt-3 font-mono text-4xl font-bold text-[#121F38]">
              {stat.value}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}