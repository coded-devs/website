import { count, desc, eq } from "drizzle-orm";
import {
  blogPosts,
  careerApplications,
  careers,
  contactSubmissions,
  db,
  products,
  teamMembers,
} from "@/db";
import { requireAdminSession } from "@/lib/admin-auth";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function getDashboardData() {
  const [
    [teamCount],
    [productCount],
    [postCount],
    [openCareerCount],
    [unreadMessageCount],
    [pendingApplicationCount],
    unreadMessages,
    pendingApplications,
  ] = await Promise.all([
    db.select({ value: count() }).from(teamMembers),
    db.select({ value: count() }).from(products),
    db.select({ value: count() }).from(blogPosts),
    db
      .select({ value: count() })
      .from(careers)
      .where(eq(careers.is_open, true)),
    db
      .select({ value: count() })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.is_read, false)),
    db
      .select({ value: count() })
      .from(careerApplications)
      .where(eq(careerApplications.status, "pending")),
    db
      .select({
        id: contactSubmissions.id,
        full_name: contactSubmissions.full_name,
        email: contactSubmissions.email,
        subject: contactSubmissions.subject,
        created_at: contactSubmissions.created_at,
      })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.is_read, false))
      .orderBy(desc(contactSubmissions.created_at))
      .limit(5),
    db
      .select({
        id: careerApplications.id,
        full_name: careerApplications.full_name,
        email: careerApplications.email,
        created_at: careerApplications.created_at,
        career_title: careers.title,
      })
      .from(careerApplications)
      .leftJoin(careers, eq(careerApplications.career_id, careers.id))
      .where(eq(careerApplications.status, "pending"))
      .orderBy(desc(careerApplications.created_at))
      .limit(5),
  ]);

  return {
    stats: [
      { label: "Team Members", value: teamCount.value },
      { label: "Products", value: productCount.value },
      { label: "Blog Posts", value: postCount.value },
      { label: "Open Careers", value: openCareerCount.value },
      { label: "Unread Messages", value: unreadMessageCount.value },
      { label: "Pending Applications", value: pendingApplicationCount.value },
    ],
    unreadMessages,
    pendingApplications,
  };
}

export default async function AdminDashboardPage() {
  await requireAdminSession();

  const { stats, unreadMessages, pendingApplications } =
    await getDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold text-[#121F38]">
          Dashboard
        </h1>
        <p className="mt-2 font-sans text-sm text-[#6B7896]">
          Overview of website content and inbound activity.
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-[#C4CAD6] bg-white p-5 shadow-sm">
          <h2 className="font-mono text-xl font-semibold text-[#121F38]">
            Recent Unread Messages
          </h2>
          <div className="mt-5 space-y-4">
            {unreadMessages.length > 0 ? (
              unreadMessages.map((message) => (
                <div key={message.id} className="border-t border-[#C4CAD6] pt-4 first:border-t-0 first:pt-0">
                  <p className="font-sans text-sm font-medium text-[#121F38]">
                    {message.full_name} - {message.subject}
                  </p>
                  <p className="mt-1 font-sans text-xs text-[#6B7896]">
                    {message.email} - {formatDate(message.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="font-sans text-sm text-[#6B7896]">
                No unread messages.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-[#C4CAD6] bg-white p-5 shadow-sm">
          <h2 className="font-mono text-xl font-semibold text-[#121F38]">
            Recent Pending Applications
          </h2>
          <div className="mt-5 space-y-4">
            {pendingApplications.length > 0 ? (
              pendingApplications.map((application) => (
                <div key={application.id} className="border-t border-[#C4CAD6] pt-4 first:border-t-0 first:pt-0">
                  <p className="font-sans text-sm font-medium text-[#121F38]">
                    {application.full_name}
                  </p>
                  <p className="mt-1 font-sans text-xs text-[#6B7896]">
                    {application.career_title ?? "Unknown role"} -{" "}
                    {application.email} - {formatDate(application.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="font-sans text-sm text-[#6B7896]">
                No pending applications.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
