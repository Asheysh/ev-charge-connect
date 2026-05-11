# Supabase Setup Guide for EV Charging App

## Quick Start

This guide will help you set up Supabase for the EV Charging App.

### Option 1: Using Supabase Dashboard (Recommended - Easiest)

1. Go to https://supabase.com and sign in
2. Go to your Supabase project: https://app.supabase.com/project/zngycerszrbnjnhbhzml
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/20260512_init_all_tables.sql`
6. Paste it into the SQL editor
7. Click **Run** (or press Ctrl+Enter)

That's it! All tables, policies, functions, and indexes will be created.

### Option 2: Using Supabase CLI (Advanced)

If you have the Supabase CLI installed globally:

```bash
cd supabase
supabase projects list  # Verify connection
supabase db push        # Apply migrations
```

### Option 3: Create a Service Role Key

1. Go to https://app.supabase.com/project/zngycerszrbnjnhbhzml
2. Click **Settings** → **API**
3. Copy the **Service Role Key** (secret_... key)
4. Create a `.env.supabase` file in the project root:
   ```
   SUPABASE_URL=https://bytfwzfcemoxybywligk.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
5. Run: `npx supabase db push --db-url "postgresql://postgres:password@bytfwzfcemoxybywligk.co:5432/postgres"`

## What Gets Created

When the migrations run, you'll get:

### Tables
- `profiles` - User accounts
- `stations` - EV charging stations
- `chargers` - Individual chargers
- `queue` - Charging queue entries
- `reviews_verification` - Station reviews
- `sessions` - Charging sessions
- `transactions` - Payment transactions
- `station_reports` - Issue reports
- `user_roles` - User permissions
- `travel_plans` - Trip planning history

### Security
- Row-Level Security (RLS) on all tables
- Role-based access control (user, admin, super_admin)
- Automatic profile creation on signup
- Auto-disable stations after 5 reports

## Verify It Worked

1. Go to https://app.supabase.com/project/zngycerszrbnjnhbhzml/editor
2. You should see all the tables listed on the left:
   - chargers
   - profiles
   - queue
   - reviews_verification
   - sessions
   - station_reports
   - stations
   - transactions
   - travel_plans
   - user_roles

## Configure Google OAuth (Optional)

For Google sign-in to work:

1. Go to Settings → Authentication → Google
2. Add a Google OAuth 2.0 credential from Google Cloud Console
3. Add your app URL to authorized redirect URIs
4. Copy the Client ID and Client Secret into Supabase

## Environment Variables

The app will read from these automatically:

```
VITE_SUPABASE_URL=https://bytfwzfcemoxybywligk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_efLD7RGj1T1yPZuRObxDOA_lRAPoj9Y
```

These are already set in `.env.local` ✓

## Test the Connection

Run the dev server:

```bash
bun run dev
```

Then:
1. Try signing up with an email
2. You should see a new row in the `profiles` table
3. Try booking a charging slot
4. You should see a new row in the `queue` table

If anything doesn't work, check the browser console and Supabase logs for errors.

## Troubleshooting

### Tables not showing
- Make sure you ran the SQL from step 3 above
- Check the **SQL Editor** → **Recent Queries** to see if it ran successfully

### Auth not working
- Verify URL and public key in `.env.local`
- Check Supabase Authentication settings

### Data not saving
- Open browser DevTools (F12) → Console
- Look for error messages
- Check Supabase logs at https://app.supabase.com/project/zngycerszrbnjnhbhzml/logs

## Default Test Account

After setup, you can use:
- Email: `test@example.com`
- Password: `Test123!` (or any password you set)

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Project Dashboard: https://app.supabase.com/project/zngycerszrbnjnhbhzml
