# CodedDevs brand guidelines

Owner: Product & Brand Designer. Status: draft for Engineering Lead review (COD-313).

This file is the source of truth for the CodedDevs identity on the public website and the Admin CMS. Visual system details (tokens, layout, components) live in [design.md](design.md).

## How to read this file

- **Approved** means the rule comes from the company definition or a recorded designer decision.
- **PROPOSED** means the designer is suggesting the rule. It is not approved until the Engineering Lead and designer sign it off. Engineers may build against PROPOSED rules, but should expect changes.

## 1. Brand summary

| Item        | Rule                                                                                                                                                  | Status   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Company     | CodedDevs Technology Ltd                                                                                                                              | Approved |
| What we are | An African-first technology and product company building across Commerce, Finance, Health and AI                                                      | Approved |
| Tagline     | Built for What Is Next.                                                                                                                               | Approved |
| Name use    | CodedDevs is a proper noun. Write it as one word with a capital C and a capital D. It is not a description of developers.                             | Approved |
| Feel        | Mature, forward-looking, globally competitive. African without African cliches. Modern without generic SaaS aesthetics. Corporate without being cold. | Approved |

### The green, gold and ink idea

| Colour | Idea                          | Role in the system                                           |
| ------ | ----------------------------- | ------------------------------------------------------------ |
| Green  | Africa is growing.            | Leads. Brand surfaces, logo moments, primary actions.        |
| Gold   | Growth creates opportunity.   | Earned emphasis. Small, deliberate, never wallpaper.         |
| Ink    | Technology makes it possible. | Engineering weight. Text, dark surfaces, institutional tone. |

The three colours never carry equal weight. Green leads, Gold is deliberate, Ink gives maturity.

### Visual do and do not

| Do                                                                                                                                        | Do not                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Let type, space and real content carry the page.                                                                                          | Use code brackets, terminal cursors, curly braces or binary-code imagery.                         |
| Use Warm Canvas as the default ground so the brand feels warm and human.                                                                  | Use generic developer visual language: fake terminals, syntax-coloured decoration, glowing grids. |
| Use Coded Green for anchors: one strong band, the logo, primary actions.                                                                  | Use African cliches: tribal patterns, map silhouettes, safari or kente-style decoration.          |
| Use Future Gold rarely, on Ink or Green, for a key number, a marker or a focus ring.                                                      | Use Gold as text or as a thin line on Canvas or White.                                            |
| Keep layouts calm, with generous whitespace and confident headline sizes.                                                                 | Place Green and Ink directly next to each other as text and background.                           |
| Use warm, natural photography of African people, places and work. Placeholder stock (Unsplash) is allowed until owned photography exists. | Use stock gradients, glassmorphism or decorative 3D blobs that could belong to any SaaS.          |

The no-cliche row and the photography row are PROPOSED readings of the approved feel statement.

## 2. Logo

### Files

All files live in `apps/web/public/assets/logos/`. The three originals are byte-for-byte copies of the designer's source files, renamed to kebab case. Variants are colour swaps of the originals with no change to geometry.

| File                                       | Source                                             | viewBox       | Use on                           | Status   |
| ------------------------------------------ | -------------------------------------------------- | ------------- | -------------------------------- | -------- |
| `codeddevs-mark.svg`                       | Original "CD Logo mark"                            | `0 0 210 126` | Warm Canvas, White               | Approved |
| `codeddevs-lockup-horizontal.svg`          | Original "Horizontal logo lockup"                  | `0 0 639 162` | Warm Canvas, White               | Approved |
| `codeddevs-lockup-vertical.svg`            | Original "Vertical logo lockup"                    | `0 0 560 248` | Warm Canvas, White               | Approved |
| `codeddevs-mark-on-green.svg`              | Mark, green band set to Warm Canvas                | `0 0 210 126` | Coded Green                      | Approved |
| `codeddevs-lockup-horizontal-on-green.svg` | Lockup, green band and wordmark set to Warm Canvas | `0 0 639 162` | Coded Green                      | PROPOSED |
| `codeddevs-lockup-vertical-on-green.svg`   | Lockup, green band and wordmark set to Warm Canvas | `0 0 560 248` | Coded Green                      | PROPOSED |
| `codeddevs-mark-on-ink.svg`                | Mark, ink band set to Warm Canvas                  | `0 0 210 126` | Digital Ink                      | Approved |
| `codeddevs-lockup-horizontal-on-ink.svg`   | Lockup, ink band and wordmark set to Warm Canvas   | `0 0 639 162` | Digital Ink                      | Approved |
| `codeddevs-lockup-vertical-on-ink.svg`     | Lockup, ink band and wordmark set to Warm Canvas   | `0 0 560 248` | Digital Ink                      | Approved |
| `codeddevs-favicon.svg`                    | Full-colour mark on a Warm Canvas rounded square   | `0 0 256 256` | Browser tab, bookmarks           | PROPOSED |
| `codeddevs-favicon.ico`                    | 16 and 32 pixel renders of the favicon             | n/a           | Legacy browsers                  | PROPOSED |
| `codeddevs-favicon-32.png`                 | 32 pixel render                                    | n/a           | PNG favicon fallback             | PROPOSED |
| `codeddevs-apple-touch-icon.png`           | 180 pixel render                                   | n/a           | iOS home screen                  | PROPOSED |
| `codeddevs-icon-512.png`                   | 512 pixel render                                   | n/a           | Web app manifest, share fallback | PROPOSED |

Notes on the files:

- All fills are hard-coded hex values. There is no `currentColor`, so CSS cannot recolour them. This is intentional: pick the file that matches the surface.
- The wordmark is outlined paths, not live text: "Coded" in a light weight and "Devs" in bold. Never retype it in a font.
- The on-green lockups follow the on-green mark rule (green band to Warm Canvas). The wordmark is also set to Warm Canvas, because Ink text on Green is a forbidden pairing. The mark's ink band stays Ink as designed. This is why those two files are PROPOSED.
- On Digital Ink the mark's green band sits at 1.90:1 against the background. Logos are exempt from WCAG contrast, but the green band reads quietly. See Open decisions in design.md.
- The palette chip (`Color Palette.svg`) is a reference swatch, not a logo, and is not shipped.

### Which logo where

| Surface                      | Preferred file                                               | PROPOSED usage                                                                                                  |
| ---------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Site header                  | `codeddevs-lockup-horizontal.svg`, then `codeddevs-mark.svg` | Centred on desktop, left on mobile. 28 or 32 px tall; shrinks into the mark (24 or 28 px) once the page scrolls |
| Footer on Digital Ink        | None                                                         | The footer has no logo. Use the on-ink lockup on other Ink surfaces, 36 px tall                                 |
| Green brand band             | `codeddevs-mark-on-green.svg`                                | Only if the band needs a logo moment. Usually it does not.                                                      |
| Share image (Open Graph)     | `codeddevs-lockup-vertical.svg` on Warm Canvas               | Centred, with clear space                                                                                       |
| Admin CMS sidebar or top bar | `codeddevs-lockup-horizontal.svg`                            | 28 px tall                                                                                                      |
| Favicon                      | `codeddevs-favicon.svg` and `.ico`                           | Wired through Next.js metadata `icons`                                                                          |

### Clear space (PROPOSED)

The unit **B** is the height of one band of the mark. The mark has three equal bands, so B equals one third of the mark's height.

| Asset             | B in viewBox units | Clear space on every side |
| ----------------- | ------------------ | ------------------------- |
| Mark              | 42                 | 1 B                       |
| Horizontal lockup | 54                 | 1 B                       |
| Vertical lockup   | 42                 | 1 B                       |

At the header size of 32 px tall, the horizontal lockup's B is about 10.7 px. Keep at least 12 px of empty space around it.

### Minimum size (PROPOSED)

| Asset             | Digital minimum                                   | Print minimum |
| ----------------- | ------------------------------------------------- | ------------- |
| Mark              | 24 px wide                                        | 8 mm wide     |
| Horizontal lockup | 24 px tall                                        | 8 mm tall     |
| Vertical lockup   | 96 px wide                                        | 25 mm wide    |
| Favicon           | 16 px (uses the Canvas tile, never the bare mark) | n/a           |

Below the minimum, the "Coded" light weight breaks up. Use the mark on its own instead.

### Misuse

Do not:

- Recolour the mark or wordmark outside the approved variants.
- Use the Canvas and White files on Green or Ink, or the on-green and on-ink files on Canvas or White.
- Stretch, skew, rotate or change the proportions of any file.
- Change the band order, the band slant or the gap between mark and wordmark.
- Retype the wordmark, change its weights or set "CodedDevs" in a single weight as a logo.
- Add outlines, shadows, glows, gradients or animation to the logo.
- Place the logo on busy photography without a solid Canvas, White, Green or Ink panel behind it.
- Put the mark inside brackets, a terminal window or any other developer motif.
- Crowd the logo inside its clear space.

## 3. Colour

### Brand tokens (Approved)

| Token         | Hex       | Name        | Role                       |
| ------------- | --------- | ----------- | -------------------------- |
| `--cd-green`  | `#0D4F3C` | Coded Green | Primary                    |
| `--cd-gold`   | `#E5B94B` | Future Gold | Secondary, earned emphasis |
| `--cd-ink`    | `#111714` | Digital Ink | Supporting                 |
| `--cd-canvas` | `#F5F2EA` | Warm Canvas | Neutral                    |
| `--cd-white`  | `#FFFFFF` | White       | Neutral                    |

Supporting tints and states (muted text, borders, danger and others) are PROPOSED and listed in design.md.

### Ratio rule (Approved)

| Share            | Colours                         | Typical use                                                                 |
| ---------------- | ------------------------------- | --------------------------------------------------------------------------- |
| 70 to 80 percent | Warm Canvas, White, Digital Ink | Page ground, cards, text, footer                                            |
| 15 to 20 percent | Coded Green                     | One brand band per page, primary buttons, logo, selected states             |
| 5 to 10 percent  | Future Gold                     | Key numbers, small markers, focus ring on dark, selected calls to attention |

How the website meets it (PROPOSED): on Home, one full-width Green section (About) plus Green primary buttons and the logo. Gold appears only inside the Green section and the Ink footer. Every other section is Canvas or White.

### Approved text and background pairings

Contrast is WCAG 2.x. Body text needs 4.5:1, large text (24 px, or 18.66 px bold) needs 3:1.

| Text or element | Background  | Contrast | Allowed for                                        |
| --------------- | ----------- | -------- | -------------------------------------------------- |
| Digital Ink     | Warm Canvas | 16.23    | All text                                           |
| Digital Ink     | White       | 18.16    | All text                                           |
| Coded Green     | Warm Canvas | 8.53     | All text, links, focus ring, thin lines            |
| Coded Green     | White       | 9.54     | All text, links, focus ring, thin lines            |
| Warm Canvas     | Coded Green | 8.53     | All text on Green surfaces and Green buttons       |
| White           | Coded Green | 9.54     | All text on Green surfaces                         |
| Warm Canvas     | Digital Ink | 16.23    | All text on Ink surfaces                           |
| Future Gold     | Digital Ink | 9.83     | Text, key numbers, markers, thin lines, focus ring |
| Future Gold     | Coded Green | 5.17     | Text, key numbers, markers, focus ring             |
| Digital Ink     | Future Gold | 9.83     | Text on a Gold button or Gold badge                |

### Forbidden pairings

| Pairing                         | Contrast | Rule                                                                           |
| ------------------------------- | -------- | ------------------------------------------------------------------------------ |
| Future Gold on Warm Canvas      | 1.65     | Never as text or a thin line. Approved rule.                                   |
| Future Gold on White            | 1.85     | Never as text or a thin line. Approved rule.                                   |
| Coded Green with Digital Ink    | 1.90     | Never paired directly as text and background, either way round. Approved rule. |
| Coded Green on Future Gold      | 5.17     | Technically passes. PROPOSED: avoid, use Ink on Gold instead.                  |
| Gold as a large background area | n/a      | PROPOSED: no Gold sections, Gold cards or Gold hero panels.                    |

The only allowed Green and Ink contact is inside the logo itself.

## 4. Typography

### Decision log

| Date            | Decision                                          | Detail                                                                                                                                                                                                                                                                                                      | Decided by               |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 5 November 2026 | Poppins replaces the original two-typeface system | The original company definition set Play for headlines and Cabinet Grotesk for body text. Poppins now covers both headlines and body text. It matches the outlined wordmark, it is open source (SIL Open Font License) and it is available through Google Fonts, which Next.js can self-host at build time. | Product & Brand Designer |

The date records when this decision was written into the repo. If the decision was made on an earlier date, correct the date here.

### Allowed weights

| Weight     | Name           | Use                                                  | Status   |
| ---------- | -------------- | ---------------------------------------------------- | -------- |
| 400        | Regular        | Body text, long-form reading, captions, meta text    | Approved |
| 500        | Medium         | Headlines and display type, navigation, buttons      | Approved |
| 600        | SemiBold       | Small headings (h4), labels, category tags, emphasis | Approved |
| 400 italic | Regular Italic | Emphasis and pull quotes in articles                 | PROPOSED |

No other weights ship. The light and bold weights in the wordmark are part of the logo artwork and do not need to load as fonts.

### Fallback stack

```css
font-family:
  'Poppins',
  ui-sans-serif,
  system-ui,
  -apple-system,
  'Segoe UI',
  Roboto,
  'Helvetica Neue',
  Arial,
  sans-serif;
```

Code blocks in articles use a system monospace stack. See design.md.

### Loading approach

- Use `next/font/google` in `apps/web/app/layout.tsx` and `apps/admin/app/layout.tsx`. It downloads Poppins at build time and serves it from the app's own origin, so no runtime request goes to Google and no npm package is added.
- Request only `weight: ['400', '500', '600']`, `style: ['normal']` and `subsets: ['latin']`. Add `style: ['normal', 'italic']` only if the 400 italic proposal is approved.
- Use `display: 'swap'` so text renders immediately in the fallback font.
- Expose the font as a CSS variable, for example `variable: '--font-poppins'`, and point `--font-sans` in the tokens at it.
- Keep the default `adjustFontFallback`, so the fallback font is size-matched and layout shift stays low.
