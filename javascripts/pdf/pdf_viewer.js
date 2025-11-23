// ---------- Config ----------
const PDF_LIST = [
    { label: "2021 | Publication | Property-Based Testing in Simulation for Verifying Robot Action Execution in Tabletop Manipulation", path: "pdf/2021_ecmr.pdf" },
];
const AUTO_ROTATE_MS = 10000;   // auto-switch interval
const MAX_PAGES = 80;           // safety cap
const SCALE_FIT = 1.0;          // base multiplier used in fit calculations

// ---------- Implementation ----------
(function () {
    const root = document.getElementById("pdfv");
    const sel = document.getElementById("pdfv-select");
    const zoomSel = document.getElementById("pdfv-zoom");
    const pagesWrap = document.getElementById("pdfv-pages");
    const openBtn = document.getElementById("pdfv-open");
    const dl = document.getElementById("pdfv-download");

    // Status line
    const status = document.createElement("div");
    status.setAttribute("role", "status");
    status.style.cssText = "margin:.25rem 0 .5rem;font-size:.9rem;opacity:.8";
    pagesWrap?.parentElement?.before(status);
    function setStatus(msg) { if (status) status.textContent = msg || ""; }

    // Guard
    if (!root || !sel || !pagesWrap || !dl) {
        console.warn("[pdfv] Missing required elements");
        return;
    }

    // Populate Document select
    sel.innerHTML = "";
    PDF_LIST.forEach((p, i) => {
        const o = document.createElement("option");
        o.value = p.path;
        o.textContent = p.label || p.path.split("/").pop();
        if (i === 0) o.selected = true;
        sel.appendChild(o);
    });

    // State
    let currentDoc = null;
    let currentPath = null;
    let cancelRender = false;
    let resizeTimer = null;
    let autoTimer = null;
    let zoomMode = (zoomSel && zoomSel.value) || "fit-page";

    function getScaleForPage(unscaled, viewportEl) {
        const cw = Math.max(1, viewportEl.clientWidth - 12);
        const ch = Math.max(1, viewportEl.clientHeight - 12);

        if (zoomMode === "fit-width") {
            return (cw / unscaled.width) * SCALE_FIT;
        }
        if (zoomMode === "fit-page") {
            const fitW = cw / unscaled.width;
            const fitH = ch / unscaled.height;
            return Math.min(fitW, fitH) * SCALE_FIT;
        }
        const numeric = Number(zoomMode);
        return (isFinite(numeric) && numeric > 0) ? numeric : 1.0;
    }

    async function loadPDF(path) {
        try {
            setStatus("Loading document…");
            cancelRender = true;
            pagesWrap.innerHTML = "";
            currentPath = path;

            // Reset scroll
            const viewportEl = pagesWrap.parentElement; // .pdfv-viewport
            if (viewportEl) viewportEl.scrollTop = 0;

            // Normalize to absolute URL
            const url = new URL(path, document.baseURI).href;

            // Actions
            dl.href = url;
            dl.setAttribute("download", url.split("/").pop());

            // Robust download (works even when <a download> is ignored for cross-origin)
            // Fix the download button functionality
            dl.onclick = async (ev) => {
                ev.preventDefault();
                try {
                    const pdfPath = currentPath;
                    const fileName = pdfPath.split("/").pop();

                    // For same-origin files, let the browser handle the download
                    const linkURL = new URL(pdfPath, document.baseURI);
                    const sameOrigin = linkURL.origin === window.location.origin;

                    if (sameOrigin) {
                        // Create a temporary anchor for same-origin download
                        const a = document.createElement("a");
                        a.href = pdfPath;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        return;
                    }

                    // For cross-origin files, use fetch with proper error handling
                    setStatus("Preparing download...");

                    const response = await fetch(pdfPath, {
                        mode: 'cors',
                        credentials: 'omit'
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
                    }

                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);

                    // Create and trigger download
                    const a = document.createElement("a");
                    a.href = blobUrl;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();

                    // Clean up
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);

                    setStatus("Download started");
                } catch (error) {
                    console.error("Download error:", error);
                    setStatus("Download failed - opening in new tab");

                    // Fallback: open PDF in new tab
                    window.open(currentPath, '_blank');
                }
            };

            // Ensure worker
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = "mbs_themes/pdf.worker.min.js";
            }

            // Load with conservative options (some servers block range/stream)
            const loadingTask = pdfjsLib.getDocument({
                url,
                disableRange: true,
                disableStream: true,
                withCredentials: false
            });

            currentDoc = await loadingTask.promise;

            cancelRender = false;
            await renderAllPagesFit();
            setStatus(`Loaded: ${sel.options[sel.selectedIndex]?.textContent} (${currentDoc.numPages} page${currentDoc.numPages > 1 ? "s" : ""})`);
        } catch (err) {
            console.error("[pdfv] Load error:", err && (err.message || err));
            setStatus("Failed to load PDF. Check console & file path/CORS.");
            pagesWrap.innerHTML = `<p style="padding:.5rem;border:1px solid #e5e7eb;border-radius:.5rem;">
        Preview unavailable. <a href="${path}" target="_blank" rel="noopener">Open in new tab</a>
      </p>`;
        }
    }

    async function renderAllPagesFit() {
        if (!currentDoc) return;
        const viewportEl = pagesWrap.parentElement || pagesWrap;

        for (let p = 1; p <= Math.min(currentDoc.numPages, MAX_PAGES); p++) {
            if (cancelRender) return;

            const page = await currentDoc.getPage(p);
            const unscaled = page.getViewport({ scale: 1.0, rotation: 0 });
            const scale = getScaleForPage(unscaled, viewportEl);
            const viewport = page.getViewport({ scale });

            const cssW = Math.ceil(viewport.width);
            const cssH = Math.ceil(viewport.height);
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            const canvas = document.createElement("canvas");
            canvas.className = "pdfv-page";
            canvas.style.width = cssW + "px";
            canvas.style.height = cssH + "px";
            canvas.width = Math.ceil(cssW * dpr);
            canvas.height = Math.ceil(cssH * dpr);

            const ctx = canvas.getContext("2d", { alpha: true });
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, cssW, cssH);

            pagesWrap.appendChild(canvas);
            await page.render({ canvasContext: ctx, viewport, intent: "display" }).promise;
        }
    }

    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (currentDoc && currentPath) {
                cancelRender = true;
                pagesWrap.innerHTML = "";
                cancelRender = false;
                renderAllPagesFit();
            }
        }, 150);
    }

    function startAutoRotate() {
        stopAutoRotate();
        if (PDF_LIST.length < 2 || AUTO_ROTATE_MS <= 0) return;
        autoTimer = setInterval(() => {
            const idx = sel.selectedIndex;
            sel.selectedIndex = (idx + 1) % PDF_LIST.length;
            loadPDF(sel.value);
        }, AUTO_ROTATE_MS);
    }
    function stopAutoRotate() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    // Events
    sel.addEventListener("change", (e) => loadPDF(e.target.value));
    window.addEventListener("resize", onResize);
    root.addEventListener("mouseenter", stopAutoRotate);
    root.addEventListener("mouseleave", startAutoRotate);
    root.addEventListener("focusin", stopAutoRotate);
    root.addEventListener("focusout", startAutoRotate);

    if (zoomSel) {
        zoomSel.addEventListener("change", () => {
            const newVal = zoomSel.value;
            if (newVal !== zoomMode) {
                zoomMode = newVal;
                if (currentDoc) {
                    cancelRender = true;
                    pagesWrap.innerHTML = "";
                    cancelRender = false;
                    renderAllPagesFit();
                    const viewportEl = pagesWrap.parentElement;
                    if (viewportEl) viewportEl.scrollTop = 0;
                }
            }
        });
    }

    // Initial
    if (PDF_LIST.length) loadPDF(sel.value).then(startAutoRotate);
})();
