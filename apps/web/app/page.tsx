import type { Metadata } from 'next';
import { About } from '../src/components/home/about';
import { Contact } from '../src/components/home/contact';
import { FocusAreas } from '../src/components/home/focus-areas';
import { Hero } from '../src/components/home/hero';
import { Insights } from '../src/components/home/insights';
import { Products } from '../src/components/home/products';
import { Projects } from '../src/components/home/projects';
import { Services } from '../src/components/home/services';
import { Team } from '../src/components/home/team';
import { PLACEHOLDER_ARTICLES } from '../src/content/placeholder-articles';
import { PLACEHOLDER_HOME_CONTENT } from '../src/content/placeholder-home';

export const metadata: Metadata = {
  title: 'CodedDevs | Built for What Is Next',
  description:
    'CodedDevs builds African-first technology products across Commerce, Finance, Health and AI.',
};

// Content comes from labelled placeholders until the published-site API is
// integrated (COD-321). Section order is fixed in code; the CMS shows or
// hides sections and edits their content.
export default function Home() {
  const content = {
    ...PLACEHOLDER_HOME_CONTENT,
    insights: {
      ...PLACEHOLDER_HOME_CONTENT.insights,
      items: PLACEHOLDER_ARTICLES,
    },
  };
  return (
    <>
      <Hero content={content.hero} />
      <FocusAreas items={content.hero.focusAreas} />
      <About content={content.about} />
      <Products content={content.products} />
      <Services content={content.services} />
      <Projects content={content.projects} />
      <Team content={content.team} />
      <Insights content={content.insights} />
      <Contact content={content.contact} />
    </>
  );
}
