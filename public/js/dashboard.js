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
                expense_date: new Date(expense.expense_date),
                amount: parseFloat(expense.amount) // Ensure amount is a number
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
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalCount = filteredExpenses.length;
    const maxExpense = totalCount > 0 ? Math.max(...filteredExpenses.map(e => e.amount || 0)) : 0;
    
    // Calculate daily average
    let dailyAverage = 0;
    if (totalCount > 0) {
        const dates = [...new Set(filteredExpenses.map(e => e.expense_date.toDateString()))];
        const numberOfDays = Math.max(dates.length, 1);
        dailyAverage = totalAmount / numberOfDays;
    }
    
    document.getElementById('total-amount').textContent = `฿${totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('total-count').textContent = totalCount.toLocaleString();
    document.getElementById('daily-average').textContent = `฿${dailyAverage.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('max-expense').textContent = `฿${maxExpense.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function createCharts() {
    createExpenseChart();
    createCategoryChart();
    createTrendChart();
}

function createExpenseChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    let labels = [];
    let amounts = [];
    let chartLabel = 'ค่าใช้จ่าย (฿)';

    if (currentPeriod === 'month') {
        // Group by week for the current month
        const weeklyExpenses = [0, 0, 0, 0, 0]; // 5 weeks max
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        filteredExpenses.forEach(expense => {
            const weekOfMonth = Math.floor((expense.expense_date.getDate() - 1) / 7);
            weeklyExpenses[weekOfMonth] += expense.amount;
        });
        labels = ['สัปดาห์ที่ 1', 'สัปดาห์ที่ 2', 'สัปดาห์ที่ 3', 'สัปดาห์ที่ 4', 'สัปดาห์ที่ 5'].slice(0, weeklyExpenses.filter(a => a > 0).length || 4);
        amounts = weeklyExpenses.slice(0, labels.length);
        chartLabel = 'ค่าใช้จ่ายรายสัปดาห์ (฿)';

    } else if (currentPeriod === 'year' || currentPeriod === 'all') {
        // Group by month
        const monthlyExpenses = {};
        filteredExpenses.forEach(expense => {
            const monthKey = expense.expense_date.getFullYear() + '-' + String(expense.expense_date.getMonth() + 1).padStart(2, '0');
            monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + expense.amount;
        });
        labels = Object.keys(monthlyExpenses).sort().map(month => {
            const [year, monthNum] = month.split('-');
            return new Date(year, monthNum - 1).toLocaleDateString('th-TH', { year: 'numeric', month: 'short' });
        });
        amounts = Object.keys(monthlyExpenses).sort().map(month => monthlyExpenses[month]);
        chartLabel = 'ค่าใช้จ่ายรายเดือน (฿)';

    } else { // 'today' or 'week'
        // Group by date
        const dailyExpenses = {};
        filteredExpenses.forEach(expense => {
            const dateStr = expense.expense_date.toISOString().split('T')[0];
            dailyExpenses[dateStr] = (dailyExpenses[dateStr] || 0) + expense.amount;
        });
        labels = Object.keys(dailyExpenses).sort().map(date => new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }));
        amounts = Object.keys(dailyExpenses).sort().map(date => dailyExpenses[date]);
        chartLabel = 'ค่าใช้จ่ายรายวัน (฿)';
    }
    
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    // Update chart title
    const chartBox = document.getElementById('expense-chart').closest('.chart-box');
    if (chartBox) {
        const titleElement = chartBox.querySelector('h3');
        if (currentPeriod === 'month') titleElement.textContent = 'ค่าใช้จ่ายรายสัปดาห์';
        else if (currentPeriod === 'year' || currentPeriod === 'all') titleElement.textContent = 'ค่าใช้จ่ายรายเดือน';
        else titleElement.textContent = 'ค่าใช้จ่ายรายวัน';
    }

    expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
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
    
    let labels = [];
    let amounts = [];
    let chartLabel = 'แนวโน้มค่าใช้จ่าย (฿)';

    if (currentPeriod === 'year' || currentPeriod === 'all') {
        // Group by month for longer periods
        const monthlyExpenses = {};
        filteredExpenses.forEach(expense => {
            const monthKey = expense.expense_date.getFullYear() + '-' + String(expense.expense_date.getMonth() + 1).padStart(2, '0');
            monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + expense.amount;
        });
        labels = Object.keys(monthlyExpenses).sort().map(month => {
            const [year, monthNum] = month.split('-');
            return new Date(year, monthNum - 1).toLocaleDateString('th-TH', { year: 'numeric', month: 'short' });
        });
        amounts = Object.keys(monthlyExpenses).sort().map(month => monthlyExpenses[month]);
    } else {
        // Group by day for shorter periods
        const dailyExpenses = {};
        filteredExpenses.forEach(expense => {
            const dateStr = expense.expense_date.toISOString().split('T')[0];
            dailyExpenses[dateStr] = (dailyExpenses[dateStr] || 0) + expense.amount;
        });
        labels = Object.keys(dailyExpenses).sort().map(date => new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }));
        amounts = Object.keys(dailyExpenses).sort().map(date => dailyExpenses[date]);
    }
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    // Update chart title
    const chartBox = document.getElementById('trend-chart').closest('.chart-box');
    if (chartBox) {
        chartBox.querySelector('h3').textContent = 'แนวโน้มค่าใช้จ่าย';
    }

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
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
    const recentExpenses = [...filteredExpenses]
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
    displayRecentExpenses();
}