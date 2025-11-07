function transactionModalApp() {
	return {
		transactionDescription: '',
		transactionAmount: '',
		selectedCategoryId: null,
		isSubmitting: false,
		filteredCategories: [],

		init() {
			this.updateFilteredCategories();

			this.$watch('$store.app.isIncome', () => {
				this.updateFilteredCategories();
			});

			document.addEventListener('category-added', e => {
				this.updateFilteredCategories(e.detail);
			});
		},

		get selectedCategoryColor() {
	const cat = this.filteredCategories.find(c => c.id == this.selectedCategoryId);
	return cat ? cat.color : '#000';
},

		updateFilteredCategories(newCategoryId = null) {
			const type = this.$store.app.isIncome ? 'income' : 'expense';
			this.filteredCategories = this.$store.app.categories.filter(c => c.type === type);

			if (newCategoryId) {
				this.selectedCategoryId = newCategoryId;
			} else if (!this.filteredCategories.find(c => c.id === this.selectedCategoryId)) {
				this.selectedCategoryId = this.filteredCategories.length ? this.filteredCategories[0].id : null;
			}
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

				this.transactionDescription = '';
				this.transactionAmount = '';
				this.updateFilteredCategories();
				this.$store.app.closeTransactionModal();
			} catch (e) {
				console.error(e);
			} finally {
				this.isSubmitting = false;
			}
		},
	};
}
