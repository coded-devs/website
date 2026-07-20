import Image from "next/image";
import Link from "next/link";
import type { ReactNode, SVGProps } from "react";
import {
  GithubIcon,
  InstagramIcon,
  TiktokIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/ui/icons";

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
      { href: "/blog", label: "Product updates" },
    ],
  },
  {
    title: "Highlights",
    links: [
      { href: "/#featured-story", label: "Featured story" },
      { href: "/#latest-releases", label: "Latest releases" },
      { href: "/#recognition", label: "Recognition" },
      { href: "/blog", label: "All blog posts" },
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
      {
        href: "https://github.com/coded-devs",
        label: "GitHub",
        external: true,
      },
      {
        href: "mailto:codeddevs.team@gmail.com",
        label: "Email",
        external: true,
      },
      {
        href: "https://x.com/CodedDevs",
        label: "X",
        external: true,
      },
      {
        href: "https://www.instagram.com/codeddevs_",
        label: "Instagram",
        external: true,
      },
    ],
  },
];

const socialLinks: SocialLink[] = [
  { href: "https://github.com/coded-devs", label: "GitHub", Icon: GithubIcon },
  { href: "https://x.com/CodedDevs", label: "X", Icon: XIcon },
  { href: "https://www.tiktok.com/@CodedDevs", label: "TikTok", Icon: TiktokIcon },
  { href: "https://www.youtube.com/@CodedDevs", label: "YouTube", Icon: YoutubeIcon },
  {
    href: "https://www.instagram.com/codeddevs_",
    label: "Instagram",
    Icon: InstagramIcon,
  },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className = link.emphasized
    ? "font-sans text-sm font-semibold text-white hover:text-[#D1D6E0]"
    : "font-sans text-sm text-[#D1D6E0] hover:text-white";

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

function FooterMeta({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      className={
        mobile
          ? "mt-12 border-t border-[#D1D6E0]/20 pt-8 lg:hidden"
          : "hidden lg:block"
      }
    >
      <div className="space-y-1 font-sans text-sm leading-6 text-[#D1D6E0]">
        <p>&copy; 2026 CodedDevs Technology LTD.</p>
        <p>RC: 9426867 · Lagos, Nigeria</p>
      </div>
      <div className="mt-5 flex items-center gap-4">
        {socialLinks.map(({ href, label, Icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="text-[#D1D6E0] hover:text-white"
          >
            <Icon className="h-5 w-5" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer id="footer" className="bg-[#121F38] text-white">
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-8 md:py-20 lg:px-10 xl:px-12">
        <div className="grid gap-14 lg:min-h-[430px] lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-28">
          <div className="flex flex-col justify-between">
            <div>
              <Link href="/" aria-label="CodedDevs home" className="inline-flex">
                <Image
                  src="/logos/wordmark.svg"
                  alt="CodedDevs Technology LTD"
                  width={190}
                  height={72}
                  className="h-[120px] w-[135px] brightness-0 invert md:w-[190px]"
                />
              </Link>
            </div>
            <FooterMeta />
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4 md:gap-x-10 xl:gap-x-16"
          >
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="font-mono text-xs font-semibold uppercase !text-white">
                  {group.title}
                </h2>
                <ul className="mt-5 space-y-3.5">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.href}-${link.label}`}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <FooterMeta mobile />
      </div>
    </footer>
  );
}
