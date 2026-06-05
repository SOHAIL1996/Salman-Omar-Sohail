// Theme system disabled: site is locked to the default ("light") theme.
// The full multi-theme CSS variables in css_common.css are intentionally kept
// so the theme switcher can be re-enabled later without restoring variables.

(function () {
    document.documentElement.removeAttribute('data-theme');

    window.toggleTheme = function () { /* disabled */ };
    window.setTheme = function () { /* disabled */ };
})();
