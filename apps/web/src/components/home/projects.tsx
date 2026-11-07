import type { ProjectItem, SectionCopy } from '../../types/home';
import { Container } from '../container';
import { MediaCard } from '../media-card';
import { Reveal } from '../reveal';
import { SectionHeading } from './section-heading';
import styles from './projects.module.css';

/**
 * Even horizontal row of project cards across the full container width.
 * Three fit exactly on desktop; more scroll sideways. Swipeable on mobile.
 */
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
        <ul
          className={styles.row}
          tabIndex={0}
          aria-label="Selected projects, scroll for more"
        >
          {content.items.map((project, index) => (
            <Reveal
              as="li"
              key={project.title}
              delay={index * 80}
              className={styles.item}
            >
              <MediaCard
                title={project.title}
                image={project.image}
                ratio="4:3"
                size="lg"
                label={project.client}
                meta={project.tags}
                text={project.summary}
                sizes="(min-width: 75rem) 400px, 82vw"
              >
                {project.outcome ? (
                  <p className={styles.outcome}>
                    <span className="visually-hidden">Outcome: </span>
                    {project.outcome}
                  </p>
                ) : null}
              </MediaCard>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
