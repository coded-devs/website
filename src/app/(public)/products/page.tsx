import type { Metadata } from "next";
import Link from "next/link";
import ProductStatusBadge from "@/components/products/ProductStatusBadge";
import { ArrowRightIcon, ExternalLinkIcon } from "@/components/ui/icons";
import { getAllProducts } from "@/db/queries";

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

export default async function ProductsPage() {
  const products = await getAllProducts();
  const isDev = process.env.NODE_ENV === "development";

  return (
    <main className="bg-white">
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 xl:px-12">
          <div className="max-w-3xl space-y-6">
            <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-5xl lg:text-[56px]">
              Our Products
            </h1>
            <p className="font-sans text-lg leading-[1.75] text-[#6B7896]">
              Software built for African markets.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 xl:px-12">
          {products.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex h-full flex-col rounded-lg border border-l-4 border-[#C4CAD6] border-l-[#121F38] bg-[#F4F5F8] p-8"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-mono text-2xl font-bold leading-[1.25] text-[#121F38]">
                      {product.name}
                    </h2>
                    <ProductStatusBadge status={product.status} />
                  </div>

                  <p className="mt-4 font-sans text-base leading-[1.7] text-[#2C3A52]">
                    {product.tagline}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#C4CAD6] pt-5">
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex items-center gap-2 font-sans text-sm font-medium text-[#121F38] hover:text-[#1A2D4F]"
                    >
                      <span>Learn more</span>
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>

                    {product.external_url ? (
                      <a
                        href={product.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-sans text-sm font-medium text-[#121F38] hover:text-[#1A2D4F]"
                      >
                        <span>Visit {product.name}</span>
                        <ExternalLinkIcon
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : isDev ? (
            <div className="rounded-lg bg-[#F4F5F8] p-8 text-center font-sans text-sm text-[#6B7896]">
              No products yet — add one via the admin dashboard
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
