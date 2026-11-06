import type { FocusArea } from '../../types/home';
import { Container } from '../container';
import { ImageFrame } from '../image-frame';
import { Reveal } from '../reveal';
import styles from './focus-areas.module.css';

/** Four sector cards that overlap the bottom edge of the hero. */
export function FocusAreas({ items }: { items: FocusArea[] }) {
  if (items.length === 0) return null;
  return (
    <section className={styles.section} aria-label="Where we build">
      <Container>
        <ul className={styles.grid}>
          {items.map((area, index) => (
            <Reveal
              as="li"
              key={area.name}
              delay={index * 90}
              className={styles.item}
            >
              <article className={styles.card} data-group>
                <ImageFrame
                  image={area.image}
                  ratio="4:5"
                  bezel
                  priority={index < 2}
                  sizes="(min-width: 75rem) 300px, (min-width: 48rem) 45vw, 80vw"
                />
                <div className={styles.caption}>
                  <h2 className={styles.name}>{area.name}</h2>
                  <p className={styles.description}>{area.description}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
