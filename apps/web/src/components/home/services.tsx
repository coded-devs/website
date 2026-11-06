import type { SectionCopy, ServiceItem } from '../../types/home';
import { Band } from '../band';
import { Container } from '../container';
import { Reveal } from '../reveal';
import styles from './services.module.css';

/** Ink section: sticky heading on the left, service rows scrolling on the right. */
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
      <Container className={styles.layout}>
        <div className={styles.aside}>
          <div className={styles.sticky}>
            <Band />
            <h2 id="services-title" className={styles.heading}>
              {content.heading}
            </h2>
            {content.introduction ? (
              <p className={styles.intro}>{content.introduction}</p>
            ) : null}
          </div>
        </div>
        <ul className={styles.list}>
          {content.items.map((service) => (
            <Reveal as="li" key={service.title} className={styles.item}>
              <span className={styles.index}>
                <Band />
              </span>
              <div className={styles.content}>
                <h3 className={styles.title}>{service.title}</h3>
                <p className={styles.description}>{service.description}</p>
                {service.features.length > 0 ? (
                  <ul
                    className={styles.features}
                    aria-label={`${service.title} includes`}
                  >
                    {service.features.map((feature) => (
                      <li key={feature} className={styles.feature}>
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
