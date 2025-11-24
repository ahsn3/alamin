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
    
    // Add event listeners for financial fields
    const dueInput = document.getElementById('insuranceDue');
    const paidInput = document.getElementById('insurancePaid');
    const currencySelect = document.getElementById('insuranceCurrency');
    
    if (dueInput) {
        dueInput.addEventListener('input', updateInsuranceRemaining);
    }
    if (paidInput) {
        paidInput.addEventListener('input', updateInsuranceRemaining);
    }
    if (currencySelect) {
        currencySelect.addEventListener('change', updateInsuranceRemaining);
    }
});

const loadInsuranceCompanies = async () => {
    try {
        console.log('Loading insurance companies...');
        const companies = await getInsuranceCompanies();
        console.log('Insurance companies loaded:', companies);
        
        const trialCompanies = companies.filter(c => c.status === 'trial');
        const activeCompanies = companies.filter(c => c.status === 'active');
        const inactiveCompanies = companies.filter(c => c.status === 'inactive');
    
    // Load trial companies
    const trialContainer = document.getElementById('trialCompanies');
    if (trialContainer) {
        if (trialCompanies.length === 0) {
            trialContainer.innerHTML = '<div class="insurance-card"><p>لا توجد شركات في هذه الفئة حالياً.</p></div>';
        } else {
            trialContainer.innerHTML = trialCompanies.map(company => {
                const due = company.due || 0;
                const paid = company.paid || 0;
                const remaining = due - paid;
                const currency = company.currency || 'USD';
                return `
                <div class="insurance-card">
                    <div>
                        <p style="font-weight: 600; margin-bottom: 5px;">${company.name}</p>
                        <p style="color: #666; font-size: 14px;">${company.phone}</p>
                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e8e8e8;">
                            <p style="font-size: 12px; color: #666; margin: 3px 0;">المستحق: <strong>${currency} ${due.toFixed(2)}</strong></p>
                            <p style="font-size: 12px; color: #666; margin: 3px 0;">المدفوع: <strong>${currency} ${paid.toFixed(2)}</strong></p>
                            <p style="font-size: 12px; color: ${remaining > 0 ? '#e74c3c' : '#27ae60'}; margin: 3px 0;">الباقي: <strong>${currency} ${remaining.toFixed(2)}</strong></p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-secondary" style="padding: 5px 15px;" onclick="editInsurance(${company.id})">تعديل</button>
                        <button class="btn btn-danger" style="padding: 5px 15px; background: #e74c3c;" onclick="deleteInsurance(${company.id})">حذف</button>
                    </div>
                </div>
            `;
            }).join('');
        }
    }
    
    // Load active companies
    const activeContainer = document.getElementById('activeCompanies');
    if (activeContainer) {
        if (activeCompanies.length === 0) {
            activeContainer.innerHTML = '<div class="insurance-card"><p>لا توجد شركات في هذه الفئة حالياً.</p></div>';
        } else {
            activeContainer.innerHTML = activeCompanies.map(company => {
                const due = company.due || 0;
                const paid = company.paid || 0;
                const remaining = due - paid;
                const currency = company.currency || 'USD';
                return `
                <div class="insurance-card">
                    <div>
                        <p style="font-weight: 600; margin-bottom: 5px;">${company.name}</p>
                        <p style="color: #666; font-size: 14px;">${company.phone}</p>
                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e8e8e8;">
                            <p style="font-size: 12px; color: #666; margin: 3px 0;">المستحق: <strong>${currency} ${due.toFixed(2)}</strong></p>
                            <p style="font-size: 12px; color: #666; margin: 3px 0;">المدفوع: <strong>${currency} ${paid.toFixed(2)}</strong></p>
                            <p style="font-size: 12px; color: ${remaining > 0 ? '#e74c3c' : '#27ae60'}; margin: 3px 0;">الباقي: <strong>${currency} ${remaining.toFixed(2)}</strong></p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-secondary" style="padding: 5px 15px;" onclick="editInsurance(${company.id})">تعديل</button>
                        <button class="btn btn-danger" style="padding: 5px 15px; background: #e74c3c;" onclick="deleteInsurance(${company.id})">حذف</button>
                    </div>
                </div>
            `;
            }).join('');
        }
    }
    
    // Load inactive companies
    const inactiveContainer = document.getElementById('inactiveCompanies');
    if (inactiveContainer) {
        if (inactiveCompanies.length === 0) {
            inactiveContainer.innerHTML = '<div class="insurance-card"><p>لا توجد شركات في هذه الفئة حالياً.</p></div>';
        } else {
            inactiveContainer.innerHTML = inactiveCompanies.map(company => {
                const due = company.due || 0;
                const paid = company.paid || 0;
                const remaining = due - paid;
                const currency = company.currency || 'USD';
                return `
                <div class="insurance-card">
                    <div>
                        <p style="font-weight: 600; margin-bottom: 5px;">${company.name}</p>
                        <p style="color: #666; font-size: 14px;">${company.phone}</p>
                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e8e8e8;">
                            <p style="font-size: 12px; color: #666; margin: 3px 0;">المستحق: <strong>${currency} ${due.toFixed(2)}</strong></p>
                            <p style="font-size: 12px; color: #666; margin: 3px 0;">المدفوع: <strong>${currency} ${paid.toFixed(2)}</strong></p>
                            <p style="font-size: 12px; color: ${remaining > 0 ? '#e74c3c' : '#27ae60'}; margin: 3px 0;">الباقي: <strong>${currency} ${remaining.toFixed(2)}</strong></p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-secondary" style="padding: 5px 15px;" onclick="editInsurance(${company.id})">تعديل</button>
                        <button class="btn btn-danger" style="padding: 5px 15px; background: #e74c3c;" onclick="deleteInsurance(${company.id})">حذف</button>
                    </div>
                </div>
            `;
            }).join('');
        }
    }
    } catch (error) {
        console.error('Error loading insurance companies:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        alert('حدث خطأ في تحميل شركات التأمين: ' + (error.message || 'خطأ غير معروف'));
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
                document.getElementById('insuranceDue').value = company.due || 0;
                document.getElementById('insurancePaid').value = company.paid || 0;
                document.getElementById('insuranceCurrency').value = company.currency || 'USD';
                updateInsuranceRemaining();
            }
        } catch (error) {
            console.error('Error loading insurance company:', error);
            alert('حدث خطأ في تحميل بيانات الشركة');
        }
    } else {
        title.textContent = 'إضافة شركة تأمين';
        form.reset();
        document.getElementById('insuranceId').value = '';
        document.getElementById('insuranceDue').value = 0;
        document.getElementById('insurancePaid').value = 0;
        document.getElementById('insuranceCurrency').value = 'USD';
        updateInsuranceRemaining();
    }
    
    modal.style.display = 'block';
};

// Update remaining amount display
const updateInsuranceRemaining = () => {
    const dueInput = document.getElementById('insuranceDue');
    const paidInput = document.getElementById('insurancePaid');
    const currencySelect = document.getElementById('insuranceCurrency');
    const remainingValueEl = document.getElementById('insuranceRemainingValue');
    const remainingCurrencyEl = document.getElementById('insuranceRemainingCurrency');
    const remainingEl = document.getElementById('insuranceRemaining');
    
    if (!dueInput || !paidInput || !currencySelect || !remainingValueEl || !remainingCurrencyEl || !remainingEl) {
        return;
    }
    
    const due = parseFloat(dueInput.value) || 0;
    const paid = parseFloat(paidInput.value) || 0;
    const currency = currencySelect.value;
    const remaining = due - paid;
    
    remainingValueEl.textContent = remaining.toFixed(2);
    remainingCurrencyEl.textContent = currency;
    
    if (remaining > 0) {
        remainingEl.style.color = '#e74c3c';
    } else {
        remainingEl.style.color = '#27ae60';
    }
};

window.incrementInsuranceValue = (inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
        const step = parseFloat(input.step) || 0.01;
        input.value = (parseFloat(input.value) || 0) + step;
        updateInsuranceRemaining();
    }
};

window.decrementInsuranceValue = (inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
        const step = parseFloat(input.step) || 0.01;
        const newValue = (parseFloat(input.value) || 0) - step;
        input.value = Math.max(0, newValue);
        updateInsuranceRemaining();
    }
};

const saveInsuranceCompany = async () => {
    const companyId = document.getElementById('insuranceId').value;
    const name = document.getElementById('insuranceName').value;
    const phone = document.getElementById('insurancePhone').value;
    const status = document.getElementById('insuranceStatus').value;
    const due = parseFloat(document.getElementById('insuranceDue').value) || 0;
    const paid = parseFloat(document.getElementById('insurancePaid').value) || 0;
    const currency = document.getElementById('insuranceCurrency').value;
    
    if (!name) {
        alert('يرجى إدخال اسم الشركة');
        return;
    }
    
    try {
        console.log('Saving insurance company:', { companyId, name, phone, status, due, paid, currency });
        
        if (companyId) {
            // Edit existing
            console.log('Updating insurance company:', companyId);
            const result = await api.updateInsurance(parseInt(companyId), { name, phone, status, due, paid, currency });
            console.log('Update result:', result);
            alert('تم تحديث شركة التأمين بنجاح');
        } else {
            // Add new
            console.log('Creating new insurance company');
            const result = await api.createInsurance({ name, phone, status, due, paid, currency });
            console.log('Create result:', result);
            alert('تم إضافة شركة التأمين بنجاح');
        }
        
        document.getElementById('insuranceModal').style.display = 'none';
        
        // Reload insurance companies
        console.log('Reloading insurance companies...');
        await loadInsuranceCompanies();
    } catch (error) {
        console.error('Error saving insurance company:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        alert('حدث خطأ أثناء حفظ شركة التأمين: ' + (error.message || 'خطأ غير معروف'));
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

