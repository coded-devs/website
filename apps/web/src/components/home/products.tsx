import type { ProductItem, SectionCopy } from '../../types/home';
import { Container } from '../container';
import { MediaCard } from '../media-card';
import { Reveal } from '../reveal';
import { SectionHeading } from './section-heading';
import styles from './products.module.css';

/** Even row of product cards (OpenAI "Latest research" pattern). */
export function Products({
  content,
}: {
  content: SectionCopy & { items: ProductItem[] };
}) {
  if (content.items.length === 0) return null;
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
        <ul className={styles.grid}>
          {content.items.map((product, index) => (
            <Reveal as="li" key={product.name} delay={index * 80}>
              <MediaCard
                title={product.name}
                image={product.image}
                ratio="1:1"
                size="lg"
                label={product.sector}
                meta={product.badge ? [product.badge] : []}
                text={product.tagline}
                href={product.url}
                sizes="(min-width: 75rem) 400px, (min-width: 48rem) 30vw, 92vw"
              />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
