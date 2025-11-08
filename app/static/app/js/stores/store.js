document.addEventListener('alpine:init', () => {
	Alpine.store('app', {
		isMobile: window.innerWidth <= 767,
		isDarkTheme: Alpine.$persist(true).as('isDarkTheme'),

		lastBootstrapTime: Alpine.$persist(null).as('lastBootstrapTime'),
		lastSyncTime: Alpine.$persist(null).as('lastSyncTime'),
		lastTransactionUpdate: Alpine.$persist(null).as('lastTransactionUpdate'),
		lastCategoryUpdate: Alpine.$persist(null).as('lastCategoryUpdate'),

		showTransactionModal: false,

		init() {
			this.updateIsMobile();
			window.addEventListener('resize', () => this.updateIsMobile());

			let focusTimeout;
			window.addEventListener('focus', () => {
				clearTimeout(focusTimeout);
				focusTimeout = setTimeout(() => this.syncIfNeeded(), 300);
			});

			this.bootstrap();
		},

		updateIsMobile() {
			this.isMobile = window.innerWidth <= 767;
		},

		toggleTheme() {
			this.isDarkTheme = !this.isDarkTheme;
		},

		// --- Bootstrap / delta fetch ---
		async bootstrap() {
			const now = Date.now();
			const minInterval = 1000;
			if (this.lastBootstrapTime && now - this.lastBootstrapTime < minInterval) return;
			this.lastBootstrapTime = now;

			try {
				const params = new URLSearchParams();
				if (this.lastTransactionUpdate) params.append('last_transaction_update', this.lastTransactionUpdate);
				if (this.lastCategoryUpdate) params.append('last_category_update', this.lastCategoryUpdate);

				const res = await fetch(`/api/bootstrap/?${params.toString()}`);
				if (!res.ok) throw new Error('Bootstrap failed');
				const data = await res.json();

				const txStore = Alpine.store('transactions');

				// --- Transactions ---
				if (data.transactions?.length > 0) {
					const existingIds = new Set(txStore.transactions.map(t => t.id));
					const newTxs = data.transactions.filter(t => !existingIds.has(t.id));
					txStore.transactions.unshift(...newTxs);
				}

				if (data.last_transaction_update) {
					this.lastTransactionUpdate = data.last_transaction_update;
				}

				// --- Categories ---
				if (data.categories?.length > 0) {
					const existingIds = new Set(txStore.categories.map(c => c.id));
					const newCats = data.categories.filter(c => !existingIds.has(c.id));
					txStore.categories.push(...newCats);
				}

				if (data.last_category_update) {
					this.lastCategoryUpdate = data.last_category_update;
				}

				console.log('Bootstrap fetched:', data.transactions.length, 'transactions,', data.categories.length, 'categories');

			} catch (err) {
				console.error(err);
			}
		},

		async syncIfNeeded() {
			const now = Date.now();
			const minInterval = 1000;
			if (this.lastSyncTime && now - this.lastSyncTime < minInterval) return;
			this.lastSyncTime = now;

			await this.bootstrap();
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
