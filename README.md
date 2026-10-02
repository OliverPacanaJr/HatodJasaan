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
2. In the **SQL Editor**, run these two files, in order:
   1. `supabase/migrations/001_initial_schema.sql` (tables and rules)
   2. `supabase/migrations/002_fix_signup_storage_security.sql` (fixes sign-up, creates the storage buckets, blocks self-promotion to admin)
3. **Authentication → Sign In / Providers → Email → turn OFF "Confirm email".**
   Registration uploads documents right after sign-up, which needs a signed-in session. With confirmation on, sign-up returns no session and the upload fails.
   (Supabase's built-in email sender also only delivers to your own team's addresses, so confirmation emails would not reach real customers anyway.
   Set up custom SMTP before turning confirmation back on.)
   The registration pages check this themselves: if it is still ON they show a red warning box and refuse to create accounts.
4. Copy your project URL and keys (Project Settings → API) into `.env.local` and into Vercel → Settings → Environment Variables.

### Create the first admin

Login uses **email + password** (there is no separate username).

1. Supabase dashboard → **Authentication → Users → Add user → Create new user**.
   Enter your email and a strong password, tick **Auto Confirm User**, click **Create user**.
2. **SQL Editor** → run (use the same email):
   ```sql
   UPDATE public.profiles
   SET role = 'admin', status = 'approved', full_name = 'Site Admin'
   WHERE email = 'your@email.com';
   ```
3. Open your site → `/auth/login` → sign in. You land on `/dashboard/admin`.

Admins are only ever created this way. Registering through the website can only create customer, business or rider accounts.

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
