/*
  MHUR France — Correctif V519
  Corrige Gentle Criminal et attribue à chaque carte de style la couleur
  correspondant au rôle du style (assault, strike, speed, technical, support).
*/
(() => {
  "use strict";

  const GENTLE_STYLE_KEY = "gentle_criminal_technical";
  const GENTLE_OLD_KEY = "gentle_criminal_support";
  const GENTLE_PORTRAIT =
    "assets/gentle_criminal/gentle_criminal_technical/portrait.png?v=519";

  const ROLE_CLASSES = [
    "v519-role-assault",
    "v519-role-strike",
    "v519-role-speed",
    "v519-role-technical",
    "v519-role-support"
  ];

  const FALLBACK_LABELS = {
    assault: { fr: "Assaut", en: "Assault" },
    strike: { fr: "Attaque", en: "Strike" },
    speed: { fr: "Vitesse", en: "Rapid" },
    technical: { fr: "Technique", en: "Technical" },
    support: { fr: "Soutien", en: "Support" }
  };

  function isEnglish() {
    const htmlLang = (document.documentElement.lang || "").toLowerCase();
    try {
      if (typeof currentLang !== "undefined") {
        return String(currentLang).toLowerCase().startsWith("en");
      }
    } catch (_) {}
    return htmlLang.startsWith("en");
  }

  function getRoleLabel(role) {
    try {
      if (
        typeof roles !== "undefined" &&
        roles &&
        roles[role]
      ) {
        if (typeof label === "function") {
          return label(roles[role]);
        }
        return isEnglish()
          ? (roles[role].en || roles[role].fr || role)
          : (roles[role].fr || roles[role].en || role);
      }
    } catch (_) {}

    const fallback = FALLBACK_LABELS[role];
    if (!fallback) return role || "";
    return isEnglish() ? fallback.en : fallback.fr;
  }

  function readGeneratedGentleStyle() {
    const source = document.getElementById("ultrarumble-exact-data");
    if (!source) return null;

    try {
      const parsed = JSON.parse(source.textContent || "{}");
      return parsed &&
        parsed.generated_styles &&
        parsed.generated_styles[GENTLE_STYLE_KEY]
        ? parsed.generated_styles[GENTLE_STYLE_KEY]
        : null;
    } catch (error) {
      console.warn("[V519] Données générées illisibles :", error);
      return null;
    }
  }

  function patchGentleData() {
    let exactStyle = readGeneratedGentleStyle();

    try {
      if (typeof styles !== "undefined" && styles) {
        if (exactStyle) {
          styles[GENTLE_STYLE_KEY] = {
            ...exactStyle,
            role: "technical",
            portrait: GENTLE_PORTRAIT
          };
        } else if (styles[GENTLE_STYLE_KEY]) {
          styles[GENTLE_STYLE_KEY].role = "technical";
          styles[GENTLE_STYLE_KEY].portrait = GENTLE_PORTRAIT;
        }

        /*
          L'ancienne fiche "support" reste compatible au cas où un ancien
          lien ou une ancienne donnée l'utiliserait encore, mais elle pointe
          maintenant vers la bonne image et le bon rôle.
        */
        if (styles[GENTLE_OLD_KEY]) {
          const correctStyle = styles[GENTLE_STYLE_KEY] || exactStyle;
          if (correctStyle) {
            styles[GENTLE_OLD_KEY] = {
              ...styles[GENTLE_OLD_KEY],
              ...correctStyle,
              role: "technical",
              portrait: GENTLE_PORTRAIT
            };
          } else {
            styles[GENTLE_OLD_KEY].role = "technical";
            styles[GENTLE_OLD_KEY].portrait = GENTLE_PORTRAIT;
          }
        }
      }
    } catch (error) {
      console.warn("[V519] Impossible de corriger le style Gentle :", error);
    }

    try {
      if (typeof characters !== "undefined" && Array.isArray(characters)) {
        const gentle = characters.find(
          character => character && character.id === "gentle_criminal"
        );

        if (gentle) {
          gentle.portrait = GENTLE_PORTRAIT;
          gentle.styles = [GENTLE_STYLE_KEY];
        }
      }
    } catch (error) {
      console.warn("[V519] Impossible de corriger le personnage Gentle :", error);
    }
  }

  function getStyleData(styleKey) {
    try {
      if (typeof styles !== "undefined" && styles && styles[styleKey]) {
        return styles[styleKey];
      }
    } catch (_) {}
    return null;
  }

  function decorateStyleCard(card) {
    if (!(card instanceof HTMLElement)) return;

    const styleKey = card.dataset.style;
    if (!styleKey) return;

    const styleData = getStyleData(styleKey);
    if (!styleData || !styleData.role) return;

    const role = String(styleData.role).toLowerCase();
    card.classList.remove(...ROLE_CLASSES);
    card.classList.add(`v519-role-${role}`);
    card.dataset.role = role;

    const info = card.querySelector(".styleInfo");
    if (info) {
      let roleLabel = info.querySelector(".v519-style-role");

      if (!roleLabel) {
        roleLabel = document.createElement("div");
        roleLabel.className = "v519-style-role";
        info.appendChild(roleLabel);
      }

      roleLabel.textContent = getRoleLabel(role);
    }

    if (styleKey === GENTLE_STYLE_KEY || styleKey === GENTLE_OLD_KEY) {
      const portrait = card.querySelector(
        ".styleBanner, img.styleBanner, .styleBanner img"
      );

      if (portrait instanceof HTMLImageElement) {
        const current = portrait.getAttribute("src") || "";
        if (current !== GENTLE_PORTRAIT) {
          portrait.src = GENTLE_PORTRAIT;
        }
      }
    }
  }

  function fixVisibleGentlePortraits() {
    document.querySelectorAll("img").forEach(image => {
      const src = image.getAttribute("src") || "";
      const oldGentlePath =
        src.includes("gentle_criminal/gentle_criminal_support");
      const gentlePortraitPath =
        /gentle[_-]criminal[^"' ]*portrait\.png/i.test(src);

      if (oldGentlePath || gentlePortraitPath) {
        if (src !== GENTLE_PORTRAIT) {
          image.src = GENTLE_PORTRAIT;
        }
      }
    });
  }

  function applyVisibleFixes() {
    document
      .querySelectorAll(".styleCard[data-style]")
      .forEach(decorateStyleCard);

    fixVisibleGentlePortraits();
  }

  let observerScheduled = false;

  function scheduleVisibleFixes() {
    if (observerScheduled) return;
    observerScheduled = true;

    requestAnimationFrame(() => {
      observerScheduled = false;
      applyVisibleFixes();
    });
  }

  function install() {
    patchGentleData();
    applyVisibleFixes();

    if (!document.documentElement.dataset.v519ObserverInstalled) {
      document.documentElement.dataset.v519ObserverInstalled = "1";

      const observer = new MutationObserver(scheduleVisibleFixes);
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    console.info("[MHUR] Correctif V519 actif.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }

  /*
    Deux passages supplémentaires couvrent les données et vues créées par
    les autres scripts juste après le chargement initial.
  */
  setTimeout(install, 150);
  setTimeout(install, 900);
})();
