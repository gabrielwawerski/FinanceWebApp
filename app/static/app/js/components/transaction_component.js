/* Use tabs for indentation as preferred. */
function transactionsList(){
	return {
		// reactive state
		q: '',
		categoryFilter: '',
		rowsPerPage: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tx-rows-per-page')) || 8,
		currentPage: 1,

		// init to read categories from store and react to store changes if needed
		init() {
			// ensure rowsPerPage numeric and valid
			this.rowsPerPage = Number(this.rowsPerPage) || 8;

			// recompute container if compact toggled or page size changed
			this.$watch('rowsPerPage', () => {
				this.currentPage = 1;
			});
			// watch compact mode change to keep the page consistent
			this.$watch('$store.settings.isCompactMode', () => {
				// keep current page, container will animate height
			});
		},

		// computed helpers pulling from your stores
		get transactions() {
			return Alpine.store('transactions').transactions || [];
		},
		get categories() {
			return Alpine.store('transactions').categories || [];
		},

		// Count after filters applied
		get filtered() {
			const q = (this.q || '').trim().toLowerCase();
			const cat = this.categoryFilter;
			return this.transactions.filter(tx => {
				if (cat && String(tx.category_id) !== String(cat)) return false;
				if (!q) return true;
				// search description and amount
				if ((tx.description || '').toLowerCase().includes(q)) return true;
				if (String(tx.amount).toLowerCase().includes(q)) return true;
				return false;
			});
		},
		get filteredCount() {
			return this.filtered.length;
		},

		// pagination:
		get totalPages() {
			return Math.max(1, Math.ceil(this.filteredCount / this.rowsPerPage));
		},
		get paginated() {
			const start = (this.currentPage - 1) * this.rowsPerPage;
			return this.filtered.slice(start, start + this.rowsPerPage);
		},

		// heights for container calculation (stay in sync with CSS variables)
		get rowHeight() {
			return this.$store.settings.isCompactMode
				? Number(getComputedStyle(document.documentElement).getPropertyValue('--tx-row-h-compact')) || 44
				: Number(getComputedStyle(document.documentElement).getPropertyValue('--tx-row-h-default')) || 70;
		},
		get headerHeight() {
			return Number(getComputedStyle(document.documentElement).getPropertyValue('--tx-header-h')) || 56;
		},
		get computedContainerHeight() {
			// container = header area is outside; this element receives: rowsPerPage * rowHeight
			// but we keep some small buffer for borders — use integer px
			return Math.round(this.rowsPerPage * this.rowHeight + 0); // header is outside this element
		},
		get computedListInnerHeight() {
			// same as container height, but useful if we want to subtract something later
			return Math.round(this.rowsPerPage * this.rowHeight);
		},

		// UI actions
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
		edit(tx){
			// delegate to your modal / store
			Alpine.store('app').openTransactionModal();
			// You might also want to set a selectedTransaction in a store
			console.log('edit requested', tx && tx.id);
		},

		// small helpers for display
		formatDate(d) {
			if (!d) return '';
			try {
				const dt = new Date(d);
				return dt.toLocaleDateString();
			} catch (e) {
				return d;
			}
		},
		formatAmount(a, isIncome){
			const n = Number(a) || 0;
			const sign = isIncome ? '+' : '-';
			// keep simple; you can replace with Intl.NumberFormat if you want locales
			return `${sign} ${n.toFixed(2)}`;
		},
		lookupCategory(id){
			const found = this.categories.find(c => String(c.id) === String(id));
			return found ? found.name : '';
		}
	};
}