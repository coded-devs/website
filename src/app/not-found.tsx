import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for does not exist.",
};

const suggestions = [
  { href: "/products", label: "Products", hint: "What we build and ship" },
  { href: "/blog", label: "Blog", hint: "Releases, notes, and stories" },
  { href: "/team", label: "Team", hint: "The people behind CodedDevs" },
];

/**
 * not-found.tsx has to live at src/app/ to catch every unmatched route, which
 * puts it outside the (public) group — so it renders the chrome itself rather
 * than inheriting it. Keep this shell in step with src/app/(public)/layout.tsx.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main id="main" className="flex-1">
        <section className="band band--roomy">
          <div className="rail">
            <div className="notfound">
              <div>
                <p className="eyebrow">Error 404</p>

                <h1 className="h2">This page took a wrong turn</h1>

                <p className="pagehead__sub">
                  The link you followed is broken, or the page has moved since
                  it was published. Nothing is lost — here is the way back.
                </p>

                <p className="prod__actions">
                  <Link className="btn btn--primary" href="/">
                    Back to home
                  </Link>
                </p>

                <ul className="notfound__routes">
                  {suggestions.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <strong>{item.label}</strong>
                        <span>{item.hint}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="notfound__kody">
                <Image
                  src="/mascot/kodysmile.svg"
                  alt=""
                  width={200}
                  height={200}
                  aria-hidden="true"
                  priority
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
