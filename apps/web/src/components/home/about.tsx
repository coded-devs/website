import type { AboutContent } from '../../types/home';
import { Band } from '../band';
import { Container } from '../container';
import { ImageFrame } from '../image-frame';
import { Reveal } from '../reveal';
import styles from './about.module.css';

export function About({ content }: { content: AboutContent }) {
  const [lead, ...rest] = content.body;
  return (
    <section
      id="about"
      className={styles.section}
      aria-labelledby="about-title"
    >
      <Container>
        <p className={styles.statement}>
          {content.statement.split(' ').map((word, index) => (
            <span key={`${word}-${index}`} className={styles.word}>
              {word}{' '}
            </span>
          ))}
        </p>

        <div className={styles.story}>
          <Reveal className={styles.storyCopy}>
            <h2 id="about-title" className={styles.heading}>
              {content.heading}
            </h2>
            {lead ? <p className={styles.lead}>{lead}</p> : null}
            {rest.map((paragraph) => (
              <p key={paragraph} className={styles.body}>
                {paragraph}
              </p>
            ))}
          </Reveal>
          <Reveal delay={120} className={styles.storyImage}>
            <div className={styles.parallax}>
              <ImageFrame
                image={content.image}
                ratio="4:5"
                bezel
                sizes="(min-width: 75rem) 520px, 92vw"
              />
            </div>
          </Reveal>
        </div>

        {content.mission || content.vision ? (
          <div className={styles.statements}>
            {content.mission ? (
              <Reveal className={styles.card}>
                <div className={styles.cardInner}>
                  <h3 className={styles.cardLabel}>
                    <Band />
                    Mission
                  </h3>
                  <p className={styles.cardText}>{content.mission}</p>
                </div>
              </Reveal>
            ) : null}
            {content.vision ? (
              <Reveal delay={120} className={styles.card}>
                <div className={styles.cardInner} data-surface="ink">
                  <h3 className={styles.cardLabel}>
                    <Band />
                    Vision
                  </h3>
                  <p className={styles.cardText}>{content.vision}</p>
                </div>
              </Reveal>
            ) : null}
          </div>
        ) : null}

        {content.values.length > 0 ? (
          <div className={styles.values}>
            <h3 className={styles.valuesHeading}>What we value</h3>
            <ul className={styles.valueList}>
              {content.values.map((value, index) => (
                <Reveal
                  as="li"
                  key={value.title}
                  delay={index * 80}
                  className={styles.value}
                >
                  <Band size="small" />
                  <p className={styles.valueTitle}>{value.title}</p>
                  <p className={styles.valueText}>{value.description}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
