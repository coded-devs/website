import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import ApplicationForm from "@/components/careers/ApplicationForm";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { careers, db } from "@/db";
import type { Career } from "@/types";

export const revalidate = 3600;

const title = "Careers — CodedDevs Technology LTD";
const description =
  "Work with CodedDevs. We are a small team building software for African markets.";

type OpenRole = Pick<
  Career,
  "id" | "title" | "type" | "location" | "description"
>;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://codeddevs.com/careers",
    siteName: "CodedDevs Technology LTD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

function formatType(type: Career["type"]) {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");
}

async function getOpenRoles() {
  try {
    return await db
      .select({
        id: careers.id,
        title: careers.title,
        type: careers.type,
        location: careers.location,
        description: careers.description,
      })
      .from(careers)
      .where(eq(careers.is_open, true))
      .orderBy(desc(careers.created_at));
  } catch {
    return [];
  }
}

function RoleCard({ role }: { role: OpenRole }) {
  return (
    <Card>
      <article className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="font-mono text-[28px] font-semibold leading-[1.3] text-[#121F38]">
              {role.title}
            </h2>
            <Badge>{formatType(role.type)}</Badge>
          </div>

          <p className="font-sans text-sm leading-[1.6] text-[#6B7896]">
            {role.location}
          </p>

          <p className="line-clamp-2 font-sans text-base leading-[1.7] text-[#2C3A52]">
            {role.description}
          </p>
        </div>

        <details name="career-application" className="group space-y-5">
          <summary className="inline-flex h-11 cursor-pointer list-none items-center justify-center rounded-md bg-[#121F38] px-4 font-sans text-sm font-medium text-white hover:bg-[#1A2D4F] marker:hidden">
            Apply
          </summary>
          <ApplicationForm careerId={role.id} careerTitle={role.title} />
        </details>
      </article>
    </Card>
  );
}

export default async function CareersPage() {
  const openRoles = await getOpenRoles();

  return (
    <main className="bg-white">
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-3xl space-y-6">
            <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-[56px]">
              Work With Us
            </h1>
            <p className="font-sans text-lg leading-[1.75] text-[#2C3A52]">
              We&apos;re a small team building products for African markets. If
              you care about what we&apos;re building, we want to hear from you.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-5xl px-6">
          <p className="max-w-3xl font-sans text-lg leading-[1.75] text-[#2C3A52]">
            We are remote-friendly, early stage, and practical about how strong
            contributors create value. Equity may be considered for people who
            bring exceptional ownership and long-term commitment.
          </p>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-5xl px-6">
          {openRoles.length > 0 ? (
            <div className="space-y-6">
              {openRoles.map((role) => (
                <RoleCard key={role.id} role={role} />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <p className="font-sans text-lg leading-[1.75] text-[#2C3A52]">
                No open roles right now.
              </p>
              <Button asChild variant="ghost" className="px-0">
                <Link href="/contact">Send us a message anyway &rarr;</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
