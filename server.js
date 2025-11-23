const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
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
app.use(express.static(__dirname));

// Initialize Database
const db = new sqlite3.Database('./alamin.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL
    )`, (err) => {
        if (err) console.error('Error creating users table:', err);
        else initializeUsers();
    });

    // Clients table
    db.run(`CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY,
        fullName TEXT NOT NULL,
        nationality TEXT,
        passport TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        notes TEXT,
        addedBy TEXT NOT NULL,
        reminderDate TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating clients table:', err);
    });

    // Transactions table
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        type TEXT,
        status TEXT,
        notes TEXT,
        appointmentDate TEXT,
        due REAL DEFAULT 0,
        paid REAL DEFAULT 0,
        currency TEXT DEFAULT 'USD',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clientId) REFERENCES clients(id)
    )`, (err) => {
        if (err) console.error('Error creating transactions table:', err);
    });

    // Files table
    db.run(`CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT,
        size INTEGER,
        data TEXT NOT NULL,
        uploadDate TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clientId) REFERENCES clients(id)
    )`, (err) => {
        if (err) console.error('Error creating files table:', err);
    });

    // Insurance companies table
    db.run(`CREATE TABLE IF NOT EXISTS insurance_companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        status TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating insurance_companies table:', err);
    });
}

// Initialize default users
function initializeUsers() {
    const users = [
        { username: 'Diaa', password: 'Diaa123', name: 'ضياء', role: 'manager' },
        { username: 'Ahmed', password: 'Ahmed123', name: 'أحمد', role: 'staff' },
        { username: 'Maram', password: 'Maram123', name: 'مرام', role: 'staff' }
    ];

    users.forEach(user => {
        db.run(`INSERT OR IGNORE INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`,
            [user.username, user.password, user.name, user.role],
            (err) => {
                if (err && !err.message.includes('UNIQUE constraint')) {
                    console.error('Error inserting user:', err);
                }
            });
    });
}

// Authentication endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Make username case-insensitive by using LOWER() in SQL
    db.get('SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND password = ?', 
        [username, password], 
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            res.json({
                username: user.username,
                name: user.name,
                role: user.role
            });
        });
});

// Get all clients (with role-based filtering)
app.get('/api/clients', (req, res) => {
    const { username, role } = req.query;
    
    // First get all clients
    let clientQuery = 'SELECT * FROM clients';
    const clientParams = [];
    
    if (role === 'staff') {
        clientQuery += ' WHERE LOWER(addedBy) = LOWER(?)';
        clientParams.push(username);
    }
    
    clientQuery += ' ORDER BY lastUpdated DESC';
    
    db.all(clientQuery, clientParams, (err, clients) => {
        if (err) {
            console.error('Error fetching clients:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (clients.length === 0) {
            return res.json([]);
        }
        
        // Get all client IDs
        const clientIds = clients.map(c => c.id);
        const placeholders = clientIds.map(() => '?').join(',');
        
        // Get all transactions for these clients
        db.all(`SELECT * FROM transactions WHERE clientId IN (${placeholders})`, clientIds, (err, transactions) => {
            if (err) {
                console.error('Error fetching transactions:', err);
                transactions = [];
            }
            
            // Get all files for these clients
            db.all(`SELECT * FROM files WHERE clientId IN (${placeholders})`, clientIds, (err, files) => {
                if (err) {
                    console.error('Error fetching files:', err);
                    files = [];
                }
                
                // Group transactions and files by clientId
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
                            due: t.due || 0,
                            paid: t.paid || 0,
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
                
                // Combine clients with their transactions and files
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
            });
        });
    });
});

// Get single client
app.get('/api/clients/:id', (req, res) => {
    const clientId = req.params.id;
    console.log('Fetching client with ID:', clientId);
    
    db.get('SELECT * FROM clients WHERE id = ?', [clientId], (err, client) => {
        if (err) {
            console.error('Database error fetching client:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!client) {
            console.log('Client not found with ID:', clientId);
            return res.status(404).json({ error: 'Client not found' });
        }
        
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
        
        // Get transactions
        db.all('SELECT * FROM transactions WHERE clientId = ?', [clientId], (err, transactions) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Get files
            db.all('SELECT * FROM files WHERE clientId = ?', [clientId], (err, files) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                
                const clientData = {
                    ...client,
                    transactions: transactions.map(t => ({
                        id: t.id,
                        type: t.type,
                        status: t.status,
                        notes: t.notes,
                        appointmentDate: t.appointmentDate,
                        financial: {
                            due: t.due || 0,
                            paid: t.paid || 0,
                            currency: t.currency || 'USD'
                        },
                        createdAt: t.createdAt
                    })),
                    files: files.map(f => ({
                        id: f.id,
                        name: f.name,
                        type: f.type,
                        size: f.size,
                        data: f.data,
                        uploadDate: f.uploadDate
                    }))
                };
                
                res.json(clientData);
            });
        });
    });
});

// Create client
app.post('/api/clients', (req, res) => {
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
    db.run(`INSERT INTO clients (id, fullName, nationality, passport, phone, email, address, notes, addedBy, reminderDate, createdAt, lastUpdated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [client.id || Date.now(), client.fullName, client.nationality, client.passport, 
         client.phone, client.email || '', client.address || '', client.notes || '', 
         client.addedBy, client.reminderDate || null, now, now],
        function(err) {
            if (err) {
                console.error('Error creating client:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            const clientId = this.lastID || client.id || Date.now();
            console.log('Client created successfully with ID:', clientId);
            
            // Save transactions
            if (client.transactions && client.transactions.length > 0) {
                client.transactions.forEach(transaction => {
                    db.run(`INSERT INTO transactions (clientId, type, status, notes, appointmentDate, due, paid, currency, createdAt)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [clientId, transaction.type, transaction.status, transaction.notes || '', 
                         transaction.appointmentDate || '', transaction.financial?.due || 0, 
                         transaction.financial?.paid || 0, transaction.financial?.currency || 'USD', now]);
                });
            }
            
            // Save files
            if (client.files && client.files.length > 0) {
                client.files.forEach(file => {
                    db.run(`INSERT INTO files (clientId, name, type, size, data, uploadDate)
                            VALUES (?, ?, ?, ?, ?, ?)`,
                        [clientId, file.name, file.type, file.size, file.data, now]);
                });
            }
            
            // Broadcast to all connected clients
            io.emit('clientAdded', { clientId, addedBy: client.addedBy });
            
            res.json({ success: true, id: clientId });
        });
});

// Update client
app.put('/api/clients/:id', (req, res) => {
    const clientId = req.params.id;
    const updates = req.body;
    
    const now = new Date().toISOString();
    
    db.run(`UPDATE clients SET 
            fullName = ?, nationality = ?, passport = ?, phone = ?, email = ?, 
            address = ?, notes = ?, reminderDate = ?, lastUpdated = ?
            WHERE id = ?`,
        [updates.fullName, updates.nationality, updates.passport, updates.phone,
         updates.email || '', updates.address || '', updates.notes || '', 
         updates.reminderDate || null, now, clientId],
        (err) => {
            if (err) {
                console.error('Error updating client:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Update transactions if provided
            if (updates.transactions) {
                // Delete old transactions
                db.run('DELETE FROM transactions WHERE clientId = ?', [clientId], () => {
                    // Insert new transactions
                    updates.transactions.forEach(transaction => {
                        db.run(`INSERT INTO transactions (id, clientId, type, status, notes, appointmentDate, due, paid, currency, createdAt)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [transaction.id, clientId, transaction.type, transaction.status, 
                             transaction.notes || '', transaction.appointmentDate || '',
                             transaction.financial?.due || 0, transaction.financial?.paid || 0,
                             transaction.financial?.currency || 'USD', transaction.createdAt || now]);
                    });
                });
            }
            
            // Update files if provided
            if (updates.files) {
                // Delete old files
                db.run('DELETE FROM files WHERE clientId = ?', [clientId], () => {
                    // Insert new files
                    updates.files.forEach(file => {
                        db.run(`INSERT INTO files (id, clientId, name, type, size, data, uploadDate)
                                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [file.id, clientId, file.name, file.type, file.size, file.data, file.uploadDate || now]);
                    });
                });
            }
            
            // Broadcast update
            io.emit('clientUpdated', { clientId });
            
            res.json({ success: true });
        });
});

// Delete client
app.delete('/api/clients/:id', (req, res) => {
    const clientId = req.params.id;
    
    db.run('DELETE FROM clients WHERE id = ?', [clientId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Delete related transactions and files
        db.run('DELETE FROM transactions WHERE clientId = ?', [clientId]);
        db.run('DELETE FROM files WHERE clientId = ?', [clientId]);
        
        io.emit('clientDeleted', { clientId });
        
        res.json({ success: true });
    });
});

// Insurance Companies endpoints
app.get('/api/insurance', (req, res) => {
    db.all('SELECT * FROM insurance_companies ORDER BY lastUpdated DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/insurance', (req, res) => {
    const { name, phone, status } = req.body;
    const now = new Date().toISOString();
    
    db.run(`INSERT INTO insurance_companies (name, phone, status, createdAt, lastUpdated)
            VALUES (?, ?, ?, ?, ?)`,
        [name, phone || '', status || 'نشط', now, now],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            io.emit('insuranceAdded', { id: this.lastID });
            res.json({ success: true, id: this.lastID });
        });
});

app.put('/api/insurance/:id', (req, res) => {
    const { name, phone, status } = req.body;
    const now = new Date().toISOString();
    
    db.run(`UPDATE insurance_companies SET name = ?, phone = ?, status = ?, lastUpdated = ?
            WHERE id = ?`,
        [name, phone || '', status || 'نشط', now, req.params.id],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            io.emit('insuranceUpdated', { id: req.params.id });
            res.json({ success: true });
        });
});

app.delete('/api/insurance/:id', (req, res) => {
    db.run('DELETE FROM insurance_companies WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        io.emit('insuranceDeleted', { id: req.params.id });
        res.json({ success: true });
    });
});

// Export data endpoint (for backup only)
app.get('/api/export', (req, res) => {
    db.all('SELECT * FROM clients', [], (err, clients) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        db.all('SELECT * FROM insurance_companies', [], (err, insurance) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Get transactions and files for each client
            Promise.all(clients.map(client => {
                return new Promise((resolve) => {
                    db.all('SELECT * FROM transactions WHERE clientId = ?', [client.id], (err, transactions) => {
                        if (err) transactions = [];
                        
                        db.all('SELECT * FROM files WHERE clientId = ?', [client.id], (err, files) => {
                            if (err) files = [];
                            
                            resolve({
                                ...client,
                                transactions: transactions.map(t => ({
                                    id: t.id,
                                    type: t.type,
                                    status: t.status,
                                    notes: t.notes,
                                    appointmentDate: t.appointmentDate,
                                    financial: {
                                        due: t.due || 0,
                                        paid: t.paid || 0,
                                        currency: t.currency || 'USD'
                                    },
                                    createdAt: t.createdAt
                                })),
                                files: files.map(f => ({
                                    id: f.id,
                                    name: f.name,
                                    type: f.type,
                                    size: f.size,
                                    data: f.data,
                                    uploadDate: f.uploadDate
                                }))
                            });
                        });
                    });
                });
            })).then(clientsWithData => {
                res.json({
                    clients: clientsWithData,
                    insuranceCompanies: insurance,
                    exportDate: new Date().toISOString()
                });
            });
        });
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, req.path === '/' ? 'index.html' : req.path));
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

