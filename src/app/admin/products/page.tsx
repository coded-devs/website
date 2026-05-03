import Link from "next/link";
import { asc } from "drizzle-orm";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import Button from "@/components/ui/Button";
import { db, products } from "@/db";

export default async function AdminProductsPage() {
  const productList = await db
    .select()
    .from(products)
    .orderBy(asc(products.order_index));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold text-[#121F38]">Products</h1>
          <p className="mt-2 font-sans text-sm text-[#6B7896]">
            Manage public product pages.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">Add New</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#C4CAD6] bg-white shadow-sm">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-[#F4F5F8] text-[#121F38]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {productList.map((product) => (
              <tr key={product.id} className="border-t border-[#C4CAD6]">
                <td className="px-4 py-3 text-[#121F38]">{product.name}</td>
                <td className="px-4 py-3 text-[#2C3A52]">{product.slug}</td>
                <td className="px-4 py-3 text-[#2C3A52]">{product.status}</td>
                <td className="px-4 py-3 text-[#2C3A52]">{product.is_featured ? "Yes" : "No"}</td>
                <td className="flex gap-2 px-4 py-3">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/admin/products/${product.id}`}>Edit</Link>
                  </Button>
                  <AdminDeleteButton endpoint={`/api/admin/products/${product.id}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
