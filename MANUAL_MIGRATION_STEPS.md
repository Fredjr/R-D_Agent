# Manual Database Migration Steps

## 🚨 **CRITICAL: This migration MUST be run to fix the application**

The application is currently broken because the `timeline_events` column doesn't exist in the database.

---

## ✅ **Option 1: Railway Dashboard (Easiest - 2 minutes)**

### Step-by-Step:

1. **Open Railway Dashboard**
   - Go to https://railway.app
   - Log in with: fredericle77@gmail.com
   - You should see project: **ingenious-reprieve**

2. **Select PostgreSQL Service**
   - Click on the **Postgres** service (not R-D_Agent)
   - You should see the database overview

3. **Open Query Interface**
   - Click the **"Data"** tab at the top
   - Click the **"Query"** button
   - You'll see a SQL query editor

4. **Run This SQL**
   Copy and paste this EXACT SQL into the query editor:
   ```sql
   ALTER TABLE project_summaries 
   ADD COLUMN IF NOT EXISTS timeline_events JSON DEFAULT '[]'::json;
   ```

5. **Execute**
   - Click **"Run Query"** or press Cmd+Enter
   - You should see: `ALTER TABLE` (success message)
   - If you see "column already exists" - that's fine too!

6. **Verify (Optional)**
   Run this query to verify:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'project_summaries' 
   AND column_name = 'timeline_events';
   ```
   
   Expected result:
   ```
   column_name      | data_type
   -----------------|-----------
   timeline_events  | json
   ```

---

## ✅ **Option 2: Railway CLI with psql (If you have psql installed)**

If you have `psql` installed locally:

```bash
# Get the public DATABASE_URL from Railway
railway variables get DATABASE_PUBLIC_URL

# Or get it from the dashboard and run:
psql "YOUR_DATABASE_URL_HERE" -c "ALTER TABLE project_summaries ADD COLUMN IF NOT EXISTS timeline_events JSON DEFAULT '[]'::json;"
```

---

## ✅ **Option 3: Add to Startup Script (Automatic on next deploy)**

If you want this to run automatically on the next deployment, we can add it to the startup script.

Let me know if you want me to do this.

---

## 🧪 **After Running Migration - Test**

1. **Go to your application**
   - Open your R&D Agent application
   - Navigate to any project

2. **Test Summaries**
   - Click "Summaries" tab
   - Should load without errors ✅
   - Click "Regenerate" button
   - Wait for generation to complete
   - **Look for new section:** "📅 Research Journey Timeline"

3. **Test Insights**
   - Click "Insights" tab
   - Click "Regenerate" button
   - Should work without errors ✅

---

## 📊 **What You'll See After Migration**

### **Before (Current - Broken):**
```
❌ Error: column project_summaries.timeline_events does not exist
```

### **After (Fixed):**
```
✅ Summaries load successfully
✅ Timeline section appears (after regenerating)
✅ Events displayed chronologically
✅ Context-aware content visible
```

---

## 🆘 **If You Have Issues**

**Can't find Railway dashboard:**
- URL: https://railway.app
- Project: ingenious-reprieve
- Service: Postgres (not R-D_Agent)

**Can't find Query button:**
- Make sure you're in the Postgres service
- Look for "Data" tab at the top
- Query button should be visible

**SQL fails:**
- Make sure you copied the entire SQL statement
- Check for any extra characters
- Try running just the ALTER TABLE line

**Still getting errors after migration:**
- Check that migration actually ran (use verify query)
- Try restarting the R-D_Agent service in Railway
- Check Railway logs for other errors

---

## 📝 **Summary**

**What to do:**
1. Go to Railway Dashboard
2. Open Postgres service → Data → Query
3. Run: `ALTER TABLE project_summaries ADD COLUMN IF NOT EXISTS timeline_events JSON DEFAULT '[]'::json;`
4. Test application

**Expected time:** 2 minutes

**Expected result:** Application works, timeline appears! 🎉

---

## ✅ **Confirmation**

After running the migration, please confirm:
- [ ] SQL executed successfully
- [ ] Summaries load without errors
- [ ] Insights regenerate without errors
- [ ] Timeline section appears after regenerating summary

Let me know once you've completed this and I can help with any issues!

