// Theme cycle: light (grey) → green → navy → orange → rose → purple → dark → light

(function () {
    const THEME_KEY = 'portfolio-theme';
    const THEMES = ['light', 'green', 'navy', 'orange', 'rose', 'purple', 'dark'];

    const THEME_META = {
        light:  { icon: 'fa-solid fa-circle-half-stroke', label: 'Grey'   },
        green:  { icon: 'fa-solid fa-leaf',               label: 'Green'  },
        navy:   { icon: 'fa-solid fa-anchor',             label: 'Navy'   },
        orange: { icon: 'fa-solid fa-fire',               label: 'Orange' },
        rose:   { icon: 'fa-solid fa-heart',              label: 'Rose'   },
        purple: { icon: 'fa-solid fa-wand-magic-sparkles',label: 'Purple' },
        dark:   { icon: 'fa-solid fa-moon',               label: 'Dark'   }
    };

    function getTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        return THEMES.includes(saved) ? saved : 'light';
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        updateToggleButton(theme);
    }

    function updateToggleButton(theme) {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        const icon = toggle.querySelector('i');
        const label = toggle.querySelector('.theme-toggle-label');
        const nextIdx = (THEMES.indexOf(theme) + 1) % THEMES.length;
        const next = THEMES[nextIdx];
        const meta = THEME_META[next];
        if (icon) icon.className = meta.icon;
        if (label) label.textContent = meta.label;
        toggle.setAttribute('title', 'Current: ' + THEME_META[theme].label + '. Click for ' + meta.label + '.');
        toggle.setAttribute('aria-label', 'Switch theme to ' + meta.label);
    }

    function cycleTheme() {
        const idx = THEMES.indexOf(getTheme());
        const next = THEMES[(idx + 1) % THEMES.length];
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    }

    applyTheme(getTheme());

    document.addEventListener('DOMContentLoaded', function () {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', cycleTheme);
            updateToggleButton(getTheme());
        }
    });

    window.toggleTheme = cycleTheme;
    window.setTheme = function (theme) {
        if (!THEMES.includes(theme)) return;
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
    };
})();
