# HatodJasaan

**Ihatod sa imong pultahan!** — Local food & goods delivery platform for Jasaan, Misamis Oriental.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
```

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Create these **Storage buckets** (all public except `documents`):
   - `avatars` (public) — user profile pictures
   - `documents` (private) — verification documents
   - `businesses` (public) — business logos and covers
   - `menu` (public) — menu item images
4. Copy your project URL and keys into `.env.local`
5. To create the first admin: sign up normally, then in Supabase SQL Editor run:
   ```sql
   UPDATE profiles SET role = 'admin', status = 'approved' WHERE email = 'your@email.com';
   ```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set the same environment variables from `.env.local` in your Vercel project settings.

## Tech Stack

- **Next.js 14** (App Router)
- **Supabase** (Auth, PostgreSQL, Storage, Realtime)
- **Tailwind CSS** + custom design system
- **TypeScript** (strict mode)
- **Zustand** (cart state)
- **Framer Motion** (animations)
- **React Hook Form** + **Zod** (validation)
