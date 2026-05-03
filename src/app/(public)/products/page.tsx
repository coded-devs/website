import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { db, products } from "@/db";
import type { ProductSelect } from "@/types";

export const dynamic = "force-dynamic";

function formatStatus(status: ProductSelect["status"]) {
  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function statusVariant(status: ProductSelect["status"]) {
  if (status === "live") {
    return "success";
  }

  if (status === "development") {
    return "warning";
  }

  return "muted";
}

async function getProducts() {
  try {
    return await db.select().from(products).orderBy(products.order_index);
  } catch (error) {
    console.error("Failed to fetch products", error);
    return [];
  }
}

export default async function ProductsPage() {
  const allProducts = await getProducts();

  return (
    <main className="bg-white">
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-3xl space-y-6">
            <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-[56px]">
              Our Products
            </h1>
            <p className="font-sans text-lg leading-[1.75] text-[#2C3A52]">
              Software built for African markets.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-5xl px-6">
          {allProducts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {allProducts.map((product) => (
                <Card key={product.id}>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <h2 className="font-mono text-[28px] font-semibold leading-[1.3] text-[#121F38]">
                          {product.name}
                        </h2>
                        <Badge variant={statusVariant(product.status)}>
                          {formatStatus(product.status)}
                        </Badge>
                      </div>
                      <p className="font-sans text-base leading-[1.7] text-[#2C3A52]">
                        {product.tagline}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 font-sans text-sm font-medium sm:flex-row">
                      <Link
                        href={`/products/${product.slug}`}
                        className="text-[#121F38] hover:text-[#1A2D4F]"
                      >
                        Learn more
                      </Link>
                      {product.external_url ? (
                        <a
                          href={product.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#121F38] hover:text-[#1A2D4F]"
                        >
                          Visit product &rarr;
                        </a>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="font-sans text-lg leading-[1.75] text-[#2C3A52]">
              We&apos;re working on something. Check back soon.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
