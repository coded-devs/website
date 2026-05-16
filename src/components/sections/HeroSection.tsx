import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";

export default function HeroSection() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-[1fr_280px]">
          <div className="max-w-4xl">
            <h1 className="text-balance font-mono text-[28px] font-bold leading-[1.1] text-[#121F38] sm:text-4xl md:text-[56px]">
              Engineering Software That Works for Africa
            </h1>
            <p className="mt-6 max-w-2xl text-balance font-sans text-lg leading-[1.75] text-[#2C3A52]">
              We build AI-first software products for African markets — from
              first principles, not adaptations.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/products">See Our Products</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          </div>

          <div className="flex justify-start md:justify-end">
            <Image
              src="/mascot/kodyfigma.svg"
              alt="Kody, the CodedDevs mascot"
              width={240}
              height={240}
              priority
              className="h-auto w-[160px] sm:w-[200px] md:w-[240px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
