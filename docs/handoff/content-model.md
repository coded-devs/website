# Public content model

Owner: Product & Brand Designer. Status: draft for Engineering Lead and Backend review (COD-313).

This is what the backend builds from. Every public string, image, link and metadata field is CMS-managed; layout and components are code.

How to read the tables:

- **Status**: Existing means the field is in `apps/api/src/content/contracts.ts` or `homepage-sections.ts` today. **Proposed** means the design needs it and it does not exist yet.
- **Limit**: the hard maximum enforced by the API (Zod). Proposed fields carry a proposed limit.
- **Display**: the length the design is drawn for. Longer text still works but may wrap more than intended. Editors should see this as guidance in the Admin form.
- Images are stored as media asset ids in the database (TDD 4) and delivered to the web app as URL plus alt text.

## Home sections

### Hero (`hero`)

| Field                       | Type            | Required | Limit   | Display        | Status   | Notes                                               |
| --------------------------- | --------------- | -------- | ------- | -------------- | -------- | --------------------------------------------------- |
| `eyebrow`                   | text            | Optional | 80      | 40 characters  | Existing | One line, sentence case, shown with the band marker |
| `heading`                   | text            | Required | 160     | 70 characters  | Existing | The page `h1`. Two lines on desktop                 |
| `body`                      | text            | Required | 5,000   | 140 characters | Existing | Lead text, about 20 words                           |
| `primaryCallToAction.label` | text            | Optional | 80      | 24 characters  | Existing | Fits one line on a button                           |
| `primaryCallToAction.href`  | URL or anchor   | Optional | 2,048   |                | Existing | For example `/#products`                            |
| `focusAreas`                | list of objects | Optional | 6 items | 4 items        | Proposed | The sector index under the hero                     |
| `focusAreas[].name`         | text            | Required | 40      | 24 characters  | Proposed | For example "Commerce"                              |
| `focusAreas[].description`  | text            | Optional | 80      | 40 characters  | Proposed | One short line                                      |

### About (`about`)

PRD 3 asks for story, mission, vision and values. Today the section has only `heading` and `body`.

| Field                  | Type            | Required | Limit   | Display        | Status   | Notes                                           |
| ---------------------- | --------------- | -------- | ------- | -------------- | -------- | ----------------------------------------------- |
| `heading`              | text            | Required | 160     | 40 characters  | Existing |                                                 |
| `body`                 | text            | Required | 5,000   | 2 paragraphs   | Existing | The story. First paragraph renders as lead text |
| `mission`              | text            | Optional | 300     | 160 characters | Proposed | Statement with a Gold "Mission" label           |
| `vision`               | text            | Optional | 300     | 160 characters | Proposed | Statement with a Gold "Vision" label            |
| `values`               | list of objects | Optional | 6 items | 4 items        | Proposed | Shown in four columns on desktop                |
| `values[].title`       | text            | Required | 60      | 32 characters  | Proposed |                                                 |
| `values[].description` | text            | Optional | 200     | 90 characters  | Proposed |                                                 |

### Products (`products` section and product items)

| Field                    | Type         | Required | Limit   | Display        | Status   | Notes                                                        |
| ------------------------ | ------------ | -------- | ------- | -------------- | -------- | ------------------------------------------------------------ |
| `heading`                | text         | Required | 160     | 40 characters  | Existing | Section heading                                              |
| `introduction`           | text         | Optional | 1,000   | 120 characters | Existing | Section lead                                                 |
| `products[].name`        | text         | Required | 160     | 30 characters  | Existing | Tile `h3`                                                    |
| `products[].tagline`     | text         | Required | 300     | 100 characters | Existing | Shown on every tile                                          |
| `products[].description` | text         | Required | 5,000   | 160 characters | Existing | Shown on the feature tile; small tiles show the tagline only |
| `products[].url`         | URL          | Optional | 2,048   |                | Existing | External link with arrow icon. Hidden when empty             |
| `products[].badge`       | text         | Optional | 80      | 16 characters  | Existing | For example "In development"                                 |
| `products[].sector`      | text         | Optional | 40      | 24 characters  | Proposed | Small label next to the badge                                |
| `products[].image`       | media + alt  | Optional | alt 500 | 16:9           | Proposed | Feature tile only. Media placeholder when empty              |
| Order and visibility     | number, flag | Required |         |                | Existing | The first visible product becomes the feature tile           |

### Services (`services` section and service items)

| Field                    | Type         | Required | Limit              | Display                | Status   | Notes                                                                                |
| ------------------------ | ------------ | -------- | ------------------ | ---------------------- | -------- | ------------------------------------------------------------------------------------ |
| `heading`                | text         | Required | 160                | 40 characters          | Existing |                                                                                      |
| `introduction`           | text         | Optional | 1,000              | 120 characters         | Existing |                                                                                      |
| `services[].title`       | text         | Required | 160                | 40 characters          | Existing | Row `h3`                                                                             |
| `services[].description` | text         | Required | 5,000              | 160 characters         | Existing |                                                                                      |
| `services[].features`    | list of text | Optional | 20 items, 200 each | 4 items, 40 characters | Existing | Band-marked list, two columns from 768 px                                            |
| `services[].icon`        | text         | Optional | 80                 |                        | Existing | Not shown. If kept, holds an icon name from resources.md (design.md open decision 2) |

### Selected projects (`projects` section and project items)

| Field                | Type         | Required | Limit             | Display        | Status   | Notes                                              |
| -------------------- | ------------ | -------- | ----------------- | -------------- | -------- | -------------------------------------------------- |
| `heading`            | text         | Required | 160               | 40 characters  | Existing |                                                    |
| `introduction`       | text         | Optional | 1,000             | 120 characters | Existing |                                                    |
| `projects[].title`   | text         | Required | 160               | 50 characters  | Existing | Card `h3`                                          |
| `projects[].client`  | text         | Optional | 200               | 40 characters  | Existing | Shown above the title. Only with client permission |
| `projects[].summary` | text         | Required | 2,000             | 140 characters | Existing |                                                    |
| `projects[].outcome` | text         | Optional | 2,000             | 120 characters | Existing | Shown with a Green rule                            |
| `projects[].tags`    | list of text | Optional | 20 items, 80 each | 3 items        | Existing |                                                    |
| `projects[].image`   | media + alt  | Optional | alt 500           | 16:9           | Proposed | Media placeholder when empty                       |

### Team (`team` section and team members)

| Field                | Type | Required | Limit | Display        | Status   | Notes                                                 |
| -------------------- | ---- | -------- | ----- | -------------- | -------- | ----------------------------------------------------- |
| `heading`            | text | Required | 160   | 40 characters  | Existing |                                                       |
| `introduction`       | text | Optional | 1,000 | 120 characters | Existing |                                                       |
| `team[].name`        | text | Required | 160   | 30 characters  | Existing |                                                       |
| `team[].role`        | text | Required | 160   | 40 characters  | Existing |                                                       |
| `team[].bio`         | text | Optional | 5,000 |                | Existing | Not shown in this design                              |
| `team[].avatarUrl`   | URL  | Optional | 2,048 | 1:1            | Existing | Alt text is the person's name. Placeholder when empty |
| `team[].linkedinUrl` | URL  | Optional | 2,048 |                | Existing | Icon link, name "{name} on LinkedIn"                  |
| `team[].twitterUrl`  | URL  | Optional | 2,048 |                | Existing | Icon link, name "{name} on X"                         |

The whole section is hidden when no team members are visible.

### Featured insights (`featured_insights`)

| Field          | Type | Required | Limit | Display       | Status   | Notes                                                        |
| -------------- | ---- | -------- | ----- | ------------- | -------- | ------------------------------------------------------------ |
| `heading`      | text | Required | 160   | 30 characters | Existing |                                                              |
| `introduction` | text | Optional | 1,000 |               | Existing | Not shown in this design; the heading row has a link instead |
| Articles       | list |          |       | 3             | Existing | Latest 3 published articles. No per-article feature flag     |

Hidden when there are no published articles.

### Contact (`contact`) and the inquiry form

| Field     | Type | Required | Limit | Display        | Status   | Notes                        |
| --------- | ---- | -------- | ----- | -------------- | -------- | ---------------------------- |
| `heading` | text | Required | 160   | 30 characters  | Existing |                              |
| `body`    | text | Required | 5,000 | 120 characters | Existing |                              |
| Email     |      |          |       |                | Existing | From `settings.contactEmail` |

Form fields, sent to `POST /api/v1/public/inquiries` (docs/inquiries-and-settings.md):

| Field     | Type  | Required | Rule                   | Error message shown                                         |
| --------- | ----- | -------- | ---------------------- | ----------------------------------------------------------- |
| `name`    | text  | Required | 2 to 200 characters    | "Enter your name." or "Name must be at least 2 characters." |
| `email`   | email | Required | Valid email, up to 320 | "Enter an email address like name@company.com."             |
| `company` | text  | Optional | Up to 200              | "Company must be 200 characters or fewer."                  |
| `message` | text  | Required | 20 to 5,000 characters | "Message must be at least 20 characters."                   |

Server responses: 201 shows "Message sent"; 429 shows "Too many messages" with the `Retry-After` value in minutes; 400 shows the field errors; 503 or a network failure shows "Your message was not sent". Entered text is always kept on failure.

## Site settings (shell)

| Field                                        | Type                         | Required | Limit                  | Status   | Used in                       |
| -------------------------------------------- | ---------------------------- | -------- | ---------------------- | -------- | ----------------------------- |
| `companyName`                                | text                         | Required | 200                    | Existing | Footer copyright, metadata    |
| `contactEmail`                               | email                        | Required | 320                    | Existing | Footer, Contact section       |
| `contactPhone`                               | text                         | Optional | 50                     | Existing | Footer                        |
| `address`                                    | text                         | Optional | 500                    | Existing | Footer                        |
| `twitterUrl`, `linkedinUrl`, `githubUrl`     | URL                          | Optional | 2,048                  | Existing | Footer social icons           |
| `footerNotice`                               | text                         | Optional | 500                    | Existing | Footer notice line            |
| `metaTitle`, `metaDescription`, `ogImageUrl` | text, URL                    | Optional | 160, 500, 2,048        | Existing | Home metadata and share image |
| `navigation`                                 | list of `{ label, href }`    | Required | 6 items, label 24      | Proposed | Header and mobile menu        |
| `navigationAction`                           | `{ label, href }`            | Optional | label 24               | Proposed | Header button                 |
| `footerGroups`                               | list of `{ title, links[] }` | Optional | 5 groups, 8 links each | Proposed | Footer directory              |
| `legalLinks`                                 | list of `{ label, href }`    | Optional | 4 items                | Proposed | Footer bottom row             |
| `insightsIntro`                              | text                         | Optional | 200                    | Proposed | Insights listing lead line    |

## Articles

| Field             | Type         | Required | Limit                      | Display                       | Status   | Notes                                                                                                                                                        |
| ----------------- | ------------ | -------- | -------------------------- | ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`           | text         | Required | 160                        | 70 characters                 | Existing | Article `h1`, card titles                                                                                                                                    |
| `slug`            | text         | Required | 160, lowercase and hyphens |                               |          | Existing                                                                                                                                                     | URL `/insights/[slug]` |
| `excerpt`         | text         | Required | 1,000                      | 160 characters                | Existing | Lead on the article; cards clamp it to 3 lines                                                                                                               |
| `body`            | long text    | Required | 200,000                    |                               | Existing | Format is undecided (design.md open decision 3). Must support h2 to h4, paragraphs, lists, quotes, tables, images with captions, inline code and code blocks |
| `coverImage`      | URL          | Optional | 2,048                      | 16:9 on article, 3:2 on cards | Existing | Media placeholder when empty                                                                                                                                 |
| `coverImageAlt`   | text         | Optional | 500                        | 120 characters                | Existing | Required in practice whenever `coverImage` is set                                                                                                            |
| `tags`            | list of text | Optional | 20 items, 80 each          | First tag on cards            | Existing | First tag shows in the meta line; all tags at the end of the article                                                                                         |
| `readTimeMinutes` | number       | Optional | 1 to 120                   |                               | Existing | "{n} min read"                                                                                                                                               |
| `metaTitle`       | text         | Optional | 160                        | 60 characters                 | Existing | Falls back to `title`                                                                                                                                        |
| `metaDescription` | text         | Optional | 500                        | 155 characters                | Existing | Falls back to `excerpt`                                                                                                                                      |
| `publishedAt`     | date         | System   |                            | "28 October 2026"             | Existing | Set on publish. Shown in the meta line                                                                                                                       |

The `apps/web` article type still uses `summary`, `content`, `coverImage.altText` and `author`. Align it to the names above (design.md open decision 4). This design shows no author.
