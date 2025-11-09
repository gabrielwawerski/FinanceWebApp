function transactionModalApp() {
    return {
        transactionDescription: '',
        transactionAmount: '',
        selectedCategoryId: null,
        isIncome: true,  // Local now
        isSubmitting: false,
        filteredCategories: [],

        init() {
            this.updateFilteredCategories();
            this.$watch('isIncome', () => this.updateFilteredCategories());  // Watch local
            this.$watch(() => Alpine.store('transactions').categories, () => this.updateFilteredCategories());  // Explicit store watch
            document.addEventListener('category-added', e => {
                this.updateFilteredCategories(e.detail);
            });
        },

        get selectedCategoryColor() {
            const cat = this.filteredCategories.find(c => c.id == this.selectedCategoryId);
            return cat ? cat.color : '#000';
        },

        updateFilteredCategories(newCategoryId = null) {
            const type = this.isIncome ? 'income' : 'expense';
            this.filteredCategories = getFilteredCategories(Alpine.store('transactions').categories, type);

            if (newCategoryId) {
                this.selectedCategoryId = newCategoryId;
            } else if (!this.filteredCategories.find(c => c.id === this.selectedCategoryId)) {
                this.selectedCategoryId = this.filteredCategories.length ? this.filteredCategories[0].id : null;
            }
        },

        async addTransaction() {
            if (!this.transactionAmount || !this.selectedCategoryId) return;  // Basic validation

            this.isSubmitting = true;
            const payload = {
                description: this.transactionDescription?.trim() || '',
                amount: this.transactionAmount,
                is_income: this.isIncome,
                category_id: this.selectedCategoryId
            };

            try {
                await Alpine.store('transactions').addTransaction(payload);
                // Success: Reset and close
                this.transactionDescription = '';
                this.transactionAmount = '';
                this.selectedCategoryId = null;
                this.updateFilteredCategories();
                Alpine.store('app').closeTransactionModal();
            } catch (e) {
                console.error(e);
                // Optional: Add local error state/display (e.g., this.error = e.message)
            } finally {
                this.isSubmitting = false;
            }
        },

        toggleIncome() {
            this.isIncome = true;
        },

        toggleExpense() {
            this.isIncome = false;
        },
    };
}