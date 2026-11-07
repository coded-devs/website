import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { SectionCopy, TeamMember } from '../../types/home';
import { Container } from '../container';
import { LinkedInIcon } from '../icons';
import { Reveal } from '../reveal';
import styles from './team.module.css';

/**
 * Expanding portrait gallery. On desktop the hovered or focused portrait
 * widens and shows its name card; the first one is open by default. CSS only.
 * On small screens it becomes a swipeable row of cards.
 */
export function Team({
  content,
}: {
  content: SectionCopy & { items: TeamMember[] };
}) {
  if (content.items.length === 0) return null;
  return (
    <section
      id="team"
      className={styles.section}
      data-surface="white"
      aria-labelledby="team-title"
    >
      <Container>
        <Reveal className={styles.head}>
          <h2 id="team-title" className={styles.heading}>
            {content.heading}
          </h2>
          {content.introduction ? (
            <p className={styles.intro}>{content.introduction}</p>
          ) : null}
        </Reveal>

        <ul className={styles.gallery}>
          {content.items.map((member, index) => (
            <li
              key={`${member.name}-${index}`}
              className={styles.panel}
              style={{ '--i': index } as CSSProperties}
            >
              {member.avatar ? (
                <Image
                  src={member.avatar.src}
                  alt={member.avatar.alt}
                  fill
                  unoptimized
                  sizes="(min-width: 75rem) 640px, 75vw"
                  className={styles.photo}
                />
              ) : null}
              <div className={styles.card}>
                <div>
                  <h3 className={styles.name}>{member.name}</h3>
                  <p className={styles.role}>{member.role}</p>
                </div>
                {member.linkedinUrl ? (
                  <a
                    href={member.linkedinUrl}
                    className={styles.social}
                    aria-label={`${member.name} on LinkedIn`}
                  >
                    <LinkedInIcon size={16} />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
