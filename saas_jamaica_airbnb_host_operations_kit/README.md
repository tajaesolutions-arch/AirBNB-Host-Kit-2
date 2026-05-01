# Jamaica Airbnb Host Operations Kit — SaaS Version

A multi-user Jamaica-focused Airbnb and short-term rental operations dashboard.

This version includes:

- Email/password signup and login through Supabase Auth
- Private user accounts
- Supabase cloud database storage
- Row Level Security so users only see their own records
- Properties, bookings, guests, cleaning tasks, maintenance, supplies, expenses, direct leads, owner reports, and Tax/GCT planning
- Optional sample data loader per account
- Vercel-ready React + Vite deployment

## Stack

- React + Vite frontend
- Supabase Auth
- Supabase Postgres database
- Supabase Row Level Security
- Vercel hosting

## Required Vercel Environment Variables

Add these in Vercel → Project → Settings → Environment Variables:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

Only use the public anon key in this frontend app. Do not expose the Supabase service role key.

## Supabase Setup

1. Create a Supabase project.
2. Go to Supabase → SQL Editor.
3. Open `supabase/schema.sql` from this project.
4. Paste the full SQL into Supabase and click Run.
5. Go to Authentication → Providers → Email and make sure Email signup/login is enabled.
6. Go to Authentication → URL Configuration.
7. Set your Site URL to your Vercel URL, for example:

```text
https://your-project-name.vercel.app
```

8. Add your Vercel URL to Redirect URLs if required.

## Local Development

```bash
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Open:

```text
http://localhost:5173
```

## Vercel Deployment Settings

Use:

```text
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

If `package.json` is at the top level of the GitHub repo, leave Root Directory blank.

## Data Isolation

Every user-owned table has a `user_id` column and Row Level Security policies. Users can only select, insert, update, and delete rows where:

```sql
auth.uid() = user_id
```

This prevents one host from seeing another host’s properties, bookings, guest records, expenses, or reports.

## Login Flow

- Logged-out users see the login/signup screen.
- Logged-in users see the dashboard.
- Data loads from Supabase after authentication.
- The Settings page includes a “Load Sample Data” button for testing.

## Production Notes

This version does not include Stripe or paid subscriptions yet. It is ready for private beta, demos, and manual onboarding. Add payments only after confirming the dashboard, database, and user accounts work properly.

## Tax/GCT Disclaimer

The Tax/GCT Reserve Tracker is for planning and organisation only. It is not legal, accounting, or tax advice. Users should confirm actual obligations with a qualified Jamaican accountant or tax professional.
