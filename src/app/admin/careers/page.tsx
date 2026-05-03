import Link from "next/link";
import { desc } from "drizzle-orm";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import Button from "@/components/ui/Button";
import { careers, db } from "@/db";

export default async function AdminCareersPage() {
  const careerList = await db
    .select()
    .from(careers)
    .orderBy(desc(careers.created_at));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold text-[#121F38]">Careers</h1>
          <p className="mt-2 font-sans text-sm text-[#6B7896]">
            Manage public open roles.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/careers/new">Add New</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#C4CAD6] bg-white shadow-sm">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-[#F4F5F8] text-[#121F38]">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Open</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {careerList.map((career) => (
              <tr key={career.id} className="border-t border-[#C4CAD6]">
                <td className="px-4 py-3 text-[#121F38]">{career.title}</td>
                <td className="px-4 py-3 text-[#2C3A52]">{career.type}</td>
                <td className="px-4 py-3 text-[#2C3A52]">{career.location}</td>
                <td className="px-4 py-3 text-[#2C3A52]">{career.is_open ? "Yes" : "No"}</td>
                <td className="flex gap-2 px-4 py-3">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/admin/careers/${career.id}`}>Edit</Link>
                  </Button>
                  <AdminDeleteButton endpoint={`/api/admin/careers/${career.id}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
