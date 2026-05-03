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
- **No UI libraries.** Build everything from scratch with Tailwind.
- **No gradients.** Solid colors only.
- **Use borders sparingly.** Prefer spacing and background contrast.
- **No shadows** except subtle `shadow-sm` on cards where needed.
- **No visual clutter.** Every element must earn its place.
- **No generic AI-style layouts.**

### Logo Usage

Logo files in `public/logos/`:
- **Full logo SVG** (`/public/logos/wordmark.svg`) — Navbar, Footer, formal contexts
- **Icon-only SVG** (`/public/logos/mark.svg`) — small spaces, favicon, mobile nav
- **PNG** — favicon only
- Never recreate the logo in code. Always use the actual files.
- Navbar logo always links to `/`

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
│   │   │   └── Textarea.tsx
│   │   ├── sections/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ProductsSection.tsx
│   │   │   ├── LatestReleasesSection.tsx
│   │   │   ├── RecognitionSection.tsx
│   │   │   └── TeamSection.tsx
│   │   ├── blog/
│   │   │   └── PostContent.tsx               # TipTap read-only renderer
│   │   ├── careers/
│   │   │   └── ApplicationForm.tsx
│   │   └── contact/
│   │       └── ContactForm.tsx
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
show_in_recognition, published_at, created_at, updated_at
```

**category enum:** `'Product Update' | 'Announcement' | 'Roadmap' | 'Story'`
**show_in_recognition:** `boolean, notNull, default(false)` — controls whether post appears in the Recognition section on the home page. Admin toggles this manually per post.

### careers
```ts
id, title, type, location, description,
requirements, is_open, created_at, updated_at
```

### career_applications
```ts
id, career_id (→ careers.id), full_name, email,
portfolio_url, github_url, cover_letter, status, created_at
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
| POST | `/api/contact` | Save + email notification |
| POST | `/api/careers/apply` | Save + email notification |

### Admin (401 if no session)
| Method | Route | Description |
|---|---|---|
| POST | `/api/upload` | Upload to Cloudinary |
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
// /api/admin/* + no session → 401 JSON
// /admin/* + no session → redirect to /admin/login
// /admin/login + session → redirect to /admin/dashboard
```

---

## 9. Page Content & Structure

### Home (/)
Five sections in order:

**1. Hero**
- Headline: "Engineering Software That Works for Africa"
- Subtext: "We build AI-first software products for African markets — from first principles, not adaptations."
- CTAs: "See Our Products" → /products | "Get in Touch" → /contact

**2. Products Section**
- Heading: "What We're Building"
- Fetches products where is_featured = true
- Cards: name, tagline, status badge, external link

**3. Latest Releases**
- Heading: "Latest Releases"
- Fetches 3 most recent published posts (ALL categories)
- Cards: title, excerpt, date, category badge, dynamic CTA:
  - "Product Update" → "Read the update →"
  - "Announcement" → "Read the announcement →"
  - "Roadmap" → "Read the roadmap →"
  - "Story" → "Read the story →"

**4. Recognition**
- Heading: "Recognition"
- Fetches blog posts where `show_in_recognition = true` AND `is_published = true`
- Ordered by published_at DESC, limit 3
- Cards (Option B style — no images):
  - Placement badge: 🥇 1st Place / 🥉 3rd Place
  - Blog post title
  - Excerpt (short)
  - Date
  - "Read the story →" → links to /blog/[slug]
- This is curated — admin manually toggles show_in_recognition on specific posts
- If no recognition posts exist, section does not render

**5. About Teaser**
- 2 sentences about the company
- "Meet the Team →" → /team

### About (/about)
- Mission, approach, open-source commitment
- Company facts: RC 9426867 | Lagos, Nigeria | Est. March 2026

### Products (/products)
- Lists all products from DB
- Each card: name, tagline, status badge
- Links to /products/[slug] (internal) and external_url (external)

### Products — Dedicated Page (/products/[slug])
- Full product page: name, tagline, description, status, cover image
- External link + GitHub link
- Related blog posts

### Blog (/blog) — displayed as "Updates"
- URL stays /blog. All labels say "Updates"
- Lists published posts ordered by published_at DESC
- Filterable by: All | Product Update | Announcement | Roadmap | Story
- Each card: category badge, title, excerpt, author, date, dynamic CTA

### Blog Post (/blog/[slug])
Editorial layout:
```
[Cover image — full width, 1200x630px]
CATEGORY BADGE
Title (JetBrains Mono, H1)
By [author] · [date] · [X min read]
─────────────────────────────────
[TipTap rendered content — IBM Plex Sans body]
```
- Reading time calculated from word count
- Cover image rendered at full width
- Content rendered via PostContent.tsx (TipTap read-only)

### Team (/team)
- Fetches team_members where is_active = true, ordered by order_index
- Each card: photo (800x800px from Cloudinary), name, role, bio, social links
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
- Application form: inline below role card

### Contact (/contact)
- Two columns: contact info left, form right
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
- `/public/fav-icon/logo.png` — favicon files
- Nothing else in public/

### Content images → Cloudinary always
- Team photos: upload to `codeddevs-website/team/` — 800x800px
- Product covers: upload to `codeddevs-website/products/` — 1200x630px
- Blog covers: upload to `codeddevs-website/blogs/` — 1200x630px
- Inline article images: 1200x800px

### Cloudinary URL transformations
The `getOptimisedUrl()` helper in `src/lib/cloudinary.ts` appends
transformations automatically. Never use raw Cloudinary URLs directly.

```ts
// Context-specific transformations:
Blog cover banner:      f_auto,q_auto,w_1200,h_630,c_fill
Recognition card:       f_auto,q_auto,w_600,h_315,c_fill
Blog list thumbnail:    f_auto,q_auto,w_800,h_420,c_fill
Team photo:             f_auto,q_auto,w_400,h_400,c_fill,g_face
Product cover:          f_auto,q_auto,w_1200,h_630,c_fill
```

`g_face` on team photos tells Cloudinary to focus the crop on the face.

### Image component rules
- Always use Next.js `<Image>` for Cloudinary images
- SVGs from public/ can use `<Image>` or `<img>` — both fine
- Never use raw `<img>` for content images
- Always set meaningful `alt` text

---

## 11. Mascot Usage (Kody)

Two SVG variations in `public/mascot/`:

| File | Variant | Use where |
|---|---|---|
| `kody-smilefigma.svg` | Smiling | 404 page, empty states, contact page |
| `kodyfigma.svg` | Neutral/confident | Hero section, careers page |

Rules:
- Never smaller than 120px
- Always on white or light surface background
- Use sparingly and purposefully — not as filler
- Never recreate in code — always use the SVG files

---

## 12. Performance

### ISR — add to all public pages
```ts
export const revalidate = 3600 // 1 hour
```

### Parallel DB queries — always use Promise.all()
```ts
const [products, posts] = await Promise.all([
  db.select()...,
  db.select()...
])
```

### Selective columns on list pages
- Blog list: never fetch `content` column (large JSON)
- Products list: never fetch `description` on list view
- Fetch full columns only on detail/single pages

### robots.ts and sitemap.ts
- Block: /admin, /api
- Expose all public routes + dynamic product/blog slugs

---

## 13. Coding Rules

1. Server components by default — `'use client'` only when needed
2. Drizzle for all DB queries — no raw SQL
3. Auth check first on every admin route — 401 if no session
4. Zod validation on every API route that accepts a body
5. pnpm only — never npm or yarn
6. Cloudinary for all content images
7. Resend for all email
8. next/font/google for fonts — no CDN link tags
9. No UI libraries — build from scratch with Tailwind
10. cn() for all conditional classNames
11. No animations — nothing moves
12. Light theme only — no dark: variants
13. No gradients
14. TypeScript strict — no any, no @ts-ignore
15. @/ imports only — no relative ../../ imports
16. Product/external links always target="_blank" rel="noopener noreferrer"
17. migrations/ is read-only — only Drizzle Kit writes here
18. Logo files only — never recreate in code
19. "Products" not "Projects" — everywhere
20. Blog URL /blog, displayed as "Updates" everywhere
21. Use borders sparingly — prefer spacing and background contrast
22. Design must feel human, not AI-generated

---

## 14. Company Details

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

## 15. Security

- Never commit secrets — .env.local is gitignored
- All PRs require review from @onerandomdevv
- Auth, DB schema, deployment changes need explicit approval
- Never auto-merge agent-generated code
- Rotate keys immediately if exposed
- Security contact: codeddevs.team@gmail.com

---

*Last updated: May 2026*