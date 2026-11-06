import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleCard } from '../../src/components/article-card';
import { ButtonLink } from '../../src/components/button';
import { Container } from '../../src/components/container';
import { EmptyState } from '../../src/components/empty-state';
import { Reveal } from '../../src/components/reveal';
import { getInsightsPage } from '../../src/lib/insights-content';
import styles from './insights.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Insights | CodedDevs',
  description:
    'Articles, company updates and technical writing from the CodedDevs team.',
  openGraph: {
    title: 'Insights | CodedDevs',
    description:
      'Articles, company updates and technical writing from the CodedDevs team.',
    type: 'website',
  },
};

interface InsightsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function InsightsPage({
  searchParams,
}: InsightsPageProps) {
  const requested = Number.parseInt((await searchParams).page ?? '1', 10);
  const pageNumber =
    Number.isFinite(requested) && requested > 0 ? requested : 1;
  const { items, page, totalPages } = await getInsightsPage(pageNumber);
  const [lead, ...rest] = pageNumber === 1 ? items : [undefined, ...items];

  return (
    <>
      <Container>
        <header className={styles.head}>
          <h1 className={styles.title}>Insights</h1>
          <p className={styles.intro}>
            Articles, company updates and technical writing from the CodedDevs
            team.
          </p>
        </header>
      </Container>

      {items.length === 0 ? (
        <EmptyState
          heading="No insights yet"
          body="We publish articles and company updates here. Check back soon."
          action={
            <ButtonLink href="/" variant="secondary">
              Back to home
            </ButtonLink>
          }
        />
      ) : (
        <section aria-label="Published articles" className={styles.listing}>
          <Container>
            {lead ? (
              <Reveal className={styles.lead}>
                <ArticleCard
                  article={lead}
                  variant="lead"
                  headingLevel={2}
                  priority
                />
              </Reveal>
            ) : null}
            <ul className={styles.grid}>
              {rest.map((article, index) =>
                article ? (
                  <Reveal as="li" key={article.slug} delay={(index % 3) * 90}>
                    <ArticleCard article={article} headingLevel={2} />
                  </Reveal>
                ) : null,
              )}
            </ul>
            <nav className={styles.pagination} aria-label="Pagination">
              {page > 1 ? (
                <Link
                  className={styles.pageLink}
                  href={`/insights?page=${page - 1}`}
                >
                  Newer
                </Link>
              ) : (
                <span className={styles.pageLink} aria-disabled="true">
                  Newer
                </span>
              )}
              <p className={styles.pageStatus}>
                Page {page} of {Math.max(totalPages, 1)}
              </p>
              {page < totalPages ? (
                <Link
                  className={styles.pageLink}
                  href={`/insights?page=${page + 1}`}
                >
                  Older
                </Link>
              ) : (
                <span className={styles.pageLink} aria-disabled="true">
                  Older
                </span>
              )}
            </nav>
          </Container>
        </section>
      )}
    </>
  );
}
