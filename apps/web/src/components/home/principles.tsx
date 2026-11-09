import Image from 'next/image';
import type { AboutContent } from '../../types/home';
import { Container } from '../container';
import { Reveal } from '../reveal';
import { SectionHeading } from './section-heading';
import styles from './principles.module.css';

/**
 * Mission, vision and values, after Grey's feature cards: a photo beside a
 * soft Green-tint mission card, then one Ink panel that states the vision
 * and lists the values under a hairline.
 */
export function Principles({ content }: { content: AboutContent }) {
  const hasStatements = Boolean(content.mission || content.vision);
  const values = content.values ?? [];
  if (!hasStatements && values.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="principles-title">
      <Container>
        <SectionHeading
          id="principles-title"
          heading="What guides us"
          introduction="Why we exist, where we are going and how we work, every day."
        />

        {content.mission ? (
          <div
            className={`${styles.pair} ${content.missionImage ? '' : styles.single}`}
          >
            {content.missionImage ? (
              <Reveal className={styles.photoCell}>
                <div className={styles.photo}>
                  <Image
                    src={content.missionImage.src}
                    alt={content.missionImage.alt}
                    fill
                    unoptimized
                    sizes="(min-width: 75rem) 460px, (min-width: 48rem) 40vw, 92vw"
                    className={styles.photoImage}
                  />
                </div>
              </Reveal>
            ) : null}
            <Reveal delay={100} className={styles.missionCell}>
              <div className={styles.mission}>
                <h3 className={styles.label}>Our mission</h3>
                <p className={styles.statement}>{content.mission}</p>
              </div>
            </Reveal>
          </div>
        ) : null}

        {content.vision || values.length > 0 ? (
          <Reveal delay={120} className={styles.panelCell}>
            <div className={styles.panel} data-surface="ink">
              {content.vision ? (
                <div className={styles.vision}>
                  <h3 className={styles.label}>Our vision</h3>
                  <p className={styles.visionText}>{content.vision}</p>
                </div>
              ) : null}

              {values.length > 0 ? (
                <div className={styles.values}>
                  <h3 className={styles.label}>What we value</h3>
                  <ul className={styles.valueList}>
                    {values.map((value) => (
                      <li key={value.title} className={styles.value}>
                        <span className={styles.mark} aria-hidden="true" />
                        <h4 className={styles.valueTitle}>{value.title}</h4>
                        <p className={styles.valueText}>{value.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Reveal>
        ) : null}
      </Container>
    </section>
  );
}
