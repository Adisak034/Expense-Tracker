document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/expenses')
        .then(response => response.json())
        .then(result => {
            const data = result.data;
            const labels = data.map(e => e.expense_date).reverse();
            const amounts = data.map(e => e.amount).reverse();

            const ctx = document.getElementById('expense-chart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Expenses',
                        data: amounts,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        });
});