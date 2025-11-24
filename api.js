// API Client and Socket.io for real-time updates
// For Netlify deployment: Set this to your Railway backend URL
// Example: const API_BASE = 'https://your-app.railway.app';
// For local development: Leave as window.location.origin
const API_BASE = window.API_BASE_URL || window.location.origin;
let socket = null;

// Initialize Socket.io connection
function initSocket() {
    if (typeof io !== 'undefined') {
        socket = io(API_BASE);
        
        socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        socket.on('clientAdded', async (data) => {
            console.log('Client added:', data);
            // Reload clients if on clients page or dashboard
            if (typeof loadClients === 'function') {
                await loadClients();
            }
            if (typeof loadLatestClients === 'function') {
                await loadLatestClients();
            }
            if (typeof updateStatistics === 'function') {
                await updateStatistics();
            }
        });
        
        socket.on('clientUpdated', async (data) => {
            console.log('Client updated:', data);
            if (typeof loadClients === 'function') {
                await loadClients();
            }
            if (typeof loadClientDetails === 'function' && window.location.pathname.includes('client-details.html')) {
                const urlParams = new URLSearchParams(window.location.search);
                const clientId = urlParams.get('id');
                if (clientId == data.clientId) {
                    await loadClientDetails(parseInt(clientId));
                }
            }
        });
        
        socket.on('clientDeleted', async (data) => {
            console.log('Client deleted:', data);
            if (typeof loadClients === 'function') {
                await loadClients();
            }
            if (typeof loadLatestClients === 'function') {
                await loadLatestClients();
            }
            if (typeof updateStatistics === 'function') {
                await updateStatistics();
            }
        });
        
        socket.on('insuranceAdded', (data) => {
            console.log('Insurance added:', data);
            if (typeof loadInsuranceCompanies === 'function') {
                loadInsuranceCompanies();
            }
            if (typeof updateStatistics === 'function') {
                updateStatistics();
            }
        });
        
        socket.on('insuranceUpdated', (data) => {
            console.log('Insurance updated:', data);
            if (typeof loadInsuranceCompanies === 'function') {
                loadInsuranceCompanies();
            }
        });
        
        socket.on('insuranceDeleted', (data) => {
            console.log('Insurance deleted:', data);
            if (typeof loadInsuranceCompanies === 'function') {
                loadInsuranceCompanies();
            }
            if (typeof updateStatistics === 'function') {
                updateStatistics();
            }
        });
    }
}

// API Functions
const api = {
    // Authentication
    async login(username, password) {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }
        const user = await response.json();
        localStorage.setItem('currentUser', JSON.stringify(user));
        initSocket();
        return user;
    },
    
    // Clients
    async getClients() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const response = await fetch(`${API_BASE}/api/clients?username=${currentUser.username}&role=${currentUser.role}`);
        if (!response.ok) throw new Error('Failed to fetch clients');
        return await response.json();
    },
    
    async getClient(id) {
        const response = await fetch(`${API_BASE}/api/clients/${id}`);
        if (!response.ok) throw new Error('Failed to fetch client');
        return await response.json();
    },
    
    async createClient(clientData) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const response = await fetch(`${API_BASE}/api/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...clientData,
                id: Date.now(),
                addedBy: currentUser.username
            })
        });
        if (!response.ok) throw new Error('Failed to create client');
        return await response.json();
    },
    
    async updateClient(clientId, updates) {
        const response = await fetch(`${API_BASE}/api/clients/${clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update client');
        return await response.json();
    },
    
    async deleteClient(clientId) {
        const response = await fetch(`${API_BASE}/api/clients/${clientId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete client');
        return await response.json();
    },
    
    // Insurance
    async getInsurance() {
        try {
            console.log('Fetching insurance from:', `${API_BASE}/api/insurance`);
            const response = await fetch(`${API_BASE}/api/insurance`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Insurance API error:', response.status, errorText);
                throw new Error(`Failed to fetch insurance: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            console.log('Insurance data received:', data);
            return data;
        } catch (error) {
            console.error('Error in getInsurance:', error);
            throw error;
        }
    },
    
    async createInsurance(insuranceData) {
        const response = await fetch(`${API_BASE}/api/insurance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(insuranceData)
        });
        if (!response.ok) throw new Error('Failed to create insurance');
        return await response.json();
    },
    
    async updateInsurance(id, insuranceData) {
        const response = await fetch(`${API_BASE}/api/insurance/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(insuranceData)
        });
        if (!response.ok) throw new Error('Failed to update insurance');
        return await response.json();
    },
    
    async deleteInsurance(id) {
        const response = await fetch(`${API_BASE}/api/insurance/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete insurance');
        return await response.json();
    },
    
    // Export
    async exportData() {
        const response = await fetch(`${API_BASE}/api/export`);
        if (!response.ok) throw new Error('Failed to export data');
        const data = await response.json();
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `alamin-backup-${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return data;
    }
};

// Initialize socket on page load if user is logged in
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
        // Load socket.io script if not already loaded
        if (typeof io === 'undefined') {
            const script = document.createElement('script');
            script.src = `${API_BASE}/socket.io/socket.io.js`;
            script.onload = () => {
                initSocket();
            };
            document.head.appendChild(script);
        } else {
            initSocket();
        }
    }
});

