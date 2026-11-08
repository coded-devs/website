import type { ReactNode } from 'react';
import type { SiteShellContent } from '../types/site';
import { Band } from './band';
import { GitHubIcon, LinkedInIcon, XIcon } from './icons';
import { TextLink } from './text-link';
import styles from './site-footer.module.css';

type SiteFooterProps = Pick<
  SiteShellContent,
  | 'companyName'
  | 'footerGroups'
  | 'contact'
  | 'social'
  | 'legalLinks'
  | 'footerNotice'
>;

interface SocialEntry {
  network: string;
  url: string | undefined;
  icon: ReactNode;
}

/**
 * Footer on Digital Ink. Layout follows the reference link directory adopted
 * in docs/design.md 3.2: grouped link columns, then one bottom row with social
 * icons, copyright and legal links, and the tagline.
 */
export function SiteFooter({
  companyName,
  footerGroups,
  contact,
  social,
  legalLinks,
  footerNotice,
}: SiteFooterProps) {
  const year = new Date().getFullYear();
  const socials: SocialEntry[] = [
    { network: 'X', url: social.twitterUrl, icon: <XIcon /> },
    { network: 'LinkedIn', url: social.linkedinUrl, icon: <LinkedInIcon /> },
    { network: 'GitHub', url: social.githubUrl, icon: <GitHubIcon /> },
  ].filter((entry) => Boolean(entry.url));

  return (
    <footer className={styles.footer} data-surface="ink">
      <div className={styles.inner}>
        <nav aria-label="Footer">
          <div className={styles.directory}>
            {footerGroups.map((group) => (
              <div key={group.title} className={styles.group}>
                <h2 className={styles.groupTitle}>{group.title}</h2>
                <ul className={styles.groupList}>
                  {group.links.map((link) => (
                    <li key={`${link.label}-${link.href}`}>
                      <TextLink
                        href={link.href}
                        variant="standalone"
                        className={styles.groupLink}
                      >
                        {link.label}
                      </TextLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {contact.email || contact.phone || contact.address ? (
              <div className={styles.group}>
                <h2 className={styles.groupTitle}>Contact</h2>
                <ul className={styles.groupList}>
                  {contact.email ? (
                    <li>
                      <TextLink
                        href={`mailto:${contact.email}`}
                        variant="standalone"
                        className={styles.groupLink}
                      >
                        {contact.email}
                      </TextLink>
                    </li>
                  ) : null}
                  {contact.phone ? (
                    <li>
                      <TextLink
                        href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                        variant="standalone"
                        className={styles.groupLink}
                      >
                        {contact.phone}
                      </TextLink>
                    </li>
                  ) : null}
                  {contact.address ? (
                    <li>
                      <address className={styles.address}>
                        {contact.address}
                      </address>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
        </nav>

        <div className={styles.bottom}>
          {socials.length > 0 ? (
            <ul className={styles.social} aria-label="Social media">
              {socials.map((entry) => (
                <li key={entry.network}>
                  <a
                    href={entry.url}
                    className={styles.socialLink}
                    aria-label={`${companyName} on ${entry.network}`}
                  >
                    {entry.icon}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          <div className={styles.legalRow}>
            <p className={styles.copyright}>
              © {year} {companyName}
            </p>
            {legalLinks.length > 0 ? (
              <nav aria-label="Legal">
                <ul className={styles.legalList}>
                  {legalLinks.map((link) => (
                    <li key={link.href}>
                      <TextLink href={link.href} className={styles.legalLink}>
                        {link.label}
                      </TextLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>

          <p className={styles.tagline}>
            <Band />
            Built for What Is Next.
          </p>
        </div>

        {footerNotice ? <p className={styles.notice}>{footerNotice}</p> : null}
      </div>
    </footer>
  );
}
