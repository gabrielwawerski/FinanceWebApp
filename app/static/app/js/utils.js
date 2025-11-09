function getFilteredCategories(categories, typeFilter) {
    // typeFilter: 'income', 'expense', or null/undefined for all
    return categories.filter(c => !typeFilter || c.type === typeFilter);
}


function safePersist(defaultValue, key) {
	try {
		const stored = localStorage.getItem(key);
		return Alpine.$persist(stored ? JSON.parse(stored) : defaultValue).as(key);
	} catch {
		return Alpine.$persist(defaultValue).as(key);
	}
}