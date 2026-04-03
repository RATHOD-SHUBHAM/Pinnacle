# Pinnacle

Hospital appointment system: patients browse doctors, book from live availability, check in on arrival, and manage bookings. Staff use an admin panel for schedules and the daily queue.

**Stack:** Next.js 14, Tailwind + component UI, **PostgreSQL via Supabase**, Prisma, NextAuth.

## Environment (Supabase)

1. Create a project in the [Supabase dashboard](https://supabase.com/dashboard) (e.g. Mumbai region).

2. Copy `.env.example` to `.env` and fill in:

   - **`DATABASE_URL`** — **Project Settings → Database → Connection string → URI** (use the password you set for the DB user). Prisma uses this for all reads/writes.
   - **`NEXT_PUBLIC_SUPABASE_URL`** and **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — **Project Settings → API**. Reserved for Supabase client usage; the app currently uses Prisma only, but these are the URL and “anon public” key you asked about.

3. **Auth for Next.js**

   - `NEXTAUTH_SECRET` — e.g. `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `http://localhost:3000` locally; your production URL when deployed

4. Install, push schema, seed, run:

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Optional: `RESEND_API_KEY` + `EMAIL_FROM` for booking emails.

## Deploy

Point `DATABASE_URL` at the same Supabase project (often the **pooler** URI on Vercel). Set `NEXTAUTH_URL` to your live URL.
