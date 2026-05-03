# CODEDDEVS Website — AI Assistant Instructions

> Read this file before touching any code. Every decision in this project flows from this document.

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
| Framework | Next.js 14, App Router, TypeScript |
| Database | Neon PostgreSQL |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 (credentials, single admin) |
| Blog editor | TipTap (rich text, stores JSON) |
| File storage | Cloudinary |
| Email | Resend |
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
--color-surface:      #F4F5F8;   /* cards, input fields, subtle sections — light silver tint */
--color-surface-2:    #D1D6E0;   /* dividers, section backgrounds, tags — brand silver */
--color-border:       #C4CAD6;   /* all borders — slightly darker than surface-2 */
--color-text-primary: #121F38;   /* headings, nav, important text — brand navy */
--color-text-body:    #2C3A52;   /* body copy — navy lightened ~40% */
--color-text-muted:   #6B7896;   /* captions, labels, secondary — navy desaturated */
--color-accent:       #121F38;   /* primary buttons, links, highlights — brand navy */
--color-accent-hover: #1A2D4F;   /* button/link hover — navy lightened slightly */
--color-success:      #16A34A;
--color-error:        #DC2626;
```

### Typography

Fonts are loaded via `next/font/google` in `src/app/layout.tsx`. Never use a `<link>` tag or CDN for fonts.

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
- Use Tailwind spacing scale — 4, 8, 12, 16, 20, 24, 32, 48, 64, 96

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

These rules define the feel and quality bar for every page and component:

- **Professional, not generic.** The site must feel like a real company website — not an AI-generated template or a developer portfolio.
- **Minimal and clean.** Strong typography, clear messaging, generous whitespace, and a few high-quality visuals carry the design.
- **Content balance: 70% text, 30% images.** Pages are primarily copy-driven. Do not fill space with decorative images.
- **Light theme only.** No dark mode. No dark mode toggle. No `dark:` Tailwind variants.
- **No animations.** No `transition`, no `animate-`, no `motion`, no keyframes — nothing moves.
- **Minimal hover effects.** Only color or opacity changes on hover — no transforms, no scaling, no sliding.
- **No UI libraries.** Do not install shadcn/ui, Radix, MUI, Chakra, or any component library. Build everything from scratch with Tailwind.
- **No gradients.** Solid colors only throughout.
- **Use borders sparingly.** Too many borders create visual clutter. Use spacing and background contrast to separate sections instead.
- **No shadows** except a single subtle `shadow-sm` on cards where separation is genuinely needed.
- **No visual clutter.** Every element on the page must earn its place. If it does not communicate something, remove it.
- **No generic AI-style layouts.** Avoid hero + 3-column feature grid + testimonials + CTA patterns. Think editorially.

### Logo Usage

Logo files are in the `public/` folder. Use the correct variation for each context:

- **Full logo SVG** (`/public/logos/wordmark.svg`) — use in Navbar, Footer, and anywhere the full brand name should appear
- **Icon-only SVG** (`/public/logos/mark.svg`) — use in smaller spaces, favicon, decorative brand elements, mobile nav
- **PNG version** — use as the favicon (`/public/favicon.png` or set in metadata)
- Never recreate the logo in code. Always use the actual files.
- Navbar logo always links back to `/`

---

## 4. Folder Structure

```
codeddevs-website/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── layout.tsx                    # Navbar + Footer
│   │   │   ├── page.tsx                      # / Home
│   │   │   ├── about/page.tsx                # /about
│   │   │   ├── products/
│   │   │   │   ├── page.tsx                  # /products
│   │   │   │   └── [slug]/page.tsx           # /products/[slug]
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx                  # /blog — displayed as "Updates"
│   │   │   │   └── [slug]/page.tsx           # /blog/[slug]
│   │   │   ├── team/page.tsx                 # /team
│   │   │   ├── careers/page.tsx              # /careers
│   │   │   └── contact/page.tsx              # /contact
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── team/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── careers/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── applications/page.tsx
│   │   │   └── messages/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── contact/route.ts
│   │   │   ├── careers/apply/route.ts
│   │   │   ├── upload/route.ts
│   │   │   └── admin/
│   │   │       ├── team/route.ts + [id]/route.ts
│   │   │       ├── products/route.ts + [id]/route.ts
│   │   │       ├── blog/route.ts + [id]/route.ts
│   │   │       ├── careers/route.ts + [id]/route.ts
│   │   │       ├── applications/route.ts + [id]/route.ts
│   │   │       └── messages/route.ts + [id]/route.ts
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
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
│   │   │   └── Textarea.tsx
│   │   ├── sections/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ProductsSection.tsx
│   │   │   ├── LatestReleasesSection.tsx
│   │   │   ├── HackathonStrip.tsx
│   │   │   └── TeamSection.tsx
│   │   └── admin/
│   │       ├── RichTextEditor.tsx
│   │       ├── ImageUpload.tsx
│   │       └── DataTable.tsx
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── migrations/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── email.ts
│   │   ├── cloudinary.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── drizzle.config.ts
├── middleware.ts
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── .env.local
├── .env.example
├── CLAUDE.md
└── package.json
```

---

## 5. Database Schema

All tables live in `src/db/schema.ts`. Use `pgTable` from `drizzle-orm/pg-core`.

### team_members
```ts
id:           uuid, primaryKey, defaultRandom()
name:         text, notNull
role:         text, notNull
bio:          text, notNull
photo_url:    text
linkedin_url: text
github_url:   text
twitter_url:  text
order_index:  integer, notNull, default(0)
is_active:    boolean, notNull, default(true)
created_at:   timestamp, defaultNow(), notNull
updated_at:   timestamp, defaultNow(), notNull
```

### products
```ts
id:           uuid, primaryKey, defaultRandom()
name:         text, notNull
slug:         text, notNull, unique
tagline:      text, notNull
description:  text, notNull
cover_url:    text
external_url: text
github_url:   text
status:       text, notNull — enum: 'development' | 'live' | 'archived'
is_featured:  boolean, notNull, default(false)
order_index:  integer, notNull, default(0)
created_at:   timestamp, defaultNow(), notNull
updated_at:   timestamp, defaultNow(), notNull
```

### blog_posts
```ts
id:           uuid, primaryKey, defaultRandom()
title:        text, notNull
slug:         text, notNull, unique
excerpt:      text, notNull
content:      json, notNull
cover_url:    text
author:       text, notNull, default('CODEDDEVS')
category:     text, notNull — enum: 'Product Update' | 'Announcement' | 'Roadmap' | 'Story'
is_published: boolean, notNull, default(false)
published_at: timestamp
created_at:   timestamp, defaultNow(), notNull
updated_at:   timestamp, defaultNow(), notNull
```

### careers
```ts
id:           uuid, primaryKey, defaultRandom()
title:        text, notNull
type:         text, notNull — enum: 'full-time' | 'contract' | 'volunteer'
location:     text, notNull, default('Lagos, Nigeria / Remote')
description:  text, notNull
requirements: text, notNull
is_open:      boolean, notNull, default(true)
created_at:   timestamp, defaultNow(), notNull
updated_at:   timestamp, defaultNow(), notNull
```

### career_applications
```ts
id:             uuid, primaryKey, defaultRandom()
career_id:      uuid, notNull, references(careers.id) onDelete cascade
full_name:      text, notNull
email:          text, notNull
portfolio_url:  text
github_url:     text
cover_letter:   text, notNull
status:         text, notNull, default('pending') — enum: 'pending' | 'reviewed' | 'rejected'
created_at:     timestamp, defaultNow(), notNull
```

### contact_submissions
```ts
id:         uuid, primaryKey, defaultRandom()
full_name:  text, notNull
email:      text, notNull
subject:    text, notNull
message:    text, notNull
is_read:    boolean, notNull, default(false)
created_at: timestamp, defaultNow(), notNull
```

### admin_users
```ts
id:            uuid, primaryKey, defaultRandom()
email:         text, notNull, unique
password_hash: text, notNull
created_at:    timestamp, defaultNow(), notNull
```

---

## 6. Environment Variables

```bash
DATABASE_URL=
DATABASE_URL_UNPOOLED=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
CONTACT_NOTIFICATION_EMAIL=codeddevs.team@gmail.com
```

---

## 7. API Routes

### Public
| Method | Route | Description |
|---|---|---|
| POST | `/api/contact` | Save contact form + send email |
| POST | `/api/careers/apply` | Save application + send email |

### Admin (all require valid session — return 401 if not)
| Method | Route | Description |
|---|---|---|
| POST | `/api/upload` | Upload image to Cloudinary |
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

---

## 8. Route Protection

```ts
// middleware.ts — uses getToken from next-auth/jwt
// Protects /admin/* and /api/admin/*
// /api/admin/* + no session → 401 JSON
// /admin/* + no session → redirect to /admin/login
// /admin/login + session → redirect to /admin/dashboard
```

---

## 9. Page Content & Structure

### Home (/)
- **Hero headline:** "Engineering Software That Works for Africa"
- **Hero subtext:** "We build AI-first software products for African markets — from first principles, not adaptations."
- **CTAs:** "See Our Products" → /products | "Get in Touch" → /contact
- **Products section:** twizrr card — status "In Development" — links externally to twizrr.com
- **Latest Releases section:** pulls 3 most recently published blog posts automatically. Heading: "Latest Releases". Each card shows title, excerpt, date, category badge, and dynamic CTA:
  - "Product Update" → "Read the update →"
  - "Announcement" → "Read the announcement →"
  - "Roadmap" → "Read the roadmap →"
  - "Story" → "Read the story →"
- **Hackathon achievements strip:** 3 wins as plain text social proof — not cards
- **About teaser:** 2 sentences + "Meet the Team" → /team

### About (/about)
- Mission: building AI-first software products for African markets
- Approach: from first principles — not adapting tools built elsewhere
- Open-source commitment
- Company facts: RC 9426867 | Lagos, Nigeria | Est. March 2026

### Products (/products)
- Lists all products from `products` table
- Each card: name, tagline, status badge, external link
- Each card links to its dedicated page /products/[slug]
- Currently: twizrr only

### Products — Dedicated Page (/products/[slug])
- Full page per product: name, tagline, description, status, cover image
- External link: "Visit [product name] →" opens in new tab
- GitHub link if available
- Related updates pulled from blog_posts

### Blog (/blog) — displayed as "Updates"
- URL stays /blog. Nav label and page heading say "Updates"
- Lists published posts ordered by published_at DESC
- Filterable by category: All | Product Update | Announcement | Roadmap | Story
- Each card: title, excerpt, date, author, category badge, dynamic CTA button
- /blog/[slug] renders full TipTap JSON content

### Team (/team)
- Pulls from team_members table ordered by order_index
- **Kareem Aliameen — Founder & CEO**
  Kareem is the Founder and CEO of CodedDevs Technology LTD, leading the company's strategy, product vision and development, and technical direction. A full-stack engineer working primarily in JavaScript and TypeScript, he is highly skilled at leveraging AI for development, research, and productivity. He brings a background spanning graphic design, digital commerce, and entrepreneurship, and is currently studying at Miva University.
- **Yusuf Ibrahim Ayinla — Co-Founder & CTO**
  Yusuf is the Co-Founder and CTO of CodedDevs Technology LTD, responsible for the technical architecture across the company's products. A full-stack engineer working in JavaScript and TypeScript, he is highly skilled at leveraging AI for development and research, and is known for his curiosity, depth of thinking, and ability to move quickly across technologies.
- **Amoo Mustakheem Olamilekan — Co-Founder & COO**
  Mustakheem is the Co-Founder and COO of CodedDevs Technology LTD, leading business development, partnerships, and growth strategy. A full-stack engineer with a background in Node.js and Python, he brings strong skills in networking, outreach, and identifying opportunities.

### Careers (/careers)
- Lists careers where is_open = true
- Empty state: "No open roles right now. Send us a message." → /contact
- Application form submits to /api/careers/apply

### Contact (/contact)
- Fields: Full Name, Email, Subject (dropdown), Message
- Subjects: General Inquiry | Partnership | Press | Investment | Other
- Submits to /api/contact
- Success state: confirmation replaces form
- Email: codeddevs.team@gmail.com
- Socials: GitHub (coded-devs) | X (@CodedDevs) | TikTok (@CodedDevs) | YouTube (@CodedDevs) | Instagram (@codeddevs_)

---

## 10. Coding Rules

1. **Server components by default.** Only add `'use client'` when interactivity requires it.
2. **Drizzle for all DB queries.** No raw SQL. No Prisma. No DB queries from client components.
3. **Auth check first on every admin route.** Return 401 immediately if no session.
4. **Zod for all input validation.** Every API route that accepts a body must validate with Zod first.
5. **pnpm only.** Never use npm or yarn.
6. **Cloudinary for all images.** Never store images locally or in public/.
7. **Resend for all email.** Never use nodemailer or sendgrid.
8. **next/font/google for fonts.** Never use a `<link>` tag or CDN.
9. **No UI libraries.** Build all components from scratch with Tailwind.
10. **cn() for conditional classes.** Use `cn()` from `src/lib/utils.ts`.
11. **No animations.** No transitions, keyframes, or motion libraries.
12. **Light theme only.** No dark mode, no `dark:` variants.
13. **No gradients.** Solid colors only.
14. **TypeScript strict mode.** No `any`, no `@ts-ignore`.
15. **`@/` imports only.** Never use relative `../../` imports.
16. **Product links are always external.** Use `target="_blank" rel="noopener noreferrer"`.
17. **migrations/ is read-only.** Only Drizzle Kit writes here.
18. **Logo files only.** Use SVG/PNG files from public/. Never recreate the logo in code.
19. **"Products" not "Projects".** Table, routes, admin, API all use `products`.
20. **Blog URL stays `/blog`, displayed as "Updates".** All user-facing labels say "Updates".
21. **Use borders sparingly.** Prefer spacing and background contrast over borders to separate content.
22. **Design must feel human, not AI-generated.** Avoid generic layouts, cookie-cutter sections, and over-engineered components.

---

## 11. Company Details

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

### Hackathon Achievements
Document these as Story posts in the blog — NOT as products or cards.

| Project | Event | Result |
|---|---|---|
| DialAI | Build with AT: Generative AI + APIs Across Africa (Feb 2026) | 1st Place |
| Swifta / twizrr | AT & Google Build with AI Programme Finale — Kenya, Nigeria & South Africa | 1st Place |
| Swiftrade | Build for Hardware Lagos: AT Innovation Hackathon (Feb 2026) | 3rd Place |

---

## 12. Security

- Never commit secrets. `.env.local` is gitignored.
- All PRs require review from @onerandomdevv before merging.
- Any change touching auth, DB schema, or deployment requires explicit human approval.
- Agent-generated code must be reviewed before merge — never auto-merge.
- Rotate keys immediately if credentials are exposed.
- Security contact: codeddevs.team@gmail.com

---

*Last updated: May 2026*