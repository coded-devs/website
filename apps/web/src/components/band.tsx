import styles from './band.module.css';

interface BandProps {
  /** 'default' is 24 by 8 px; 'small' is 12 by 4 px for list markers. */
  size?: 'default' | 'small';
  /** Overrides the surface marker colour, for example on error states. */
  tone?: 'marker' | 'danger';
  className?: string;
}

/** The brand band marker: slanted left end, rounded right end. Decorative. */
export function Band({
  size = 'default',
  tone = 'marker',
  className,
}: BandProps) {
  const classes = [styles.band, styles[size], styles[tone], className]
    .filter(Boolean)
    .join(' ');
  return <span className={classes} aria-hidden="true" />;
}
