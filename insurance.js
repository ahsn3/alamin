// Insurance Companies JavaScript

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = checkAuth();
    if (!currentUser) return;

    loadInsuranceCompanies();
    
    const addInsuranceBtn = document.getElementById('addInsuranceBtn');
    if (addInsuranceBtn) {
        addInsuranceBtn.addEventListener('click', () => {
            openInsuranceModal();
        });
    }
    
    const modal = document.getElementById('insuranceModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    const insuranceForm = document.getElementById('insuranceForm');
    if (insuranceForm) {
        insuranceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveInsuranceCompany();
        });
    }
});

const loadInsuranceCompanies = async () => {
    try {
        const companies = await getInsuranceCompanies();
        
        const trialCompanies = companies.filter(c => c.status === 'trial');
        const activeCompanies = companies.filter(c => c.status === 'active');
        const inactiveCompanies = companies.filter(c => c.status === 'inactive');
    
    // Load trial companies
    const trialContainer = document.getElementById('trialCompanies');
    if (trialContainer) {
        if (trialCompanies.length === 0) {
            trialContainer.innerHTML = '<div class="insurance-card"><p>لا توجد شركات في هذه الفئة حالياً.</p></div>';
        } else {
            trialContainer.innerHTML = trialCompanies.map(company => `
                <div class="insurance-card">
                    <div>
                        <p style="font-weight: 600; margin-bottom: 5px;">${company.name}</p>
                        <p style="color: #666; font-size: 14px;">${company.phone}</p>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-secondary" style="padding: 5px 15px;" onclick="editInsurance(${company.id})">تعديل</button>
                        <button class="btn btn-danger" style="padding: 5px 15px; background: #e74c3c;" onclick="deleteInsurance(${company.id})">حذف</button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Load active companies
    const activeContainer = document.getElementById('activeCompanies');
    if (activeContainer) {
        if (activeCompanies.length === 0) {
            activeContainer.innerHTML = '<div class="insurance-card"><p>لا توجد شركات في هذه الفئة حالياً.</p></div>';
        } else {
            activeContainer.innerHTML = activeCompanies.map(company => `
                <div class="insurance-card">
                    <div>
                        <p style="font-weight: 600; margin-bottom: 5px;">${company.name}</p>
                        <p style="color: #666; font-size: 14px;">${company.phone}</p>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-secondary" style="padding: 5px 15px;" onclick="editInsurance(${company.id})">تعديل</button>
                        <button class="btn btn-danger" style="padding: 5px 15px; background: #e74c3c;" onclick="deleteInsurance(${company.id})">حذف</button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Load inactive companies
    const inactiveContainer = document.getElementById('inactiveCompanies');
    if (inactiveContainer) {
        if (inactiveCompanies.length === 0) {
            inactiveContainer.innerHTML = '<div class="insurance-card"><p>لا توجد شركات في هذه الفئة حالياً.</p></div>';
        } else {
            inactiveContainer.innerHTML = inactiveCompanies.map(company => `
                <div class="insurance-card">
                    <div>
                        <p style="font-weight: 600; margin-bottom: 5px;">${company.name}</p>
                        <p style="color: #666; font-size: 14px;">${company.phone}</p>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-secondary" style="padding: 5px 15px;" onclick="editInsurance(${company.id})">تعديل</button>
                        <button class="btn btn-danger" style="padding: 5px 15px; background: #e74c3c;" onclick="deleteInsurance(${company.id})">حذف</button>
                    </div>
                </div>
            `).join('');
        }
    }
    } catch (error) {
        console.error('Error loading insurance companies:', error);
        alert('حدث خطأ في تحميل شركات التأمين');
    }
};

const openInsuranceModal = async (companyId = null) => {
    const modal = document.getElementById('insuranceModal');
    const form = document.getElementById('insuranceForm');
    const title = document.getElementById('modalTitle');
    
    if (companyId) {
        try {
            const companies = await getInsuranceCompanies();
            const company = companies.find(c => c.id === companyId);
            
            if (company) {
                title.textContent = 'تعديل شركة التأمين';
                document.getElementById('insuranceId').value = company.id;
                document.getElementById('insuranceName').value = company.name;
                document.getElementById('insurancePhone').value = company.phone || '';
                document.getElementById('insuranceStatus').value = company.status;
            }
        } catch (error) {
            console.error('Error loading insurance company:', error);
            alert('حدث خطأ في تحميل بيانات الشركة');
        }
    } else {
        title.textContent = 'إضافة شركة تأمين';
        form.reset();
        document.getElementById('insuranceId').value = '';
    }
    
    modal.style.display = 'block';
};

const saveInsuranceCompany = async () => {
    const companyId = document.getElementById('insuranceId').value;
    const name = document.getElementById('insuranceName').value;
    const phone = document.getElementById('insurancePhone').value;
    const status = document.getElementById('insuranceStatus').value;
    
    if (!name) {
        alert('يرجى إدخال اسم الشركة');
        return;
    }
    
    try {
        if (companyId) {
            // Edit existing
            await api.updateInsurance(parseInt(companyId), { name, phone, status });
            alert('تم تحديث شركة التأمين بنجاح');
        } else {
            // Add new
            await api.createInsurance({ name, phone, status });
            alert('تم إضافة شركة التأمين بنجاح');
        }
        
        document.getElementById('insuranceModal').style.display = 'none';
        await loadInsuranceCompanies();
    } catch (error) {
        console.error('Error saving insurance company:', error);
        alert('حدث خطأ أثناء حفظ شركة التأمين: ' + error.message);
    }
};

window.editInsurance = (companyId) => {
    openInsuranceModal(companyId);
};

window.deleteInsurance = async (companyId) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشركة؟')) {
        return;
    }
    
    try {
        await api.deleteInsurance(companyId);
        alert('تم حذف الشركة بنجاح');
        await loadInsuranceCompanies();
    } catch (error) {
        console.error('Error deleting insurance company:', error);
        alert('حدث خطأ أثناء حذف الشركة: ' + error.message);
    }
};

