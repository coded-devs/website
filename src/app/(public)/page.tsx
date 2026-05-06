import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import HeroSection from "@/components/sections/HeroSection";
import AboutTeaser from "@/components/sections/AboutTeaser";
import LatestReleasesSection from "@/components/sections/LatestReleasesSection";
import ProductsSection from "@/components/sections/ProductsSection";
import RecognitionSection from "@/components/sections/RecognitionSection";
import TeamSection from "@/components/sections/TeamSection";
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
      <AboutTeaser />
      <TeamSection />
    </main>
  );
}
