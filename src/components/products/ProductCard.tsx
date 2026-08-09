import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ExternalLinkIcon } from "@/components/ui/icons";
import { getProductCoverUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { ProductSelect } from "@/types";

export type ProductCardProduct = Pick<
  ProductSelect,
  "id" | "name" | "slug" | "tagline" | "cover_url" | "external_url" | "status"
>;

/**
 * - `row` — full-width editorial row for /products, cover side alternating.
 * - `grid` — supporting card in a multi-column grid.
 */
export type ProductCardVariant = "row" | "grid";

type ProductCardProps = {
  product: ProductCardProduct;
  variant?: ProductCardVariant;
  /** `row` only: put the cover on the right instead of the left. */
  reversed?: boolean;
  priority?: boolean;
  className?: string;
};

const statusLabels: Record<ProductSelect["status"], string> = {
  development: "In development",
  live: "Live",
  archived: "Archived",
};

const statusClasses: Record<ProductSelect["status"], string> = {
  development: "badge badge--dev",
  live: "badge badge--live",
  archived: "badge",
};

export function StatusBadge({ status }: { status: ProductSelect["status"] }) {
  return <span className={statusClasses[status]}>{statusLabels[status]}</span>;
}

/** "Visit twizrr.com" reads better than a bare "Visit", and the host is the one
 *  piece of the URL a visitor actually recognises. */
export function visitLabel(url: string) {
  try {
    return `Visit ${new URL(url).hostname.replace(/^www\./, "")}`;
  } catch {
    return "Visit";
  }
}

function Cover({
  product,
  wide,
  priority,
}: {
  product: ProductCardProduct;
  wide?: boolean;
  priority: boolean;
}) {
  const src = getProductCoverUrl(product.cover_url);

  return (
    <div className={wide ? "cover cover--wide" : "cover"}>
      {src ? (
        <Image
          src={src}
          alt={`${product.name} cover`}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority={priority}
        />
      ) : (
        <span className="cover__ph" aria-hidden="true">
          {product.name}
        </span>
      )}
    </div>
  );
}

/**
 * One card system for every product surface. AGENTS.md §3: cards are not the
 * default container, so these lean on imagery and type rather than borders.
 */
export default function ProductCard({
  product,
  variant = "grid",
  reversed = false,
  priority = false,
  className,
}: ProductCardProps) {
  const actions = (
    <div className="prod__actions">
      <Link className="link" href={`/products/${product.slug}`}>
        Learn more
        <ArrowRightIcon width={16} height={16} aria-hidden="true" />
      </Link>

      {product.external_url ? (
        <a
          className="link link--quiet"
          href={product.external_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {visitLabel(product.external_url)}
          <ExternalLinkIcon width={16} height={16} aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );

  if (variant === "grid") {
    return (
      <article className={cn("prodcard", className)}>
        <Cover product={product} wide priority={priority} />
        <div className="prodcard__head">
          <h3 className="prodcard__name">{product.name}</h3>
          <StatusBadge status={product.status} />
        </div>
        <p>{product.tagline}</p>
        <Link className="link" href={`/products/${product.slug}`}>
          Learn more
          <ArrowRightIcon width={16} height={16} aria-hidden="true" />
        </Link>
      </article>
    );
  }

  return (
    <article
      className={cn("prodrow", reversed && "prodrow--flip", className)}
    >
      <Cover product={product} priority={priority} />
      <div>
        <div className="prod__head">
          <h2 className="prod__name">{product.name}</h2>
          <StatusBadge status={product.status} />
        </div>
        <p className="prod__tag">{product.tagline}</p>
        {actions}
      </div>
    </article>
  );
}
