import type { SectionCopy, TeamMember } from '../../types/home';
import { Container } from '../container';
import { LinkedInIcon } from '../icons';
import { ImageFrame } from '../image-frame';
import { Reveal } from '../reveal';
import { SectionHeading } from './section-heading';
import styles from './team.module.css';

/** Portrait grid. The whole section is hidden when no one is published. */
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
        <SectionHeading
          id="team-title"
          heading={content.heading}
          introduction={content.introduction}
        />
        <ul className={styles.grid}>
          {content.items.map((member, index) => (
            <Reveal
              as="li"
              key={`${member.name}-${index}`}
              delay={index * 80}
              className={styles.person}
            >
              <div data-group>
                <ImageFrame
                  image={member.avatar}
                  ratio="4:5"
                  sizes="(min-width: 75rem) 300px, 45vw"
                />
              </div>
              <div className={styles.row}>
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
                    <LinkedInIcon size={18} />
                  </a>
                ) : null}
              </div>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
