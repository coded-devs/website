'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ProjectItem, SectionCopy } from '../../types/home';
import { Container } from '../container';
import { Reveal } from '../reveal';
import styles from './projects.module.css';

/**
 * Project index: a full-width list on the left, a large preview on the right
 * that follows the hovered or focused row (desktop). On small screens each
 * row shows its own image.
 */
export function Projects({
  content,
}: {
  content: SectionCopy & { items: ProjectItem[] };
}) {
  const [active, setActive] = useState(0);
  if (content.items.length === 0) return null;
  const current = content.items[active] ?? content.items[0];

  return (
    <section
      id="projects"
      className={styles.section}
      aria-labelledby="projects-title"
    >
      <Container>
        <Reveal className={styles.head}>
          <h2 id="projects-title" className={styles.heading}>
            {content.heading}
          </h2>
          {content.introduction ? (
            <p className={styles.intro}>{content.introduction}</p>
          ) : null}
        </Reveal>

        <div className={styles.layout}>
          <ul className={styles.list}>
            {content.items.map((project, index) => (
              <li key={project.title}>
                <article
                  className={styles.row}
                  data-active={index === active || undefined}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  tabIndex={0}
                  aria-labelledby={`project-${index}`}
                >
                  {project.image ? (
                    <div className={styles.rowImage}>
                      <Image
                        src={project.image.src}
                        alt={project.image.alt}
                        fill
                        unoptimized
                        sizes="92vw"
                        className={styles.photo}
                      />
                    </div>
                  ) : null}
                  <div className={styles.rowMeta}>
                    {project.client ? <span>{project.client}</span> : null}
                    {project.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 id={`project-${index}`} className={styles.title}>
                    {project.title}
                  </h3>
                  <div className={styles.rowDetail}>
                    <p className={styles.summary}>{project.summary}</p>
                    {project.outcome ? (
                      <p className={styles.outcome}>
                        <span className="visually-hidden">Outcome: </span>
                        {project.outcome}
                      </p>
                    ) : null}
                  </div>
                </article>
              </li>
            ))}
          </ul>

          {/* Desktop preview: every image stays mounted and crossfades. */}
          <div className={styles.preview} aria-hidden="true">
            <div className={styles.previewFrame}>
              {content.items.map((project, index) =>
                project.image ? (
                  <Image
                    key={project.image.src}
                    src={project.image.src}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 75rem) 560px, 0px"
                    className={styles.previewPhoto}
                    data-active={index === active || undefined}
                  />
                ) : null,
              )}
            </div>
            <p className={styles.previewCaption}>
              {current?.client ? `${current.client}. ` : ''}
              {current?.outcome}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
