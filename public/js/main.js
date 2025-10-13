// Simple main.js for expense list with detail navigation
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadExpenses();
    initializeFilters();
});

let currentExpenses = [];

// Authentication functions
function checkAuthStatus() {
    fetch('/api/auth/me')
        .then(response => {
            if (!response.ok) {
                window.location.href = '/login';
                return;
            }
            return response.json();
        })
        .then(data => {
            // User is authenticated, no need to display welcome message
            // Welcome message is now handled in profile page
        })
        .catch(error => {
            console.error('Auth check error:', error);
            window.location.href = '/login';
        });
}

// Authentication functions moved to profile page

// Load expenses from API
function loadExpenses() {
    console.log('Loading expenses...');
    
    return fetch('/api/expenses')
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Expenses loaded:', data);
            if (data && data.data) {
                currentExpenses = data.data;
                displayExpenses(currentExpenses);
            }
            return data;
        })
        .catch(error => {
            console.error('Error loading expenses:', error);
            document.getElementById('expense-list').innerHTML = `
                <div class="error-message">
                    <p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                    <button onclick="loadExpenses()" class="retry-btn">ลองใหม่</button>
                </div>
            `;
            throw error;
        });
}

// Display expenses as cards
function displayExpenses(expenses) {
    const expenseList = document.getElementById('expense-list');
    
    if (expenses.length > 0) {
        let html = '';
        expenses.forEach(expense => {
            const categoryEmoji = getCategoryEmoji(expense.category);
            const formattedDate = formatDate(expense.expense_date);
            const formattedAmount = parseFloat(expense.amount).toLocaleString('th-TH', { 
                minimumFractionDigits: 2 
            });
            
            html += `
                <div class="expense-card" onclick="showExpenseDetail(${expense.id})" style="cursor: pointer;">
                    <div class="expense-main">
                        <div class="expense-info">
                            <div class="expense-item">
                                <span class="category-emoji">${categoryEmoji}</span>
                                <span class="item-name">${expense.item}</span>
                            </div>
                            <div class="expense-details">
                                <span class="expense-amount">฿${formattedAmount}</span>
                                <span class="expense-date">${formattedDate}</span>
                            </div>
                            <div class="expense-category">${expense.category}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        expenseList.innerHTML = html;
    } else {
        expenseList.innerHTML = `
            <div class="empty-state">
                <p>ยังไม่มีรายการค่าใช้จ่าย</p>
                <a href="add.html" class="btn">เพิ่มรายการแรก</a>
            </div>
        `;
    }
}

// Get category emoji
function getCategoryEmoji(category) {
    const emojiMap = {
        // รองรับหมวดหมู่เก่า (ภาษาอังกฤษ) เพื่อความเข้ากันได้
        'Food': '🍽️',
        'Transport': '🚗',
        'Entertainment': '🎬',
        'Bills': '📋',
        'Shopping': '🛍️',
        'Other': '📝',
        // หมวดหมู่ใหม่ (ภาษาไทย)
        'อาหาร': '🍽️',
        'เดินทาง': '🚗',
        'บันเทิง': '🎬',
        'ค่าบิล': '📋',
        'ซื้อของ': '🛍️',
        'อื่นๆ': '📝'
    };
    return emojiMap[category] || '📝';
}

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

// Show expense detail page
function showExpenseDetail(id) {
    const expense = currentExpenses.find(e => e.id === id);
    if (!expense) {
        console.error('Expense not found:', id);
        return;
    }
    
    const categoryEmoji = getCategoryEmoji(expense.category);
    const formattedDate = new Date(expense.expense_date).toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedAmount = parseFloat(expense.amount).toLocaleString('th-TH', { 
        minimumFractionDigits: 2 
    });

    const modal = document.getElementById('detail-edit-modal');
    const modalContent = modal.querySelector('.modal-content');

    modalContent.innerHTML = `
        <div class="detail-header">
            <h2>รายละเอียดรายการ</h2>
            <button class="close-modal-btn" onclick="closeDetailModal()">×</button>
        </div>
        <div class="detail-body">
            <div class="expense-detail-card" id="expense-detail-${expense.id}">
                <!-- Detail View -->
                <div class="detail-view" id="detail-view-${expense.id}">
                    <div class="expense-info">
                        <div class="expense-item">
                            <h2>${categoryEmoji} ${expense.item}</h2>
                        </div>
                        <div class="expense-amount">
                            <div class="amount">฿${formattedAmount}</div>
                        </div>
                        <div class="expense-meta">
                            <div class="expense-date">
                                <span>📅 ${formattedDate}</span>
                            </div>
                            <div class="expense-category">
                                <span>🏷️ ${expense.category}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="showEditForm(${expense.id})">
                            ✏️ แก้ไข
                        </button>
                        <button class="btn-delete" onclick="deleteExpense(${expense.id})">
                            🗑️ ลบ
                        </button>
                    </div>
                </div>
                
                <!-- Edit Form -->
                <div class="edit-form-container" id="edit-form-${expense.id}" style="display: none;">
                    <h3>✏️ แก้ไขรายการ</h3>
                    <form class="simple-edit-form" id="edit-form-actual-${expense.id}" onsubmit="updateExpense(event, ${expense.id})">
                        <label for="edit-item-${expense.id}">รายการ:</label>
                        <input type="text" id="edit-item-${expense.id}" name="item" value="${expense.item}" required>
                        
                        <label for="edit-amount-${expense.id}">จำนวน:</label>
                        <input type="number" id="edit-amount-${expense.id}" name="amount" value="${expense.amount}" step="0.01" required>
                        
                        <label for="edit-date-${expense.id}">วันที่:</label>
                        <input type="date" id="edit-date-${expense.id}" name="expense_date" value="${expense.expense_date}" required>
                        
                        <label for="edit-category-${expense.id}">หมวดหมู่:</label>
                        <select id="edit-category-${expense.id}" name="category" required>
                            <option value="อาหาร" ${expense.category === 'อาหาร' || expense.category === 'Food' ? 'selected' : ''}>🍽️ อาหาร</option>
                            <option value="เดินทาง" ${expense.category === 'เดินทาง' || expense.category === 'Transport' ? 'selected' : ''}>🚗 เดินทาง</option>
                            <option value="ซื้อของ" ${expense.category === 'ซื้อของ' || expense.category === 'Shopping' ? 'selected' : ''}>🛍️ ซื้อของ</option>
                            <option value="ค่าบิล" ${expense.category === 'ค่าบิล' || expense.category === 'Bills' ? 'selected' : ''}>📋 ค่าบิล</option>
                            <option value="บันเทิง" ${expense.category === 'บันเทิง' || expense.category === 'Entertainment' ? 'selected' : ''}>🎬 บันเทิง</option>
                            <option value="อื่นๆ" ${expense.category === 'อื่นๆ' || expense.category === 'Other' ? 'selected' : ''}>📝 อื่นๆ</option>
                        </select>
                    </form>
                    <div class="edit-form-buttons">
                        <button type="button" onclick="document.getElementById('edit-form-actual-${expense.id}').requestSubmit()" class="save-btn">✏️ บันทึกการแก้ไข</button>
                        <button type="button" onclick="hideEditForm(${expense.id})" class="cancel-btn">❌ ยกเลิก</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeDetailModal() {
    const modal = document.getElementById('detail-edit-modal');
    modal.style.display = 'none';
}

// Show edit form
function showEditForm(id) {
    const detailView = document.getElementById(`detail-view-${id}`);
    const editForm = document.getElementById(`edit-form-${id}`);
    
    if (detailView && editForm) {
        detailView.style.display = 'none';
        editForm.style.display = 'block';
    }
}

// Hide edit form and show detail view
function hideEditForm(id) {
    const detailView = document.getElementById(`detail-view-${id}`);
    const editForm = document.getElementById(`edit-form-${id}`);
    
    if (detailView && editForm) {
        editForm.style.display = 'none';
        detailView.style.display = 'block';
    }
}

// Update expense
function updateExpense(event, id) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const updateData = {
        item: formData.get('item'),
        amount: parseFloat(formData.get('amount')),
        expense_date: formData.get('expense_date'),
        category: formData.get('category')
    };
    
    console.log('Updating expense with data:', updateData);
    
    fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Expense updated:', data);
        Swal.fire({
            title: 'แก้ไขสำเร็จ! ✅',
            text: 'แก้ไขรายการเรียบร้อยแล้ว',
            icon: 'success',
            confirmButtonColor: '#ff7300',
            timer: 1500,
            showConfirmButton: false
        });
        // Refresh the expense data and show updated detail
        loadExpenses().then(() => {
            showExpenseDetail(id);
        });
        closeDetailModal();
    })
    .catch(error => {
        console.error('Error updating expense:', error);
        Swal.fire({
            title: 'เกิดข้อผิดพลาด! ❌',
            text: 'ไม่สามารถแก้ไขรายการได้',
            icon: 'error',
            confirmButtonColor: '#ff7300'
        });
    });
}

// Delete expense function
function deleteExpense(id) {
    const expense = currentExpenses.find(e => e.id === id);
    if (expense) {
        Swal.fire({
            title: 'ยืนยันการลบ',
            text: `คุณต้องการลบรายการ "${expense.item}" หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#ff7300',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/api/expenses/${id}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Expense deleted:', data);
                    Swal.fire({
                        title: 'ลบสำเร็จ! 🗑️',
                        text: 'ลบรายการเรียบร้อยแล้ว',
                        icon: 'success',
                        confirmButtonColor: '#ff7300',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    // Close modal and refresh list
                    closeDetailModal();
                    loadExpenses();
                })
                .catch(error => {
                    console.error('Error deleting expense:', error);
                    Swal.fire({
                        title: 'เกิดข้อผิดพลาด! ❌',
                        text: 'ไม่สามารถลบรายการได้',
                        icon: 'error',
                        confirmButtonColor: '#ff7300'
                    });
                });
            }
        });
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Filter and Search Variables
let filteredExpenses = [];
let currentFilters = {
    search: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    sortBy: 'date-desc'
};

// Initialize filter functionality
function initializeFilters() {
    const searchInput = document.getElementById('search-input');
    const clearAllBtn = document.getElementById('clear-all-btn');
    
    // Filter buttons and panels
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterPanels = document.querySelectorAll('.filter-panel');
    
    // Real-time search
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value;
            applyFilters();
        });
    }
    
    // Clear all filters
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllFilters);
    }
    
    // Filter button handlers
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filterType = e.target.getAttribute('data-filter');
            toggleFilterPanel(filterType);
        });
    });
    
    // Add event listeners to all filter inputs
    const filterInputs = ['category-filter', 'date-from', 'date-to', 'amount-min', 'amount-max', 'sort-by'];
    filterInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', applyFilters);
        }
    });

    // Quick filter buttons
    initializeQuickFilters();
}

// Initialize quick filter buttons
function initializeQuickFilters() {
    // Category quick filters
    const categoryQuickBtns = document.querySelectorAll('.quick-filter-btn[data-category]');
    categoryQuickBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all category quick filters
            categoryQuickBtns.forEach(b => b.removeAttribute('data-active'));
            // Add active class to clicked button
            e.target.setAttribute('data-active', 'true');
            
            const category = e.target.getAttribute('data-category');
            document.getElementById('category-filter').value = category;
            currentFilters.category = category;
            applyFilters();
        });
    });

    // Date quick filters
    const dateQuickBtns = document.querySelectorAll('.quick-filter-btn[data-date-range]');
    dateQuickBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all date quick filters
            dateQuickBtns.forEach(b => b.removeAttribute('data-active'));
            // Add active class to clicked button
            e.target.setAttribute('data-active', 'true');
            
            const dateRange = e.target.getAttribute('data-date-range');
            applyQuickDateFilter(dateRange);
        });
    });

    // Amount quick filters
    const amountQuickBtns = document.querySelectorAll('.quick-filter-btn[data-amount-range]');
    amountQuickBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all amount quick filters
            amountQuickBtns.forEach(b => b.removeAttribute('data-active'));
            // Add active class to clicked button
            e.target.setAttribute('data-active', 'true');
            
            const amountRange = e.target.getAttribute('data-amount-range');
            applyQuickAmountFilter(amountRange);
        });
    });
}

// Apply quick date filter
function applyQuickDateFilter(range) {
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    switch(range) {
        case 'today':
            dateFrom = dateTo = today.toISOString().split('T')[0];
            break;
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            dateFrom = weekStart.toISOString().split('T')[0];
            dateTo = today.toISOString().split('T')[0];
            break;
        case 'month':
            dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            dateTo = today.toISOString().split('T')[0];
            break;
        case 'year':
            dateFrom = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
            dateTo = today.toISOString().split('T')[0];
            break;
        case '':
        default:
            dateFrom = dateTo = '';
            break;
    }

    document.getElementById('date-from').value = dateFrom;
    document.getElementById('date-to').value = dateTo;
    currentFilters.dateFrom = dateFrom;
    currentFilters.dateTo = dateTo;
    applyFilters();
}

// Apply quick amount filter
function applyQuickAmountFilter(range) {
    let amountMin = '';
    let amountMax = '';

    switch(range) {
        case '0-50':
            amountMin = '0';
            amountMax = '50';
            break;
        case '50-100':
            amountMin = '50';
            amountMax = '100';
            break;
        case '100-500':
            amountMin = '100';
            amountMax = '500';
            break;
        case '500-1000':
            amountMin = '500';
            amountMax = '1000';
            break;
        case '1000+':
            amountMin = '1000';
            amountMax = '';
            break;
        case '':
        default:
            amountMin = amountMax = '';
            break;
    }

    document.getElementById('amount-min').value = amountMin;
    document.getElementById('amount-max').value = amountMax;
    currentFilters.amountMin = amountMin;
    currentFilters.amountMax = amountMax;
    applyFilters();
}

// Toggle filter panels
function toggleFilterPanel(filterType) {
    const panel = document.getElementById(`${filterType}-panel`);
    const btn = document.getElementById(`${filterType}-filter-btn`);
    const allPanels = document.querySelectorAll('.filter-panel');
    const allBtns = document.querySelectorAll('.filter-btn');
    
    // Close all other panels and remove active state
    allPanels.forEach(p => {
        if (p !== panel) {
            p.style.display = 'none';
        }
    });
    
    allBtns.forEach(b => {
        if (b !== btn) {
            b.classList.remove('active');
        }
    });
    
    // Toggle current panel
    if (panel) {
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
        btn.classList.toggle('active', !isVisible);
        
        // Auto-hide after a delay if not interacting
        if (!isVisible) {
            setTimeout(() => {
                if (!panel.matches(':hover') && !btn.matches(':hover')) {
                    panel.style.display = 'none';
                    btn.classList.remove('active');
                }
            }, 3000);
        }
    }
}

// Clear all filters
function clearAllFilters() {
    currentFilters = {
        search: '',
        category: '',
        dateFrom: '',
        dateTo: '',
        amountMin: '',
        amountMax: '',
        sortBy: 'date-desc'
    };
    
    // Clear all input values
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('amount-min').value = '';
    document.getElementById('amount-max').value = '';
    document.getElementById('sort-by').value = 'date-desc';
    
    // Reset quick filter buttons
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.removeAttribute('data-active');
    });
    
    // Set default active buttons (ทั้งหมด)
    document.querySelectorAll('.quick-filter-btn[data-category=""]').forEach(btn => {
        btn.setAttribute('data-active', 'true');
    });
    document.querySelectorAll('.quick-filter-btn[data-date-range=""]').forEach(btn => {
        btn.setAttribute('data-active', 'true');
    });
    document.querySelectorAll('.quick-filter-btn[data-amount-range=""]').forEach(btn => {
        btn.setAttribute('data-active', 'true');
    });
    
    // Clear filter summary
    const existingSummary = document.querySelector('.filter-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    // Show all expenses
    displayExpenses(currentExpenses);
    showToast('ล้างตัวกรองเรียบร้อยแล้ว', 'success');
}

// Apply all active filters
function applyFilters() {
    // Get current filter values
    currentFilters.search = document.getElementById('search-input').value.toLowerCase();
    currentFilters.category = document.getElementById('category-filter').value;
    currentFilters.dateFrom = document.getElementById('date-from').value;
    currentFilters.dateTo = document.getElementById('date-to').value;
    currentFilters.amountMin = document.getElementById('amount-min').value;
    currentFilters.amountMax = document.getElementById('amount-max').value;
    currentFilters.sortBy = document.getElementById('sort-by').value;
    
    // Start with all expenses
    filteredExpenses = [...currentExpenses];
    
    // Apply search filter
    if (currentFilters.search) {
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.item.toLowerCase().includes(currentFilters.search) ||
            expense.category.toLowerCase().includes(currentFilters.search)
        );
    }
    
    // Apply category filter
    if (currentFilters.category) {
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.category === currentFilters.category
        );
    }
    
    // Apply date range filter
    if (currentFilters.dateFrom) {
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.expense_date >= currentFilters.dateFrom
        );
    }
    
    if (currentFilters.dateTo) {
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.expense_date <= currentFilters.dateTo
        );
    }
    
    // Apply amount range filter
    if (currentFilters.amountMin) {
        const minAmount = parseFloat(currentFilters.amountMin);
        filteredExpenses = filteredExpenses.filter(expense => 
            parseFloat(expense.amount) >= minAmount
        );
    }
    
    if (currentFilters.amountMax) {
        const maxAmount = parseFloat(currentFilters.amountMax);
        filteredExpenses = filteredExpenses.filter(expense => 
            parseFloat(expense.amount) <= maxAmount
        );
    }
    
    // Apply sorting
    applySorting();
    
    // Display filtered results
    displayExpenses(filteredExpenses);
    
    // Show filter summary
    showFilterSummary();
}

// Apply sorting to filtered expenses
function applySorting() {
    switch (currentFilters.sortBy) {
        case 'date-desc':
            filteredExpenses.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
            break;
        case 'date-asc':
            filteredExpenses.sort((a, b) => new Date(a.expense_date) - new Date(b.expense_date));
            break;
        case 'amount-desc':
            filteredExpenses.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
            break;
        case 'amount-asc':
            filteredExpenses.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
            break;
        case 'item-asc':
            filteredExpenses.sort((a, b) => a.item.localeCompare(b.item));
            break;
    }
}

// Show filter summary
function showFilterSummary() {
    const totalOriginal = currentExpenses.length;
    const totalFiltered = filteredExpenses.length;
    
    if (totalFiltered < totalOriginal) {
        const summaryText = `แสดง ${totalFiltered} จาก ${totalOriginal} รายการ`;
        
        // Check if there's already a filter summary
        let summaryDiv = document.querySelector('.filter-summary');
        if (!summaryDiv) {
            summaryDiv = document.createElement('div');
            summaryDiv.className = 'filter-summary';
            const expenseList = document.getElementById('expense-list');
            expenseList.parentNode.insertBefore(summaryDiv, expenseList);
        }
        
        summaryDiv.innerHTML = `
            <div class="summary-text">
                📊 ${summaryText}
                <button onclick="clearAllFilters()" class="quick-clear-btn">ล้างตัวกรอง</button>
            </div>
        `;
    } else {
        // Remove summary if showing all items
        const existingSummary = document.querySelector('.filter-summary');
        if (existingSummary) {
            existingSummary.remove();
        }
    }
}

// Global functions
window.showExpenseDetail = showExpenseDetail;
window.showEditForm = showEditForm;
window.hideEditForm = hideEditForm;
window.updateExpense = updateExpense;
window.deleteExpense = deleteExpense;
window.closeDetailModal = closeDetailModal;
window.loadExpenses = loadExpenses;
window.clearAllFilters = clearAllFilters;
window.applyFilters = applyFilters;