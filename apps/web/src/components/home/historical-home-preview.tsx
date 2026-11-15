import { About } from './about';
import { Contact } from './contact';
import { FocusAreas } from './focus-areas';
import { Hero } from './hero';
import { Insights } from './insights';
import { Principles } from './principles';
import { Products } from './products';
import { Projects } from './projects';
import { Services } from './services';
import { Team } from './team';
import { PLACEHOLDER_ARTICLES } from '../../content/placeholder-articles';
import { PLACEHOLDER_HOME_CONTENT } from '../../content/placeholder-home';

const content = {
  ...PLACEHOLDER_HOME_CONTENT,
  insights: {
    ...PLACEHOLDER_HOME_CONTENT.insights,
    items: PLACEHOLDER_ARTICLES,
  },
};

export function HistoricalHomePreview() {
  return (
    <>
      <Hero content={content.hero} />
      <FocusAreas items={content.hero.focusAreas} />
      <About content={content.about} />
      <Principles content={content.about} />
      <Products content={content.products} />
      <Services content={content.services} />
      <Projects content={content.projects} />
      <Team content={content.team} />
      <Insights content={content.insights} />
      <Contact content={content.contact} />
    </>
  );
}
