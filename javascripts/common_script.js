/*
Software License Agreement (BSD)
@author  Salman Omar Sohail
*/

(function () {
  // ------- Utilities -------
  const fmtDate = (d) =>
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    // +
    // " " +
    // d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
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
    // Load navbar
    fetch("navbar.html")
      .then((response) => response.text())
      .then((html) => {
        const nav = document.getElementById("navbar");
        nav.innerHTML = html;

        // Set build date (if placeholder exists)
        const bd = document.getElementById("buildDate");
        if (bd) {
          const d = new Date(document.lastModified);
          bd.textContent = fmtDate(d);
        }

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

    // Load scrolling images
    fetch("scrolling_images.html")
      .then((response) => response.text())
      .then((data) => {
        document.getElementById("scrollingImages").innerHTML = data;
      })
      .catch((error) => console.error("Error loading scrolling images:", error));
  });
})();
