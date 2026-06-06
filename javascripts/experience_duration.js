(function () {
    function parseYm(str) {
        if (!str) return null;
        const [y, m] = str.split('-').map(Number);
        return { y, m };
    }

    function diffMonths(start, end) {
        return (end.y - start.y) * 12 + (end.m - start.m) + 1;
    }

    function formatDuration(months) {
        if (months <= 0) return '';
        const y = Math.floor(months / 12);
        const m = months % 12;
        const parts = [];
        if (y > 0) parts.push(y + ' yr' + (y > 1 ? 's' : ''));
        if (m > 0) parts.push(m + ' mo' + (m > 1 ? 's' : ''));
        return parts.join(' ');
    }

    function monthName(m) {
        return ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][m - 1];
    }

    function update() {
        const now = new Date();
        const today = { y: now.getFullYear(), m: now.getMonth() + 1 };

        document.querySelectorAll('.experience-meta[data-start]').forEach(el => {
            const start = parseYm(el.dataset.start);
            const endAttr = el.dataset.end;
            const end = endAttr ? parseYm(endAttr) : today;
            if (!start || !end) return;

            const rangeEl = el.querySelector('.exp-range');
            const durEl = el.querySelector('.exp-duration');

            if (rangeEl) {
                const startStr = monthName(start.m) + ' ' + start.y;
                const endStr = endAttr ? (monthName(end.m) + ' ' + end.y) : 'Present';
                rangeEl.textContent = startStr + ' — ' + endStr;
            }

            if (durEl) {
                const txt = formatDuration(diffMonths(start, end));
                if (txt) durEl.textContent = '(' + txt + ')';
            }
        });
    }

    // Idempotent — safe to re-run on every SPA navigation into the page
    if (window.SPA && window.SPA.register) {
        window.SPA.register('experience.html', { init: update });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', update);
    } else {
        update();
    }
})();
