import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ArrowRightIcon, ExternalLinkIcon } from "@/components/ui/icons";
import type { ProductSelect } from "@/types";

export type ProductSummary = Pick<
  ProductSelect,
  | "id"
  | "name"
  | "slug"
  | "tagline"
  | "cover_url"
  | "external_url"
  | "status"
  | "is_featured"
>;

type ProductsSectionProps = {
  products: ProductSummary[];
};

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

function ProductsIllustration() {
  return (
    <div className="relative isolate overflow-hidden rounded-[32px] border border-[#D1D6E0] bg-[#F4F5F8] p-8 sm:p-10">
      <div className="absolute left-5 top-8 h-3 w-3 rounded-full bg-[#121F38]/10" />
      <div className="absolute right-6 bottom-8 h-2 w-8 rounded-full bg-[#121F38]/10" />
      <div className="relative grid h-[340px] gap-4">
        <div className="grid grid-cols-[1.4fr_0.8fr] gap-4">
          <div className="rounded-[28px] border border-[#D1D6E0] bg-white p-5">
            <div className="h-3 w-24 rounded-full bg-[#E1E6EC]" />
            <div className="mt-6 space-y-3">
              <div className="h-4 w-16 rounded-full bg-[#D1D6E0]" />
              <div className="h-3 w-20 rounded-full bg-[#E9EDF3]" />
              <div className="h-3 w-10 rounded-full bg-[#E9EDF3]" />
            </div>
          </div>
          <div className="rounded-[28px] border border-[#D1D6E0] bg-[#E9EDF3] p-5">
            <div className="h-3 w-12 rounded-full bg-[#D1D6E0]" />
            <div className="mt-5 h-24 rounded-[24px] bg-white" />
          </div>
        </div>

        <div className="rounded-[32px] border border-[#D1D6E0] bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="h-3 w-28 rounded-full bg-[#D1D6E0]" />
            <div className="h-3 w-12 rounded-full bg-[#E9EDF3]" />
          </div>
          <div className="mt-5 grid gap-3">
            <div className="h-4 w-20 rounded-full bg-[#E1E6EC]" />
            <div className="h-4 w-14 rounded-full bg-[#E9EDF3]" />
          </div>
          <div className="mt-6 flex items-center gap-3">
            <span className="h-3 w-12 rounded-full bg-[#E1E6EC]" />
            <span className="h-3 w-8 rounded-full bg-[#E9EDF3]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsSection({ products }: ProductsSectionProps) {
  const isDev = process.env.NODE_ENV === "development";

  if (products.length === 0) {
    if (isDev) {
      return (
        <section className="bg-white py-24 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
              <ProductsIllustration />
              <div className="space-y-6">
                <div className="max-w-2xl space-y-4">
                  <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
                    What We&apos;re Building
                  </h2>
                  <p className="font-sans text-base leading-[1.7] text-[#6B7896]">
                    A refined view of featured products, even when the site is still waiting for the first entry.
                  </p>
                </div>
                <div className="rounded-[32px] border border-[#D1D6E0] bg-[#F4F5F8] p-8 text-sm text-[#6B7896]">
                  No products yet
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <ProductsIllustration />

          <div className="space-y-8">
            <div className="max-w-2xl space-y-4">
              <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
                What We&apos;re Building
              </h2>
              <p className="font-sans text-base leading-[1.7] text-[#6B7896]">
                Featured products shaping CodedDevs&apos; technical roadmap and market execution.
              </p>
            </div>

            <Card className="rounded-[32px] border-[#D1D6E0] bg-[#F4F5F8] p-6 shadow-none">
              <div className="space-y-5">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-[28px] border border-[#D1D6E0] bg-white p-6"
                  >
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-4">
                        <Badge variant={statusVariant(product.status)}>
                          {formatStatus(product.status)}
                        </Badge>
                        <div className="space-y-3">
                          <Link
                            href={`/products/${product.slug}`}
                            className="inline-block font-mono text-2xl font-semibold leading-[1.3] text-[#121F38] hover:text-[#1A2D4F]"
                          >
                            {product.name}
                          </Link>
                          <p className="font-sans text-base leading-[1.7] text-[#2C3A52]">
                            {product.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:items-end sm:justify-center">
                        {product.external_url ? (
                          <Button asChild>
                            <a
                              href={product.external_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span>Visit {product.name}</span>
                              <ExternalLinkIcon className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                        <Button asChild variant="ghost">
                          <Link href={`/products/${product.slug}`}>
                            <span>Read more</span>
                            <ArrowRightIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
