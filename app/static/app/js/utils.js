function getFilteredCategories(categories, typeFilter) {
    // typeFilter: 'income', 'expense', or null/undefined for all
    return categories.filter(c => !typeFilter || c.type === typeFilter);
}