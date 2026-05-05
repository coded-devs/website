import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ProductForm } from "@/components/admin/ResourceForms";
import { db, products } from "@/db";
import { requireAdminSession } from "@/lib/admin-auth";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  await requireAdminSession();
  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-mono text-3xl font-bold text-[#121F38]">
        Edit Product
      </h1>
      <ProductForm
        mode="edit"
        endpoint={`/api/admin/products/${product.id}`}
        initialValues={{
          name: product.name,
          slug: product.slug,
          tagline: product.tagline,
          description: product.description,
          cover_url: product.cover_url ?? "",
          external_url: product.external_url ?? "",
          github_url: product.github_url ?? "",
          status: product.status,
          is_featured: product.is_featured,
          order_index: product.order_index,
        }}
      />
    </div>
  );
}
