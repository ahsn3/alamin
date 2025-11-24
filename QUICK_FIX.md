# Quick Fix: Create Users in Database

## Option 1: Use the Setup Endpoint (Easiest)

1. **Open your Railway app URL** in a new tab
2. **Go to:** `https://your-app-url.railway.app/api/setup-users`
3. **Or use curl/Postman:**
   ```bash
   curl -X POST https://your-app-url.railway.app/api/setup-users
   ```
4. You should see: `{"success": true, "message": "Created/updated 3 users"}`
5. **Now try logging in!**

## Option 2: Run SQL in Railway PostgreSQL

1. **In Railway Dashboard:**
   - Go to your **PostgreSQL** service (not the main app)
   - Click on it
   - Go to **"Data"** or **"Query"** tab
   - Or click **"Connect"** to get connection details

2. **Run this SQL:**
   ```sql
   INSERT INTO users (username, password, name, role) VALUES 
       ('Diaa', 'Diaa123', 'ضياء', 'manager'),
       ('Ahmed', 'Ahmed123', 'أحمد', 'staff'),
       ('Maram', 'Maram123', 'مرام', 'staff')
   ON CONFLICT (username) DO UPDATE SET 
       password = EXCLUDED.password,
       name = EXCLUDED.name,
       role = EXCLUDED.role;
   ```

3. **Verify:**
   ```sql
   SELECT username, name, role FROM users;
   ```

## Option 3: Use Railway Console

1. **In Railway Dashboard:**
   - Go to your **main service** (alamin)
   - Click **"Deployments"** tab
   - Click on latest deployment
   - Click **"View Logs"** or find **"Console"** option

2. **Run:**
   ```bash
   node create-users.js
   ```

## Login Credentials

After creating users, use:
- **Diaa** / **Diaa123** (Manager - full access)
- **Ahmed** / **Ahmed123** (Staff - own clients only)
- **Maram** / **Maram123** (Staff - own clients only)

## Recommended: Option 1

Just visit: `https://your-railway-url.railway.app/api/setup-users`

This is the fastest way!

