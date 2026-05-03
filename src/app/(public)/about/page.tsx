import Link from "next/link";
import Button from "@/components/ui/Button";

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
          <div className="max-w-4xl space-y-6">
            <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-[56px]">
              About CodedDevs
            </h1>
            <p className="max-w-3xl font-sans text-lg leading-[1.75] text-[#2C3A52]">
              We build AI-first software products for African markets — from
              first principles.
            </p>
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

      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 md:grid-cols-[280px_1fr]">
          <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
            How We Build
          </h2>
          <div className="space-y-6 font-sans text-lg leading-[1.75] text-[#2C3A52]">
            <p>
              Our approach is AI-first and deeply focused on the African
              market. We solve real-world challenges unique to the region — not
              by adapting tools built elsewhere, but by engineering from first
              principles.
            </p>
            <p>
              We build in the open. Our products are open-source because we
              believe the best software for Africa should be built with Africa.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-4">
            {companyFacts.map((fact) => (
              <div key={fact.label} className="space-y-2">
                <p className="font-sans text-xs font-medium uppercase text-[#6B7896]">
                  {fact.label}
                </p>
                <p className="font-sans text-base leading-[1.7] text-[#121F38]">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F4F5F8] py-16 md:py-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
          <h2 className="font-mono text-2xl font-semibold leading-[1.3] text-[#121F38]">
            Meet the team behind CodedDevs
          </h2>
          <Button asChild>
            <Link href="/team">Meet the Team</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
