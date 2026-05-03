import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { db, products } from "@/db";
import type { ProductSelect } from "@/types";

type ProductPageProps = {
  params: {
    slug: string;
  };
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

async function getProductBySlug(slug: string) {
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    return product ?? null;
  } catch (error) {
    console.error("Failed to fetch product", error);
    return null;
  }
}

export async function generateStaticParams() {
  if (process.env.CI === "true") {
    return [];
  }

  try {
    const productSlugs = await db
      .select({ slug: products.slug })
      .from(products)
      .orderBy(products.order_index);

    return productSlugs;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return {
      title: "Product \u2014 CodedDevs",
    };
  }

  return {
    title: `${product.name} \u2014 CodedDevs`,
    description: product.tagline,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="bg-white">
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-4xl space-y-8">
            <div className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-[56px]">
                  {product.name}
                </h1>
                <Badge variant={statusVariant(product.status)}>
                  {formatStatus(product.status)}
                </Badge>
              </div>
              <p className="max-w-3xl font-sans text-lg leading-[1.75] text-[#2C3A52]">
                {product.tagline}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {product.external_url ? (
                <Button asChild size="lg">
                  <a
                    href={product.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit {product.name} &rarr;
                  </a>
                </Button>
              ) : null}
              {product.github_url ? (
                <Button asChild variant="secondary" size="lg">
                  <a
                    href={product.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on GitHub &rarr;
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {product.cover_url ? (
        <section className="pb-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-[#F4F5F8]">
              <Image
                src={product.cover_url}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-3xl space-y-6 font-sans text-lg leading-[1.75] text-[#2C3A52]">
            {product.description.split(/\n{2,}/).map((paragraph, index) => (
              <p key={`${product.id}-paragraph-${index}`}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
