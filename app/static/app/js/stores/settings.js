document.addEventListener('alpine:init', () => {
    Alpine.store('settings', {
        isDarkTheme: safePersist(true, 'isDarkTheme'),
        isCompactMode: safePersist(false, 'isCompactMode'),
        init() {
        }
    });
});
