// Simple main.js for expense list with detail navigation
document.addEventListener('DOMContentLoaded', function() {
    loadExpenses();
});

let currentExpenses = [];

// Load expenses from API
function loadExpenses() {
    console.log('Loading expenses...');
    
    return fetch('/api/expenses')
        .then(response => {
            if (!response.ok) {
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
        'Food': '🍽️',
        'Transport': '🚗',
        'Entertainment': '🎬',
        'Bills': '📋',
        'Shopping': '🛍️',
        'Other': '📝',
        'อาหาร': '🍽️',
        'เดินทาง': '🚗',
        'บันเทิง': '🎬',
        'สุขภาพ': '🏥',
        'ช้อปปิ้ง': '🛍️',
        'บิล/ค่าใช้จ่าย': '📋',
        'การศึกษา': '📚',
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

    const expenseList = document.getElementById('expense-list');
    expenseList.innerHTML = `
        <div class="expense-detail-page">
            <div class="detail-header">
                <button class="back-btn" onclick="loadExpenses()">← กลับ</button>
                <h2>รายละเอียดรายการ</h2>
                <div class="spacer"></div>
            </div>
            
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
                    <h3>✏️ Edit Expense</h3>
                    <form class="simple-edit-form" onsubmit="updateExpense(event, ${expense.id})">
                        <label for="edit-item-${expense.id}">Item:</label>
                        <input type="text" id="edit-item-${expense.id}" name="item" value="${expense.item}" required>
                        
                        <label for="edit-amount-${expense.id}">Amount:</label>
                        <input type="number" id="edit-amount-${expense.id}" name="amount" value="${expense.amount}" step="0.01" required>
                        
                        <label for="edit-date-${expense.id}">Date:</label>
                        <input type="date" id="edit-date-${expense.id}" name="expense_date" value="${expense.expense_date}" required>
                        
                        <label for="edit-category-${expense.id}">Category:</label>
                        <select id="edit-category-${expense.id}" name="category" required>
                            <option value="Food" ${expense.category === 'Food' ? 'selected' : ''}>Food</option>
                            <option value="Transport" ${expense.category === 'Transport' ? 'selected' : ''}>Transport</option>
                            <option value="Shopping" ${expense.category === 'Shopping' ? 'selected' : ''}>Shopping</option>
                            <option value="Bills" ${expense.category === 'Bills' ? 'selected' : ''}>Bills</option>
                            <option value="Entertainment" ${expense.category === 'Entertainment' ? 'selected' : ''}>Entertainment</option>
                            <option value="Other" ${expense.category === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                        
                        <div class="edit-form-buttons">
                            <button type="submit">Update Expense</button>
                            <button type="button" onclick="hideEditForm(${expense.id})" class="cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
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
        showToast('แก้ไขรายการเรียบร้อยแล้ว', 'success');
        // Refresh the expense data and show updated detail
        loadExpenses().then(() => {
            showExpenseDetail(id);
        });
    })
    .catch(error => {
        console.error('Error updating expense:', error);
        showToast('เกิดข้อผิดพลาดในการแก้ไข', 'error');
    });
}

// Delete expense function
function deleteExpense(id) {
    const expense = currentExpenses.find(e => e.id === id);
    if (expense && confirm(`คุณต้องการลบรายการ "${expense.item}" หรือไม่?`)) {
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
            showToast('ลบรายการเรียบร้อยแล้ว', 'success');
            loadExpenses(); // Go back to main list
        })
        .catch(error => {
            console.error('Error deleting expense:', error);
            showToast('เกิดข้อผิดพลาดในการลบรายการ', 'error');
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

// Global functions
window.showExpenseDetail = showExpenseDetail;
window.showEditForm = showEditForm;
window.hideEditForm = hideEditForm;
window.updateExpense = updateExpense;
window.deleteExpense = deleteExpense;
window.loadExpenses = loadExpenses;