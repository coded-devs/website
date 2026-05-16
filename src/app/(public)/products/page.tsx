import type { Metadata } from "next";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { ArrowRightIcon, ExternalLinkIcon } from "@/components/ui/icons";
import { db, products } from "@/db";

export const revalidate = 3600;

const title = "Products — CodedDevs Technology LTD";
const description =
  "Software built for African markets. See what CodedDevs is building.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://codeddevs.com/products",
    siteName: "CodedDevs Technology LTD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

function formatStatus(status: string) {
  if (status === "development") return "In development";
  if (status === "beta") return "Beta";
  if (status === "live") return "Live";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusVariant(status: string) {
  if (status === "live") return "success";
  if (status === "beta") return "warning";
  if (status === "development") return "muted";
  return "default";
}

async function getProducts() {
  try {
    return await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        tagline: products.tagline,
        status: products.status,
        cover_url: products.cover_url,
        external_url: products.external_url,
        is_featured: products.is_featured,
      })
      .from(products)
      .orderBy(products.order_index);
  } catch {
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

      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-6">
          {allProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {allProducts.map((product) => {
                // Mocking category and beta status for UI demonstration
                const category =
                  product.slug.includes("api") || product.slug.includes("dev")
                    ? "Developer tools"
                    : "Fintech";
                const displayStatus =
                  product.status === "archived" ? "beta" : product.status;

                return (
                  <div
                    key={product.id}
                    className="flex h-full flex-col justify-between rounded-md border-[0.5px] border-[#C4CAD6] bg-white p-6 shadow-none"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant={statusVariant(displayStatus)}>
                          {formatStatus(displayStatus)}
                        </Badge>
                        <span className="font-sans text-[11px] font-medium uppercase tracking-wider text-[#6B7896]">
                          {category}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <h2 className="font-mono text-xl font-bold leading-tight text-[#121F38]">
                          {product.name}
                        </h2>
                        <p className="line-clamp-1 font-sans text-[15px] leading-relaxed text-[#2C3A52]">
                          {product.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-4 font-sans text-[13px] font-medium">
                      <Link
                        href={`/products/${product.slug}`}
                        className="inline-flex items-center gap-1.5 text-[#121F38] transition-colors hover:text-[#1A2D4F]"
                      >
                        <span>Learn more</span>
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </Link>
                      {product.external_url ? (
                        <a
                          href={product.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#6B7896] transition-colors hover:text-[#121F38]"
                        >
                          <span>Visit product</span>
                          <ExternalLinkIcon className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
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
