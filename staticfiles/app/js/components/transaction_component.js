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

        filters: {
            description: '',
            type: '',
            category: ''
        },

        sort: {
            column: null, // e.g., 'date', 'description', 'amount'
            direction: null // 'asc' or 'desc'; null = unsorted
        },

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

            this.$watch('filters', () => {
                this.currentPage = 1;
            }, {deep: true});
        },

        get filteredCategoriesForFilter() {
            // Determine type filter: null = all types
            const type = this.filters.type; // "income", "expense", or ""

            return this.$store.app.categories.filter(c => {
                if (!type) return true; // show all if no type selected
                return c.type === type;  // only categories matching type
            });
        },

        toggleSort(column) {
            if (this.sort.column === column) {
                // cycle direction: asc → desc → none
                if (this.sort.direction === 'asc') {
                    this.sort.direction = 'desc';
                } else if (this.sort.direction === 'desc') {
                    this.sort.column = null;
                    this.sort.direction = null;
                } else {
                    this.sort.direction = 'asc';
                }
            } else {
                this.sort.column = column;
                this.sort.direction = 'asc';
            }
            this.currentPage = 1; // reset page on sort
        },


        get filteredTransactions() {
            let txs = this.$store.app.transactions.filter(t => {
                const descMatch = t.description.toLowerCase().includes(this.filters.description.toLowerCase());
                const typeMatch = this.filters.type ? (this.filters.type === 'income' ? t.is_income : !t.is_income) : true;
                const categoryMatch = this.filters.category ? t.category?.id == this.filters.category : true;
                return descMatch && typeMatch && categoryMatch;
            });

            if (this.sort.column && this.sort.direction) {
                txs.sort((a, b) => {
                    let valA, valB;

                    switch (this.sort.column) {
                        case 'date':
                            valA = new Date(a.date);
                            valB = new Date(b.date);
                            break;
                        case 'description':
                            valA = a.description.toLowerCase();
                            valB = b.description.toLowerCase();
                            break;
                        case 'category':
                            valA = a.category?.name?.toLowerCase() || '';
                            valB = b.category?.name?.toLowerCase() || '';
                            break;
                        case 'type':
                            valA = a.is_income ? 1 : 0;
                            valB = b.is_income ? 1 : 0;
                            break;
                        case 'amount':
                            valA = parseFloat(a.amount);
                            valB = parseFloat(b.amount);
                            break;
                    }

                    if (valA < valB) return this.sort.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return this.sort.direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }

            return txs;
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
            return Math.max(1, Math.ceil(this.filteredTransactions.length / this.pageSize));
        },

        get paginatedTransactions() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredTransactions.slice(start, start + this.pageSize);
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
