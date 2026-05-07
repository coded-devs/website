# CODEDDEVS Website — AI Assistant Instructions

> Read this file before touching any code. Every decision in this project flows from this document.
> This file is the single source of truth for the entire codebase. If something is not documented here, ask before assuming.

---

## 0. Project Overview

**What this project is:**
codeddevs.com is the official company website for CODEDDEVS TECHNOLOGY LTD — a Nigerian technology startup building AI-first software products for African markets. The site audience is investors, press, and partners.

**How the system works:**
The project is a full-stack Next.js 15 monolith — the frontend (public pages), backend (API routes), and admin dashboard all live in one codebase and deploy together on Vercel.

**The CMS:**
There is a built-in admin dashboard at `/admin` that serves as the company's CMS. Every piece of content on the public site — team members, products, blog posts, job listings — is managed through this dashboard. No code changes are needed to update content. The admin dashboard is protected by authentication and is only accessible to the single admin user.

**The public site:**
The public site at `/` reads all content from a Neon PostgreSQL database via Drizzle ORM. Pages are statically generated at build time and revalidated every hour via ISR. This means the site is fast for visitors but content updates appear within 60 minutes of being published from the admin dashboard.

**The database:**
A single Neon PostgreSQL database stores all content — team members, products, blog posts, careers, applications, and contact submissions. The schema is defined in `src/db/schema.ts` and managed via Drizzle Kit migrations. The database stores only text, JSON, and Cloudinary URLs — no images or binary files.

**External services:**
- **Cloudinary** — stores all content images. Images are uploaded via the admin dashboard, never stored locally.
- **Resend** — sends email notifications when someone submits the contact form or applies for a job.
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
- **Purpose:** Present CODEDDEVS as a serious, product-driven technology company. Communicate what we are building, what's coming next, and how our products are evolving. Share product updates, releases, version changes, roadmaps, and announcements.
- **Tone:** Professional, minimal, text-first — like Anthropic.com or Stripe.com
- **This is NOT a portfolio site.** Do not treat it like a project showcase or personal portfolio. It is an official company website structured the way established tech companies present themselves.
- **This is NOT the twizrr product site.** twizrr.com is a completely separate codebase and repo. Every mention of twizrr on this site links OUT to twizrr.com.

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
| Email | Resend |
| Image cropping | react-image-crop (admin only — never on public pages) |
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
--color-success:      #16A34A;
--color-error:        #DC2626;
```

### Typography

Fonts loaded via `next/font/google` in `src/app/layout.tsx`. Never use a `<link>` tag or CDN.

| Element | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| H1 | JetBrains Mono | 56px | 700 | 1.1 |
| H2 | JetBrains Mono | 40px | 700 | 1.2 |
| H3 | JetBrains Mono | 28px | 600 | 1.3 |
| H4 / Subheading | JetBrains Mono | 20px | 500 | 1.4 |
| Body large | IBM Plex Sans | 18px | 400 | 1.75 |
| Body | IBM Plex Sans | 16px | 400 | 1.7 |
| Small / caption | IBM Plex Sans | 14px | 400 | 1.6 |
| Label / UI tag | IBM Plex Sans | 12px | 500 | — |

### Spacing

- Base unit: 4px (Tailwind default)
- Section vertical padding: `py-24` desktop, `py-16` mobile
- Max content width: `max-w-5xl` (1024px), centered with `mx-auto px-6`

### Component Styles

```
Navbar:             bg-white border-b border-[#C4CAD6], sticky top
Button primary:     bg-[#121F38] text-white hover:bg-[#1A2D4F]
Button secondary:   border border-[#C4CAD6] text-[#121F38] hover:bg-[#F4F5F8]
Cards:              bg-[#F4F5F8] border border-[#C4CAD6] rounded-lg
Inputs:             bg-white border border-[#C4CAD6] text-[#121F38] rounded-md
Active/selected:    bg-[#D1D6E0] text-[#121F38]
Badge / tag:        bg-[#D1D6E0] text-[#121F38]
Footer:             bg-[#F4F5F8] border-t border-[#C4CAD6]
```

### Design Direction

- **Professional, not generic.** Must feel like a real company website — not AI-generated.
- **Minimal and clean.** Strong typography, clear messaging, generous whitespace.
- **Content balance: 70% text, 30% images.**
- **Light theme only.** No dark mode. No `dark:` Tailwind variants.
- **No animations.** Nothing moves. No keyframes, no motion libraries.
- **Minimal hover effects.** Color or opacity changes only.
- **No UI component libraries.** Build everything from scratch with Tailwind.
- **No gradients.** Solid colors only.
- **Use borders sparingly.** Prefer spacing and background contrast.
- **No shadows** except subtle `shadow-sm` on cards where needed.
- **No visual clutter.** Every element must earn its place.
- **No generic AI-style layouts.**

### Logo Usage

Logo files in `public/logos/`:
- **Full logo SVG** (`/public/logos/wordmark.svg`) — Navbar, Footer, formal contexts
- **Icon-only SVG** (`/public/logos/mark.svg`) — small spaces, mobile nav
- **PNG** (`/public/fav-icon/logo.png`) — favicon only
- Never recreate the logo in code. Always use the actual files.
- Navbar logo always links to `/`

### Icons

- **Never install an icon library** (no lucide-react, heroicons package, react-icons, etc.)
- All icons live in the shared file `src/components/ui/icons.tsx`
- Only add icons to icons.tsx that are actually used — never pre-populate with unused icons
- Import only what you need in each component — named imports only
- SVG paths sourced from heroicons.com or lucide.dev — copy raw SVG markup only
- All SVGs: appropriate size per context, stroke="currentColor" or fill="#121F38"
- **Never use emojis as UI icons** — always use inline SVGs from icons.tsx

```tsx
// CORRECT — named import from shared icons file
import { TrophyIcon, ArrowRightIcon } from '@/components/ui/icons'

// WRONG — never install or import from icon libraries
import { Trophy } from 'lucide-react'
import * as Icons from '@/components/ui/icons' // never import everything
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
│   │   │   ├── about/page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx                  # displayed as "Updates"
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── team/page.tsx
│   │   │   ├── careers/page.tsx
│   │   │   └── contact/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── team/ (page, new, [id])
│   │   │   ├── products/ (page, new, [id])
│   │   │   ├── blog/ (page, new, [id])
│   │   │   ├── careers/ (page, new, [id])
│   │   │   ├── applications/page.tsx
│   │   │   └── messages/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── contact/route.ts
│   │   │   ├── careers/apply/route.ts
│   │   │   ├── upload/route.ts
│   │   │   └── admin/
│   │   │       ├── team/ (route, [id])
│   │   │       ├── products/ (route, [id])
│   │   │       ├── blog/ (route, [id])
│   │   │       ├── careers/ (route, [id])
│   │   │       ├── applications/ (route, [id])
│   │   │       └── messages/ (route, [id])
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
│   │   │   ├── AboutTeaser.tsx
│   │   │   └── TeamSection.tsx
│   │   ├── blog/
│   │   │   └── PostContent.tsx
│   │   ├── careers/
│   │   │   └── ApplicationForm.tsx
│   │   ├── contact/
│   │   │   └── ContactForm.tsx
│   │   └── admin/
│   │       ├── RichTextEditor.tsx
│   │       ├── ImageUpload.tsx               # includes react-image-crop
│   │       └── DataTable.tsx
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

### careers
```ts
id, title, type, location, description,
requirements, is_open, created_at, updated_at
```

**type enum:** `'full-time' | 'contract' | 'volunteer'`

### career_applications
```ts
id, career_id (→ careers.id onDelete cascade),
full_name, email, portfolio_url, github_url,
cover_letter, status, created_at
```

**status enum:** `'pending' | 'reviewed' | 'rejected'`

### contact_submissions
```ts
id, full_name, email, subject, message, is_read, created_at
```

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
RESEND_API_KEY=
CONTACT_NOTIFICATION_EMAIL=codeddevs.team@gmail.com
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
| POST | `/api/contact` | Save + email notification |
| POST | `/api/careers/apply` | Save + email notification |

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
| GET/POST | `/api/admin/careers` | List / create |
| GET/PUT/DELETE | `/api/admin/careers/[id]` | Read / update / delete |
| GET | `/api/admin/applications` | List |
| PUT | `/api/admin/applications/[id]` | Update status |
| GET | `/api/admin/messages` | List |
| PUT/DELETE | `/api/admin/messages/[id]` | Mark read / delete |

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

### Home (/)
Six sections in this exact order:

**1. Hero**
- Headline: "Engineering Software That Works for Africa"
- Subtext: "We build AI-first software products for African markets — from first principles, not adaptations."
- CTAs: "See Our Products" → /products | "Get in Touch" → /contact
- Kody mascot (kodyfigma.svg — neutral) featured in hero

**2. Products Section**
- Heading: "What We're Building"
- Fetches products where is_featured = true
- Cards: name, tagline, status badge, external link

**3. Latest Releases**
- Heading: "Latest Releases"
- Fetches 3 most recent published posts (ALL categories)
- Cards: title, excerpt, date, category badge, dynamic CTA

**4. Recognition**
- Heading: "Recognition"
- Fetches blog posts where show_in_recognition = true AND is_published = true
- Ordered by published_at DESC, limit 3
- Cards — text only, no cover image
- Placement display uses inline SVG icons from icons.tsx — never emojis
- If no recognition posts exist, section does not render in production

**5. About Teaser**
- Company mission — 2 paragraphs
- No "Meet the Team" link — TeamSection below handles that

**6. Team Section**
- Heading: "The Team"
- Shows only 3 founders (order_index 0, 1, 2)
- Each card: photo (80x80 rounded-full), name, role — no bio
- "Meet the full team →" link to /team
- TeamSection fetches its own data internally — no props from page.tsx

### Empty states behaviour
Sections behave differently based on environment:
```ts
const isDev = process.env.NODE_ENV === 'development'

// In development: show section with empty state message
// In production: return null (hide section completely)
```

This applies to: ProductsSection, LatestReleasesSection, RecognitionSection, TeamSection.
Empty state style: bg-[#F4F5F8] rounded-lg p-8, text-sm text-[#6B7896], centered.

### About (/about)
- Mission, approach, open-source commitment
- Company facts: RC 9426867 | Lagos, Nigeria | Est. March 2026

### Products (/products)
- Lists all products from DB ordered by order_index
- Each card: name, tagline, status badge
- Links to /products/[slug] (internal) and external_url (external)

### Products — Dedicated Page (/products/[slug])
- Full product page: name, tagline, description, status, cover image
- External link + GitHub link
- Related blog posts

### Blog (/blog) — displayed as "Updates"
- URL stays /blog. All user-facing labels say "Updates"
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
  - **Kareem Aliameen — Founder & CEO**
    Kareem is the Founder and CEO of CodedDevs Technology LTD, leading the company's strategy, product vision and development, and technical direction. A full-stack engineer working primarily in JavaScript and TypeScript, he is highly skilled at leveraging AI for development, research, and productivity. He brings a background spanning graphic design, digital commerce, and entrepreneurship, and is currently studying at Miva University.
  - **Yusuf Ibrahim Ayinla — Co-Founder & CTO**
    Yusuf is the Co-Founder and CTO of CodedDevs Technology LTD, responsible for the technical architecture across the company's products. A full-stack engineer working in JavaScript and TypeScript, he is highly skilled at leveraging AI for development and research, and is known for his curiosity, depth of thinking, and ability to move quickly across technologies.
  - **Amoo Mustakheem Olamilekan — Co-Founder & COO**
    Mustakheem is the Co-Founder and COO of CodedDevs Technology LTD, leading business development, partnerships, and growth strategy. A full-stack engineer with a background in Node.js and Python, he brings strong skills in networking, outreach, and identifying opportunities.

### Careers (/careers)
- Lists open roles
- Empty state: "No open roles right now. Send us a message." → /contact
- Application form: inline below role card, 'use client'

### Contact (/contact)
- Two columns desktop, stacked mobile
- Left: company info, email, social links
- Right: contact form
- Subjects: General Inquiry | Partnership | Press | Investment | Other
- Email: codeddevs.team@gmail.com
- Socials: GitHub, X, TikTok, YouTube, Instagram

---

## 10. Image Strategy

### Static brand assets → `public/` only
- `/public/logos/wordmark.svg` — full logo
- `/public/logos/mark.svg` — icon only
- `/public/mascot/kody-smilefigma.svg` — smiling Kody
- `/public/mascot/kodyfigma.svg` — neutral Kody
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
| `kody-smilefigma.svg` | Smiling | 404 page, empty states, contact page |
| `kodyfigma.svg` | Neutral/confident | Hero section, careers page |

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
- Blog list: never fetch `content` column
- Products list: never fetch `description` on list view

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
7. Resend for all email — never nodemailer or sendgrid
8. next/font/google for fonts — no CDN link tags
9. No UI component libraries on public pages — build from scratch with Tailwind. Exception: `react-image-crop` in `ImageUpload.tsx` admin only
10. cn() for all conditional classNames
11. No animations — nothing moves
12. Light theme only — no dark: variants
13. No gradients — solid colors only
14. TypeScript strict — no any, no @ts-ignore
15. @/ imports only — no relative ../../ imports
16. Product/external links always target="_blank" rel="noopener noreferrer"
17. migrations/ is read-only — only Drizzle Kit writes here
18. Logo files only — never recreate logo in code
19. "Products" not "Projects" — everywhere in UI, routes, and code
20. Blog URL /blog, displayed as "Updates" in all user-facing labels
21. Use borders sparingly — prefer spacing and background contrast
22. Design must feel human, not AI-generated
23. No emojis in UI components — use inline SVG icons from icons.tsx only
24. Never install icon libraries — use shared icons.tsx with raw SVG paths
25. Always await params and searchParams in dynamic route pages (Next.js 15)
26. seed scripts go in scripts/ folder and are gitignored — never commit them
27. Mobile-first responsive design always. Use Tailwind breakpoints in this order: base (mobile) → md (tablet 768px) → lg (desktop 1024px). Never design desktop-first and patch mobile after.

---

## 15. Company Details

| Field | Value |
|---|---|
| Company | CODEDDEVS TECHNOLOGY LTD |
| RC Number | 9426867 |
| Incorporated | 18 March 2026 |
| Location | Lagos, Nigeria |
| Email | codeddevs.team@gmail.com |
| GitHub | github.com/coded-devs |
| X | @CodedDevs |
| TikTok | @CodedDevs |
| YouTube | @CodedDevs |
| Instagram | @codeddevs_ |
| Main product | twizrr → twizrr.com |

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
- Appears in TeamSection on home page (photo + name + role only, limit 3)
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
- Appears on /products list
- Appears on home page Products section (if is_featured = true)
- Has its own page at /products/[slug]
```

### Contact form → admin
```
Visitor submits /contact form
POST /api/contact validates → saves to contact_submissions
Sends email via Resend to CONTACT_NOTIFICATION_EMAIL
Admin reads in /admin/messages, marks as read
```

### Career application → admin
```
Visitor applies on /careers
POST /api/careers/apply validates → verifies role is open
Saves to career_applications → sends email notification
Admin reviews in /admin/applications, updates status
```

---

## 17. Admin Dashboard Overview

| Section | URL | What it controls |
|---|---|---|
| Dashboard | /admin/dashboard | Overview stats, recent messages, recent applications |
| Team | /admin/team | Team member profiles on /team and TeamSection on home |
| Products | /admin/products | Products on /products and home page |
| Blog | /admin/blog | All posts — /blog, Latest Releases, Recognition |
| Careers | /admin/careers | Job listings on /careers |
| Applications | /admin/applications | Career applications |
| Messages | /admin/messages | Contact form submissions |

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

- Never commit secrets — .env.local is gitignored
- seed scripts are gitignored — never commit scripts/seed-admin.ts
- All PRs require review from @onerandomdevv before merging
- Auth, DB schema, deployment changes need explicit human approval
- Never auto-merge agent-generated code
- Rotate keys immediately if credentials are exposed
- Security contact: codeddevs.team@gmail.com

---


## 21. Responsive Design Rules

### Core principle
**Mobile-first always.** Every component is designed for mobile (375px) first, then enhanced for larger screens using Tailwind breakpoints. Never write desktop styles first and try to patch mobile after.

### Breakpoints
```
base  → 0px+     mobile phones (375px target)
sm    → 640px+   large phones / small tablets (use sparingly)
md    → 768px+   tablets
lg    → 1024px+  desktop (most layout changes happen here)
xl    → 1280px+  large desktop (use sparingly)
```

### Layout rules per section

**Navbar:**
```
mobile:  hamburger menu, logo left, menu button right
lg:      full nav links visible, logo left, CTA button right
```

**Hero section:**
```
mobile:  single column, text stacked, Kody mascot hidden
lg:      two columns — text left (flex-1), Kody right (w-80)
```

**Products section:**
```
mobile:  single column, full width cards
lg:      max-w-xl cards, left-aligned — do not stretch to full width
```

**Latest Releases & Recognition:**
```
mobile:  grid-cols-1 (single column)
md:      grid-cols-2
lg:      grid-cols-3
gap:     gap-6 at all breakpoints
```

**About page — two-column sections:**
```
mobile:  stacked — heading above, body below
lg:      flex-row — heading left (w-1/3), body right (flex-1)
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

**Contact page:**
```
mobile:  stacked — info above, form below
lg:      two columns — info left (w-1/3), form right (flex-1)
```

**Footer:**
```
mobile:  stacked — logo+tagline, then nav columns, then bottom bar
lg:      logo+tagline left, nav columns right, bottom bar as row
```

### Typography scaling
```
H1 hero:   text-4xl md:text-5xl lg:text-7xl
H2 section: text-2xl md:text-3xl lg:text-[40px]
H3:        text-xl md:text-2xl
Body:      text-base (16px) — never scale down on mobile
```

### What hides or shows at different breakpoints
```
Kody mascot in Hero:   hidden on mobile, block on lg
Full nav links:        hidden on mobile, flex on lg
Hamburger menu:        flex on mobile, hidden on lg
Two-column layouts:    stack on mobile, side-by-side on lg
```

### Testing checklist
Before committing any visual design work, test at these widths:
- 375px  — iPhone SE (smallest target)
- 390px  — iPhone 14
- 768px  — iPad portrait
- 1024px — iPad landscape / small desktop
- 1280px — standard desktop
- 1440px — large desktop

Use browser DevTools responsive mode. Never ship a change that breaks any of these widths.

---

*Last updated: May 2026*