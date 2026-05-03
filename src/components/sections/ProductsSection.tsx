import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { ProductSelect } from "@/types";

type ProductsSectionProps = {
  products: ProductSelect[];
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

export default function ProductsSection({ products }: ProductsSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
          What We&apos;re Building
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {products.map((product) => (
            <Card key={product.id} className="bg-[#F4F5F8]">
              <div className="space-y-6">
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

                <div className="flex flex-col gap-3 sm:flex-row">
                  {product.external_url ? (
                    <Button asChild>
                      <a
                        href={product.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit {product.name} →
                      </a>
                    </Button>
                  ) : null}
                  <Button asChild variant="ghost">
                    <Link href={`/products/${product.slug}`}>Read more →</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
