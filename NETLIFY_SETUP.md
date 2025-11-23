# Deploying to Netlify (Hybrid Setup)

Since Netlify doesn't support Node.js servers, we'll use a **hybrid approach**:
- **Frontend (HTML/CSS/JS)**: Deploy to Netlify ✅
- **Backend (Node.js/Express)**: Deploy to Railway (or Render) ✅

## Step 1: Deploy Backend to Railway

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `ahsn3/alamin`
5. Railway will auto-detect Node.js
6. **Copy your Railway URL** (e.g., `https://alamin-production.railway.app`)
7. Make sure to note the full URL (it will be something like `https://alamin-production.up.railway.app`)

## Step 2: Update API Configuration

After you get your Railway URL, you have two options:

### Option A: Update api.js directly (Simple)

Edit `api.js` line 2-3:
```javascript
// Replace this:
const API_BASE = window.API_BASE_URL || window.location.origin;

// With this (use your Railway URL):
const API_BASE = 'https://your-app-name.railway.app';
```

### Option B: Use config.js (Flexible)

1. Edit `config.js` and uncomment the line, set your Railway URL
2. Make sure `config.js` is loaded before `api.js` in your HTML files

## Step 3: Deploy Frontend to Netlify

### Option A: Via Netlify Dashboard (Easiest)

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Select `ahsn3/alamin`
5. **Build settings:**
   - Build command: (leave empty or `echo 'No build'`)
   - Publish directory: `.` (root)
6. Click "Deploy site"

### Option B: Via Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

## Step 4: Configure Environment Variables (Optional)

In Netlify dashboard:
- Site settings → Environment variables
- Add: `REACT_APP_API_URL` = `https://your-railway-url.railway.app`

## Important Notes

✅ **What works:**
- Frontend hosted on Netlify (fast CDN)
- Backend API on Railway (persistent database)
- Real-time updates via Socket.io
- All features work as expected

⚠️ **CORS:**
- Make sure your Railway backend has CORS enabled (already configured in `server.js`)

🔒 **Security:**
- Your backend URL will be visible in the frontend code
- Consider using Netlify environment variables for production

## Alternative: Pure Netlify (More Complex)

If you really want everything on Netlify, you'd need to:
1. Convert Express routes to Netlify Functions (serverless)
2. Replace SQLite with Supabase/MongoDB Atlas
3. Replace Socket.io with Supabase Realtime or Pusher
4. Major code refactoring required

**Recommendation:** Use the hybrid approach (Netlify + Railway) - it's easier and works perfectly!

