import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { isExternalHref } from '../lib/navigation';
import type { MediaImage } from '../types/home';
import { ArrowUpRightIcon } from './icons';
import styles from './media-card.module.css';

export type MediaCardRatio = '1:1' | '4:3' | '3:2' | '16:9';

interface MediaCardProps {
  title: string;
  image?: MediaImage;
  ratio?: MediaCardRatio;
  /** Meta line: a bold label, then muted parts (date, sector, status). */
  label?: string;
  meta?: string[];
  text?: string;
  /** Extra content under the text, such as an outcome line. */
  children?: ReactNode;
  /** When set, the whole card is one link (the title link is stretched). */
  href?: string;
  size?: 'md' | 'lg' | 'xl';
  headingLevel?: 2 | 3;
  sizes: string;
  priority?: boolean;
}

const ratioClass: Record<MediaCardRatio, string> = {
  '1:1': 'square',
  '4:3': 'four',
  '3:2': 'three',
  '16:9': 'wide',
};

/** OpenAI-style card: image first, then a meta line and the title. */
export function MediaCard({
  title,
  image,
  ratio = '1:1',
  label,
  meta = [],
  text,
  children,
  href,
  size = 'md',
  headingLevel = 3,
  sizes,
  priority,
}: MediaCardProps) {
  const Heading = `h${headingLevel}` as const;
  const external = href ? isExternalHref(href) : false;
  const titleContent = href ? (
    external ? (
      <a href={href} className={styles.link}>
        {title}
        <ArrowUpRightIcon className={styles.externalIcon} />
        <span className="visually-hidden"> (external site)</span>
      </a>
    ) : (
      <Link href={href} className={styles.link}>
        {title}
      </Link>
    )
  ) : (
    title
  );

  return (
    <article
      className={`${styles.card} ${href ? styles.linked : ''}`}
      data-group
    >
      <div className={`${styles.media} ${styles[ratioClass[ratio]]}`}>
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={sizes}
            priority={priority}
            unoptimized={image.src.startsWith('https://images.unsplash.com/')}
            className={styles.photo}
          />
        ) : null}
      </div>
      <div className={styles.body}>
        {label || meta.length > 0 ? (
          <p className={styles.meta}>
            {label ? <span className={styles.label}>{label}</span> : null}
            {meta.map((part) => (
              <span key={part}>{part}</span>
            ))}
          </p>
        ) : null}
        <Heading className={`${styles.title} ${styles[size]}`}>
          {titleContent}
        </Heading>
        {text ? <p className={styles.text}>{text}</p> : null}
        {children}
      </div>
    </article>
  );
}
