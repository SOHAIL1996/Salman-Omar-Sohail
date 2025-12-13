// Theme Toggle Script
// Default: Light theme, Toggle to: Dark theme

(function() {
    const THEME_KEY = 'portfolio-theme';

    // Get saved theme or default to light
    function getTheme() {
        return localStorage.getItem(THEME_KEY) || 'light';
    }

    // Apply theme to document
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        updateToggleButton(theme);
    }

    // Update toggle button icon and label
    function updateToggleButton(theme) {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        const icon = toggle.querySelector('i');
        const label = toggle.querySelector('.theme-toggle-label');

        if (theme === 'light') {
            // In light mode, show option to switch to dark
            if (icon) {
                icon.className = 'fa-solid fa-moon';
            }
            if (label) {
                label.textContent = 'Dark';
            }
        } else {
            // In dark mode, show option to switch to light
            if (icon) {
                icon.className = 'fa-solid fa-sun';
            }
            if (label) {
                label.textContent = 'Light';
            }
        }
    }

    // Toggle between themes
    function toggleTheme() {
        const currentTheme = getTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, newTheme);
        applyTheme(newTheme);
    }

    // Initialize theme on page load (before DOM ready to prevent flash)
    applyTheme(getTheme());

    // Set up toggle button when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', toggleTheme);
            updateToggleButton(getTheme());
        }
    });

    // Expose toggle function globally if needed
    window.toggleTheme = toggleTheme;
})();
