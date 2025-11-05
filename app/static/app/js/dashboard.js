function dashboardApp() {
    return {
        // Transactions
        transactions: window.initialTransactions || [],
        newDescription: '',
        newAmount: '',
        newIsIncome: false,
        newCategory: null,
        showModal: false,
        isSubmitting: false,
        chartInstance: null,

        // Pagination
        currentPage: 1,
        pageSize: 2,

        // Categories
        categories: window.initialCategories || [], // all categories
        filteredCategories: [], // reactive filtered list
        newCategoryName: '',
        newCategoryColor: '#2ecc71', // default color

        init() {
            console.log("Total pages:", this.totalPages);
	this.$watch('currentPage', () => {
		console.log("Visible pages:", this.visiblePages);
	});

            // Initialize filteredCategories first
            this.updateCategoriesForType(this.newIsIncome ? 'income' : 'expense');

            // initialize chart
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
                    options: { responsive: true }
                });

                Object.seal(chart)
                this.chartInstance = chart
            }
        },

get totalPages() {
	return Math.max(1, Math.ceil(this.transactions.length / this.pageSize));
},

get paginatedTransactions() {
	const start = (this.currentPage - 1) * this.pageSize;
	return this.transactions.slice(start, start + this.pageSize);
},

get visiblePages() {
	const totalPages = this.totalPages;
	const currentPage = this.currentPage;
	const visible = [];

	// tweak these
	const edgeCount = 3;      // how many pages to show near the start or end
	const windowSize = 1;     // how many pages to show around the current page

	// show all if total pages small
	if (totalPages <= edgeCount + 2) {
		for (let i = 1; i <= totalPages; i++) visible.push(i);
		return visible;
	}

	const nearStart = currentPage <= edgeCount - 1;
	const nearEnd = currentPage >= totalPages - edgeCount + 2;

	if (nearStart) {
		// Example: 1 2 3 4 5 ... 16
		for (let i = 1; i <= edgeCount; i++) visible.push(i);
		visible.push('...');
		visible.push(totalPages);
	}
	else if (nearEnd) {
		// Example: 1 ... 12 13 14 15 16
		visible.push(1);
		visible.push('...');
		for (let i = totalPages - edgeCount + 1; i <= totalPages; i++) visible.push(i);
	}
	else {
		// Example: 1 ... 7 8 9 ... 16
		const startWindow = currentPage - windowSize;
		const endWindow = currentPage + windowSize;

		visible.push(1);
		visible.push('...');
		for (let i = startWindow; i <= endWindow; i++) visible.push(i);
		visible.push('...');
		visible.push(totalPages);
	}

	return visible;
},




setPage(page) {
	if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
		this.currentPage = page;
	}
},

goNextPage() {
	if (this.currentPage < this.totalPages) this.currentPage++;
},

goPrevPage() {
	if (this.currentPage > 1) this.currentPage--;
},


        // Totals
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

        get balance() {
            return this.incomeTotal - this.expenseTotal;
        },

        // Category management
        addCategory() {
            if (!this.newCategoryName) return;
            const newCat = {
                id: Date.now(), // temporary ID
                name: this.newCategoryName,
                color: this.newCategoryColor,
                type: this.newIsIncome ? 'income' : 'expense'
            };
            this.categories.push(newCat);
            this.newCategoryName = '';
            this.newCategoryColor = '#2ecc71';
            this.updateFilteredCategories();
        },

        updateCategoriesForType(type) {
            this.filteredCategories = this.categories.filter(c => c.type === type);

            // Update selection
            if (this.filteredCategories.length > 0) {
                this.newCategory = this.filteredCategories[0].id;
            } else {
                this.newCategory = null;
            }
        },

        updateChart() {
            if (!this.chartInstance) return;
            this.chartInstance.data.datasets[0].data = [this.incomeTotal, this.expenseTotal];
            this.chartInstance.update();
        },

        async addTransaction() {
            this.isSubmitting = true;
            try {
                const response = await fetch(window.transactionsApiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": window.csrf_token
                    },
                    body: JSON.stringify({
                        description: this.newDescription,
                        amount: this.newAmount,
                        is_income: this.newIsIncome,
                        category: this.newCategory
                    })
                });

                if (!response.ok) throw new Error("Failed to save transaction");

                const data = await response.json();
                this.transactions.unshift(data);
                this.updateChart();

                // Reset form
                this.newDescription = '';
                this.newAmount = '';
                this.newIsIncome = false;
                this.updateCategoriesForType(this.newIsIncome)
                this.showModal = false;

            } catch (e) {
                console.error(e);
            } finally {
                this.isSubmitting = false;
            }
        }
    }
}
