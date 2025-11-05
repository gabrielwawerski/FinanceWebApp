function dashboardApp() {
    return {
        transactionDescription: '',
        transactionAmount: '',
        isIncome: false,
        selectedCategoryId: null,

        showTransactionModal: false,
        showCategoryModal: false,

        isSubmitting: false,
        chartInstance: null,

        // Pagination
        currentPage: 1,
        pageSize: 10,

        filteredCategories: [], // reactive filtered list
        categoryName: '',
        categoryColor: '#888888',
        categoryType: 'expense',

        init() {
            console.log("Total pages:", this.totalPages);
            this.$watch('currentPage', () => {
                console.log("Visible pages:", this.visiblePages);
            });

            this.updateCategoriesForType(this.isIncome ? 'income' : 'expense');

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
                    options: {responsive: true}
                });

                Object.seal(chart)
                this.chartInstance = chart
            }
        },

        addCategory() {
            fetch('/api/categories/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': window.csrf_token,
                },
                body: JSON.stringify({
                    name: this.categoryName,
                    color: this.categoryColor,
                    type: this.categoryType,
                }),
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to create category');
                    return res.json();
                })
                .then(data => {
                    this.$store.app.categories.push(data);

                    // Auto-select if it matches current type
                    const matchesType = this.isIncome
                        ? data.type === 'income'
                        : data.type === 'expense';
                    if (matchesType) this.selectedCategoryId = data.id;

                    // Reset + close
                    this.categoryName = '';
                    this.categoryColor = '#888888';
                    this.categoryType = 'expense';
                    this.showCategoryModal = false;
                })
                .catch(err => console.error(err))
                this.updateCategoriesForType(this.isIncome ? 'income' : 'expense');
        },


        get totalPages() {
            return Math.max(1, Math.ceil(this.$store.app.transactions.length / this.pageSize));
        },

        get paginatedTransactions() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.$store.app.transactions.slice(start, start + this.pageSize);
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
            } else if (nearEnd) {
                // Example: 1 ... 12 13 14 15 16
                visible.push(1);
                visible.push('...');
                for (let i = totalPages - edgeCount + 1; i <= totalPages; i++) visible.push(i);
            } else {
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
            return this.$store.app.transactions
                .filter(t => t.is_income)
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        },

        get expenseTotal() {
            return this.$store.app.transactions
                .filter(t => !t.is_income)
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        },

        get balance() {
            return this.incomeTotal - this.expenseTotal;
        },

        updateCategoriesForType(type) {
            this.filteredCategories = this.$store.app.categories.filter(c => c.type === type);

            // Update selection
            if (this.filteredCategories.length > 0) {
                this.selectedCategoryId = this.filteredCategories[0].id;
            } else {
                this.selectedCategoryId = null;
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
                        description: this.transactionDescription,
                        amount: this.transactionAmount,
                        is_income: this.isIncome,
                        category: this.selectedCategoryId
                    })
                });

                if (!response.ok) throw new Error("Failed to save transaction");

                const data = await response.json();
                this.$store.app.transactions.unshift(data);
                this.updateChart();

                // Reset form
                this.transactionDescription = '';
                this.transactionAmount = '';
                this.isIncome = false;
                this.updateCategoriesForType(this.isIncome)
                this.showTransactionModal = false;

            } catch (e) {
                console.error(e);
            } finally {
                this.isSubmitting = false;
            }
        }
    }
}
