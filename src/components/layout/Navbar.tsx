"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/blog", label: "Updates" },
  { href: "/team", label: "Team" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

function isActiveLink(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#C4CAD6] bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" aria-label="CodedDevs home" onClick={() => setIsOpen(false)}>
          <Image
            src="/logos/wordmark.svg"
            alt="CodedDevs Technology LTD"
            width={58}
            height={48}
            priority
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {navLinks.map((link) => {
            const isActive = isActiveLink(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-sans text-sm",
                  isActive
                    ? "font-medium text-[#121F38]"
                    : "text-[#6B7896] hover:text-[#121F38]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Button asChild size="sm">
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md text-[#121F38] md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? (
            <CloseIcon className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {isOpen ? (
        <nav
          className="border-t border-[#C4CAD6] bg-white px-6 py-4 md:hidden"
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
                    isActive
                      ? "font-medium text-[#121F38]"
                      : "text-[#6B7896] hover:text-[#121F38]",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <Button asChild className="mt-2 w-full">
              <Link href="/contact" onClick={() => setIsOpen(false)}>
                Get in Touch
              </Link>
            </Button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
