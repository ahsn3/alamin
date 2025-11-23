# Deployment Guide for Al-Amin CRM System

## Current Issue
Netlify doesn't support persistent databases or long-running Node.js servers. Your SQLite database won't persist.

## Recommended Hosting Solutions

### Option 1: Railway (Easiest - Recommended)
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will automatically detect Node.js and deploy
6. Your SQLite database will persist on Railway
7. **Cost:** Free tier available, then ~$5/month

### Option 2: Render
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. **Cost:** Free tier available, then ~$7/month

### Option 3: Heroku
1. Go to https://heroku.com
2. Install Heroku CLI
3. Run:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```
4. **Cost:** Free tier discontinued, paid plans start at ~$7/month

### Option 4: Fly.io
1. Go to https://fly.io
2. Install flyctl CLI
3. Run: `fly launch`
4. **Cost:** Free tier available

## Important Notes

### For Production (Better Solution)
Consider migrating to a cloud database instead of SQLite:

1. **PostgreSQL** (via Supabase, Railway, or Render)
2. **MongoDB Atlas** (free tier available)
3. **PlanetScale** (MySQL, free tier)

This would require code changes but provides better scalability and reliability.

## Current Setup (SQLite)
If you want to keep SQLite, use Railway or Render as they support persistent file storage.

## Environment Variables
If you need to set PORT or other variables:
- Railway: Project → Variables tab
- Render: Environment → Environment Variables
- Heroku: `heroku config:set PORT=3000`

