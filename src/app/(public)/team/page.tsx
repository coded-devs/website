import type { Metadata } from "next";
import Image from "next/image";
import { asc, eq } from "drizzle-orm";
import Card from "@/components/ui/Card";
import { db, teamMembers } from "@/db";
import { getOptimisedUrl } from "@/lib/cloudinary-url";
import type { TeamMember } from "@/types";

export const revalidate = 3600;

const title = "Team — CodedDevs Technology LTD";
const description =
  "Meet the founders of CodedDevs Technology LTD — three full-stack engineers building from Lagos.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://codeddevs.com/team",
    siteName: "CodedDevs Technology LTD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

type SocialLink = {
  label: string;
  href: string | null;
  icon: "github" | "linkedin" | "x";
};

type TeamMemberSummary = Pick<
  TeamMember,
  | "id"
  | "name"
  | "role"
  | "bio"
  | "photo_url"
  | "linkedin_url"
  | "github_url"
  | "twitter_url"
  | "order_index"
>;

const iconClasses = "h-4 w-4";

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={iconClasses}
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.86 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.13-4.56-5.04 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.04A9.34 9.34 0 0 1 12 6.99c.85 0 1.7.12 2.5.35 1.9-1.32 2.74-1.04 2.74-1.04.55 1.4.2 2.44.1 2.7.64.71 1.03 1.62 1.03 2.73 0 3.92-2.34 4.78-4.57 5.03.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.08 10.08 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={iconClasses}
    >
      <path d="M6.94 8.98H3.72v10.3h3.22V8.98ZM5.33 4.86c-1.03 0-1.87.84-1.87 1.87s.84 1.87 1.87 1.87 1.87-.84 1.87-1.87-.84-1.87-1.87-1.87Zm13.95 8.77c0-3.05-1.63-4.46-3.8-4.46-1.75 0-2.54.96-2.97 1.64V8.98H9.42v10.3h3.22v-5.1c0-1.35.26-2.66 1.93-2.66 1.65 0 1.67 1.54 1.67 2.75v5h3.04v-5.64Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={iconClasses}
    >
      <path d="M13.86 10.47 21.14 2h-1.72l-6.32 7.35L8.05 2H2.23l7.64 11.12L2.23 22h1.72l6.68-7.76L15.95 22h5.82l-7.91-11.53Zm-2.36 2.75-.78-1.1L4.57 3.3h2.65l4.96 7.1.77 1.1 6.47 9.27h-2.65l-5.27-7.55Z" />
    </svg>
  );
}

function SocialIcon({ icon }: { icon: SocialLink["icon"] }) {
  if (icon === "github") {
    return <GitHubIcon />;
  }

  if (icon === "linkedin") {
    return <LinkedInIcon />;
  }

  return <XIcon />;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

async function getTeamMembers() {
  try {
    return await db
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        role: teamMembers.role,
        bio: teamMembers.bio,
        photo_url: teamMembers.photo_url,
        linkedin_url: teamMembers.linkedin_url,
        github_url: teamMembers.github_url,
        twitter_url: teamMembers.twitter_url,
        order_index: teamMembers.order_index,
      })
      .from(teamMembers)
      .where(eq(teamMembers.is_active, true))
      .orderBy(asc(teamMembers.order_index));
  } catch {
    return [];
  }
}

function MemberPhoto({ member }: { member: TeamMemberSummary }) {
  if (member.photo_url) {
    return (
      <div className="relative h-20 w-20 overflow-hidden rounded-full bg-[#D1D6E0]">
        <Image
          src={getOptimisedUrl(member.photo_url)}
          alt={member.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D1D6E0] font-mono text-xl font-semibold text-[#121F38]">
      {getInitials(member.name)}
    </div>
  );
}

function MemberCard({ member }: { member: TeamMemberSummary }) {
  const links: SocialLink[] = [
    { label: "GitHub", href: member.github_url, icon: "github" },
    { label: "LinkedIn", href: member.linkedin_url, icon: "linkedin" },
    { label: "X", href: member.twitter_url, icon: "x" },
  ];
  const visibleLinks = links.filter((link) => link.href);

  return (
    <Card className="h-full">
      <article className="flex h-full flex-col gap-6">
        <MemberPhoto member={member} />

        <div className="space-y-2">
          <h2 className="font-mono text-xl font-semibold leading-[1.3] text-[#121F38]">
            {member.name}
          </h2>
          <p className="font-sans text-sm leading-[1.6] text-[#6B7896]">
            {member.role}
          </p>
        </div>

        <p className="font-sans text-base leading-[1.7] text-[#2C3A52]">
          {member.bio}
        </p>

        {visibleLinks.length > 0 ? (
          <div className="mt-auto flex items-center gap-3 text-[#121F38]">
            {visibleLinks.map((link) => (
              <a
                key={link.label}
                href={link.href ?? ""}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on ${link.label}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[#D1D6E0]"
              >
                <SocialIcon icon={link.icon} />
              </a>
            ))}
          </div>
        ) : null}
      </article>
    </Card>
  );
}

export default async function TeamPage() {
  const members = await getTeamMembers();

  return (
    <main className="bg-white">
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-3xl space-y-6">
            <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-[56px]">
              The Team
            </h1>
            <p className="font-sans text-lg leading-[1.75] text-[#2C3A52]">
              Three founders. All engineers. Building from Lagos.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
