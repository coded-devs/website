import Image from 'next/image';
import type { AboutContent } from '../../types/home';
import { Container } from '../container';
import { ImageFrame } from '../image-frame';
import { Reveal } from '../reveal';
import styles from './about.module.css';

export function About({ content }: { content: AboutContent }) {
  const [lead, ...rest] = content.body;
  const community = content.community ?? [];
  return (
    <section
      id="about"
      className={styles.section}
      aria-labelledby="about-title"
    >
      {(content.statement || community.length > 0) && (
        <div className={styles.band} data-surface="green">
          {content.statement ? (
            <Container>
              <p className={styles.statement}>
                {content.statement.split(' ').map((word, index) => (
                  <span key={`${word}-${index}`} className={styles.word}>
                    {word}{' '}
                  </span>
                ))}
              </p>
            </Container>
          ) : null}
          {community.length > 0 ? (
            <div className={styles.strip}>
              <ul className={styles.track}>
                {[...community, ...community].map((image, index) => {
                  const duplicate = index >= community.length;
                  return (
                    <li
                      key={`${image.src}-${index}`}
                      className={styles.stripItem}
                      aria-hidden={duplicate || undefined}
                    >
                      <Image
                        src={image.src}
                        alt={duplicate ? '' : image.alt}
                        fill
                        unoptimized
                        sizes="320px"
                        className={styles.stripPhoto}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <Container>
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
      </Container>
    </section>
  );
}
