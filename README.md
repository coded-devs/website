# CODEDDEVS Website

Official company website and internal CMS for **CODEDDEVS TECHNOLOGY LTD**.

- **Live URL:** https://codeddevs.com
- **Company:** CODEDDEVS TECHNOLOGY LTD
- **RC Number:** 9426867
- **Location:** Lagos, Nigeria
- **Email:** codeddevs.team@gmail.com
- **Framework:** Next.js 15, App Router, TypeScript
- **Runtime:** React 19
- **Tech:** Tailwind, Drizzle ORM, Neon PostgreSQL
- **Audience:** Investors, press, partners, collaborators, and people who want to understand what CodedDevs is building

This site presents CODEDDEVS as a product-driven Nigerian technology company building software, payment, and AI products for African markets. The public site is intentionally lean: home, blog, blog posts, and team. The admin dashboard manages team members, products, blog posts, and uploaded media.

## Tech Stack

- **Framework:** Next.js 15, App Router, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Neon PostgreSQL
- **ORM:** Drizzle ORM
- **Auth:** NextAuth.js v5 credentials auth
- **Editor:** TipTap rich text editor
- **Images:** Cloudinary
- **Image cropping:** react-image-crop, admin only
- **Icons:** lucide-react
- **Fonts:** JetBrains Mono and IBM Plex Sans via `next/font/google`
- **Package manager:** pnpm only

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Neon PostgreSQL database
- Cloudinary account

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
```

Use:

- `DATABASE_URL` for app queries.
- `DATABASE_URL_UNPOOLED` for Drizzle migrations.
- `NEXTAUTH_SECRET` from a secure random value.

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
- `/blog` - Blog list
- `/blog/[slug]` - Editorial blog post page
- `/team` - Team page

The public website is intentionally focused around the home page, company stories, and the team. Products are introduced through company blog updates and link to their external product websites. Twizrr is available at [twizrr.com](https://twizrr.com).

## Admin Dashboard

Protected routes live under `/admin`.

- `/admin/login`
- `/admin/dashboard`
- `/admin/team`
- `/admin/products`
- `/admin/blog`

Admin API routes live under `/api/admin/*` and require an authenticated admin session.

## Core Features

- Product CMS for internal product records and external product links.
- Blog CMS backed by TipTap JSON content.
- Recognition metadata controlled by `show_in_recognition` and `placement` fields on blog posts.
- Team member CMS.
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
- Use lucide-react as the only icon library.
- Do not use dark mode.
- Do not use "Projects"; the correct term is "Products".
- The `/blog` route must be labeled as "Blog" in user-facing UI.
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
