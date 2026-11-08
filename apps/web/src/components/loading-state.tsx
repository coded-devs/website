import { Container } from './container';
import styles from './states.module.css';

interface LoadingStateProps {
  /** Announced to screen readers, for example "Loading insights". */
  label: string;
  /** Skeleton shape: a card grid (listings) or an article (detail pages). */
  layout?: 'cards' | 'article';
  /** Number of cards for the 'cards' layout. */
  count?: number;
}

/**
 * Skeletons shaped like the content they replace. They fade in after 300 ms so
 * fast loads do not flash, and only pulse when reduced motion is not set.
 */
export function LoadingState({
  label,
  layout = 'cards',
  count = 6,
}: LoadingStateProps) {
  return (
    <div className={styles.loading} role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      <Container width={layout === 'article' ? 'text' : 'wide'}>
        <div className={styles.skeletons} aria-hidden="true">
          {layout === 'article' ? (
            <div className={styles.article}>
              <span className={`${styles.block} ${styles.lineTitle}`} />
              <span className={`${styles.block} ${styles.lineTitleShort}`} />
              <span className={`${styles.block} ${styles.lineMeta}`} />
              <span className={`${styles.block} ${styles.media}`} />
              {Array.from({ length: 6 }, (_, index) => (
                <span
                  key={index}
                  className={`${styles.block} ${styles.line}`}
                />
              ))}
            </div>
          ) : (
            <div className={styles.cards}>
              {Array.from({ length: count }, (_, index) => (
                <div key={index} className={styles.card}>
                  <span className={`${styles.block} ${styles.media}`} />
                  <span className={`${styles.block} ${styles.lineMeta}`} />
                  <span className={`${styles.block} ${styles.line}`} />
                  <span className={`${styles.block} ${styles.lineShort}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
