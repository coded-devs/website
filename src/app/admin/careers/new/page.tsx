import { CareerForm } from "@/components/admin/ResourceForms";

export default function NewCareerPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-mono text-3xl font-bold text-[#121F38]">
        Add Career
      </h1>
      <CareerForm mode="create" endpoint="/api/admin/careers" />
    </div>
  );
}
