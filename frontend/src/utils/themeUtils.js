/**
 * themeUtils.js — Utility để quản lý theme (dark/light) toàn app.
 *
 * Nguyên tắc:
 *  - Theme được đọc từ user.settings.theme (server) — nguồn sự thật chính.
 *  - Khi app khởi động (trước khi fetch user), đọc từ localStorage cache để tránh flash.
 *  - applyTheme() thêm/xóa class "dark" trên <html> (Tailwind CSS dark mode via class).
 */

const THEME_CACHE_KEY = 'appTheme';

/**
 * Áp dụng theme lên toàn bộ document.
 * @param {'dark'|'light'} theme
 */
export function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
    }
    // Cache lại để dùng lần sau
    try {
        localStorage.setItem(THEME_CACHE_KEY, theme);
    } catch {
        // ignore
    }
}

/**
 * Đọc theme đã cache từ localStorage (dùng khi app khởi động trước fetch user).
 * Fallback về 'light' nếu chưa có.
 * @returns {'dark'|'light'}
 */
export function getCachedTheme() {
    try {
        const cached = localStorage.getItem(THEME_CACHE_KEY);
        if (cached === 'dark' || cached === 'light') return cached;
        // Fallback: thử đọc từ user cache
        const raw = localStorage.getItem('user');
        if (raw) {
            const user = JSON.parse(raw);
            const theme = user?.settings?.theme;
            if (theme === 'dark' || theme === 'light') return theme;
        }
    } catch {
        // ignore
    }
    return 'light';
}

/**
 * Áp dụng theme được cache ngay lập tức (gọi ở main.jsx trước React render).
 */
export function applyThemeImmediate() {
    applyTheme(getCachedTheme());
}
