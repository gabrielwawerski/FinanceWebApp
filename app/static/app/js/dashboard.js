document.addEventListener('alpine:init', () => {
    Alpine.store('app', {
        transactions: window.initialTransactions,
        categories: window.initialCategories,

        isIncome: false,
        setType(income) {
            this.isIncome = income;
        },

        mobileBreakpoint: 800,
        isMobile: window.innerWidth <= this.mobileBreakpoint,

        showCategoryModal: false,
        openCategoryModal() {
            this.showCategoryModal = true;
        },
        closeCategoryModal() {
            this.showCategoryModal = false;
        },

        init() {
            // Update isMobile whenever window resizes
            window.addEventListener('resize', () => {
                this.isMobile = window.innerWidth <= this.mobileBreakpoint;
            });
        },

        get incomeTotal() {
            return this.transactions
                .filter(t => t.is_income)
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        },

        get expenseTotal() {
            return this.transactions
                .filter(t => !t.is_income)
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        },

        get balance() {
            return this.incomeTotal - this.expenseTotal;
        },

        addTransaction(transaction) {
            this.transactions.unshift(transaction);
        },

        addCategory(category) {
            this.categories.push(category);
        },
    });
    Alpine.store('app').init();
});
