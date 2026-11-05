# Public implementation notes

Owner: Product & Brand Designer. Status: draft for Frontend review (COD-313).

The reference implementation is `docs/prototypes/components.css` (one definition per component) used by the four pages in `docs/prototypes/public/`. Tokens: `docs/prototypes/tokens.css`, mirrored in `apps/web/app/tokens.css`. Fields: [content-model.md](content-model.md). Page structure: [sitemap.md](sitemap.md).

Breakpoints: mobile below 768 px, tablet 768 to 1199 px, desktop 1200 px and up. Every component below was checked at 360, 768 and 1280 px with no horizontal page scroll.

## Shared rules

- Semantic tokens only (`--color-*`). Surfaces switch with `data-surface="white" | "green" | "ink"`; components need no colour variants.
- One `h1` per page. Section headings are `h2`, items inside sections are `h3`. Never skip a level.
- Visible focus on every interactive element: 2 px ring in `--color-focus` (Green on light, Gold on dark).
- Touch targets are at least 44 by 44 px. Inline text links are exempt.
- Motion: the hero rises in on load and some items reveal on scroll with CSS scroll-driven animation. Both are off under `prefers-reduced-motion`, and the content is fully visible without them.
- Icons are inline SVG from `docs/resources.md`, decorative (`aria-hidden`) unless the control has no text, in which case the link carries the name.
- Prototype aids (`.proto-bar`, `.ph-tag`, `.proto-target`) are not part of the product.

## Shell

| Component   | Anatomy                                                                  | States                                                                            | Responsive                                                   | Accessibility                                                                                                                                                                                                   | CMS field                                              |
| ----------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Skip link   | "Skip to content" link to `#main`                                        | Hidden until focused                                                              | Same everywhere                                              | First focusable element; `main` has `tabindex="-1"`                                                                                                                                                             | Static                                                 |
| Header      | Logo link, nav, Contact us button, Menu button                           | Nav link: default, hover (Green underline), focus, current (2 px Green underline) | Inline nav from 1200 px; Menu button below                   | `header`, `nav aria-label="Main"`, logo link named "CodedDevs home", `aria-current="page"`                                                                                                                      | Proposed `navigation`, `navigationAction`              |
| Mobile menu | Full-width sheet: large nav links, full-width button                     | Closed, open                                                                      | Below 1200 px only; closes when the viewport reaches desktop | Button has `aria-expanded` and `aria-controls`, name "Menu navigation". Opens with focus on the first link. Escape closes and returns focus. No focus trap: tabbing out closes it. Page scroll locks while open | Same as header                                         |
| Footer      | Link directory, social icons, copyright and legal links, tagline, notice | Links: Gold underline on hover, Gold focus ring                                   | 2, 3 or 5 directory columns; bottom row stacks on mobile     | `footer`, `nav aria-label="Footer"` and `nav aria-label="Legal"`, social list named "Social media", each icon link named "CodedDevs on X" etc.                                                                  | settings fields, proposed `footerGroups`, `legalLinks` |

## Layout primitives

| Component        | Anatomy                                                     | Responsive                                                    | CMS field                                     |
| ---------------- | ----------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Container        | Max width plus gutter                                       | Gutter 20, 32, 48 px. Widths: wide 1280, text 720, narrow 560 | None                                          |
| Section          | Optional head (heading, lead), content                      | Padding 64, 96, 128 px                                        | Section `heading`, `introduction`, visibility |
| Section head row | Heading left, one link right ("All insights")               | Wraps under the heading on mobile                             | Section `heading`                             |
| Band marker      | Slanted left, rounded right bar, 24 by 8 px (12 by 4 small) | Same                                                          | None. Decorative, `aria-hidden`               |
| Eyebrow          | Band marker plus label                                      | Same                                                          | `hero.eyebrow`                                |

## Controls

| Component | Variants                                             | States                                                                                         | Accessibility                                                                                 | Notes                                                       |
| --------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Button    | Primary, secondary; md 48 px, sm 40 px               | Default, hover, focus, active (1 px press), disabled, loading (spinner plus verb, `aria-busy`) | `<button>` for actions, `<a>` for navigation. Loading keeps focus and cannot be pressed twice | On dark surfaces Primary is Gold with Ink text              |
| Text link | Inline (underlined), standalone (underline on hover) | Default, hover (2 px underline), focus, active                                                 | External links add the arrow icon and hidden "(external site)"                                | On dark surfaces the underline is Gold                      |
| Tag       | Pill, muted                                          | Static                                                                                         | List with a label                                                                             | `projects[].tags`, `articles.tags`                          |
| Badge     | Small filled label                                   | Static                                                                                         | Plain text                                                                                    | `products[].badge`. Gold fill with Ink text on the Ink tile |

## Home sections

| Component         | Anatomy                                                                                          | Responsive                                                                                         | Accessibility                                                                 | CMS field                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Hero              | Eyebrow, display `h1`, lead, one button, sector index                                            | Top padding 64 px, 160 px on desktop. Sector index 2 columns, 4 on desktop                         | Sector index is a list named "Where we build"                                 | `hero.*`, proposed `focusAreas`                                 |
| About band        | Story (heading, lead, body), Mission and Vision statements, Values list                          | Stacked; story and statements side by side on desktop; values 1, 2, 4 columns                      | Statement labels are `h3`; Gold label text on Green is 5.17:1                 | `about.heading`, `body`, proposed `mission`, `vision`, `values` |
| Product bento     | Feature tile (image, badge, sector, name, description, link), two smaller tiles (Ink and sunken) | Stacked; feature tile full width on tablet; 7 and 5 columns on desktop                             | Tiles are `article` with `h3`                                                 | `products[]` in CMS order                                       |
| Service rows      | Title, description, band-marked feature list                                                     | Stacked; title left and content right from 768 px                                                  | Feature list named "{title} includes"                                         | `services[]`                                                    |
| Project rail      | Image, client, title, summary, outcome, tags                                                     | Horizontal scroll-snap: 85 percent card width on mobile, about 1.6 cards on tablet, 2.4 on desktop | Rail is focusable (`tabindex="0"`) and named, so keyboard users can scroll it | `projects[]`                                                    |
| Team grid         | Square photo, name, role, LinkedIn icon                                                          | 2 columns, 4 on desktop                                                                            | Photo alt is the name; icon link named "{name} on LinkedIn"                   | `team[]`                                                        |
| Featured insights | Lead card plus two compact cards                                                                 | Stacked; 7 and 5 columns on desktop                                                                | Card titles are `h3` links                                                    | Latest 3 articles                                               |
| Contact           | Heading, body, email; form card                                                                  | Stacked; 5 and 7 columns on desktop                                                                | See Form                                                                      | `contact.*`, `settings.contactEmail`                            |

## Content components

| Component               | Anatomy                                                                                                        | Variants                                                                                            | Accessibility                                                              | CMS field                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| Article card            | Image, meta (first tag, date, read time), title, excerpt (3 lines)                                             | Default, compact (small square image, no excerpt), lead (large title, image beside text on desktop) | Title link stretches over the card; focus ring draws around the whole card | `articles.*`                                |
| Media placeholder       | Flat surface fill with band marker                                                                             | Ratios 1:1, 3:2, 16:9                                                                               | `aria-hidden`, or `role="img"` with a label such as "Photo coming soon"    | Shown when the image field is empty         |
| Meta line               | First tag (600), date, read time                                                                               | Same                                                                                                | `<time datetime>`                                                          | `tags[0]`, `publishedAt`, `readTimeMinutes` |
| Pagination              | Newer, "Page n of m", Older                                                                                    | Newer disabled on page 1, Older disabled on the last page                                           | `nav aria-label="Pagination"`; disabled links have `aria-disabled`         | `page`, `totalPages`                        |
| Article body (`.prose`) | h2, h3, paragraphs, band-marked lists, numbered lists, quotes, tables, figures, inline code, code blocks, rule | Same                                                                                                | Tables and code blocks scroll inside a focusable, named container          | `articles.body`                             |

Code blocks use the system monospace font on the sunken surface. No window chrome, no fake terminal dots, no prompt symbols and no syntax colours.

## Form

| Part          | Behaviour                                                                                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fields        | Visible label above, optional hint, input, error below. "(optional)" on Company. `autocomplete` set for name, email and organisation                                              |
| Validation    | On Send. Rules match the API. Invalid fields get `aria-invalid="true"` and an error linked with `aria-describedby`. A field rechecks while typing once it has been marked invalid |
| Error summary | Appears above the form, takes focus, says "Check n fields and send again." and links to each field                                                                                |
| Sending       | Button shows a spinner and "Sending", keeps focus, ignores further presses                                                                                                        |
| Sent          | Form is replaced by "Message sent" with a "Send another message" button; the heading takes focus                                                                                  |
| Server errors | 429: "Too many messages" with the wait time from `Retry-After`. 503 or offline: "Your message was not sent." Entered text is kept in both cases                                   |

## States

| State            | Anatomy                                                                     | Where                                               | Notes                                                                                            |
| ---------------- | --------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Loading          | Skeletons shaped like cards or an article                                   | Insights listing, article                           | `role="status"`, `aria-busy`, hidden label. Show after 300 ms. Pulse only without reduced motion |
| Empty            | Band marker, `h2`, one sentence, secondary button                           | Insights listing                                    | On Home, empty sections are hidden instead                                                       |
| Error with retry | Danger band, heading, sentence, Try again, Back to home                     | Any page that fails to load                         | The caller wires Try again (Next.js `reset()`). Heading takes focus. No raw error text           |
| Not found        | Band marker, `h1` "Article not found", sentence, All insights, Back to home | `/insights/[slug]` for unpublished or missing slugs | Same component as Empty                                                                          |

## Mapping to apps/web (COD-320)

The shell built in COD-320 already provides SiteHeader, SiteNavigation, SiteFooter, Container, Section, Heading, Text, Eyebrow, Band, Button, ButtonLink, TextLink, MediaPlaceholder, LoadingState, EmptyState and ErrorState. The Home section components, cards, pagination, prose and form in this document are new work for COD-321 and COD-322.
