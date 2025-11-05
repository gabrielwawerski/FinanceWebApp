const api = {
    async post(url, data) {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.csrf_token
            },
            body: JSON.stringify(data)
        })
        if (!res.ok) throw new Error('Network error')
        return await res.json()
    },

    getCategories: () => fetch('/api/categories/').then(r => r.json()),
    getTransactions: () => fetch('/api/transactions/').then(r => r.json())
}
