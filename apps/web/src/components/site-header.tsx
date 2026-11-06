import Image from 'next/image';
import Link from 'next/link';
import type { SiteNavigation as SiteNavigationContent } from '../types/site';
import { SiteNavigation } from './site-navigation';
import styles from './site-header.module.css';

interface SiteHeaderProps {
  navigation: SiteNavigationContent;
}

/**
 * Floating glass pill, detached from the top edge and fixed while scrolling.
 * Server-rendered; only the navigation (current page, mobile menu) is a
 * client component.
 */
export function SiteHeader({ navigation }: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.pill}>
        <Link href="/" className={styles.logo} aria-label="CodedDevs home">
          {/* Approved lockup for Canvas surfaces (docs/brand.md). */}
          <Image
            src="/assets/logos/codeddevs-lockup-horizontal.svg"
            alt=""
            width={639}
            height={162}
            priority
            unoptimized
            className={styles.logoImage}
          />
        </Link>
        <SiteNavigation navigation={navigation} />
      </div>
    </header>
  );
}
