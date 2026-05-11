## 🚀 QUICK START - Apply Supabase Migrations

Your EV Charging app backend is ready! Just apply the database schema.

### **3-Minute Setup** ⚡

1. Open https://app.supabase.com/project/zngycerszrbnjnhbhzml
2. Click **SQL Editor** → **New Query**
3. Open this file and copy all text:
   ```
   supabase/migrations/20260512_init_all_tables.sql
   ```
4. Paste into SQL Editor and click **Run** ✓

**Done!** Your database is now ready.

---

### Verify It Worked

Go to **Table Editor** in Supabase and check these tables exist:
- [ ] profiles
- [ ] stations  
- [ ] queue
- [ ] transactions
- [ ] chargers

See them? ✓ Great! Database is connected.

---

### Load Test Data (Optional)

Want to see sample stations in the app?

1. SQL Editor → **New Query**
2. Copy from: `supabase/migrations/20260512_seed_stations.sql`
3. Paste and Run ✓

Now your app will show real charging stations!

---

### Test Everything Works

```bash
bun run dev
```

Then:
1. Open http://localhost:5173
2. Sign up with any email
3. Check browser DevTools console for:
   ```
   ✓ [supabase] Client initialized
   [evApi] Loaded 10 stations from Supabase
   ```
4. Go to Supabase → profiles table
5. See your new user? ✓ You're connected!

---

**Questions?** See `SUPABASE_SETUP.md` for detailed help.
