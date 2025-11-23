// Main application JavaScript
// Authentication and data management

// Initialize users
const initializeUsers = () => {
    const users = localStorage.getItem('users');
    if (!users) {
        const defaultUsers = [
            { username: 'Diaa', password: 'Diaa123', role: 'manager', name: 'Diaa' },
            { username: 'Ahmed', password: 'Ahmed123', role: 'staff', name: 'Ahmed' },
            { username: 'Maram', password: 'Maram123', role: 'staff', name: 'Maram' }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
};

// Initialize sample data
const initializeData = () => {
    // Clear sample clients if they exist
    const existingClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const sampleClientNames = ['رضا مصري', 'اشرف مصري تبع صلاح', 'محمد مجادمي', 'Mohamed Al Jarrah'];
    // Remove sample clients (those with specific names added by Ahmed)
    const filteredClients = existingClients.filter(client => 
        !(sampleClientNames.includes(client.fullName) && client.addedBy === 'Ahmed')
    );
    localStorage.setItem('clients', JSON.stringify(filteredClients));

    // Initialize insurance companies
    if (!localStorage.getItem('insuranceCompanies')) {
        const sampleInsurance = [
            {
                id: 1,
                name: '%77 خصم سموبوا',
                phone: '05359533528',
                status: 'trial'
            },
            {
                id: 2,
                name: 'احمد سكاريا - الأمين',
                phone: '05528964099',
                status: 'active'
            },
            {
                id: 3,
                name: 'الامين - Rota',
                phone: '05523048931',
                status: 'active'
            },
            {
                id: 4,
                name: 'عاكف 26 %',
                phone: '05525866646',
                status: 'active'
            }
        ];
        localStorage.setItem('insuranceCompanies', JSON.stringify(sampleInsurance));
    }
};

// Check authentication
const checkAuth = () => {
    const currentUser = localStorage.getItem('currentUser');
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('index.html') || 
                       currentPath.endsWith('/') || 
                       currentPath === '' ||
                       currentPath.endsWith('index.html');
    
    if (!currentUser && !isLoginPage) {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser ? JSON.parse(currentUser) : null;
};

// Get current user
const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

// Get all clients from storage (no filtering) - now uses API
let clientsCache = [];
let clientsCacheTime = 0;
const CACHE_DURATION = 5000; // 5 seconds

const getAllClientsFromStorage = async () => {
    try {
        const now = Date.now();
        if (clientsCache.length > 0 && (now - clientsCacheTime) < CACHE_DURATION) {
            return clientsCache;
        }
        clientsCache = await api.getClients();
        clientsCacheTime = now;
        return clientsCache;
    } catch (error) {
        console.error('Error fetching clients:', error);
        return [];
    }
};

// Get all clients (with access control) - now uses API
const getAllClients = async () => {
    try {
        return await api.getClients();
    } catch (error) {
        console.error('Error fetching clients:', error);
        return [];
    }
};

// Save clients (merges with existing clients to preserve data)
const saveClients = (clientsToSave) => {
    const currentUser = getCurrentUser();
    const allClients = getAllClientsFromStorage();
    
    let finalClients = [];
    
    if (currentUser && currentUser.role === 'manager') {
        // Manager can save the entire list
        finalClients = clientsToSave;
    } else if (currentUser && currentUser.role === 'staff') {
        // Staff: merge their clients with the full list
        clientsToSave.forEach(clientToSave => {
            const index = allClients.findIndex(c => c.id === clientToSave.id);
            if (index !== -1) {
                allClients[index] = clientToSave;
            } else {
                allClients.push(clientToSave);
            }
        });
        finalClients = allClients;
    } else {
        finalClients = clientsToSave;
    }
    
    // Add timestamps and save with sync
    finalClients = finalClients.map(client => ({
        ...client,
        lastUpdated: client.lastUpdated || Date.now()
    }));
    
    saveClientsWithSync(finalClients);
};

// Update a single client
const updateClient = (clientId, updates) => {
    try {
        console.log('updateClient called with clientId:', clientId, 'updates:', updates);
        
        // Get existing clients
        let allClients = [];
        try {
            const clientsStr = localStorage.getItem('clients');
            if (clientsStr) {
                allClients = JSON.parse(clientsStr);
            }
        } catch (e) {
            console.error('Error reading clients from storage:', e);
            return false;
        }
        
        const index = allClients.findIndex(c => c.id === clientId);
        
        if (index === -1) {
            console.error('Client not found with id:', clientId);
            return false;
        }
        
        // Preserve files and other important fields when updating
        const existingClient = allClients[index];
        console.log('Existing client:', existingClient);
        
        // Merge updates with existing client data
        const updatedClient = { 
            ...existingClient, 
            ...updates,
            id: clientId, // Ensure ID is preserved
            // Explicitly preserve files if not in updates
            files: updates.files !== undefined ? updates.files : (existingClient.files || []),
            // Preserve reminderDate if not in updates
            reminderDate: updates.reminderDate !== undefined ? updates.reminderDate : (existingClient.reminderDate || null)
        };
        
        console.log('Updated client:', updatedClient);
        
        allClients[index] = updatedClient;
        
        // Save to localStorage
        try {
            localStorage.setItem('clients', JSON.stringify(allClients));
            console.log('Client saved to localStorage');
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
        
        // Verify it was saved
        let verifyClients = [];
        try {
            const verifyStr = localStorage.getItem('clients');
            if (verifyStr) {
                verifyClients = JSON.parse(verifyStr);
            }
        } catch (e) {
            console.error('Error verifying clients:', e);
            return false;
        }
        
        const verifyClient = verifyClients.find(c => c.id === clientId);
        
        if (verifyClient) {
            console.log('Client updated successfully');
            return true;
        } else {
            console.error('Client was not saved properly');
            return false;
        }
    } catch (error) {
        console.error('Error updating client:', error);
        return false;
    }
};

// Get insurance companies - now uses API
let insuranceCache = [];
let insuranceCacheTime = 0;

const getInsuranceCompanies = async () => {
    try {
        const now = Date.now();
        if (insuranceCache.length > 0 && (now - insuranceCacheTime) < CACHE_DURATION) {
            return insuranceCache;
        }
        insuranceCache = await api.getInsurance();
        insuranceCacheTime = now;
        return insuranceCache;
    } catch (error) {
        console.error('Error fetching insurance:', error);
        return [];
    }
};

// Save insurance companies - now uses API
const saveInsuranceCompanies = async (companies) => {
    // This is now handled by individual API calls
    insuranceCache = companies;
    insuranceCacheTime = Date.now();
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const currentUser = checkAuth();
    if (currentUser) {
        const userNameElements = document.querySelectorAll('#userName, #mobileUserName');
        userNameElements.forEach(el => {
            if (el) el.textContent = currentUser.name;
        });
        
        // Initialize socket connection if not already done
        if (typeof initSocket === 'function' && typeof io !== 'undefined') {
            initSocket();
        }
    }
    
    // Logout functionality
    const logoutBtns = document.querySelectorAll('#logoutBtn');
    logoutBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            });
        }
    });
    
    // Mobile navbar setup
    const mobileNavbar = document.querySelector('.mobile-navbar');
    if (mobileNavbar) {
        // Set mobile navbar user name
        const mobileUserName = document.getElementById('mobileUserName');
        if (mobileUserName && currentUser) {
            mobileUserName.textContent = `مرحبا ${currentUser.name}`;
        }
        
        // Mobile logout button
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            });
        }
        
        // Set active link based on current page
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        mobileNavLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'dashboard.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Export Data functionality (backup only)
    const exportDataBtn = document.getElementById('exportDataBtn');
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', async () => {
            try {
                const data = await api.exportData();
                alert(`تم تصدير البيانات بنجاح!\n\n- ${data.clients.length} عميل\n- ${data.insuranceCompanies.length} شركة تأمين\n\nتم حفظ الملف للنسخ الاحتياطي.`);
            } catch (error) {
                console.error('Error exporting data:', error);
                alert('حدث خطأ أثناء تصدير البيانات: ' + error.message);
            }
        });
    }
});

// Export function is now handled by API in the event listener above

// Import all data from JSON file (with smart merging)
const importAllData = (file, silent = false) => {
    if (!silent && !confirm('سيتم دمج البيانات المستوردة مع البيانات الحالية تلقائياً.\n\n- البيانات الجديدة ستُضاف\n- البيانات الموجودة ستُحدّث إذا كانت أحدث\n- لن يتم فقدان أي بيانات\n\nهل تريد المتابعة؟')) {
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!importedData.clients || !Array.isArray(importedData.clients)) {
                throw new Error('تنسيق الملف غير صحيح - لا توجد بيانات عملاء');
            }
            
            if (!importedData.insuranceCompanies || !Array.isArray(importedData.insuranceCompanies)) {
                throw new Error('تنسيق الملف غير صحيح - لا توجد بيانات شركات تأمين');
            }
            
            // Merge clients (keep unique by ID)
            const existingClients = getAllClientsFromStorage();
            const importedClients = importedData.clients;
            
            // Create a map of existing clients by ID
            const existingClientsMap = new Map();
            existingClients.forEach(client => {
                existingClientsMap.set(client.id, client);
            });
            
            // Merge: keep the newer version if both exist, otherwise add new
            importedClients.forEach(importedClient => {
                const existingClient = existingClientsMap.get(importedClient.id);
                if (existingClient) {
                    // Compare timestamps if available, otherwise keep the one with more data
                    const existingUpdated = existingClient.lastUpdated || existingClient.id;
                    const importedUpdated = importedClient.lastUpdated || importedClient.id;
                    if (importedUpdated > existingUpdated) {
                        existingClientsMap.set(importedClient.id, importedClient);
                    }
                } else {
                    // New client, add it
                    existingClientsMap.set(importedClient.id, importedClient);
                }
            });
            
            // Convert map back to array
            const mergedClients = Array.from(existingClientsMap.values());
            
            // Merge insurance companies
            const existingInsurance = getInsuranceCompanies();
            const importedInsurance = importedData.insuranceCompanies;
            
            const existingInsuranceMap = new Map();
            existingInsurance.forEach(company => {
                existingInsuranceMap.set(company.id, company);
            });
            
            importedInsurance.forEach(importedCompany => {
                const existingCompany = existingInsuranceMap.get(importedCompany.id);
                if (existingCompany) {
                    // Keep newer version
                    const existingUpdated = existingCompany.lastUpdated || existingCompany.id;
                    const importedUpdated = importedCompany.lastUpdated || importedCompany.id;
                    if (importedUpdated > existingUpdated) {
                        existingInsuranceMap.set(importedCompany.id, importedCompany);
                    }
                } else {
                    existingInsuranceMap.set(importedCompany.id, importedCompany);
                }
            });
            
            const mergedInsurance = Array.from(existingInsuranceMap.values());
            
            // Save merged data
            localStorage.setItem('clients', JSON.stringify(mergedClients));
            saveInsuranceCompanies(mergedInsurance);
            
            // Update last sync time
            localStorage.setItem('lastDataSync', new Date().toISOString());
            
            if (!silent) {
                const newClients = mergedClients.length - existingClients.length;
                const updatedClients = mergedClients.filter(c => {
                    const existing = existingClients.find(ec => ec.id === c.id);
                    return existing && (c.lastUpdated || c.id) > (existing.lastUpdated || existing.id);
                }).length;
                const newInsurance = mergedInsurance.length - existingInsurance.length;
                
                let message = `تم دمج البيانات بنجاح!\n\n`;
                message += `- إجمالي العملاء: ${mergedClients.length}`;
                if (newClients > 0) message += ` (+${newClients} جديد)`;
                if (updatedClients > 0) message += ` (${updatedClients} محدث)`;
                message += `\n- إجمالي شركات التأمين: ${mergedInsurance.length}`;
                if (newInsurance > 0) message += ` (+${newInsurance} جديد)`;
                message += `\n\nسيتم تحديث الصفحة الآن.`;
                
                alert(message);
                
                // Reload page after 1 second
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                // Silent merge - just update without alert
                console.log('Data merged silently');
            }
            
        } catch (error) {
            console.error('Error importing data:', error);
            if (!silent) {
                alert('حدث خطأ أثناء استيراد البيانات: ' + error.message);
            }
        }
    };
    
    reader.onerror = () => {
        if (!silent) {
            alert('حدث خطأ أثناء قراءة الملف');
        }
    };
    
    reader.readAsText(file);
};

// Auto-sync data function - checks for shared sync file
const autoSyncData = () => {
    // Check if there's a sync file URL parameter (for future cloud sync)
    const urlParams = new URLSearchParams(window.location.search);
    const syncUrl = urlParams.get('sync');
    
    if (syncUrl) {
        // Future: fetch sync data from URL
        console.log('Sync URL detected:', syncUrl);
    }
    
    // Check if there's pending sync data in sessionStorage
    const pendingSync = sessionStorage.getItem('pendingSync');
    if (pendingSync) {
        try {
            const syncData = JSON.parse(pendingSync);
            console.log('Found pending sync data, merging...');
            mergeSyncData(syncData);
            sessionStorage.removeItem('pendingSync');
        } catch (error) {
            console.error('Error processing pending sync:', error);
        }
    }
    
    // Check last modification time and show sync reminder if needed
    const lastModification = localStorage.getItem('lastDataModification');
    const lastSyncReminder = localStorage.getItem('lastSyncReminder');
    const now = Date.now();
    
    // Show sync reminder every 24 hours if data was modified
    if (lastModification && (!lastSyncReminder || (now - parseInt(lastSyncReminder)) > 24 * 60 * 60 * 1000)) {
        const lastModTime = parseInt(lastModification);
        const hoursSinceMod = (now - lastModTime) / (1000 * 60 * 60);
        
        if (hoursSinceMod < 24) {
            // Data was modified recently, remind user to sync
            setTimeout(() => {
                if (confirm('تم تعديل البيانات مؤخراً. هل تريد تصدير البيانات لمزامنتها مع الأجهزة الأخرى؟')) {
                    exportAllData();
                    localStorage.setItem('lastSyncReminder', now.toString());
                }
            }, 2000);
        }
    }
};

// Merge sync data intelligently
const mergeSyncData = (syncData) => {
    try {
        const existingClients = getAllClientsFromStorage();
        const existingInsurance = getInsuranceCompanies();
        
        const syncClients = syncData.clients || [];
        const syncInsurance = syncData.insuranceCompanies || [];
        
        // Merge clients - keep the newest version
        const clientsMap = new Map();
        existingClients.forEach(client => {
            clientsMap.set(client.id, client);
        });
        
        syncClients.forEach(syncClient => {
            const existing = clientsMap.get(syncClient.id);
            if (!existing) {
                // New client, add it
                clientsMap.set(syncClient.id, syncClient);
            } else {
                // Compare timestamps
                const existingTime = existing.lastUpdated || existing.id;
                const syncTime = syncClient.lastUpdated || syncClient.id;
                if (syncTime > existingTime) {
                    // Sync version is newer, use it
                    clientsMap.set(syncClient.id, syncClient);
                }
            }
        });
        
        // Merge insurance companies
        const insuranceMap = new Map();
        existingInsurance.forEach(company => {
            insuranceMap.set(company.id, company);
        });
        
        syncInsurance.forEach(syncCompany => {
            const existing = insuranceMap.get(syncCompany.id);
            if (!existing) {
                insuranceMap.set(syncCompany.id, syncCompany);
            } else {
                const existingTime = existing.lastUpdated || existing.id;
                const syncTime = syncCompany.lastUpdated || syncCompany.id;
                if (syncTime > existingTime) {
                    insuranceMap.set(syncCompany.id, syncCompany);
                }
            }
        });
        
        // Save merged data
        const mergedClients = Array.from(clientsMap.values());
        const mergedInsurance = Array.from(insuranceMap.values());
        
        saveClientsWithSync(mergedClients);
        saveInsuranceWithSync(mergedInsurance);
        
        console.log('Data merged successfully');
        
        // Show notification if there were changes
        const newClients = mergedClients.length - existingClients.length;
        const updatedClients = mergedClients.filter(c => {
            const existing = existingClients.find(ec => ec.id === c.id);
            return existing && (c.lastUpdated || c.id) > (existing.lastUpdated || existing.id);
        }).length;
        
        if (newClients > 0 || updatedClients > 0) {
            console.log(`Synced: ${newClients} new clients, ${updatedClients} updated clients`);
            // Optionally show a subtle notification
            if (newClients > 0 || updatedClients > 0) {
                setTimeout(() => {
                    const notification = document.createElement('div');
                    notification.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #4CAF50; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.3);';
                    notification.textContent = `تم مزامنة البيانات: ${newClients > 0 ? newClients + ' عميل جديد' : ''} ${updatedClients > 0 ? updatedClients + ' تحديث' : ''}`;
                    document.body.appendChild(notification);
                    setTimeout(() => {
                        notification.remove();
                    }, 3000);
                }, 500);
            }
        }
    } catch (error) {
        console.error('Error merging sync data:', error);
    }
};

// Enhanced save functions that also update sync data
const saveClientsWithSync = (clients) => {
    localStorage.setItem('clients', JSON.stringify(clients));
    
    // Update shared sync data for cross-device sync
    const syncData = {
        clients: clients,
        insuranceCompanies: getInsuranceCompanies(),
        syncTime: new Date().toISOString(),
        lastModified: Date.now(),
        version: '1.0'
    };
    localStorage.setItem('sharedSyncData', JSON.stringify(syncData));
    localStorage.setItem('lastDataSync', new Date().toISOString());
    localStorage.setItem('lastDataModification', Date.now().toString());
    
    // Also store in sessionStorage for immediate sync if needed
    sessionStorage.setItem('latestSyncData', JSON.stringify(syncData));
};

const saveInsuranceWithSync = (companies) => {
    saveInsuranceCompanies(companies);
    
    // Update shared sync data
    const syncData = {
        clients: getAllClientsFromStorage(),
        insuranceCompanies: companies,
        syncTime: new Date().toISOString(),
        lastModified: Date.now(),
        version: '1.0'
    };
    localStorage.setItem('sharedSyncData', JSON.stringify(syncData));
    localStorage.setItem('lastDataSync', new Date().toISOString());
    localStorage.setItem('lastDataModification', Date.now().toString());
    
    // Also store in sessionStorage
    sessionStorage.setItem('latestSyncData', JSON.stringify(syncData));
};

