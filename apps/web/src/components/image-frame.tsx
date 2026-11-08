import Image from 'next/image';
import type { MediaImage } from '../types/home';
import { MediaPlaceholder, type MediaRatio } from './media-placeholder';
import styles from './image-frame.module.css';

interface ImageFrameProps {
  image?: MediaImage;
  ratio?: MediaRatio | '4:5';
  /** Responsive sizes hint for next/image. */
  sizes: string;
  priority?: boolean;
  /** Nested shell (outer tray plus inner image), for feature cards. */
  bezel?: boolean;
  className?: string;
}

const ratioClass = {
  '1:1': 'square',
  '3:2': 'landscape',
  '16:9': 'wide',
  '4:5': 'portrait',
} as const;

/**
 * Image with a fixed aspect ratio and a slow hover zoom (driven by the
 * nearest ancestor with the "group" data attribute). Falls back to the
 * flat MediaPlaceholder when the CMS has no image.
 */
export function ImageFrame({
  image,
  ratio = '3:2',
  sizes,
  priority,
  bezel,
  className,
}: ImageFrameProps) {
  const inner = image ? (
    <div className={[styles.frame, styles[ratioClass[ratio]]].join(' ')}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        // Placeholder photography is already resized by the Unsplash CDN;
        // skip the server optimizer for it. CMS media is optimized as normal.
        unoptimized={image.src.startsWith('https://images.unsplash.com/')}
        className={styles.image}
      />
    </div>
  ) : (
    <MediaPlaceholder ratio={ratio === '4:5' ? '1:1' : ratio} />
  );

  if (!bezel) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <div className={[styles.bezel, className].filter(Boolean).join(' ')}>
      {inner}
    </div>
  );
}
