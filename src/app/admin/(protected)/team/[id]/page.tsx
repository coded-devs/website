import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { TeamMemberForm } from "@/components/admin/forms/ResourceForms";
import { db, teamMembers } from "@/db";
import { requireAdminSession } from "@/lib/admin-auth";

type EditTeamMemberPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTeamMemberPage({
  params,
}: EditTeamMemberPageProps) {
  await requireAdminSession();
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  const [member] = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.id, id))
    .limit(1);

  if (!member) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-mono text-3xl font-bold text-[#121F38]">
        Edit Team Member
      </h1>
      <TeamMemberForm
        mode="edit"
        endpoint={`/api/admin/team/${member.id}`}
        initialValues={{
          name: member.name,
          role: member.role,
          bio: member.bio,
          photo_url: member.photo_url ?? "",
          linkedin_url: member.linkedin_url ?? "",
          github_url: member.github_url ?? "",
          twitter_url: member.twitter_url ?? "",
          order_index: member.order_index,
          is_active: member.is_active,
        }}
      />
    </div>
  );
}
