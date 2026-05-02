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

### Style Rules

- **Light theme only.** No dark mode. No dark mode toggle. No `dark:` Tailwind variants.
- **No animations.** No `transition`, no `animate-`, no `motion`, no keyframes — nothing moves.
- **Minimal hover effects.** Only color or opacity changes on hover — no transforms, no scaling, no sliding.
- **No UI libraries.** Do not install shadcn/ui, Radix, MUI, Chakra, or any component library. Build everything from scratch with Tailwind.
- **Text-first.** Pages are mostly copy with few images. Don't add stock photos or decorative images.
- **No gradients.** Solid colors only throughout.
- **No shadows** except a single subtle `shadow-sm` on cards where separation is needed.
- **Borders over shadows** for defining UI elements.
- Logo in navbar: use `/public/full-logo.png` — always link back to `/`

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
│   │   │   │   ├── page.tsx                  # /products (all products list)
│   │   │   │   └── [slug]/page.tsx           # /products/[slug] (dedicated product page)
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx                  # /blog (updates list, displayed as "Updates")
│   │   │   │   └── [slug]/page.tsx           # /blog/[slug]
│   │   │   ├── team/page.tsx                 # /team
│   │   │   ├── careers/page.tsx              # /careers
│   │   │   └── contact/page.tsx              # /contact
│   │   ├── admin/
│   │   │   ├── layout.tsx                    # Admin sidebar layout
│   │   │   ├── login/page.tsx                # /admin/login
│   │   │   ├── dashboard/page.tsx            # /admin/dashboard
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
│   │   │       ├── team/
│   │   │       │   ├── route.ts              # GET, POST
│   │   │       │   └── [id]/route.ts         # GET, PUT, DELETE
│   │   │       ├── products/
│   │   │       │   ├── route.ts
│   │   │       │   └── [id]/route.ts
│   │   │       ├── blog/
│   │   │       │   ├── route.ts
│   │   │       │   └── [id]/route.ts
│   │   │       ├── careers/
│   │   │       │   ├── route.ts
│   │   │       │   └── [id]/route.ts
│   │   │       ├── applications/
│   │   │       │   ├── route.ts
│   │   │       │   └── [id]/route.ts
│   │   │       └── messages/
│   │   │           ├── route.ts
│   │   │           └── [id]/route.ts
│   │   ├── layout.tsx                        # Root layout (fonts, metadata)
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
│   │   │   ├── LatestReleasesSection.tsx     # Home page — pulls 3 latest blog posts
│   │   │   └── TeamSection.tsx
│   │   └── admin/
│   │       ├── RichTextEditor.tsx            # TipTap wrapper
│   │       ├── ImageUpload.tsx               # Cloudinary uploader
│   │       └── DataTable.tsx
│   ├── db/
│   │   ├── index.ts                          # Drizzle client (Neon)
│   │   ├── schema.ts                         # All table definitions
│   │   └── migrations/                       # Drizzle-generated — never edit manually
│   ├── lib/
│   │   ├── auth.ts                           # NextAuth v5 config
│   │   ├── email.ts                          # Resend helpers
│   │   ├── cloudinary.ts                     # Cloudinary config
│   │   └── utils.ts                          # cn() and slugify helpers
│   └── types/
│       └── index.ts                          # Shared TypeScript types
├── drizzle.config.ts
├── middleware.ts                             # Route protection
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                                # Never commit this
├── .env.example                              # Commit this (values empty)
├── CLAUDE.md                                 # This file
└── package.json
```

---

## 5. Database Schema

All tables live in `src/db/schema.ts`. Use `pgTable` from `drizzle-orm/pg-core`.

### team_members
```ts
id:           uuid, primaryKey, defaultRandom()
name:         text, notNull
role:         text, notNull          // e.g. "Founder & CEO"
bio:          text, notNull
photo_url:    text                   // Cloudinary URL
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
description:  text, notNull          // full product description
cover_url:    text                   // Cloudinary URL
external_url: text                   // e.g. twizrr.com — always opens externally
github_url:   text
status:       text, notNull          // 'development' | 'live' | 'archived'
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
content:      json, notNull          // TipTap JSON
cover_url:    text                   // Cloudinary URL
author:       text, notNull, default('CODEDDEVS')
category:     text, notNull          // 'Product Update' | 'Announcement' | 'Roadmap' | 'Story'
is_published: boolean, notNull, default(false)
published_at: timestamp
created_at:   timestamp, defaultNow(), notNull
updated_at:   timestamp, defaultNow(), notNull
```

### careers
```ts
id:           uuid, primaryKey, defaultRandom()
title:        text, notNull
type:         text, notNull          // 'full-time' | 'contract' | 'volunteer'
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
status:         text, notNull, default('pending')  // 'pending' | 'reviewed' | 'rejected'
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
password_hash: text, notNull        // bcrypt hash
created_at:    timestamp, defaultNow(), notNull
```

---

## 6. Environment Variables

```bash
# Database
DATABASE_URL=                        # Neon pooled connection string
DATABASE_URL_UNPOOLED=               # Neon direct connection (migrations only)

# Auth
NEXTAUTH_SECRET=                     # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000   # https://codeddevs.com in production

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend
RESEND_API_KEY=
CONTACT_NOTIFICATION_EMAIL=codeddevs.team@gmail.com
```

Use `DATABASE_URL` for all app queries.
Use `DATABASE_URL_UNPOOLED` only in `drizzle.config.ts` for migrations.

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
| GET/POST | `/api/admin/team` | List / create team members |
| GET/PUT/DELETE | `/api/admin/team/[id]` | Read / update / delete |
| GET/POST | `/api/admin/products` | List / create products |
| GET/PUT/DELETE | `/api/admin/products/[id]` | Read / update / delete |
| GET/POST | `/api/admin/blog` | List / create posts |
| GET/PUT/DELETE | `/api/admin/blog/[id]` | Read / update / delete |
| GET/POST | `/api/admin/careers` | List / create listings |
| GET/PUT/DELETE | `/api/admin/careers/[id]` | Read / update / delete |
| GET | `/api/admin/applications` | List applications |
| PUT | `/api/admin/applications/[id]` | Update status |
| GET | `/api/admin/messages` | List contact submissions |
| PUT/DELETE | `/api/admin/messages/[id]` | Mark read / delete |

---

## 8. Route Protection

`middleware.ts` at root:

```ts
export { auth as middleware } from '@/lib/auth'
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}
```

- `/admin/*` → redirect to `/admin/login` if no session
- `/admin/login` → redirect to `/admin/dashboard` if already logged in
- `/api/admin/*` → return `{ error: 'Unauthorized' }` with status 401 if no session
- All public routes are never protected

---

## 9. Page Content & Structure

### Home (/)
- **Hero headline:** "Engineering Software That Works for Africa"
- **Hero subtext:** "We build AI-first software products for African markets — from first principles, not adaptations."
- **CTAs:** "See Our Products" → /products | "Get in Touch" → /contact
- **Products section:** twizrr card only — status "In Development" — links externally to twizrr.com
- **Latest Releases section:** pulls the 3 most recently published blog posts automatically. Section heading: "Latest Releases". Each card shows: title, excerpt, date, category badge, and a dynamic CTA button based on category:
  - "Product Update" → "Read the update →"
  - "Announcement" → "Read the announcement →"
  - "Roadmap" → "Read the roadmap →"
  - "Story" → "Read the story →"
- **Hackathon achievements strip:** 3 wins shown as plain text social proof — not cards, not a showcase
- **About teaser:** 2 sentences + "Meet the Team" → /team

### About (/about)
- Mission: building AI-first software for African markets
- Approach: from first principles — not adapting tools built elsewhere
- Open-source commitment
- Company facts: RC 9426867 | Lagos, Nigeria | Est. March 2026
- This page explains WHO we are and WHY we exist — not what we have built

### Products (/products)
- Renamed from "Projects" — this is NOT a project showcase
- Pulls from `products` table
- Each product gets a card: name, tagline, status badge, external link
- Currently: twizrr only (status: In Development)
- Each product links to its own dedicated page at /products/[slug]
- Hackathon achievements are NOT listed here — they belong in the blog as Story posts

### Products — Dedicated Page (/products/[slug])
- Full dedicated page per product
- Shows: name, tagline, full description, status, cover image
- External link button: "Visit [product name] →" opens externally
- GitHub link if available
- Related blog posts: pulls blog_posts where category = 'Product Update' filtered by product mention (or manually tagged — TBD)

### Blog (/blog)
- Displayed in the nav and on the page as **"Updates"** — the URL stays `/blog`
- This is the company's communication engine — product updates, releases, roadmaps, announcements, stories
- Lists `blog_posts` where `is_published = true`, ordered by `published_at DESC`
- Shows: title, excerpt, date, author, category badge
- Filterable by category: All | Product Update | Announcement | Roadmap | Story
- `/blog/[slug]` renders the full TipTap JSON content
- Hackathon achievements are documented here as **Story** category posts

### Team (/team)
- Pulls from `team_members` table ordered by `order_index`
- Each entry: photo, name, role, bio, social links
- Founders: Kareem Aliameen (CEO), Yusuf Ibrahim Ayinla (CTO), Amoo Mustakheem Olamilekan (COO)

### Careers (/careers)
- Lists `careers` where `is_open = true`
- Empty state: "No open roles right now. Send us a message." → /contact
- Application form submits to `/api/careers/apply`

### Contact (/contact)
- Fields: Full Name, Email, Subject (dropdown), Message
- Subject options: General Inquiry | Partnership | Press | Investment | Other
- Submits to `/api/contact`
- Success state: confirmation message replaces form
- Company email: codeddevs.team@gmail.com
- Socials: GitHub (coded-devs) | X (@CodedDevs) | TikTok (@CodedDevs) | YouTube (@CodedDevs) | Instagram (@codeddevs_)

---

## 10. Coding Rules

Follow every rule below on every task. No exceptions.

1. **Server components by default.** Only add `'use client'` when the component needs interactivity (forms, editors, event handlers, useState/useEffect).

2. **Drizzle for all DB queries.** Never write raw SQL strings. Never use Prisma. Never query the DB from client components — only from server components or API routes.

3. **Auth check on every admin route.** Every `/api/admin/*` route handler must verify session as the very first thing it does. If no session, return `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`.

4. **Zod for all input validation.** Every API route that accepts a request body must define a Zod schema and parse the input before touching the database.

5. **pnpm only.** Run `pnpm add`, `pnpm dev`, `pnpm build`. Never type `npm install` or `yarn add`.

6. **Cloudinary for all images.** Never store images locally. Never use the public/ folder for uploaded images. All image uploads go to Cloudinary via `/api/upload`.

7. **Resend for all email.** Never use nodemailer, sendgrid, or any other email library.

8. **next/font/google for fonts.** Never add a `<link>` tag for Google Fonts. Never use a CDN URL for fonts. Fonts are loaded in `src/app/layout.tsx` only.

9. **No UI libraries.** No shadcn/ui, Radix UI, MUI, Chakra UI, Headless UI, or any component library. All UI is hand-built with Tailwind CSS.

10. **cn() for conditional classes.** Use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for all conditional className logic.

11. **No animations.** Do not add `transition-*`, `animate-*`, `motion`, framer-motion, or any CSS keyframes. The only hover effect allowed is a color or opacity change.

12. **Light theme only.** Never add `dark:` Tailwind variants. Never add a theme toggle. The site is white/light throughout.

13. **No gradients anywhere.** Solid colors only.

14. **TypeScript strict mode.** No `any` types. No `// @ts-ignore`. Fix types properly.

15. **Import alias.** Always use `@/` imports. Never use relative `../../` imports.

16. **Product/twizrr links are always external.** Every link to any product site uses `target="_blank" rel="noopener noreferrer"`.

17. **migrations/ is read-only.** Never manually edit files in `src/db/migrations/`. Only Drizzle Kit writes to that folder.

18. **Logo usage.** The logo file is `/public/full-logo.png`. Always display it in the Navbar linked to `/`. Never recreate the logo in code.

19. **"Projects" is now "Products".** The table is named `products`, the route is `/products`, the admin section is `/admin/products`, the API is `/api/admin/products`. Never use the word "projects" anywhere in the UI, routes, or code.

20. **Blog is displayed as "Updates".** The URL and internal references stay as `/blog`. But every user-facing label — nav link, page heading, section titles — uses "Updates" not "Blog".

---

## 11. Company Details (Reference)

| Field | Value |
|---|---|
| Company name | CODEDDEVS TECHNOLOGY LTD |
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

### Founders
| Name | Role |
|---|---|
| Kareem Aliameen | Founder & CEO |
| Yusuf Ibrahim Ayinla | Co-Founder & CTO |
| Amoo Mustakheem Olamilekan | Co-Founder & COO |

### Hackathon Achievements
These are NOT products. Document them as Story posts in the blog.

| Project | Event | Result |
|---|---|---|
| DialAI | Build with AT: Generative AI + APIs Across Africa (Feb 2026) | 1st Place |
| Swifta / twizrr | AT & Google Build with AI Programme Finale — Kenya, Nigeria & South Africa | 1st Place |
| Swiftrade | Build for Hardware Lagos: AT Innovation Hackathon (Feb 2026) | 3rd Place |

---

## 12. Security

### Secrets & Credentials
- Never check secrets into the repo or include them in prompts
- Use environment variables for all sensitive values
- `.env.local` is in `.gitignore` and must never be committed
- Use `.env.example` for placeholder keys only

### Permissions & Review
- All PRs must be reviewed by @onerandomdevv before merging
- Any change touching infra, deployment, or secret handling requires explicit human approval
- Agent-generated code must be reviewed before merge — never auto-merge

### Data Privacy
- Do not send user PII to external APIs unless absolutely necessary
- If required, anonymise before sending
- TipTap content in DB is treated as site data — handle uploads and attachments carefully

### Incident Response
- If credentials are exposed, rotate the keys immediately
- Keep an audit trail of the incident and actions taken
- Security contact: codeddevs.team@gmail.com

---

*Last updated: May 2026*