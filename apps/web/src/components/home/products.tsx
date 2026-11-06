import type { ProductItem, SectionCopy } from '../../types/home';
import { ButtonLink } from '../button';
import { Container } from '../container';
import { ImageFrame } from '../image-frame';
import { Reveal } from '../reveal';
import { SectionHeading } from './section-heading';
import styles from './products.module.css';

export function Products({
  content,
}: {
  content: SectionCopy & { items: ProductItem[] };
}) {
  if (content.items.length === 0) return null;
  const [feature, ...others] = content.items;
  return (
    <section
      id="products"
      className={styles.section}
      data-surface="white"
      aria-labelledby="products-title"
    >
      <Container>
        <SectionHeading
          id="products-title"
          heading={content.heading}
          introduction={content.introduction}
        />
        <div className={styles.bento}>
          {feature ? (
            <Reveal className={`${styles.shell} ${styles.feature}`}>
              <ProductCard product={feature} featured />
            </Reveal>
          ) : null}
          {others.map((product, index) => (
            <Reveal
              key={product.name}
              delay={(index + 1) * 100}
              className={styles.shell}
            >
              <ProductCard product={product} dark={index === 0} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ProductCard({
  product,
  featured,
  dark,
}: {
  product: ProductItem;
  featured?: boolean;
  dark?: boolean;
}) {
  return (
    <article
      className={`${styles.core} ${featured ? styles.coreFeature : styles.coreSmall}`}
      data-surface={dark ? 'ink' : undefined}
      data-group
    >
      <ImageFrame
        image={product.image}
        ratio={featured ? '3:2' : '1:1'}
        sizes={
          featured
            ? '(min-width: 75rem) 680px, 90vw'
            : '(min-width: 75rem) 220px, 40vw'
        }
        className={styles.media}
      />
      <div className={styles.body}>
        <p className={styles.meta}>
          {product.badge ? (
            <span className={styles.badge}>{product.badge}</span>
          ) : null}
          {product.sector ? <span>{product.sector}</span> : null}
        </p>
        <h3 className={featured ? styles.titleLarge : styles.title}>
          {product.name}
        </h3>
        <p className={styles.tagline}>
          {featured ? product.description : product.tagline}
        </p>
        {product.url ? (
          <div className={styles.link}>
            <ButtonLink
              href={product.url}
              variant="secondary"
              size="sm"
              withArrow
            >
              Visit {product.name}
            </ButtonLink>
          </div>
        ) : null}
      </div>
    </article>
  );
}
