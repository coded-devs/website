import type { ArticleCardData, SectionCopy } from '../../types/home';
import { ArticleCard } from '../article-card';
import { Container } from '../container';
import { Reveal } from '../reveal';
import { TextLink } from '../text-link';
import { SectionHeading } from './section-heading';
import styles from './insights.module.css';

/** Two-column list of the latest articles with square thumbnails. */
export function Insights({
  content,
}: {
  content: SectionCopy & { items: ArticleCardData[] };
}) {
  if (content.items.length === 0) return null;
  return (
    <section
      id="insights"
      className={styles.section}
      aria-labelledby="insights-title"
    >
      <Container>
        <SectionHeading
          id="insights-title"
          heading={content.heading}
          aside={
            <TextLink href="/insights" variant="standalone">
              View all insights
            </TextLink>
          }
        />
        <ul className={styles.list}>
          {content.items.slice(0, 4).map((article, index) => (
            <Reveal as="li" key={article.slug} delay={(index % 2) * 100}>
              <ArticleCard article={article} variant="row" />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
