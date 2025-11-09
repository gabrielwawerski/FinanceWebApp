document.addEventListener('alpine:init', () => {
	Alpine.store('transactions', {
		transactions: safePersist([], 'transactions'),
		categories: safePersist([], 'categories'),

		getApiHeaders() {
			return {
				'Content-Type': 'application/json',
				'X-CSRFToken': window.csrf_token || ''
			};
		},

		getApiUrl(resource = 'transactions', endpoint = '') {
			const baseUrls = {
				transactions: window.transactionsApiUrl || '/api/transactions',
				categories: '/api/categories'
			};
			const base = baseUrls[resource] || '/api/' + resource;
			return base.replace(/\/$/, '') + endpoint;
		},

		// --- TRANSACTIONS ---
		async addTransaction(payload) {
			const res = await fetch(this.getApiUrl('transactions', '/'), {
				method: 'POST',
				headers: this.getApiHeaders(),
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error('Failed to save transaction');

			const newTx = await res.json();
			// Prepend locally
			this.transactions.unshift(newTx);

			// Fetch server latest timestamp to avoid resending same transaction
			await Alpine.store('app').bootstrap();
		},

		async editTransaction(id, payload) {
			const res = await fetch(this.getApiUrl('transactions', `/${id}/`), {
				method: 'PATCH',
				headers: this.getApiHeaders(),
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error('Failed to update transaction');

			const updatedTx = await res.json();
			const idx = this.transactions.findIndex(t => t.id === id);
			if (idx !== -1) this.transactions[idx] = updatedTx;

			await Alpine.store('app').bootstrap();
		},

		async deleteTransaction(id) {
			const res = await fetch(this.getApiUrl('transactions', `/${id}/`), {
				method: 'DELETE',
				headers: { ...this.getApiHeaders(), 'Content-Type': '' }
			});
			if (!res.ok) throw new Error('Failed to delete transaction');

			this.transactions = this.transactions.filter(t => t.id !== id);
			await Alpine.store('app').bootstrap();
		},

		// --- CATEGORIES ---
		async addCategory(payload) {
			const res = await fetch(this.getApiUrl('categories', '/'), {
				method: 'POST',
				headers: this.getApiHeaders(),
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error('Failed to save category');

			const newCat = await res.json();
			this.categories.push(newCat);
			await Alpine.store('app').bootstrap();
		},

		async editCategory(id, payload) {
			const res = await fetch(this.getApiUrl('categories', `/${id}/`), {
				method: 'PATCH',
				headers: this.getApiHeaders(),
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error('Failed to update category');

			const updatedCat = await res.json();
			const idx = this.categories.findIndex(c => c.id === id);
			if (idx !== -1) this.categories[idx] = updatedCat;
			await Alpine.store('app').bootstrap();
		},

		async deleteCategory(id) {
			const res = await fetch(this.getApiUrl('categories', `/${id}/`), {
				method: 'DELETE',
				headers: { ...this.getApiHeaders(), 'Content-Type': '' }
			});
			if (!res.ok) throw new Error('Failed to delete category');

			this.categories = this.categories.filter(c => c.id !== id);
			await Alpine.store('app').bootstrap();
		}
	});
});
