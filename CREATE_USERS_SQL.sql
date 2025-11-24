-- SQL Commands to create users in PostgreSQL
-- Run these commands in Railway's PostgreSQL database

-- First, make sure the users table exists
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- Insert the default users
INSERT INTO users (username, password, name, role) VALUES 
    ('Diaa', 'Diaa123', 'ضياء', 'manager'),
    ('Ahmed', 'Ahmed123', 'أحمد', 'staff'),
    ('Maram', 'Maram123', 'مرام', 'staff')
ON CONFLICT (username) DO UPDATE SET 
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Verify users were created
SELECT username, name, role FROM users;

