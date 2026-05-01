# Setup Guide — Supabase + Vercel

## 1. Create Supabase Project

1. Go to Supabase.
2. Create a new project.
3. Copy these values from Project Settings → API:
   - Project URL
   - Anon public key

## 2. Create Database Tables

1. Open Supabase → SQL Editor.
2. Create a new query.
3. Open `supabase/schema.sql` from this project.
4. Paste the full SQL.
5. Click Run.

This creates:

- profiles
- properties
- bookings
- guests
- cleaning_tasks
- maintenance_issues
- supplies
- expenses
- direct_booking_leads
- owner_reports
- tax_reserve_records
- settings

It also enables Row Level Security so each logged-in host only sees their own data.

## 3. Enable Email Login

Go to Supabase → Authentication → Providers → Email.

Enable:

- Email signup
- Email login

For easier testing, you can temporarily disable email confirmation. For production, email confirmation is recommended.

## 4. Add Site URL

Go to Supabase → Authentication → URL Configuration.

Set Site URL to your Vercel app URL:

```text
https://your-project-name.vercel.app
```

Add the same URL under Redirect URLs if Supabase asks for it.

## 5. Add Environment Variables to Vercel

Go to Vercel → Project → Settings → Environment Variables.

Add:

```text
VITE_SUPABASE_URL = your Supabase Project URL
VITE_SUPABASE_ANON_KEY = your Supabase anon public key
```

Do not add your service role key to Vercel frontend variables.

## 6. Redeploy on Vercel

After adding environment variables:

1. Go to Vercel → Deployments.
2. Click the three dots beside the latest deployment.
3. Click Redeploy.
4. Do not use the old build cache if Vercel gives you that option.

## 7. Test

1. Open the Vercel URL.
2. Create a test account.
3. Log in.
4. Go to Settings.
5. Click Load Sample Data.
6. Check the Dashboard.
7. Log out.
8. Create a second test account.
9. Confirm the second account cannot see the first account’s data.

## Vercel Build Settings

```text
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
Root Directory: blank unless package.json is inside a subfolder
```
