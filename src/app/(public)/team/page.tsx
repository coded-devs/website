import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { GithubIcon, LinkedinIcon, XIcon } from "@/components/ui/icons";
import { getActiveTeamMembers } from "@/db/queries";
import { getTeamPortraitUrl } from "@/lib/cloudinary";
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

/** The first three rows are the founders — they get the wider treatment. */
const LEAD_COUNT = 3;

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

type SocialLink = {
  label: string;
  href: string | null;
  icon: "github" | "linkedin" | "x";
};

function SocialIcon({ icon }: { icon: SocialLink["icon"] }) {
  if (icon === "github") {
    return <GithubIcon aria-hidden="true" />;
  }

  if (icon === "linkedin") {
    return <LinkedinIcon aria-hidden="true" />;
  }

  return <XIcon aria-hidden="true" />;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function Member({
  member,
  lead,
  priority,
}: {
  member: TeamMemberSummary;
  lead: boolean;
  priority: boolean;
}) {
  const photo = getTeamPortraitUrl(member.photo_url);
  const links: SocialLink[] = [
    { label: "GitHub", href: member.github_url, icon: "github" },
    { label: "LinkedIn", href: member.linkedin_url, icon: "linkedin" },
    { label: "X", href: member.twitter_url, icon: "x" },
  ];
  const visibleLinks = links.filter((link) => link.href);

  return (
    <article>
      <div className="member__photo">
        {photo ? (
          <Image
            src={photo}
            alt={member.name}
            fill
            sizes={
              lead
                ? "(min-width: 1280px) 360px, (min-width: 768px) 33vw, 100vw"
                : "(min-width: 1280px) 288px, (min-width: 640px) 33vw, 100vw"
            }
            priority={priority}
          />
        ) : (
          <span className="member__initials" aria-hidden="true">
            {getInitials(member.name)}
          </span>
        )}
      </div>

      <h2 className="member__name">{member.name}</h2>
      <p className="member__role">{member.role}</p>
      <p className="member__bio">{member.bio}</p>

      {visibleLinks.length > 0 ? (
        <div className="member__social">
          {visibleLinks.map((link) => (
            <a
              key={link.label}
              href={link.href ?? ""}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} on ${link.label}`}
            >
              <SocialIcon icon={link.icon} />
            </a>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default async function TeamPage() {
  const members = await getActiveTeamMembers();
  const isDev = process.env.NODE_ENV === "development";

  const leads = members.slice(0, LEAD_COUNT);
  const rest = members.slice(LEAD_COUNT);

  return (
    <main id="main">
      <section className="pagehead">
        <div className="rail">
          <p className="eyebrow">Team</p>
          <h1>Who builds this</h1>
          <p className="pagehead__sub">
            Three founders who write the code they ship, supported by a growing
            team of designers, developers, and creators working out of Lagos.
          </p>
          {members.length > 0 ? (
            <p className="pagehead__count">
              {members.length} {members.length === 1 ? "person" : "people"}
            </p>
          ) : null}
        </div>
      </section>

      {members.length > 0 ? (
        <section className="band">
          <div className="rail">
            <Reveal stagger className="team team--lead">
              {leads.map((member, index) => (
                <Member
                  key={member.id}
                  member={member}
                  lead
                  priority={index === 0}
                />
              ))}
            </Reveal>

            {rest.length > 0 ? (
              <Reveal stagger className="team team--rest">
                {rest.map((member) => (
                  <Member
                    key={member.id}
                    member={member}
                    lead={false}
                    priority={false}
                  />
                ))}
              </Reveal>
            ) : null}
          </div>
        </section>
      ) : isDev ? (
        <section className="band">
          <div className="rail">
            <p className="emptystate">
              No team members yet — add one via the admin dashboard.
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
