import Link from "next/link";
import Button from "@/components/ui/Button";

export default function HeroSection() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="max-w-4xl space-y-8">
          <h1 className="font-mono text-[28px] font-bold leading-[1.1] text-[#121F38] sm:text-4xl md:text-[56px]">
            Engineering Software That Works for Africa
          </h1>
          <p className="max-w-3xl font-sans text-lg leading-[1.75] text-[#2C3A52]">
            We build AI-first software products for African markets — from
            first principles, not adaptations.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/products">See Our Products</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
