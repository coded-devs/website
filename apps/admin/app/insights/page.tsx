'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAdminArticles, ArticleApiError } from '../../src/lib/articles-client';
import type { AdminArticle, ArticleStatus } from '../../src/types/article';
import { Button, DataTable, Feedback, PageHeader, SurfaceCard } from '../../src/components/admin-ui';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default function InsightsArticlesPage() {
  const [items, setItems] = useState<AdminArticle[]>([]);
  const [status, setStatus] = useState<ArticleStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminArticles({ status, page, limit: 20 });
      setItems(result.items);
      setTotal(result.total);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (cause) {
      setError(
        cause instanceof ArticleApiError
          ? cause.message
          : 'Could not load articles. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  return (
    <section className="admin-page articles-page">
      <PageHeader
        title="Insights articles"
        description="Write in Markdown, preview your article, and publish it to the website."
        actions={
          <Link className="ui-button ui-button-primary" href="/insights/new">
            New article
          </Link>
        }
      />

      {error ? <Feedback tone="error">{error}</Feedback> : null}

      <div className="articles-toolbar" role="group" aria-label="Article status">
        {([
          ['all', 'All'],
          ['draft', 'Drafts'],
          ['published', 'Published'],
        ] as const).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            variant={status === key ? 'primary' : 'secondary'}
            aria-pressed={status === key}
            onClick={() => {
              setPage(1);
              setStatus(key);
            }}
          >
            {label}
          </Button>
        ))}
        <span className="articles-total">{total} article{total === 1 ? '' : 's'}</span>
      </div>

      {loading ? (
        <SurfaceCard role="status">Loading articles…</SurfaceCard>
      ) : error ? null : items.length === 0 ? (
        <SurfaceCard className="articles-empty">
          <h2>No {status === 'all' ? '' : `${status} `}articles yet</h2>
          <p>Create an article draft, preview its Markdown, then publish when it is ready.</p>
          <Link className="ui-button ui-button-primary" href="/insights/new">
            Write your first article
          </Link>
        </SurfaceCard>
      ) : (
        <DataTable label="Insights articles">
          <table>
            <thead>
              <tr>
                <th scope="col">Article</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col">Published</th>
                <th scope="col">Read time</th>
                <th scope="col" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((article) => {
                const payload = article.publishedPayload ?? article.draftPayload;
                return (
                  <tr key={article.id}>
                    <td>
                      <Link href={`/insights/${article.id}/edit`} className="article-row-title">
                        {payload.title}
                      </Link>
                      {payload.isSpotlight ? <span className="article-spotlight">Spotlight</span> : null}
                    </td>
                    <td>{payload.tags?.[0] ?? '—'}</td>
                    <td><span className={`article-status is-${article.status}`}>{article.status === 'published' ? 'Published' : 'Draft'}</span></td>
                    <td>{article.publishedAt ? dateFormat.format(new Date(article.publishedAt)) : '—'}</td>
                    <td>{payload.readTimeMinutes ? `${payload.readTimeMinutes} min` : '—'}</td>
                    <td><Link href={`/insights/${article.id}/edit`}>Edit</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DataTable>
      )}

      {totalPages > 1 ? (
        <nav className="articles-pagination" aria-label="Article pages">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
          <span>Page {page} of {totalPages}</span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
        </nav>
      ) : null}
    </section>
  );
}
