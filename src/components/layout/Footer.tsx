import Image from "next/image";
import Link from "next/link";
import type { SVGProps } from "react";

type SocialLink = {
  href: string;
  label: string;
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
};

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/team", label: "Team" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

const productLinks = [
  { href: "/products", label: "Products" },
  { href: "/blog", label: "Updates" },
];

function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.51 2.87 8.34 6.84 9.7.5.1.68-.22.68-.49v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.32 9.32 0 0 1 12 6.95c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.92-2.34 4.79-4.57 5.04.36.32.68.95.68 1.91v2.8c0 .27.18.59.69.49A10.13 10.13 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.9 10.47 21.35 2h-1.76l-6.47 7.35L7.95 2H2l7.82 11.12L2 22h1.76l6.84-7.77L16.05 22H22l-8.1-11.53Zm-2.42 2.75-.8-1.11L4.38 3.3h2.72l5.08 7.1.79 1.11 6.62 9.27h-2.72l-5.39-7.56Z" />
    </svg>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.61 3c.35 2.35 1.66 3.75 3.89 3.9v3.03a6.85 6.85 0 0 1-3.83-1.17v5.73c0 2.9-1.72 5.51-4.68 6.32-4.69 1.28-8.77-2.39-8.04-7.09.48-3.1 3.23-5.32 6.38-5.2v3.21a2.74 2.74 0 0 0-2.87 3.6 2.73 2.73 0 0 0 5.24-.97V3h3.91Z" />
    </svg>
  );
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.58 7.18a2.74 2.74 0 0 0-1.93-1.94C17.95 4.78 12 4.78 12 4.78s-5.95 0-7.65.46a2.74 2.74 0 0 0-1.93 1.94A28.63 28.63 0 0 0 2 12a28.63 28.63 0 0 0 .42 4.82 2.74 2.74 0 0 0 1.93 1.94c1.7.46 7.65.46 7.65.46s5.95 0 7.65-.46a2.74 2.74 0 0 0 1.93-1.94A28.63 28.63 0 0 0 22 12a28.63 28.63 0 0 0-.42-4.82ZM10 15.2V8.8l5.2 3.2L10 15.2Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5ZM12 7.25A4.75 4.75 0 1 1 12 16.75 4.75 4.75 0 0 1 12 7.25Zm0 2A2.75 2.75 0 1 0 12 14.75 2.75 2.75 0 0 0 12 9.25Zm5-2.45a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
    </svg>
  );
}

const socialLinks: SocialLink[] = [
  { href: "https://github.com/coded-devs", label: "GitHub", Icon: GithubIcon },
  { href: "https://x.com/CodedDevs", label: "X", Icon: XIcon },
  { href: "https://www.tiktok.com/@CodedDevs", label: "TikTok", Icon: TikTokIcon },
  { href: "https://www.youtube.com/@CodedDevs", label: "YouTube", Icon: YouTubeIcon },
  {
    href: "https://www.instagram.com/codeddevs_",
    label: "Instagram",
    Icon: InstagramIcon,
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#C4CAD6] bg-[#F4F5F8]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1fr_auto]">
          <div className="max-w-sm space-y-4">
            <Link href="/" aria-label="CodedDevs home" className="inline-flex">
              <Image
                src="/logos/mark.svg"
                alt="CodedDevs"
                width={40}
                height={40}
              />
            </Link>
            <p className="font-sans text-sm leading-6 text-[#2C3A52]">
              Building AI-first software products for African markets from
              first principles.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div>
              <h2 className="font-sans text-sm font-medium text-[#121F38]">
                Company
              </h2>
              <ul className="mt-4 space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-[#6B7896] hover:text-[#121F38]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-sans text-sm font-medium text-[#121F38]">
                Products
              </h2>
              <ul className="mt-4 space-y-3">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-[#6B7896] hover:text-[#121F38]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-[#C4CAD6] pt-6 md:flex-row md:items-center md:justify-between">
          <p className="font-sans text-sm text-[#6B7896]">
            &copy; 2026 CodedDevs Technology LTD. RC: 9426867.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map(({ href, label, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-[#6B7896] hover:text-[#121F38]"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
