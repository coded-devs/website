import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import HeroSection from "@/components/sections/HeroSection";
import LatestReleasesSection from "@/components/sections/LatestReleasesSection";
import ProductsSection from "@/components/sections/ProductsSection";
import RecognitionSection from "@/components/sections/RecognitionSection";
import { ArrowRightIcon } from "@/components/ui/icons";
import { db, products } from "@/db";
import { getLatestPosts, getRecognitionPosts } from "@/db/queries";

export const revalidate = 3600;

const title = "CodedDevs Technology LTD";
const description =
  "Engineering software that works for Africa. AI-first products built for African markets from first principles.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://codeddevs.com",
    siteName: "CodedDevs Technology LTD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

async function getFeaturedProducts() {
  try {
    return await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        tagline: products.tagline,
        cover_url: products.cover_url,
        external_url: products.external_url,
        status: products.status,
        is_featured: products.is_featured,
      })
      .from(products)
      .where(eq(products.is_featured, true))
      .orderBy(products.order_index);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featuredProducts, latestPosts, recognitionPosts] = await Promise.all([
    getFeaturedProducts(),
    getLatestPosts(3),
    getRecognitionPosts(3),
  ]);

  return (
    <main>
      <HeroSection />
      <ProductsSection products={featuredProducts} />
      <LatestReleasesSection posts={latestPosts} />
      <RecognitionSection posts={recognitionPosts} />
      <section className="bg-white py-24 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-3xl space-y-6">
            <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
              Building from first principles
            </h2>
            <div className="space-y-4 font-sans text-lg leading-[1.75] text-[#2C3A52]">
              <p>
                CodedDevs Technology LTD is building AI-first software products
                for African markets with the patience to understand local
                realities deeply.
              </p>
              <p>
                Our work starts with real constraints, clear product thinking,
                and engineering that is shaped for the markets it serves.
              </p>
            </div>
            <a
              href="/team"
              className="inline-flex items-center gap-1.5 font-sans text-base font-medium text-[#121F38] hover:text-[#1A2D4F]"
            >
              <span>Meet the Team</span>
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
