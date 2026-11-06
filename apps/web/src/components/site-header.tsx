import Image from 'next/image';
import Link from 'next/link';
import type { SiteNavigation as SiteNavigationContent } from '../types/site';
import { HeaderScrollState } from './header-scroll-state';
import { SiteNavigation } from './site-navigation';
import styles from './site-header.module.css';

interface SiteHeaderProps {
  navigation: SiteNavigationContent;
}

/**
 * Flat, full-width sticky bar. Links on the left, the lockup centred and the
 * action on the right (desktop). Once the page scrolls, the lockup shrinks
 * into the brand mark. Only navigation and the scroll state are client code.
 */
export function SiteHeader({ navigation }: SiteHeaderProps) {
  return (
    <>
      <HeaderScrollState />
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link href="/" className={styles.logo} aria-label="CodedDevs home">
            {/* Approved Canvas-surface assets (docs/brand.md). */}
            <Image
              src="/assets/logos/codeddevs-lockup-horizontal.svg"
              alt=""
              width={639}
              height={162}
              priority
              unoptimized
              className={styles.lockup}
            />
            <Image
              src="/assets/logos/codeddevs-mark.svg"
              alt=""
              width={210}
              height={126}
              priority
              unoptimized
              className={styles.mark}
            />
          </Link>
          <SiteNavigation navigation={navigation} />
        </div>
      </header>
    </>
  );
}
