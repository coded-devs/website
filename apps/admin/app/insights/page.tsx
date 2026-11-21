'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, FileEdit, Globe2 } from 'lucide-react';
import {
  fetchAdminArticles,
  ArticleApiError,
} from '../../src/lib/articles-client';
import type { AdminArticle, ArticleStatus } from '../../src/types/article';
import {
  Button,
  Feedback,
  PageHeader,
  SurfaceCard,
} from '../../src/components/admin-ui';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default function InsightsArticlesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<AdminArticle[]>([]);
  const status: ArticleStatus =
    searchParams.get('status') === 'draft' ? 'draft' : 'published';
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ published: number; draft: number }>({
    published: 0,
    draft: 0,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const requestId = useRef(0);

  function selectStatus(next: ArticleStatus) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'published') params.delete('status');
    else params.set('status', next);
    const query = params.toString();
    setPage(1);
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError(null);
    fetchAdminArticles({ status, page, limit: 20 })
      .then((result) => {
        if (requestId.current !== currentRequestId) return;
        setItems(result.items);
        setTotal(result.total);
        setPage(result.page);
        setTotalPages(result.totalPages);
      })
      .catch((cause) => {
        if (requestId.current !== currentRequestId) return;
        setError(
          cause instanceof ArticleApiError
            ? cause.message
            : 'Could not load articles. Please try again.',
        );
      })
      .finally(() => {
        if (requestId.current === currentRequestId) setLoading(false);
      });
    return () => {
      if (requestId.current === currentRequestId) requestId.current += 1;
    };
  }, [page, status]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAdminArticles({ status: 'published', page: 1, limit: 1 }),
      fetchAdminArticles({ status: 'draft', page: 1, limit: 1 }),
    ])
      .then(([published, draft]) => {
        if (!cancelled)
          setCounts({ published: published.total, draft: draft.total });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [total]);

  useEffect(() => {
    if (!filterOpen) return;
    function closeOnOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !filterRef.current?.contains(event.target)
      )
        setFilterOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setFilterOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [filterOpen]);

  return (
    <section className="admin-page articles-page">
      <PageHeader
        title="Insights articles"
        description="Write in Markdown, preview your article, and publish it to the website."
        actions={
          <div className="articles-header-actions">
            <div className="articles-status-picker" ref={filterRef}>
              <Button
                type="button"
                className="articles-status-trigger"
                aria-label={`Showing ${status === 'published' ? 'live articles' : 'draft articles'}`}
                aria-expanded={filterOpen}
                aria-haspopup="menu"
                onClick={() => setFilterOpen((open) => !open)}
              >
                {status === 'published' ? (
                  <Globe2 size={19} aria-hidden="true" />
                ) : (
                  <FileEdit size={19} aria-hidden="true" />
                )}
                <ChevronDown size={15} aria-hidden="true" />
              </Button>
              {filterOpen && (
                <div
                  className="articles-status-menu"
                  role="menu"
                  aria-label="Choose article status"
                >
                  <button
                    type="button"
                    role="menuitemradio"
                    className={status === 'published' ? 'is-selected' : ''}
                    aria-checked={status === 'published'}
                    onClick={() => {
                      selectStatus('published');
                      setFilterOpen(false);
                    }}
                  >
                    <Globe2 size={18} aria-hidden="true" />
                    <span>Live</span>
                    <small>{counts.published}</small>
                  </button>
                  <button
                    type="button"
                    role="menuitemradio"
                    className={status === 'draft' ? 'is-selected' : ''}
                    aria-checked={status === 'draft'}
                    onClick={() => {
                      selectStatus('draft');
                      setFilterOpen(false);
                    }}
                  >
                    <FileEdit size={18} aria-hidden="true" />
                    <span>Drafts</span>
                    <small>{counts.draft}</small>
                  </button>
                </div>
              )}
            </div>
            <Link className="ui-button ui-button-primary" href="/insights/new">
              New article
            </Link>
          </div>
        }
      />

      {error ? <Feedback tone="error">{error}</Feedback> : null}

      <div className="articles-toolbar">
        <span className="articles-total">
          {total} {status === 'published' ? 'live' : 'draft'} article
          {total === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <SurfaceCard role="status">Loading articles…</SurfaceCard>
      ) : error ? null : items.length === 0 ? (
        <section
          className="articles-empty"
          aria-labelledby="articles-empty-title"
        >
          <h2 id="articles-empty-title">
            No {status === 'draft' ? 'draft ' : 'live '}articles yet
          </h2>
          <p>Create your first article to get started.</p>
          <Link className="ui-button ui-button-primary" href="/insights/new">
            New article
          </Link>
        </section>
      ) : (
        <div className="article-list" aria-label="Insights articles">
          {items.map((article) => {
            const payload = article.publishedPayload ?? article.draftPayload;
            return (
              <article className="article-list-row" key={article.id}>
                <div className="article-list-copy">
                  <Link
                    href={`/insights/${article.id}/edit`}
                    className="article-row-title"
                  >
                    {payload.title}
                  </Link>
                  <div className="article-list-meta">
                    <span>
                      /insights/{article.publishedSlug ?? article.draftSlug}
                    </span>
                    {payload.tags?.[0] ? <span>{payload.tags[0]}</span> : null}
                    {payload.isSpotlight ? (
                      <span className="article-spotlight">Spotlight</span>
                    ) : null}
                  </div>
                </div>
                <div className="article-list-actions">
                  <time>
                    {article.publishedAt
                      ? dateFormat.format(new Date(article.publishedAt))
                      : 'Unpublished'}
                  </time>
                  <Link
                    href={`/insights/${article.id}/edit`}
                    className="article-edit-link"
                  >
                    Edit
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="articles-pagination" aria-label="Article pages">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
