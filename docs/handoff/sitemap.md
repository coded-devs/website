# Public sitemap

Owner: Product & Brand Designer. Status: draft for Engineering Lead review (COD-313).

Prototypes: `docs/prototypes/public/`. Screenshots: `docs/prototypes/screenshots/public/`. Rules: [design.md](../design.md), [brand.md](../brand.md).

## Page types

There are three public page types. There are no separate About, Services, Team, Products or Contact pages; those are sections on Home.

| Route              | Page type        | Prototype       | Purpose                                                                       |
| ------------------ | ---------------- | --------------- | ----------------------------------------------------------------------------- |
| `/`                | Home             | `index.html`    | One landing page: who we are, what we build, how to work with us              |
| `/insights`        | Insights listing | `insights.html` | Published articles, company updates and technical writing                     |
| `/insights/[slug]` | Article detail   | `article.html`  | One published article. Unpublished or missing slugs return the not-found page |

Legal pages (privacy, terms) are linked from the footer only when they exist. They are not designed here.

`states.html` is a prototype-only reference sheet for loading, empty, error, form and not-found states. It is not a route.

## Home section order

| Order | Section           | Anchor             | Surface | Why it sits here                                                      |
| ----- | ----------------- | ------------------ | ------- | --------------------------------------------------------------------- |
| 1     | Hero              | none (top of page) | Canvas  | Says who CodedDevs is in one line and leads to what we build          |
| 2     | About             | `#about`           | Green   | The why straight after the what; the page's one Green band            |
| 3     | Products          | `#products`        | White   | CodedDevs builds its own products first, so they come before services |
| 4     | Services          | `#services`        | Canvas  | How clients work with us, once we have shown we ship our own work     |
| 5     | Selected projects | `#projects`        | White   | Proof that the services deliver, right after them                     |
| 6     | Team              | `#team`            | Canvas  | The people behind the work. Hidden when no team members are published |
| 7     | Featured insights | `#insights`        | White   | Current thinking, with a route to `/insights`                         |
| 8     | Contact           | `#contact`         | Canvas  | The closing action, before the Ink footer                             |

Rules:

- Order is set in code. The CMS can show or hide each section; it cannot reorder or add sections.
- A hidden or empty section is skipped. Surfaces never place Green next to Ink.
- Anchor ids are the section keys from `homepage-sections.ts`, except Featured insights, which uses `#insights` for a readable URL.

## Navigation

| Item       | Target on Home | Target on other pages | Notes                                                |
| ---------- | -------------- | --------------------- | ---------------------------------------------------- |
| Logo       | `/`            | `/`                   | Accessible name "CodedDevs home"                     |
| About      | `#about`       | `/#about`             |                                                      |
| Services   | `#services`    | `/#services`          |                                                      |
| Products   | `#products`    | `/#products`          |                                                      |
| Insights   | `/insights`    | `/insights`           | `aria-current="page"` on the listing and on articles |
| Contact us | `#contact`     | `/#contact`           | Header button; the only "contact" label on the site  |

Desktop (1200 px and up) shows the links inline. Below that, a "Menu" button opens a full-width sheet.

Navigation items have no CMS fields yet. See content-model.md, Site settings.

## Footer

Layout follows the reference link directory (design.md 3.2): grouped link columns, then one bottom row.

| Area         | Contents                                                               | Source                                             |
| ------------ | ---------------------------------------------------------------------- | -------------------------------------------------- |
| Company      | About, Services, Projects, Team (Home anchors)                         | Proposed `footerGroups`                            |
| Products     | All products (`/#products`), plus external product links with an arrow | Proposed `footerGroups`                            |
| Insights     | All insights (`/insights`), Latest (`/#insights`)                      | Proposed `footerGroups`                            |
| Contact      | Email, phone, address                                                  | `settings.contactEmail`, `contactPhone`, `address` |
| Social icons | X, LinkedIn, GitHub. Hidden when the URL is empty                      | `settings.twitterUrl`, `linkedinUrl`, `githubUrl`  |
| Copyright    | "© {year} {companyName}"                                               | `settings.companyName`                             |
| Legal links  | Privacy policy, Terms of use                                           | Proposed `legalLinks`                              |
| Tagline      | "Built for What Is Next." with a Gold band                             | Static brand copy                                  |
| Notice       | One muted line                                                         | `settings.footerNotice`                            |
