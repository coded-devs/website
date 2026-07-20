"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/blog", label: "Blog", emphasis: true },
  { href: "/team", label: "Team", emphasis: true },
];

function isActiveLink(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#C4CAD6] bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-8 lg:px-10 xl:px-12">
        <Link href="/" aria-label="CodedDevs home" onClick={() => setIsOpen(false)}>
          <Image
            src="/logos/mark.svg"
            alt="CodedDevs Technology LTD"
            width={48}
            height={48}
            className="h-20 w-18"
            priority
          />
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          <nav className="flex items-center gap-7" aria-label="Primary">
            {navLinks.map((link) => {
              const isActive = isActiveLink(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "font-sans text-base leading-none",
                    link.emphasis && "font-semibold",
                    isActive
                      ? "text-[#121F38]"
                      : "text-[#2C3A52] hover:text-[#121F38]",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="h-8 w-px bg-[#C4CAD6]" aria-hidden="true" />

          <Button
            asChild
            size="sm"
            variant="secondary"
            className="h-11 border-[#121F38] px-5 text-base font-semibold text-[#121F38] hover:bg-[#121F38] hover:text-white"
          >
            <a href="https://twizrr.com" target="_blank" rel="noopener noreferrer">
              Try TWIZRR
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md text-[#121F38] lg:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {isOpen ? (
        <nav
          className="border-t border-[#C4CAD6] bg-white px-6 py-5 lg:hidden"
          aria-label="Mobile primary"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-3">
            {navLinks.map((link) => {
              const isActive = isActiveLink(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-2 py-2 font-sans text-sm",
                    link.emphasis && "font-semibold",
                    isActive
                      ? "text-[#121F38]"
                      : "text-[#6B7896] hover:text-[#121F38]",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <Button asChild className="mt-2 w-full">
              <a
                href="https://twizrr.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
              >
                Try TWIZRR
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
