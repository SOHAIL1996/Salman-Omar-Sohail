(function () {
    let abort = null;

    function init() {
        teardown();
        const table = document.getElementById('rubricTable');
        if (!table) return;
        const tbody = table.tBodies[0];
        const rows = Array.from(tbody.rows);
        const search = document.getElementById('rubricSearch');
        const count = document.getElementById('rubricCount');

        abort = new AbortController();
        const signal = abort.signal;

        function updateCount() {
            const visible = rows.filter(r => r.style.display !== 'none').length;
            if (count) count.textContent = `${visible} / ${rows.length}`;
        }
        updateCount();

        if (search) {
            search.addEventListener('input', () => {
                const q = search.value.trim().toLowerCase();
                rows.forEach(r => {
                    const text = r.textContent.toLowerCase();
                    r.style.display = (!q || text.includes(q)) ? '' : 'none';
                });
                updateCount();
            }, { signal });
        }

        const headers = Array.from(table.tHead.rows[0].cells);
        headers.forEach((th, idx) => {
            if (!th.classList.contains('sortable')) return;
            th.addEventListener('click', () => {
                const type = th.dataset.type || 'text';
                const asc = !th.classList.contains('sort-asc');
                headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
                th.classList.add(asc ? 'sort-asc' : 'sort-desc');

                const sorted = rows.slice().sort((a, b) => {
                    const av = a.cells[idx].textContent.trim();
                    const bv = b.cells[idx].textContent.trim();
                    if (type === 'num') {
                        const na = av === 'n/a' ? -Infinity : parseFloat(av);
                        const nb = bv === 'n/a' ? -Infinity : parseFloat(bv);
                        return asc ? na - nb : nb - na;
                    }
                    return asc ? av.localeCompare(bv) : bv.localeCompare(av);
                });
                sorted.forEach(r => tbody.appendChild(r));
            }, { signal });
        });
    }

    function teardown() {
        if (abort) { abort.abort(); abort = null; }
    }

    if (window.SPA && window.SPA.register) {
        window.SPA.register('rubric.html', { init, teardown });
    }
    if (document.getElementById('rubricTable')) init();
})();
