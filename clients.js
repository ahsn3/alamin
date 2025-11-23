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
        
        if (clients.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">لا توجد عملاء</td></tr>';
            return;
        }
        
        tableBody.innerHTML = clients.map(client => `
            <tr class="client-row" data-client-id="${client.id}" style="cursor: pointer;">
                <td data-label="الاسم"><a href="client-details.html?id=${client.id}" style="color: #2074b5; text-decoration: none; font-weight: 600;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${client.fullName || '-'}</a></td>
                <td data-label="الجنسية">${client.nationality || '-'}</td>
                <td data-label="الهاتف">${client.phone || '-'}</td>
                <td data-label="ملاحظات">${client.notes || '-'}</td>
                <td data-label="الإجراءات" onclick="event.stopPropagation();" style="display: flex; gap: 8px; align-items: center; justify-content: flex-start;">
                    <a href="client-details.html?id=${client.id}" class="btn btn-primary" style="padding: 8px 16px;">عرض</a>
                    <a href="add-client.html?id=${client.id}" class="btn btn-secondary" style="padding: 8px 16px;">تعديل</a>
                </td>
            </tr>
        `).join('');
        
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

