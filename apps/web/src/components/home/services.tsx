import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { SectionCopy, ServiceItem } from '../../types/home';
import { Container } from '../container';
import { SectionHeading } from './section-heading';
import styles from './services.module.css';

// Flat light card colours that cycle as the cards stack.
const TONES = ['canvas', 'white', 'tint'] as const;

/**
 * Flat Ink section. Service cards are sticky and stack on top of each other
 * as the visitor scrolls (CSS only); on small screens they simply flow.
 */
export function Services({
  content,
}: {
  content: SectionCopy & { items: ServiceItem[] };
}) {
  if (content.items.length === 0) return null;
  return (
    <section
      id="services"
      className={styles.section}
      data-surface="ink"
      aria-labelledby="services-title"
    >
      <Container>
        <SectionHeading
          id="services-title"
          heading={content.heading}
          introduction={content.introduction}
        />

        <ol className={styles.stack}>
          {content.items.map((service, index) => (
            <li
              key={service.title}
              className={`${styles.card} ${styles[TONES[index % TONES.length] ?? 'canvas']}`}
              style={{ '--i': index } as CSSProperties}
            >
              <div className={styles.copy}>
                <span className={styles.marker} aria-hidden="true" />
                <h3 className={styles.title}>{service.title}</h3>
                <p className={styles.description}>{service.description}</p>
                {service.features.length > 0 ? (
                  <ul
                    className={styles.features}
                    aria-label={`${service.title} includes`}
                  >
                    {service.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {service.image ? (
                <div className={styles.media}>
                  <Image
                    src={service.image.src}
                    alt={service.image.alt}
                    fill
                    unoptimized
                    sizes="(min-width: 75rem) 520px, 92vw"
                    className={styles.photo}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
