let allExpenses = [];
let filteredExpenses = [];
let currentPeriod = 'today';

// Charts instances
let expenseChart, categoryChart, trendChart;

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
});

function initializeDashboard() {
    fetch('/api/expenses')
        .then(response => response.json())
        .then(result => {
            allExpenses = result.data.map(expense => ({
                ...expense,
                expense_date: new Date(expense.expense_date)
            }));
            
            filterExpensesByPeriod(currentPeriod);
            updateSummaryCards();
            createCharts();
            displayRecentExpenses();
        })
        .catch(error => {
            console.error('Error loading expenses:', error);
        });
}

function setupEventListeners() {
    // Period filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            currentPeriod = this.dataset.period;
            filterExpensesByPeriod(currentPeriod);
            updateDashboard();
        });
    });
}

function filterExpensesByPeriod(period) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(period) {
        case 'today':
            filteredExpenses = allExpenses.filter(expense => {
                const expenseDate = new Date(expense.expense_date.getFullYear(), 
                                           expense.expense_date.getMonth(), 
                                           expense.expense_date.getDate());
                return expenseDate.getTime() === today.getTime();
            });
            break;
            
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            filteredExpenses = allExpenses.filter(expense => 
                expense.expense_date >= weekStart && expense.expense_date <= now
            );
            break;
            
        case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredExpenses = allExpenses.filter(expense => 
                expense.expense_date >= monthStart && expense.expense_date <= now
            );
            break;
            
        case 'year':
            const yearStart = new Date(now.getFullYear(), 0, 1);
            filteredExpenses = allExpenses.filter(expense => 
                expense.expense_date >= yearStart && expense.expense_date <= now
            );
            break;
            
        case 'all':
        default:
            filteredExpenses = [...allExpenses];
            break;
    }
}

function updateSummaryCards() {
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCount = filteredExpenses.length;
    const maxExpense = filteredExpenses.length > 0 ? Math.max(...filteredExpenses.map(e => e.amount)) : 0;
    
    // Calculate daily average
    let dailyAverage = 0;
    if (filteredExpenses.length > 0) {
        const dates = [...new Set(filteredExpenses.map(e => e.expense_date.toDateString()))];
        dailyAverage = totalAmount / Math.max(dates.length, 1);
    }
    
    document.getElementById('total-amount').textContent = `฿${totalAmount.toLocaleString()}`;
    document.getElementById('total-count').textContent = totalCount.toLocaleString();
    document.getElementById('daily-average').textContent = `฿${dailyAverage.toFixed(0)}`;
    document.getElementById('max-expense').textContent = `฿${maxExpense.toLocaleString()}`;
}

function createCharts() {
    createExpenseChart();
    createCategoryChart();
    createTrendChart();
}

function createExpenseChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    // Group expenses by date
    const dailyExpenses = {};
    filteredExpenses.forEach(expense => {
        const dateStr = expense.expense_date.toISOString().split('T')[0];
        dailyExpenses[dateStr] = (dailyExpenses[dateStr] || 0) + expense.amount;
    });
    
    const labels = Object.keys(dailyExpenses).sort();
    const amounts = labels.map(date => dailyExpenses[date]);
    
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(date => new Date(date).toLocaleDateString('th-TH')),
            datasets: [{
                label: 'ค่าใช้จ่าย (฿)',
                data: amounts,
                backgroundColor: 'rgba(255, 115, 0, 0.7)',
                borderColor: 'rgba(255, 115, 0, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '฿' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function createCategoryChart() {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Group expenses by category (assuming there's a category field, if not we'll use item names)
    const categoryExpenses = {};
    filteredExpenses.forEach(expense => {
        const category = expense.category || getItemCategory(expense.item);
        categoryExpenses[category] = (categoryExpenses[category] || 0) + expense.amount;
    });
    
    const labels = Object.keys(categoryExpenses);
    const amounts = Object.values(categoryExpenses);
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    'rgba(255, 115, 0, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(201, 203, 207, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createTrendChart() {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    
    // Group expenses by month
    const monthlyExpenses = {};
    allExpenses.forEach(expense => {
        const monthKey = expense.expense_date.getFullYear() + '-' + 
                        String(expense.expense_date.getMonth() + 1).padStart(2, '0');
        monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + expense.amount;
    });
    
    const labels = Object.keys(monthlyExpenses).sort();
    const amounts = labels.map(month => monthlyExpenses[month]);
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(month => {
                const [year, monthNum] = month.split('-');
                const date = new Date(year, monthNum - 1);
                return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short' });
            }),
            datasets: [{
                label: 'ค่าใช้จ่ายรายเดือน (฿)',
                data: amounts,
                borderColor: 'rgba(255, 115, 0, 1)',
                backgroundColor: 'rgba(255, 115, 0, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '฿' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function displayRecentExpenses() {
    const recentExpenses = [...allExpenses]
        .sort((a, b) => b.expense_date - a.expense_date)
        .slice(0, 10);
    
    const tableBody = document.getElementById('recent-expenses-list');
    tableBody.innerHTML = '';
    
    if (recentExpenses.length === 0) {
        tableBody.innerHTML = '<div class="no-data">ไม่มีข้อมูลค่าใช้จ่าย</div>';
        return;
    }
    
    recentExpenses.forEach(expense => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div class="table-cell">${expense.expense_date.toLocaleDateString('th-TH')}</div>
            <div class="table-cell">${expense.item}</div>
            <div class="table-cell">฿${expense.amount.toLocaleString()}</div>
        `;
        tableBody.appendChild(row);
    });
}

function getItemCategory(item) {
    // Simple category classification based on item name
    const itemLower = item.toLowerCase();
    if (itemLower.includes('อาหาร') || itemLower.includes('กิน') || itemLower.includes('ข้าว') || itemLower.includes('ร้าน') || itemLower.includes('เบเกอรี่') || itemLower.includes('น้ำ')) return 'อาหาร';
    if (itemLower.includes('เดินทาง') || itemLower.includes('รถ') || itemLower.includes('นํ้ามัน') || itemLower.includes('แท็กซี่') || itemLower.includes('บัส') || itemLower.includes('รถไฟ')) return 'เดินทาง';
    if (itemLower.includes('ของใช้') || itemLower.includes('ซื้อ') || itemLower.includes('เสื้อผ้า') || itemLower.includes('โลตัส') || itemLower.includes('เซเว่น')) return 'ซื้อของ';
    if (itemLower.includes('บิล') || itemLower.includes('ค่าไฟ') || itemLower.includes('ค่าน้ำ') || itemLower.includes('ค่าเน็ต') || itemLower.includes('ค่าโทรศัพท์')) return 'ค่าบิล';
    if (itemLower.includes('หนัง') || itemLower.includes('เกม') || itemLower.includes('บันเทิง') || itemLower.includes('คาราโอเกะ')) return 'บันเทิง';
    return 'อื่นๆ';
}

function updateDashboard() {
    updateSummaryCards();
    createCharts();
    // Don't update recent expenses as it should always show all recent expenses
}