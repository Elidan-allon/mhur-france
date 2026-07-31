/* ============================================================
   MHUR FRANCE — V535
   Navigation intelligente uniquement.
   Aucune photo n'est modifiée par JavaScript.
   ============================================================ */
(() => {
  "use strict";

  const SCROLL_CACHE_KEY = "mhur_v535_scroll_positions";

  function getGlobalValue(name, fallback = null) {
    try {
      if (name === "page" && typeof page !== "undefined") return page;

      if (
        name === "selectedChar" &&
        typeof selectedChar !== "undefined"
      ) {
        return selectedChar;
      }

      if (
        name === "selectedStyle" &&
        typeof selectedStyle !== "undefined"
      ) {
        return selectedStyle;
      }

      if (
        name === "selectedCostume" &&
        typeof selectedCostume !== "undefined"
      ) {
        return selectedCostume;
      }
    } catch (_) {}

    return window[name] ?? fallback;
  }

  function navigationState() {
    return {
      page: String(getGlobalValue("page", "home") || "home"),
      character: String(getGlobalValue("selectedChar", "") || ""),
      style: String(getGlobalValue("selectedStyle", "") || ""),
      costume: String(getGlobalValue("selectedCostume", "") || "")
    };
  }

  function stateDepth(state) {
    if (state.page === "characters" || state.page === "tunings") {
      if (state.character && state.style) return 2;
      if (state.character) return 1;
      return 0;
    }

    if (state.page === "costumes" || state.page === "builds") {
      return state.character ? 1 : 0;
    }

    return 0;
  }

  function stateSignature(state) {
    return [
      state.page,
      state.character,
      state.style,
      state.costume
    ].join("|");
  }

  function viewKey(state) {
    return [
      state.page,
      stateDepth(state),
      state.character || "liste"
    ].join("|");
  }

  function loadScrollPositions() {
    try {
      const raw = sessionStorage.getItem(SCROLL_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  const savedScroll = loadScrollPositions();

  function saveScrollPositions() {
    try {
      sessionStorage.setItem(
        SCROLL_CACHE_KEY,
        JSON.stringify(savedScroll)
      );
    } catch (_) {}
  }

  function setScroll(top) {
    const value = Math.max(0, Number(top) || 0);

    requestAnimationFrame(() => {
      window.scrollTo({
        left: 0,
        top: value,
        behavior: "auto"
      });
    });
  }

  function installNavigationRender() {
    if (
      typeof window.render !== "function" ||
      window.render.__mhurV535Navigation
    ) {
      return;
    }

    const originalRender = window.render;
    let lastState = navigationState();

    const smartRender = function () {
      const previousState = lastState;
      const nextState = navigationState();
      const currentScroll = window.scrollY || 0;

      const previousDepth = stateDepth(previousState);
      const nextDepth = stateDepth(nextState);
      const categoryChanged = previousState.page !== nextState.page;
      const exactSameView =
        stateSignature(previousState) === stateSignature(nextState);
      const enteringDeeper =
        !categoryChanged && nextDepth > previousDepth;
      const returningBack =
        !categoryChanged && nextDepth < previousDepth;

      if (enteringDeeper) {
        savedScroll[viewKey(previousState)] = currentScroll;
        saveScrollPositions();
      }

      if (returningBack || exactSameView) {
        window.__keepScroll = true;
      }

      const result = originalRender.apply(this, arguments);
      lastState = nextState;

      if (categoryChanged || enteringDeeper) {
        setScroll(0);
      } else if (returningBack) {
        setScroll(savedScroll[viewKey(nextState)] || 0);
      } else if (exactSameView) {
        setScroll(currentScroll);
      } else {
        setScroll(0);
      }

      return result;
    };

    smartRender.__mhurV535Navigation = true;
    window.render = smartRender;

    try {
      render = smartRender;
    } catch (_) {}
  }

  function installCategoryNavigationGuard() {
    if (
      typeof window.go !== "function" ||
      window.go.__mhurV535Navigation
    ) {
      return;
    }

    const originalGo = window.go;

    const smartGo = function () {
      const before = navigationState().page;
      const result = originalGo.apply(this, arguments);
      const after = navigationState().page;

      if (String(before) !== String(after)) {
        setScroll(0);
      }

      return result;
    };

    smartGo.__mhurV535Navigation = true;
    window.go = smartGo;

    try {
      go = smartGo;
    } catch (_) {}
  }

  function install() {
    installNavigationRender();
    installCategoryNavigationGuard();
    console.info("[MHUR] Images complètes et navigation V535 actives.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
