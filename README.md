# CODEDDEVS Website

Professional company website for CODEDDEVS TECHNOLOGY LTD — showcasing the team, blog, and the twizrr product.

- **Live:** codeddevs.com (pending)
- **Framework:** Next.js 15, App Router, TypeScript
- **Runtime:** React 19
- **Tech:** Tailwind, Drizzle ORM, Neon PostgreSQL
- **Audience:** Investors, press, and partners

---

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (see [pnpm.io](https://pnpm.io))

### 1. Clone and Install
```bash
git clone <repo-url>
cd website
pnpm install
```

### 2. Set Up Environment
Copy `.env.example` to `.env.local` and fill in values:
```bash
cp .env.example .env.local
```

Get secrets from:
- **DATABASE_URL:** Neon Console → Connection strings (pooled)
- **DATABASE_URL_UNPOOLED:** Neon Console → Connection strings (direct, for migrations)
- **NEXTAUTH_SECRET:** `openssl rand -base64 32`
- **NEXTAUTH_URL:** `http://localhost:3000` (local) or `https://codeddevs.com` (prod)
- **Cloudinary:** From Cloudinary dashboard
- **RESEND_API_KEY:** From Resend dashboard

### 3. Sync Database
```bash
pnpm drizzle-kit push
```

### 4. Start Dev Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Create Admin User
Currently single admin. Create via API route or database insert (bcrypt hashed password).

---

## Project Structure

```
src/
  app/             # Next.js app router
    (public)/      # Public pages (home, about, team, blog, contact, careers)
    admin/         # Protected admin panel
    api/           # API routes (auth, forms, admin CRUD)
  components/      # Reusable React components
  db/              # Drizzle schema and migrations
  lib/             # Utilities (auth, email, cloudinary, etc.)
  types/           # TypeScript types
```

See [SPEC.md](SPEC.md) for the complete architectural spec.

---

## Documentation

- **[SPEC.md](SPEC.md)** — Full technical specification, database schema, page content, folder structure, design system
- **[AGENT.md](AGENT.md)** — AI assistant instructions (design, company details, page requirements)
- **[PROMPTS.md](PROMPTS.md)** — Reusable prompt templates for component and content generation
- **[copilot-instructions.md](copilot-instructions.md)** — Tech stack and 17 coding rules (enforced for all PRs)
- **[SECURITY.md](SECURITY.md)** — Environment variables, secrets handling, permissions, incident response

---

## Development

### Adding a Page
1. Create `src/app/(public)/<page>/page.tsx` or `src/app/admin/<page>/page.tsx`
2. Use server components by default; add `'use client'` only if you need interactivity
3. Follow the design system in [SPEC.md](SPEC.md) section 3

### Adding an API Route
1. Create `src/app/api/<resource>/route.ts`
2. Define a Zod schema for input validation
3. Check auth on `/api/admin/*` routes (return 401 if no session)
4. Use Drizzle for database queries

### Adding a Database Table
1. Add schema in `src/db/schema.ts`
2. Run `pnpm drizzle-kit push` to migrate
3. Never edit `src/db/migrations/` manually

### Handling Images
- All uploads go to Cloudinary via `/api/upload`
- Never store images in `public/`; use `photo_url` fields pointing to Cloudinary

### Sending Email
- Use Resend via `src/lib/email.ts`
- Never use nodemailer or other email libraries

---

## Deployment

Hosted on **Vercel**. Push to main branch to deploy.

Environment variables (set in Vercel dashboard):
- All vars from `.env.example`
- `NEXTAUTH_URL=https://codeddevs.com` (production)

---

## Rules

**All code must follow [copilot-instructions.md](copilot-instructions.md):**
- Server components by default
- Drizzle for DB
- Zod for validation
- pnpm only
- Tailwind, no external UI libs
- No animations, gradients, or dark mode
- TypeScript strict
- `@/` imports only

---

## Support

For questions, see the documentation files above or contact the team at codeddevs.team@gmail.com.

---

Last updated: May 2026
