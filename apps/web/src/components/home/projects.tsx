import type { ProjectItem, SectionCopy } from '../../types/home';
import { Container } from '../container';
import { ImageFrame } from '../image-frame';
import { Reveal } from '../reveal';
import { SectionHeading } from './section-heading';
import styles from './projects.module.css';

/** Horizontal scroll-snap rail of large project cards. */
export function Projects({
  content,
}: {
  content: SectionCopy & { items: ProjectItem[] };
}) {
  if (content.items.length === 0) return null;
  return (
    <section
      id="projects"
      className={styles.section}
      aria-labelledby="projects-title"
    >
      <Container>
        <SectionHeading
          id="projects-title"
          heading={content.heading}
          introduction={content.introduction}
        />
      </Container>
      <ul
        className={styles.rail}
        tabIndex={0}
        aria-label="Selected projects, scroll for more"
      >
        {content.items.map((project, index) => (
          <Reveal
            as="li"
            key={project.title}
            delay={index * 90}
            className={styles.item}
          >
            <article className={styles.card} data-group>
              <ImageFrame
                image={project.image}
                ratio="3:2"
                bezel
                sizes="(min-width: 75rem) 560px, 85vw"
              />
              <div className={styles.body}>
                {project.client ? (
                  <p className={styles.client}>{project.client}</p>
                ) : null}
                <h3 className={styles.title}>{project.title}</h3>
                <p className={styles.summary}>{project.summary}</p>
                {project.outcome ? (
                  <p className={styles.outcome}>
                    <span className="visually-hidden">Outcome: </span>
                    {project.outcome}
                  </p>
                ) : null}
                {project.tags.length > 0 ? (
                  <ul className={styles.tags} aria-label="Tags">
                    {project.tags.map((tag) => (
                      <li key={tag} className={styles.tag}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
