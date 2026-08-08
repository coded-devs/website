import Image from "next/image";
import Link from "next/link";
import type { ReactNode, SVGProps } from "react";
import Reveal from "@/components/ui/Reveal";
import {
  GithubIcon,
  InstagramIcon,
  TiktokIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type SocialLink = {
  href: string;
  label: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
};

type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
  emphasized?: boolean;
};

type FooterGroup = {
  title: string;
  links: FooterLink[];
};

/**
 * Page links only — never home-page section anchors. Sections return null in
 * production when they have no content, so their DOM ids disappear and a
 * /#section link silently dies. AGENTS.md §9.
 */
const footerGroups: FooterGroup[] = [
  {
    title: "Product",
    links: [
      {
        href: "https://twizrr.com",
        label: "Try twizrr",
        external: true,
        emphasized: true,
      },
      { href: "/products", label: "All products" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/team", label: "Team" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Connect",
    links: [
      { href: "https://github.com/coded-devs", label: "GitHub", external: true },
      { href: "https://x.com/CodedDevs", label: "X", external: true },
      {
        href: "https://www.instagram.com/codeddevs_",
        label: "Instagram",
        external: true,
      },
      {
        href: "mailto:codeddevs.team@gmail.com",
        label: "Email",
        external: true,
      },
    ],
  },
];

const socialLinks: SocialLink[] = [
  { href: "https://github.com/coded-devs", label: "GitHub", Icon: GithubIcon },
  { href: "https://x.com/CodedDevs", label: "X", Icon: XIcon },
  {
    href: "https://www.tiktok.com/@CodedDevs",
    label: "TikTok",
    Icon: TiktokIcon,
  },
  {
    href: "https://www.youtube.com/@CodedDevs",
    label: "YouTube",
    Icon: YoutubeIcon,
  },
  {
    href: "https://www.instagram.com/codeddevs_",
    label: "Instagram",
    Icon: InstagramIcon,
  },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className = cn(link.emphasized && "is-strong");

  if (link.external) {
    const opensNewTab = !link.href.startsWith("mailto:");

    return (
      <a
        href={link.href}
        target={opensNewTab ? "_blank" : undefined}
        rel={opensNewTab ? "noopener noreferrer" : undefined}
        className={className}
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer id="footer" className="foot">
      <div className="rail">
        <Reveal className="foot__top">
          <div>
            <Link href="/" aria-label="CodedDevs home" className="inline-flex">
              <Image
                className="foot__wordmark"
                src="/logos/wordmark.svg"
                alt="CodedDevs Technology LTD"
                width={1448}
                height={1202}
              />
            </Link>

            <p className="foot__tag">
              Engineering software that works for Africa — built from first
              principles for African markets.
            </p>
          </div>

          <nav className="foot__nav" aria-label="Footer navigation">
            {footerGroups.map((group) => (
              <div className="foot__group" key={group.title}>
                {/* h3, not h2 — these label link lists, and three sibling h2s
                    down here would compete with the page's real section
                    headings in a screen reader's outline. */}
                <h3>{group.title}</h3>
                <ul>
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.href}-${link.label}`}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </Reveal>

        <Reveal className="foot__bottom">
          <div className="foot__legal">
            <p>&copy; {new Date().getFullYear()} CodedDevs Technology LTD.</p>
            <p>RC: 9426867 · Lagos, Nigeria</p>
          </div>

          <div className="foot__social">
            {socialLinks.map(({ href, label, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
              >
                <Icon />
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
