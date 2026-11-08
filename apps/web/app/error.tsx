'use client';

import { useEffect } from 'react';
import { ErrorState } from '../src/components/error-state';

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Home error boundary caught error:', error);
  }, [error]);

  return <ErrorState onRetry={reset} homeHref={null} />;
}
