import type { HomeContent, MediaImage } from '../types/home';

/**
 * PLACEHOLDER CONTENT. NOT REAL CMS DATA.
 *
 * Shaped like HomeContent so the Home page renders before the published-site
 * API integration lands (COD-321). Copy marked "company definition" comes from
 * the approved company definition; everything else is sample text.
 *
 * Photography is placeholder imagery from Unsplash (free under the Unsplash
 * License). Real CodedDevs photography replaces it through the CMS media
 * library. Sources are listed in docs/resources.md.
 */

const unsplash = (id: string, alt: string): MediaImage => ({
  src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`,
  alt,
});

export const PLACEHOLDER_HOME_CONTENT: HomeContent = {
  hero: {
    heading: 'Built for what is next in Africa.',
    body: 'We are a product team in Lagos, building for the traders, families, clinics and businesses around us, across Commerce, Finance, Health and AI.',
    primaryCallToAction: { label: 'See what we build', href: '/#products' },
    secondaryCallToAction: { label: 'Say hello', href: '/#contact' },
    images: [
      unsplash(
        '1584012961506-b6fc4c9f3105',
        'A group of young people sitting together and smiling',
      ),
      unsplash('1694175271713-a6e2cc378980', 'A man working on a laptop'),
      unsplash(
        '1573496528388-2c5e0088d40f',
        'A smiling woman at a desk in a bright office',
      ),
      unsplash(
        '1778079247396-9c0e01c83c8b',
        'A woman selling spices at an outdoor market',
      ),
    ],
    focusAreas: [
      {
        name: 'Commerce',
        description: 'New ways of buying and selling',
        image: unsplash(
          '1777065851469-71aef898a26f',
          'A busy outdoor market with traders under umbrellas',
        ),
      },
      {
        name: 'Finance',
        description: 'New ways of paying',
        image: unsplash(
          '1681826291722-70bd7e9e6fc3',
          'A person checking a payment on a phone',
        ),
      },
      {
        name: 'Health',
        description: 'New ways of accessing care',
        image: unsplash(
          '1536064479547-7ee40b74b807',
          'A doctor seeing a young patient at a clinic desk',
        ),
      },
      {
        name: 'Artificial Intelligence',
        description: 'New ways of using AI',
        image: unsplash(
          '1739300293504-234817eead52',
          'A woman working on a laptop',
        ),
      },
    ],
  },
  about: {
    heading: 'Technology that understands where it is used.',
    body: [
      // Company definition.
      'A lot of technology reaches African markets after being designed around completely different environments, behaviours, infrastructure and assumptions.',
      'CodedDevs thinks ahead from the beginning. We build products that understand the realities of African markets and can grow alongside the people, businesses and communities they serve.',
    ],
    // Company definition.
    statement:
      "We believe Africa's digital future should never be an afterthought.",
    // Company definition.
    mission:
      'To build technology that fits the realities, needs and ambitions of Africans and helps shape a better digital future.',
    visionImage: unsplash(
      '1687422808424-4a8e78fa6ae8',
      'A shop owner checking her phone at her counter',
    ),
    vision:
      'An Africa where everyday technology is designed for the people who use it, not adapted for them later.',
    values: [
      {
        title: 'Start from real conditions',
        description:
          'Design for the networks, devices and habits people actually have.',
      },
      {
        title: 'Think ahead',
        description:
          'Build for where markets are going, not only where they are today.',
      },
      {
        title: 'Earn trust',
        description:
          'Be clear about what we build, how it works and who it serves.',
      },
      {
        title: 'Build to last',
        description:
          'Choose foundations that can grow with the people who rely on them.',
      },
    ],
    image: unsplash(
      '1744907895363-d351aa6019ef',
      'An aerial view of a coastal African city with a bridge and busy roads',
    ),
    community: [
      unsplash('1625989744655-9bff7a23dac4', 'Traders at a busy market'),
      unsplash(
        '1584012961499-2147c0b3cf0d',
        'A group of women in matching shirts standing together',
      ),
      unsplash(
        '1734255026082-82fdc81991f0',
        'Traders gathered around a table of tomatoes at a market',
      ),
      unsplash(
        '1644043350898-2f4ff1e17912',
        'Two friends looking at a phone outdoors',
      ),
      unsplash(
        '1687422809617-a7d97879b3b0',
        'A trader at a fruit and vegetable stall',
      ),
      unsplash(
        '1573164574397-dd250bc8a598',
        'Three colleagues working together at a desk',
      ),
    ],
  },
  products: {
    heading: 'What we are building',
    introduction:
      'Products CodedDevs designs, builds and runs in its own name.',
    items: [
      {
        name: 'Merchant platform',
        tagline: 'Sell, track stock and get paid from one phone.',
        description:
          'Tools that help small merchants sell online and in person, keep track of stock and get paid, on the phones they already own.',
        url: 'https://example.com',
        badge: 'In development',
        sector: 'Commerce',
        image: unsplash(
          '1687422808311-a776f467a468',
          'A shop owner smiling behind the counter of a small store',
        ),
      },
      {
        name: 'Payments product',
        tagline: 'Pay and get paid across networks.',
        description:
          'Simple ways for people and businesses to send, receive and confirm payments.',
        url: 'https://example.com',
        badge: 'Coming soon',
        sector: 'Finance',
        image: unsplash(
          '1599050751795-6cdaafbc2319',
          'A phone held over a card reader to make a contactless payment',
        ),
      },
      {
        name: 'Health access product',
        tagline: 'Find, book and pay for care nearby.',
        description:
          'Helping people find, book and pay for care close to where they live.',
        badge: 'Research',
        sector: 'Health',
        image: unsplash(
          '1678695972687-033fa0bdbac9',
          'A doctor in a white coat with a stethoscope',
        ),
      },
    ],
  },
  services: {
    heading: 'How we work with you',
    introduction:
      'We design, build and run software for companies building across Africa.',
    items: [
      {
        title: 'Product design and engineering',
        image: unsplash(
          '1655720348590-c739c860beed',
          'Friends working on laptops together outdoors',
        ),
        description:
          'From first idea to a product people use, with research, design, engineering and launch in one team.',
        features: [
          'Discovery and field research',
          'Product and interface design',
          'Web and mobile engineering',
          'Launch and iteration',
        ],
      },
      {
        title: 'Web and mobile applications',
        image: unsplash(
          '1573496782432-8690d8148c46',
          'A woman smiling at her phone',
        ),
        description:
          'Reliable apps built for the devices, networks and budgets your users actually have.',
        features: [
          'Responsive web applications',
          'Android and iOS apps',
          'Offline-ready experiences',
          'Performance on low-cost devices',
        ],
      },
      {
        title: 'AI integration',
        image: unsplash(
          '1739271933163-8dcc7c8e8a3e',
          'A woman reading on her phone',
        ),
        description:
          'Practical AI features that solve a clear problem and respect your users and their data.',
        features: [
          'Use-case discovery',
          'Model selection and evaluation',
          'Integration into existing products',
          'Responsible data handling',
        ],
      },
      {
        title: 'Technical advisory',
        image: unsplash(
          '1573164574397-dd250bc8a598',
          'Colleagues talking around a desk',
        ),
        description:
          'Architecture and delivery guidance for teams that need experienced support.',
        features: [
          'Architecture reviews',
          'Delivery planning',
          'Security and reliability reviews',
          'Team mentoring',
        ],
      },
    ],
  },
  projects: {
    heading: 'Selected projects',
    introduction: 'Work we have delivered for clients and partners.',
    items: [
      {
        title: 'Online ordering for a fresh produce retailer',
        client: 'Client name',
        summary: 'Customers order ahead from any branch and pay on pickup.',
        outcome:
          'Staff see every order in one place instead of across calls and chats.',
        tags: ['Commerce', 'Mobile'],
        image: unsplash(
          '1585540083814-ea6ee8af9e4f',
          'A trader standing in front of a fresh produce stall',
        ),
      },
      {
        title: 'Appointment booking for a clinic network',
        client: 'Client name',
        summary:
          'Patients book, move and cancel visits without calling the front desk.',
        outcome:
          'Clinics plan staff around real bookings rather than walk-ins alone.',
        tags: ['Health', 'Web'],
        image: unsplash(
          '1576091160399-112ba8d25d1d',
          'A doctor with a stethoscope using a phone',
        ),
      },
      {
        title: 'Document search for a finance team',
        client: 'Client name',
        summary:
          'An internal tool that finds answers across policies and past reports.',
        outcome: 'Analysts spend less time searching and more time reviewing.',
        tags: ['AI', 'Finance'],
        image: unsplash(
          '1714327676544-48dafc3ffa41',
          'An analyst checking a report on her phone',
        ),
      },
    ],
  },
  team: {
    heading: 'The people building CodedDevs',
    introduction: 'A small team of designers, engineers and operators.',
    items: [
      {
        name: 'Team member name',
        role: 'Role title',
        avatar: unsplash(
          '1573497491765-dccce02b29df',
          'Portrait of a team member',
        ),
        linkedinUrl: 'https://www.linkedin.com/',
      },
      {
        name: 'Team member name',
        role: 'Role title',
        avatar: unsplash(
          '1614023342667-6f060e9d1e04',
          'Portrait of a team member',
        ),
        linkedinUrl: 'https://www.linkedin.com/',
      },
      {
        name: 'Team member name',
        role: 'Role title',
        avatar: unsplash(
          '1593351799227-75df2026356b',
          'Portrait of a team member',
        ),
        linkedinUrl: 'https://www.linkedin.com/',
      },
      {
        name: 'Team member name',
        role: 'Role title',
        avatar: unsplash(
          '1668752741330-8adc5cef7485',
          'Portrait of a team member',
        ),
        linkedinUrl: 'https://www.linkedin.com/',
      },
    ],
  },
  insights: {
    heading: 'Latest insights',
    items: [],
  },
  contact: {
    heading: 'Say hello',
    body: 'Tell us what you are building, or how we can help. A real person on our team reads every message.',
    email: 'hello@example.com',
  },
};
