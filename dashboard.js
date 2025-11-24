// Dashboard JavaScript

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

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = checkAuth();
    if (!currentUser) return;

    // Update statistics
    updateStatistics();
    
    // Load latest clients
    loadLatestClients();
    
    // Load reminders
    loadReminders();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Check for reminders and send notifications
    checkReminders();
    
    // Check reminders every minute
    setInterval(checkReminders, 60000);
});

const updateStatistics = async () => {
    try {
        const clients = await getAllClients();
        const insuranceCompanies = await getInsuranceCompanies();
        
        const totalClientsEl = document.getElementById('totalClients');
        const totalInsuranceEl = document.getElementById('totalInsurance');
        
        if (totalClientsEl) totalClientsEl.textContent = clients.length;
        if (totalInsuranceEl) totalInsuranceEl.textContent = insuranceCompanies.length;
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
};

const loadLatestClients = async () => {
    try {
        const clients = await getAllClients();
        const tableBody = document.getElementById('latestClientsTable');
        
        if (!tableBody) return;
        
        const currentUser = getCurrentUser();
        const isManager = currentUser && currentUser.role === 'manager';
        
        // Show/hide "Added By" column header based on user role
        const addedByHeader = document.getElementById('dashboardAddedByHeader');
        if (addedByHeader) {
            addedByHeader.style.display = isManager ? 'table-cell' : 'none';
        }
        
        // Sort by creation date descending to get latest
        const latestClients = [...clients].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        }).slice(0, 4);
        
        // Helper function to format reminder date
        const formatReminderDate = (reminderDate) => {
            if (!reminderDate) return 'لا يوجد تذكير';
            try {
                const date = new Date(reminderDate);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = date.getHours();
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const ampm = hours >= 12 ? 'م' : 'ص';
                const displayHours = hours % 12 || 12;
                return `${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
            } catch (e) {
                return 'لا يوجد تذكير';
            }
        };
        
        // Helper function to get status color
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
        
        tableBody.innerHTML = latestClients.map(client => {
            const statusBadge = client.clientStatus ? 
                `<span style="display: inline-block; padding: 4px 10px; background: ${getStatusColor(client.clientStatus)}; color: white; border-radius: 15px; font-size: 12px; font-weight: 600;">${client.clientStatus}</span>` : 
                '-';
            return `
            <tr>
                <td data-label="الاسم"><a href="client-details.html?id=${client.id}" style="color: #2074b5; text-decoration: none; font-weight: 600;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${client.fullName}</a></td>
                <td data-label="الجنسية">${client.nationality}</td>
                <td data-label="الهاتف">${client.phone}</td>
                <td data-label="حالة العميل">${statusBadge}</td>
                <td data-label="تاريخ التواصل">${formatReminderDate(client.reminderDate)}</td>
                ${isManager ? `<td data-label="أضيف بواسطة">${client.addedBy}</td>` : ''}
            </tr>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading latest clients:', error);
    }
};

const loadReminders = async () => {
    const remindersList = document.getElementById('remindersList');
    if (!remindersList) return;
    
    try {
        const clients = await getAllClients();
        const now = new Date();
        const upcomingReminders = [];
        
        clients.forEach(client => {
            if (client.reminderDate) {
                const reminderDate = new Date(client.reminderDate);
                const daysUntil = Math.ceil((reminderDate - now) / (1000 * 60 * 60 * 24));
                // Show all upcoming reminders (not just within 7 days)
                if (daysUntil >= 0) {
                    upcomingReminders.push({
                        client: client,
                        date: reminderDate,
                        daysUntil: daysUntil
                    });
                }
            }
        });
        
        // Sort by date (soonest first)
        upcomingReminders.sort((a, b) => a.date - b.date);
        
        if (upcomingReminders.length === 0) {
            remindersList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">لا توجد تذكيرات قادمة</p>';
            return;
        }
        
        remindersList.innerHTML = upcomingReminders.map(reminder => {
            // Format date in compact format (DD/MM/YYYY HH:MM AM/PM)
            const day = String(reminder.date.getDate()).padStart(2, '0');
            const month = String(reminder.date.getMonth() + 1).padStart(2, '0');
            const year = reminder.date.getFullYear();
            const hours = reminder.date.getHours();
            const minutes = String(reminder.date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'م' : 'ص';
            const displayHours = hours % 12 || 12;
            const formattedDate = `${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
            
            let urgencyClass = '';
            let urgencyText = '';
            if (reminder.daysUntil === 0) {
                urgencyClass = 'urgent';
                urgencyText = 'اليوم';
            } else if (reminder.daysUntil === 1) {
                urgencyClass = 'soon';
                urgencyText = 'غداً';
            } else {
                urgencyText = `بعد ${reminder.daysUntil} أيام`;
            }
            
            return `
                <div class="reminder-item ${urgencyClass}" style="display: flex; align-items: center; gap: 15px; padding: 12px 20px; margin-bottom: 10px;">
                    <div style="flex: 1; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                        <span style="font-weight: 600; color: #2074b5; min-width: 150px;">${reminder.client.fullName}</span>
                        <span style="color: #666; min-width: 180px;">${formattedDate}</span>
                        <span style="color: #666; min-width: 120px;">📞 ${reminder.client.phone || '-'}</span>
                        <span class="reminder-badge" style="margin: 0;">${urgencyText}</span>
                    </div>
                    <a href="client-details.html?id=${reminder.client.id}" class="btn btn-primary" style="padding: 6px 14px; white-space: nowrap;">عرض</a>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading reminders:', error);
        remindersList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">حدث خطأ في تحميل التذكيرات</p>';
    }
};

const requestNotificationPermission = () => {
    const requestBtn = document.getElementById('requestNotificationBtn');
    
    if (!('Notification' in window)) {
        if (requestBtn) requestBtn.style.display = 'none';
        return;
    }
    
    if (Notification.permission === 'granted') {
        if (requestBtn) requestBtn.style.display = 'none';
        return;
    }
    
    if (Notification.permission === 'denied') {
        if (requestBtn) requestBtn.style.display = 'none';
        return;
    }
    
    // Show button to request permission
    if (requestBtn) {
        requestBtn.style.display = 'inline-block';
        requestBtn.addEventListener('click', async () => {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                requestBtn.style.display = 'none';
                sendNotification('تم تفعيل الإشعارات', 'سيتم إرسال إشعارات عند حلول مواعيد التذكيرات');
            }
        });
    }
};

const checkReminders = async () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }
    
    try {
        const clients = await getAllClients();
        const now = new Date();
        const notifiedReminders = JSON.parse(localStorage.getItem('notifiedReminders') || '[]');
        
        clients.forEach(client => {
            if (client.reminderDate) {
                const reminderDate = new Date(client.reminderDate);
                const reminderId = `reminder_${client.id}_${reminderDate.getTime()}`;
                
                // Check if reminder is due (within next 5 minutes or past due)
                const timeDiff = reminderDate - now;
                const minutesUntil = timeDiff / (1000 * 60);
                
                // Notify if reminder is due (within 5 minutes) and not already notified
                if (minutesUntil <= 5 && minutesUntil >= -60 && !notifiedReminders.includes(reminderId)) {
                    // Format date in Gregorian calendar (ميلادي)
                    const formattedDate = formatGregorianDate(reminderDate);
                    
                    sendNotification(
                        `تذكير: ${client.fullName}`,
                        `موعد التواصل مع العميل: ${formattedDate}`
                    );
                    
                    notifiedReminders.push(reminderId);
                    localStorage.setItem('notifiedReminders', JSON.stringify(notifiedReminders));
                }
            }
        });
        
        // Reload reminders display
        loadReminders();
    } catch (error) {
        console.error('Error checking reminders:', error);
    }
};

const sendNotification = (title, body) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }
    
    new Notification(title, {
        body: body,
        icon: 'logo.JPG',
        badge: 'logo.JPG',
        tag: 'client-reminder',
        requireInteraction: false
    });
};

