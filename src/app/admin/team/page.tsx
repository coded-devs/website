import Link from "next/link";
import { asc } from "drizzle-orm";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import Button from "@/components/ui/Button";
import { db, teamMembers } from "@/db";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminTeamPage() {
  await requireAdminSession();

  const members = await db
    .select()
    .from(teamMembers)
    .orderBy(asc(teamMembers.order_index));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold text-[#121F38]">Team</h1>
          <p className="mt-2 font-sans text-sm text-[#6B7896]">
            Manage public team profiles.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/team/new">Add New</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#C4CAD6] bg-white shadow-sm">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-[#F4F5F8] text-[#121F38]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-[#C4CAD6]">
                <td className="px-4 py-3 text-[#121F38]">{member.name}</td>
                <td className="px-4 py-3 text-[#2C3A52]">{member.role}</td>
                <td className="px-4 py-3 text-[#2C3A52]">{member.order_index}</td>
                <td className="px-4 py-3 text-[#2C3A52]">{member.is_active ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/admin/team/${member.id}`}>Edit</Link>
                    </Button>
                    <AdminDeleteButton endpoint={`/api/admin/team/${member.id}`} />
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
