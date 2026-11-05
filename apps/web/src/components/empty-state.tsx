import type { ReactNode } from 'react';
import { Band } from './band';
import { Container } from './container';
import { Heading, Text } from './typography';
import styles from './states.module.css';

interface EmptyStateProps {
  heading: string;
  body: string;
  /** Heading level that fits the page outline. Defaults to 2. */
  headingLevel?: 1 | 2 | 3;
  /** Optional action, usually a secondary ButtonLink. */
  action?: ReactNode;
}

export function EmptyState({
  heading,
  body,
  headingLevel = 2,
  action,
}: EmptyStateProps) {
  return (
    <div className={styles.state}>
      <Container width="narrow">
        <div className={styles.stateInner}>
          <Band />
          <Heading level={headingLevel} size="h3">
            {heading}
          </Heading>
          <Text>{body}</Text>
          {action ? <div className={styles.actions}>{action}</div> : null}
        </div>
      </Container>
    </div>
  );
}
