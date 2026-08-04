import Link from "next/link";
import ProductStatusBadge from "@/components/products/ProductStatusBadge";
import { ArrowRightIcon, ExternalLinkIcon } from "@/components/ui/icons";
import type { ProductSelect } from "@/types";

export type FeaturedProduct = Pick<
  ProductSelect,
  "id" | "name" | "slug" | "tagline" | "cover_url" | "external_url" | "status"
>;

type ProductsSectionProps = {
  products: FeaturedProduct[];
};

export default function ProductsSection({ products }: ProductsSectionProps) {
  const isDev = process.env.NODE_ENV === "development";

  if (products.length === 0) {
    if (isDev) {
      return (
        <section
          id="products"
          className="scroll-mt-24 bg-white py-24 md:py-28"
        >
          <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 xl:px-12">
            <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
              What We&apos;re Building
            </h2>
            <div className="mt-10 rounded-lg bg-[#F4F5F8] p-8 text-center font-sans text-sm text-[#6B7896]">
              No featured products yet. Mark a product as featured in the admin
              dashboard.
            </div>
          </div>
        </section>
      );
    }

    return null;
  }

  return (
    <section id="products" className="scroll-mt-24 bg-white py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#C98A3A]">
              Products
            </p>
            <h2 className="mt-3 font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
              What We&apos;re Building
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-[#121F38] hover:text-[#1A2D4F]"
          >
            View all products
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="flex h-full flex-col rounded-lg border border-l-4 border-[#C4CAD6] border-l-[#121F38] bg-[#F4F5F8] p-8"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-mono text-xl font-bold leading-[1.25] text-[#121F38]">
                  <Link
                    href={`/products/${product.slug}`}
                    className="hover:text-[#1A2D4F]"
                  >
                    {product.name}
                  </Link>
                </h3>
                <ProductStatusBadge status={product.status} />
              </div>

              <p className="mt-4 font-sans text-base leading-[1.7] text-[#2C3A52]">
                {product.tagline}
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 pt-8">
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
                    <span>Visit</span>
                    <ExternalLinkIcon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
