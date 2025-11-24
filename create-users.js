// Script to create default users in PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function createUsers() {
    try {
        console.log('Connecting to database...');
        
        // Check if users table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('Creating users table...');
            await pool.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL
                )
            `);
        }
        
        const users = [
            { username: 'Diaa', password: 'Diaa123', name: 'ضياء', role: 'manager' },
            { username: 'Ahmed', password: 'Ahmed123', name: 'أحمد', role: 'staff' },
            { username: 'Maram', password: 'Maram123', name: 'مرام', role: 'staff' }
        ];
        
        console.log('Creating users...');
        for (const user of users) {
            try {
                await pool.query(
                    `INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role`,
                    [user.username, user.password, user.name, user.role]
                );
                console.log(`✓ User ${user.username} created/updated`);
            } catch (err) {
                console.error(`Error creating user ${user.username}:`, err.message);
            }
        }
        
        // Verify users
        const result = await pool.query('SELECT username, name, role FROM users');
        console.log('\nUsers in database:');
        result.rows.forEach(user => {
            console.log(`  - ${user.username} (${user.name}) - ${user.role}`);
        });
        
        console.log('\n✓ Users setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createUsers();

