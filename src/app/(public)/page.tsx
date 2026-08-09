import type { Metadata } from "next";
import BeliefSection from "@/components/sections/BeliefSection";
import ClosingCtaSection from "@/components/sections/ClosingCtaSection";
import FocusAreasSection from "@/components/sections/FocusAreasSection";
import HeroSection from "@/components/sections/HeroSection";
import LatestReleasesSection from "@/components/sections/LatestReleasesSection";
import ProductsSection from "@/components/sections/ProductsSection";
import RecognitionSection from "@/components/sections/RecognitionSection";
import {
  getFeaturedProducts,
  getLatestPosts,
  getRecognitionPosts,
} from "@/db/queries";

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

export default async function HomePage() {
  const [featuredProducts, latestPosts, recognitionPosts] = await Promise.all([
    getFeaturedProducts(),
    getLatestPosts(3),
    getRecognitionPosts(3),
  ]);

  return (
    // Band rhythm: white → navy → white → mist → white → mist → silver, with a
    // navy footer under it. Belief and the closing CTA carry no database
    // content, so an empty result set still yields a complete page.
    <main id="main">
      <HeroSection />
      <BeliefSection />
      <FocusAreasSection />
      <ProductsSection products={featuredProducts} />
      <LatestReleasesSection posts={latestPosts} />
      <RecognitionSection posts={recognitionPosts} />
      <ClosingCtaSection />
    </main>
  );
}
