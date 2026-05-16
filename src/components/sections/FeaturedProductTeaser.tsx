import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface TeaserConfig {
  name: string;
  description: string;
  ctaLink: string;
  isRedacted: boolean;
}

interface FeaturedProductTeaserProps {
  config: TeaserConfig;
  className?: string;
}

export default function FeaturedProductTeaser({
  config,
  className,
}: FeaturedProductTeaserProps) {
  return (
    <section className={cn("w-full bg-[#121F38] py-24 md:py-32", className)}>
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        {/* Label */}
        <span className="mb-6 font-sans text-sm font-medium uppercase tracking-widest text-[#D1D6E0]">
          Coming Soon
        </span>

        {/* Product Name */}
        <h2 className="mb-6 font-mono text-4xl font-bold md:text-[56px] md:leading-[1.1]">
          {config.isRedacted ? (
            <span
              className="inline-block select-none rounded bg-[#2C3A52] px-4 text-transparent blur-[2px]"
              aria-hidden="true"
            >
              {config.name}
            </span>
          ) : (
            <span className="text-white">{config.name}</span>
          )}
        </h2>

        {/* Description */}
        <p className="mb-10 max-w-2xl font-sans text-lg leading-[1.75] text-[#D1D6E0] md:text-xl">
          {config.description}
        </p>

        {/* CTA */}
        <Link
          href={config.ctaLink}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-8 font-sans text-base font-medium text-[#121F38] transition-colors hover:bg-[#F4F5F8]"
        >
          <span>Join the waitlist</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
