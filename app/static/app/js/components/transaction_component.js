function transactionApp() {
    return {
        transactionDescription: '',
        transactionAmount: '',
        selectedCategoryId: null,
        showTransactionModal: false,
        isSubmitting: false,
        currentPage: 1,
        pageSize: 10,

        filteredCategories: [],

        init() {
            this.updateFilteredCategories();

            // Whenever type changes, update filtered categories
            this.$watch('$store.app.isIncome', () => {
                this.updateFilteredCategories();
            });

            this.$watch('selectedCategoryId', () => {
                console.log('Category changed to', this.selectedCategoryId);
            });

            // Listen for new category
            document.addEventListener('category-added', e => {
                this.updateFilteredCategories(e.detail);
            });
        },

        get selectedCategoryColor() {
            const cat = this.filteredCategories.find(c => c.id == this.selectedCategoryId); // note == instead of ===
            return cat ? cat.color : '#000';
        },

        updateFilteredCategories(newCategoryId = null) {
            const type = this.$store.app.isIncome ? 'income' : 'expense';
            this.filteredCategories = this.$store.app.categories.filter(c => c.type === type);

            // select newly added category if provided, otherwise keep current or default
            if (newCategoryId) {
                this.selectedCategoryId = newCategoryId;
            } else if (!this.filteredCategories.find(c => c.id === this.selectedCategoryId)) {
                this.selectedCategoryId = this.filteredCategories.length ? this.filteredCategories[0].id : null;
            }
        },

        setIncome() {
            this.$store.app.setType(true);
        },
        setExpense() {
            this.$store.app.setType(false);
        },

        async addTransaction() {
            this.isSubmitting = true;
            try {
                const res = await fetch(window.transactionsApiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": window.csrf_token
                    },
                    body: JSON.stringify({
                        description: this.transactionDescription,
                        amount: this.transactionAmount,
                        is_income: this.$store.app.isIncome,
                        category: this.selectedCategoryId
                    })
                });
                if (!res.ok) throw new Error("Failed to save transaction");
                const data = await res.json();
                this.$store.app.addTransaction(data);

                // Reset form
                this.transactionDescription = '';
                this.transactionAmount = '';
                this.$store.app.isIncome = false; // default to expense
                this.updateFilteredCategories(); // update dropdown
                this.showTransactionModal = false;
            } catch (e) {
                console.error(e);
            } finally {
                this.isSubmitting = false;
            }
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

        // Pagination helpers...
        get totalPages() {
            return Math.max(1, Math.ceil(this.$store.app.transactions.length / this.pageSize));
        },
        get paginatedTransactions() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.$store.app.transactions.slice(start, start + this.pageSize);
        },
        goNextPage() {
            if (this.currentPage < this.totalPages) this.currentPage++;
        },
        goPrevPage() {
            if (this.currentPage > 1) this.currentPage--;
        },

        get balance() {
            return this.$store.app.balance;
        },
    };
}
