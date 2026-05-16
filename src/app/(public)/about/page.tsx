import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

const title = "About — CodedDevs Technology LTD";
const description =
  "We build AI-first software products for African markets. Learn about our mission and approach.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://codeddevs.com/about",
    siteName: "CodedDevs Technology LTD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const companyFacts = [
  { label: "Founded", value: "March 2026" },
  { label: "Registered", value: "RC 9426867, Nigeria" },
  { label: "Location", value: "Lagos, Nigeria" },
  { label: "Team", value: "3 founders, all full-stack engineers" },
];

export default function AboutPage() {
  return (
    <main className="bg-white">
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-[56px]">
              About CodedDevs
            </h1>
            <p className="mx-auto mt-6 max-w-3xl font-sans text-lg leading-[1.75] text-[#2C3A52]">
              We build AI-first software products for African markets — from
              first principles.
            </p>

            <div className="mx-auto mt-12 max-w-2xl border-t border-[#C4CAD6] md:mt-16"></div>

            <div className="mx-auto mt-12 grid max-w-4xl gap-10 md:mt-16 md:grid-cols-3 md:gap-8">
              <div className="space-y-3">
                <h3 className="font-mono text-xl font-medium leading-[1.4] text-[#121F38]">
                  AI Systems
                </h3>
                <p className="mx-auto max-w-xs font-sans text-base leading-[1.7] text-[#6B7896]">
                  Intelligent software built for African workflows
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-mono text-xl font-medium leading-[1.4] text-[#121F38]">
                  Infrastructure
                </h3>
                <p className="mx-auto max-w-xs font-sans text-base leading-[1.7] text-[#6B7896]">
                  Reliable platforms designed for scale and resilience
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-mono text-xl font-medium leading-[1.4] text-[#121F38]">
                  Open Source
                </h3>
                <p className="mx-auto max-w-xs font-sans text-base leading-[1.7] text-[#6B7896]">
                  Transparent engineering with community-first development
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 md:grid-cols-[280px_1fr]">
          <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
            What We&apos;re Building
          </h2>
          <div className="space-y-6 font-sans text-lg leading-[1.75] text-[#2C3A52]">
            <p>
              CodedDevs Technology LTD is an African startup building AI
              products and open-source tools that help businesses grow, scale,
              and operate more efficiently.
            </p>
            <p>
              We develop a portfolio of products across social commerce,
              e-commerce, and AI-driven tools — designed to enable seamless
              transactions, stronger digital presence, and smarter business
              growth.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-5xl px-6">
          <div className="border-y border-[#C4CAD6] py-16 md:py-24">
            <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)] md:gap-16">
              <div className="order-1 max-w-xs md:order-2">
                <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
                  How We Build
                </h2>
              </div>
              <div className="order-2 max-w-2xl space-y-5 font-sans text-lg leading-[1.75] text-[#2C3A52] md:order-1">
                <p>
                  Our approach is AI-first and deeply focused on the African
                  market. We solve real-world challenges unique to the region —
                  not by adapting tools built elsewhere, but by engineering from
                  first principles.
                </p>
                <p>
                  We build in the open. Our products are open-source because we
                  believe the best software for Africa should be built with
                  Africa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24 pt-16 md:pb-32 md:pt-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 border-t border-[var(--color-border)] md:grid-cols-4">
            {companyFacts.map((fact, idx) => (
              <div
                key={fact.label}
                className="border-b border-[var(--color-border)] py-6 last:border-b-0 md:border-b-0 md:border-l md:px-6 md:py-8 md:first:border-l-0 md:first:pl-0"
              >
                <div
                  className={`space-y-2 ${
                    ["", "md:mt-4", "md:mt-8", "md:mt-12"][idx]
                  }`}
                >
                  <p className="font-sans text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                    {fact.label}
                  </p>
                  <div className="space-y-1">
                    <p className="font-sans text-[15px] leading-relaxed text-[var(--color-text-primary)]">
                      {fact.value}
                    </p>
                    {fact.label === "Team" && (
                      <Link
                        href="/team"
                        className="mt-1 inline-block font-sans text-[13px] text-[var(--color-text-muted)] underline decoration-[var(--color-border)] decoration-1 underline-offset-4 transition-colors hover:text-[var(--color-text-primary)] hover:decoration-[var(--color-text-primary)]"
                      >
                        Meet the team &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
