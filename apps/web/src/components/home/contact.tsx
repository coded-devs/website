import type { HomeContent } from '../../types/home';
import { Band } from '../band';
import { Container } from '../container';
import { Reveal } from '../reveal';
import { TextLink } from '../text-link';
import { InquiryForm } from './inquiry-form';
import styles from './contact.module.css';

export function Contact({ content }: { content: HomeContent['contact'] }) {
  return (
    <section
      id="contact"
      className={styles.section}
      data-surface="white"
      aria-labelledby="contact-title"
    >
      <Container className={styles.layout}>
        <Reveal className={styles.copy}>
          <Band />
          <h2 id="contact-title" className={styles.heading}>
            {content.heading}
          </h2>
          <p className={styles.body}>{content.body}</p>
          <p className={styles.email}>
            <span className={styles.emailLabel}>Prefer email?</span>
            <TextLink href={`mailto:${content.email}`}>
              {content.email}
            </TextLink>
          </p>
        </Reveal>
        <Reveal delay={120} className={styles.shell}>
          <div className={styles.core}>
            <InquiryForm fallbackEmail={content.email} />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
