import type { Metadata } from "next";
import Image from "next/image";
import { asc, eq } from "drizzle-orm";
import Card from "@/components/ui/Card";
import { GithubIcon, LinkedinIcon, XIcon } from "@/components/ui/icons";
import { db, teamMembers } from "@/db";
import { getTeamPhotoUrl } from "@/lib/cloudinary";
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

function SocialIcon({ icon }: { icon: SocialLink["icon"] }) {
  if (icon === "github") {
    return <GithubIcon className="h-4 w-4" />;
  }

  if (icon === "linkedin") {
    return <LinkedinIcon className="h-4 w-4" />;
  }

  return <XIcon className="h-4 w-4" />;
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
  } catch (error) {
    console.error("[team] getTeamMembers failed:", error);
    return [];
  }
}

function MemberPhoto({ member }: { member: TeamMemberSummary }) {
  if (member.photo_url) {
    return (
      <div className="relative h-20 w-20 overflow-hidden rounded-full bg-[#D1D6E0]">
        <Image
          src={getTeamPhotoUrl(member.photo_url)}
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
      <article className="flex flex-1 flex-col gap-6">
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
              Three founders, supported by a growing team of designers, developers, and creators building from Lagos.
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
