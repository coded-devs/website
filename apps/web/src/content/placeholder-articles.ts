import type { ArticleCardData, MediaImage } from '../types/home';

/**
 * PLACEHOLDER ARTICLES. NOT REAL CMS DATA.
 *
 * Used only in development when the API is unreachable, so the Insights
 * layouts can be reviewed without a database. Production never falls back to
 * these. Photography: Unsplash placeholders (docs/resources.md).
 */

const unsplash = (id: string, alt: string): MediaImage => ({
  src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=70`,
  alt,
});

export const PLACEHOLDER_ARTICLES: ArticleCardData[] = [
  {
    slug: 'designing-payment-flows-for-unreliable-networks',
    title: 'Designing payment flows for unreliable networks',
    excerpt:
      'How we plan for dropped connections, retries and confirmations so people are never charged twice.',
    tag: 'Engineering',
    publishedAt: '2026-10-28',
    readTimeMinutes: 6,
    cover: unsplash(
      '1726056652582-7c9d202d4018',
      'A phone showing a payment screen next to a card',
    ),
  },
  {
    slug: 'what-we-learned-building-for-small-merchants',
    title: 'What we learned building for small merchants',
    excerpt:
      'Notes from our first months working alongside shop owners, and what changed in how we design.',
    tag: 'Company update',
    publishedAt: '2026-10-21',
    readTimeMinutes: 4,
    cover: unsplash(
      '1785094165709-54fef69c2c4d',
      'An aerial view of a street market with colourful umbrellas',
    ),
  },
  {
    slug: 'a-practical-checklist-for-ai-features-in-production',
    title: 'A practical checklist for AI features in production',
    excerpt:
      'The questions we answer before an AI feature ships, from evaluation to data handling and fallbacks.',
    tag: 'AI',
    publishedAt: '2026-10-14',
    readTimeMinutes: 7,
    cover: unsplash(
      '1573164573938-c9a3db2e84ff',
      'A woman working on a laptop in a bright office',
    ),
  },
  {
    slug: 'choosing-between-web-and-native',
    title: 'How we choose between web and native for a new product',
    excerpt:
      'Reach, device range, offline needs and team skills: the trade-offs we weigh at the start.',
    tag: 'Engineering',
    publishedAt: '2026-10-07',
    readTimeMinutes: 5,
    cover: unsplash(
      '1644043350898-2f4ff1e17912',
      'Two people looking at a phone together outdoors',
    ),
  },
  {
    slug: 'designing-forms-for-low-cost-phones',
    title: 'Designing forms that work on low-cost phones',
    excerpt:
      'Small screens, slow networks and shared devices change how a form should behave.',
    tag: 'Design',
    publishedAt: '2026-09-30',
    readTimeMinutes: 5,
    cover: unsplash(
      '1648023199223-25d3622bcb13',
      'A busy city street filled with buses and traffic',
    ),
  },
  {
    slug: 'why-we-start-with-field-research',
    title: 'Why we start every project with field research',
    excerpt:
      'Time with the people who will use a product saves months of building the wrong thing.',
    tag: 'Company update',
    publishedAt: '2026-09-23',
    readTimeMinutes: 3,
    cover: unsplash(
      '1655720348590-c739c860beed',
      'A group of people working on laptops on outdoor steps',
    ),
  },
  {
    slug: 'handling-local-languages-in-search',
    title: 'Handling local languages in search',
    excerpt:
      'What it takes for search to understand mixed-language queries and local spellings.',
    tag: 'AI',
    publishedAt: '2026-09-16',
    readTimeMinutes: 8,
    cover: unsplash(
      '1594538756542-8c88bda491c5',
      'An aerial view of city buildings on a clear day',
    ),
  },
];

/**
 * PLACEHOLDER ARTICLE BODY. Sample technical writing shown for every
 * placeholder article in development. Paragraphs are separated by blank lines.
 */
export const PLACEHOLDER_ARTICLE_BODY = `A payment can fail in more places than the screen shows. The request can leave the phone and never arrive, arrive and never get a reply, or succeed while the reply is lost on the way back. On networks that drop often, each of these happens every day.

When a payment request times out, the app does not know what happened. Asking the person to try again is the most common answer, and the most dangerous one, because only one of the three outcomes is safe to retry blindly.

Each payment gets a reference created on the device before the first attempt. The server treats a second request with the same reference as the same payment, so a retry can never charge twice.

People also need to know what is happening while the app waits. We tell them the payment is being sent, say when we are checking with the payment provider, and show a pending state with a clear promise of when they will hear back.

None of this is new, but it is easy to skip when the office network is fast. We test every payment flow on throttled connections before it ships.`;
