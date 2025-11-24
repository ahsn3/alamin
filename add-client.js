// Add/Edit Client JavaScript

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = checkAuth();
    if (!currentUser) return;

    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('id');
    
    // Setup reminder toggle
    const enableReminderCheckbox = document.getElementById('enableReminder');
    const reminderDateContainer = document.getElementById('reminderDateContainer');
    const reminderDateInput = document.getElementById('reminderDate');
    
    if (enableReminderCheckbox && reminderDateContainer) {
        enableReminderCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                reminderDateContainer.style.display = 'block';
                // Set default date/time if not already set
                if (reminderDateInput && !reminderDateInput.value) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    reminderDateInput.value = `${year}-${month}-${day}T12:00`;
                }
            } else {
                reminderDateContainer.style.display = 'none';
                if (reminderDateInput) {
                    reminderDateInput.value = '';
                }
            }
        });
    }
    
    if (clientId) {
        loadClientForEdit(parseInt(clientId));
        document.getElementById('pageTitle').textContent = 'تعديل بيانات العميل';
        // Hide transaction section when editing
        const transactionSection = document.querySelector('.transaction-section');
        if (transactionSection) transactionSection.style.display = 'none';
    } else {
        // Setup file upload display
        const fileInput = document.getElementById('clientFiles');
        const fileList = document.getElementById('fileList');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const files = e.target.files;
                if (files.length > 0) {
                    const fileNames = Array.from(files).map(f => f.name).join(', ');
                    fileList.textContent = `${files.length} ملف محدد: ${fileNames}`;
                    fileList.style.color = '#667eea';
                } else {
                    fileList.textContent = 'لا توجد ملفات محددة';
                    fileList.style.color = '#666';
                }
            });
        }
    }
    
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Validate required fields
            const fullName = document.getElementById('fullName').value.trim();
            const nationality = document.getElementById('nationality').value.trim();
            const passport = document.getElementById('passport').value.trim();
            const phone = document.getElementById('phone').value.trim();
            
            if (!fullName || !nationality || !passport || !phone) {
                alert('يرجى ملء جميع الحقول المطلوبة (الاسم الكامل، الجنسية، رقم الجواز، الهاتف)');
                return false;
            }
            
            console.log('Form submitted, saving client...');
            console.log('ClientId:', clientId);
            
            try {
                saveClient(clientId);
            } catch (error) {
                console.error('Error in form submit:', error);
                alert('حدث خطأ أثناء حفظ العميل: ' + error.message);
            }
            
            return false;
        });
    }
    
    // Also add direct button handler as backup
    const submitButton = clientForm ? clientForm.querySelector('button[type="submit"]') : null;
    if (submitButton) {
        submitButton.addEventListener('click', function(e) {
            console.log('Submit button clicked directly');
        });
    }
});

const loadClientForEdit = async (clientId) => {
    try {
        const client = await api.getClient(clientId);
        
        if (!client) {
            window.location.href = 'clients.html';
            return;
        }
        
        // Check access
        const currentUser = getCurrentUser();
        if (currentUser.role === 'staff' && client.addedBy && client.addedBy.toLowerCase() !== currentUser.username.toLowerCase()) {
            alert('ليس لديك صلاحية لتعديل هذا العميل');
            window.location.href = 'clients.html';
            return;
        }
        
        console.log('Loading client for edit:', client);
        
        document.getElementById('clientId').value = client.id;
        document.getElementById('fullName').value = client.fullName || '';
        document.getElementById('nationality').value = client.nationality || '';
        document.getElementById('passport').value = client.passport || '';
        document.getElementById('phone').value = client.phone || '';
        document.getElementById('email').value = client.email || '';
        document.getElementById('address').value = client.address || '';
        document.getElementById('notes').value = client.notes || '';
        
        // Load reminder date if exists
        const enableReminderCheckbox = document.getElementById('enableReminder');
        const reminderDateContainer = document.getElementById('reminderDateContainer');
        const reminderDateInput = document.getElementById('reminderDate');
        
        if (client.reminderDate) {
            // Enable reminder checkbox and show date container
            if (enableReminderCheckbox) {
                enableReminderCheckbox.checked = true;
            }
            if (reminderDateContainer) {
                reminderDateContainer.style.display = 'block';
            }
            
            // Convert ISO date to datetime-local format
            const reminderDate = new Date(client.reminderDate);
            const year = reminderDate.getFullYear();
            const month = String(reminderDate.getMonth() + 1).padStart(2, '0');
            const day = String(reminderDate.getDate()).padStart(2, '0');
            const hours = String(reminderDate.getHours()).padStart(2, '0');
            const minutes = String(reminderDate.getMinutes()).padStart(2, '0');
            if (reminderDateInput) {
                reminderDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
        } else {
            // No reminder, uncheck and hide
            if (enableReminderCheckbox) {
                enableReminderCheckbox.checked = false;
            }
            if (reminderDateContainer) {
                reminderDateContainer.style.display = 'none';
            }
            if (reminderDateInput) {
                reminderDateInput.value = '';
            }
        }
        
        // Show delete button when editing
        const deleteBtn = document.getElementById('deleteClientBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'inline-block';
        }
        
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = 'تعديل بيانات العميل';
        }
    } catch (error) {
        console.error('Error loading client:', error);
        alert('حدث خطأ في تحميل بيانات العميل');
        window.location.href = 'clients.html';
    }
};

window.deleteClient = async () => {
    const clientId = document.getElementById('clientId').value;
    
    if (!clientId) {
        alert('لا يمكن حذف عميل غير موجود');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟ سيتم حذف جميع بياناته وملفاته ومعاملاته بشكل نهائي.')) {
        return;
    }
    
    try {
        await api.deleteClient(parseInt(clientId));
        alert('تم حذف العميل بنجاح');
        window.location.href = 'clients.html';
    } catch (error) {
        console.error('Error deleting client:', error);
        alert('حدث خطأ أثناء حذف العميل: ' + error.message);
    }
};

const saveClient = async (clientId) => {
    console.log('saveClient called with clientId:', clientId);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('يجب تسجيل الدخول أولاً');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('Current user:', currentUser.username);
    
    // Get form values
    const fullNameEl = document.getElementById('fullName');
    const nationalityEl = document.getElementById('nationality');
    const passportEl = document.getElementById('passport');
    const phoneEl = document.getElementById('phone');
    const emailEl = document.getElementById('email');
    const addressEl = document.getElementById('address');
    const notesEl = document.getElementById('notes');
    
    if (!fullNameEl || !nationalityEl || !passportEl || !phoneEl) {
        alert('خطأ: بعض حقول النموذج غير موجودة');
        console.error('Missing form elements');
        return;
    }
    
    const clientData = {
        fullName: fullNameEl.value.trim(),
        nationality: nationalityEl.value.trim(),
        passport: passportEl.value.trim(),
        phone: phoneEl.value.trim(),
        email: emailEl ? emailEl.value.trim() : '',
        address: addressEl ? addressEl.value.trim() : '',
        notes: notesEl ? notesEl.value.trim() : ''
    };
    
    // Validate required fields
    if (!clientData.fullName || !clientData.nationality || !clientData.passport || !clientData.phone) {
        alert('يرجى ملء جميع الحقول المطلوبة (الاسم الكامل، الجنسية، رقم الجواز، الهاتف)');
        return;
    }
    
    console.log('Client data to save:', clientData);
    
    // Handle reminder date (only if enabled)
    const enableReminderCheckbox = document.getElementById('enableReminder');
    const reminderDateInput = document.getElementById('reminderDate');
    
    if (enableReminderCheckbox && enableReminderCheckbox.checked && reminderDateInput && reminderDateInput.value) {
        clientData.reminderDate = new Date(reminderDateInput.value).toISOString();
    } else if (clientId) {
        // Preserve existing reminder when editing (if it exists)
        try {
            const existingClient = await api.getClient(parseInt(clientId));
            if (existingClient && existingClient.reminderDate) {
                // Only keep existing reminder if checkbox is checked
                if (enableReminderCheckbox && enableReminderCheckbox.checked) {
                    clientData.reminderDate = existingClient.reminderDate;
                } else {
                    // Clear reminder if checkbox is unchecked
                    clientData.reminderDate = null;
                }
            } else {
                clientData.reminderDate = null;
            }
        } catch (e) {
            console.error('Error fetching existing client:', e);
            clientData.reminderDate = null;
        }
    } else {
        // New client without reminder checkbox checked
        clientData.reminderDate = null;
    }
    
    // Handle transactions
    let transactions = [];
    if (!clientId) {
        const transactionType = document.getElementById('transactionType').value;
        const transactionStatus = document.getElementById('transactionStatus').value;
        const transactionNotes = document.getElementById('transactionNotes').value;
        
        if (transactionType && transactionStatus) {
            transactions.push({
                id: Date.now(),
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
            });
        }
    }
    
    // Handle file uploads
    const fileInput = document.getElementById('clientFiles');
    
    if (clientId) {
        // Edit existing client
        try {
            const client = await api.getClient(parseInt(clientId));
            if (!client) {
                alert('العميل غير موجود');
                return;
            }
            
            // Check access
            if (currentUser.role === 'staff' && client.addedBy && client.addedBy.toLowerCase() !== currentUser.username.toLowerCase()) {
                alert('ليس لديك صلاحية لتعديل هذا العميل');
                return;
            }
            
            // Preserve existing files and transactions when updating
            const existingFiles = client.files || [];
            const existingTransactions = client.transactions || [];
            
            // Update the client
            await api.updateClient(parseInt(clientId), {
                fullName: clientData.fullName,
                nationality: clientData.nationality,
                passport: clientData.passport,
                phone: clientData.phone,
                email: clientData.email || '',
                address: clientData.address || '',
                notes: clientData.notes || '',
                reminderDate: clientData.reminderDate || null,
                files: existingFiles,
                transactions: existingTransactions
            });
            
            alert('تم تحديث بيانات العميل بنجاح');
            window.location.href = 'clients.html';
        } catch (error) {
            console.error('Error updating client:', error);
            alert('فشل في تحديث بيانات العميل: ' + error.message);
        }
        return;
    }
    
    // Add new client
    const saveNewClient = async (filesToSave = []) => {
        try {
            // Generate unique ID
            const newClientId = Date.now();
            
            const newClient = {
                id: newClientId,
                fullName: clientData.fullName,
                nationality: clientData.nationality,
                passport: clientData.passport,
                phone: clientData.phone,
                email: clientData.email || '',
                address: clientData.address || '',
                notes: clientData.notes || '',
                addedBy: currentUser.username,
                transactions: transactions || [],
                files: filesToSave || [],
                reminderDate: clientData.reminderDate || null
            };
            
            console.log('Saving new client via API:', newClient);
            
            // Save via API
            await api.createClient(newClient);
            
            console.log('Client saved successfully');
            alert('تم إضافة العميل بنجاح');
            setTimeout(() => {
                window.location.href = 'clients.html';
            }, 500);
        } catch (error) {
            console.error('Error saving new client:', error);
            alert('حدث خطأ أثناء حفظ العميل: ' + error.message);
        }
    };
    
    // If files are being read, process them
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        console.log('Processing', fileInput.files.length, 'files for new client');
        
        const processedFiles = [];
        let filesProcessed = 0;
        const totalFiles = fileInput.files.length;
        let hasError = false;
        
        Array.from(fileInput.files).forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    processedFiles.push({
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
                    });
                    
                    console.log('File processed:', file.name);
                    
                    filesProcessed++;
                    if (filesProcessed === totalFiles && !hasError) {
                        console.log('All files processed, saving client...');
                        saveNewClient(processedFiles);
                    }
                } catch (error) {
                    console.error('Error processing file:', error);
                    hasError = true;
                    filesProcessed++;
                    if (filesProcessed === totalFiles) {
                        alert('حدث خطأ أثناء معالجة بعض الملفات');
                        saveNewClient(processedFiles); // Save what we have
                    }
                }
            };
            
            reader.onerror = (error) => {
                console.error('FileReader error for file:', file.name, error);
                hasError = true;
                filesProcessed++;
                if (filesProcessed === totalFiles) {
                    alert('حدث خطأ أثناء قراءة بعض الملفات');
                    saveNewClient(processedFiles); // Save what we have
                }
            };
            
            reader.readAsDataURL(file);
        });
    } else {
        // No files to upload, save immediately
        console.log('No files to upload, saving client immediately');
        saveNewClient([]);
    }
};

