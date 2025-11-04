function dashboardApp() {
	return {
		transactions: window.initialTransactions || [],
		newDescription: '',
		newAmount: '',
		newIsIncome: false,
		showModal: false,
		chartInstance: null, // store Chart.js instance

		init() {
			const ctx = document.getElementById("summaryChart");

			// Only create chart once
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
					options: { responsive: true }
				});

                Object.seal(chart)
                this.chartInstance = chart
			}
		},

		get incomeTotal() {
			return this.transactions
				.filter(t => t.is_income)
				.reduce((sum, t) => sum + parseFloat(t.amount), 0);
		},

		get expenseTotal() {
			return this.transactions
				.filter(t => !t.is_income)
				.reduce((sum, t) => sum + parseFloat(t.amount), 0);
		},

		updateChart() {
			// Just update existing chart's data
			if (!this.chartInstance) return;

			this.chartInstance.data.datasets[0].data = [this.incomeTotal, this.expenseTotal];
			this.chartInstance.update();
		},

		async addTransaction() {
			const response = await fetch(window.transactionsApiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRFToken": window.csrf_token
				},
				body: JSON.stringify({
					description: this.newDescription,
					amount: this.newAmount,
					is_income: this.newIsIncome
				})
			});

			if (!response.ok) return console.error("Failed to save transaction");

			const data = await response.json();

			this.transactions.unshift(data);

			// Update chart, but do NOT create a new Chart
			this.updateChart();

			// Reset form and close modal
			this.newDescription = '';
			this.newAmount = '';
			this.newIsIncome = false;
			this.showModal = false;
		}
	}
}
