/* ============================================================
   MHUR FRANCE — V534
   Tous les portraits et tous les styles.
   ============================================================ */
(() => {
  "use strict";

  const IMAGE_SELECTOR = [
    "#app .pageFrame.charactersFrame .thumb > img",
    "#app .pageFrame.costumesFrame .thumb > img",
    "#app .pageFrame.tuningsFrame .thumb > img",
    "#app .styleGrid > .styleCard[data-style] > .styleBanner > img",
    "#app .charPanel .portrait > img"
  ].join(",");

  const CENTER_CACHE_PREFIX = "mhur_v534_center:";
  const SCROLL_CACHE_KEY = "mhur_v534_scroll_positions";

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function readCenterCache(key) {
    try {
      const raw = sessionStorage.getItem(CENTER_CACHE_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function writeCenterCache(key, value) {
    try {
      sessionStorage.setItem(
        CENTER_CACHE_PREFIX + key,
        JSON.stringify(value)
      );
    } catch (_) {}
  }

  function averageCornerColor(data, width, height) {
    const points = [
      [3, 3],
      [width - 4, 3],
      [3, height - 4],
      [width - 4, height - 4]
    ];

    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;

    for (const [x, y] of points) {
      const index = (y * width + x) * 4;

      if (data[index + 3] < 16) continue;

      red += data[index];
      green += data[index + 1];
      blue += data[index + 2];
      count += 1;
    }

    if (!count) return "";

    return `rgb(${Math.round(red / count)}, ${Math.round(
      green / count
    )}, ${Math.round(blue / count)})`;
  }

  function analysePortrait(image) {
    const naturalWidth = image.naturalWidth || 0;
    const naturalHeight = image.naturalHeight || 0;

    if (!naturalWidth || !naturalHeight) {
      return { shift: -27, background: "" };
    }

    const size = 160;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d", {
      willReadFrequently: true
    });

    if (!context) {
      return { shift: -27, background: "" };
    }

    context.clearRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);

    let pixels;

    try {
      pixels = context.getImageData(0, 0, size, size).data;
    } catch (_) {
      return { shift: -27, background: "" };
    }

    const channelDifference = (a, b) =>
      Math.abs(pixels[a] - pixels[b]) +
      Math.abs(pixels[a + 1] - pixels[b + 1]) +
      Math.abs(pixels[a + 2] - pixels[b + 2]);

    let totalWeight = 0;
    let weightedX = 0;

    for (let y = 5; y < size - 5; y += 1) {
      const verticalWeight = 0.35 + 0.65 * (y / size);

      for (let x = 5; x < size - 5; x += 1) {
        const center = (y * size + x) * 4;

        if (pixels[center + 3] < 24) continue;

        const left = (y * size + x - 2) * 4;
        const right = (y * size + x + 2) * 4;
        const top = ((y - 2) * size + x) * 4;
        const bottom = ((y + 2) * size + x) * 4;

        const gradient =
          channelDifference(left, right) +
          channelDifference(top, bottom);

        if (gradient < 105) continue;

        const weight = (gradient - 104) * verticalWeight;
        weightedX += x * weight;
        totalWeight += weight;
      }
    }

    const visualCenter = totalWeight
      ? weightedX / totalWeight / size
      : 0.77;

    const shift = clamp((0.5 - visualCenter) * 100, -36, 20);
    const background = averageCornerColor(pixels, size, size);

    return {
      shift: Math.round(shift * 10) / 10,
      background
    };
  }

  async function preparePortrait(image) {
    if (!(image instanceof HTMLImageElement)) return;

    image.classList.remove("v533-portrait-image");
    image.style.removeProperty("--v533-shift-x");
    image.classList.add("v534-portrait-image");

    const source =
      image.currentSrc ||
      image.getAttribute("src") ||
      image.src ||
      "";

    if (!source) return;

    const cached = readCenterCache(source);

    if (cached) {
      image.style.setProperty("--v534-shift-x", `${cached.shift}%`);

      if (cached.background && image.parentElement) {
        image.parentElement.style.background = cached.background;
      }

      image.dataset.v534Centered = "1";
      return;
    }

    try {
      if (!image.complete || !image.naturalWidth) {
        await image.decode();
      }
    } catch (_) {
      await new Promise(resolve => {
        if (image.complete) {
          resolve();
          return;
        }

        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }

    if (!image.naturalWidth) return;

    const result = analysePortrait(image);

    image.style.setProperty("--v534-shift-x", `${result.shift}%`);

    if (result.background && image.parentElement) {
      image.parentElement.style.background = result.background;
    }

    image.dataset.v534Centered = "1";
    writeCenterCache(source, result);
  }

  function scanPortraits(root = document) {
    const images = [];

    if (
      root instanceof HTMLImageElement &&
      root.matches(IMAGE_SELECTOR)
    ) {
      images.push(root);
    }

    if (root.querySelectorAll) {
      images.push(...root.querySelectorAll(IMAGE_SELECTOR));
    }

    return Promise.allSettled(images.map(preparePortrait));
  }

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
      window.render.__mhurV534Navigation
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

      requestAnimationFrame(() => scanPortraits(document));
      return result;
    };

    smartRender.__mhurV534Navigation = true;
    window.render = smartRender;

    try {
      render = smartRender;
    } catch (_) {}
  }

  function installCategoryNavigationGuard() {
    if (
      typeof window.go !== "function" ||
      window.go.__mhurV534Navigation
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

    smartGo.__mhurV534Navigation = true;
    window.go = smartGo;

    try {
      go = smartGo;
    } catch (_) {}
  }

  function install() {
    installNavigationRender();
    installCategoryNavigationGuard();
    scanPortraits(document);

    if (!document.documentElement.dataset.v534PortraitObserver) {
      document.documentElement.dataset.v534PortraitObserver = "1";

      const observer = new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node instanceof Element) {
              scanPortraits(node);
            }
          }
        }
      });

      observer.observe(document.getElementById("app") || document.body, {
        childList: true,
        subtree: true
      });
    }

    console.info("[MHUR] Tous les styles V534 actifs.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
