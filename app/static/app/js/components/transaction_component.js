function transactionApp() {
    return {
        // --- UI state ---
        currentPage: 1,
        pageSize: safePersist(5, 'pageSize'),

        // --- Filters (unified) ---
        filters: {
            description: '',
            type: '',       // '', 'income', 'expense'
            category: ''    // '', or category id as string
        },

        skeletonsVisible: false,

        // --- Derived data ---
        get allTransactions() {
            return this.$store.transactions?.transactions || [];
        },

        get categories() {
            return this.$store.transactions?.categories || [];
        },

        get filteredTransactions() {
            let list = [...this.allTransactions];

            // --- Filter by description / note ---
            const q = (this.filters.description || '').trim().toLowerCase();
            if (q) {
                list = list.filter(t =>
                    (String(t.description || '')).toLowerCase().includes(q) ||
                    (String(t.note || t.notes || '')).toLowerCase().includes(q)
                );
            }

            // --- Filter by type ---
            if (this.filters.type) {
                list = list.filter(t => this.resolveType(t) === this.filters.type);
            }

            // --- Filter by category ---
            if (this.filters.category) {
                list = list.filter(t => String(t.category_id) === String(this.filters.category));
            }

            return list;
        },

        get displayedCount() {
            return Math.max(1, this.paginatedTransactions.length); // count "No transactions found." as 1
        },

        get filteredCategories() {
            if (!this.filters.type) return this.categories; // show all if no type selected
            return this.categories.filter(c => c.type === this.filters.type);
        },

        get totalPages() {
            return Math.max(1, Math.ceil(this.filteredTransactions.length / this.pageSize));
        },

        get paginatedTransactions() {
            const page = Math.min(this.currentPage, this.totalPages);
            const start = (page - 1) * this.pageSize;
            return this.filteredTransactions.slice(start, start + this.pageSize);
        },

        get fillerCount() {
            const count = this.displayedCount;
            return count < this.pageSize ? this.pageSize - count : 0;
        },

        // --- Actions / pagination ---
        setPageSize(size) {
            this.pageSize = Number(size) || 5; // automatically persisted
        },
        goToPage(page) {
            const p = Math.min(Math.max(1, page), this.totalPages);
            if (p !== this.currentPage) this.currentPage = p;
        },
        nextPage() {
            this.goToPage(this.currentPage + 1);
        },
        prevPage() {
            this.goToPage(this.currentPage - 1);
        },
        clearFilters() {
            this.filters.description = '';
            this.filters.type = '';
            this.filters.category = '';
            this.currentPage = 1;
        },

        // --- Helpers ---
        formatDate(d) {
            if (!d) return '';
            try {
                const date = (typeof d === 'string') ? new Date(d) : d;
                return date.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: '2-digit'});
            } catch {
                return String(d);
            }
        },

         formatCompactDate(dateString) {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2); // last 2 digits
    return `${day}/${month}/${year}`; // e.g., 09/11/25
},

        formatAmount(n, currency = 'USD') {
            const val = Number(n) || 0;

            // Use Intl.NumberFormat just for the number (no currency)
            const formattedNumber = new Intl.NumberFormat(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(val);

            // Append currency after number
            return `${formattedNumber} ${currency}`;
        },

        resolveType(t) {
            if (!t) return '';
            if (typeof t.is_income === 'boolean') return t.is_income ? 'income' : 'expense';
            if (typeof t.amount === 'number') return t.amount >= 0 ? 'income' : 'expense';
            return '';
        },

        amountClass(t) {
            return this.resolveType(t) === 'expense' ? 'tx-amount--expense' : 'tx-amount--income';
        },

        // --- Init & watchers ---
        async init() {
            const store = this.$store.transactions;
            const hasFetch = store && typeof store.fetchTransactions === 'function';

            this.pageSize = Number(this.pageSize);

            // --- Watch filters for page reset & type/category sync ---
            const resetPage = () => this.currentPage = 1;

            this.$watch('filters.description', resetPage);
            this.$watch('filters.type', resetPage);
            this.$watch('filters.category', resetPage);
            this.$watch('pageSize', resetPage);

            // --- Sync category/type dependencies ---
            this.$watch('filters.type', (newType) => {
                // Remove category if it does not match new type
                if (this.filters.category) {
                    const selected = this.categories.find(c => String(c.id) === String(this.filters.category));
                    if (selected && selected.type !== newType) this.filters.category = '';
                }
            });

            this.$watch('filters.category', (newCat) => {
                if (!newCat) return;
                const cat = this.categories.find(c => String(c.id) === String(newCat));
                if (!cat) return;
                // Auto-set type to match category
                if (cat.type && cat.type !== this.filters.type) {
                    this.filters.type = cat.type;
                }
            });

            // --- Fetch data if needed ---
            if ((store?.transactions || []).length > 0) {
                Alpine.store('app').setLoading(false);
            } else {
                Alpine.store('app').setLoading(true);
                try {
                    if (hasFetch) {
                        await store.fetchTransactions();
                        if (typeof store.fetchCategories === 'function') {
                            await store.fetchCategories();
                        }
                    } else {
                        await new Promise(r => setTimeout(r, 300));
                    }
                } finally {
                    requestAnimationFrame(() => Alpine.store('app').setLoading(false));
                }
            }

            // --- Keep current page in range ---
            this.$watch(() => this.filteredTransactions.length, () => {
                if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
            });
        }
    };
}
