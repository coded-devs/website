# CodedDevs design system

Owner: Product & Brand Designer. Status: draft for Engineering Lead review (COD-313).

Brand rules (logo, colour pairings, typography decision) are in [brand.md](brand.md). This file turns them into tokens, layout, components and page patterns for `apps/web` and `apps/admin`.

Everything in this file is **PROPOSED** unless a row says Approved. Approved values come from brand.md.

A working preview lives in `docs/prototypes/direction.html`, with tokens in `docs/prototypes/tokens.css`. That CSS file is the reference implementation of the tokens below.

## Principles

1. **Warm, alive, community first.** People, places and real work lead the visuals. Friendly copy in the first person ("we"). Corporate polish without feeling like a bank.
2. **Content leads.** Type, whitespace and real copy from the CMS carry each page. Decoration is the exception.
3. **Restraint.** One idea per section. One primary action per view.
4. **Confident type.** Large Medium-weight headlines with tight tracking. Regular-weight body text at a comfortable size.
5. **Green leads, Gold is earned.** Each page has one Green band. Gold appears only on Ink or Green.
6. **Flat colour only.** No gradients on surfaces, cards or images. Depth comes from colour blocks, hairlines and photography.
7. **Our own shape.** The signature graphic device is the **band**: a short horizontal bar with a slanted left end and a rounded right end, taken from the geometry of the mark. It marks eyebrows, list items and section starts. It is a CSS shape, not an icon.

## 1. Design tokens

All tokens are CSS custom properties on `:root`. Components use semantic tokens only, never raw hex.

### 1.1 Brand colours (Approved)

| Token         | Value     |
| ------------- | --------- |
| `--cd-green`  | `#0D4F3C` |
| `--cd-gold`   | `#E5B94B` |
| `--cd-ink`    | `#111714` |
| `--cd-canvas` | `#F5F2EA` |
| `--cd-white`  | `#FFFFFF` |

### 1.2 Supporting colours

| Token              | Value     | Why                                                   |
| ------------------ | --------- | ----------------------------------------------------- |
| `--cd-green-deep`  | `#0A3E2F` | Hover and active for Green buttons                    |
| `--cd-green-tint`  | `#E4ECE7` | Selected states and soft highlights on light surfaces |
| `--cd-canvas-deep` | `#EDE8DC` | Sunken surfaces, skeletons, inline code               |
| `--cd-stone-700`   | `#4F5852` | Muted text on light surfaces                          |
| `--cd-stone-500`   | `#7D827B` | Input borders and other UI boundaries                 |
| `--cd-stone-400`   | `#9A9F98` | Disabled text                                         |
| `--cd-stone-200`   | `#DDD7C9` | Decorative dividers on light surfaces                 |
| `--cd-mist`        | `#C9D3CD` | Muted text on Ink and Green                           |
| `--cd-ink-line`    | `#2A322E` | Decorative dividers on Ink                            |
| `--cd-red-700`     | `#A12A1F` | Danger on light surfaces                              |
| `--cd-red-200`     | `#F5C2B8` | Danger on dark surfaces                               |
| `--cd-mint-300`    | `#8FCBAE` | Success on dark surfaces                              |

### 1.3 Semantic colours

Light surfaces (Canvas and White) are the default. A section with `data-surface="ink"` or `data-surface="green"` remaps the same tokens, so components work on any surface without variants.

| Token                    | Light surfaces | On Ink    | On Green             | Contrast check                                                          |
| ------------------------ | -------------- | --------- | -------------------- | ----------------------------------------------------------------------- |
| `--color-background`     | Canvas         | Ink       | Green                | n/a                                                                     |
| `--color-surface`        | White          | `#1A211D` | `#0F5A45`            | Raised cards and form fields                                            |
| `--color-surface-sunken` | Canvas deep    | Ink line  | Green deep           | Skeletons and inline code                                               |
| `--color-text`           | Ink            | Canvas    | Canvas               | 16.23, 16.23, 8.53                                                      |
| `--color-text-muted`     | Stone 700      | Mist      | Mist                 | 6.59 on Canvas, 7.37 on White, 11.83 on Ink, 6.22 on Green              |
| `--color-brand`          | Green          | Gold      | Gold                 | Fill of the Primary button. 8.53 on Canvas, 9.83 on Ink, 5.17 on Green  |
| `--color-brand-hover`    | Green deep     | `#F0CD75` | `#F0CD75`            | Lighter Gold on dark surfaces                                           |
| `--color-on-brand`       | Canvas         | Ink       | Ink                  | Text on a brand-filled button. 8.53 and 9.83                            |
| `--color-link`           | Green          | Canvas    | Canvas               | Link text                                                               |
| `--color-link-underline` | Current colour | Gold      | Gold                 | Gold underline is allowed on dark surfaces only                         |
| `--color-marker`         | Green          | Gold      | Gold                 | Band marker fill                                                        |
| `--color-accent`         | not available  | Gold      | Gold                 | 9.83 on Ink, 5.17 on Green. Gold has no light-surface value on purpose. |
| `--color-border`         | Stone 200      | Ink line  | Canvas at 18 percent | Decorative only                                                         |
| `--color-border-strong`  | Stone 500      | Stone 500 | Mist                 | 3.51 on Canvas, 4.63 on Ink, 6.22 on Green (3:1 needed)                 |
| `--color-focus`          | Green          | Gold      | Gold                 | 8.53, 9.83, 5.17                                                        |
| `--color-danger`         | Red 700        | Red 200   | Red 200              | 6.55 on Canvas, 6.04 on Green                                           |
| `--color-success`        | Green          | Mint 300  | Mint 300             | 8.53, 9.79, 5.14                                                        |
| `--color-disabled`       | Stone 400      | Stone 500 | Mist at 60 percent   | Exempt from contrast, still visibly different                           |

Raised surfaces on dark sections: Canvas text reaches 14.67 on `#1A211D` and 7.31 on `#0F5A45`, and Mist reaches 5.33 on `#0F5A45`. Gold text on `#0F5A45` is only 4.43, so on Green sections Gold text sits on the section background, never on a raised card.

### 1.4 Typography

Font: Poppins 400, 500 and 600 (Approved). Tokens: `--font-sans` (Poppins stack) and `--font-mono` (`ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`).

Breakpoints are listed in section 2. Sizes are in px; set them in rem in code (divide by 16).

| Style token      | Mobile size / line | Tablet size / line | Desktop size / line | Weight | Tracking | Use                           |
| ---------------- | ------------------ | ------------------ | ------------------- | ------ | -------- | ----------------------------- |
| `--type-display` | 40 / 44            | 56 / 60            | 72 / 76             | 500    | -0.025em | Home hero heading only        |
| `--type-h1`      | 34 / 40            | 44 / 52            | 52 / 60             | 500    | -0.02em  | Page and article titles       |
| `--type-h2`      | 28 / 34            | 32 / 40            | 40 / 48             | 500    | -0.015em | Section headings              |
| `--type-h3`      | 22 / 30            | 24 / 32            | 26 / 34             | 500    | -0.01em  | Card titles, article subheads |
| `--type-h4`      | 18 / 26            | 19 / 28            | 20 / 28             | 600    | 0        | Small headings                |
| `--type-lead`    | 18 / 30            | 20 / 32            | 20 / 32             | 400    | 0        | Hero body, article excerpt    |
| `--type-body`    | 16 / 26            | 17 / 28            | 17 / 28             | 400    | 0        | Default text                  |
| `--type-article` | 17 / 30            | 18 / 32            | 18 / 32             | 400    | 0        | Article body paragraphs       |
| `--type-small`   | 14 / 22            | 14 / 22            | 14 / 22             | 400    | 0        | Meta, captions, footer links  |
| `--type-label`   | 14 / 20            | 14 / 20            | 14 / 20             | 500    | 0.01em   | Buttons, nav, eyebrows, tags  |

Rules:

- Sentence case everywhere, including buttons and eyebrows. No all-caps labels.
- One `display` per page at most, and only on Home.
- Measure: body text max 68ch, article text max 720 px, lead text max 40ch on desktop.
- Numbers that matter (key figures) use `--type-h2` in Gold on Ink or Green surfaces only.

### 1.5 Spacing

Base unit 4 px.

| Token       | Value | Token        | Value  |
| ----------- | ----- | ------------ | ------ |
| `--space-0` | 0     | `--space-10` | 40 px  |
| `--space-1` | 4 px  | `--space-12` | 48 px  |
| `--space-2` | 8 px  | `--space-16` | 64 px  |
| `--space-3` | 12 px | `--space-20` | 80 px  |
| `--space-4` | 16 px | `--space-24` | 96 px  |
| `--space-5` | 20 px | `--space-32` | 128 px |
| `--space-6` | 24 px | `--space-40` | 160 px |
| `--space-8` | 32 px |              |        |

### 1.6 Radii, borders, shadows

| Token              | Value                                                           | Use                            |
| ------------------ | --------------------------------------------------------------- | ------------------------------ |
| `--radius-none`    | 0                                                               | Full-bleed sections            |
| `--radius-sm`      | 4 px                                                            | Inputs, inline code, tags      |
| `--radius-md`      | 8 px                                                            | Cards, images, code blocks     |
| `--radius-lg`      | 16 px                                                           | Large media, mobile menu sheet |
| `--radius-pill`    | 999 px                                                          | Buttons                        |
| `--border-thin`    | 1 px solid `var(--color-border)`                                | Dividers                       |
| `--border-control` | 1 px solid `var(--color-border-strong)`                         | Inputs, secondary buttons      |
| `--focus-ring`     | 2 px solid `var(--color-focus)`, offset 3 px                    | Every focusable element        |
| `--shadow-none`    | none                                                            | Default. Cards are flat.       |
| `--shadow-overlay` | `0 1px 2px rgb(17 23 20 / 6%), 0 12px 32px rgb(17 23 20 / 10%)` | Mobile menu and dialogs only   |

### 1.7 Motion

| Token             | Value                        | Use                               |
| ----------------- | ---------------------------- | --------------------------------- |
| `--duration-fast` | 120 ms                       | Hover colour, underline thickness |
| `--duration-base` | 200 ms                       | Button press, focus               |
| `--duration-slow` | 320 ms                       | Mobile menu open and close        |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Everything                        |

Animate only `color`, `background-color`, `border-color`, `opacity` and `transform`. No scroll-jacking, parallax or auto-playing motion. Under `prefers-reduced-motion: reduce`, all durations become 0.01 ms.

### 1.8 Depth, glass and emphasis (PROPOSED)

| Token                                          | Light surfaces                                                                | Ink                  | Green                | Use                                                                     |
| ---------------------------------------------- | ----------------------------------------------------------------------------- | -------------------- | -------------------- | ----------------------------------------------------------------------- |
| `--color-bezel`                                | Ink at 4 percent                                                              | Canvas at 6 percent  | Canvas at 8 percent  | Outer tray of nested cards, pill fills                                  |
| `--color-hairline`                             | Ink at 8 percent                                                              | Canvas at 10 percent | Canvas at 14 percent | 1 px inset edges instead of grey borders                                |
| `--radius-card`                                | 12 px                                                                         |                      |                      | Media card images (the OpenAI square card, slightly softer)             |
| `--radius-xl`, `--radius-2xl`                  | 24 px, 32 px                                                                  |                      |                      | Images and nested card cores                                            |
| `--ease-emphasized`                            | `cubic-bezier(0.16, 1, 0.3, 1)`                                               |                      |                      | Reveals, menu, hover zoom, arrow circles                                |
| `--ease-out`, `--ease-in-out`, `--ease-drawer` | `cubic-bezier(0.23, 1, 0.32, 1)`, `(0.77, 0, 0.175, 1)`, `(0.32, 0.72, 0, 1)` |                      |                      | Emil Kowalski curves: UI responses, on-screen moves, sheets             |
| `--ease-spring`                                | Smooth spring sampled as `linear()`, 700 ms                                   |                      |                      | Hover lifts, expanding panels, sliding markers (Apple-style, no bounce) |
| `--header-offset`                              | 72 px                                                                         |                      |                      | Scroll padding under the sticky header                                  |

**Nested cards:** feature cards, images and the form sit in an outer tray (`--color-bezel`, hairline, 6 px padding) with a concentric inner core. **Arrow buttons:** primary calls to action put the arrow in its own circle, flush with the right edge; it nudges right on hover.

### 1.9 Motion patterns (PROPOSED)

| Pattern            | Where                            | Behaviour                                                                                                                                                                      | Reduced motion      |
| ------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| Word rise          | Hero heading                     | Words rise and unblur in sequence, 70 ms apart                                                                                                                                 | Static              |
| Collage float      | Hero photo collage               | Tiles settle in, then float up to 10 px on 6 to 10 s cycles                                                                                                                    | Static              |
| Community strip    | Green band under the statement   | Photos scroll sideways in a 60 s loop and pause on hover                                                                                                                       | Still, scrollable   |
| Logo swap          | Header                           | Lockup fades into the mark once the page scrolls                                                                                                                               | Instant             |
| Reveal             | Section heads, cards, list items | Fade, lift 32 px and unblur over 900 ms when 10 percent visible                                                                                                                | Visible immediately |
| Statement brighten | About statement                  | Words brighten from faint to Ink as the line scrolls into view                                                                                                                 | Full Ink            |
| Parallax           | About city image                 | Moves 3 rem against the scroll                                                                                                                                                 | Static              |
| Hover zoom         | Every photo inside a media card  | Scales to 1.03 and the card title underlines                                                                                                                                   | None                |
| Card reveal        | What guides us                   | The photo, mission card and Ink panel fade and lift in, 100 ms apart                                                                                                           | Visible immediately |
| Value mark         | Values in the Ink panel          | The small Gold band above each value stretches to the right on hover (spring)                                                                                                  | None                |
| Stacking cards     | Services (desktop)               | Sticky cards settle and stack, each 20 px lower than the last                                                                                                                  | Cards simply flow   |
| Project row        | Selected projects                | Even row of media cards; scrolls sideways with snap when there are more than fit                                                                                               | Same                |
| Portrait accordion | Team (desktop)                   | Hovered or focused portrait widens to 3.2 times, saturates and shows its name card. No zoom: photos are framed 18 percent from the top so faces stay in the box at every width | Instant             |

Reveals use IntersectionObserver; scroll-linked effects use CSS scroll-driven animations. No scroll event listeners. Content is never hidden when JavaScript is off.

## 2. Layout

### 2.1 Breakpoints

| Name    | Range          | Columns | Gutter (side padding) | Column gap |
| ------- | -------------- | ------- | --------------------- | ---------- |
| Mobile  | 0 to 767 px    | 4       | 24 px                 | 16 px      |
| Tablet  | 768 to 1199 px | 8       | 48 px                 | 24 px      |
| Desktop | 1200 px and up | 12      | 80 px                 | 24 px      |

Design and test at 360, 768 and 1280 px.

### 2.2 Containers

| Token                | Max width | Use                                  |
| -------------------- | --------- | ------------------------------------ |
| `--container-wide`   | 1280 px   | Header, footer, section grids        |
| `--container-text`   | 720 px    | Article body, long text blocks       |
| `--container-narrow` | 560 px    | Empty and error states, contact form |

The container is centred, with the breakpoint gutter as inline padding.

### 2.3 Section rhythm

| Token                | Mobile | Tablet | Desktop | Use                                    |
| -------------------- | ------ | ------ | ------- | -------------------------------------- |
| `--section-space`    | 64 px  | 96 px  | 128 px  | Top and bottom padding of each section |
| `--section-space-sm` | 48 px  | 64 px  | 80 px   | Compact sections, listing page header  |
| `--stack-heading`    | 16 px  | 20 px  | 24 px   | Heading to intro text                  |
| `--stack-block`      | 32 px  | 40 px  | 48 px   | Section header to section content      |

Two adjacent sections on the same surface are separated by a 1 px `--color-border` line inside the container, not by a colour change.

## 3. Components

Each component lists the CMS field that feeds it. Field names come from `apps/api/src/content/contracts.ts` and `homepage-sections.ts`. Where no field exists yet, the row says **No field** and the gap is listed under Open decisions.

### 3.1 Header and navigation

**Reference:** a flat, full-width bar like OpenAI's, with the logo centred like Anthropic's. No floating pill.

**Anatomy:** skip link, then a sticky Canvas bar. Desktop: nav links on the left, the lockup centred, the "Say hello" button on the right. Mobile: lockup on the left, hamburger on the right.

| Part          | Source                                                                 | Notes                                                                       |
| ------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Logo          | `codeddevs-lockup-horizontal.svg`, then `codeddevs-mark.svg` on scroll | Lockup 28 px tall (mobile) or 32 px (desktop). The link is "CodedDevs home" |
| Nav items     | **No field**                                                           | Plain text links, 15 px, weight 500. Interim: Home anchors plus Insights    |
| Action button | **No field**                                                           | "Say hello" to `/#contact`, with the arrow circle                           |

| Behaviour   | Detail                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Position    | Sticky at the top, full width, `--header-height` tall (64 px mobile, 72 px desktop), Canvas background                       |
| Scroll      | Once the page leaves the top, the lockup fades and shrinks into the brand mark (600 ms) and a hairline appears below the bar |
| Mobile menu | Full-screen Canvas sheet under the bar; links at `--type-h1` rise in with a 50 ms stagger                                    |

Scroll state comes from an IntersectionObserver on a sentinel at the top of the page, written to `html[data-scrolled]`. No scroll listeners.

| State         | Nav link                             | Hamburger                                            |
| ------------- | ------------------------------------ | ---------------------------------------------------- |
| Default       | Ink                                  | Two Ink lines, no fill                               |
| Hover         | Green                                | Faint bezel fill                                     |
| Focus-visible | `--focus-ring`                       | `--focus-ring`                                       |
| Current page  | 2 px Green underline, `aria-current` | n/a                                                  |
| Open          | n/a                                  | Lines rotate into an X (500 ms, `--ease-emphasized`) |

**Accessibility:** `<header>` with `<nav aria-label="Main">`. The hamburger is a `<button aria-label="Menu" aria-expanded aria-controls>`. Opening moves focus to the first link and locks page scroll. Escape closes and returns focus to the button. No focus trap: tabbing past the last item, or clicking outside, closes the menu. The closed sheet is `inert`. Reduced motion makes the logo swap instant.

### 3.2 Footer

**Surface:** Ink (`data-surface="ink"`). It is the main place Gold appears outside the Green band.

**Layout reference:** the OpenAI site footer, adopted by the designer. A quiet link directory of grouped columns, a lot of space above it, and one bottom row with social icons, copyright and legal links. There is no logo in the footer; the header carries it.

**Anatomy:** link directory (groups of links under small muted labels), bottom row (social icons, copyright and legal links, tagline), optional notice line.

| Part          | CMS field                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Link groups   | **No field.** Interim: a "Company" group built from the header navigation, plus code-defined groups.                      |
| Contact group | `settings.contactEmail`, `settings.contactPhone`, `settings.address`                                                      |
| Social icons  | `settings.twitterUrl`, `settings.linkedinUrl`, `settings.githubUrl`. Icons from [resources.md](resources.md). Hide empty. |
| Copyright     | "© {current year} {settings.companyName}"                                                                                 |
| Legal links   | **No field.** Shown inline after the copyright, underlined.                                                               |
| Tagline       | Static brand copy "Built for What Is Next." with a Gold band marker                                                       |
| Notice        | `settings.footerNotice`, one muted line under the bottom row                                                              |

| Breakpoint | Link directory                                                         | Bottom row                                                                         |
| ---------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Desktop    | 5 equal columns, 24 px gap. A column may stack two groups, 40 px apart | One line: social icons left, copyright and legal links centre, tagline right       |
| Tablet     | 3 columns                                                              | Social icons on their own line, then copyright and legal links left, tagline right |
| Mobile     | 2 columns                                                              | Stacked and left aligned: social icons, copyright and legal links, tagline         |

| Element        | Style                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| Footer padding | Top 128 / 96 / 64 px (desktop / tablet / mobile), bottom 40 px                                                      |
| Group label    | `h2`, `--type-small`, weight 400, `--color-text-muted`, 16 px below                                                 |
| Group link     | `--type-small`, weight 500, Canvas. 12 px between links on desktop; on mobile each link has a 44 px tall hit area   |
| External link  | Trailing arrow-up-right icon at 12 px, `aria-hidden`, plus visually hidden text "(external site)"                   |
| Social icon    | 20 px icon in a 44 by 44 px link, Canvas, Gold on hover. The link carries the network name as its accessible name   |
| Bottom row     | 96 / 64 / 48 px above, `--type-small`. Copyright in Canvas, legal links underlined, tagline in `--color-text-muted` |

Link states follow the Text link component on dark surfaces: no underline by default in the directory, Gold underline on hover, Gold focus ring.

**Accessibility:** `<footer>` containing a `<nav aria-label="Footer">` for the directory and a separate `<nav aria-label="Legal">` for the legal links. The social icons sit in a list labelled "Social media". The email is a `mailto:` link, the phone a `tel:` link and the address an `<address>` element.

### 3.3 Container

| Prop    | Values                   | Default |
| ------- | ------------------------ | ------- |
| `width` | `wide`, `text`, `narrow` | `wide`  |
| `as`    | Any block element        | `div`   |

No CMS field. Applies `max-width` and the breakpoint gutter as inline padding.

### 3.4 Section

**Anatomy:** optional eyebrow (band marker plus label), heading, optional introduction, content slot, optional action.

| Prop           | Values                                                 | Default   |
| -------------- | ------------------------------------------------------ | --------- |
| `surface`      | `canvas`, `white`, `green`, `ink`                      | `canvas`  |
| `spacing`      | `default`, `compact`                                   | `default` |
| `id`           | The section key, for anchor links                      | none      |
| `headingLevel` | `h2` (default) or `h1` for the first section on a page | `h2`      |

| Part                 | CMS field                                                                  |
| -------------------- | -------------------------------------------------------------------------- |
| Eyebrow              | `hero.eyebrow` (hero only). Other sections: **No field**, so they omit it. |
| Heading              | `{section}.heading`                                                        |
| Introduction         | `{section}.introduction`, or `{section}.body` for hero, about and contact  |
| Visibility and order | Homepage section ordering and show or hide in the CMS                      |

Rules: at most one Green section per page. Never place a Green section directly next to an Ink section. Put a Canvas or White section between them. Responsive: header stacks above content on all breakpoints; on desktop, a section may place its heading in columns 1 to 5 and content in 7 to 12.

### 3.4a Section heading (OpenAI pattern)

**Reference:** the OpenAI homepage. Section titles are small and quiet so the cards carry the section.

| Part         | Style                                                                               |
| ------------ | ----------------------------------------------------------------------------------- |
| Heading      | `h2`, 20 px / 24 px, weight 500, letter spacing -0.2 px; 24 px / 30 px from 1200 px |
| Introduction | One muted line under the heading                                                    |
| Aside        | Optional link on the right, for example "View all insights"                         |
| Alignment    | Left aligned, heading and aside on one row. 40 px below on mobile, 48 px on desktop |

No centred section headings and no eyebrow pills. The hero heading is the only large heading on Home.

### 3.4b Media card

**Reference:** OpenAI story and product cards. An image, then a meta line, then a title. No card background, border or shadow.

| Part      | Detail                                                                     |
| --------- | -------------------------------------------------------------------------- |
| Image     | 1:1, 4:3, 3:2 or 16:9, `--radius-card`, sunken background while loading    |
| Meta line | First part (label) in Ink weight 500, the rest muted, `--type-small`       |
| Title     | `h3`; sizes `md`, `lg`, `xl`. The title link stretches over the whole card |
| Text      | Optional one or two muted lines                                            |
| External  | Arrow-up-right after the title plus visually hidden "(external site)"      |
| Hover     | Image scales to 1.03, title underlines. Only with a fine pointer           |

Rows of media cards: 3 even columns on desktop (32 px gap), 2 on tablet, and a snap rail on mobile that runs to the screen edge so the next card peeks in.

### 3.5 Button

**Anatomy:** text label, optional loading indicator, optional trailing icon from [resources.md](resources.md) (for example the external arrow), always `aria-hidden`.

| Variant   | Light surfaces                            | Ink and Green surfaces                |
| --------- | ----------------------------------------- | ------------------------------------- |
| Primary   | Green fill, Canvas text                   | Gold fill, Ink text                   |
| Secondary | Transparent, `--border-control`, Ink text | Transparent, Mist border, Canvas text |

| Size | Height | Padding inline | Text           | Use                                                                                |
| ---- | ------ | -------------- | -------------- | ---------------------------------------------------------------------------------- |
| `md` | 48 px  | 24 px          | `--type-label` | Default everywhere                                                                 |
| `sm` | 40 px  | 18 px          | `--type-label` | Header action on desktop only (target stays 44 px through padding of the hit area) |

| State         | Primary                                                                                                                                                 | Secondary                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Default       | As above                                                                                                                                                | As above                 |
| Hover         | Green deep fill. On dark: lighter Gold `#F0CD75`                                                                                                        | Sunken surface fill      |
| Focus-visible | `--focus-ring` outside the pill                                                                                                                         | Same                     |
| Active        | `transform: translateY(1px)`                                                                                                                            | Same                     |
| Disabled      | Sunken fill, disabled text, `cursor: not-allowed`. Use `disabled` on a `<button>`; links are never disabled.                                            | Disabled border and text |
| Loading       | Label changes to a progress verb ("Sending"), a 12 px CSS ring spins before it, width is locked, `aria-busy="true"`, the button cannot be pressed twice | Same                     |
| Error         | n/a. Errors show on the form or the Error state, not the button.                                                                                        | n/a                      |

Responsive: full width inside forms and the mobile menu on mobile. Otherwise it sizes to its content.

| Usage        | CMS field                                    |
| ------------ | -------------------------------------------- |
| Hero action  | `hero.primaryCallToAction.label` and `.href` |
| Product link | `products[].url`, label "Visit {name}"       |
| Form submit  | Static label "Send message"                  |

**Accessibility:** use `<button>` for actions and `<a>` for navigation. Never use one styled as the other without the matching element. One Primary button per view. Labels describe the outcome ("Send message", not "Submit").

### 3.6 Text link

| State                    | Light surfaces                           | Ink and Green surfaces           |
| ------------------------ | ---------------------------------------- | -------------------------------- |
| Default                  | Green text, 1 px underline, offset 0.2em | Canvas text, 1 px Gold underline |
| Hover                    | Underline thickens to 2 px               | Same                             |
| Focus-visible            | `--focus-ring`, radius 2 px              | Gold ring                        |
| Active                   | Green deep                               | White                            |
| Visited                  | Same as default                          | Same as default                  |
| Disabled, loading, error | n/a                                      | n/a                              |

External links (`products[].url`, social links) open in the same tab by default. If a link opens a new tab, add visually hidden text "(opens in a new tab)". Inside running text, links are always underlined. Standalone links ("All insights") may drop the underline until hover only if they sit in an obviously interactive position.

### 3.7 Headings and text

| Element     | Token            | Colour                                                               | Notes                                              |
| ----------- | ---------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| Hero `h1`   | `--type-display` | `--color-text`                                                       | Max 16 words; `hero.heading` allows 160 characters |
| Page `h1`   | `--type-h1`      | `--color-text`                                                       | Insights listing and article titles                |
| `h2`        | `--type-h2`      | `--color-text`                                                       | Section headings                                   |
| `h3`        | `--type-h3`      | `--color-text`                                                       | Card titles                                        |
| `h4`        | `--type-h4`      | `--color-text`                                                       | Small headings                                     |
| Lead        | `--type-lead`    | `--color-text-muted`                                                 | Hero body, article excerpt                         |
| Body        | `--type-body`    | `--color-text`                                                       | Default                                            |
| Small, meta | `--type-small`   | `--color-text-muted`                                                 | Dates, read time, captions                         |
| Eyebrow     | `--type-label`   | `--color-text`, with band marker in `--color-brand`, or Gold on dark | `hero.eyebrow`                                     |

Use `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs. CMS text is plain text, so render it as text, never as HTML, except the article body (section 4).

### 3.8 Loading state

**Anatomy:** skeleton blocks shaped like the content they replace, on `--color-surface-sunken`, `--radius-sm`.

| Where            | Skeleton                                                             |
| ---------------- | -------------------------------------------------------------------- |
| Insights listing | 6 cards: image block 3:2, a 40 percent wide line, two title lines    |
| Article detail   | Title (two lines at h1 height), meta line, image block, 6 text lines |

States: default skeleton is still. A slow opacity pulse (1.6 s) is allowed only when `prefers-reduced-motion` is not set. Show skeletons only after 300 ms, so fast loads do not flash. Accessibility: the container has `aria-busy="true"` and a visually hidden live region saying "Loading insights". The existing `apps/web/app/insights/loading.tsx` is where this lives.

### 3.9 Empty state

**Anatomy:** band marker, heading (`--type-h3`), one sentence of body text, optional secondary action. Uses `--container-narrow`, centred, `--section-space-sm` padding.

| Where                                                         | Heading                | Body                                                           | Action       |
| ------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------- | ------------ |
| Insights listing                                              | No insights yet        | We publish articles and company updates here. Check back soon. | Back to home |
| Featured insights on Home                                     | Hide the whole section | n/a                                                            | n/a          |
| Empty Home list sections (services, products, projects, team) | Hide the whole section | n/a                                                            | n/a          |

Copy is static in code for now. If the Engineering Lead wants it editable, it needs a settings field.

### 3.10 Error state with retry

**Anatomy:** band marker in `--color-danger`, heading, one sentence, Primary button "Try again", secondary text link "Back to home".

| Where                                | Heading                     | Body                                                        |
| ------------------------------------ | --------------------------- | ----------------------------------------------------------- |
| Insights listing or article          | We could not load this page | Something went wrong on our side. Please try again.         |
| Contact form submit (429)            | Too many messages           | Please wait {Retry-After in minutes} minutes and try again. |
| Contact form submit (503 or network) | Message not sent            | We could not send your message. Please try again.           |

States: "Try again" calls the Next.js `reset()` in `error.tsx`, shows the button Loading state while retrying, and returns to the same error if it fails again. Accessibility: the heading receives focus when the error appears, and the region has `role="alert"` for form errors. Never show raw error text, codes or stack traces. Form field errors show under the field in `--color-danger`, linked with `aria-describedby`, and the field gets `aria-invalid="true"`.

## 4. Article body styles

Applies to the rendered `articles.body` inside `.prose`, centred at `--container-text`. The body format is an open decision (section 8), so these styles target plain semantic HTML elements and work for any renderer.

| Element            | Style                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `p`                | `--type-article`, 24 px between paragraphs                                                                                                                                                                                                 |
| `h2`               | `--type-h2` at the tablet size on every breakpoint (32 / 40), 64 px above, 16 px below                                                                                                                                                     |
| `h3`               | `--type-h3`, 40 px above, 12 px below                                                                                                                                                                                                      |
| `h4`               | `--type-h4`, 32 px above, 8 px below                                                                                                                                                                                                       |
| `ul`               | Band marker (12 by 4 px, Green) instead of a bullet, 8 px between items                                                                                                                                                                    |
| `ol`               | Numerals in `--color-brand`, weight 600, tabular figures                                                                                                                                                                                   |
| `blockquote`       | 4 px Green left border, 24 px left padding, `--type-lead`, 400 italic if approved, otherwise 400                                                                                                                                           |
| `table`            | Full measure inside a horizontally scrolling wrapper with `tabindex="0"` and a label. Header row 600 weight, 1 px `--color-border-strong` below; rows divided by `--color-border`; cells 12 px by 16 px; numbers right-aligned and tabular |
| `img` and `figure` | Full measure, `--radius-md`. Wide images may break out to 960 px on desktop. Always `alt` text.                                                                                                                                            |
| `figcaption`       | `--type-small`, `--color-text-muted`, 8 px above                                                                                                                                                                                           |
| Inline `code`      | `--font-mono` at 0.9em, `--color-surface-sunken` background, 2 px by 6 px padding, `--radius-sm`                                                                                                                                           |
| `pre` code block   | `--font-mono` 15 / 24, `--color-surface-sunken` background, 20 px padding, `--radius-md`, horizontal scroll, `tabindex="0"`. No window chrome, no fake terminal dots, no prompt symbols and no syntax colours for now.                     |
| `hr`               | 1 px `--color-border`, 48 px above and below                                                                                                                                                                                               |
| `a`                | Text link component                                                                                                                                                                                                                        |
| `strong`           | 600                                                                                                                                                                                                                                        |

The cover image (`articles.coverImage`, `articles.coverImageAlt`) sits above the body at 3:2, full `--container-wide` on desktop with `--radius-lg`.

## 5. Page patterns

Layout lives in code. Copy, images, links and metadata come from the CMS. There are three public page types: Home, Insights listing and Article Detail. There are no separate About, Services, Team, Products or Contact pages.

### 5.1 Home (`/`)

**References:** OpenAI for section headings and media cards; [Grey](https://grey.co/) for the feature-card language in What guides us (soft tinted cards, small uppercase labels, large statements, photo and text pairs, a dark panel with a hairline above its list). Gradients and colours stay ours: flat brand colours only.

Sections in order. Hidden or empty sections are skipped, and the surfaces still never place Green next to Ink.

| Order  | Section key         | Surface            | Layout                                                                                                                                                                                                                                                                                                     | CMS fields                                                                           |
| ------ | ------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1      | `hero`              | Canvas             | Heading, friendly lead and two buttons on the left; a community photo collage (arch, circle and soft shapes) with small band accents on the right. No eyebrow.                                                                                                                                             | `heading`, `body`, `primaryCallToAction`, proposed `secondaryCallToAction`, `images` |
| 1b     | Focus areas         | Canvas             | Section heading, then four square media cards in one even row (2 on tablet, rail on mobile).                                                                                                                                                                                                               | Proposed `hero.focusAreas[]`                                                         |
| 2      | `about`             | Green, then Canvas | A flat Green band with the centred, scroll-brightened statement and the community photo strip; then the story beside a city photo.                                                                                                                                                                         | `heading`, `body`, proposed `statement`, `community`, `image`                        |
| 2b     | What guides us      | Canvas             | After Grey's feature cards. Row 1: a photo (5 columns) beside a Green-tint mission card (7 columns) with a small uppercase Green label and a large statement. Row 2: one Ink panel with the vision statement, a hairline, then the four values in one row, each under a small Gold band. Stacks on mobile. | proposed `mission`, `missionImage`, `vision`, `values`                               |
| 3      | `products`          | White              | Section heading, then three even square media cards with sector, status and tagline.                                                                                                                                                                                                                       | `products[]`, proposed `image`, `sector`                                             |
| 4      | `services`          | Ink                | Section heading on flat Ink; light cards (Canvas, White, Green-tint) with a photo each, which stack as sticky cards on desktop.                                                                                                                                                                            | `heading`, `introduction`, `services[]`, proposed `image`                            |
| 5      | `projects`          | Canvas             | Section heading, then a horizontal row of 4:3 media cards: three even columns filling the container on desktop, two on tablet, a rail on mobile. Each card ends with its outcome beside a Green rule.                                                                                                      | `projects[]`, proposed `image`                                                       |
| 6      | `team`              | White              | Section heading; an expanding portrait accordion (first portrait open by default) with a flat Canvas name card. A swipeable row on mobile. Hidden when empty.                                                                                                                                              | `team[]`                                                                             |
| 7      | `featured_insights` | Canvas             | Heading with "View all insights"; the latest 6 articles in two columns of rows with square thumbnails.                                                                                                                                                                                                     | Latest published articles                                                            |
| 8      | `contact`           | White              | Very large heading and email on the left (sticky on desktop); the form in a nested card on the right.                                                                                                                                                                                                      | `heading`, `body`, settings `contactEmail`                                           |
| Footer | n/a                 | Ink                | See 3.2                                                                                                                                                                                                                                                                                                    | settings                                                                             |

Because `contact` is White, the Ink footer never touches the Green band.

**Article card** (used on Home and Insights): cover image 3:2 with `--radius-md`, or the Media placeholder (7.1) when there is no cover; meta line with first tag in `--type-label` 600 and date plus read time in `--type-small` muted; title in `--type-h3`; excerpt clamped to 3 lines. The whole card is one link via the title, with the click area stretched over the card.

### 5.2 Insights listing (`/insights`)

| Part         | Layout                                                                                    | Source                        |
| ------------ | ----------------------------------------------------------------------------------------- | ----------------------------- |
| Page header  | `h1` "Insights" and one line of intro, compact section spacing                            | Intro: **No field**           |
| Lead article | First item on page 1 only: image in 7 of 12 columns, text beside it, title at `--type-h2` | `GET /api/v1/public/articles` |
| Grid         | Remaining items: 3 columns desktop, 2 tablet, 1 mobile, 48 px row gap                     | Same                          |
| Pagination   | "Newer" and "Older" text links with "Page 2 of 5" between them                            | `page`, `totalPages`          |
| States       | Loading 3.8, Empty 3.9, Error 3.10                                                        |                               |

### 5.3 Article detail (`/insights/[slug]`)

| Part        | Layout                                                                                 | Source                                   |
| ----------- | -------------------------------------------------------------------------------------- | ---------------------------------------- |
| Back link   | "All insights" text link above the title                                               | Static                                   |
| Meta        | First tag, date, read time                                                             | `tags`, `publishedAt`, `readTimeMinutes` |
| Title       | `h1` at `--type-h1`, `--container-text` width                                          | `title`                                  |
| Excerpt     | `--type-lead`, muted                                                                   | `excerpt`                                |
| Cover image | See section 4                                                                          | `coverImage`, `coverImageAlt`            |
| Body        | `.prose`                                                                               | `body`                                   |
| Tags        | Small tags at the end, as text, not links (no tag pages exist)                         | `tags`                                   |
| Next step   | A compact Canvas band: "More from CodedDevs" with 3 latest article cards               | Latest published articles                |
| SEO         | `<title>` from `metaTitle` or `title`; description from `metaDescription` or `excerpt` | `metaTitle`, `metaDescription`           |

### 5.4 Admin CMS

The Admin screens (Login, Dashboard, Website Content, Insights, Settings) are designed and built by the CMS developer from this design system. They use the same tokens, Poppins weights, components and states as the public site, on light surfaces only, with `--type-body` at 15 / 24 for dense tables. There are no separate Admin screen designs. Raise anything the system does not cover with the designer.

## 6. Accessibility baseline

| Area           | Rule                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrast       | Only pairings from brand.md. Text 4.5:1, large text and UI boundaries 3:1. Gold is never text or a thin line on Canvas or White. Green and Ink never pair. |
| Visible focus  | Every focusable element shows `--focus-ring` on `:focus-visible`. Never remove outlines without this replacement.                                          |
| Skip link      | First element in `<body>`: "Skip to content", linking to `#main`. Hidden until focused, then shown top left on Canvas with the focus ring.                 |
| Reduced motion | Respect `prefers-reduced-motion: reduce`. No essential information is carried by motion.                                                                   |
| Target size    | 44 by 44 px minimum for touch targets (stricter than the 24 px WCAG 2.2 AA minimum). Inline text links are exempt.                                         |
| Heading order  | One `h1` per page. Home: hero heading is `h1`, section headings `h2`, cards `h3`. Article body starts at `h2`. Never skip a level.                         |
| Landmarks      | `header`, `nav`, `main id="main"`, `footer`. Each `nav` has a distinct `aria-label`.                                                                       |
| Language       | `<html lang="en">`.                                                                                                                                        |
| Images         | CMS images need alt text. Decorative images use `alt=""`. Team photos use the person's name.                                                               |
| Forms          | Visible labels above fields, never placeholder-only. Errors in text, not colour alone. Required fields marked "(required)".                                |
| Zoom           | Layout works at 200 percent zoom and at 320 px wide with no horizontal scroll, except tables and code blocks in their own scroll containers.               |

## 7. Icons

Icons are approved by the designer. They are inline SVG, copied from [resources.md](resources.md), which holds the code for every icon in use. There is no icon package.

| Rule         | Detail                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| Colour       | `fill="currentColor"` or `stroke="currentColor"`, so icons follow the text colour and surface tokens       |
| Sizes        | 12 px (inline with small text), 16 px (inline with body text), 20 px (social), 24 px (standalone)          |
| Decorative   | Next to a visible label, the icon has `aria-hidden="true"` and `focusable="false"`                         |
| Icon only    | The link or button carries the accessible name (`aria-label` or visually hidden text), never the SVG title |
| Target size  | Icon-only controls get a 44 by 44 px hit area                                                              |
| Adding icons | The designer adds the code to resources.md first, then engineers use it                                    |

## 7.1 Media placeholder

Shown wherever the CMS has no image yet: team photos (`team[].avatarUrl` empty) and article covers (`articles.coverImage` empty). Flat brand colour only, no gradients and no stock art.

| Surface         | Fill                     | Marker                                      |
| --------------- | ------------------------ | ------------------------------------------- |
| Canvas or White | `--color-surface-sunken` | Green band marker, bottom left, 24 px inset |
| Ink or Green    | `--color-surface`        | Gold band marker, bottom left, 24 px inset  |

| Prop    | Values                                                         | Default                  |
| ------- | -------------------------------------------------------------- | ------------------------ |
| `ratio` | `1:1` (team), `3:2` (articles), `16:9`                         | `3:2`                    |
| `label` | Text for screen readers, such as "Photo of {name} coming soon" | none, then `aria-hidden` |

Corners use `--radius-md`. The placeholder keeps the same box as the real image, so the layout does not shift when an image is added.

## 8. Open decisions

For the Engineering Lead, with the designer.

| No. | Decision                                                                                                                                                                                                                  | Proposal                                                                                                              | Owner                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1   | Navigation and the header action have no CMS fields, but the PRD says navigation is CMS-managed.                                                                                                                          | Add `navigation` to settings: up to 6 items of `{ label, href }` and one `{ label, href }` action.                    | Engineering Lead, Backend  |
| 2   | `services[].icon` exists in the API. Icons are now allowed.                                                                                                                                                               | If services show icons, the field holds an icon name from resources.md. Otherwise ignore it.                          | Designer, Engineering Lead |
| 3   | The format of `articles.body` is undefined. The current article page renders it as plain text.                                                                                                                            | Markdown, rendered on the server to the elements in section 4, with sanitising.                                       | Engineering Lead, Frontend |
| 4   | The article fields differ between apps: the API uses `excerpt`, `body`, `coverImage` string and `coverImageAlt`; `apps/web` types use `summary`, `content`, `coverImage.altText` and `author`, and the API has no author. | Align `apps/web` to the API names. Decide whether articles show an author.                                            | Engineering Lead, Frontend |
| 5   | No fields for legal links (privacy, terms) in the footer.                                                                                                                                                                 | Add to settings when legal pages are confirmed.                                                                       | Engineering Lead           |
| 6   | No field for the Insights listing intro line.                                                                                                                                                                             | Static copy for now, or a settings field.                                                                             | Engineering Lead           |
| 7   | Resolved: icons are allowed and live in resources.md. The footer uses social icons and the external arrow.                                                                                                                | Menu toggle and pagination stay text for now.                                                                         | Designer                   |
| 8   | Font loading.                                                                                                                                                                                                             | `next/font/google` with 400, 500, 600, as in brand.md. No package added.                                              | Frontend                   |
| 9   | A weight beyond 400, 500 and 600.                                                                                                                                                                                         | Add 400 italic only, for quotes and emphasis in articles.                                                             | Designer, Engineering Lead |
| 10  | On-green lockups keep the mark's Ink band on Green, and set the wordmark to Warm Canvas.                                                                                                                                  | Approve as a logo-only exception to the Green and Ink rule.                                                           | Designer, Engineering Lead |
| 11  | The mark's green band reads quietly on Ink (1.90:1).                                                                                                                                                                      | Accept for the footer, since the wordmark carries recognition there, or design a dedicated on-ink mark.               | Designer                   |
| 12  | Favicon wiring.                                                                                                                                                                                                           | Set `metadata.icons` in `apps/web/app/layout.tsx` to the SVG, ICO and apple-touch files in `/assets/logos/`.          | Frontend                   |
| 13  | Hero has no image field.                                                                                                                                                                                                  | Keep the hero type-only, as specified here.                                                                           | Designer                   |
| 14  | Resolved: there are no separate Admin CMS screen designs. The CMS developer builds the Admin screens from this design system.                                                                                             | Use these tokens, components and states. Raise gaps with the designer.                                                | CMS developer              |
| 15  | Clear space, minimum sizes, supporting colours, type scale and all PROPOSED rows in both files.                                                                                                                           | Review and approve or change.                                                                                         | Engineering Lead           |
| 16  | Dark mode.                                                                                                                                                                                                                | Not planned. The Ink surface covers dark moments.                                                                     | Designer                   |
| 17  | Contact requests use a same-origin route; only the validated Cloudflare client IP reaches the private API.                                                                                                            | Block direct origin/API access; set `API_TRUST_PROXY_HOPS` only after verifying the private frontend-to-API path.     | Engineering Lead, Backend  |
| 18  | Photography is Unsplash placeholder imagery.                                                                                                                                                                              | Replace with owned photography of real CodedDevs people and work through the CMS.                                     | Designer                   |
