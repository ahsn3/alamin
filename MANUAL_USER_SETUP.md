# Manual User Setup - Step by Step

## Option 1: Use Railway PostgreSQL Query Tool (Easiest)

1. **In Railway Dashboard:**
   - Click on your **PostgreSQL** service (the database, not the main app)
   - Look for **"Data"** or **"Query"** tab
   - Or click **"Connect"** button

2. **Run this SQL (copy and paste all of it):**

```sql
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- Insert the users
INSERT INTO users (username, password, name, role) VALUES 
    ('Diaa', 'Diaa123', 'ضياء', 'manager'),
    ('Ahmed', 'Ahmed123', 'أحمد', 'staff'),
    ('Maram', 'Maram123', 'مرام', 'staff')
ON CONFLICT (username) DO UPDATE SET 
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Verify users were created
SELECT id, username, name, role FROM users;
```

3. **You should see 3 users listed!**

## Option 2: Use Railway Console/CLI

1. **In Railway Dashboard:**
   - Go to your **PostgreSQL** service
   - Click **"Connect"** or **"Query"**
   - Use the connection string to connect with a PostgreSQL client

2. **Or use Railway CLI:**
   ```bash
   railway connect postgres
   ```

3. **Then run the SQL above**

## Option 3: Use a PostgreSQL Client

1. **Get connection string from Railway:**
   - PostgreSQL service → Variables → `DATABASE_URL`
   - Copy the connection string

2. **Use a tool like:**
   - pgAdmin
   - DBeaver
   - TablePlus
   - Or online: https://www.elephantsql.com/ (free)

3. **Connect and run the SQL**

## After Creating Users

**Login with:**
- Username: `Diaa` / Password: `Diaa123` (Manager)
- Username: `Ahmed` / Password: `Ahmed123` (Staff)
- Username: `Maram` / Password: `Maram123` (Staff)

## Quick SQL (Copy This):

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

INSERT INTO users (username, password, name, role) VALUES 
    ('Diaa', 'Diaa123', 'ضياء', 'manager'),
    ('Ahmed', 'Ahmed123', 'أحمد', 'staff'),
    ('Maram', 'Maram123', 'مرام', 'staff')
ON CONFLICT (username) DO UPDATE SET 
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role;
```

