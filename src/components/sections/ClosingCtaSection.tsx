import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ExternalLinkIcon } from "@/components/ui/icons";

/**
 * The closing statement. Renders unconditionally, like the Belief band, so an
 * empty database still ends the page with a clear next step.
 */
export default function ClosingCtaSection() {
  return (
    <section className="band band--silver" aria-labelledby="cta-h2">
      <Reveal className="rail cta">
        <div>
          <p className="eyebrow">Get started</p>
          <h2 id="cta-h2">Start with the product that&rsquo;s live</h2>
          <p className="cta__body">
            twizrr is in the hands of sellers today. Everything else we are
            building, and everything we publish about it, lives on this site.
          </p>
        </div>
        <div className="cta__actions">
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
            All products
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
