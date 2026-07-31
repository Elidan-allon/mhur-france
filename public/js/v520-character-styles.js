/* ============================================================
   MHUR FRANCE — V536
   Navigation intelligente, sans observateur et sans rendu retardé.
   ============================================================ */
(() => {
  "use strict";

  const STORAGE_KEY = "mhur_v536_scroll_positions";

  function value(name, fallback = "") {
    try {
      if (name === "page" && typeof page !== "undefined") return page;
      if (name === "selectedChar" && typeof selectedChar !== "undefined") {
        return selectedChar;
      }
      if (name === "selectedStyle" && typeof selectedStyle !== "undefined") {
        return selectedStyle;
      }
      if (name === "selectedCostume" && typeof selectedCostume !== "undefined") {
        return selectedCostume;
      }
    } catch (_) {}

    return window[name] ?? fallback;
  }

  function state() {
    return {
      page: String(value("page", "home") || "home"),
      char: String(value("selectedChar", "") || ""),
      style: String(value("selectedStyle", "") || ""),
      costume: String(value("selectedCostume", "") || "")
    };
  }

  function depth(current) {
    if (current.page === "characters" || current.page === "tunings") {
      if (current.char && current.style) return 2;
      if (current.char) return 1;
      return 0;
    }

    if (current.page === "costumes" || current.page === "builds") {
      return current.char ? 1 : 0;
    }

    return 0;
  }

  function signature(current) {
    return [
      current.page,
      current.char,
      current.style,
      current.costume
    ].join("|");
  }

  function listKey(current) {
    return [
      current.page,
      depth(current),
      current.char || "liste"
    ].join("|");
  }

  function loadPositions() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  const positions = loadPositions();

  function savePositions() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    } catch (_) {}
  }

  function scrollToY(y) {
    window.scrollTo({
      left: 0,
      top: Math.max(0, Number(y) || 0),
      behavior: "auto"
    });
  }

  function installRenderNavigation() {
    if (
      typeof window.render !== "function" ||
      window.render.__mhurV536Navigation
    ) {
      return;
    }

    const original = window.render;
    let previous = state();

    const wrapped = function () {
      const before = previous;
      const after = state();
      const oldY = window.scrollY || 0;

      const categoryChanged = before.page !== after.page;
      const beforeDepth = depth(before);
      const afterDepth = depth(after);
      const entering = !categoryChanged && afterDepth > beforeDepth;
      const returning = !categoryChanged && afterDepth < beforeDepth;
      const same = signature(before) === signature(after);

      if (entering) {
        positions[listKey(before)] = oldY;
        savePositions();
      }

      if (returning || same) {
        window.__keepScroll = true;
      }

      const result = original.apply(this, arguments);
      previous = after;

      if (categoryChanged || entering) {
        scrollToY(0);
      } else if (returning) {
        scrollToY(positions[listKey(after)] || 0);
      } else if (same) {
        scrollToY(oldY);
      } else {
        scrollToY(0);
      }

      if (after.page === "home") {
        window.MHUR_HOME_REFRESH?.();
      }

      return result;
    };

    wrapped.__mhurV536Navigation = true;
    window.render = wrapped;

    try {
      render = wrapped;
    } catch (_) {}
  }

  function installGoNavigation() {
    if (
      typeof window.go !== "function" ||
      window.go.__mhurV536Navigation
    ) {
      return;
    }

    const original = window.go;

    const wrapped = function () {
      const oldPage = state().page;
      const result = original.apply(this, arguments);
      const newPage = state().page;

      if (oldPage !== newPage) {
        scrollToY(0);
      }

      return result;
    };

    wrapped.__mhurV536Navigation = true;
    window.go = wrapped;

    try {
      go = wrapped;
    } catch (_) {}
  }

  function install() {
    installRenderNavigation();
    installGoNavigation();
    window.MHUR_HOME_REFRESH?.();
    console.info("[MHUR] V536 chargé sans rendu retardé.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
