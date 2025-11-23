# Database Persistence on Railway

## The Problem
When Railway redeploys, it creates a fresh container, which means your SQLite database file gets recreated empty, losing all your data.

## Solutions

### Solution 1: Use Railway Volumes (Recommended)

Railway supports persistent volumes. You need to:

1. **In Railway Dashboard:**
   - Go to your project
   - Click on your service
   - Go to **"Settings"** tab
   - Scroll to **"Volumes"** section
   - Click **"Add Volume"**
   - Mount path: `/data` (or any path you prefer)
   - This creates a persistent storage that survives redeployments

2. **Update server.js:**
   Change the database path to use the volume:
   ```javascript
   const dbPath = process.env.DATABASE_PATH || './alamin.db';
   const db = new sqlite3.Database(dbPath, ...);
   ```

3. **Set Environment Variable:**
   - In Railway: Settings → Variables
   - Add: `DATABASE_PATH=/data/alamin.db`

### Solution 2: Use Railway PostgreSQL (Better for Production)

Railway offers managed PostgreSQL databases that persist automatically:

1. **In Railway Dashboard:**
   - Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - This creates a persistent PostgreSQL database
   - Railway will give you connection string

2. **Migrate from SQLite to PostgreSQL:**
   - Install `pg` package: `npm install pg`
   - Update `server.js` to use PostgreSQL instead of SQLite
   - This requires code changes but is more reliable

### Solution 3: Backup Before Deploy (Quick Fix)

Create a backup/restore system:

1. **Export data before deployment:**
   - Use the export function in your app
   - Download the JSON backup

2. **Restore after deployment:**
   - Import the data back

### Solution 4: Use Railway's Persistent Storage

Railway has a feature called "Persistent Storage" that you can enable:

1. Go to your service settings
2. Enable "Persistent Storage"
3. Set the database path to a persistent location

## Recommended: Quick Fix (Volume)

The fastest solution is to use Railway Volumes. I'll update the code to support this.

