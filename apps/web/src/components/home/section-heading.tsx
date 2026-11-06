import type { ReactNode } from 'react';
import { Reveal } from '../reveal';
import styles from './section-heading.module.css';

interface SectionHeadingProps {
  id: string;
  heading: string;
  introduction?: string;
  /** Optional element on the right, such as an "All insights" link. */
  aside?: ReactNode;
}

export function SectionHeading({
  id,
  heading,
  introduction,
  aside,
}: SectionHeadingProps) {
  return (
    <Reveal className={styles.head}>
      <div className={styles.copy}>
        <h2 id={id} className={styles.heading}>
          {heading}
        </h2>
        {introduction ? <p className={styles.intro}>{introduction}</p> : null}
      </div>
      {aside ? <div className={styles.aside}>{aside}</div> : null}
    </Reveal>
  );
}
