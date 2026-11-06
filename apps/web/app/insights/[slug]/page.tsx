import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArticleCard,
  formatArticleDate,
} from '../../../src/components/article-card';
import { Container } from '../../../src/components/container';
import { ArrowLeftIcon } from '../../../src/components/icons';
import { ImageFrame } from '../../../src/components/image-frame';
import { Reveal } from '../../../src/components/reveal';
import {
  getArticle,
  getRelatedArticles,
} from '../../../src/lib/insights-content';
import styles from './article.module.css';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return {
      title: 'Article not found | CodedDevs',
      description:
        'The requested article could not be found or has not been published.',
    };
  }
  const title = article.metaTitle || `${article.title} | CodedDevs Insights`;
  const description = article.metaDescription || article.excerpt;
  return {
    title,
    description,
    alternates: {
      canonical: article.canonicalUrl || `/insights/${article.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.publishedAt,
      images: article.cover
        ? [{ url: article.cover.src, alt: article.cover.alt }]
        : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article.slug);
  // The body format is an open decision (design.md); until then, blank lines
  // separate paragraphs.
  const paragraphs = article.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <article aria-labelledby="article-title">
        <Container width="text">
          <header className={styles.head}>
            <Link href="/insights" className={styles.back}>
              <ArrowLeftIcon size={14} />
              All insights
            </Link>
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
            <h1 id="article-title" className={styles.title}>
              {article.title}
            </h1>
            <p className={styles.excerpt}>{article.excerpt}</p>
          </header>
        </Container>

        {article.cover ? (
          <Container className={styles.cover}>
            <ImageFrame
              image={article.cover}
              ratio="16:9"
              bezel
              priority
              sizes="(min-width: 75rem) 1280px, 100vw"
            />
          </Container>
        ) : null}

        <Container width="text">
          <div className={styles.prose}>
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {article.tags.length > 0 ? (
            <footer className={styles.foot}>
              <h2 className={styles.footLabel}>Tags</h2>
              <ul className={styles.tags}>
                {article.tags.map((tag) => (
                  <li key={tag} className={styles.tagChip}>
                    {tag}
                  </li>
                ))}
              </ul>
            </footer>
          ) : null}
        </Container>
      </article>

      {related.length > 0 ? (
        <section
          className={styles.related}
          data-surface="white"
          aria-labelledby="related-title"
        >
          <Container>
            <h2 id="related-title" className={styles.relatedTitle}>
              More from CodedDevs
            </h2>
            <ul className={styles.relatedGrid}>
              {related.map((item, index) => (
                <Reveal as="li" key={item.slug} delay={index * 90}>
                  <ArticleCard article={item} />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}
    </>
  );
}
