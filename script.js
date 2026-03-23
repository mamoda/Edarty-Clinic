// ==================== إدارة المستخدمين والصلاحيات ====================
let currentUser = {
    loggedIn: false,
    name: "",
    role: "",
};

const users = {
    admin: { password: "admin123", name: "مدير النظام", permissions: ["all"] },
    accountant: {
        password: "acc123",
        name: "المحاسب",
        permissions: ["transactions", "reports", "settings"],
    },
    reception: {
        password: "rec123",
        name: "موظف الاستقبال",
        permissions: ["patients", "appointments", "transactions_view"],
    },
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
        orgLogo: "",
    },
    lastBackup: null,
};

// ==================== تحميل وحفظ البيانات ====================
function loadFromStorage() {
    const stored = localStorage.getItem("edartyProData");
    if (stored) {
        appData = JSON.parse(stored);
    } else {
        initSampleData();
    }
}

function saveToStorage() {
    localStorage.setItem("edartyProData", JSON.stringify(appData));
}

function initSampleData() {
    appData.transactions = [
        {
            id: 1,
            type: "income",
            amount: 500,
            department: "clinic",
            category: "consultation",
            description: "استشارة طبية",
            patientName: "أحمد محمد",
            invoiceNumber: "INV-001",
            date: new Date().toISOString().split("T")[0],
        },
        {
            id: 2,
            type: "income",
            amount: 750,
            department: "clinic",
            category: "treatment",
            description: "جلسة علاج طبيعي",
            patientName: "سارة علي",
            invoiceNumber: "INV-002",
            date: new Date().toISOString().split("T")[0],
        },
        {
            id: 3,
            type: "expense",
            amount: 2000,
            department: "general",
            category: "salary",
            description: "رواتب الموظفين",
            patientName: "",
            invoiceNumber: "EXP-001",
            date: new Date().toISOString().split("T")[0],
        },
    ];

    appData.patients = [
        {
            id: 1,
            name: "أحمد محمد",
            phone: "0501234567",
            email: "ahmed@email.com",
            birthdate: "1985-05-15",
            address: "الرياض",
            bloodType: "O+",
            medicalHistory: "لا يوجد",
            lastVisit: new Date().toISOString().split("T")[0],
            totalPaid: 500,
        },
        {
            id: 2,
            name: "سارة علي",
            phone: "0559876543",
            email: "sara@email.com",
            birthdate: "1990-08-22",
            address: "جدة",
            bloodType: "A+",
            medicalHistory: "حساسية",
            lastVisit: new Date().toISOString().split("T")[0],
            totalPaid: 750,
        },
    ];

    appData.staff = [
        {
            id: 1,
            name: "د. خالد محمد",
            type: "doctor",
            specialty: "باطنة",
            salary: 15000,
            phone: "0501112222",
            email: "khalid@clinic.com",
            hireDate: "2023-01-01",
        },
        {
            id: 2,
            name: "د. نورة أحمد",
            type: "doctor",
            specialty: "أطفال",
            salary: 12000,
            phone: "0503334444",
            email: "noura@clinic.com",
            hireDate: "2023-06-01",
        },
    ];

    appData.inventory = [
        {
            id: 1,
            name: "باراسيتامول",
            category: "أدوية",
            quantity: 100,
            purchasePrice: 5,
            sellingPrice: 10,
            expiryDate: "2025-12-31",
            location: "المستودع A",
        },
    ];

    appData.appointments = [
        {
            id: 1,
            patientId: 1,
            patientName: "أحمد محمد",
            doctorId: 1,
            doctorName: "د. خالد محمد",
            date: new Date().toISOString().split("T")[0],
            time: "10:00",
            type: "استشارة",
            status: "مؤكد",
            notes: "",
        },
    ];
    
    saveToStorage();
}

// ==================== إدارة حالة تسجيل الدخول ====================
function saveLoginState() {
    if (currentUser.loggedIn) {
        localStorage.setItem("edartyLoginState", JSON.stringify({
            loggedIn: true,
            name: currentUser.name,
            role: currentUser.role
        }));
    } else {
        localStorage.removeItem("edartyLoginState");
    }
}

function restoreLoginSession() {
    const savedState = localStorage.getItem("edartyLoginState");
    if (savedState) {
        const state = JSON.parse(savedState);
        currentUser = {
            loggedIn: state.loggedIn,
            name: state.name,
            role: state.role
        };
        
        if (currentUser.loggedIn) {
            // تحديث واجهة المستخدم
            const userNameSpan = document.getElementById("userName");
            const userRoleSpan = document.getElementById("userRole");
            const loginForm = document.getElementById("loginForm");
            const userInfo = document.getElementById("userInfo");
            const appOverlay = document.getElementById("appOverlay");
            const mainContent = document.getElementById("mainContent");
            
            if (userNameSpan) userNameSpan.textContent = currentUser.name;
            if (userRoleSpan) {
                userRoleSpan.textContent = currentUser.role === "admin" ? "مدير" : 
                                          currentUser.role === "accountant" ? "محاسب" : "استقبال";
            }
            if (loginForm) loginForm.style.display = "none";
            if (userInfo) userInfo.style.display = "flex";
            
            // إخفاء طبقة التغطية وإظهار المحتوى
            if (appOverlay) appOverlay.classList.add("hidden");
            if (mainContent) mainContent.classList.add("visible");
            document.body.classList.remove("loading");
            
            return true;
        }
    }
    return false;
}

// ==================== وظائف مساعدة ====================
function showToast(msg, type = "info") {
    const toast = document.getElementById("toastMsg");
    if (!toast) return;
    const colors = { error: "#c53030", success: "#276749", info: "#2c3e50" };
    toast.style.backgroundColor = colors[type] || colors.info;
    toast.innerHTML = `<i class="fas ${type === "error" ? "fa-exclamation-circle" : "fa-check-circle"}"></i> ${msg}`;
    toast.style.opacity = "1";
    setTimeout(() => {
        toast.style.opacity = "0";
    }, 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatCurrency(amount) {
    return amount.toFixed(2) + " ₪";
}

function checkPermission(permission) {
    if (!currentUser.loggedIn) return false;
    const permissions = users[currentUser.role].permissions;
    return permissions[0] === "all" || permissions.includes(permission);
}

// ==================== دالة تسجيل الدخول ====================
function initLogin() {
    const overlayLoginBtn = document.getElementById("overlayLoginBtn");
    const overlayRoleSelect = document.getElementById("overlayRoleSelect");
    const overlayPasswordInput = document.getElementById("overlayPasswordInput");
    const appOverlay = document.getElementById("appOverlay");
    const mainContent = document.getElementById("mainContent");

    if (!overlayLoginBtn) return;

    overlayLoginBtn.onclick = () => {
        const role = overlayRoleSelect.value;
        const password = overlayPasswordInput.value;

        if (users[role] && users[role].password === password) {
            currentUser = {
                loggedIn: true,
                name: users[role].name,
                role: role,
            };

            saveLoginState();

            const userNameSpan = document.getElementById("userName");
            const userRoleSpan = document.getElementById("userRole");
            const loginForm = document.getElementById("loginForm");
            const userInfo = document.getElementById("userInfo");

            if (userNameSpan) userNameSpan.textContent = currentUser.name;
            if (userRoleSpan) {
                userRoleSpan.textContent =
                    role === "admin"
                        ? "مدير"
                        : role === "accountant"
                          ? "محاسب"
                          : "استقبال";
            }
            if (loginForm) loginForm.style.display = "none";
            if (userInfo) userInfo.style.display = "flex";

            if (appOverlay) appOverlay.classList.add("hidden");
            if (mainContent) mainContent.classList.add("visible");
            document.body.classList.remove("loading");

            showToast(`مرحباً ${currentUser.name}`, "success");

            applyPermissions();
            renderAll();
        } else {
            showToast("كلمة المرور غير صحيحة", "error");
            overlayPasswordInput.value = "";
            overlayPasswordInput.focus();
        }
    };

    overlayPasswordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            overlayLoginBtn.click();
        }
    });
}

// ==================== دالة تسجيل الخروج ====================
function logout() {
    currentUser = { loggedIn: false, name: "", role: "" };
    localStorage.removeItem("edartyLoginState");

    const appOverlay = document.getElementById("appOverlay");
    const mainContent = document.getElementById("mainContent");
    const overlayPasswordInput = document.getElementById("overlayPasswordInput");

    if (appOverlay) appOverlay.classList.remove("hidden");
    if (mainContent) mainContent.classList.remove("visible");
    document.body.classList.add("loading");

    if (overlayPasswordInput) overlayPasswordInput.value = "";

    const loginForm = document.getElementById("loginForm");
    const userInfo = document.getElementById("userInfo");
    if (loginForm) loginForm.style.display = "flex";
    if (userInfo) userInfo.style.display = "none";

    showToast("تم تسجيل الخروج بنجاح", "info");
}

// ==================== دالة تطبيق الصلاحيات ====================
function applyPermissions() {
    if (!currentUser.loggedIn) return;
    
    const permissions = users[currentUser.role].permissions;
    const tabBtns = document.querySelectorAll(".tab-btn");
    const addButtons = document.querySelectorAll(".btn-primary");
    
    // إظهار جميع الأزرار أولاً
    tabBtns.forEach(btn => {
        btn.disabled = false;
        btn.style.display = "flex";
    });
    addButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.display = "inline-flex";
    });
    
    // تطبيق الصلاحيات على التبويبات
    if (permissions[0] !== "all") {
        tabBtns.forEach(btn => {
            const tabId = btn.dataset.tab;
            if (!permissions.includes(tabId) && !permissions.includes(tabId + "_view")) {
                btn.style.display = "none";
            }
        });
    }
    
    // تعطيل أزرار معينة حسب الصلاحيات
    if (currentUser.role === "reception") {
        const addTransactionBtn = document.getElementById("addTransactionBtn");
        if (addTransactionBtn) addTransactionBtn.disabled = true;
    } else if (currentUser.role === "accountant") {
        const nonFinancialTabs = ["patients", "doctors", "inventory", "appointments"];
        tabBtns.forEach(btn => {
            const tabId = btn.dataset.tab;
            if (nonFinancialTabs.includes(tabId)) {
                btn.style.display = "none";
            }
        });
    }
}

// ==================== عرض البيانات ====================
function renderAll() {
    if (!currentUser.loggedIn) return;
    
    try {
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
        updateAppointmentSelects();
    } catch (error) {
        console.error("Error in renderAll:", error);
        showToast("حدث خطأ في عرض البيانات", "error");
    }
}

function updateStats() {
    if (!currentUser.loggedIn) return;
    
    try {
        const income = appData.transactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = appData.transactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);
        const net = income - expense;
        const inventoryValue = appData.inventory.reduce(
            (sum, i) => sum + i.quantity * i.purchasePrice,
            0,
        );
        const today = new Date().toISOString().split("T")[0];
        const todayAppointments = appData.appointments.filter(
            (a) => a.date === today,
        ).length;

        const revenueEl = document.getElementById("totalRevenue");
        const expensesEl = document.getElementById("totalExpenses");
        const profitEl = document.getElementById("netProfit");
        const patientsEl = document.getElementById("totalPatients");
        const appointmentsEl = document.getElementById("todayAppointments");
        const inventoryEl = document.getElementById("inventoryValue");
        
        if (revenueEl) revenueEl.innerHTML = formatCurrency(income);
        if (expensesEl) expensesEl.innerHTML = formatCurrency(expense);
        if (profitEl) {
            profitEl.innerHTML = formatCurrency(net);
            profitEl.style.color = net >= 0 ? "#2c7a47" : "#c53030";
        }
        if (patientsEl) patientsEl.innerHTML = appData.patients.length;
        if (appointmentsEl) appointmentsEl.innerHTML = todayAppointments;
        if (inventoryEl) inventoryEl.innerHTML = formatCurrency(inventoryValue);
    } catch (error) {
        console.error("Error in updateStats:", error);
    }
}

function renderRecentTransactions() {
    if (!currentUser.loggedIn) return;
    
    const recent = [...appData.transactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);
    const tbody = document.getElementById("recentTransactionsBody");
    if (!tbody) return;

    tbody.innerHTML = recent
        .map(
            (t) => `
                <tr>
                    <td>${formatDate(t.date)}</td>
                    <td><span class="${t.type === "income" ? "badge-income" : "badge-expense"}">${t.type === "income" ? "إيراد" : "مصروف"}</span></td>
                    <td>${formatCurrency(t.amount)}</td>
                    <td>${t.description}</td>
                    <td>${t.patientName || "—"}</td>
                </tr>
            `,
        )
        .join("");
}

let monthlyChart, distributionChart;

function updateCharts() {
    if (!currentUser.loggedIn) return;
    
    const monthlyData = {};
    appData.transactions.forEach((t) => {
        const month = t.date.substring(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
        if (t.type === "income") monthlyData[month].income += t.amount;
        else monthlyData[month].expense += t.amount;
    });

    const months = Object.keys(monthlyData).sort();
    const incomeData = months.map((m) => monthlyData[m].income);
    const expenseData = months.map((m) => monthlyData[m].expense);

    const monthlyCtx = document.getElementById("monthlyChart")?.getContext("2d");
    if (monthlyCtx) {
        if (monthlyChart) monthlyChart.destroy();
        monthlyChart = new Chart(monthlyCtx, {
            type: "bar",
            data: {
                labels: months,
                datasets: [
                    { label: "إيرادات", data: incomeData, backgroundColor: "#2a6f97" },
                    { label: "مصروفات", data: expenseData, backgroundColor: "#e67e22" },
                ],
            },
            options: { responsive: true, maintainAspectRatio: true },
        });
    }

    const deptData = {};
    appData.transactions
        .filter((t) => t.type === "income")
        .forEach((t) => {
            deptData[t.department] = (deptData[t.department] || 0) + t.amount;
        });

    const distCtx = document
        .getElementById("revenueDistributionChart")
        ?.getContext("2d");
    if (distCtx) {
        if (distributionChart) distributionChart.destroy();
        distributionChart = new Chart(distCtx, {
            type: "pie",
            data: {
                labels: Object.keys(deptData),
                datasets: [
                    {
                        data: Object.values(deptData),
                        backgroundColor: ["#2a6f97", "#48a0c0", "#6bb5d0", "#8fcae0"],
                    },
                ],
            },
            options: { responsive: true },
        });
    }
}

// ==================== معاملات مالية ====================
function renderTransactionsTable() {
    if (!currentUser.loggedIn) return;
    
    let filtered = [...appData.transactions];
    const filterType = document.getElementById("filterType")?.value;
    const filterDept = document.getElementById("filterDepartment")?.value;
    const filterCat = document.getElementById("filterCategory")?.value;
    const searchText = document.getElementById("searchText")?.value.toLowerCase();
    const dateFrom = document.getElementById("filterDateFrom")?.value;
    const dateTo = document.getElementById("filterDateTo")?.value;
    const amountMin = parseFloat(document.getElementById("filterAmountMin")?.value);
    const amountMax = parseFloat(document.getElementById("filterAmountMax")?.value);

    if (filterType && filterType !== "all")
        filtered = filtered.filter((t) => t.type === filterType);
    if (filterDept && filterDept !== "all")
        filtered = filtered.filter((t) => t.department === filterDept);
    if (filterCat && filterCat !== "all")
        filtered = filtered.filter((t) => t.category === filterCat);
    if (searchText)
        filtered = filtered.filter(
            (t) =>
                t.description.toLowerCase().includes(searchText) ||
                (t.patientName && t.patientName.toLowerCase().includes(searchText)),
        );
    if (dateFrom) filtered = filtered.filter((t) => t.date >= dateFrom);
    if (dateTo) filtered = filtered.filter((t) => t.date <= dateTo);
    if (amountMin) filtered = filtered.filter((t) => t.amount >= amountMin);
    if (amountMax) filtered = filtered.filter((t) => t.amount <= amountMax);

    filtered.sort((a, b) => b.date.localeCompare(a.date));

    const tbody = document.getElementById("transactionsBody");
    if (!tbody) return;

    tbody.innerHTML = filtered
        .map(
            (t, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${formatDate(t.date)}</td>
                    <td><span class="${t.type === "income" ? "badge-income" : "badge-expense"}">${t.type === "income" ? "إيراد" : "مصروف"}</span></td>
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
            `,
        )
        .join("");
}

function getDepartmentName(dept) {
    const depts = {
        general: "عام",
        clinic: "عيادات",
        pharmacy: "صيدلية",
        lab: "مختبر",
        radiology: "أشعة",
    };
    return depts[dept] || dept;
}

function getCategoryName(cat) {
    const cats = {
        consultation: "استشارة",
        treatment: "علاج",
        medicines: "أدوية",
        salary: "رواتب",
        rent: "إيجار",
        equipment: "معدات",
    };
    return cats[cat] || cat;
}

function addTransaction() {
    if (!checkPermission("transactions")) {
        showToast("ليس لديك صلاحية لإضافة معاملات", "error");
        return;
    }
    
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
        type,
        amount,
        department,
        category,
        description,
        patientName,
        invoiceNumber,
        date,
    };

    appData.transactions.push(newTrans);
    saveToStorage();
    renderAll();
    showToast("تمت إضافة المعاملة", "success");

    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";
}

function deleteTransaction(id) {
    if (!checkPermission("transactions")) {
        showToast("ليس لديك صلاحية لحذف المعاملات", "error");
        return;
    }
    
    if (confirm("هل أنت متأكد من حذف هذه المعاملة؟")) {
        appData.transactions = appData.transactions.filter((t) => t.id !== id);
        saveToStorage();
        renderAll();
        showToast("تم الحذف", "success");
    }
}

function editTransaction(id) {
    if (!checkPermission("transactions")) {
        showToast("ليس لديك صلاحية لتعديل المعاملات", "error");
        return;
    }
    
    const trans = appData.transactions.find((t) => t.id === id);
    if (!trans) return;

    const newAmount = prompt("المبلغ الجديد:", trans.amount);
    if (newAmount && !isNaN(parseFloat(newAmount)))
        trans.amount = parseFloat(newAmount);
    const newDesc = prompt("الوصف الجديد:", trans.description);
    if (newDesc) trans.description = newDesc;

    saveToStorage();
    renderAll();
    showToast("تم التعديل", "success");
}

function printTransaction(id) {
    const trans = appData.transactions.find((t) => t.id === id);
    if (!trans) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>فاتورة ${trans.invoiceNumber}</title>
            <style>
                body { font-family: 'Cairo', sans-serif; padding: 20px; }
                .invoice { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .details { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="invoice">
                <div class="header">
                    <h2>${appData.settings.orgName}</h2>
                    <h3>فاتورة ضريبية</h3>
                </div>
                <div class="details">
                    <p><strong>رقم الفاتورة:</strong> ${trans.invoiceNumber}</p>
                    <p><strong>التاريخ:</strong> ${formatDate(trans.date)}</p>
                    <p><strong>المريض:</strong> ${trans.patientName || "غير محدد"}</p>
                </div>
                <table>
                    <thead>
                        <tr><th>البيان</th><th>القيمة</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>${trans.description}</td><td>${formatCurrency(trans.amount)}</td></tr>
                    </tbody>
                </table>
                <div class="total">
                    <p>الإجمالي: ${formatCurrency(trans.amount)}</p>
                </div>
            </div>
            <script>window.print();setTimeout(()=>window.close(),1000);<\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ==================== إدارة المرضى ====================
function renderPatientsTable() {
    if (!currentUser.loggedIn) return;
    
    const search = document.getElementById("searchPatient")?.value.toLowerCase();
    let patients = [...appData.patients];
    if (search)
        patients = patients.filter(
            (p) => p.name.toLowerCase().includes(search) || p.phone.includes(search),
        );

    const tbody = document.getElementById("patientsBody");
    if (!tbody) return;

    tbody.innerHTML = patients
        .map(
            (p) => `
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
            `,
        )
        .join("");
}

function addPatient() {
    if (!checkPermission("patients")) {
        showToast("ليس لديك صلاحية لإضافة مرضى", "error");
        return;
    }
    
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
        name,
        phone,
        email,
        birthdate,
        address,
        bloodType,
        medicalHistory,
        lastVisit: new Date().toISOString().split("T")[0],
        totalPaid: 0,
    };

    appData.patients.push(newPatient);
    saveToStorage();
    renderAll();
    showToast("تمت إضافة المريض", "success");

    document.getElementById("patientFullName").value = "";
    document.getElementById("patientPhone").value = "";
}

function deletePatient(id) {
    if (!checkPermission("patients")) {
        showToast("ليس لديك صلاحية لحذف المرضى", "error");
        return;
    }
    
    if (confirm("هل أنت متأكد؟")) {
        appData.patients = appData.patients.filter((p) => p.id !== id);
        saveToStorage();
        renderAll();
        showToast("تم الحذف", "success");
    }
}

function editPatient(id) {
    const patient = appData.patients.find((p) => p.id === id);
    if (!patient) return;
    
    const newName = prompt("الاسم الجديد:", patient.name);
    if (newName) patient.name = newName;
    const newPhone = prompt("رقم الهاتف الجديد:", patient.phone);
    if (newPhone) patient.phone = newPhone;
    
    saveToStorage();
    renderAll();
    showToast("تم التعديل", "success");
}

function viewPatientHistory(id) {
    const patient = appData.patients.find((p) => p.id === id);
    if (!patient) return;
    
    const patientTransactions = appData.transactions.filter(t => t.patientName === patient.name);
    
    alert(`الملف الطبي للمريض: ${patient.name}\n\nالتاريخ الطبي: ${patient.medicalHistory || "لا يوجد"}\nفصيلة الدم: ${patient.bloodType}\nآخر زيارة: ${formatDate(patient.lastVisit)}\nإجمالي المدفوعات: ${formatCurrency(patient.totalPaid)}\n\nعدد المعاملات المالية: ${patientTransactions.length}`);
}

// ==================== إدارة الأطباء والموظفين ====================
function renderStaffTable() {
    if (!currentUser.loggedIn) return;
    
    const tbody = document.getElementById("staffBody");
    if (!tbody) return;

    tbody.innerHTML = appData.staff
        .map(
            (s) => `
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
            `,
        )
        .join("");
}

function addStaff() {
    if (!checkPermission("doctors")) {
        showToast("ليس لديك صلاحية لإضافة موظفين", "error");
        return;
    }
    
    const name = document.getElementById("staffName")?.value;
    const type = document.getElementById("staffType")?.value;
    const specialty = document.getElementById("staffSpecialty")?.value;
    const salary = parseFloat(document.getElementById("staffSalary")?.value);
    const phone = document.getElementById("staffPhone")?.value;
    const email = document.getElementById("staffEmail")?.value;
    const hireDate = document.getElementById("staffHireDate")?.value || new Date().toISOString().split("T")[0];

    if (!name) return showToast("الاسم مطلوب", "error");

    const newStaff = {
        id: Date.now(),
        name,
        type,
        specialty,
        salary,
        phone,
        email,
        hireDate,
    };
    appData.staff.push(newStaff);
    saveToStorage();
    renderAll();
    showToast("تمت إضافة الموظف", "success");
}

function deleteStaff(id) {
    if (!checkPermission("doctors")) {
        showToast("ليس لديك صلاحية لحذف الموظفين", "error");
        return;
    }
    
    if (confirm("هل أنت متأكد؟")) {
        appData.staff = appData.staff.filter((s) => s.id !== id);
        saveToStorage();
        renderAll();
        showToast("تم الحذف", "success");
    }
}

function editStaff(id) {
    const staff = appData.staff.find((s) => s.id === id);
    if (!staff) return;
    
    const newName = prompt("الاسم الجديد:", staff.name);
    if (newName) staff.name = newName;
    const newSalary = prompt("الراتب الجديد:", staff.salary);
    if (newSalary && !isNaN(parseFloat(newSalary))) staff.salary = parseFloat(newSalary);
    
    saveToStorage();
    renderAll();
    showToast("تم التعديل", "success");
}

// ==================== إدارة المخزون ====================
function renderInventoryTable() {
    if (!currentUser.loggedIn) return;
    
    const tbody = document.getElementById("inventoryBody");
    if (!tbody) return;

    tbody.innerHTML = appData.inventory
        .map(
            (i) => `
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
            `,
        )
        .join("");
}

function addInventoryItem() {
    if (!checkPermission("inventory")) {
        showToast("ليس لديك صلاحية لإضافة أصناف", "error");
        return;
    }
    
    const name = document.getElementById("itemName")?.value;
    const category = document.getElementById("itemCategory")?.value;
    const quantity = parseInt(document.getElementById("itemQuantity")?.value);
    const purchasePrice = parseFloat(document.getElementById("itemPurchasePrice")?.value);
    const sellingPrice = parseFloat(document.getElementById("itemSellingPrice")?.value);
    const expiryDate = document.getElementById("itemExpiryDate")?.value;
    const location = document.getElementById("itemLocation")?.value;

    if (!name || !quantity) return showToast("اسم الصنف والكمية مطلوبان", "error");

    const newItem = {
        id: Date.now(),
        name,
        category,
        quantity,
        purchasePrice,
        sellingPrice,
        expiryDate,
        location,
    };
    appData.inventory.push(newItem);
    saveToStorage();
    renderAll();
    showToast("تمت إضافة الصنف", "success");
}

function deleteItem(id) {
    if (!checkPermission("inventory")) {
        showToast("ليس لديك صلاحية لحذف الأصناف", "error");
        return;
    }
    
    if (confirm("هل أنت متأكد؟")) {
        appData.inventory = appData.inventory.filter((i) => i.id !== id);
        saveToStorage();
        renderAll();
        showToast("تم الحذف", "success");
    }
}

function editItem(id) {
    const item = appData.inventory.find((i) => i.id === id);
    if (!item) return;
    
    const newName = prompt("الاسم الجديد:", item.name);
    if (newName) item.name = newName;
    const newQuantity = prompt("الكمية الجديدة:", item.quantity);
    if (newQuantity && !isNaN(parseInt(newQuantity))) item.quantity = parseInt(newQuantity);
    
    saveToStorage();
    renderAll();
    showToast("تم التعديل", "success");
}

// ==================== إدارة المواعيد ====================
function renderAppointmentsTable() {
    if (!currentUser.loggedIn) return;
    
    const tbody = document.getElementById("appointmentsBody");
    if (!tbody) return;

    tbody.innerHTML = appData.appointments
        .map(
            (a) => `
                <tr>
                    <td>${a.patientName}</td>
                    <td>${a.doctorName}</td>
                    <td>${formatDate(a.date)}</td>
                    <td>${a.time}</td>
                    <td>${a.type}</td>
                    <td><span class="${a.status === "مؤكد" ? "badge-income" : "badge-expense"}">${a.status}</span></td>
                    <td class="action-icons">
                        <i class="fas fa-edit" onclick="editAppointment(${a.id})"></i>
                        <i class="fas fa-trash-alt" onclick="deleteAppointment(${a.id})"></i>
                     </td>
                 </tr>
            `,
        )
        .join("");
}

function updateUpcomingAppointments() {
    if (!currentUser.loggedIn) return;
    
    const container = document.getElementById("upcomingAppointments");
    if (!container) return;

    const today = new Date().toISOString().split("T")[0];
    const upcoming = appData.appointments
        .filter((a) => a.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);

    container.innerHTML =
        upcoming
            .map(
                (a) => `
                <div style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                    <strong>${a.patientName}</strong> - ${formatDate(a.date)} ${a.time}<br>
                    <small>${a.doctorName} | ${a.type}</small>
                </div>
            `,
            )
            .join("") || "<p>لا توجد مواعيد قادمة</p>";
}

function addAppointment() {
    if (!checkPermission("appointments")) {
        showToast("ليس لديك صلاحية لإضافة مواعيد", "error");
        return;
    }
    
    const patientId = parseInt(document.getElementById("appointmentPatient")?.value);
    const doctorId = parseInt(document.getElementById("appointmentDoctor")?.value);
    const date = document.getElementById("appointmentDate")?.value;
    const time = document.getElementById("appointmentTime")?.value;
    const type = document.getElementById("appointmentType")?.value;
    const status = document.getElementById("appointmentStatus")?.value;
    const notes = document.getElementById("appointmentNotes")?.value;

    const patient = appData.patients.find((p) => p.id === patientId);
    const doctor = appData.staff.find(
        (s) => s.id === doctorId && s.type === "doctor",
    );

    if (!patient || !doctor) return showToast("اختر مريضاً وطبيباً", "error");
    if (!date || !time) return showToast("التاريخ والوقت مطلوبان", "error");

    const newAppointment = {
        id: Date.now(),
        patientId,
        patientName: patient.name,
        doctorId,
        doctorName: doctor.name,
        date,
        time,
        type,
        status,
        notes,
    };

    appData.appointments.push(newAppointment);
    saveToStorage();
    renderAll();
    showToast("تم حجز الموعد", "success");
}

function deleteAppointment(id) {
    if (!checkPermission("appointments")) {
        showToast("ليس لديك صلاحية لحذف المواعيد", "error");
        return;
    }
    
    if (confirm("هل أنت متأكد؟")) {
        appData.appointments = appData.appointments.filter((a) => a.id !== id);
        saveToStorage();
        renderAll();
        showToast("تم الحذف", "success");
    }
}

function editAppointment(id) {
    const appointment = appData.appointments.find((a) => a.id === id);
    if (!appointment) return;
    
    const newDate = prompt("التاريخ الجديد (YYYY-MM-DD):", appointment.date);
    if (newDate) appointment.date = newDate;
    const newTime = prompt("الوقت الجديد (HH:MM):", appointment.time);
    if (newTime) appointment.time = newTime;
    
    saveToStorage();
    renderAll();
    showToast("تم التعديل", "success");
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
    if (!currentUser.loggedIn) return;
    
    const orgName = document.getElementById("orgName");
    const orgLicense = document.getElementById("orgLicense");
    const orgPhone = document.getElementById("orgPhone");
    const orgEmail = document.getElementById("orgEmail");
    const orgAddress = document.getElementById("orgAddress");
    const orgLogo = document.getElementById("orgLogo");
    
    if (orgName) orgName.value = appData.settings.orgName;
    if (orgLicense) orgLicense.value = appData.settings.orgLicense;
    if (orgPhone) orgPhone.value = appData.settings.orgPhone;
    if (orgEmail) orgEmail.value = appData.settings.orgEmail;
    if (orgAddress) orgAddress.value = appData.settings.orgAddress;
    if (orgLogo) orgLogo.value = appData.settings.orgLogo;

    const lastBackupEl = document.getElementById("lastBackupTime");
    if (lastBackupEl && appData.lastBackup) {
        lastBackupEl.innerHTML = `آخر نسخة: ${new Date(appData.lastBackup).toLocaleString("ar-EG")}`;
    }
}

function saveSettings() {
    appData.settings = {
        orgName: document.getElementById("orgName")?.value || "المؤسسة الطبية",
        orgLicense: document.getElementById("orgLicense")?.value || "",
        orgPhone: document.getElementById("orgPhone")?.value || "",
        orgEmail: document.getElementById("orgEmail")?.value || "",
        orgAddress: document.getElementById("orgAddress")?.value || "",
        orgLogo: document.getElementById("orgLogo")?.value || "",
    };
    saveToStorage();
    showToast("تم حفظ الإعدادات", "success");
}

// ==================== التقارير ====================
function generateReport() {
    if (!currentUser.loggedIn) return;
    
    const dateFrom = document.getElementById("reportDateFrom")?.value;
    const dateTo = document.getElementById("reportDateTo")?.value;
    const reportType = document.getElementById("reportType")?.value;
    const container = document.getElementById("reportContent");
    
    if (!container) return;

    let html = `<div class="report-header">
        <h2>${appData.settings.orgName}</h2>
        <h3>${getReportTitle(reportType)}</h3>
        <p>الفترة: ${dateFrom || "البداية"} إلى ${dateTo || "الحالي"}</p>
        <p>تاريخ التقرير: ${new Date().toLocaleDateString("ar-EG")}</p>
    </div>`;

    if (reportType === "financial") {
        let filtered = [...appData.transactions];
        if (dateFrom) filtered = filtered.filter((t) => t.date >= dateFrom);
        if (dateTo) filtered = filtered.filter((t) => t.date <= dateTo);

        const totalIncome = filtered
            .filter((t) => t.type === "income")
            .reduce((s, t) => s + t.amount, 0);
        const totalExpense = filtered
            .filter((t) => t.type === "expense")
            .reduce((s, t) => s + t.amount, 0);

        html += `<div class="report-summary">
            <div class="summary-item"><strong>${formatCurrency(totalIncome)}</strong><br>إجمالي الإيرادات</div>
            <div class="summary-item"><strong>${formatCurrency(totalExpense)}</strong><br>إجمالي المصروفات</div>
            <div class="summary-item"><strong>${formatCurrency(totalIncome - totalExpense)}</strong><br>صافي الربح</div>
        </div>`;

        html += `<table border="1" style="width:100%; border-collapse:collapse; margin-top:20px;">
            <thead>
                <tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الوصف</th></tr>
            </thead>
            <tbody>${filtered
                .map(
                    (t) => `
                    <tr>
                        <td>${formatDate(t.date)}</td>
                        <td>${t.type === "income" ? "إيراد" : "مصروف"}</td>
                        <td>${formatCurrency(t.amount)}</td>
                        <td>${t.description}</td>
                    </tr>
                `,
                )
                .join("")}</tbody>
        </table>`;
    } else if (reportType === "patients") {
        html += `<table border="1" style="width:100%; border-collapse:collapse;">
            <thead>
                <tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>آخر زيارة</th><th>إجمالي المدفوعات</th></tr>
            </thead>
            <tbody>${appData.patients
                .map(
                    (p) => `
                    <tr>
                        <td>${p.name}</td>
                        <td>${p.phone}</td>
                        <td>${p.email || "—"}</td>
                        <td>${formatDate(p.lastVisit)}</td>
                        <td>${formatCurrency(p.totalPaid)}</td>
                    </tr>
                `,
                )
                .join("")}</tbody>
        </table>`;
    } else if (reportType === "doctors") {
        html += `<table border="1" style="width:100%; border-collapse:collapse;">
            <thead>
                <tr><th>الاسم</th><th>التخصص</th><th>الراتب</th><th>الهاتف</th><th>تاريخ التعيين</th></tr>
            </thead>
            <tbody>${appData.staff
                .filter(s => s.type === "doctor")
                .map(
                    (d) => `
                    <tr>
                        <td>${d.name}</td>
                        <td>${d.specialty || "—"}</td>
                        <td>${formatCurrency(d.salary)}</td>
                        <td>${d.phone}</td>
                        <td>${formatDate(d.hireDate)}</td>
                    </tr>
                `,
                )
                .join("")}</tbody>
        </table>`;
    } else if (reportType === "inventory") {
        html += `<table border="1" style="width:100%; border-collapse:collapse;">
            <thead>
                <tr><th>الصنف</th><th>الفئة</th><th>الكمية</th><th>سعر الشراء</th><th>سعر البيع</th><th>تاريخ الانتهاء</th><th>القيمة</th></tr>
            </thead>
            <tbody>${appData.inventory
                .map(
                    (i) => `
                    <tr>
                        <td>${i.name}</td>
                        <td>${i.category}</td>
                        <td>${i.quantity}</td>
                        <td>${formatCurrency(i.purchasePrice)}</td>
                        <td>${formatCurrency(i.sellingPrice)}</td>
                        <td>${formatDate(i.expiryDate)}</td>
                        <td>${formatCurrency(i.quantity * i.purchasePrice)}</td>
                    </tr>
                `,
                )
                .join("")}</tbody>
        </table>`;
    } else if (reportType === "appointments") {
        html += `<table border="1" style="width:100%; border-collapse:collapse;">
            <thead>
                <tr><th>المريض</th><th>الطبيب</th><th>التاريخ</th><th>الوقت</th><th>النوع</th><th>الحالة</th></tr>
            </thead>
            <tbody>${appData.appointments
                .map(
                    (a) => `
                    <tr>
                        <td>${a.patientName}</td>
                        <td>${a.doctorName}</td>
                        <td>${formatDate(a.date)}</td>
                        <td>${a.time}</td>
                        <td>${a.type}</td>
                        <td>${a.status}</td>
                    </tr>
                `,
                )
                .join("")}</tbody>
        </table>`;
    }

    container.innerHTML = html;
    showToast("تم إنشاء التقرير", "success");
}

function getReportTitle(type) {
    const titles = {
        financial: "تقرير مالي",
        patients: "تقرير المرضى",
        doctors: "تقرير الأطباء",
        inventory: "تقرير المخزون",
        appointments: "تقرير المواعيد",
    };
    return titles[type] || "تقرير";
}

// ==================== تصدير Excel ====================
function exportToExcel() {
    const data = appData.transactions.map((t) => ({
        "التاريخ": t.date,
        "النوع": t.type === "income" ? "إيراد" : "مصروف",
        "المبلغ": t.amount,
        "القسم": getDepartmentName(t.department),
        "الفئة": getCategoryName(t.category),
        "الوصف": t.description,
        "المريض": t.patientName || "—",
        "رقم الفاتورة": t.invoiceNumber || "—",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المعاملات المالية");
    XLSX.writeFile(
        wb,
        `edarty_report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    showToast("تم تصدير التقرير", "success");
}

// ==================== تهيئة الصفحة ====================
function initTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabBtns.forEach((btn) => {
        btn.onclick = () => {
            const tabId = btn.dataset.tab;
            tabBtns.forEach((b) => b.classList.remove("active"));
            tabPanes.forEach((p) => p.classList.remove("active"));
            btn.classList.add("active");
            const activePane = document.getElementById(tabId);
            if (activePane) activePane.classList.add("active");
        };
    });
}

function displayCurrentDate() {
    const today = new Date();
    const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
    };
    const dateBox = document.getElementById("currentDate");
    if (dateBox) {
        dateBox.innerHTML = `<i class="far fa-calendar-alt"></i> ${today.toLocaleDateString("ar-EG", options)}`;
    }
}

function updateAppointmentSelects() {
    const patientSelect = document.getElementById("appointmentPatient");
    const doctorSelect = document.getElementById("appointmentDoctor");

    if (patientSelect) {
        patientSelect.innerHTML =
            '<option value="">اختر المريض</option>' +
            appData.patients
                .map((p) => `<option value="${p.id}">${p.name}</option>`)
                .join("");
    }
    if (doctorSelect) {
        doctorSelect.innerHTML =
            '<option value="">اختر الطبيب</option>' +
            appData.staff
                .filter((s) => s.type === "doctor")
                .map((d) => `<option value="${d.id}">${d.name}</option>`)
                .join("");
    }
}

function initEventListeners() {
    // أزرار الإضافة
    const addTransactionBtn = document.getElementById("addTransactionBtn");
    const addPatientBtn = document.getElementById("addPatientBtn");
    const addStaffBtn = document.getElementById("addStaffBtn");
    const addItemBtn = document.getElementById("addItemBtn");
    const addAppointmentBtn = document.getElementById("addAppointmentBtn");
    
    if (addTransactionBtn) addTransactionBtn.addEventListener("click", addTransaction);
    if (addPatientBtn) addPatientBtn.addEventListener("click", addPatient);
    if (addStaffBtn) addStaffBtn.addEventListener("click", addStaff);
    if (addItemBtn) addItemBtn.addEventListener("click", addInventoryItem);
    if (addAppointmentBtn) addAppointmentBtn.addEventListener("click", addAppointment);

    // الفلاتر
    const applyFiltersBtn = document.getElementById("applyFiltersBtn");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    
    if (applyFiltersBtn) applyFiltersBtn.addEventListener("click", renderTransactionsTable);
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener("click", () => {
            const filterInputs = document.querySelectorAll("#transactions .filter-row input, #transactions .filter-row select");
            filterInputs.forEach((el) => {
                if (el) el.value = "";
            });
            renderTransactionsTable();
        });
    }

    // التقارير والتصدير
    const exportExcelBtn = document.getElementById("exportExcelBtn");
    const generateReportBtn = document.getElementById("generateReportBtn");
    
    if (exportExcelBtn) exportExcelBtn.addEventListener("click", exportToExcel);
    if (generateReportBtn) generateReportBtn.addEventListener("click", generateReport);

    // النسخ الاحتياطي
    const backupExportBtn = document.getElementById("backupExportBtn");
    const backupImportBtn = document.getElementById("backupImportBtn");
    const resetSystemBtn = document.getElementById("resetSystemBtn");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    
    if (backupExportBtn) backupExportBtn.addEventListener("click", exportBackup);
    if (backupImportBtn) {
        backupImportBtn.addEventListener("click", () => {
            const fileInput = document.getElementById("backupFileInput");
            if (fileInput && fileInput.files[0]) {
                importBackup(fileInput.files[0]);
            } else {
                showToast("اختر ملفاً أولاً", "error");
            }
        });
    }
    if (resetSystemBtn) resetSystemBtn.addEventListener("click", resetSystem);
    if (saveSettingsBtn) saveSettingsBtn.addEventListener("click", saveSettings);

    // البحث
    const searchPatientBtn = document.getElementById("searchPatientBtn");
    const searchPatientInput = document.getElementById("searchPatient");
    
    if (searchPatientBtn) searchPatientBtn.addEventListener("click", renderPatientsTable);
    if (searchPatientInput) searchPatientInput.addEventListener("input", renderPatientsTable);

    // زر تسجيل الخروج
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.onclick = logout;
}

// ==================== بدء التطبيق ====================
function init() {
    // إضافة class loading للجسم
    document.body.classList.add("loading");

    // إخفاء المحتوى الرئيسي في البداية
    const mainContent = document.getElementById("mainContent");
    if (mainContent) mainContent.classList.remove("visible");
    
    // تحميل البيانات
    loadFromStorage();
    
    // محاولة استعادة جلسة تسجيل الدخول
    const sessionRestored = restoreLoginSession();
    
    if (!sessionRestored) {
        // إذا لم توجد جلسة سابقة، تهيئة واجهة تسجيل الدخول
        initLogin();
    } else {
        // إذا تم استعادة الجلسة، تأكد من تهيئة الدوال
        initLogin();
        applyPermissions();
        renderAll();
    }
    
    initTabs();
    displayCurrentDate();
    initEventListeners();
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", init);