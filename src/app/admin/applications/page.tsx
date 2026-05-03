import { desc, eq } from "drizzle-orm";
import ApplicationsManager, {
  type AdminApplication,
} from "@/components/admin/ApplicationsManager";
import { careerApplications, careers, db } from "@/db";

export default async function AdminApplicationsPage() {
  const applications = await db
    .select({
      id: careerApplications.id,
      career_title: careers.title,
      full_name: careerApplications.full_name,
      email: careerApplications.email,
      portfolio_url: careerApplications.portfolio_url,
      github_url: careerApplications.github_url,
      cover_letter: careerApplications.cover_letter,
      status: careerApplications.status,
      created_at: careerApplications.created_at,
    })
    .from(careerApplications)
    .leftJoin(careers, eq(careerApplications.career_id, careers.id))
    .orderBy(desc(careerApplications.created_at));

  const serializedApplications: AdminApplication[] = applications.map(
    (application) => ({
      ...application,
      created_at: application.created_at.toISOString(),
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-3xl font-bold text-[#121F38]">
          Applications
        </h1>
        <p className="mt-2 font-sans text-sm text-[#6B7896]">
          Review career applications and update status.
        </p>
      </div>

      <ApplicationsManager applications={serializedApplications} />
    </div>
  );
}
