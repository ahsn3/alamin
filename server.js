const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// API routes must come before static file serving
// Static files will be served last

// Initialize PostgreSQL Database
// Railway automatically provides DATABASE_URL environment variable
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err);
    } else {
        console.log('Connected to PostgreSQL database');
        initializeDatabase();
    }
});

// Helper function to execute queries with promises
const query = (text, params) => {
    return pool.query(text, params);
};

// Initialize database tables
async function initializeDatabase() {
    try {
        // Users table
        await query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL
        )`);
        await initializeUsers();

        // Clients table
        await query(`CREATE TABLE IF NOT EXISTS clients (
            id BIGINT PRIMARY KEY,
            "fullName" VARCHAR(255) NOT NULL,
            nationality VARCHAR(255),
            passport VARCHAR(255),
            phone VARCHAR(255),
            email VARCHAR(255),
            address TEXT,
            notes TEXT,
            "addedBy" VARCHAR(255) NOT NULL,
            "reminderDate" TIMESTAMP,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Transactions table
        await query(`CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            "clientId" BIGINT NOT NULL,
            type VARCHAR(255),
            status VARCHAR(255),
            notes TEXT,
            "appointmentDate" VARCHAR(255),
            due DECIMAL(10, 2) DEFAULT 0,
            paid DECIMAL(10, 2) DEFAULT 0,
            currency VARCHAR(10) DEFAULT 'USD',
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE CASCADE
        )`);

        // Files table
        await query(`CREATE TABLE IF NOT EXISTS files (
            id SERIAL PRIMARY KEY,
            "clientId" BIGINT NOT NULL,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(255),
            size INTEGER,
            data TEXT NOT NULL,
            "uploadDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE CASCADE
        )`);

        // Insurance companies table
        await query(`CREATE TABLE IF NOT EXISTS insurance_companies (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(255),
            status VARCHAR(50),
            due DECIMAL(10, 2) DEFAULT 0,
            paid DECIMAL(10, 2) DEFAULT 0,
            currency VARCHAR(10) DEFAULT 'USD',
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Try to add financial columns if they don't exist (for existing databases)
        try {
            await query(`ALTER TABLE insurance_companies ADD COLUMN IF NOT EXISTS due DECIMAL(10, 2) DEFAULT 0`);
            await query(`ALTER TABLE insurance_companies ADD COLUMN IF NOT EXISTS paid DECIMAL(10, 2) DEFAULT 0`);
            await query(`ALTER TABLE insurance_companies ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD'`);
        } catch (e) {
            // Columns might already exist, ignore
        }

        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Initialize default users
async function initializeUsers() {
    const users = [
        { username: 'Diaa', password: 'Diaa123', name: 'ضياء', role: 'manager' },
        { username: 'Ahmed', password: 'Ahmed123', name: 'أحمد', role: 'staff' },
        { username: 'Maram', password: 'Maram123', name: 'مرام', role: 'staff' }
    ];

    console.log('Initializing default users...');
    for (const user of users) {
        try {
            const result = await query(
                `INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role`,
                [user.username, user.password, user.name, user.role]
            );
            console.log(`User ${user.username} initialized`);
        } catch (err) {
            console.error(`Error inserting user ${user.username}:`, err);
        }
    }
    
    // Verify users were created
    const result = await query('SELECT username, name, role FROM users');
    console.log(`Total users in database: ${result.rows.length}`);
    result.rows.forEach(user => {
        console.log(`  - ${user.username} (${user.name}) - ${user.role}`);
    });
}

// One-time setup endpoint to create users (call this once)
// Works with both GET and POST for easy browser access
app.get('/api/setup-users', async (req, res) => {
    try {
        // First, ensure users table exists
        await query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL
        )`);
        
        const users = [
            { username: 'Diaa', password: 'Diaa123', name: 'ضياء', role: 'manager' },
            { username: 'Ahmed', password: 'Ahmed123', name: 'أحمد', role: 'staff' },
            { username: 'Maram', password: 'Maram123', name: 'مرام', role: 'staff' }
        ];
        
        let created = 0;
        const errors = [];
        
        for (const user of users) {
            try {
                const result = await query(
                    `INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role`,
                    [user.username, user.password, user.name, user.role]
                );
                created++;
                console.log(`User ${user.username} created/updated successfully`);
            } catch (err) {
                console.error(`Error creating user ${user.username}:`, err);
                errors.push(`${user.username}: ${err.message}`);
            }
        }
        
        // Verify users
        const verifyResult = await query('SELECT username, name, role FROM users');
        
        res.json({ 
            success: true, 
            message: `Created/updated ${created} users`,
            totalUsers: verifyResult.rows.length,
            users: verifyResult.rows,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: 'Database error', details: error.message });
    }
});

app.post('/api/setup-users', async (req, res) => {
    try {
        const users = [
            { username: 'Diaa', password: 'Diaa123', name: 'ضياء', role: 'manager' },
            { username: 'Ahmed', password: 'Ahmed123', name: 'أحمد', role: 'staff' },
            { username: 'Maram', password: 'Maram123', name: 'مرام', role: 'staff' }
        ];
        
        let created = 0;
        for (const user of users) {
            try {
                await query(
                    `INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role`,
                    [user.username, user.password, user.name, user.role]
                );
                created++;
            } catch (err) {
                console.error(`Error creating user ${user.username}:`, err);
            }
        }
        
        res.json({ success: true, message: `Created/updated ${created} users` });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Authentication endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await query(
            'SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND password = $2',
            [username, password]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        res.json({
            username: user.username,
            name: user.name,
            role: user.role
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all clients (with role-based filtering)
app.get('/api/clients', async (req, res) => {
    try {
        const { username, role } = req.query;
        
        let clientQuery = 'SELECT * FROM clients';
        const clientParams = [];
        
        if (role === 'staff') {
            clientQuery += ' WHERE LOWER("addedBy") = LOWER($1)';
            clientParams.push(username);
        }
        
        clientQuery += ' ORDER BY "lastUpdated" DESC';
        
        const clientsResult = await query(clientQuery, clientParams);
        const clients = clientsResult.rows;
        
        if (clients.length === 0) {
            return res.json([]);
        }
        
        const clientIds = clients.map(c => c.id);
        const placeholders = clientIds.map((_, i) => `$${i + 1}`).join(',');
        
        // Get all transactions
        const transactionsResult = await query(
            `SELECT * FROM transactions WHERE "clientId" IN (${placeholders})`,
            clientIds
        );
        const transactions = transactionsResult.rows;
        
        // Get all files
        const filesResult = await query(
            `SELECT * FROM files WHERE "clientId" IN (${placeholders})`,
            clientIds
        );
        const files = filesResult.rows;
        
        // Group by clientId
        const transactionsByClient = {};
        transactions.forEach(t => {
            if (!transactionsByClient[t.clientId]) {
                transactionsByClient[t.clientId] = [];
            }
            transactionsByClient[t.clientId].push({
                id: t.id,
                type: t.type,
                status: t.status,
                notes: t.notes,
                appointmentDate: t.appointmentDate,
                financial: {
                    due: parseFloat(t.due) || 0,
                    paid: parseFloat(t.paid) || 0,
                    currency: t.currency || 'USD'
                },
                createdAt: t.createdAt
            });
        });
        
        const filesByClient = {};
        files.forEach(f => {
            if (!filesByClient[f.clientId]) {
                filesByClient[f.clientId] = [];
            }
            filesByClient[f.clientId].push({
                id: f.id,
                name: f.name,
                type: f.type,
                size: f.size,
                data: f.data,
                uploadDate: f.uploadDate
            });
        });
        
        const clientsWithData = clients.map(client => ({
            id: client.id,
            fullName: client.fullName,
            nationality: client.nationality,
            passport: client.passport,
            phone: client.phone,
            email: client.email,
            address: client.address,
            notes: client.notes,
            addedBy: client.addedBy,
            reminderDate: client.reminderDate,
            createdAt: client.createdAt,
            lastUpdated: client.lastUpdated,
            transactions: transactionsByClient[client.id] || [],
            files: filesByClient[client.id] || []
        }));
        
        res.json(clientsWithData);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get single client
app.get('/api/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        console.log('Fetching client with ID:', clientId);
        
        const clientResult = await query('SELECT * FROM clients WHERE id = $1', [clientId]);
        
        if (clientResult.rows.length === 0) {
            console.log('Client not found with ID:', clientId);
            return res.status(404).json({ error: 'Client not found' });
        }
        
        const client = clientResult.rows[0];
        console.log('Client found:', {
            id: client.id,
            fullName: client.fullName,
            nationality: client.nationality,
            passport: client.passport,
            phone: client.phone,
            email: client.email,
            address: client.address,
            notes: client.notes
        });
        
        const transactionsResult = await query('SELECT * FROM transactions WHERE "clientId" = $1', [clientId]);
        const filesResult = await query('SELECT * FROM files WHERE "clientId" = $1', [clientId]);
        
        const clientData = {
            ...client,
            transactions: transactionsResult.rows.map(t => ({
                id: t.id,
                type: t.type,
                status: t.status,
                notes: t.notes,
                appointmentDate: t.appointmentDate,
                financial: {
                    due: parseFloat(t.due) || 0,
                    paid: parseFloat(t.paid) || 0,
                    currency: t.currency || 'USD'
                },
                createdAt: t.createdAt
            })),
            files: filesResult.rows.map(f => ({
                id: f.id,
                name: f.name,
                type: f.type,
                size: f.size,
                data: f.data,
                uploadDate: f.uploadDate
            }))
        };
        
        res.json(clientData);
    } catch (error) {
        console.error('Database error fetching client:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create client
app.post('/api/clients', async (req, res) => {
    try {
        const client = req.body;
        console.log('Creating client with data:', {
            fullName: client.fullName,
            nationality: client.nationality,
            passport: client.passport,
            phone: client.phone,
            email: client.email,
            address: client.address,
            notes: client.notes,
            addedBy: client.addedBy
        });
        
        const now = new Date().toISOString();
        const clientId = client.id || Date.now();
        
        await query(
            `INSERT INTO clients (id, "fullName", nationality, passport, phone, email, address, notes, "addedBy", "reminderDate", "createdAt", "lastUpdated")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [clientId, client.fullName, client.nationality, client.passport, 
             client.phone, client.email || '', client.address || '', client.notes || '', 
             client.addedBy, client.reminderDate || null, now, now]
        );
        
        console.log('Client created successfully with ID:', clientId);
        
        // Save transactions
        if (client.transactions && client.transactions.length > 0) {
            for (const transaction of client.transactions) {
                await query(
                    `INSERT INTO transactions ("clientId", type, status, notes, "appointmentDate", due, paid, currency, "createdAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [clientId, transaction.type, transaction.status, transaction.notes || '', 
                     transaction.appointmentDate || '', transaction.financial?.due || 0, 
                     transaction.financial?.paid || 0, transaction.financial?.currency || 'USD', now]
                );
            }
        }
        
        // Save files
        if (client.files && client.files.length > 0) {
            for (const file of client.files) {
                await query(
                    `INSERT INTO files ("clientId", name, type, size, data, "uploadDate")
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                    [clientId, file.name, file.type, file.size, file.data, now]
                );
            }
        }
        
        io.emit('clientAdded', { clientId, addedBy: client.addedBy });
        res.json({ success: true, id: clientId });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update client
app.put('/api/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const updates = req.body;
        const now = new Date().toISOString();
        
        await query(
            `UPDATE clients SET 
            "fullName" = $1, nationality = $2, passport = $3, phone = $4, email = $5, 
            address = $6, notes = $7, "reminderDate" = $8, "lastUpdated" = $9
            WHERE id = $10`,
            [updates.fullName, updates.nationality, updates.passport, updates.phone,
             updates.email || '', updates.address || '', updates.notes || '', 
             updates.reminderDate || null, now, clientId]
        );
        
        // Update transactions if provided
        if (updates.transactions) {
            await query('DELETE FROM transactions WHERE "clientId" = $1', [clientId]);
            for (const transaction of updates.transactions) {
                await query(
                    `INSERT INTO transactions (id, "clientId", type, status, notes, "appointmentDate", due, paid, currency, "createdAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [transaction.id, clientId, transaction.type, transaction.status, 
                     transaction.notes || '', transaction.appointmentDate || '',
                     transaction.financial?.due || 0, transaction.financial?.paid || 0,
                     transaction.financial?.currency || 'USD', transaction.createdAt || now]
                );
            }
        }
        
        // Update files if provided
        if (updates.files) {
            await query('DELETE FROM files WHERE "clientId" = $1', [clientId]);
            for (const file of updates.files) {
                await query(
                    `INSERT INTO files (id, "clientId", name, type, size, data, "uploadDate")
                    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [file.id, clientId, file.name, file.type, file.size, file.data, file.uploadDate || now]
                );
            }
        }
        
        io.emit('clientUpdated', { clientId });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete client
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        await query('DELETE FROM clients WHERE id = $1', [clientId]);
        // Transactions and files will be deleted automatically due to CASCADE
        io.emit('clientDeleted', { clientId });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Insurance Companies endpoints
app.get('/api/insurance', async (req, res) => {
    try {
        const result = await query('SELECT * FROM insurance_companies ORDER BY "lastUpdated" DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching insurance:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/insurance', async (req, res) => {
    try {
        const { name, phone, status, due, paid, currency } = req.body;
        const now = new Date().toISOString();
        
        const result = await query(
            `INSERT INTO insurance_companies (name, phone, status, due, paid, currency, "createdAt", "lastUpdated")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [name, phone || '', status || 'active', due || 0, paid || 0, currency || 'USD', now, now]
        );
        
        const id = result.rows[0].id;
        io.emit('insuranceAdded', { id });
        res.json({ success: true, id });
    } catch (error) {
        console.error('Error creating insurance:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.put('/api/insurance/:id', async (req, res) => {
    try {
        const { name, phone, status, due, paid, currency } = req.body;
        const now = new Date().toISOString();
        
        await query(
            `UPDATE insurance_companies SET name = $1, phone = $2, status = $3, due = $4, paid = $5, currency = $6, "lastUpdated" = $7
            WHERE id = $8`,
            [name, phone || '', status || 'active', due || 0, paid || 0, currency || 'USD', now, req.params.id]
        );
        
        io.emit('insuranceUpdated', { id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating insurance:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.delete('/api/insurance/:id', async (req, res) => {
    try {
        await query('DELETE FROM insurance_companies WHERE id = $1', [req.params.id]);
        io.emit('insuranceDeleted', { id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting insurance:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Export data endpoint (for backup only)
app.get('/api/export', async (req, res) => {
    try {
        const clientsResult = await query('SELECT * FROM clients');
        const insuranceResult = await query('SELECT * FROM insurance_companies');
        
        const clients = clientsResult.rows;
        const insurance = insuranceResult.rows;
        
        const clientsWithData = await Promise.all(clients.map(async (client) => {
            const transactionsResult = await query('SELECT * FROM transactions WHERE "clientId" = $1', [client.id]);
            const filesResult = await query('SELECT * FROM files WHERE "clientId" = $1', [client.id]);
            
            return {
                ...client,
                transactions: transactionsResult.rows.map(t => ({
                    id: t.id,
                    type: t.type,
                    status: t.status,
                    notes: t.notes,
                    appointmentDate: t.appointmentDate,
                    financial: {
                        due: parseFloat(t.due) || 0,
                        paid: parseFloat(t.paid) || 0,
                        currency: t.currency || 'USD'
                    },
                    createdAt: t.createdAt
                })),
                files: filesResult.rows.map(f => ({
                    id: f.id,
                    name: f.name,
                    type: f.type,
                    size: f.size,
                    data: f.data,
                    uploadDate: f.uploadDate
                }))
            };
        }));
        
        res.json({
            clients: clientsWithData,
            insuranceCompanies: insurance,
            exportDate: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Serve static files (must be last, after all API routes)
app.use(express.static(__dirname));

// Fallback to index.html for SPA routes (but not for API routes)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
