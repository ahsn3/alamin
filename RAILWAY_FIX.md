# Railway Database Persistence - Updated Solution

## The Problem
Railway redeploys create fresh containers, which can cause data loss with SQLite.

## Solution: Use Railway's Built-in Persistence

Railway actually **does persist files** in your project directory between deployments, but there's a catch - the database needs to be in the right location.

### Option 1: Current Fix (Recommended)

I've updated the code to store the database in a `./data` directory. Railway should persist this, but to be 100% sure:

1. **In Railway Dashboard:**
   - Go to your service → **Settings** → **Variables**
   - Add a new variable:
     - **Name:** `DATABASE_DIR`
     - **Value:** `./data`
   - This ensures the database is in a dedicated directory

2. **Redeploy:**
   - Railway will automatically redeploy
   - Your database should now persist

### Option 2: Use Railway PostgreSQL (Most Reliable)

This is the **best solution** for production. PostgreSQL databases on Railway are automatically persistent and more reliable:

#### Steps:

1. **In Railway Dashboard:**
   - Click **"+ New"** button (top right)
   - Select **"Database"**
   - Choose **"Add PostgreSQL"**
   - Railway will create a PostgreSQL database

2. **Get Connection String:**
   - Click on the new PostgreSQL service
   - Go to **"Variables"** tab
   - Copy the `DATABASE_URL` (it looks like: `postgresql://user:pass@host:port/dbname`)

3. **Update Code:**
   I can help you migrate from SQLite to PostgreSQL. This requires:
   - Installing `pg` package
   - Updating database queries
   - But your data will be 100% safe

### Option 3: Manual Backup Before Deploy

Until we set up proper persistence:

1. **Before any deployment:**
   - Go to your app
   - Click "تصدير" (Export) button
   - Download the JSON backup

2. **After deployment:**
   - Import the data back
   - (I can add an import function if needed)

## Recommended Action

**For now:** Use Option 1 (the code update I just made)
**For production:** Migrate to PostgreSQL (Option 2) - I can help with this

## Why SQLite Can Lose Data

- Railway containers are ephemeral
- Files outside the project directory may not persist
- SQLite is file-based, so it's vulnerable to container resets

PostgreSQL solves this because it's a managed service that Railway handles separately.

