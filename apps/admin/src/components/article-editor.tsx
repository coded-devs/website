'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArticleForm } from './article-form';
import { ArticleApiError, fetchAdminArticleById } from '../lib/articles-client';
import type { AdminArticle } from '../types/article';
import { Feedback } from './admin-ui';

export function ArticleEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [article, setArticle] = useState<AdminArticle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchAdminArticleById(id)
      .then((result) => {
        if (active) setArticle(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof ArticleApiError
            ? cause.message
            : 'Could not load this article.',
        );
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (error) return <Feedback tone="error">{error}</Feedback>;
  if (!article) return <p role="status">Loading article…</p>;
  return <ArticleForm initialArticle={article} mode="edit" />;
}
