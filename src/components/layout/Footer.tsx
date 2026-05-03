import Image from "next/image";
import Link from "next/link";
import type { SVGProps } from "react";
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
              <h2 className="font-mono text-sm font-medium text-[#121F38]">
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
              <h2 className="font-mono text-sm font-medium text-[#121F38]">
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
