// Client details page JavaScript

// Global handler functions for inline onclick
window.handleSaveReminder = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = parseInt(urlParams.get('id'));
    
    if (!clientId || isNaN(clientId)) {
        alert('خطأ: لم يتم العثور على معرف العميل');
        console.error('Invalid clientId:', clientId);
        return false;
    }
    
    console.log('handleSaveReminder called, clientId:', clientId);
    
    try {
        saveReminder(clientId);
    } catch (error) {
        console.error('Error in handleSaveReminder:', error);
        alert('حدث خطأ: ' + error.message);
    }
    
    return false;
};

window.handleClearReminder = function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = parseInt(urlParams.get('id'));
    
    if (!clientId) {
        return;
    }
    
    clearReminder(clientId);
};

// Define saveReminder function before DOMContentLoaded
const saveReminder = async (clientId) => {
    console.log('saveReminder called with clientId:', clientId);
    
    const reminderDateInput = document.getElementById('clientReminderDate');
    
    if (!reminderDateInput) {
        alert('عنصر الإدخال غير موجود');
        console.error('reminderDateInput not found');
        return false;
    }
    
    if (!reminderDateInput.value) {
        alert('يرجى تحديد تاريخ التذكير');
        return false;
    }
    
    console.log('Reminder date input value:', reminderDateInput.value);
    
    try {
        // Get client from API
        const client = await api.getClient(clientId);
        
        if (!client) {
            alert('العميل غير موجود');
            console.error('Client not found with id:', clientId);
            return false;
        }
        
        console.log('Found client:', client.fullName);
        
        // Parse and validate date
        const reminderDate = new Date(reminderDateInput.value);
        console.log('Parsed reminder date:', reminderDate);
        
        if (isNaN(reminderDate.getTime())) {
            alert('تاريخ غير صحيح');
            return false;
        }
        
        const reminderDateISO = reminderDate.toISOString();
        console.log('ISO date:', reminderDateISO);
        
        // Update client via API - explicitly include all required fields
        await api.updateClient(clientId, {
            fullName: client.fullName || '',
            nationality: client.nationality || '',
            passport: client.passport || '',
            phone: client.phone || '',
            email: client.email || '',
            address: client.address || '',
            notes: client.notes || '',
            clientStatus: client.clientStatus || '',
            reminderDate: reminderDateISO,
            transactions: client.transactions || [],
            files: client.files || []
        });
        
        // Reload client to get updated data
        const updatedClient = await api.getClient(clientId);
        if (updatedClient) {
            console.log('Reminder saved successfully');
            loadReminder(updatedClient);
            alert('تم حفظ التذكير بنجاح');
            return true;
        } else {
            alert('فشل في حفظ التذكير');
            return false;
        }
    } catch (error) {
        console.error('Error saving reminder:', error);
        alert('حدث خطأ أثناء حفظ التذكير: ' + error.message);
        return false;
    }
};

const clearReminder = async (clientId) => {
    if (!confirm('هل أنت متأكد من حذف التذكير؟')) return;
    
    try {
        // Get client from API
        const client = await api.getClient(clientId);
        
        if (!client) {
            alert('العميل غير موجود');
            return;
        }
        
        // Update client via API - explicitly include all required fields
        await api.updateClient(clientId, {
            fullName: client.fullName || '',
            nationality: client.nationality || '',
            passport: client.passport || '',
            phone: client.phone || '',
            email: client.email || '',
            address: client.address || '',
            notes: client.notes || '',
            clientStatus: client.clientStatus || '',
            reminderDate: null,
            transactions: client.transactions || [],
            files: client.files || []
        });
        
        // Reload client details
        await loadClientDetails(clientId);
        alert('تم حذف التذكير');
    } catch (error) {
        console.error('Error clearing reminder:', error);
        alert('حدث خطأ أثناء حذف التذكير: ' + error.message);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = checkAuth();
    if (!currentUser) return;

    const urlParams = new URLSearchParams(window.location.search);
    const clientId = parseInt(urlParams.get('id'));
    
    if (clientId) {
        await loadClientDetails(clientId);
    } else {
        window.location.href = 'clients.html';
    }
    
    const editClientBtn = document.getElementById('editClientBtn');
    if (editClientBtn) {
        editClientBtn.addEventListener('click', () => {
            window.location.href = `add-client.html?id=${clientId}`;
        });
    }
    
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => {
            openTransactionModal(clientId);
        });
    }
    
    // Setup transaction modal
    const transactionModal = document.getElementById('transactionModal');
    const closeTransactionModal = document.getElementById('closeTransactionModal');
    const cancelTransactionBtn = document.getElementById('cancelTransactionBtn');
    const transactionForm = document.getElementById('transactionForm');
    
    if (closeTransactionModal) {
        closeTransactionModal.addEventListener('click', () => {
            transactionModal.style.display = 'none';
        });
    }
    
    if (cancelTransactionBtn) {
        cancelTransactionBtn.addEventListener('click', () => {
            transactionModal.style.display = 'none';
        });
    }
    
    if (transactionForm) {
        transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveTransactionFromModal(clientId);
        });
    }
    
    window.onclick = (event) => {
        if (event.target === transactionModal) {
            transactionModal.style.display = 'none';
        }
        const editTransactionModal = document.getElementById('editTransactionModal');
        if (editTransactionModal && event.target === editTransactionModal) {
            editTransactionModal.style.display = 'none';
        }
    };
    
    // Setup edit transaction modal
    const editTransactionModal = document.getElementById('editTransactionModal');
    const closeEditTransactionModal = document.getElementById('closeEditTransactionModal');
    const cancelEditTransactionBtn = document.getElementById('cancelEditTransactionBtn');
    const editTransactionForm = document.getElementById('editTransactionForm');
    
    if (closeEditTransactionModal) {
        closeEditTransactionModal.addEventListener('click', () => {
            editTransactionModal.style.display = 'none';
        });
    }
    
    if (cancelEditTransactionBtn) {
        cancelEditTransactionBtn.addEventListener('click', () => {
            editTransactionModal.style.display = 'none';
        });
    }
    
    if (editTransactionForm) {
        editTransactionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveEditTransaction(clientId);
        });
    }
    
    const editTransactionBtn = document.getElementById('editTransactionBtn');
    if (editTransactionBtn) {
        editTransactionBtn.style.display = 'none'; // Hide the old edit button
    }
    
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            console.log('File input changed, clientId:', clientId);
            if (clientId) {
                handleFileUpload(e, clientId);
            } else {
                alert('خطأ: لم يتم العثور على معرف العميل');
            }
        });
    } else {
        console.warn('File input element not found');
    }
    
    // Setup reminder functionality - use event delegation to ensure it works
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'saveReminderBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Save reminder button clicked, clientId:', clientId);
            
            if (!clientId) {
                alert('خطأ: لم يتم العثور على معرف العميل');
                return;
            }
            
            saveReminder(clientId);
        }
        
        if (e.target && e.target.id === 'clearReminderBtn') {
            e.preventDefault();
            e.stopPropagation();
            
            if (!clientId) {
                return;
            }
            
            clearReminder(clientId);
        }
    });
    
    // Also set up direct event listeners as backup
    const saveReminderBtn = document.getElementById('saveReminderBtn');
    const clearReminderBtn = document.getElementById('clearReminderBtn');
    
    if (saveReminderBtn) {
        saveReminderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Save reminder clicked (direct listener), clientId:', clientId);
            
            if (!clientId) {
                alert('خطأ: لم يتم العثور على معرف العميل');
                return;
            }
            
            saveReminder(clientId);
        });
    }
    
    if (clearReminderBtn) {
        clearReminderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!clientId) {
                return;
            }
            
            clearReminder(clientId);
        });
    }
});

const loadClientDetails = async (clientId) => {
    try {
        console.log('Loading client details for ID:', clientId);
        const currentUser = getCurrentUser();
        
        if (!clientId || isNaN(clientId)) {
            alert('معرف العميل غير صحيح');
            window.location.href = 'clients.html';
            return;
        }
        
        const client = await api.getClient(clientId);
        console.log('Client data received:', client);
        console.log('Client fullName:', client?.fullName);
        console.log('Client nationality:', client?.nationality);
        console.log('Client passport:', client?.passport);
        console.log('Client phone:', client?.phone);
        console.log('Client email:', client?.email);
        console.log('Client address:', client?.address);
        console.log('Client notes:', client?.notes);
        
        if (!client) {
            alert('العميل غير موجود');
            window.location.href = 'clients.html';
            return;
        }
        
        // Check access
        if (currentUser && currentUser.role === 'staff' && client.addedBy && client.addedBy.toLowerCase() !== currentUser.username.toLowerCase()) {
            alert('ليس لديك صلاحية للوصول إلى هذا العميل');
            window.location.href = 'clients.html';
            return;
        }
        
        // Fill client information - with null checks
        const fullNameEl = document.getElementById('clientFullName');
        const nationalityEl = document.getElementById('clientNationality');
        const emailEl = document.getElementById('clientEmail');
        const addressEl = document.getElementById('clientAddress');
        const passportEl = document.getElementById('clientPassport');
        const phoneEl = document.getElementById('clientPhone');
        const clientStatusEl = document.getElementById('clientStatus');
        const notesEl = document.getElementById('clientNotes');
        
        console.log('Elements found:', {
            fullNameEl: !!fullNameEl,
            nationalityEl: !!nationalityEl,
            emailEl: !!emailEl,
            addressEl: !!addressEl,
            passportEl: !!passportEl,
            phoneEl: !!phoneEl,
            clientStatusEl: !!clientStatusEl,
            notesEl: !!notesEl
        });
        
        console.log('Client data to display:', {
            fullName: client.fullName,
            nationality: client.nationality,
            passport: client.passport,
            phone: client.phone,
            email: client.email,
            address: client.address,
            clientStatus: client.clientStatus,
            notes: client.notes
        });
        
        if (fullNameEl) {
            fullNameEl.textContent = (client.fullName && client.fullName.trim()) || '-';
            console.log('Set fullName to:', fullNameEl.textContent);
        }
        if (nationalityEl) {
            nationalityEl.textContent = (client.nationality && client.nationality.trim()) || '-';
            console.log('Set nationality to:', nationalityEl.textContent);
        }
        if (emailEl) {
            emailEl.textContent = (client.email && client.email.trim()) || 'غير متوفر';
            console.log('Set email to:', emailEl.textContent);
        }
        if (addressEl) {
            addressEl.textContent = (client.address && client.address.trim()) || 'غير متوفر';
            console.log('Set address to:', addressEl.textContent);
        }
        if (passportEl) {
            passportEl.textContent = (client.passport && client.passport.trim()) || '-';
            console.log('Set passport to:', passportEl.textContent);
        }
        if (phoneEl) {
            phoneEl.textContent = (client.phone && client.phone.trim()) || '-';
            console.log('Set phone to:', phoneEl.textContent);
        }
        if (clientStatusEl) {
            const getStatusColor = (status) => {
                const colors = {
                    'مهتم': '#3498db',
                    'تجديد': '#f39c12',
                    'مخالف': '#e74c3c',
                    'بانتظار الموعد': '#9b59b6',
                    'مكتمل': '#27ae60'
                };
                return colors[status] || '#95a5a6';
            };
            if (client.clientStatus) {
                const statusColor = getStatusColor(client.clientStatus);
                clientStatusEl.innerHTML = `<span style="display: inline-block; padding: 4px 10px; background: ${statusColor}; color: white; border-radius: 15px; font-size: 12px; font-weight: 600;">${client.clientStatus}</span>`;
            } else {
                clientStatusEl.textContent = '-';
            }
        }
        
        if (notesEl) {
            const notesText = (client.notes && client.notes.trim()) || '-';
            notesEl.textContent = notesText;
            notesEl.style.display = notesText === '-' ? 'none' : 'block';
            console.log('Set notes to:', notesText);
        }
        
        // Also show/hide the separate notes card if it exists
        const notesCard = document.getElementById('notesCard');
        if (notesCard) {
            const notesText = (client.notes && client.notes.trim()) || '';
            if (notesText) {
                notesCard.style.display = 'block';
                const notesCardContent = document.getElementById('clientNotes');
                if (notesCardContent && notesCardContent !== notesEl) {
                    notesCardContent.textContent = notesText;
                }
            } else {
                notesCard.style.display = 'none';
            }
        }
        
        // Load transactions
        loadTransactions(client);
        
        // Load files
        loadFiles(client);
        
        // Load reminder
        loadReminder(client);
    } catch (error) {
        console.error('Error loading client details:', error);
        alert('حدث خطأ في تحميل بيانات العميل: ' + error.message);
        window.location.href = 'clients.html';
    }
};

// Helper function to format numbers with commas
const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0.00';
    return parseFloat(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const loadTransactions = (client) => {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;
    
    if (!client.transactions || client.transactions.length === 0) {
        transactionsList.innerHTML = '<p>لا توجد معاملات</p>';
        return;
    }
    
    transactionsList.innerHTML = client.transactions.map(transaction => {
        const remaining = transaction.financial.due - transaction.financial.paid;
        const statusBadge = transaction.status ? `<span style="display: inline-block; padding: 5px 12px; background: ${getStatusColor(transaction.status)}; color: white; border-radius: 20px; font-size: 12px; font-weight: 600; margin-right: 10px;">${transaction.status}</span>` : '';
        const appointmentText = transaction.appointmentDate ? `لديه موعد ${transaction.appointmentDate}` : '';
        const notesText = transaction.notes ? `<p style="margin-top: 10px; color: #666;">${transaction.notes}</p>` : '';
        return `
            <div class="transaction-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3>${transaction.type}</h3>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        ${statusBadge}
                        <button class="btn btn-secondary" style="padding: 5px 12px; font-size: 12px;" onclick="openEditTransactionModal(${client.id}, ${transaction.id})">تعديل المعاملة</button>
                    </div>
                </div>
                ${appointmentText ? `<p>${appointmentText}</p>` : ''}
                ${notesText}
                <div class="financial-record">
                    <h4>السجل المالي لهذه المعاملة</h4>
                    <div class="financial-item" id="due_view_${client.id}_${transaction.id}">
                        <label>المستحق:</label>
                        <div>
                            <span class="amount">${transaction.financial.currency} ${formatNumber(transaction.financial.due)}</span>
                            <button class="btn btn-secondary" style="padding: 5px 10px; margin-right: 10px;" onclick="showEditFinancial('due', ${client.id}, ${transaction.id})">تعديل</button>
                        </div>
                    </div>
                    <div class="financial-item-edit" id="due_edit_${client.id}_${transaction.id}" style="display: none;">
                        <label>المستحق:</label>
                        <div class="financial-input-group">
                            <div class="number-input-wrapper">
                                <input type="number" 
                                       id="due_${client.id}_${transaction.id}" 
                                       value="${transaction.financial.due}" 
                                       step="0.01" 
                                       min="0"
                                       class="financial-number-input">
                                <div class="number-arrows">
                                    <button type="button" class="arrow-btn" onclick="incrementValue('due_${client.id}_${transaction.id}')">▲</button>
                                    <button type="button" class="arrow-btn" onclick="decrementValue('due_${client.id}_${transaction.id}')">▼</button>
                                </div>
                            </div>
                            <div class="currency-select-wrapper">
                                <select id="currency_due_${client.id}_${transaction.id}" class="currency-select">
                                    <option value="USD" ${transaction.financial.currency === 'USD' ? 'selected' : ''}>USD</option>
                                    <option value="TRY" ${transaction.financial.currency === 'TRY' ? 'selected' : ''}>TRY</option>
                                    <option value="EUR" ${transaction.financial.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                                </select>
                                <div class="number-arrows">
                                    <button type="button" class="arrow-btn" onclick="cycleCurrency('currency_due_${client.id}_${transaction.id}', 1)">▲</button>
                                    <button type="button" class="arrow-btn" onclick="cycleCurrency('currency_due_${client.id}_${transaction.id}', -1)">▼</button>
                                </div>
                            </div>
                            <button class="btn btn-primary" onclick="saveFinancial('due', ${client.id}, ${transaction.id})">حفظ</button>
                        </div>
                    </div>
                    <div class="financial-item" id="paid_view_${client.id}_${transaction.id}">
                        <label>المدفوع:</label>
                        <div>
                            <span class="amount">${transaction.financial.currency} ${formatNumber(transaction.financial.paid)}</span>
                            <button class="btn btn-secondary" style="padding: 5px 10px; margin-right: 10px;" onclick="showEditFinancial('paid', ${client.id}, ${transaction.id})">تعديل</button>
                        </div>
                    </div>
                    <div class="financial-item-edit" id="paid_edit_${client.id}_${transaction.id}" style="display: none;">
                        <label>المدفوع:</label>
                        <div class="financial-input-group">
                            <div class="number-input-wrapper">
                                <input type="number" 
                                       id="paid_${client.id}_${transaction.id}" 
                                       value="${transaction.financial.paid}" 
                                       step="0.01" 
                                       min="0"
                                       class="financial-number-input">
                                <div class="number-arrows">
                                    <button type="button" class="arrow-btn" onclick="incrementValue('paid_${client.id}_${transaction.id}')">▲</button>
                                    <button type="button" class="arrow-btn" onclick="decrementValue('paid_${client.id}_${transaction.id}')">▼</button>
                                </div>
                            </div>
                            <div class="currency-select-wrapper">
                                <select id="currency_paid_${client.id}_${transaction.id}" class="currency-select">
                                    <option value="USD" ${transaction.financial.currency === 'USD' ? 'selected' : ''}>USD</option>
                                    <option value="TRY" ${transaction.financial.currency === 'TRY' ? 'selected' : ''}>TRY</option>
                                    <option value="EUR" ${transaction.financial.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                                </select>
                                <div class="number-arrows">
                                    <button type="button" class="arrow-btn" onclick="cycleCurrency('currency_paid_${client.id}_${transaction.id}', 1)">▲</button>
                                    <button type="button" class="arrow-btn" onclick="cycleCurrency('currency_paid_${client.id}_${transaction.id}', -1)">▼</button>
                                </div>
                            </div>
                            <button class="btn btn-primary" onclick="saveFinancial('paid', ${client.id}, ${transaction.id})">حفظ</button>
                        </div>
                    </div>
                    <div class="financial-item">
                        <label>المتبقي:</label>
                        <span class="amount remaining">${transaction.financial.currency} ${formatNumber(remaining)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

const getStatusColor = (status) => {
    const colors = {
        'جديد': '#667eea',
        'قيد المعالجة': '#f39c12',
        'مكتمل': '#27ae60',
        'ملغي': '#e74c3c'
    };
    return colors[status] || '#667eea';
};

const loadFiles = (client) => {
    const filesTable = document.getElementById('filesTable');
    if (!filesTable) return;
    
    if (!client.files || client.files.length === 0) {
        filesTable.innerHTML = '<tr><td colspan="4" style="text-align: center;">لا توجد ملفات</td></tr>';
        return;
    }
    
    // Clear previous file storage
    if (!window.clientFiles) window.clientFiles = {};
    
    filesTable.innerHTML = client.files.map((file, index) => {
        const fileId = `file_${client.id}_${file.id || index}`;
        // Store file data in a global object for download
        window.clientFiles[fileId] = file.data || file.dataUrl || null;
        
        return `
        <tr>
            <td>${file.name}</td>
            <td>${file.type}</td>
            <td>${file.uploadDate}</td>
            <td><button class="btn btn-secondary" style="padding: 5px 10px;" onclick="downloadFile('${file.name.replace(/'/g, "\\'")}', '${fileId}')">تحميل</button></td>
        </tr>
        `;
    }).join('');
};

const openTransactionModal = (clientId) => {
    const transactionModal = document.getElementById('transactionModal');
    if (transactionModal) {
        // Reset form
        document.getElementById('transactionForm').reset();
        transactionModal.style.display = 'block';
        // Store clientId for later use
        transactionModal.setAttribute('data-client-id', clientId);
    }
};

const saveTransactionFromModal = async (clientId) => {
    const transactionType = document.getElementById('modalTransactionType').value;
    const transactionStatus = document.getElementById('modalTransactionStatus').value;
    const transactionNotes = document.getElementById('modalTransactionNotes').value;
    
    if (!transactionType || !transactionStatus) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    try {
        const client = await api.getClient(clientId);
        if (!client) {
            alert('العميل غير موجود');
            return;
        }
        
        if (!client.transactions) client.transactions = [];
        
        // Generate a smaller ID that fits in INTEGER (max 2147483647)
        // Use timestamp modulo to keep it small, or use a counter-based approach
        const transactionId = Math.floor(Date.now() / 1000) % 2147483647;
        
        const newTransaction = {
            id: transactionId,
            type: transactionType,
            status: transactionStatus,
            notes: transactionNotes || '',
            appointmentDate: '',
            financial: {
                due: 0,
                paid: 0,
                currency: 'USD'
            },
            createdAt: new Date().toISOString()
        };
        
        client.transactions.push(newTransaction);
        
        // Prepare update data - explicitly include all required fields
        const updateData = {
            fullName: client.fullName || '',
            nationality: client.nationality || '',
            passport: client.passport || '',
            phone: client.phone || '',
            email: client.email || '',
            address: client.address || '',
            notes: client.notes || '',
            clientStatus: client.clientStatus || '',
            reminderDate: client.reminderDate || null,
            transactions: client.transactions,
            files: client.files || []
        };
        
        // Validate required fields before sending
        if (!updateData.fullName || !updateData.nationality || !updateData.phone) {
            console.error('Missing required fields in client data:', {
                fullName: updateData.fullName,
                nationality: updateData.nationality,
                phone: updateData.phone,
                client: client
            });
            alert('خطأ: بيانات العميل غير مكتملة. يرجى التحقق من الاسم والجنسية ورقم الهاتف.');
            return;
        }
        
        console.log('Updating client with data:', updateData);
        
        // Update via API
        await api.updateClient(clientId, updateData);
        
        // Close modal
        const transactionModal = document.getElementById('transactionModal');
        if (transactionModal) {
            transactionModal.style.display = 'none';
        }
        
        await loadClientDetails(clientId);
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert('حدث خطأ أثناء حفظ المعاملة: ' + error.message);
    }
};

window.openEditTransactionModal = async (clientId, transactionId) => {
    try {
        const client = await api.getClient(clientId);
        const transaction = client.transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            alert('المعاملة غير موجودة');
            return;
        }
        
        // Populate edit transaction modal
        document.getElementById('editTransactionId').value = transactionId;
        document.getElementById('editTransactionType').value = transaction.type || '';
        document.getElementById('editTransactionStatus').value = transaction.status || '';
        document.getElementById('editTransactionDate').value = transaction.appointmentDate || '';
        document.getElementById('editTransactionNotes').value = transaction.notes || '';
        
        // Store clientId in modal for save function
        const editModal = document.getElementById('editTransactionModal');
        if (editModal) {
            editModal.setAttribute('data-client-id', clientId);
        }
        
        // Show modal
        editModal.style.display = 'block';
    } catch (error) {
        console.error('Error opening edit transaction modal:', error);
        alert('حدث خطأ أثناء فتح نموذج التعديل: ' + error.message);
    }
};

const saveEditTransaction = async (clientId) => {
    const transactionId = parseInt(document.getElementById('editTransactionId').value);
    const transactionType = document.getElementById('editTransactionType').value;
    const transactionStatus = document.getElementById('editTransactionStatus').value;
    const transactionDate = document.getElementById('editTransactionDate').value;
    const transactionNotes = document.getElementById('editTransactionNotes').value;
    
    if (!transactionType || !transactionStatus) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    try {
        const client = await api.getClient(clientId);
        if (!client) {
            alert('العميل غير موجود');
            return;
        }
        
        // Find and update the transaction
        const transactionIndex = client.transactions.findIndex(t => t.id === transactionId);
        if (transactionIndex === -1) {
            alert('المعاملة غير موجودة');
            return;
        }
        
        // Update transaction
        client.transactions[transactionIndex] = {
            ...client.transactions[transactionIndex],
            type: transactionType,
            status: transactionStatus,
            appointmentDate: transactionDate,
            notes: transactionNotes
        };
        
        // Update client via API - explicitly include all required fields
        await api.updateClient(clientId, {
            fullName: client.fullName || '',
            nationality: client.nationality || '',
            passport: client.passport || '',
            phone: client.phone || '',
            email: client.email || '',
            address: client.address || '',
            notes: client.notes || '',
            clientStatus: client.clientStatus || '',
            reminderDate: client.reminderDate || null,
            transactions: client.transactions,
            files: client.files || []
        });
        
        // Close modal
        document.getElementById('editTransactionModal').style.display = 'none';
        
        // Reload client details
        await loadClientDetails(clientId);
        
        alert('تم تحديث المعاملة بنجاح');
    } catch (error) {
        console.error('Error saving edited transaction:', error);
        alert('حدث خطأ أثناء حفظ التعديلات: ' + error.message);
    }
};

const editTransaction = async (clientId) => {
    // This function is kept for backward compatibility but now shows a message
    // Users should click "تعديل المعاملة" button on each transaction instead
    alert('يرجى النقر على زر "تعديل المعاملة" بجانب المعاملة التي تريد تعديلها');
};

window.showEditFinancial = (type, clientId, transactionId) => {
    // Hide view mode
    const viewElement = document.getElementById(`${type}_view_${clientId}_${transactionId}`);
    if (viewElement) {
        viewElement.style.display = 'none';
    }
    
    // Show edit mode
    const editElement = document.getElementById(`${type}_edit_${clientId}_${transactionId}`);
    if (editElement) {
        editElement.style.display = 'flex';
    }
};

window.incrementValue = (inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
        const step = parseFloat(input.step) || 0.01;
        input.value = (parseFloat(input.value) || 0) + step;
    }
};

window.decrementValue = (inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
        const step = parseFloat(input.step) || 0.01;
        const newValue = (parseFloat(input.value) || 0) - step;
        input.value = Math.max(0, newValue);
    }
};

window.cycleCurrency = (selectId, direction) => {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const currencies = ['USD', 'TRY', 'EUR'];
    const currentIndex = currencies.indexOf(select.value);
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) newIndex = currencies.length - 1;
    if (newIndex >= currencies.length) newIndex = 0;
    
    select.value = currencies[newIndex];
};

window.saveFinancial = async (type, clientId, transactionId) => {
    try {
        const client = await api.getClient(clientId);
        if (!client || !client.transactions) {
            alert('العميل غير موجود أو لا توجد معاملات');
            return;
        }
        
        const transaction = client.transactions.find(t => t.id === transactionId);
        if (!transaction) {
            alert('المعاملة غير موجودة');
            return;
        }
        
        const valueInput = document.getElementById(`${type}_${clientId}_${transactionId}`);
        const currencySelect = document.getElementById(`currency_${type}_${clientId}_${transactionId}`);
        
        if (!valueInput || !currencySelect) {
            alert('عناصر الإدخال غير موجودة');
            return;
        }
        
        const newValue = parseFloat(valueInput.value);
        const newCurrency = currencySelect.value;
        
        if (!isNaN(newValue) && newValue >= 0) {
            transaction.financial[type] = newValue;
            // Update currency for the transaction (affects both due and paid)
            transaction.financial.currency = newCurrency;
            
            // Sync the other currency selector
            const otherType = type === 'due' ? 'paid' : 'due';
            const otherCurrencySelect = document.getElementById(`currency_${otherType}_${clientId}_${transactionId}`);
            if (otherCurrencySelect) {
                otherCurrencySelect.value = newCurrency;
            }
            
            // Update via API - explicitly include all required fields
            await api.updateClient(clientId, {
                fullName: client.fullName || '',
                nationality: client.nationality || '',
                passport: client.passport || '',
                phone: client.phone || '',
                email: client.email || '',
                address: client.address || '',
                notes: client.notes || '',
                clientStatus: client.clientStatus || '',
                reminderDate: client.reminderDate || null,
                transactions: client.transactions,
                files: client.files || []
            });
            
            await loadClientDetails(clientId);
        } else {
            alert('يرجى إدخال قيمة صحيحة');
        }
    } catch (error) {
        console.error('Error saving financial data:', error);
        alert('حدث خطأ أثناء حفظ البيانات المالية: ' + error.message);
    }
};

const handleFileUpload = async (event, clientId) => {
    console.log('handleFileUpload called with clientId:', clientId);
    
    const files = event.target.files;
    if (!files || files.length === 0) {
        console.log('No files selected');
        return;
    }
    
    if (!clientId || isNaN(clientId)) {
        alert('خطأ: معرف العميل غير صحيح');
        console.error('Invalid clientId:', clientId);
        return;
    }
    
    console.log('Files selected:', files.length);
    
    try {
        console.log('Fetching client with ID:', clientId);
        const client = await api.getClient(parseInt(clientId));
        console.log('Client fetched:', client);
        
        if (!client) {
            alert('العميل غير موجود');
            console.error('Client not found with id:', clientId);
            return;
        }
        
        if (!client.files) client.files = [];
        
        // Preserve all existing client data
        const existingFiles = [...client.files];
        const existingTransactions = client.transactions || [];
        const existingReminderDate = client.reminderDate || null;
        
        let filesProcessed = 0;
        const totalFiles = files.length;
        const newFiles = [];
        
        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const newFile = {
                        id: Date.now() + index + Math.random(), // More unique ID
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        uploadDate: new Date().toLocaleString('ar-SA', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        }).replace(',', ''),
                        data: e.target.result // Store base64 data
                    };
                    
                    newFiles.push(newFile);
                    console.log('File processed:', file.name);
                    
                    filesProcessed++;
                    if (filesProcessed === totalFiles) {
                        // Combine existing and new files
                        const allFiles = [...existingFiles, ...newFiles];
                        
                        console.log('All files to save:', allFiles.length);
                        
                        // Update client via API - explicitly include all required fields
                        (async () => {
                            try {
                                await api.updateClient(clientId, {
                                    fullName: client.fullName || '',
                                    nationality: client.nationality || '',
                                    passport: client.passport || '',
                                    phone: client.phone || '',
                                    email: client.email || '',
                                    address: client.address || '',
                                    notes: client.notes || '',
                                    clientStatus: client.clientStatus || '',
                                    reminderDate: existingReminderDate,
                                    transactions: existingTransactions,
                                    files: allFiles
                                });
                                
                                console.log('Files saved successfully');
                                alert(`تم رفع ${newFiles.length} ملف بنجاح`);
                                await loadClientDetails(clientId);
                            } catch (error) {
                                console.error('Error saving files:', error);
                                alert('حدث خطأ أثناء رفع الملفات: ' + error.message);
                            }
                        })();
                        
                        // Reset file input
                        event.target.value = '';
                    }
                } catch (error) {
                    console.error('Error processing file:', error);
                    filesProcessed++;
                    if (filesProcessed === totalFiles) {
                        event.target.value = '';
                    }
                }
            };
            
            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                filesProcessed++;
                if (filesProcessed === totalFiles) {
                    alert('حدث خطأ أثناء قراءة بعض الملفات');
                    event.target.value = '';
                }
            };
            
            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('Error in handleFileUpload:', error);
        alert('حدث خطأ أثناء رفع الملفات: ' + error.message);
    }
};

// Helper function to format date in Gregorian calendar (ميلادي) with Arabic month names
const formatGregorianDate = (date) => {
    const arabicMonths = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    const day = date.getDate();
    const month = arabicMonths[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    const displayHours = hours % 12 || 12;
    
    return `${day} ${month} ${year}، ${displayHours}:${minutes} ${ampm}`;
};

const loadReminder = (client) => {
    const reminderDateInput = document.getElementById('clientReminderDate');
    const reminderDisplay = document.getElementById('reminderDisplay');
    const addReminderSection = document.getElementById('addReminderSection');
    const editReminderSection = document.getElementById('editReminderSection');
    const noReminderSection = document.getElementById('noReminderSection');
    
    if (!reminderDisplay) return;
    
    if (client.reminderDate) {
        // Client has a reminder - show it and allow editing
        const reminderDate = new Date(client.reminderDate);
        const formattedDate = formatGregorianDate(reminderDate);
        reminderDisplay.textContent = formattedDate;
        
        // Show edit section, hide add section
        if (editReminderSection) editReminderSection.style.display = 'block';
        if (addReminderSection) addReminderSection.style.display = 'none';
        if (noReminderSection) noReminderSection.style.display = 'none';
        
        // Set input value for datetime-local
        if (reminderDateInput) {
            const yearISO = reminderDate.getFullYear();
            const monthISO = String(reminderDate.getMonth() + 1).padStart(2, '0');
            const dayISO = String(reminderDate.getDate()).padStart(2, '0');
            const hoursISO = String(reminderDate.getHours()).padStart(2, '0');
            const minutesISO = String(reminderDate.getMinutes()).padStart(2, '0');
            reminderDateInput.value = `${yearISO}-${monthISO}-${dayISO}T${hoursISO}:${minutesISO}`;
        }
    } else {
        // No reminder - show "no reminder" message and "Add reminder" button
        reminderDisplay.textContent = 'لا يوجد تذكير محدد';
        
        // Show add section, hide edit section
        if (noReminderSection) noReminderSection.style.display = 'block';
        if (addReminderSection) addReminderSection.style.display = 'none';
        if (editReminderSection) editReminderSection.style.display = 'none';
        
        // Clear input
        if (reminderDateInput) reminderDateInput.value = '';
    }
};

window.showAddReminder = function() {
    const addReminderSection = document.getElementById('addReminderSection');
    const noReminderSection = document.getElementById('noReminderSection');
    const reminderDateInput = document.getElementById('clientReminderDate');
    
    if (addReminderSection) addReminderSection.style.display = 'block';
    if (noReminderSection) noReminderSection.style.display = 'none';
    
    // Set default date/time if not set
    if (reminderDateInput && !reminderDateInput.value) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        reminderDateInput.value = `${year}-${month}-${day}T12:00`;
    }
};

window.cancelAddReminder = function() {
    const addReminderSection = document.getElementById('addReminderSection');
    const noReminderSection = document.getElementById('noReminderSection');
    const reminderDateInput = document.getElementById('clientReminderDate');
    
    if (addReminderSection) addReminderSection.style.display = 'none';
    if (noReminderSection) noReminderSection.style.display = 'block';
    if (reminderDateInput) reminderDateInput.value = '';
};

window.downloadFile = (fileName, fileId) => {
    if (!window.clientFiles || !window.clientFiles[fileId] || window.clientFiles[fileId] === null) {
        alert(`الملف ${fileName} غير متوفر للتحميل`);
        return;
    }
    
    const fileData = window.clientFiles[fileId];
    
    try {
        // Handle base64 data
        let base64Data = fileData;
        if (typeof fileData === 'string' && fileData.includes(',')) {
            base64Data = fileData.split(',')[1];
        } else if (typeof fileData === 'string') {
            base64Data = fileData;
        } else {
            alert(`الملف ${fileName} غير متوفر للتحميل`);
            return;
        }
        
        // Decode base64
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        
        // Determine MIME type from file extension or stored type
        const extension = fileName.split('.').pop().toLowerCase();
        const mimeTypes = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        const mimeType = mimeTypes[extension] || 'application/octet-stream';
        
        const blob = new Blob([byteArray], { type: mimeType });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    } catch (error) {
        console.error('Error downloading file:', error);
        console.error('File data:', fileData);
        alert(`حدث خطأ أثناء تحميل الملف: ${fileName}. قد يكون الملف غير موجود أو تالف.`);
    }
};

