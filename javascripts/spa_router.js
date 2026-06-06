/*
Software License Agreement (BSD)
@author  Salman Omar Sohail

Lightweight PJAX router: the shell (topbar, side nav, theme toggle, circuit
canvas) stays mounted; only <main class="main-panel"> content swaps. Each .html
page still works as a standalone document (progressive enhancement).
*/
(function () {
  "use strict";

  window.SPA = window.SPA || {};
  window.SPA.pages = window.SPA.pages || {};
  window.SPA.register = window.SPA.register || function (route, mod) {
    (this.pages[route] = this.pages[route] || []).push(mod);
  };

  const VER = "5.4";
  const L_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  const L_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

  // Per-route assets to lazy-load (in order). Local scripts get the cache-bust query.
  const ROUTES = {
    "index.html": { css: [], js: [] },
    "skills.html": { css: [], js: ["javascripts/skills_script.js"] },
    "rubric.html": { css: [], js: ["javascripts/rubric_script.js"] },
    "experience.html": { css: [L_CSS], js: [L_JS, "javascripts/gps_points.js", "javascripts/experience_duration.js"] },
    "robot_deployment.html": { css: [L_CSS], js: [L_JS, "javascripts/gps_points.js"] },
    "academia.html": { css: [], js: ["javascripts/pdf/pdf.min.js", "javascripts/pdf/pdf_viewer.js"] },
    "projects.html": { css: [], js: [{ src: "javascripts/model_scripts.js", module: true }, "javascripts/3d_assets_script.js"] },
  };

  const loadedScripts = new Set();
  const loadedCss = new Set();
  const loadedRoutes = new Set();

  function routeOf(pathname) {
    const file = pathname.split("/").pop();
    return file && file.length ? file : "index.html";
  }

  // Record assets already present from the entry page so we never double-load them.
  function seedLoaded() {
    document.querySelectorAll("script[src]").forEach((s) =>
      loadedScripts.add(new URL(s.getAttribute("src"), location.href).href)
    );
    document.querySelectorAll('link[rel="stylesheet"]').forEach((l) =>
      loadedCss.add(new URL(l.getAttribute("href"), location.href).href)
    );
  }

  function withVer(src) {
    if (/^https?:/i.test(src)) return src;          // external — leave as-is
    return src + (src.indexOf("?") === -1 ? "?v=" + VER : "");
  }

  function loadCss(href) {
    const abs = new URL(href, location.href).href;
    if (loadedCss.has(abs)) return;
    loadedCss.add(abs);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(spec) {
    const src = typeof spec === "string" ? spec : spec.src;
    const isModule = typeof spec === "object" && spec.module;
    const finalSrc = withVer(src);
    const abs = new URL(finalSrc, location.href).href;
    if (loadedScripts.has(abs)) return Promise.resolve(false);
    loadedScripts.add(abs);
    return new Promise((resolve) => {
      const el = document.createElement("script");
      if (isModule) el.type = "module";
      el.src = finalSrc;
      el.onload = () => resolve(true);
      el.onerror = () => { console.error("[spa] failed to load", finalSrc); resolve(false); };
      document.head.appendChild(el);
    });
  }

  // Load a route's assets in order. Returns true if anything was newly injected
  // (in which case those scripts self-initialised against the freshly-swapped DOM).
  async function loadRouteAssets(route) {
    const cfg = ROUTES[route];
    if (!cfg) return false;
    (cfg.css || []).forEach(loadCss);
    let injectedAny = false;
    for (const spec of cfg.js || []) {
      const injected = await loadScript(spec);
      injectedAny = injectedAny || injected;
    }
    return injectedAny;
  }

  function runInit(route) {
    (window.SPA.pages[route] || []).forEach((mod) => {
      try { mod.init && mod.init(); } catch (e) { console.error("[spa] init error", route, e); }
    });
  }
  function runTeardown(route) {
    (window.SPA.pages[route] || []).forEach((mod) => {
      try { mod.teardown && mod.teardown(); } catch (e) { console.error("[spa] teardown error", route, e); }
    });
  }

  let currentRoute = routeOf(location.pathname);
  let navigating = false;

  async function navigate(href, opts) {
    const push = !opts || opts.push !== false;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) { location.href = href; return; }
    const route = routeOf(url.pathname);

    // Same page → just scroll to top, no swap.
    if (url.pathname === location.pathname && route === currentRoute) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (navigating) return;
    navigating = true;
    document.body.classList.add("spa-loading");

    let doc;
    try {
      const res = await fetch(url.href, { credentials: "same-origin" });
      const text = await res.text();
      doc = new DOMParser().parseFromString(text, "text/html");
    } catch (e) {
      location.href = url.href; // network/parse failure → hard navigate
      return;
    }

    const newMain = doc.querySelector("main.main-panel") || doc.getElementById("main-content");
    const main = document.getElementById("main-content");
    if (!newMain || !main) { location.href = url.href; return; }

    runTeardown(currentRoute);

    main.innerHTML = newMain.innerHTML;
    if (doc.title) document.title = doc.title;
    currentRoute = route;

    if (push) history.pushState({ route }, "", url.href);
    window.scrollTo(0, 0);

    const injected = await loadRouteAssets(route);
    loadedRoutes.add(route);
    if (!injected) runInit(route); // already-loaded scripts won't self-init

    document.body.classList.remove("spa-loading");
    window.dispatchEvent(new CustomEvent("spa:navigated", { detail: { route } }));
    try { main.focus({ preventScroll: true }); } catch (_) {}
    navigating = false;
  }
  window.SPA.navigate = navigate;

  // Intercept internal link clicks.
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    const href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#") return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (!url.pathname.endsWith(".html")) return;
    e.preventDefault();
    navigate(url.href, { push: true });
  });

  // Back / forward.
  window.addEventListener("popstate", () => {
    navigate(location.href, { push: false });
  });

  // Seed entry-page assets + mark current route loaded once the DOM is ready.
  function boot() {
    seedLoaded();
    loadedRoutes.add(currentRoute);
    history.replaceState({ route: currentRoute }, "", location.href);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
