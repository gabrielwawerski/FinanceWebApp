document.addEventListener('alpine:init', () => {
    Alpine.store('app', {
        isMobile: window.innerWidth <= 767,
        isDarkTheme: safePersist(true, 'isDarkTheme'),

        lastBootstrapTime: safePersist(null, 'lastBootstrapTime'),
        lastSyncTime: safePersist(null, 'lastSyncTime'),
        lastTransactionUpdate: safePersist(null, 'lastTransactionUpdate'),
        lastCategoryUpdate: safePersist(null, 'lastCategoryUpdate'),

        showTransactionModal: false,

        isLoading: false,
        firstRun: true,

		setLoading(isLoading) {
			this.isLoading = isLoading;
		},

        init() {
            this.updateIsMobile();
            const throttle = (fn, limit) => {
                let waiting = false;
                return (...args) => {
                    if (!waiting) {
                        fn.apply(this, args);
                        waiting = true;
                        setTimeout(() => waiting = false, limit);
                    }
                };
            };

            // Add throttled resize listener
            window.addEventListener('resize', throttle(() => this.updateIsMobile(), 100));

            window.addEventListener('orientationchange', () => {
	        	// Force recalculation after rotation settles
	        	setTimeout(() => this.updateIsMobile(), 100);
	        });

            let focusTimeout;
            window.addEventListener('focus', () => {
                clearTimeout(focusTimeout);
                focusTimeout = setTimeout(() => this.syncIfNeeded(), 1000);
                this.updateIsMobile()
            });

            // Run bootstrap only on the homepage
            if (window.location.pathname === '/') {
                this.bootstrap();
            }
        },

        updateIsMobile() {
            Alpine.store('app').isMobile = window.innerWidth <= 767;
        },

        toggleTheme() {
            this.isDarkTheme = !this.isDarkTheme;
        },

        // --- Bootstrap / delta fetch ---
        async bootstrap(autoRefresh = false) {
            const now = Date.now();
            const minInterval = 1000;
            if (this.lastBootstrapTime && now - this.lastBootstrapTime < minInterval) return;
            this.lastBootstrapTime = now;

            try {
                const params = new URLSearchParams();
                if (this.lastTransactionUpdate) params.append('last_transaction_update', this.lastTransactionUpdate);
                if (this.lastCategoryUpdate) params.append('last_category_update', this.lastCategoryUpdate);

                if (this.firstRun) {
                    this.setLoading(true);
                    this.firstRun = false;
                }
                const res = await fetch(`/api/bootstrap/?${params.toString()}`);
                if (!res.ok) {
                    this.setLoading(true);
                    throw new Error('Bootstrap failed');
                }
                const data = await res.json();

                const txStore = Alpine.store('transactions');

                // --- Transactions ---
                if (Array.isArray(data.transactions) && data.transactions.length > 0) {
                    const existingIds = new Set(txStore.transactions.map(t => t.id));
                    const newTxs = data.transactions.filter(t => !existingIds.has(t.id));
                    if (newTxs.length > 0) txStore.transactions.unshift(...newTxs);
                    if (data.last_transaction_update) this.lastTransactionUpdate = data.last_transaction_update;
                }

                // --- Categories ---
                if (Array.isArray(data.categories) && data.categories.length > 0) {
                    const existingIds = new Set(txStore.categories.map(c => c.id));
                    const newCats = data.categories.filter(c => !existingIds.has(c.id));
                    if (newCats.length > 0) txStore.categories.push(...newCats);
                    if (data.last_category_update) this.lastCategoryUpdate = data.last_category_update;
                }

                console.log('Bootstrap fetched:', data.transactions?.length ?? 0, 'transactions,', data.categories?.length ?? 0, 'categories');

            } catch (err) {
                console.error(err);
            } finally {
                this.setLoading(false);
            }
        },

        async syncIfNeeded() {
            // Skip sync if not on homepage
            if (window.location.pathname !== '/') return;

            const now = Date.now();
            const minInterval = 1000;
            if (this.lastSyncTime && now - this.lastSyncTime < minInterval) return;
            this.lastSyncTime = now;

            await this.bootstrap(true);
        },

        closeTransactionModal() {
            this.showTransactionModal = false;
        },

        openTransactionModal() {
            this.showTransactionModal = true;
        },

        get incomeTotal() {
            return Alpine.store('transactions').transactions
                .filter(t => t.is_income)
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        },

        get expenseTotal() {
            return Alpine.store('transactions').transactions
                .filter(t => !t.is_income)
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        },

        get balance() {
            return this.incomeTotal - this.expenseTotal;
        },
    });
});
