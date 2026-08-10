"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExternalLinkIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/blog", label: "Blog" },
  { href: "/team", label: "Team" },
];

function isActiveLink(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Drives the compaction: 84px -> 58px, mark 40px -> 29px, CTA 40px -> 34px.
  // The border only appears once the page has moved, so the header sits flush
  // against the hero at rest instead of drawing a permanent line across it.
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      burgerRef.current?.focus();
    };

    // Crossing into desktop would otherwise leave the panel open, and it would
    // reappear on the way back down without the user ever asking for it.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onChange);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onChange);
    };
  }, [isOpen]);

  return (
    <header className={cn("nav", isScrolled && "is-scrolled", isOpen && "is-open")}>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <div className="rail nav__inner">
        <Link href="/" aria-label="CodedDevs home" className="inline-flex shrink-0 items-center">
          <Image
            className="nav__mark"
            src="/logos/mark.svg"
            alt="CodedDevs"
            width={1017}
            height={792}
            priority
          />
        </Link>

        <nav className="nav__links" aria-label="Primary">
          {navLinks.map((link) => {
            const isActive = isActiveLink(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn("nav__link", isActive && "is-active")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="nav__right">
          <a
            className="nav__cta"
            href="https://twizrr.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Try twizrr
            <ExternalLinkIcon width={14} height={14} />
          </a>

          <button
            ref={burgerRef}
            type="button"
            className="nav__burger"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            aria-controls="nav-panel"
            onClick={() => setIsOpen((current) => !current)}
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {/* Always mounted — the panel animates on max-height, and an element that
          only exists while open has no collapsed state to animate from. */}
      {/* inert, not per-link tabIndex: the panel is only clipped by max-height,
          so without it the collapsed links stay in the accessibility tree and a
          screen reader still reaches them. inert removes focus and AT exposure
          for the whole subtree in one place. */}
      <div className="nav__panel" id="nav-panel" inert={!isOpen}>
        <nav className="rail" aria-label="Mobile">
          <ul>
            {navLinks.map((link) => {
              const isActive = isActiveLink(pathname, link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <a
                className="nav__panelCta"
                href="https://twizrr.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
              >
                Try twizrr
                <ExternalLinkIcon width={14} height={14} />
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
