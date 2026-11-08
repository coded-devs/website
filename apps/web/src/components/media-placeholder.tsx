import { Band } from './band';
import styles from './media-placeholder.module.css';

export type MediaRatio = '1:1' | '3:2' | '16:9';

interface MediaPlaceholderProps {
  ratio?: MediaRatio;
  /** Screen reader text, such as "Photo of Ada coming soon". Omit to hide it. */
  label?: string;
  className?: string;
}

const ratioClass: Record<MediaRatio, string> = {
  '1:1': 'square',
  '3:2': 'landscape',
  '16:9': 'wide',
};

/**
 * Stands in for a CMS image that has not been added yet (team photos,
 * article covers). Flat surface colour with a band marker; keeps the same box
 * as the real image so nothing shifts when the image arrives.
 */
export function MediaPlaceholder({
  ratio = '3:2',
  label,
  className,
}: MediaPlaceholderProps) {
  const classes = [styles.placeholder, styles[ratioClass[ratio]], className]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={classes}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Band className={styles.marker} />
    </div>
  );
}
