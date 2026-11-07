import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { AboutContent } from '../../types/home';
import { Container } from '../container';
import { Reveal } from '../reveal';
import styles from './principles.module.css';

// One flat colour per value tile, in order.
const VALUE_TONES = ['white', 'gold', 'ink', 'tint'] as const;

/**
 * Mission, vision and values as a bento of flat colour tiles. Each tile has
 * two large brand bands that slide on hover; tiles wipe in on scroll.
 */
export function Principles({ content }: { content: AboutContent }) {
  const hasStatements = Boolean(content.mission || content.vision);
  if (!hasStatements && content.values.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="principles-title">
      <Container>
        <Reveal className={styles.head}>
          <h2 id="principles-title" className={styles.heading}>
            What guides us
          </h2>
          <p className={styles.intro}>
            Why we exist, where we are going and how we work, every day.
          </p>
        </Reveal>

        <div className={styles.bento}>
          {content.mission ? (
            <Reveal className={`${styles.cell} ${styles.missionCell}`}>
              <div className={`${styles.tile} ${styles.mission}`}>
                <div className={styles.bands} aria-hidden="true">
                  <span />
                  <span />
                </div>
                <h3 className={styles.label}>Our mission</h3>
                <p className={styles.statement}>{content.mission}</p>
              </div>
            </Reveal>
          ) : null}

          {content.vision ? (
            <Reveal
              delay={120}
              className={`${styles.cell} ${styles.visionCell}`}
            >
              <div className={`${styles.tile} ${styles.vision}`}>
                {content.visionImage ? (
                  <Image
                    src={content.visionImage.src}
                    alt={content.visionImage.alt}
                    fill
                    unoptimized
                    sizes="(min-width: 75rem) 520px, 92vw"
                    className={styles.visionPhoto}
                  />
                ) : null}
                <div className={styles.visionCaption} data-surface="ink">
                  <h3 className={styles.label}>Our vision</h3>
                  <p className={styles.visionText}>{content.vision}</p>
                </div>
              </div>
            </Reveal>
          ) : null}

          {content.values.map((value, index) => (
            <Reveal
              key={value.title}
              delay={160 + index * 70}
              className={`${styles.cell} ${styles.valueCell}`}
            >
              <div
                className={`${styles.tile} ${styles.value} ${styles[VALUE_TONES[index % VALUE_TONES.length] ?? 'white']}`}
              >
                <div
                  className={styles.bands}
                  aria-hidden="true"
                  style={{ '--n': index } as CSSProperties}
                >
                  <span />
                  <span />
                </div>
                <p className={styles.kicker}>We value</p>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueText}>{value.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
