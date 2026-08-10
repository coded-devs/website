import Image from "next/image";
import Link from "next/link";
import { StatusBadge, visitLabel } from "@/components/products/ProductCard";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon, ExternalLinkIcon } from "@/components/ui/icons";
import { getProductCoverUrl } from "@/lib/cloudinary";
import type { ProductSelect } from "@/types";

export type FeaturedProduct = Pick<
  ProductSelect,
  "id" | "name" | "slug" | "tagline" | "cover_url" | "external_url" | "status"
>;

type ProductsSectionProps = {
  products: FeaturedProduct[];
};

function Cover({
  url,
  name,
  wide,
  badge,
}: {
  url: string | null;
  name: string;
  wide?: boolean;
  badge?: string;
}) {
  const src = getProductCoverUrl(url);

  return (
    <div className={wide ? "cover cover--wide" : "cover"}>
      {src ? (
        <Image src={src} alt={`${name} cover`} fill sizes="(min-width: 1024px) 50vw, 100vw" />
      ) : (
        <span className="cover__ph" aria-hidden="true">
          {name}
        </span>
      )}
      {badge ? <span className="cover__badge">{badge}</span> : null}
    </div>
  );
}

export default function ProductsSection({ products }: ProductsSectionProps) {
  const isDev = process.env.NODE_ENV === "development";

  if (products.length === 0) {
    if (isDev) {
      return (
        <section className="band band--mist" id="products">
          <div className="rail">
            <div className="sectionhead">
              <div>
                <p className="eyebrow">Products</p>
                <h2 className="h2">What we&rsquo;re building</h2>
              </div>
            </div>
            <p className="emptystate">
              No featured products yet. Mark a product as featured in the admin
              dashboard.
            </p>
          </div>
        </section>
      );
    }

    return null;
  }

  const [lead, ...rest] = products;
  const support = rest.slice(0, 2);

  return (
    <section className="band band--mist" id="products" aria-labelledby="products-h2">
      <div className="rail">
        <Reveal className="sectionhead">
          <div>
            <p className="eyebrow">Products</p>
            <h2 className="h2" id="products-h2">
              What we&rsquo;re building
            </h2>
          </div>
          <Link className="link" href="/products">
            View all products
            <ArrowRightIcon width={16} height={16} />
          </Link>
        </Reveal>

        <Reveal as="article" className="prod-lead">
          <Cover url={lead.cover_url} name={lead.name} badge="Flagship" />
          <div>
            <div className="prod__head">
              <h3 className="prod__name">{lead.name}</h3>
              <StatusBadge status={lead.status} />
            </div>
            <p className="prod__tag">{lead.tagline}</p>
            <div className="prod__actions">
              <Link className="link" href={`/products/${lead.slug}`}>
                Learn more
                <ArrowRightIcon width={16} height={16} />
              </Link>
              {lead.external_url ? (
                <a
                  className="link link--quiet"
                  href={lead.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {visitLabel(lead.external_url)}
                  <ExternalLinkIcon width={16} height={16} />
                </a>
              ) : null}
            </div>
          </div>
        </Reveal>

        {support.length > 0 ? (
          <Reveal stagger className="prod-support">
            {support.map((product) => (
              <article className="prodcard" key={product.id}>
                <Cover url={product.cover_url} name={product.name} wide />
                <div className="prodcard__head">
                  <h3 className="prodcard__name">{product.name}</h3>
                  <StatusBadge status={product.status} />
                </div>
                <p>{product.tagline}</p>
                <Link className="link" href={`/products/${product.slug}`}>
                  Learn more
                  <ArrowRightIcon width={16} height={16} />
                </Link>
              </article>
            ))}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
