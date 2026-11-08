import type { FocusArea } from '../../types/home';
import { Container } from '../container';
import { MediaCard } from '../media-card';
import { Reveal } from '../reveal';
import { SectionHeading } from './section-heading';
import styles from './focus-areas.module.css';

/** The four sectors, as an even row of square cards. */
export function FocusAreas({ items }: { items: FocusArea[] }) {
  if (items.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="focus-title">
      <Container>
        <SectionHeading
          id="focus-title"
          heading="Where we build"
          introduction="Commerce, Finance, Health and AI: the four areas our products and work focus on."
        />
        <ul className={styles.grid}>
          {items.map((area, index) => (
            <Reveal
              as="li"
              key={area.name}
              delay={index * 70}
              className={styles.item}
            >
              <MediaCard
                title={area.name}
                image={area.image}
                ratio="1:1"
                size="lg"
                text={area.description}
                sizes="(min-width: 75rem) 300px, (min-width: 48rem) 45vw, 80vw"
              />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
