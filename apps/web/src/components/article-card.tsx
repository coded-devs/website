import Link from 'next/link';
import type { ArticleCardData } from '../types/home';
import { ImageFrame } from './image-frame';
import styles from './article-card.module.css';

interface ArticleCardProps {
  article: ArticleCardData;
  /** 'row': thumbnail beside text. 'card': image on top. 'lead': large split. */
  variant?: 'row' | 'card' | 'lead';
  headingLevel?: 2 | 3;
  priority?: boolean;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatArticleDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateFormat.format(date);
}

/** The title link covers the whole card; the focus ring wraps the card. */
export function ArticleCard({
  article,
  variant = 'card',
  headingLevel = 3,
  priority,
}: ArticleCardProps) {
  const Heading = `h${headingLevel}` as const;
  const ratio = variant === 'row' ? '1:1' : '3:2';
  const sizes =
    variant === 'lead'
      ? '(min-width: 75rem) 700px, 92vw'
      : variant === 'row'
        ? '(min-width: 48rem) 180px, 112px'
        : '(min-width: 75rem) 400px, (min-width: 48rem) 45vw, 92vw';
  return (
    <article className={`${styles.card} ${styles[variant]}`} data-group>
      <ImageFrame
        image={article.cover}
        ratio={ratio}
        sizes={sizes}
        priority={priority}
        className={styles.media}
      />
      <div className={styles.body}>
        <p className={styles.meta}>
          {article.tag ? (
            <span className={styles.tag}>{article.tag}</span>
          ) : null}
          <time dateTime={article.publishedAt}>
            {formatArticleDate(article.publishedAt)}
          </time>
          {article.readTimeMinutes ? (
            <span>{article.readTimeMinutes} min read</span>
          ) : null}
        </p>
        <Heading className={styles.title}>
          <Link href={`/insights/${encodeURIComponent(article.slug)}`}>
            {article.title}
          </Link>
        </Heading>
        {variant === 'row' ? null : (
          <p className={styles.excerpt}>{article.excerpt}</p>
        )}
      </div>
    </article>
  );
}
