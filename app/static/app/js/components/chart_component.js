function chartApp() {
    return {
        chartInstance: null,

        init() {
            const ctx = document.getElementById("summaryChart");
            if (!this.chartInstance) {
                const chart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Income', 'Expense'],
                        datasets: [{
                            data: [this.incomeTotal, this.expenseTotal],
                            backgroundColor: ['#2ecc71', '#e74c3c']
                        }]
                    },
                    options: {responsive: true}
                });

                Object.seal(chart)
                this.chartInstance = chart
            }

            Alpine.effect(() => {
                // reactive update whenever transactions change
                this.chartInstance.data.datasets[0].data = [
                    this.$store.app.transactions.filter(t => t.is_income).reduce((s, t) => s + +t.amount, 0),
                    this.$store.app.transactions.filter(t => !t.is_income).reduce((s, t) => s + +t.amount, 0),
                ];
                this.chartInstance.update();
            });
        },
    };
}
