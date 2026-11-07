import type { ArticleCardData, ProductItem } from '../../types/home';
import { formatArticleDate } from '../article-card';
import { Container } from '../container';
import { MediaCard } from '../media-card';
import { Reveal } from '../reveal';
import styles from './featured.module.css';

interface FeaturedProps {
  product?: ProductItem;
  article?: ArticleCardData;
}

/**
 * OpenAI-style feature row under the hero: a large card for the flagship
 * product beside a smaller card for the latest article. Derived from the
 * first visible product and the newest published article.
 */
export function Featured({ product, article }: FeaturedProps) {
  if (!product && !article) return null;
  return (
    <section className={styles.section} aria-label="Featured">
      <Container className={styles.grid}>
        {product ? (
          <Reveal className={styles.main}>
            <MediaCard
              title={product.name}
              image={product.image}
              ratio="16:9"
              size="xl"
              headingLevel={2}
              label="Product"
              meta={[product.sector, product.badge].filter(
                (part): part is string => Boolean(part),
              )}
              text={product.tagline}
              href="/#products"
              sizes="(min-width: 75rem) 820px, 92vw"
              priority
            />
          </Reveal>
        ) : null}
        {article ? (
          <Reveal delay={120} className={styles.side}>
            <MediaCard
              title={article.title}
              image={article.cover}
              ratio="1:1"
              size="lg"
              headingLevel={2}
              label={article.tag ?? 'Insight'}
              meta={[
                formatArticleDate(article.publishedAt),
                ...(article.readTimeMinutes
                  ? [`${article.readTimeMinutes} min read`]
                  : []),
              ]}
              href={`/insights/${encodeURIComponent(article.slug)}`}
              sizes="(min-width: 75rem) 400px, 92vw"
            />
          </Reveal>
        ) : null}
      </Container>
    </section>
  );
}
