/*
  MHUR France — Correctif V524
  Source unique pour Gentle Criminal + classes de rôle + tutoriel des mods.
*/
(() => {
  "use strict";

  const GENTLE_DISCOUNT =
    "/assets/home/discounts/gentle_criminal_v524.webp?v=524";
  const GENTLE_PORTRAIT =
    "/assets/gentle_criminal/gentle_criminal_technical/portrait_v524.webp?v=524";
  const GENTLE_STYLE = "gentle_criminal_technical";

  const ROLE_KEYS = ["assault", "strike", "speed", "technical", "support"];
  const ROLE_CLASSES = ROLE_KEYS.map(role => `v524-role-${role}`);

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function isEnglish() {
    try {
      if (typeof lang !== "undefined") {
        return String(lang).toLowerCase() === "en";
      }
    } catch (_) {}

    return String(document.documentElement.lang || "fr")
      .toLowerCase()
      .startsWith("en");
  }

  function getStyles() {
    try {
      if (typeof styles !== "undefined" && styles) return styles;
    } catch (_) {}
    return null;
  }

  function getCharacters() {
    try {
      if (typeof characters !== "undefined" && Array.isArray(characters)) {
        return characters;
      }
    } catch (_) {}
    return null;
  }

  function readExactData() {
    const element = document.getElementById("ultrarumble-exact-data");
    if (!element) return null;

    try {
      return JSON.parse(element.textContent || "{}");
    } catch (_) {
      return null;
    }
  }

  function roleForStyle(styleKey) {
    const allStyles = getStyles();
    const role = allStyles?.[styleKey]?.role;
    return ROLE_KEYS.includes(String(role)) ? String(role) : "";
  }

  function applyRoleClass(element, role) {
    if (!(element instanceof HTMLElement)) return;
    element.classList.remove(...ROLE_CLASSES);
    if (ROLE_KEYS.includes(role)) {
      element.classList.add(`v524-role-${role}`);
    }
  }

  /*
    Le problème précédent venait de l'ancienne fiche locale
    gentle_criminal_support. Ici on remplace réellement la fiche utilisée.
  */
  function patchGentleData() {
    const allStyles = getStyles();
    const allCharacters = getCharacters();
    const exactData = readExactData();

    if (allStyles) {
      const generated =
        exactData?.generated_styles?.[GENTLE_STYLE] || allStyles[GENTLE_STYLE];

      if (generated) {
        allStyles[GENTLE_STYLE] = {
          ...generated,
          role: "technical",
          portrait: GENTLE_PORTRAIT
        };
      } else {
        allStyles[GENTLE_STYLE] = {
          name: { fr: "Original", en: "Original" },
          role: "technical",
          portrait: GENTLE_PORTRAIT,
          pv: "300",
          description: {
            fr: "Gentle Criminal",
            en: "Gentle Criminal"
          },
          roleDesc: {
            fr: "Augmente la vitesse de rechargement de toute l'équipe.",
            en: "Increases the entire team's reload speed."
          },
          special: null,
          skills: []
        };
      }
    }

    if (allCharacters) {
      let gentle = allCharacters.find(character => character?.id === "gentle_criminal");

      if (!gentle) {
        gentle = {
          id: "gentle_criminal",
          name: "Gentle Criminal",
          side: "villain",
          portrait: GENTLE_PORTRAIT,
          styles: [GENTLE_STYLE]
        };
        allCharacters.push(gentle);
      } else {
        gentle.name = "Gentle Criminal";
        gentle.side = "villain";
        gentle.portrait = GENTLE_PORTRAIT;
        gentle.styles = [GENTLE_STYLE];
      }
    }

    const discounts = window.MHUR_HOME_DATA?.discounts;
    if (Array.isArray(discounts)) {
      const gentleDiscount = discounts.find(
        item => normalize(item?.name) === "gentle criminal"
      );
      if (gentleDiscount) {
        gentleDiscount.image = GENTLE_DISCOUNT;
      }
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
        applyRoleClass(card, roleForStyle(firstStyle));

        if (card.dataset.char === "gentle_criminal") {
          const image = card.querySelector(".thumb img");
          if (image instanceof HTMLImageElement) {
            image.removeAttribute("srcset");
            image.removeAttribute("sizes");
            image.src = GENTLE_PORTRAIT;
          }
        }
      });
  }

  function decorateStyleCards() {
    document
      .querySelectorAll("#app .styleGrid > .styleCard[data-style]")
      .forEach(card => {
        const styleKey = card.dataset.style || "";
        applyRoleClass(card, roleForStyle(styleKey));

        if (styleKey === GENTLE_STYLE) {
          const image = card.querySelector(".styleBanner img");
          if (image instanceof HTMLImageElement) {
            image.removeAttribute("srcset");
            image.removeAttribute("sizes");
            image.src = GENTLE_PORTRAIT;
          }
        }
      });
  }

  function decorateGentleDiscount() {
    document
      .querySelectorAll(".discountGridV296 .discountCardV296")
      .forEach(card => {
        const name = normalize(card.querySelector(":scope > b")?.textContent);
        if (name !== "gentle criminal") return;

        card.classList.add("v524-gentle-card", "v524-role-technical");

        const image = card.querySelector(":scope > img");
        if (image instanceof HTMLImageElement) {
          image.removeAttribute("srcset");
          image.removeAttribute("sizes");
          image.src = GENTLE_DISCOUNT;
          image.alt = "Gentle Criminal";
        }
      });
  }

  function roleFromText(text) {
    const value = normalize(text);
    if (value.includes("assaut") || value.includes("assault")) return "assault";
    if (
      value.includes("attaque") ||
      value.includes("attack") ||
      value.includes("strike")
    ) return "strike";
    if (
      value.includes("vitesse") ||
      value.includes("rapid") ||
      value.includes("speed")
    ) return "speed";
    if (value.includes("technique") || value.includes("technical")) {
      return "technical";
    }
    if (value.includes("soutien") || value.includes("support")) return "support";
    return "";
  }

  function decorateBuildTabs() {
    document.querySelectorAll("#app .cbStyleTabs").forEach(tabList => {
      [...tabList.querySelectorAll(":scope > button")].forEach(
        (button, index) => {
          let role = "";

          try {
            if (typeof selectedChar !== "undefined") {
              const character = (getCharacters() || []).find(
                entry => entry?.id === selectedChar
              );
              role = roleForStyle(character?.styles?.[index]);
            }
          } catch (_) {}

          if (!role) role = roleFromText(button.textContent);
          applyRoleClass(button, role);
        }
      );
    });
  }

  function tutorialTitle(summary) {
    const existing = summary.querySelector(
      ".v519-mods-main, .v520-mods-main, .v521-mods-main, " +
      ".v522-mods-main, .v523-mods-main, .v524-mods-main"
    );

    if (existing?.textContent?.trim()) return existing.textContent.trim();

    return summary.textContent
      .replace(/Appuie ici pour ouvrir le tutoriel/gi, "")
      .replace(/Click here to open the tutorial/gi, "")
      .replace(/[⌄⌃∨∧▼▲]+/g, "")
      .trim() ||
      (isEnglish()
        ? "📘 Install mods — PC Steam only"
        : "📘 Installer des mods — PC Steam uniquement");
  }

  function decorateTutorial() {
    document.querySelectorAll(".modsTutorial > summary").forEach(summary => {
      if (!(summary instanceof HTMLElement)) return;
      if (summary.dataset.v524Ready === "1") return;

      const main = document.createElement("span");
      main.className = "v524-mods-main";
      main.textContent = tutorialTitle(summary);

      const hint = document.createElement("span");
      hint.className = "v524-mods-hint";
      hint.textContent = isEnglish()
        ? "Click here to open the tutorial"
        : "Appuie ici pour ouvrir le tutoriel";

      const arrow = document.createElement("span");
      arrow.className = "v524-mods-chevron";
      arrow.setAttribute("aria-hidden", "true");

      summary.replaceChildren(main, hint, arrow);
      summary.className = "v524-mods-summary";
      summary.dataset.v519Ready = "1";
      summary.dataset.v520Ready = "1";
      summary.dataset.v521Ready = "1";
      summary.dataset.v522Ready = "1";
      summary.dataset.v523Ready = "1";
      summary.dataset.v524Ready = "1";
    });
  }

  function applyVisibleFixes() {
    decorateCharacterCards();
    decorateStyleCards();
    decorateGentleDiscount();
    decorateBuildTabs();
    decorateTutorial();
  }

  let scheduled = false;

  function scheduleVisibleFixes() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      applyVisibleFixes();
    });
  }

  let renderedAfterPatch = false;

  function install() {
    patchGentleData();

    /*
      Le premier rendu peut déjà avoir utilisé l'ancienne fiche support.
      On refait donc une seule fois le rendu après avoir remplacé les données.
    */
    if (!renderedAfterPatch) {
      renderedAfterPatch = true;
      try {
        if (typeof render === "function") {
          window.__keepScroll = true;
          render();
        }
      } catch (_) {}
    }

    applyVisibleFixes();

    if (!document.documentElement.dataset.v524Observer) {
      document.documentElement.dataset.v524Observer = "1";

      const observer = new MutationObserver(scheduleVisibleFixes);
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    console.info("[MHUR] Correctif V524 actif.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }

  setTimeout(install, 150);
  setTimeout(install, 700);
  setTimeout(install, 1600);
})();
