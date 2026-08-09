import Image from "next/image";
import Link from "next/link";
import { ExternalLinkIcon } from "@/components/ui/icons";

const facts = [
  { label: "Registered", value: "RC 9426867" },
  { label: "Headquarters", value: "Lagos, Nigeria" },
  { label: "Incorporated", value: "March 2026" },
  { label: "Live product", value: "twizrr" },
  { label: "Team size", value: "7 members" },
];

/**
 * Four copies, shifted by two. One copy is ~985px, so a two-copy period clears
 * the widest viewport — at two copies the tail runs out mid-cycle and a blank
 * gap sweeps through. Only the first is exposed to assistive tech.
 */
const trackCopies = [0, 1, 2, 3];

function FactGrid({ hidden }: { hidden?: boolean }) {
  return (
    <div className="factrail__grid" aria-hidden={hidden || undefined}>
      {facts.map((fact) => (
        <div className="fact" key={fact.label}>
          <p className="fact__k">{fact.label}</p>
          <p className="fact__v">{fact.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-h1">
      <div className="rail">
        <div className="hero__grid">
          {/* Row 1 — one hairline, carried across both fields. */}
          <div className="hero__index">
            <b>CODEDDEVS</b>
            <span>Technology LTD · Lagos</span>
          </div>

          <div className="hero__meta">
            <p>Software · Payments · AI</p>
            <span className="hero__live">
              <i aria-hidden="true" />
              <span>twizrr live</span>
            </span>
          </div>

          {/* Row 2 */}
          <div className="hero__copy">
            <h1 id="hero-h1">Engineering software that works for Africa</h1>

            <p className="hero__sub">
              We build AI-first software products for African markets — from
              first principles, not adaptations.
            </p>

            <div className="hero__ctas">
              <a
                className="btn btn--primary"
                href="https://twizrr.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Try twizrr
                <ExternalLinkIcon width={16} height={16} />
              </a>
              <Link className="btn btn--ghost" href="/products">
                See what we build
              </Link>
            </div>
          </div>

          <div className="hero__panel">
            <Image
              className="hero__kody"
              src="/mascot/kody.svg"
              alt="Kody, the CodedDevs mascot"
              width={693}
              height={1922}
              priority
            />
          </div>
        </div>
      </div>

      {/* tabIndex makes the rail itself the pause mechanism for keyboard users
          (WCAG 2.2.2, no visible control), and it is what lets the
          reduced-motion variant — overflow-x:auto — be scrolled without a
          mouse. */}
      <div
        className="factrail"
        id="factrail"
        /* Deliberate: this is the WCAG 2.2.2 pause affordance for keyboard
           users, and under prefers-reduced-motion the rail becomes
           overflow-x:auto, which is only scrollable without a mouse if it can
           take focus. */
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="group"
        aria-label="Company facts"
      >
        <div className="factrail__track">
          {trackCopies.map((copy) => (
            <FactGrid key={copy} hidden={copy > 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
