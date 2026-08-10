import { TeamMemberForm } from "@/components/admin/forms/ResourceForms";

export default function NewTeamMemberPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-mono text-3xl font-bold text-[#121F38]">
        Add Team Member
      </h1>
      <TeamMemberForm mode="create" endpoint="/api/admin/team" />
    </div>
  );
}
