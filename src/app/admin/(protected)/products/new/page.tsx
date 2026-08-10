import { ProductForm } from "@/components/admin/forms/ResourceForms";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-mono text-3xl font-bold text-[#121F38]">
        Add Product
      </h1>
      <ProductForm mode="create" endpoint="/api/admin/products" />
    </div>
  );
}
