/*
Software License Agreement (BSD)
@author  Salman Omar Sohail
*/

/* ---- SPA registry & shell helpers (shared by spa_router.js and page scripts) ---- */
window.SPA = window.SPA || {};
window.SPA.pages = window.SPA.pages || {};
window.SPA.register = window.SPA.register || function (route, mod) {
  (this.pages[route] = this.pages[route] || []).push(mod);
};
window.SPA._scrollingHTML = window.SPA._scrollingHTML || null;

// Inject the header "scrolling images" strip (lives inside the swapped <main>).
window.SPA.injectScrollingImages = function () {
  const mount = document.getElementById("scrollingImages");
  if (!mount) return;
  if (window.SPA._scrollingHTML != null) {
    mount.innerHTML = window.SPA._scrollingHTML;
    return;
  }
  fetch("scrolling_images.html")
    .then((r) => r.text())
    .then((html) => {
      window.SPA._scrollingHTML = html;
      const m = document.getElementById("scrollingImages");
      if (m) m.innerHTML = html;
    })
    .catch((e) => console.error("Error loading scrolling images:", e));
};

// Highlight the nav link for the current page.
window.SPA.setActiveNavLink = function () {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".side-nav a").forEach((a) => {
    const href = (a.getAttribute("href") || "").split("/").pop();
    a.classList.toggle("active", href === path);
  });
};

// Re-run shell hooks after the router swaps content.
window.addEventListener("spa:navigated", function () {
  window.SPA.injectScrollingImages();
  window.SPA.setActiveNavLink();
});

(function () {
  // ------- Utilities -------
  const fmtDate = (d) =>
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    ;

  // Unwrap all <mark data-nav-search>
  function clearHighlights(container = document.body) {
    const marks = container.querySelectorAll('mark[data-nav-search="1"]');
    marks.forEach((m) => {
      const parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize(); // merge text nodes
    });
  }

  // Walk text nodes (excluding certain elements)
  function* textNodesUnder(el) {
    const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "CANVAS", "SVG", "MARK"]);
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (skip.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        if (p.closest("#sideNav")) return NodeFilter.FILTER_REJECT; // exclude navbar itself
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n;
    while ((n = walker.nextNode())) yield n;
  }

  // Highlight term across document; returns array of created <mark> elements
  function highlightAll(term) {
    clearHighlights(document.body);
    if (!term || term.length < 2) return [];

    const marks = [];
    const rex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

    for (const tn of textNodesUnder(document.body)) {
      const text = tn.nodeValue;
      if (!rex.test(text)) continue;

      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      text.replace(rex, (match, offset) => {
        // preceding text
        if (offset > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, offset)));
        // mark
        const mark = document.createElement("mark");
        mark.setAttribute("data-nav-search", "1");
        mark.textContent = match;
        frag.appendChild(mark);
        marks.push(mark);
        lastIdx = offset + match.length;
      });
      // trailing text
      if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));

      // Replace node
      tn.parentNode.replaceChild(frag, tn);
    }

    return marks;
  }

  // Scroll a given element into view nicely
  function smartScroll(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // ------- State for navigation between matches -------
  let matches = [];
  let matchIndex = -1;

  function updateSearchCount() {
    const badge = document.getElementById("searchCount");
    if (!badge) return;
    if (!matches.length) {
      badge.textContent = "";
      badge.style.display = "none";
    } else {
      badge.textContent = `${matchIndex + 1}/${matches.length}`;
      badge.style.display = "";
    }
  }

  function jumpTo(idx) {
    if (!matches.length) return;
    matchIndex = (idx + matches.length) % matches.length;
    matches.forEach((m) => m.removeAttribute("data-current"));
    const cur = matches[matchIndex];
    cur.setAttribute("data-current", "1");
    smartScroll(cur);
    updateSearchCount();
  }

  // ------- DOM Ready & Fetches -------
  document.addEventListener("DOMContentLoaded", () => {
    // Load topbar (date · location · local time)
    const topbarMount = document.getElementById("topbar");
    if (topbarMount) {
      fetch("topbar.html")
        .then((r) => r.text())
        .then((html) => {
          // Replace the mount wrapper so `.topbar` becomes a direct body child;
          // sticky positioning needs a tall parent (the body) to stick against.
          topbarMount.outerHTML = html;

          const bd = document.getElementById("buildDate");
          if (bd) {
            const d = new Date(document.lastModified);
            bd.textContent = fmtDate(d);
          }

          const navTime = document.getElementById("navLocalTime");
          const navTz = document.getElementById("navTimezone");
          if (navTime) {
            const TZ = "Europe/Berlin";
            const updateNavTime = () => {
              const now = new Date();
              navTime.textContent = now.toLocaleTimeString("en-GB", {
                hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ,
              });
              navTime.dateTime = now.toISOString();
              if (navTz) {
                const part = new Intl.DateTimeFormat("en-GB", {
                  timeZone: TZ, timeZoneName: "short",
                }).formatToParts(now).find((p) => p.type === "timeZoneName");
                navTz.textContent = part ? part.value : "";
              }
            };
            updateNavTime();
            setInterval(updateNavTime, 30000);
          }
        });
    }

    // Load navbar
    fetch("navbar.html")
      .then((response) => response.text())
      .then((html) => {
        const nav = document.getElementById("navbar");
        nav.innerHTML = html;
        window.SPA.setActiveNavLink();

        // --- Mobile navigation (off-canvas hamburger drawer) ---
        const navToggle = document.getElementById("navToggle");
        const navBackdrop = document.getElementById("navBackdrop");
        const sideNav = document.getElementById("sideNav");
        const toggleIcon = navToggle ? navToggle.querySelector("i") : null;
        const isMobileNav = () => window.matchMedia("(max-width: 768px)").matches;

        function setNav(open) {
          document.body.classList.toggle("nav-open", open);
          if (navToggle) {
            navToggle.setAttribute("aria-expanded", open ? "true" : "false");
            navToggle.setAttribute(
              "aria-label",
              open ? "Close navigation menu" : "Open navigation menu"
            );
          }
          if (toggleIcon) {
            toggleIcon.classList.toggle("fa-bars", !open);
            toggleIcon.classList.toggle("fa-xmark", open);
          }
          if (open && sideNav) {
            const firstLink = sideNav.querySelector("a");
            if (firstLink) firstLink.focus();
          }
        }

        if (navToggle) {
          navToggle.addEventListener("click", () =>
            setNav(!document.body.classList.contains("nav-open"))
          );
        }
        if (navBackdrop) {
          navBackdrop.addEventListener("click", () => setNav(false));
        }
        if (sideNav) {
          // Tapping a real nav link closes the drawer (skip the dropdown toggle)
          sideNav.addEventListener("click", (e) => {
            const link = e.target.closest("a");
            if (
              link &&
              !link.classList.contains("dropdown-toggle") &&
              isMobileNav()
            ) {
              setNav(false);
            }
          });
        }
        // Escape closes the drawer and returns focus to the toggle
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
            setNav(false);
            if (navToggle) navToggle.focus();
          }
        });
        // Reset state when resizing back up to desktop
        window.addEventListener("resize", () => {
          if (!isMobileNav() && document.body.classList.contains("nav-open")) {
            setNav(false);
          }
        });

        // Wire up nav search for full-document search
        const input = document.getElementById("navSearch");
        if (input) {
          let debounce;
          input.addEventListener("input", (e) => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
              const term = e.target.value.trim();
              matches = highlightAll(term);
              matchIndex = matches.length ? 0 : -1;
              if (matches.length) smartScroll(matches[0]);
              updateSearchCount();
            }, 120);
          });

          // Press Enter to jump to next match; Shift+Enter for previous
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!matches.length) return;
              jumpTo(matchIndex + (e.shiftKey ? -1 : 1));
            }
            // Esc clears search
            if (e.key === "Escape") {
              input.value = "";
              matches = [];
              matchIndex = -1;
              clearHighlights(document.body);
              updateSearchCount();
            }
          });
        }
      })
      .catch((error) => console.error("Error loading navbar:", error));

    // Load scrolling images (cached + reusable across SPA swaps)
    window.SPA.injectScrollingImages();
  });
})();

/* Prefetch internal pages on hover / touch / focus so navigation feels instant.
   Shared assets (CSS/JS/images) are already cached across pages; this fetches
   the next page's HTML ahead of the click. Each URL is prefetched at most once. */
(function () {
  const prefetched = new Set();
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));

  function prefetch(href) {
    if (prefetched.has(href)) return;
    prefetched.add(href);
    idle(() => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = href;
      document.head.appendChild(link);
    });
  }

  function maybePrefetch(e) {
    const a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || a.target === "_blank") return;
    const href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#") return;
    try {
      const url = new URL(a.href, location.href);
      if (url.origin === location.origin && url.pathname.endsWith(".html")) {
        prefetch(url.href);
      }
    } catch (_) {}
  }

  document.addEventListener("pointerover", maybePrefetch);
  document.addEventListener("touchstart", maybePrefetch, { passive: true });
  document.addEventListener("focusin", maybePrefetch);
})();
