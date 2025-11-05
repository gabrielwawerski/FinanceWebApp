function categoryApp() {
    return {
        categoryName: '',
        categoryColor: '#888888',
        categoryType: 'expense',

        init() {
            // Sync default category type with current transaction type
            this.setDefaultType();

            this.$watch('$store.app.isIncome', (isInc) => {
                this.categoryType = isInc ? 'income' : 'expense';
            });
        },

        setDefaultType() {
            this.categoryType = this.$store.app.isIncome ? 'income' : 'expense';
        },

        resetForm() {
            this.categoryName = '';
            this.categoryColor = '#888888';
            this.categoryType = this.$store.app.isIncome ? 'income' : 'expense';
        },

        close() {
            this.$store.app.closeCategoryModal();
            this.resetForm();
        },

        async addCategory() {
            try {
                const res = await fetch('/api/categories/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': window.csrf_token,
                    },
                    body: JSON.stringify({
                        name: this.categoryName,
                        color: this.categoryColor,
                        type: this.categoryType,
                    }),
                });

                if (!res.ok) throw new Error('Failed to create category');
                const cat = await res.json();

                this.$store.app.addCategory(cat);

                // Notify transaction modal with the new category id
                document.dispatchEvent(new CustomEvent('category-added', {detail: cat.id}));

                this.close();

            } catch (err) {
                console.error(err);
            }
        },


        get showCategoryModal() {
            return this.$store.app.showCategoryModal;
        },
    };
}
