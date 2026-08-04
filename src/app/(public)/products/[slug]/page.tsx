import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import ProductStatusBadge from "@/components/products/ProductStatusBadge";
import Button from "@/components/ui/Button";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  GithubIcon,
} from "@/components/ui/icons";
import { getAllProductSlugs, getProductBySlug } from "@/db/queries";
import { getProductCoverUrl } from "@/lib/cloudinary";

export const revalidate = 3600;

const getCachedProductBySlug = cache(getProductBySlug);

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  if (process.env.CI === "true") {
    return [];
  }

  return await getAllProductSlugs();
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = slug ? await getCachedProductBySlug(slug) : null;

  if (!product) {
    return {
      title: "Product — CodedDevs",
    };
  }

  const title = `${product.name} — CodedDevs`;
  const description = product.tagline;
  const url = `https://codeddevs.com/products/${product.slug}`;
  const images = product.cover_url
    ? [getProductCoverUrl(product.cover_url)]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "CodedDevs Technology LTD",
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const product = await getCachedProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="bg-white">
      <article className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6 md:px-8 lg:px-10 xl:px-12">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 font-sans text-sm font-medium text-[#121F38] hover:text-[#1A2D4F]"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            <span>Back to products</span>
          </Link>

          <header className="mt-10 space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-5xl lg:text-[56px]">
                {product.name}
              </h1>
              <ProductStatusBadge status={product.status} />
            </div>

            <p className="max-w-3xl font-sans text-lg leading-[1.75] text-[#2C3A52] md:text-xl">
              {product.tagline}
            </p>
          </header>

          {product.cover_url ? (
            <div className="relative mt-12 aspect-[1200/630] w-full overflow-hidden rounded-lg bg-[#F4F5F8]">
              <Image
                src={getProductCoverUrl(product.cover_url)}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 960px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          ) : null}

          <div className="mt-12 max-w-3xl border-t border-[#C4CAD6] pt-10">
            <p className="whitespace-pre-line font-sans text-[18px] leading-[1.75] text-[#2C3A52]">
              {product.description}
            </p>
          </div>

          {product.external_url || product.github_url ? (
            <div className="mt-10 flex flex-wrap items-center gap-4">
              {product.external_url ? (
                <Button asChild size="lg">
                  <a
                    href={product.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Visit {product.name}</span>
                    <ExternalLinkIcon className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              ) : null}

              {product.github_url ? (
                <Button asChild size="lg" variant="secondary">
                  <a
                    href={product.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GithubIcon className="h-4 w-4" aria-hidden="true" />
                    <span>View on GitHub</span>
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
    </main>
  );
}
