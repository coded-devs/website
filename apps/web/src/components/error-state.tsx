'use client';

import { useEffect, useRef, useState } from 'react';
import { Band } from './band';
import { Button, ButtonLink } from './button';
import { Container } from './container';
import { Heading, Text } from './typography';
import styles from './states.module.css';

interface ErrorStateProps {
  heading?: string;
  body?: string;
  headingLevel?: 1 | 2 | 3;
  /**
   * Retry handler wired up by the caller, for example Next.js reset() in
   * error.tsx. May return a promise; the button shows its loading state
   * until it settles.
   */
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  /** Secondary escape route. Omit to hide it. */
  homeHref?: string | null;
  homeLabel?: string;
}

/**
 * Error with retry. The heading takes focus when the error appears, so
 * keyboard and screen reader users land on it. Never shows raw error text.
 */
export function ErrorState({
  heading = 'We could not load this page',
  body = 'Something went wrong on our side. Please try again.',
  headingLevel = 1,
  onRetry,
  retryLabel = 'Try again',
  homeHref = '/',
  homeLabel = 'Back to home',
}: ErrorStateProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className={styles.state} role="alert">
      <Container width="narrow">
        <div className={styles.stateInner}>
          <Band tone="danger" />
          <Heading
            level={headingLevel}
            size="h3"
            ref={headingRef}
            tabIndex={-1}
          >
            {heading}
          </Heading>
          <Text>{body}</Text>
          <div className={styles.actions}>
            {onRetry ? (
              <Button
                onClick={handleRetry}
                loading={retrying}
                loadingLabel="Retrying"
              >
                {retryLabel}
              </Button>
            ) : null}
            {homeHref ? (
              <ButtonLink href={homeHref} variant="secondary">
                {homeLabel}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </Container>
    </div>
  );
}
