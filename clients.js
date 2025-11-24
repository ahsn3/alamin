// Clients page JavaScript

document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = checkAuth();
    if (!currentUser) return;

    await loadClients();
    
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    const searchInput = document.getElementById('searchInput');
    const nationalityFilter = document.getElementById('nationalityFilter');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', applyFilters);
    }
    if (nationalityFilter) {
        nationalityFilter.addEventListener('keyup', applyFilters);
    }
});

const loadClients = async (filteredClients = null) => {
    try {
        const tableBody = document.getElementById('clientsTable');
        if (!tableBody) {
            console.error('clientsTable element not found');
            return;
        }
        
        let clients = [];
        if (filteredClients) {
            clients = filteredClients;
        } else {
            console.log('Loading clients from API...');
            clients = await getAllClients();
            console.log('Clients loaded:', clients.length, clients);
        }
        
        const currentUser = getCurrentUser();
        const isManager = currentUser && currentUser.role === 'manager';
        
        // Show/hide "Added By" column header based on user role
        const addedByHeader = document.getElementById('addedByHeader');
        if (addedByHeader) {
            addedByHeader.style.display = isManager ? 'table-cell' : 'none';
        }
        
        if (clients.length === 0) {
            const colspan = isManager ? 8 : 7;
            tableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; padding: 20px;">لا توجد عملاء</td></tr>`;
            return;
        }
        
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
        
        tableBody.innerHTML = clients.map(client => {
            const statusBadge = client.clientStatus ? 
                `<span style="display: inline-block; padding: 4px 10px; background: ${getStatusColor(client.clientStatus)}; color: white; border-radius: 15px; font-size: 12px; font-weight: 600;">${client.clientStatus}</span>` : 
                '-';
            return `
            <tr class="client-row" data-client-id="${client.id}" style="cursor: pointer;">
                <td data-label="الاسم"><a href="client-details.html?id=${client.id}" style="color: #2074b5; text-decoration: none; font-weight: 600;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${client.fullName || '-'}</a></td>
                <td data-label="الجنسية">${client.nationality || '-'}</td>
                <td data-label="الهاتف">${client.phone || '-'}</td>
                <td data-label="حالة العميل">${statusBadge}</td>
                <td data-label="تاريخ التواصل">${formatReminderDate(client.reminderDate)}</td>
                ${isManager ? `<td data-label="أضيف بواسطة">${client.addedBy || '-'}</td>` : ''}
                <td data-label="ملاحظات">${client.notes || '-'}</td>
                <td data-label="الإجراءات" onclick="event.stopPropagation();" style="display: flex; gap: 8px; align-items: center; justify-content: flex-start;">
                    <a href="client-details.html?id=${client.id}" class="btn btn-primary" style="padding: 8px 16px;">عرض</a>
                    <a href="add-client.html?id=${client.id}" class="btn btn-secondary" style="padding: 8px 16px;">تعديل</a>
                </td>
            </tr>
        `;
        }).join('');
        
        // Add click event listeners to rows
        const rows = document.querySelectorAll('.client-row');
        rows.forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') {
                    const clientId = row.getAttribute('data-client-id');
                    window.location.href = `client-details.html?id=${clientId}`;
                }
            });
        });
    } catch (error) {
        console.error('Error loading clients:', error);
        const tableBody = document.getElementById('clientsTable');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #e74c3c;">حدث خطأ في تحميل العملاء: ' + error.message + '</td></tr>';
        }
    }
};

const applyFilters = async () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const nationalityTerm = document.getElementById('nationalityFilter').value.toLowerCase();
    
    let clients = await getAllClients();
    
    if (searchTerm) {
        clients = clients.filter(client => 
            client.fullName.toLowerCase().includes(searchTerm) ||
            (client.passport && client.passport.toLowerCase().includes(searchTerm))
        );
    }
    
    if (nationalityTerm) {
        clients = clients.filter(client => 
            client.nationality && client.nationality.toLowerCase().includes(nationalityTerm)
        );
    }
    
    loadClients(clients);
};

