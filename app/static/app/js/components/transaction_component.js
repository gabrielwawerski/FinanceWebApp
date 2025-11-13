function transactionsList() {
	return {
		q: '',
		typeFilter: '',
		categoryFilter: '',
		rowsPerPage: safePersist(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tx-rows-per-page')) || 8, 'rowsPerPage'),
		currentPage: 1,

		init() {
			this.rowsPerPage = Number(this.rowsPerPage) || 8;

			this.$watch('rowsPerPage', () => this.currentPage = 1);
			this.$watch('$store.app.isMobile', (m) => {
				if (m) this.$store.settings.isCompactMode = false;
			});

			// When category changes → adjust type if needed
			this.$watch('categoryFilter', (catId, oldCatId) => {
				if (!catId) {
					// "All categories" selected → keep current type
					return;
				}

				const cat = this.categories.find(c => String(c.id) === String(catId));
				if (cat && cat.type && this.typeFilter !== cat.type) {
					this.typeFilter = cat.type;
				}
			});
		},

		clearFilters() {
			this.q = '';
			this.typeFilter = '';
			this.categoryFilter = '';
			this.currentPage = 1;
			this.goToPage(1);
		},

		get transactions() {
			return Alpine.store('transactions').transactions || [];
		},
		get categories() {
			return Alpine.store('transactions').categories || [];
		},

		// Filter visible categories by type
		get visibleCategories() {
			if (!this.typeFilter) return this.categories;
			return this.categories.filter(c => c.type === this.typeFilter);
		},

		get filtered() {
			const q = (this.q || '').trim().toLowerCase();
			const cat = this.categoryFilter;
			const type = this.typeFilter;

			return this.transactions.filter(tx => {
				if (type && tx.category?.type !== type) return false;
				if (cat && String(tx.category_id) !== String(cat)) return false;
				if (!q) return true;
				if ((tx.description || '').toLowerCase().includes(q)) return true;
				if (String(tx.amount).toLowerCase().includes(q)) return true;
				return false;
			});
		},
		get filteredCount() {
			return this.filtered.length;
		},

		get totalPages() {
			return Math.max(1, Math.ceil(this.filteredCount / this.rowsPerPage));
		},
		get paginated() {
			const start = (this.currentPage - 1) * this.rowsPerPage;
			return this.filtered.slice(start, start + this.rowsPerPage);
		},

		get rowHeight() {
			return this.$store.settings.isCompactMode
				? Number(getComputedStyle(document.documentElement).getPropertyValue('--tx-row-h-compact')) || 40
				: Number(getComputedStyle(document.documentElement).getPropertyValue('--tx-row-h-default')) || 80;
		},
		get computedContainerHeight() {
			return Math.round(this.rowsPerPage * this.rowHeight);
		},

		goToPage(n) {
			const p = Math.max(1, Math.min(this.totalPages, n));
			this.currentPage = p;
		},
		nextPage() {
			this.goToPage(this.currentPage + 1);
		},
		prevPage() {
			this.goToPage(this.currentPage - 1);
		},

		setTypeFilter(type) {
			const prevType = this.typeFilter;
			this.typeFilter = type;

			// If switching to a specific type, remove category if it mismatches
			if (type) {
				const cat = this.categories.find(c => String(c.id) === String(this.categoryFilter));
				if (cat && cat.type !== type) {
					this.categoryFilter = '';
				}
			} else {
				// If switching to "All types", only reset category if previously constrained
				if (prevType) this.categoryFilter = '';
			}

			this.goToPage(1);
		},

		formatDate(dateStr) {
			const date = new Date(dateStr);
			return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
		},
		formatAmount(a) {
			const n = Number(a) || 0;
			const rounded = Math.round(n * 100) / 100;
			return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
		},
		lookupCategory(id) {
			const found = this.categories.find(c => String(c.id) === String(id));
			return found ? found.name : '';
		},
	};
}
