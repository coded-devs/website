# CODEDDEVS Website — AI Assistant Instructions

> Read this file before touching any code. Every decision in this project flows from this document.
> This file is the single source of truth for the entire codebase. If something is not documented here, ask before assuming.

---

## 0. Project Overview

**What this project is:**
codeddevs.com is the official company website for CODEDDEVS TECHNOLOGY LTD - a Nigerian technology company registered with the Corporate Affairs Commission (RC: 9426867), incorporated in March 2026, and headquartered in Lagos. The site audience is investors, press, partners, collaborators, and people who want to understand what CodedDevs is building.

**How the system works:**
The project is a full-stack Next.js 15 monolith — the frontend (public pages), backend (API routes), and admin dashboard all live in one codebase and deploy together on Vercel.

**The CMS:**
There is a built-in admin dashboard at `/admin` that serves as the company's CMS. Every piece of content on the public site — team members, products, blog posts, job listings — is managed through this dashboard. No code changes are needed to update content. The admin dashboard is protected by authentication and is only accessible to the single admin user.

**The public site:**
The public site at `/` reads all content from a Neon PostgreSQL database via Drizzle ORM. Pages are statically generated at build time and revalidated every hour via ISR. This means the site is fast for visitors but content updates appear within 60 minutes of being published from the admin dashboard.

The CodedDevs site presents both the company and the products it builds. Public product pages live at `/products` and `/products/[slug]`, and featured products appear on the home page. Product pages introduce each product and then link out to its own external website — detailed product marketing, pricing, and onboarding stay on the product's own site.

**The database:**
A single Neon PostgreSQL database stores all content for team members, products, blog posts, and admin users. The schema is defined in `src/db/schema.ts` and managed via Drizzle Kit migrations. The database stores only text, JSON, and Cloudinary URLs - no images or binary files.

**External services:**
- **Cloudinary** — stores all content images. Images are uploaded via the admin dashboard, never stored locally.
- **Vercel** — hosts the entire application. Deploys automatically when code merges to `main`.

**What this site is NOT:**
- Not the twizrr product site (twizrr.com is a separate codebase)
- Not a portfolio site
- Not a static site — it has a real backend, database, and CMS

---

## 1. What This Project Is

Official company website for **CODEDDEVS TECHNOLOGY LTD** (RC: 9426867).

- **URL:** codeddevs.com (placeholder until domain is confirmed)
- **Audience:** Investors, press, and partners — NOT merchants, buyers, or end users
- **Purpose:** Present CODEDDEVS as a serious, product-driven Nigerian technology company building software, payment, and AI products for African markets. Communicate why the company exists, what it is building, what is coming next, and how its products are evolving. Share product updates, releases, version changes, roadmaps, announcements, partnerships, and company stories.
- **Tone:** Professional, confident, company-first, and grounded in African market realities. The writing should be clear and human, not generic startup language.
- **This is NOT a portfolio site.** Do not treat it like a project showcase or personal portfolio. It is an official company website structured the way established tech companies present themselves.
- **This is NOT the twizrr product site.** twizrr.com is a completely separate codebase and repo. Every mention of twizrr on this site links OUT to twizrr.com.
- **Public product pages exist.** `/products` lists every product and `/products/[slug]` is the detail page for each one. Product CTAs still open the relevant external product website in a new tab.

---

## 2. Tech Stack

Do not change any of these without explicit instruction from the user.

| Layer | Choice |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Runtime | React 19 |
| Database | Neon PostgreSQL |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 (credentials, single admin) |
| Blog editor | TipTap (rich text, stores JSON) |
| File storage | Cloudinary |
| Image cropping | react-image-crop (admin only — never on public pages) |
| Admin UI primitives | shadcn/ui (admin dashboard only) |
| Icons | No icon libraries — inline SVGs only via `src/components/ui/icons.tsx` |
| Fonts | JetBrains Mono + IBM Plex Sans |
| Hosting | Vercel |
| Package manager | pnpm — NEVER use npm or yarn |

---

## 3. Design System

These values are the single source of truth. Never deviate.

### Brand Colors

```
Primary Navy:   #121F38   — the main brand color
Brand Silver:   #D1D6E0   — the secondary brand color
```

### Color Palette

```css
--color-bg:           #FFFFFF;   /* page background — pure white */
--color-surface:      #F4F5F8;   /* cards, input fields, subtle sections */
--color-surface-2:    #D1D6E0;   /* dividers, section backgrounds, tags */
--color-border:       #C4CAD6;   /* all borders */
--color-text-primary: #121F38;   /* headings, nav, important text */
--color-text-body:    #2C3A52;   /* body copy */
--color-text-muted:   #6B7896;   /* captions, labels, secondary */
--color-accent:       #121F38;   /* primary buttons, links, highlights */
--color-accent-hover: #1A2D4F;   /* button/link hover */
--color-accent-amber: #C98A3A;   /* warm commerce and energy accent */
--color-accent-green: #2F6F4E;   /* growth, community, ecosystem accent */
--color-accent-clay:  #A85D3A;   /* grounded editorial and African warmth accent */
--color-accent-blue:  #3B82F6;   /* technology and AI accent */
--color-success:      #16A34A;
--color-error:        #DC2626;
```

### Supporting Accent Colors

The public site is allowed to use a small supporting palette when it improves meaning, hierarchy, or emotional warmth. These accents should support the brand system, not replace it.

- **Amber `#C98A3A`** — commerce, payments, energy, warmth
- **Green `#2F6F4E`** — community, growth, ecosystems
- **Clay `#A85D3A`** — grounded editorial warmth and African context
- **Blue `#3B82F6`** — AI, software, infrastructure, technical signals

Use supporting accents sparingly: icons, small tags, data marks, section highlights, illustration details, and category cues. Do not use them as dominant page backgrounds unless explicitly requested.

### Color Composition

The public site must not default to white and gray for nearly every section. Use the three core brand surfaces creatively and intentionally:

- **Navy `#121F38`** — strong brand bands, footer, calls to action, selected feature sections, and high-emphasis moments.
- **Brand Silver `#D1D6E0`** — structural contrast, editorial bands, supporting panels, dividers, and secondary emphasis.
- **White `#FFFFFF`** — breathing room, primary reading surfaces, and visual reset between stronger sections.
- Use `#F4F5F8` as a quiet supporting surface, not as the automatic background for every card or section.
- Create page rhythm by alternating white, navy, and silver surfaces where the content hierarchy supports it.
- Dark navy sections are brand compositions, not dark mode. They must use white primary text and silver secondary text with accessible contrast.
- Do not make the site one-note: neither an all-white/gray interface nor a navy-dominated interface is acceptable.
- Do not introduce gradients or unrelated accent colors. Creativity should come from proportion, contrast, layout, typography, imagery, and the deliberate mixing of the approved brand and supporting colors.

### Typography

Fonts loaded via `next/font/google` in `src/app/layout.tsx`. Never use a `<link>` tag or CDN.

| Element | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| Hero H1 | JetBrains Mono | 56–72px | 700 | 1.05–1.1 |
| Page H1 | JetBrains Mono | 48–56px | 700 | 1.1 |
| H2 | JetBrains Mono | 36–48px | 700 | 1.2 |
| H3 | JetBrains Mono | 24–32px | 600 | 1.3 |
| H4 / Subheading | JetBrains Mono | 20px | 500 | 1.4 |
| Body large | IBM Plex Sans | 18px | 400 | 1.75 |
| Body | IBM Plex Sans | 16px | 400 | 1.7 |
| Small / caption | IBM Plex Sans | 14px | 400 | 1.6 |
| Label / UI tag | IBM Plex Sans | 12px | 500 | — |

### Spacing

- Base unit: 4px (Tailwind default)
- Section vertical padding: generally `py-20` to `py-32` on desktop and `py-14` to `py-20` on mobile, based on hierarchy
- Do not give every section identical vertical spacing; vary rhythm deliberately while preserving clear separation
- Standard desktop content width: `max-w-7xl` (1280px), centered
- Hero and media-led layouts may use up to `max-w-[1440px]` when the composition benefits from it
- Editorial prose and long-form reading content stays narrow at `max-w-3xl`
- Page introductions may use `max-w-4xl`, but should be left-aligned by default
- Responsive page gutters: `px-6 md:px-8 lg:px-10 xl:px-12`
- Full-width color bands must contain a properly constrained inner layout; do not place body copy directly against viewport edges

### Component Styles

```
Navbar:             bg-white border-b border-[#C4CAD6], sticky top
Button primary:     bg-[#121F38] text-white hover:bg-[#1A2D4F]
Button secondary:   border border-[#C4CAD6] text-[#121F38] hover:bg-[#F4F5F8]
Cards:              choose the lightest appropriate treatment — open editorial, white with a light border, or surface background
Inputs:             bg-white border border-[#C4CAD6] text-[#121F38] rounded-md
Active/selected:    bg-[#D1D6E0] text-[#121F38]
Badge / tag:        bg-[#D1D6E0] text-[#121F38]
Footer:             bg-[#121F38] text-white; secondary copy/icons use #D1D6E0
```

### Design Direction

- **Professional, not generic.** Must feel like a real company website — not AI-generated.
- **Clean, but not plain.** Strong typography, clear messaging, generous whitespace, and intentional visual moments. Minimal does not mean empty, cold, or limited to white/gray/navy.
- **Text-led, not text-only.** Use imagery, illustration, photography, texture, interactive visuals, motion, and rich editorial layouts where they add evidence, product context, African market context, identity, or emotional clarity.
- **Light theme only.** No dark mode. No `dark:` Tailwind variants.
- **Purposeful motion is allowed.** Motion may be used in hero visuals, section reveals, interactive illustrations, and storytelling moments when it is subtle, performance-safe, and disabled by `prefers-reduced-motion`.
- **Hover effects should feel controlled.** Use color, opacity, transform, shadow, or underline effects when they improve feedback. Avoid excessive movement or gimmicks.
- **Public site uses custom components.** shadcn/ui is permitted only in the admin dashboard; never use it to define the public site's visual identity.
- **Gradients are allowed sparingly.** Use gradients only when they support atmosphere, depth, or storytelling. Avoid generic purple/blue SaaS gradients and decorative blobs.
- **Use borders intentionally.** Borders, spacing, color contrast, backgrounds, imagery, and depth can all be used to create hierarchy.
- **Shadows are allowed sparingly.** Use soft, intentional depth for layered UI, editorial cards, media surfaces, floating panels, or interactive elements. Avoid heavy default shadows.
- **Visual richness is allowed.** The site can use stronger section compositions, color, illustration, real media, product screenshots, African technology context, and brand storytelling when it supports the company narrative.
- **No generic AI-style layouts.** Avoid arbitrary blobs, stock-looking sections, template-heavy cards, fake dashboards, and visual filler.

### Desktop Composition

- The current visual-design phase is desktop-led. Establish and approve the 1280px and 1440px compositions first, then perform dedicated tablet and mobile refinement.
- Mobile layouts must remain functional during desktop work, but mobile visual polish may follow after the desktop system is approved.
- Public page headings and section introductions are left-aligned by default. Center text only when it creates a deliberate editorial focal point.
- Avoid stacking every section inside the same centered `max-w-5xl` container.
- Use wider desktop grids, asymmetric columns, editorial rows, split layouts, full-width color bands, and varied media proportions where they improve hierarchy.
- Section-to-section rhythm should vary. Do not repeat the same heading-plus-three-identical-cards composition throughout a page.
- Preserve readable line lengths: wide containers are for composition, not for stretching paragraphs across the full width.
- Cards are not the default container. Prefer open layouts and spacing when content does not require a framed boundary.
- Use one strong compositional idea per section. Avoid decorative filler, nested cards, excessive badges, or arbitrary shapes.

### Logo Usage

Logo files in `public/logos/`:
- **Full logo SVG** (`/public/logos/wordmark.svg`) — Footer and formal contexts
- **Icon-only SVG** (`/public/logos/mark.svg`) — Navbar, mobile nav, and compact spaces
- **PNG** (`/public/fav-icon/logo.png`) — favicon only
- Never recreate the logo in code. Always use the actual files.
- Navbar logo always links to `/`

### Icons

**No icon libraries installed. All icons are inline SVGs in `src/components/ui/icons.tsx`. Import named components from there only. SVG paths sourced from lucide.dev or heroicons.com. Never install `lucide-react` or any other icon package.**

- Outline-style interface icons use the shared `StrokeIcon` wrapper in `icons.tsx` so stroke weight, line caps, and viewBox stay consistent across the set.
- Brand marks and social logos are filled paths and do not use `StrokeIcon`.
- Use `currentColor` so icons inherit the surrounding text color. Size with Tailwind utilities (`h-4 w-4`), not hardcoded width/height.
- Only add icons that are actually used; never pre-populate unused icons.
- **Never use emojis as UI icons.** Use an icon from `icons.tsx`.

```tsx
// CORRECT — every icon comes from the shared file
import { ArrowRightIcon, MenuIcon, SearchIcon } from '@/components/ui/icons'
import { TiktokIcon } from '@/components/ui/icons'

// WRONG — no icon packages of any kind
import { ArrowRight } from 'lucide-react'
import { TrophyIcon } from '@heroicons/react/24/outline'
```

---

## 4. Folder Structure

```
codeddevs-website/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                      # Home
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx                  
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── team/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── team/ (page, new, [id])
│   │   │   ├── products/ (page, new, [id])
│   │   │   ├── blog/ (page, new, [id])
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── upload/route.ts
│   │   │   └── admin/
│   │   │       ├── team/ (route, [id])
│   │   │       ├── products/ (route, [id])
│   │   │       ├── blog/ (route, [id])
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AdminSidebar.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   └── icons.tsx                     # shared inline SVG icons
│   │   ├── sections/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ProductsSection.tsx
│   │   │   ├── LatestReleasesSection.tsx
│   │   │   ├── RecognitionSection.tsx
│   │   ├── products/
│   │   │   └── ProductStatusBadge.tsx
│   │   ├── blog/
│   │   │   └── PostContent.tsx
│   │   └── admin/
│   │       ├── actions/
│   │       │   └── AdminDeleteButton.tsx
│   │       ├── editors/
│   │       │   └── RichTextEditor.tsx
│   │       ├── forms/
│   │       │   └── ResourceForms.tsx
│   │       ├── media/
│   │       │   └── ImageUpload.tsx            # includes react-image-crop
│   │       ├── tables/
│   │       │   ├── DataTable.tsx
│   │       └── ui/                            # shadcn-generated admin primitives only
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   ├── queries.ts
│   │   └── migrations/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── email.ts
│   │   ├── cloudinary.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── scripts/
│   └── seed-admin.ts                         # gitignored — local use only
├── drizzle.config.ts
├── components.json                            # shadcn CLI config; admin UI alias points to components/admin/ui
├── middleware.ts
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                                # gitignored
├── .env.example
├── AGENTS.md
└── package.json
```

---

## 5. Database Schema

### team_members
```ts
id, name, role, bio, photo_url, linkedin_url, github_url,
twitter_url, order_index, is_active, created_at, updated_at
```

### products
```ts
id, name, slug, tagline, description, cover_url,
external_url, github_url, status, is_featured,
order_index, created_at, updated_at
```

### blog_posts
```ts
id, title, slug, excerpt, content (json — TipTap),
cover_url, author, category, is_published,
show_in_recognition, placement, published_at,
created_at, updated_at
```

**category enum:** `'Product Update' | 'Announcement' | 'Roadmap' | 'Story'`

**show_in_recognition:** `boolean, notNull, default(false)`
Controls whether post appears in the Recognition section on the home page.
Admin toggles this manually per post.

**placement:** `text, nullable`
Controls the placement badge shown on the Recognition card.
Values: `'1st' | '2nd' | '3rd' | 'winner' | null`
Only relevant when show_in_recognition is true.
Displayed as an inline SVG icon + label from icons.tsx — never as an emoji.


### admin_users
```ts
id, email, password_hash, created_at
```

---

## 6. Environment Variables

```bash
DATABASE_URL=                        # Neon pooled connection string
DATABASE_URL_UNPOOLED=               # Neon direct connection (migrations only)
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Local development:** `.env.local` points to Neon `dev` branch connection strings.
**Production:** Vercel environment variables point to Neon `production` branch.
Use `DATABASE_URL` for all app queries.
Use `DATABASE_URL_UNPOOLED` only in `drizzle.config.ts` for migrations.

---

## 7. API Routes

### Public
| Method | Route | Description |
|---|---|---|

### Admin (401 if no session)
| Method | Route | Description |
|---|---|---|
| POST | `/api/upload?folder=[folder]` | Upload to Cloudinary in correct subfolder |
| GET/POST | `/api/admin/team` | List / create |
| GET/PUT/DELETE | `/api/admin/team/[id]` | Read / update / delete |
| GET/POST | `/api/admin/products` | List / create |
| GET/PUT/DELETE | `/api/admin/products/[id]` | Read / update / delete |
| GET/POST | `/api/admin/blog` | List / create |
| GET/PUT/DELETE | `/api/admin/blog/[id]` | Read / update / delete |

### Upload folder routing
- Team photos → `?folder=team`
- Product covers → `?folder=products`
- Blog covers → `?folder=blogs`
- Inline blog images → `?folder=blogs/inline`

All uploads go to `codeddevs-website/[folder]/` in Cloudinary.

---

## 8. Route Protection

```ts
// middleware.ts — uses getToken from next-auth/jwt
// /api/admin/* + no session → 401 JSON
// /admin/* + no session → redirect to /admin/login
// /admin/login + session → redirect to /admin/dashboard
```

---

## 9. Page Content & Structure

### Public navigation model

- Internal navigation is Products, Blog, and Team, in that order.
- The primary navigation CTA is **"Try twizrr"** and links directly to `https://twizrr.com`.
- Product CTAs always open externally with `target="_blank"` and `rel="noopener noreferrer"`.
- On mobile, "Try twizrr" remains a clear CTA inside the navigation menu.
- The footer Product group links to `/products`, to `/blog` for product updates, and directly to external product websites.
- **Footer navigation contains page links only — never home-page section anchors.** Sections return `null` in production when they have no content, so their DOM ids disappear and any `/#section` link silently becomes dead. Do not add `/#recognition`, `/#latest-releases`, or similar.
- The navbar uses `mark.svg`; the footer uses `wordmark.svg`.
- Keep primary navigation concise. Deeper company, editorial, product, and external-resource links belong in the footer.
- If CodedDevs launches multiple products later, the primary CTA may become a compact product menu. Every product destination must still be external unless the user explicitly changes this architecture.

This follows the company/product separation demonstrated by Anthropic: company-level information remains on the corporate site, while the primary product action sends visitors to the product experience.

### Home (/)
Sections in this exact order:

**1. HeroSection**
- Headline: "Engineering Software That Works for Africa"
- Subtext: "We build AI-first software products for African markets — from first principles, not adaptations."
- CTA: "Try twizrr" -> https://twizrr.com (external)
- Kody mascot (`kody.svg` — neutral/confident) optional in hero

**2. ProductsSection**
- Heading: "What We're Building"
- Fetches products where is_featured = true, ordered by order_index ASC
- Cards: name, status badge, tagline, "Learn more" -> `/products/[slug]`, "Visit" -> external_url
- If no featured products exist, section does not render in production

**3. LatestReleasesSection**
- Heading: "Latest Releases"
- Fetches the 3 most recent published posts (ALL categories)
- Cards: title, excerpt, date, category badge, dynamic CTA

**4. RecognitionSection**
- Heading: "Recognition"
- Fetches blog posts where show_in_recognition = true AND is_published = true
- Ordered by published_at DESC NULLS LAST, limit 3
- Cards — text only, no cover image
- Section background `#F4F5F8`, cards white
- Placement display uses inline SVG icons from icons.tsx — never emojis
- If no recognition posts exist, section does not render in production

**5. TeamSection** — not yet built. Add here when it exists.

Data for all sections is fetched in a single `Promise.all()` in `src/app/(public)/page.tsx`.

### Empty states behaviour
Sections behave differently based on environment:
```ts
const isDev = process.env.NODE_ENV === 'development'

// In development: show section with empty state message
// In production: return null (hide section completely)
```

This applies to: ProductsSection, LatestReleasesSection, and RecognitionSection.
Empty state style: bg-[#F4F5F8] rounded-lg p-8, text-sm text-[#6B7896], centered.


### Products (/products)
- Lists all products from the `products` table, ordered by `order_index` ASC
- Page heading "Our Products", subheading "Software built for African markets."
- Cards: name, status badge, tagline, "Learn more" -> `/products/[slug]`, "Visit [name]" -> `external_url` when present
- Card style: `bg-[#F4F5F8] border border-[#C4CAD6] rounded-lg p-8` with a `border-l-4 border-l-[#121F38]` accent
- Empty state shows in development only

### Product detail (/products/[slug])
- Fetches a product by slug; calls `notFound()` when the slug is missing or unmatched
- Product name as H1 with the status badge beside it, tagline as large body text
- Cover image via `getProductCoverUrl()` when `cover_url` is present
- Description rendered as prose (plain text column, `whitespace-pre-line`)
- Action buttons: "Visit [name]" when `external_url` exists, "View on GitHub" when `github_url` exists — both `target="_blank" rel="noopener noreferrer"`
- `generateStaticParams` pre-renders all product slugs; returns `[]` in CI or on error

### Product presence
- Product detail pages introduce a product and then send visitors to its own website.
- Product-specific marketing, onboarding, pricing, and detailed feature content belong on the product's own website.
- twizrr links to `https://twizrr.com`. `/products/[slug]` may describe twizrr, but must not recreate the twizrr product experience.
- Product-related blog posts remain on `/blog` because they are company updates and editorial content.

### Blog (/blog) 
- URL stays /blog.
- Lists published posts ordered by published_at DESC
- Filterable by: All | Product Update | Announcement | Roadmap | Story
- Each card: category badge, title, excerpt, author, date, dynamic CTA

### Blog Post (/blog/[slug])
Editorial layout:
```
[Cover image — full width, 1200x630px, priority prop for LCP]
CATEGORY BADGE
Title (JetBrains Mono, H1)
By [author] · [formatted date] · [X min read]
─────────────────────────────────────────────
[TipTap rendered content — IBM Plex Sans body, max-w-3xl]
```

### Team (/team)
- Fetches ALL team_members where is_active = true, ordered by order_index
- Each card: photo, name, role, bio, social links
- Founders:
  - **Kareem Aliameen - Founder & CEO**
    Kareem is a Founder of CodedDevs Technology LTD, helping lead company strategy, product direction, and technical execution.
  - **Yusuf Saheed - Co-Founder**
    Yusuf is a Co-Founder of CodedDevs Technology LTD, helping shape the company's technical direction and product development across software, payments, commerce, and AI.
  - **Amoo Mustakheem - Co-Founder**
    Mustakheem is a Co-Founder of CodedDevs Technology LTD, helping lead operations, partnerships, business development, and growth strategy.



---

## 10. Image Strategy

### Static brand assets → `public/` only
- `/public/logos/wordmark.svg` — full logo
- `/public/logos/mark.svg` — icon only
- `/public/mascot/kodysmile.svg` — smiling Kody
- `/public/mascot/kody.svg` — neutral/confident Kody
- `/public/fav-icon/logo.png` — favicon
- Nothing else goes in public/

### Content images → Cloudinary always
- Team photos: `codeddevs-website/team/` — 800x800px
- Product covers: `codeddevs-website/products/` — 1200x630px
- Blog covers: `codeddevs-website/blogs/` — 1200x630px
- Inline article images: 1200x800px

### Image cropping (admin dashboard only)
- Team photos → square crop (1:1)
- Blog covers → landscape crop (1200:630)
- Product covers → landscape crop (1200:630)
- Inline images → free crop
- `react-image-crop` imported ONLY in `ImageUpload.tsx` — never on public pages

### Cloudinary URL transformations
```ts
getBlogCoverUrl(url)       // f_auto,q_auto,w_1200,h_630,c_fill
getBlogThumbnailUrl(url)   // f_auto,q_auto,w_800,h_420,c_fill
getRecognitionCardUrl(url) // f_auto,q_auto,w_600,h_315,c_fill
getTeamPhotoUrl(url)       // f_auto,q_auto,w_400,h_400,c_fill,g_face
getProductCoverUrl(url)    // f_auto,q_auto,w_1200,h_630,c_fill
```

### Image component rules
- Always use Next.js `<Image>` for Cloudinary images
- SVGs from public/ can use `<Image>` or `<img>`
- Never use raw `<img>` for content images
- Always set meaningful `alt` text
- Add `priority` prop to above-the-fold images

---

## 11. Mascot Usage (Kody)

| File | Variant | Use where |
|---|---|---|
| `kodysmile.svg` | Smiling | 404 page (200px tall, centered above the 404 text) and empty states |
| `kody.svg` | Neutral/confident | Optional hero visual |

- The 404 page uses `kodysmile.svg` via next/image at 200px tall. Never the logo mark.
- Never smaller than 120px
- Always on white or light surface
- Use sparingly — not as filler

---

## 12. Performance

### ISR
```ts
export const revalidate = 3600 // all public pages
```

### Parallel DB queries
```ts
const [products, posts] = await Promise.all([...])
```

### Selective columns
- Blog list and home editorial queries: never fetch the `content` column

### Sitemap rules
- Include company routes: `/`, `/products`, `/blog`, and `/team`
- Include published `/blog/[slug]` routes
- Include `/products/[slug]` routes

### Caching note (Next.js 15)
In Next.js 15, `fetch()` is NOT cached by default. If using fetch() directly in server components, add appropriate cache settings explicitly.

---

## 13. Next.js 15 — Critical Breaking Changes

**This codebase runs on Next.js 15 + React 19.**
Any new dynamic route page MUST follow these patterns:

### params and searchParams are now async Promises

```ts
// CORRECT — Next.js 15 way
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // use slug
}

// WRONG — Next.js 14 way, will break
export default function Page({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params // breaks in Next.js 15
}
```

### searchParams is also async
```ts
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { q } = await searchParams
}
```

### generateStaticParams — unchanged
`generateStaticParams` still works the same way as Next.js 14. No changes needed.

### fetch() caching — changed
`fetch()` responses are no longer cached by default. Add `cache: 'force-cache'` explicitly if caching is needed.

---

## 14. Coding Rules

1. Server components by default — `'use client'` only when needed
2. Drizzle for all DB queries — no raw SQL
3. Auth check first on every admin route — 401 if no session
4. Zod validation on every API route that accepts a body
5. pnpm only — never npm or yarn
6. Cloudinary for all content images — use transformation helpers
8. next/font/google for fonts — no CDN link tags
9. Public pages use custom Tailwind components only. shadcn/ui and react-image-crop are admin-only and must never be imported by a public page or public component
10. cn() for all conditional classNames
11. Purposeful motion is allowed when it supports storytelling, interaction, or hierarchy. Motion must be performance-safe and respect `prefers-reduced-motion`
12. Light theme only — no dark: variants
13. Gradients are allowed sparingly when they support atmosphere, depth, or storytelling. Avoid generic SaaS gradients and decorative blobs
14. TypeScript strict — no any, no @ts-ignore
15. @/ imports only — no relative ../../ imports
16. Product/external links always target="_blank" rel="noopener noreferrer"
17. migrations/ is read-only — only Drizzle Kit writes here
18. Logo files only — never recreate logo in code
19. "Products" not "Projects" — everywhere in UI, routes, and code
20. Blog URL /blog, displayed as "blog" in all user-facing labels
21. Use borders sparingly — prefer spacing and background contrast
22. Design must feel human, not AI-generated
23. No emojis in UI components — use an icon from `icons.tsx`
24. No icon libraries installed. All icons are inline SVGs in `src/components/ui/icons.tsx`. Import named components from there only. SVG paths sourced from lucide.dev or heroicons.com. Never install `lucide-react` or any other icon package
25. Always await params and searchParams in dynamic route pages (Next.js 15)
26. seed scripts go in scripts/ folder and are gitignored — never commit them
27. The current visual-design phase is desktop-led: establish the 1280px and 1440px compositions first, then refine tablet and mobile. Implementation must remain responsive and mobile must stay functional throughout.

---

## 15. Company Details

| Field | Value |
|---|---|
| Company | CODEDDEVS TECHNOLOGY LTD |
| RC Number | 9426867 |
| Incorporated | March 2026 |
| Location | Lagos, Nigeria |
| Email | codeddevs.team@gmail.com |
| GitHub | github.com/coded-devs |
| X | @CodedDevs |
| TikTok | @CodedDevs |
| YouTube | @CodedDevs |
| Instagram | @codeddevs_ |
| Founders | Kareem Aliameen, Yusuf Saheed, Amoo Mustakheem |
| Team model | Three founders supported by a growing team of designers, developers, and creators |
| Focus | Software, payment, and AI products for African markets |
| Core belief | The African market deserves technology built for it, not borrowed or adapted |
| Main product | twizrr -> twizrr.com |

---

## 16. Data Flows

### Blog post → public site
```
Admin visits /admin/blog/new
Writes post in TipTap editor
Uploads cover image (crops → Cloudinary → URL saved)
Sets category, show_in_recognition, placement if applicable
Clicks Publish (is_published = true, published_at = now())
         ↓
Post saved to blog_posts table in Neon dev branch (local)
or Neon production branch (live site)
         ↓
Within 1 hour (ISR revalidation):
- Appears in /blog list
- Appears in Latest Releases on home page (if one of 3 most recent)
- Appears in Recognition section (only if show_in_recognition = true)
- Has its own page at /blog/[slug]
```

### Team member → public site
```
Admin visits /admin/team/new
Fills in name, role, bio
Uploads photo (crops to square → Cloudinary → URL saved)
Adds social links, sets order_index
         ↓
Record saved to team_members table
         ↓
Within 1 hour:
- Appears on /team page (full bio, all details)
- Does not create a separate team preview on the home page
```

### Product → public site
```
Admin visits /admin/products/new
Fills in name, slug, tagline, description, status
Uploads cover image, sets is_featured = true for home page
Sets external_url (e.g. twizrr.com)
         ↓
Record saved to products table
         ↓
Within 1 hour:
- Appears on `/products` and gets its own page at `/products/[slug]`
- Appears in the ProductsSection on the home page when is_featured = true
- Product-related public communication also appears through published blog posts
- "Visit" and "Try twizrr" actions link out to the external product website
```



---

## 17. Admin Dashboard Overview

| Section | URL | What it controls |
|---|---|---|
| Dashboard | /admin/dashboard | Overview stats for team members, products, and blog posts |
| Team | /admin/team | Team member profiles on /team |
| Products | /admin/products | Products shown on /products, /products/[slug], and the home ProductsSection |
| Blog | /admin/blog | All posts — /blog, Latest Releases, Recognition |

### Admin UI system

- Use shadcn/ui for standard admin controls: forms, fields, selects, switches, checkboxes, dialogs, alert dialogs, dropdown menus, tabs, tables, pagination, tooltips, toasts, skeletons, and empty states.
- shadcn is an admin implementation system, not the visual design language of the public website.
- Generate shadcn components into `src/components/admin/ui/`; never overwrite the custom public primitives in `src/components/ui/`.
- Configure the shadcn `ui` alias as `@/components/admin/ui` in `components.json`.
- Use the existing CodedDevs semantic colors and font variables when styling admin components. Do not replace the brand tokens in `src/app/globals.css` with shadcn defaults.
- Add components selectively through the shadcn CLI. Do not install every registry component upfront.
- Prefer accessible shadcn primitives over hand-rolled admin dialogs, selects, dropdowns, switches, and confirmation prompts.
- Existing custom admin components may be migrated incrementally. Do not rewrite the entire dashboard in one uncontrolled pass.
- Public components must not import from `@/components/admin/ui`.

### Blog admin — controls three public areas simultaneously
- `/blog` list — all published posts
- Home Latest Releases — automatic, 3 most recent published
- Home Recognition — manual, only posts with show_in_recognition = true

When creating a blog post, admin sets:
- `category` — filter tab on /blog
- `show_in_recognition` — toggle to feature in Recognition section
- `placement` — SVG medal icon (only shown when show_in_recognition is on)

---

## 18. GitHub Workflow

### Branch structure
```
main        → production (deploys to codeddevs.com via Vercel)
dev         → staging (integration branch)
feature/*   → individual features or fixes
```

### Neon database branches
```
Neon production branch → used by Vercel production
Neon dev branch        → used by local .env.local
Neon preview/pr-[n]   → auto-created per PR by GitHub Actions, 
                         auto-deleted when PR closes
```

### How to contribute
```
1. Branch from dev:
   git checkout dev && git pull origin dev
   git checkout -b feature/your-feature-name

2. Build on the feature branch

3. Open PR: feature/* → dev
   - Neon auto-creates a preview DB branch
   - CodeRabbit reviews automatically
   - CI must pass (type check + lint + build)
   - @onerandomdevv reviews and approves

4. Merge to dev → test on staging

5. PR: dev → main → Vercel deploys to production
   Neon preview branch auto-deleted on close
```

### Branch protection
- `main` and `dev` — require PR, CI passing, @onerandomdevv approval, no direct pushes
- Feature branches — push freely

### Commit message format
```
feat:     new feature
fix:      bug fix
perf:     performance improvement
chore:    config, deps, tooling
refactor: restructure, no behaviour change
docs:     documentation only
```

---

## 19. Error Handling Conventions

### Success responses
```ts
return NextResponse.json({ data: record }, { status: 200 })
return NextResponse.json({ data: records }, { status: 200 })
return NextResponse.json({ success: true }, { status: 200 })
return NextResponse.json({ data: record }, { status: 201 })
```

### Error responses
```ts
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
return NextResponse.json({ error: 'Invalid input', details: zodError.flatten() }, { status: 400 })
return NextResponse.json({ error: 'Not found' }, { status: 404 })
return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
```

### Route handler template
```ts
export async function GET() {
  // 1. Auth check — always first
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Business logic
  try {
    const data = await db.select()...
    return NextResponse.json({ data })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

---

## 20. Security

### Stored content rendering

- The TipTap Link extension must carry an explicit protocol allowlist of `['http', 'https', 'mailto']`. Never allow the `javascript:` protocol in stored links.
- Configure this with `isAllowedUri` — **not** `validate`. In TipTap 3.x `validate` is deprecated and only gates autolinking, so it does not block a stored `javascript:` href.
- Apply it in **both** `src/components/admin/editors/RichTextEditor.tsx` and `src/components/blog/PostContent.tsx`. The renderer is the real security boundary; hardening only the editor leaves already-stored content unprotected. Shared config lives in `src/lib/tiptap.ts`.
- Never use `dangerouslySetInnerHTML` to render stored content.

### General

- Never commit secrets — .env.local is gitignored
- seed scripts are gitignored — never commit scripts/seed-admin.ts
- All PRs require review from @onerandomdevv before merging
- Auth, DB schema, deployment changes need explicit human approval
- Never auto-merge agent-generated code
- Rotate keys immediately if credentials are exposed
- Security contact: codeddevs.team@gmail.com

---

## 21. Desktop-Led Responsive Design Rules

### Core principle
**Desktop composition first for the current redesign.** Establish visual hierarchy, width usage, section rhythm, and spatial balance at 1280px and 1440px first. Then adapt the approved system to tablet and mobile without changing its underlying hierarchy.

Tailwind may still use mobile-first utilities technically. The design-review order is desktop first, followed by tablet and mobile refinement. Mobile must remain usable during the desktop pass even when final mobile polish is deferred.

### Breakpoints
```
base  → 0px+     mobile phones (375px target)
sm    → 640px+   large phones / small tablets (use sparingly)
md    → 768px+   tablets
lg    → 1024px+  desktop (most layout changes happen here)
xl    → 1280px+  primary desktop composition target
2xl   → 1536px+  wide desktop; preserve the 1440px maximum composition width
```

### Layout rules per section

**Navbar:**
```
mobile:  hamburger menu, logo left, menu button right
lg:      full nav links visible, logo left, CTA button right, max-w-7xl inner container
```

**Hero section:**
```
mobile:  single column, text stacked, hero visual below text when present
lg:      spacious editorial composition — text left, optional visual/media right, max-w-7xl or up to 1440px
```

Hero visuals are optional and may be a mascot, illustration, real media, product image, interactive visual, or background composition. Kody is not mandatory in the hero.

**Featured Story:**
```
mobile:  single-column editorial story with media above or below the copy
lg:      wide editorial split layout with lead-story copy and cover image
```

**Latest Releases & Recognition:**
```
mobile:  grid-cols-1 (single column)
md:      grid-cols-2
lg:      grid-cols-3 or an asymmetric lead-plus-supporting composition
gap:     gap-6 minimum; use larger desktop gaps when the layout benefits
```


**Team section (home page):**
```
mobile:  grid-cols-1
md:      grid-cols-3
```

**Team page (/team):**
```
mobile:  grid-cols-1
md:      grid-cols-2
lg:      grid-cols-3
```


**Footer:**
```
mobile:  stacked — medium wordmark, two-column navigation groups, then ownership/social details
lg:      navy full-width band; medium wordmark and bottom-aligned ownership/socials on the left, Product, Highlights, Company, and Connect link groups on the right
```

### Typography scaling
```
H1 hero:   text-4xl md:text-5xl lg:text-6xl xl:text-7xl
H1 page:   text-4xl md:text-5xl lg:text-[56px]
H2 section: text-2xl md:text-3xl lg:text-[40px] xl:text-5xl when appropriate
H3:        text-xl md:text-2xl lg:text-[28px]
Body:      text-base (16px) — never scale down on mobile
```

### What hides or shows at different breakpoints
```
Hero visual/media:     optional; stack below text on mobile, place beside text on lg when used
Full nav links:        hidden on mobile, flex on lg
Hamburger menu:        flex on mobile, hidden on lg
Two-column layouts:    stack on mobile, side-by-side on lg
```

### Testing checklist
Before committing any visual design work, test at these widths:
- 1440px — primary large-desktop design target
- 1280px — standard desktop design target
- 1024px — small desktop / iPad landscape
- 768px  — iPad portrait
- 390px  — iPhone 14
- 375px  — smallest supported mobile target

Use browser DevTools responsive mode. Desktop approval comes first in this redesign, but never ship a change that breaks any supported width.

---

*Last updated: August 2026*
