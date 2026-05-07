# CODEDDEVS Website

Official company website and internal CMS for **CODEDDEVS TECHNOLOGY LTD**.

- **Live:** codeddevs.com (pending)
- **Framework:** Next.js 15, App Router, TypeScript
- **Runtime:** React 19
- **Tech:** Tailwind, Drizzle ORM, Neon PostgreSQL
- **Audience:** Investors, press, and partners
- This site presents CODEDDEVS as a product-driven technology company building AI-first software for African markets. The public site is aimed at investors, press, and partners. The admin dashboard is used to manage products, updates, team members, careers, messages, applications, and uploaded media.

- **Live URL:** https://codeddevs.com
- **Company:** CODEDDEVS TECHNOLOGY LTD
- **RC Number:** 9426867
- **Location:** Lagos, Nigeria
- **Contact:** codeddevs.team@gmail.com

## Tech Stack

- **Framework:** Next.js 14, App Router, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Neon PostgreSQL
- **ORM:** Drizzle ORM
- **Auth:** NextAuth.js v5 credentials auth
- **Editor:** TipTap rich text editor
- **Images:** Cloudinary
- **Image cropping:** react-image-crop, admin only
- **Email:** Resend
- **Fonts:** JetBrains Mono and IBM Plex Sans via `next/font/google`
- **Package manager:** pnpm only

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Neon PostgreSQL database
- Cloudinary account
- Resend account

### Install

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

```bash
cp .env.example .env.local
```

Required variables:

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
CONTACT_NOTIFICATION_EMAIL=
```

Use:

- `DATABASE_URL` for app queries.
- `DATABASE_URL_UNPOOLED` for Drizzle migrations.
- `NEXTAUTH_SECRET` from a secure random value.
- `CONTACT_NOTIFICATION_EMAIL` for contact and application notifications.

### Database

Push the Drizzle schema to Neon:

```bash
pnpm drizzle-kit push
```

Generate migrations when the schema changes:

```bash
pnpm drizzle-kit generate
```

Do not edit generated files in `src/db/migrations/` manually.

### Seed Admin User

Create the first admin user:

```bash
npx tsx scripts/seed-admin.ts
```

Run this once only, then remove any temporary credentials or rotate them as needed.

### Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm tsc --noEmit
```

## Public Pages

- `/` - Home
- `/about` - Company mission and approach
- `/products` - Product list
- `/products/[slug]` - Individual product page
- `/blog` - User-facing label is "Updates"
- `/blog/[slug]` - Editorial update page
- `/team` - Team page
- `/careers` - Careers page with application form
- `/contact` - Contact page and form

## Admin Dashboard

Protected routes live under `/admin`.

- `/admin/login`
- `/admin/dashboard`
- `/admin/team`
- `/admin/products`
- `/admin/blog`
- `/admin/careers`
- `/admin/applications`
- `/admin/messages`

Admin API routes live under `/api/admin/*` and require an authenticated admin session.

## Core Features

- Product CMS with featured products for the home page.
- Updates CMS backed by TipTap JSON content.
- Recognition section controlled by `show_in_recognition` and `placement` fields on blog posts.
- Team member CMS.
- Careers CMS with public application form.
- Contact form with Resend notification.
- Career application notification emails.
- Cloudinary uploads with route-based folders:
  - `codeddevs-website/team`
  - `codeddevs-website/products`
  - `codeddevs-website/blogs`
  - `codeddevs-website/blogs/inline`
- Admin image cropping before upload:
  - Team photos: 1:1 square crop
  - Product covers: 1200:630 landscape crop
  - Blog covers: 1200:630 landscape crop
  - Inline blog images: free crop

## Project Structure

```txt
src/
  app/
    (public)/
    admin/
    api/
    globals.css
    layout.tsx
    not-found.tsx
    robots.ts
    sitemap.ts
  components/
    admin/
    blog/
    careers/
    contact/
    layout/
    sections/
    ui/
  db/
    index.ts
    queries.ts
    schema.ts
    migrations/
  lib/
    auth.ts
    cloudinary.ts
    email.ts
    utils.ts
  types/
    index.ts
```

## Development Rules

Read `AGENTS.md` before making changes.

Important rules:

- Use pnpm only.
- Use server components by default.
- Use Drizzle ORM for database queries.
- Use Zod validation on API routes that accept input.
- Check authentication first on every admin API route.
- Use Cloudinary for content images.
- Use shared inline SVG icons from `src/components/ui/icons.tsx`.
- Do not install icon libraries.
- Do not use dark mode, gradients, or animations.
- Do not use "Projects"; the correct term is "Products".
- The `/blog` route must be labeled as "Updates" in user-facing UI.
- Never commit secrets. `.env.local` must stay untracked.

## CI

GitHub Actions runs:

- `pnpm install --frozen-lockfile`
- `pnpm tsc --noEmit`
- `pnpm eslint src/ --ext .ts,.tsx --max-warnings 0`
- `pnpm build`

## Deployment

The project is intended for Vercel.

Set all variables from `.env.example` in the Vercel dashboard. In production:

```bash
NEXTAUTH_URL=https://codeddevs.com
```

## Security

- Never commit `.env.local`.
- Rotate any exposed credentials immediately.
- Admin routes are protected by middleware and API session checks.
- All PRs require review before merging.

## Maintainers

CODEDDEVS TECHNOLOGY LTD  
codeddevs.team@gmail.com
