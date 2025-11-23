# Railway Database Persistence Setup

## ⚠️ IMPORTANT: Your data was deleted because Railway redeploys create fresh containers

## Quick Fix: Enable Persistent Storage on Railway

### Step 1: Add a Volume in Railway

1. Go to your Railway dashboard
2. Click on your **"alamin"** service
3. Go to **"Settings"** tab
4. Scroll down to **"Volumes"** section
5. Click **"Add Volume"**
6. Set:
   - **Mount Path:** `/data`
   - **Size:** 1GB (or more if needed)
7. Click **"Add"**

### Step 2: Set Environment Variable

1. Still in Settings, go to **"Variables"** tab
2. Click **"New Variable"**
3. Add:
   - **Name:** `RAILWAY_VOLUME_MOUNT_PATH`
   - **Value:** `/data`
4. Click **"Add"**

### Step 3: Redeploy

Railway will automatically redeploy with the new volume. Your database will now persist!

## Alternative: Use Railway PostgreSQL (Recommended for Production)

PostgreSQL databases on Railway are **automatically persistent** and more reliable:

### Setup PostgreSQL:

1. In Railway dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will create a PostgreSQL database
4. Copy the connection string from the database settings

### Migrate to PostgreSQL:

This requires code changes. I can help you migrate if you want a more robust solution.

## Current Status

✅ **Code Updated:** `server.js` now supports Railway volumes
✅ **Ready to Deploy:** Just add the volume in Railway dashboard

## After Setup

Once you add the volume and set the environment variable:
- Your database will persist across redeployments
- All your data will be safe
- No more data loss on updates!

## Important Notes

- **Backup First:** If you have any data you want to keep, export it using the export function before setting up the volume
- **Volume Size:** Start with 1GB, you can increase later if needed
- **Cost:** Railway volumes are included in their pricing (usually free tier covers it)

