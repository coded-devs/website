import type { CSSProperties } from 'react';
import type { HeroContent } from '../../types/home';
import { ButtonLink } from '../button';
import { Container } from '../container';
import styles from './hero.module.css';

// The signature: brand bands (slanted left, rounded right, pointing forward)
// sweeping in and drifting. Widths in percent of the field.
const BANDS: { width: number; tone: 'gold' | 'canvas' | 'deep' | 'mist' }[] = [
  { width: 58, tone: 'deep' },
  { width: 86, tone: 'gold' },
  { width: 38, tone: 'canvas' },
  { width: 72, tone: 'deep' },
  { width: 94, tone: 'canvas' },
  { width: 50, tone: 'mist' },
  { width: 80, tone: 'gold' },
  { width: 30, tone: 'deep' },
  { width: 66, tone: 'canvas' },
  { width: 44, tone: 'mist' },
];

export function Hero({ content }: { content: HeroContent }) {
  const words = content.heading.split(' ');
  return (
    <section
      className={styles.hero}
      data-surface="green"
      aria-labelledby="hero-title"
    >
      <Container className={styles.inner}>
        <div className={styles.copy}>
          {content.eyebrow ? (
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              {content.eyebrow}
            </p>
          ) : null}
          <h1 id="hero-title" className={styles.title}>
            {words.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className={styles.word}
                style={{ '--w': index } as CSSProperties}
              >
                {word}
                {index < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>
          <p className={styles.lead}>{content.body}</p>
          <div className={styles.actions}>
            {content.primaryCallToAction ? (
              <ButtonLink href={content.primaryCallToAction.href} withArrow>
                {content.primaryCallToAction.label}
              </ButtonLink>
            ) : null}
            {content.secondaryCallToAction ? (
              <ButtonLink
                href={content.secondaryCallToAction.href}
                variant="secondary"
              >
                {content.secondaryCallToAction.label}
              </ButtonLink>
            ) : null}
          </div>
        </div>

        <div className={styles.field} aria-hidden="true">
          {BANDS.map((band, index) => (
            <span
              key={index}
              className={`${styles.band} ${styles[band.tone]}`}
              style={
                {
                  '--b': index,
                  '--width': `${band.width}%`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
