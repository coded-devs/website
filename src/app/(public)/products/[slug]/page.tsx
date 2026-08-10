import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { StatusBadge, visitLabel } from "@/components/products/ProductCard";
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

  const cover = getProductCoverUrl(product.cover_url);

  return (
    <main id="main">
      <section className="pagehead">
        <div className="rail">
          <Link className="backlink" href="/products">
            <ArrowLeftIcon aria-hidden="true" />
            <span>All products</span>
          </Link>

          <div className="prod__head">
            <h1>{product.name}</h1>
            <StatusBadge status={product.status} />
          </div>

          <p className="pagehead__sub">{product.tagline}</p>
        </div>
      </section>

      <section className="band">
        <div className="rail">
          {cover ? (
            <div className="prodcover">
              <Image
                src={cover}
                alt={`${product.name} cover`}
                fill
                sizes="(min-width: 1280px) 1184px, 100vw"
                priority
              />
            </div>
          ) : null}

          <div className={cover ? "prodpage prodpage--after-cover" : "prodpage"}>
            <div className="prodpage__body">{product.description}</div>

            {product.external_url || product.github_url ? (
              <aside className="prodpage__aside">
                {product.external_url ? (
                  <a
                    className="btn btn--primary"
                    href={product.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {visitLabel(product.external_url)}
                    <ExternalLinkIcon width={16} height={16} aria-hidden="true" />
                  </a>
                ) : null}

                {product.github_url ? (
                  <a
                    className="btn btn--ghost"
                    href={product.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GithubIcon width={16} height={16} aria-hidden="true" />
                    View source
                  </a>
                ) : null}
              </aside>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
