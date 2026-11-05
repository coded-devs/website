import { useId, type ReactNode } from 'react';
import { Container, type ContainerWidth } from './container';
import { Eyebrow, Heading, Text } from './typography';
import styles from './section.module.css';

export type SectionSurface = 'canvas' | 'white' | 'green' | 'ink';

interface SectionProps {
  children?: ReactNode;
  /** Never place a Green section directly next to an Ink section. */
  surface?: SectionSurface;
  spacing?: 'default' | 'compact';
  /** Section key, used as the anchor target for '/#key' links. */
  id?: string;
  eyebrow?: string;
  heading?: string;
  /** Use 1 only for the first section on a page. */
  headingLevel?: 1 | 2;
  introduction?: string;
  action?: ReactNode;
  width?: ContainerWidth;
  /** Accessible name when the section has no visible heading. */
  ariaLabel?: string;
}

export function Section({
  children,
  surface = 'canvas',
  spacing = 'default',
  id,
  eyebrow,
  heading,
  headingLevel = 2,
  introduction,
  action,
  width = 'wide',
  ariaLabel,
}: SectionProps) {
  const headingId = useId();
  const hasHead = Boolean(eyebrow || heading || introduction || action);
  return (
    <section
      id={id}
      data-surface={surface === 'canvas' ? undefined : surface}
      className={[styles.section, styles[spacing]].join(' ')}
      aria-labelledby={heading ? headingId : undefined}
      aria-label={heading ? undefined : ariaLabel}
    >
      <Container width={width}>
        {hasHead ? (
          <div className={styles.head}>
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? (
              <Heading
                level={headingLevel}
                size={headingLevel === 1 ? 'h1' : 'h2'}
                id={headingId}
              >
                {heading}
              </Heading>
            ) : null}
            {introduction ? <Text variant="lead">{introduction}</Text> : null}
            {action ? <div className={styles.action}>{action}</div> : null}
          </div>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
