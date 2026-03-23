// ==================== إدارة المستخدمين والصلاحيات ====================
let currentUser = {
    loggedIn: false,
    name: "",
    role: ""
};

const users = {
    admin: { password: "admin123", name: "مدير النظام", permissions: ["all"] },
    accountant: { password: "acc123", name: "المحاسب", permissions: ["transactions", "reports", "settings"] },
    reception: { password: "rec123", name: "موظف الاستقبال", permissions: ["patients", "appointments", "transactions_view"] }
};

// ==================== هيكل البيانات الرئيسي ====================
let appData = {
    transactions: [],
    patients: [],
    staff: [],
    inventory: [],
    appointments: [],
    settings: {
        orgName: "المؤسسة الطبية",
        orgLicense: "",
        orgPhone: "",
        orgEmail: "",
        orgAddress: "",
        orgLogo: ""
    },
    lastBackup: null
};

// ==================== تحميل وحفظ البيانات ====================
function loadFromStorage() {
    const stored = localStorage.getItem("edartyProData");
    if (stored) {
        appData = JSON.parse(stored);
    } else {
        // بيانات تجريبية
        initSampleData();
    }
    renderAll();
}

function saveToStorage() {
    localStorage.setItem("edartyProData", JSON.stringify(appData));
}

function initSampleData() {
    appData.transactions = [
        { id: 1, type: "income", amount: 500, department: "clinic", category: "consultation", description: "استشارة طبية", patientName: "أحمد محمد", invoiceNumber: "INV-001", date: "2024-03-20" },
        { id: 2, type: "income", amount: 750, department: "clinic", category: "treatment", description: "جلسة علاج طبيعي", patientName: "سارة علي", invoiceNumber: "INV-002", date: "2024-03-20" },
        { id: 3, type: "expense", amount: 2000, department: "general", category: "salary", description: "رواتب الموظفين", patientName: "", invoiceNumber: "EXP-001", date: "2024-03-19" }
    ];
    
    appData.patients = [
        { id: 1, name: "أحمد محمد", phone: "0501234567", email: "ahmed@email.com", birthdate: "1985-05-15", address: "الرياض", bloodType: "O+", medicalHistory: "لا يوجد", lastVisit: "2024-03-20", totalPaid: 500 },
        { id: 2, name: "سارة علي", phone: "0559876543", email: "sara@email.com", birthdate: "1990-08-22", address: "جدة", bloodType: "A+", medicalHistory: "حساسية", lastVisit: "2024-03-20", totalPaid: 750 }
    ];
    
    appData.staff = [
        { id: 1, name: "د. خالد محمد", type: "doctor", specialty: "باطنة", salary: 15000, phone: "0501112222", email: "khalid@clinic.com", hireDate: "2023-01-01" },
        { id: 2, name: "د. نورة أحمد", type: "doctor", specialty: "أطفال", salary: 12000, phone: "0503334444", email: "noura@clinic.com", hireDate: "2023-06-01" }
    ];
    
    appData.inventory = [
        { id: 1, name: "باراسيتامول", category: "أدوية", quantity: 100, purchasePrice: 5, sellingPrice: 10, expiryDate: "2025-12-31", location: "المستودع A" }
    ];
    
    appData.appointments = [
        { id: 1, patientId: 1, patientName: "أحمد محمد", doctorId: 1, doctorName: "د. خالد محمد", date: "2024-03-21", time: "10:00", type: "استشارة", status: "مؤكد", notes: "" }
    ];
}

// ==================== وظائف مساعدة ====================
function showToast(msg, type = "info") {
    const toast = document.getElementById("toastMsg");
    const colors = { error: "#c53030", success: "#276749", info: "#2c3e50" };
    toast.style.backgroundColor = colors[type] || colors.info;
    toast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${msg}`;
    toast.style.opacity = "1";
    setTimeout(() => { toast.style.opacity = "0"; }, 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatCurrency(amount) {
    return amount.toFixed(2) + " ₪";
}

// ==================== دالة تسجيل الدخول الجديدة ====================
function initLogin() {
    const overlayLoginBtn = document.getElementById("overlayLoginBtn");
    const overlayRoleSelect = document.getElementById("overlayRoleSelect");
    const overlayPasswordInput = document.getElementById("overlayPasswordInput");
    const appOverlay = document.getElementById("appOverlay");
    const mainContent = document.getElementById("mainContent");
    
    overlayLoginBtn.onclick = () => {
        const role = overlayRoleSelect.value;
        const password = overlayPasswordInput.value;
        
        if (users[role] && users[role].password === password) {
            currentUser = { 
                loggedIn: true, 
                name: users[role].name, 
                role: role 
            };
            
            // تحديث شريط المستخدم
            const userNameSpan = document.getElementById("userName");
            const userRoleSpan = document.getElementById("userRole");
            const loginForm = document.getElementById("loginForm");
            const userInfo = document.getElementById("userInfo");
            
            if (userNameSpan) userNameSpan.textContent = currentUser.name;
            if (userRoleSpan) {
                userRoleSpan.textContent = role === "admin" ? "مدير" : role === "accountant" ? "محاسب" : "استقبال";
            }
            if (loginForm) loginForm.style.display = "none";
            if (userInfo) userInfo.style.display = "flex";
            
            // إخفاء طبقة التغطية وإظهار المحتوى
            appOverlay.classList.add("hidden");
            mainContent.classList.add("visible");
            document.body.classList.remove("loading");
            
            showToast(`مرحباً ${currentUser.name}`, "success");
            
            // تطبيق الصلاحيات
            applyPermissions();
            
            // إعادة تحميل البيانات
            renderAll();
        } else {
            showToast("كلمة المرور غير صحيحة", "error");
            overlayPasswordInput.value = "";
            overlayPasswordInput.focus();
        }
    };
    
    // إدخال كلمة المرور بالضغط على Enter
    overlayPasswordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            overlayLoginBtn.click();
        }
    });
}

// ==================== دالة تسجيل الخروج ====================
function logout() {
    currentUser = { loggedIn: false, name: "", role: "" };
    
    // إظهار طبقة التغطية وإخفاء المحتوى
    const appOverlay = document.getElementById("appOverlay");
    const mainContent = document.getElementById("mainContent");
    const overlayPasswordInput = document.getElementById("overlayPasswordInput");
    
    appOverlay.classList.remove("hidden");
    mainContent.classList.remove("visible");
    document.body.classList.add("loading");
    
    // مسح حقول تسجيل الدخول
    if (overlayPasswordInput) overlayPasswordInput.value = "";
    
    // تحديث شريط المستخدم
    const loginForm = document.getElementById("loginForm");
    const userInfo = document.getElementById("userInfo");
    if (loginForm) loginForm.style.display = "flex";
    if (userInfo) userInfo.style.display = "none";
    
    showToast("تم تسجيل الخروج بنجاح", "info");
}

// ==================== تعديل دالة applyPermissions ====================
function applyPermissions() {
    if (!currentUser.loggedIn) return;
    
    const permissions = users[currentUser.role].permissions;
    const tabBtns = document.querySelectorAll(".tab-btn");
    const addButtons = document.querySelectorAll(".btn-primary");
    
    // تمكين جميع الأزرار
    tabBtns.forEach(btn => btn.disabled = false);
    addButtons.forEach(btn => btn.disabled = false);
    
    // تطبيق الصلاحيات على التبويبات
    if (permissions[0] !== "all") {
        tabBtns.forEach(btn => {
            const tabId = btn.dataset.tab;
            if (!permissions.includes(tabId) && !permissions.includes(tabId + "_view")) {
                btn.style.display = "none";
            } else {
                btn.style.display = "flex";
            }
        });
    }
    
    // تعطيل أزرار معينة حسب الصلاحيات
    if (currentUser.role === "reception") {
        // موظف الاستقبال لا يمكنه إضافة معاملات مالية
        const addTransactionBtn = document.getElementById("addTransactionBtn");
        if (addTransactionBtn) addTransactionBtn.disabled = true;
    }
}

// ==================== تعديل دالة renderAll لمنع عرض البيانات قبل تسجيل الدخول ====================
function renderAll() {
    if (!currentUser.loggedIn) return;
    
    updateStats();
    renderRecentTransactions();
    renderTransactionsTable();
    renderPatientsTable();
    renderStaffTable();
    renderInventoryTable();
    renderAppointmentsTable();
    updateCharts();
    updateUpcomingAppointments();
    loadSettings();
}

// ==================== تعديل دالة init ====================
function init() {
    // إضافة class loading للجسم
    document.body.classList.add("loading");
    
    // إخفاء المحتوى الرئيسي في البداية
    const mainContent = document.getElementById("mainContent");
    if (mainContent) mainContent.classList.remove("visible");
    
    loadFromStorage();
    initLogin();
    initTabs();
    displayCurrentDate();
    initEventListeners();
    
    // تحديث قوائم المواعيد بعد تحميل البيانات
    updateAppointmentSelects();
}

// ==================== تحديث قوائم المواعيد ====================
function updateAppointmentSelects() {
    const patientSelect = document.getElementById("appointmentPatient");
    const doctorSelect = document.getElementById("appointmentDoctor");
    
    if (patientSelect) {
        patientSelect.innerHTML = '<option value="">اختر المريض</option>' + 
            appData.patients.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
    }
    if (doctorSelect) {
        doctorSelect.innerHTML = '<option value="">اختر الطبيب</option>' + 
            appData.staff.filter(s => s.type === "doctor").map(d => `<option value="${d.id}">${d.name}</option>`).join("");
    }
}

// ==================== تعديل دالة initEventListeners ====================
function initEventListeners() {
    // أزرار الإضافة
    document.getElementById("addTransactionBtn")?.addEventListener("click", addTransaction);
    document.getElementById("addPatientBtn")?.addEventListener("click", addPatient);
    document.getElementById("addStaffBtn")?.addEventListener("click", addStaff);
    document.getElementById("addItemBtn")?.addEventListener("click", addInventoryItem);
    document.getElementById("addAppointmentBtn")?.addEventListener("click", addAppointment);
    
    // الفلاتر
    document.getElementById("applyFiltersBtn")?.addEventListener("click", renderTransactionsTable);
    document.getElementById("resetFiltersBtn")?.addEventListener("click", () => {
        document.querySelectorAll("#transactions .filter-row input, #transactions .filter-row select").forEach(el => el.value = "");
        renderTransactionsTable();
    });
    
    // التقارير والتصدير
    document.getElementById("exportExcelBtn")?.addEventListener("click", exportToExcel);
    document.getElementById("generateReportBtn")?.addEventListener("click", generateReport);
    
    // النسخ الاحتياطي
    document.getElementById("backupExportBtn")?.addEventListener("click", exportBackup);
    document.getElementById("backupImportBtn")?.addEventListener("click", () => {
        const file = document.getElementById("backupFileInput").files[0];
        if (file) importBackup(file);
        else showToast("اختر ملفاً أولاً", "error");
    });
    document.getElementById("resetSystemBtn")?.addEventListener("click", resetSystem);
    document.getElementById("saveSettingsBtn")?.addEventListener("click", saveSettings);
    
    // البحث
    document.getElementById("searchPatientBtn")?.addEventListener("click", renderPatientsTable);
    document.getElementById("searchPatient")?.addEventListener("input", renderPatientsTable);
    
    // زر تسجيل الخروج
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.onclick = logout;
}
function applyPermissions() {
    const permissions = currentUser.role ? users[currentUser.role].permissions : [];
    const tabBtns = document.querySelectorAll(".tab-btn");
    const addButtons = document.querySelectorAll(".btn-primary:not(#loginBtn)");
    
    if (!currentUser.loggedIn) {
        tabBtns.forEach(btn => btn.disabled = true);
        addButtons.forEach(btn => btn.disabled = true);
        showToast("الرجاء تسجيل الدخول أولاً", "info");
    } else {
        tabBtns.forEach(btn => btn.disabled = false);
        addButtons.forEach(btn => btn.disabled = false);
        
        if (permissions[0] !== "all") {
            tabBtns.forEach(btn => {
                const tabId = btn.dataset.tab;
                if (!permissions.includes(tabId) && !permissions.includes(tabId + "_view")) {
                    btn.style.display = "none";
                }
            });
        }
    }
}

// ==================== عرض البيانات ====================
function renderAll() {
    updateStats();
    renderRecentTransactions();
    renderTransactionsTable();
    renderPatientsTable();
    renderStaffTable();
    renderInventoryTable();
    renderAppointmentsTable();
    updateCharts();
    updateUpcomingAppointments();
    loadSettings();
}

function updateStats() {
    const income = appData.transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = appData.transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;
    const inventoryValue = appData.inventory.reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0);
    const today = new Date().toISOString().split("T")[0];
    const todayAppointments = appData.appointments.filter(a => a.date === today).length;
    
    document.getElementById("totalRevenue").innerHTML = formatCurrency(income);
    document.getElementById("totalExpenses").innerHTML = formatCurrency(expense);
    document.getElementById("netProfit").innerHTML = formatCurrency(net);
    document.getElementById("totalPatients").innerHTML = appData.patients.length;
    document.getElementById("todayAppointments").innerHTML = todayAppointments;
    document.getElementById("inventoryValue").innerHTML = formatCurrency(inventoryValue);
    
    const netColor = net >= 0 ? "#2c7a47" : "#c53030";
    document.getElementById("netProfit").style.color = netColor;
}

function renderRecentTransactions() {
    const recent = [...appData.transactions].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
    const tbody = document.getElementById("recentTransactionsBody");
    if (!tbody) return;
    
    tbody.innerHTML = recent.map(t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td><span class="${t.type === 'income' ? 'badge-income' : 'badge-expense'}">${t.type === 'income' ? 'إيراد' : 'مصروف'}</span></td>
            <td>${formatCurrency(t.amount)}</td>
            <td>${t.description}</td>
            <td>${t.patientName || "—"}</td>
        </tr>
    `).join("");
}

let monthlyChart, distributionChart;

function updateCharts() {
    const monthlyData = {};
    appData.transactions.forEach(t => {
        const month = t.date.substring(0,7);
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
        if (t.type === "income") monthlyData[month].income += t.amount;
        else monthlyData[month].expense += t.amount;
    });
    
    const months = Object.keys(monthlyData).sort();
    const incomeData = months.map(m => monthlyData[m].income);
    const expenseData = months.map(m => monthlyData[m].expense);
    
    const monthlyCtx = document.getElementById("monthlyChart")?.getContext("2d");
    if (monthlyCtx) {
        if (monthlyChart) monthlyChart.destroy();
        monthlyChart = new Chart(monthlyCtx, {
            type: "bar",
            data: { labels: months, datasets: [
                { label: "إيرادات", data: incomeData, backgroundColor: "#2a6f97" },
                { label: "مصروفات", data: expenseData, backgroundColor: "#e67e22" }
            ]},
            options: { responsive: true, maintainAspectRatio: true }
        });
    }
    
    // توزيع الإيرادات حسب القسم
    const deptData = {};
    appData.transactions.filter(t => t.type === "income").forEach(t => {
        deptData[t.department] = (deptData[t.department] || 0) + t.amount;
    });
    
    const distCtx = document.getElementById("revenueDistributionChart")?.getContext("2d");
    if (distCtx) {
        if (distributionChart) distributionChart.destroy();
        distributionChart = new Chart(distCtx, {
            type: "pie",
            data: { labels: Object.keys(deptData), datasets: [{ data: Object.values(deptData), backgroundColor: ["#2a6f97", "#48a0c0", "#6bb5d0", "#8fcae0"] }] },
            options: { responsive: true }
        });
    }
}

// ==================== معاملات مالية ====================
function renderTransactionsTable() {
    let filtered = [...appData.transactions];
    const filterType = document.getElementById("filterType")?.value;
    const filterDept = document.getElementById("filterDepartment")?.value;
    const filterCat = document.getElementById("filterCategory")?.value;
    const searchText = document.getElementById("searchText")?.value.toLowerCase();
    const dateFrom = document.getElementById("filterDateFrom")?.value;
    const dateTo = document.getElementById("filterDateTo")?.value;
    const amountMin = parseFloat(document.getElementById("filterAmountMin")?.value);
    const amountMax = parseFloat(document.getElementById("filterAmountMax")?.value);
    
    if (filterType && filterType !== "all") filtered = filtered.filter(t => t.type === filterType);
    if (filterDept && filterDept !== "all") filtered = filtered.filter(t => t.department === filterDept);
    if (filterCat && filterCat !== "all") filtered = filtered.filter(t => t.category === filterCat);
    if (searchText) filtered = filtered.filter(t => t.description.toLowerCase().includes(searchText) || (t.patientName && t.patientName.toLowerCase().includes(searchText)));
    if (dateFrom) filtered = filtered.filter(t => t.date >= dateFrom);
    if (dateTo) filtered = filtered.filter(t => t.date <= dateTo);
    if (amountMin) filtered = filtered.filter(t => t.amount >= amountMin);
    if (amountMax) filtered = filtered.filter(t => t.amount <= amountMax);
    
    filtered.sort((a,b) => b.date.localeCompare(a.date));
    
    const tbody = document.getElementById("transactionsBody");
    if (!tbody) return;
    
    tbody.innerHTML = filtered.map((t, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>${formatDate(t.date)}</td>
            <td><span class="${t.type === 'income' ? 'badge-income' : 'badge-expense'}">${t.type === 'income' ? 'إيراد' : 'مصروف'}</span></td>
            <td>${formatCurrency(t.amount)}</td>
            <td>${getDepartmentName(t.department)}</td>
            <td>${getCategoryName(t.category)}</td>
            <td>${t.description}</td>
            <td>${t.patientName || "—"}</td>
            <td>${t.invoiceNumber || "—"}</td>
            <td class="action-icons">
                <i class="fas fa-edit" onclick="editTransaction(${t.id})"></i>
                <i class="fas fa-trash-alt" onclick="deleteTransaction(${t.id})"></i>
                <i class="fas fa-print" onclick="printTransaction(${t.id})"></i>
            </td>
        </tr>
    `).join("");
}

function getDepartmentName(dept) {
    const depts = { general: "عام", clinic: "عيادات", pharmacy: "صيدلية", lab: "مختبر", radiology: "أشعة" };
    return depts[dept] || dept;
}

function getCategoryName(cat) {
    const cats = { consultation: "استشارة", treatment: "علاج", medicines: "أدوية", salary: "رواتب", rent: "إيجار", equipment: "معدات" };
    return cats[cat] || cat;
}

function addTransaction() {
    const type = document.getElementById("transType").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const department = document.getElementById("department").value;
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const patientName = document.getElementById("patientName").value;
    const date = document.getElementById("transDate").value || new Date().toISOString().split("T")[0];
    const invoiceNumber = document.getElementById("invoiceNumber").value || `INV-${Date.now()}`;
    
    if (!amount || amount <= 0) return showToast("المبلغ غير صحيح", "error");
    if (!description) return showToast("الوصف مطلوب", "error");
    
    const newTrans = {
        id: Date.now(),
        type, amount, department, category, description,
        patientName, invoiceNumber, date
    };
    
    appData.transactions.push(newTrans);
    saveToStorage();
    renderAll();
    showToast("تمت إضافة المعاملة", "success");
    
    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";
}

function deleteTransaction(id) {
    if (confirm("هل أنت متأكد من حذف هذه المعاملة؟")) {
        appData.transactions = appData.transactions.filter(t => t.id !== id);
        saveToStorage();
        renderAll();
        showToast("تم الحذف", "success");
    }
}

function editTransaction(id) {
    const trans = appData.transactions.find(t => t.id === id);
    if (!trans) return;
    
    const newAmount = prompt("المبلغ الجديد:", trans.amount);
    if (newAmount && !isNaN(parseFloat(newAmount))) trans.amount = parseFloat(newAmount);
    const newDesc = prompt("الوصف الجديد:", trans.description);
    if (newDesc) trans.description = newDesc;
    
    saveToStorage();
    renderAll();
    showToast("تم التعديل", "success");
}

// ==================== إدارة المرضى ====================
function renderPatientsTable() {
    const search = document.getElementById("searchPatient")?.value.toLowerCase();
    let patients = [...appData.patients];
    if (search) patients = patients.filter(p => p.name.toLowerCase().includes(search) || p.phone.includes(search));
    
    const tbody = document.getElementById("patientsBody");
    if (!tbody) return;
    
    tbody.innerHTML = patients.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${p.phone}</td>
            <td>${p.email}</td>
            <td>${formatDate(p.lastVisit)}</td>
            <td>${formatCurrency(p.totalPaid)}</td>
            <td class="action-icons">
                <i class="fas fa-edit" onclick="editPatient(${p.id})"></i>
                <i class="fas fa-trash-alt" onclick="deletePatient(${p.id})"></i>
                <i class="fas fa-file-medical" onclick="viewPatientHistory(${p.id})"></i>
            </td>
        </tr>
    `).join("");
}

function addPatient() {
    const name = document.getElementById("patientFullName")?.value;
    const phone = document.getElementById("patientPhone")?.value;
    const email = document.getElementById("patientEmail")?.value;
    const birthdate = document.getElementById("patientBirthdate")?.value;
    const address = document.getElementById("patientAddress")?.value;
    const bloodType = document.getElementById("patientBloodType")?.value;
    const medicalHistory = document.getElementById("patientMedicalHistory")?.value;
    
    if (!name || !phone) return showToast("الاسم والهاتف مطلوبان", "error");
    
    const newPatient = {
        id: Date.now(),
        name, phone, email, birthdate, address, bloodType, medicalHistory,
        lastVisit: new Date().toISOString().split("T")[0],
        totalPaid: 0
    };
    
    appData.patients.push(newPatient);
    saveToStorage();
    renderAll();
    showToast("تمت إضافة المريض", "success");
    
    document.getElementById("patientFullName").value = "";
    document.getElementById("patientPhone").value = "";
}

function deletePatient(id) {
    if (confirm("هل أنت متأكد؟")) {
        appData.patients = appData.patients.filter(p => p.id !== id);
        saveToStorage();
        renderAll();
        showToast("تم الحذف", "success");
    }
}

// ==================== إدارة الأطباء والموظفين ====================
function renderStaffTable() {
    const tbody = document.getElementById("staffBody");
    if (!tbody) return;
    
    tbody.innerHTML = appData.staff.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>${s.type === "doctor" ? "طبيب" : s.type === "nurse" ? "ممرض" : s.type === "admin" ? "إداري" : "فني"}</td>
            <td>${s.specialty || "—"}</td>
            <td>${formatCurrency(s.salary)}</td>
            <td>${s.phone}</td>
            <td>${formatDate(s.hireDate)}</td>
            <td class="action-icons">
                <i class="fas fa-edit" onclick="editStaff(${s.id})"></i>
                <i class="fas fa-trash-alt" onclick="deleteStaff(${s.id})"></i>
            </td>
        </tr>
    `).join("");
}

function addStaff() {
    const name = document.getElementById("staffName")?.value;
    const type = document.getElementById("staffType")?.value;
    const specialty = document.getElementById("staffSpecialty")?.value;
    const salary = parseFloat(document.getElementById("staffSalary")?.value);
    const phone = document.getElementById("staffPhone")?.value;
    const email = document.getElementById("staffEmail")?.value;
    const hireDate = document.getElementById("staffHireDate")?.value || new Date().toISOString().split("T")[0];
    
    if (!name) return showToast("الاسم مطلوب", "error");
    
    const newStaff = { id: Date.now(), name, type, specialty, salary, phone, email, hireDate };
    appData.staff.push(newStaff);
    saveToStorage();
    renderAll();
    showToast("تمت إضافة الموظف", "success");
}

function deleteStaff(id) {
    if (confirm("هل أنت متأكد؟")) {
        appData.staff = appData.staff.filter(s => s.id !== id);
        saveToStorage();
        renderAll();
        showToast("تم الحذف", "success");
    }
}

// ==================== إدارة المخزون ====================
function renderInventoryTable() {
    const tbody = document.getElementById("inventoryBody");
    if (!tbody) return;
    
    tbody.innerHTML = appData.inventory.map(i => `
        <tr>
            <td>${i.name}</td>
            <td>${i.category}</td>
            <td>${i.quantity}</td>
            <td>${formatCurrency(i.purchasePrice)}</td>
            <td>${formatCurrency(i.sellingPrice)}</td>
            <td>${formatDate(i.expiryDate)}</td>
            <td>${formatCurrency(i.quantity * i.purchasePrice)}</td>
            <td class="action-icons">
                <i class="fas fa-edit" onclick="editItem(${i.id})"></i>
                <i class="fas fa-trash-alt" onclick="deleteItem(${i.id})"></i>
            </td>
        </tr>
    `).join("");
}

function addInventoryItem() {
    const name = document.getElementById("itemName")?.value;
    const category = document.getElementById("itemCategory")?.value;
    const quantity = parseInt(document.getElementById("itemQuantity")?.value);
    const purchasePrice = parseFloat(document.getElementById("itemPurchasePrice")?.value);
    const sellingPrice = parseFloat(document.getElementById("itemSellingPrice")?.value);
    const expiryDate = document.getElementById("itemExpiryDate")?.value;
    const location = document.getElementById("itemLocation")?.value;
    
    if (!name || !quantity) return showToast("اسم الصنف والكمية مطلوبان", "error");
    
    const newItem = { id: Date.now(), name, category, quantity, purchasePrice, sellingPrice, expiryDate, location };
    appData.inventory.push(newItem);
    saveToStorage();
    renderAll();
    showToast("تمت إضافة الصنف", "success");
}

function deleteItem(id) {
    if (confirm("هل أنت متأكد؟")) {
        appData.inventory = appData.inventory.filter(i => i.id !== id);
        saveToStorage();
        renderAll();
        showToast("تم الحذف", "success");
    }
}

// ==================== إدارة المواعيد ====================
function renderAppointmentsTable() {
    const tbody = document.getElementById("appointmentsBody");
    if (!tbody) return;
    
    tbody.innerHTML = appData.appointments.map(a => `
        <tr>
            <td>${a.patientName}</td>
            <td>${a.doctorName}</td>
            <td>${formatDate(a.date)}</td>
            <td>${a.time}</td>
            <td>${a.type}</td>
            <td><span class="${a.status === 'مؤكد' ? 'badge-income' : 'badge-expense'}">${a.status}</span></td>
            <td class="action-icons">
                <i class="fas fa-edit" onclick="editAppointment(${a.id})"></i>
                <i class="fas fa-trash-alt" onclick="deleteAppointment(${a.id})"></i>
            </td>
        </tr>
    `).join("");
}

function updateUpcomingAppointments() {
    const container = document.getElementById("upcomingAppointments");
    if (!container) return;
    
    const today = new Date().toISOString().split("T")[0];
    const upcoming = appData.appointments.filter(a => a.date >= today).sort((a,b) => a.date.localeCompare(b.date)).slice(0,5);
    
    container.innerHTML = upcoming.map(a => `
        <div style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
            <strong>${a.patientName}</strong> - ${formatDate(a.date)} ${a.time}<br>
            <small>${a.doctorName} | ${a.type}</small>
        </div>
    `).join("") || "<p>لا توجد مواعيد قادمة</p>";
}

function addAppointment() {
    const patientId = parseInt(document.getElementById("appointmentPatient")?.value);
    const doctorId = parseInt(document.getElementById("appointmentDoctor")?.value);
    const date = document.getElementById("appointmentDate")?.value;
    const time = document.getElementById("appointmentTime")?.value;
    const type = document.getElementById("appointmentType")?.value;
    const status = document.getElementById("appointmentStatus")?.value;
    const notes = document.getElementById("appointmentNotes")?.value;
    
    const patient = appData.patients.find(p => p.id === patientId);
    const doctor = appData.staff.find(s => s.id === doctorId && s.type === "doctor");
    
    if (!patient || !doctor) return showToast("اختر مريضاً وطبيباً", "error");
    if (!date || !time) return showToast("التاريخ والوقت مطلوبان", "error");
    
    const newAppointment = {
        id: Date.now(),
        patientId, patientName: patient.name,
        doctorId, doctorName: doctor.name,
        date, time, type, status, notes
    };
    
    appData.appointments.push(newAppointment);
    saveToStorage();
    renderAll();
    showToast("تم حجز الموعد", "success");
}

function deleteAppointment(id) {
    if (confirm("هل أنت متأكد؟")) {
        appData.appointments = appData.appointments.filter(a => a.id !== id);
        saveToStorage();
        renderAll();
        showToast("تم الحذف", "success");
    }
}

// ==================== النسخ الاحتياطي ====================
function exportBackup() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edarty_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    appData.lastBackup = new Date().toISOString();
    saveToStorage();
    showToast("تم تصدير النسخة الاحتياطية", "success");
}

function importBackup(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            appData = importedData;
            saveToStorage();
            renderAll();
            showToast("تم استعادة البيانات بنجاح", "success");
        } catch (err) {
            showToast("الملف غير صالح", "error");
        }
    };
    reader.readAsText(file);
}

function resetSystem() {
    if (confirm("تحذير: سيتم حذف جميع البيانات نهائياً! هل أنت متأكد؟")) {
        initSampleData();
        saveToStorage();
        renderAll();
        showToast("تم إعادة تعيين النظام", "success");
    }
}

function loadSettings() {
    document.getElementById("orgName").value = appData.settings.orgName;
    document.getElementById("orgLicense").value = appData.settings.orgLicense;
    document.getElementById("orgPhone").value = appData.settings.orgPhone;
    document.getElementById("orgEmail").value = appData.settings.orgEmail;
    document.getElementById("orgAddress").value = appData.settings.orgAddress;
    document.getElementById("orgLogo").value = appData.settings.orgLogo;
    
    if (appData.lastBackup) {
        document.getElementById("lastBackupTime").innerHTML = `آخر نسخة: ${new Date(appData.lastBackup).toLocaleString("ar-EG")}`;
    }
}

function saveSettings() {
    appData.settings = {
        orgName: document.getElementById("orgName").value,
        orgLicense: document.getElementById("orgLicense").value,
        orgPhone: document.getElementById("orgPhone").value,
        orgEmail: document.getElementById("orgEmail").value,
        orgAddress: document.getElementById("orgAddress").value,
        orgLogo: document.getElementById("orgLogo").value
    };
    saveToStorage();
    showToast("تم حفظ الإعدادات", "success");
}

// ==================== التقارير ====================
function generateReport() {
    const dateFrom = document.getElementById("reportDateFrom")?.value;
    const dateTo = document.getElementById("reportDateTo")?.value;
    const reportType = document.getElementById("reportType")?.value;
    const container = document.getElementById("reportContent");
    
    let html = `<div class="report-header">
        <h2>${appData.settings.orgName}</h2>
        <h3>${getReportTitle(reportType)}</h3>
        <p>الفترة: ${dateFrom || "البداية"} إلى ${dateTo || "الحالي"}</p>
    </div>`;
    
    if (reportType === "financial") {
        let filtered = [...appData.transactions];
        if (dateFrom) filtered = filtered.filter(t => t.date >= dateFrom);
        if (dateTo) filtered = filtered.filter(t => t.date <= dateTo);
        
        const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        
        html += `<div class="report-summary">
            <div class="summary-item"><strong>${formatCurrency(totalIncome)}</strong><br>إجمالي الإيرادات</div>
            <div class="summary-item"><strong>${formatCurrency(totalExpense)}</strong><br>إجمالي المصروفات</div>
            <div class="summary-item"><strong>${formatCurrency(totalIncome - totalExpense)}</strong><br>صافي الربح</div>
        </div>`;
        
        html += `<table border="1" style="width:100%; border-collapse:collapse;">
            <thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الوصف</th></tr></thead>
            <tbody>${filtered.map(t => `
                <tr><td>${formatDate(t.date)}</td><td>${t.type === "income" ? "إيراد" : "مصروف"}</td>
                <td>${formatCurrency(t.amount)}</td><td>${t.description}</td></tr>
            `).join("")}</tbody>
        </table>`;
    } else if (reportType === "patients") {
        html += `<table border="1" style="width:100%; border-collapse:collapse;">
            <thead><tr><th>الاسم</th><th>الهاتف</th><th>آخر زيارة</th><th>إجمالي المدفوعات</th></tr></thead>
            <tbody>${appData.patients.map(p => `
                <tr><td>${p.name}</td><td>${p.phone}</td><td>${formatDate(p.lastVisit)}</td><td>${formatCurrency(p.totalPaid)}</td></tr>
            `).join("")}</tbody>
        </table>`;
    }
    
    container.innerHTML = html;
    showToast("تم إنشاء التقرير", "success");
}

function getReportTitle(type) {
    const titles = { financial: "تقرير مالي", patients: "تقرير المرضى", doctors: "تقرير الأطباء", inventory: "تقرير المخزون", appointments: "تقرير المواعيد" };
    return titles[type] || "تقرير";
}

// ==================== تصدير Excel ====================
function exportToExcel() {
    const data = appData.transactions.map(t => ({
        "التاريخ": t.date,
        "النوع": t.type === "income" ? "إيراد" : "مصروف",
        "المبلغ": t.amount,
        "القسم": t.department,
        "الفئة": t.category,
        "الوصف": t.description,
        "المريض": t.patientName
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المعاملات");
    XLSX.writeFile(wb, `edarty_report_${new Date().toISOString().split("T")[0]}.xlsx`);
    showToast("تم تصدير التقرير", "success");
}

// ==================== تهيئة الصفحة ====================
function initTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");
    
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            const tabId = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove("active"));
            tabPanes.forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(tabId).classList.add("active");
        };
    });
}

function displayCurrentDate() {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateBox = document.getElementById("currentDate");
    if (dateBox) dateBox.innerHTML = `<i class="far fa-calendar-alt"></i> ${today.toLocaleDateString('ar-EG', options)}`;
}

function initEventListeners() {
    document.getElementById("addTransactionBtn")?.addEventListener("click", addTransaction);
    document.getElementById("addPatientBtn")?.addEventListener("click", addPatient);
    document.getElementById("addStaffBtn")?.addEventListener("click", addStaff);
    document.getElementById("addItemBtn")?.addEventListener("click", addInventoryItem);
    document.getElementById("addAppointmentBtn")?.addEventListener("click", addAppointment);
    document.getElementById("applyFiltersBtn")?.addEventListener("click", renderTransactionsTable);
    document.getElementById("resetFiltersBtn")?.addEventListener("click", () => {
        document.querySelectorAll("#transactions .filter-row input, #transactions .filter-row select").forEach(el => el.value = "");
        renderTransactionsTable();
    });
    document.getElementById("exportExcelBtn")?.addEventListener("click", exportToExcel);
    document.getElementById("backupExportBtn")?.addEventListener("click", exportBackup);
    document.getElementById("backupImportBtn")?.addEventListener("click", () => {
        const file = document.getElementById("backupFileInput").files[0];
        if (file) importBackup(file);
        else showToast("اختر ملفاً أولاً", "error");
    });
    document.getElementById("resetSystemBtn")?.addEventListener("click", resetSystem);
    document.getElementById("saveSettingsBtn")?.addEventListener("click", saveSettings);
    document.getElementById("generateReportBtn")?.addEventListener("click", generateReport);
    document.getElementById("searchPatientBtn")?.addEventListener("click", renderPatientsTable);
    document.getElementById("searchPatient")?.addEventListener("input", renderPatientsTable);
    
    // تعبئة قوائم المواعيد
    const patientSelect = document.getElementById("appointmentPatient");
    const doctorSelect = document.getElementById("appointmentDoctor");
    if (patientSelect) {
        patientSelect.innerHTML = '<option value="">اختر المريض</option>' + appData.patients.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
    }
    if (doctorSelect) {
        doctorSelect.innerHTML = '<option value="">اختر الطبيب</option>' + appData.staff.filter(s => s.type === "doctor").map(d => `<option value="${d.id}">${d.name}</option>`).join("");
    }
}

// ==================== بدء التطبيق ====================
function init() {
    loadFromStorage();
    initLogin();
    initTabs();
    displayCurrentDate();
    initEventListeners();
}

init();