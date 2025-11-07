document.addEventListener('alpine:init', () => {
    Alpine.store('app', {
        isDarkTheme: Alpine.$persist(true).as('isDarkTheme'),

        transactions: window.initialTransactions,
        categories: window.initialCategories,

        isIncome: false,
        setType(income) {
            this.isIncome = income;
        },

        mobileBreakpoint: 767,
        isMobile: window.innerWidth <= this.mobileBreakpoint,

        showTransactionModal: false,

        openTransactionModal() {
            this.showTransactionModal = true;
        },

        closeTransactionModal() {
            this.showTransactionModal = false;
        },

        showCategoryModal: false,
        openCategoryModal() {
            this.showCategoryModal = true;
        },
        closeCategoryModal() {
            this.showCategoryModal = false;
        },

                setIncome() {
            this.setType(true);
        },
        setExpense() {
            this.setType(false);
        },

        init() {
            window.addEventListener('DOMContentLoaded', () => {
                this.isMobile = window.innerWidth <= this.mobileBreakpoint;
            })

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
