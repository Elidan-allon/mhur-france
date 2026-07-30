(() => {
  "use strict";

  const VERSION = "525";
  const GENTLE_ID = "gentle_criminal";
  const GENTLE_STYLE = "gentle_criminal_technical";
  const GENTLE_OLD_STYLE = "gentle_criminal_support";
  const GENTLE_IMAGE =
    "/assets/gentle_criminal/gentle_criminal_technical/portrait_v525.png?v=525";

  const ROLE_KEYS = ["assault", "strike", "speed", "technical", "support"];
  const ROLE_CLASSES = ROLE_KEYS.map(role => `v525-role-${role}`);

  function getStyles() {
    try {
      return typeof styles !== "undefined" && styles ? styles : null;
    } catch (_) {
      return null;
    }
  }

  function getCharacters() {
    try {
      return typeof characters !== "undefined" && Array.isArray(characters)
        ? characters
        : null;
    } catch (_) {
      return null;
    }
  }

  function getExactData() {
    const element = document.getElementById("ultrarumble-exact-data");
    if (!element) return null;

    try {
      return JSON.parse(element.textContent || "{}");
    } catch (_) {
      return null;
    }
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function styleRole(styleKey) {
    const role = getStyles()?.[styleKey]?.role;
    return ROLE_KEYS.includes(String(role)) ? String(role) : "";
  }

  function applyRoleClass(element, role) {
    if (!(element instanceof HTMLElement)) return;

    for (const className of ROLE_CLASSES) {
      element.classList.remove(className);
    }

    if (ROLE_KEYS.includes(role)) {
      element.classList.add(`v525-role-${role}`);
    }
  }

  function patchGentleData() {
    const allStyles = getStyles();
    const allCharacters = getCharacters();
    const exactData = getExactData();

    const generated =
      exactData?.generated_styles?.[GENTLE_STYLE] ||
      allStyles?.[GENTLE_STYLE] ||
      allStyles?.[GENTLE_OLD_STYLE] ||
      {};

    const correctedStyle = {
      ...generated,
      name: generated.name || { fr: "Original", en: "Original" },
      role: "technical",
      portrait: GENTLE_IMAGE
    };

    if (allStyles) {
      allStyles[GENTLE_STYLE] = correctedStyle;

      /*
        L'ancien identifiant peut encore être appelé par un vieux lien.
        Il pointe lui aussi vers la fiche correcte, sans rester en Soutien.
      */
      allStyles[GENTLE_OLD_STYLE] = correctedStyle;
    }

    if (allCharacters) {
      let gentle = allCharacters.find(character => character?.id === GENTLE_ID);

      if (!gentle) {
        gentle = {
          id: GENTLE_ID,
          name: "Gentle Criminal",
          side: "villain",
          portrait: GENTLE_IMAGE,
          styles: [GENTLE_STYLE]
        };
        allCharacters.push(gentle);
      } else {
        gentle.name = "Gentle Criminal";
        gentle.side = "villain";
        gentle.portrait = GENTLE_IMAGE;
        gentle.styles = [GENTLE_STYLE];
      }
    }

    const discounts = window.MHUR_HOME_DATA?.discounts;
    if (Array.isArray(discounts)) {
      const gentleDiscount = discounts.find(
        item => normalize(item?.name) === "gentle criminal"
      );

      if (gentleDiscount) {
        gentleDiscount.image = GENTLE_IMAGE;
      }
    }
  }

  function forceImage(image, source) {
    if (!(image instanceof HTMLImageElement)) return;

    image.removeAttribute("srcset");
    image.removeAttribute("sizes");

    if (image.getAttribute("src") !== source) {
      image.setAttribute("src", source);
    }
  }

  function decorateCharacterCards() {
    const allCharacters = getCharacters() || [];

    document
      .querySelectorAll(
        "#app .pageFrame.charactersFrame .card.characterMode[data-char]"
      )
      .forEach(card => {
        const character = allCharacters.find(
          entry => entry?.id === card.dataset.char
        );
        const firstStyle = character?.styles?.[0];

        applyRoleClass(card, styleRole(firstStyle));

        if (card.dataset.char === GENTLE_ID) {
          forceImage(card.querySelector(".thumb img"), GENTLE_IMAGE);
        }
      });
  }

  function decorateStyleCards() {
    document
      .querySelectorAll("#app .styleGrid > .styleCard[data-style]")
      .forEach(card => {
        const styleKey = card.dataset.style || "";
        const isGentle =
          styleKey === GENTLE_STYLE ||
          styleKey === GENTLE_OLD_STYLE ||
          normalize(card.textContent).includes("gentle criminal");

        applyRoleClass(
          card,
          isGentle ? "technical" : styleRole(styleKey)
        );

        if (isGentle) {
          card.dataset.style = GENTLE_STYLE;
          forceImage(card.querySelector(".styleBanner img"), GENTLE_IMAGE);
        }
      });
  }

  function decorateGentleDiscount() {
    document
      .querySelectorAll(".discountGridV296 .discountCardV296")
      .forEach(card => {
        const name = normalize(
          card.querySelector(":scope > b")?.textContent || card.textContent
        );

        if (name !== "gentle criminal") return;

        card.classList.add("v525-gentle-discount");
        forceImage(card.querySelector(":scope > img"), GENTLE_IMAGE);
      });
  }

  function forceAllGentleImages() {
    document.querySelectorAll("img").forEach(image => {
      const source = String(image.getAttribute("src") || "").toLowerCase();
      const isOldGentle =
        source.includes("gentle_criminal_support") ||
        source.includes("gentle_criminal_v52") ||
        source.includes("home/discounts/gentle_criminal");

      if (isOldGentle) {
        forceImage(image, GENTLE_IMAGE);
      }
    });
  }

  function applyDomFixes() {
    decorateCharacterCards();
    decorateStyleCards();
    decorateGentleDiscount();
    forceAllGentleImages();
  }

  function rerenderOnce() {
    if (window.__MHUR_V525_RERENDERED__) return;
    window.__MHUR_V525_RERENDERED__ = true;

    try {
      if (typeof layout === "function") {
        layout();
        return;
      }

      if (typeof render === "function") {
        render();
      }
    } catch (error) {
      console.warn("[MHUR V525] Nouveau rendu impossible :", error);
    }
  }

  let scheduled = false;

  function scheduleDomFixes() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      applyDomFixes();
    });
  }

  function install() {
    patchGentleData();
    applyDomFixes();

    if (!document.documentElement.dataset.mhurV525Observer) {
      document.documentElement.dataset.mhurV525Observer = "1";

      const observer = new MutationObserver(scheduleDomFixes);
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    console.info("[MHUR] Correctif V525 actif.");
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        install();
        setTimeout(rerenderOnce, 60);
      },
      { once: true }
    );
  } else {
    install();
    setTimeout(rerenderOnce, 60);
  }

  setTimeout(install, 250);
  setTimeout(install, 900);
  setTimeout(install, 1800);
})();
