import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { HeroContent } from '../../types/home';
import { ButtonLink } from '../button';
import { Container } from '../container';
import styles from './hero.module.css';

// Collage tile shapes, in order: arch, circle, soft rectangle, soft square.
const TILES = ['arch', 'circle', 'soft', 'square'] as const;

export function Hero({ content }: { content: HeroContent }) {
  const words = content.heading.split(' ');
  const images = content.images.slice(0, TILES.length);
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Container className={styles.inner}>
        <div className={styles.copy}>
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

        {images.length > 0 ? (
          <div className={styles.collage}>
            {images.map((image, index) => (
              <div
                key={image.src}
                className={`${styles.tile} ${styles[TILES[index] ?? 'soft']}`}
                style={{ '--t': index } as CSSProperties}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={index < 2}
                  unoptimized
                  sizes="(min-width: 75rem) 320px, 45vw"
                  className={styles.photo}
                />
              </div>
            ))}
            {/* Brand bands as small, playful accents. */}
            <span
              className={`${styles.accent} ${styles.accentGold}`}
              aria-hidden="true"
            />
            <span
              className={`${styles.accent} ${styles.accentGreen}`}
              aria-hidden="true"
            />
            <span
              className={`${styles.accent} ${styles.accentInk}`}
              aria-hidden="true"
            />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
