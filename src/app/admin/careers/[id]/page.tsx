import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CareerForm } from "@/components/admin/ResourceForms";
import { careers, db } from "@/db";

type EditCareerPageProps = {
  params: {
    id: string;
  };
};

export default async function EditCareerPage({ params }: EditCareerPageProps) {
  const [career] = await db
    .select()
    .from(careers)
    .where(eq(careers.id, params.id))
    .limit(1);

  if (!career) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-mono text-3xl font-bold text-[#121F38]">
        Edit Career
      </h1>
      <CareerForm
        mode="edit"
        endpoint={`/api/admin/careers/${career.id}`}
        initialValues={{
          title: career.title,
          type: career.type,
          location: career.location,
          description: career.description,
          requirements: career.requirements,
          is_open: career.is_open,
        }}
      />
    </div>
  );
}
