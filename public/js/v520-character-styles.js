/*
  MHUR France — V520
  - utilise les données exactes de Gentle Criminal déjà présentes dans le site ;
  - applique à chaque petite carte la couleur de son propre rôle ;
  - affiche le rôle de manière compacte.
*/
(() => {
  "use strict";

  const VERSION = "520";
  const GENTLE_ID = "gentle_criminal";
  const GENTLE_CORRECT = "gentle_criminal_technical";
  const GENTLE_OLD = "gentle_criminal_support";
  const GENTLE_PORTRAIT =
    "assets/gentle_criminal/gentle_criminal_technical/portrait.png?v=520";

  const ROLE_CLASSES = [
    "v520-role-assault",
    "v520-role-strike",
    "v520-role-speed",
    "v520-role-technical",
    "v520-role-support"
  ];

  const ROLE_FALLBACK = {
    assault: {
      fr: "Assaut",
      en: "Assault",
      icon: "assets/roles/assault.png"
    },
    strike: {
      fr: "Attaque",
      en: "Strike",
      icon: "assets/roles/attack.png"
    },
    speed: {
      fr: "Vitesse",
      en: "Rapid",
      icon: "assets/roles/rapid.png"
    },
    technical: {
      fr: "Technique",
      en: "Technical",
      icon: "assets/roles/technical.png"
    },
    support: {
      fr: "Soutien",
      en: "Support",
      icon: "assets/roles/support.png"
    }
  };

  function readExactData() {
    const element = document.getElementById("ultrarumble-exact-data");
    if (!element) return null;

    try {
      return JSON.parse(element.textContent || "{}");
    } catch (error) {
      console.error("[MHUR V520] Données exactes illisibles.", error);
      return null;
    }
  }

  function currentLanguage() {
    try {
      if (typeof lang !== "undefined" && String(lang).toLowerCase() === "en") {
        return "en";
      }
    } catch (_) {}

    return String(document.documentElement.lang || "fr")
      .toLowerCase()
      .startsWith("en")
      ? "en"
      : "fr";
  }

  function roleConfiguration(role) {
    let configuration = null;

    try {
      if (typeof roles !== "undefined" && roles && roles[role]) {
        const source = roles[role];
        configuration = {
          fr: source.fr || role,
          en: source.en || source.fr || role,
          icon: source.img || ""
        };
      }
    } catch (_) {}

    return configuration || ROLE_FALLBACK[role] || {
      fr: role,
      en: role,
      icon: ""
    };
  }

  function absoluteAsset(path) {
    const value = String(path || "");
    if (!value) return "";
    if (/^(?:https?:|data:|blob:|\/)/i.test(value)) return value;
    return "/" + value.replace(/^(?:\.{1,2}\/)+/, "");
  }

  function patchGentleCriminal() {
    const exact = readExactData();
    const generatedStyle =
      exact &&
      exact.generated_styles &&
      exact.generated_styles[GENTLE_CORRECT];

    try {
      if (typeof styles !== "undefined" && styles) {
        if (generatedStyle) {
          styles[GENTLE_CORRECT] = {
            ...generatedStyle,
            role: "technical",
            portrait: GENTLE_PORTRAIT
          };
        } else if (styles[GENTLE_CORRECT]) {
          styles[GENTLE_CORRECT].role = "technical";
          styles[GENTLE_CORRECT].portrait = GENTLE_PORTRAIT;
        }

        /*
          Un ancien lien ou un ancien état peut encore viser la fiche support.
          On le redirige vers les mêmes données sans l'afficher comme second style.
        */
        if (styles[GENTLE_CORRECT]) {
          styles[GENTLE_OLD] = {
            ...styles[GENTLE_CORRECT],
            role: "technical",
            portrait: GENTLE_PORTRAIT
          };
        }
      }
    } catch (error) {
      console.error("[MHUR V520] Correction du style Gentle impossible.", error);
    }

    try {
      if (
        typeof tunings !== "undefined" &&
        tunings &&
        exact &&
        exact.generated_tunings &&
        exact.generated_tunings[GENTLE_CORRECT]
      ) {
        tunings[GENTLE_CORRECT] =
          exact.generated_tunings[GENTLE_CORRECT];
      }
    } catch (error) {
      console.error("[MHUR V520] Correction des T.U.N.I.N.G Gentle impossible.", error);
    }

    try {
      if (typeof characters !== "undefined" && Array.isArray(characters)) {
        const gentle = characters.find(
          character => character && character.id === GENTLE_ID
        );

        if (gentle) {
          gentle.portrait = GENTLE_PORTRAIT;
          gentle.styles = [GENTLE_CORRECT];
          gentle.side = gentle.side || "villain";
        }
      }
    } catch (error) {
      console.error("[MHUR V520] Correction du personnage Gentle impossible.", error);
    }

    try {
      if (
        typeof selectedStyle !== "undefined" &&
        selectedStyle === GENTLE_OLD
      ) {
        selectedStyle = GENTLE_CORRECT;
      }
    } catch (_) {}
  }

  function styleData(styleKey) {
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
    const data = styleData(styleKey);

    if (!styleKey || !data || !data.role) return;

    const role = String(data.role).toLowerCase();
    const configuration = roleConfiguration(role);
    const language = currentLanguage();

    card.classList.remove(...ROLE_CLASSES);
    card.classList.add(`v520-role-${role}`);
    card.dataset.v520Role = role;

    const information = card.querySelector(".styleInfo");
    if (information) {
      let roleLine = information.querySelector(".v520-style-role");

      if (!roleLine) {
        roleLine = document.createElement("div");
        roleLine.className = "v520-style-role";
        information.appendChild(roleLine);
      }

      const wantedText =
        language === "en" ? configuration.en : configuration.fr;
      const wantedIcon = absoluteAsset(configuration.icon);

      let icon = roleLine.querySelector("img");
      let text = roleLine.querySelector("span");

      if (!icon) {
        icon = document.createElement("img");
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");
        roleLine.appendChild(icon);
      }

      if (!text) {
        text = document.createElement("span");
        roleLine.appendChild(text);
      }

      if (icon.getAttribute("src") !== wantedIcon) {
        icon.src = wantedIcon;
      }

      if (text.textContent !== wantedText) {
        text.textContent = wantedText;
      }

      roleLine.setAttribute(
        "aria-label",
        language === "en"
          ? `Role: ${wantedText}`
          : `Rôle : ${wantedText}`
      );
    }

    if (styleKey === GENTLE_CORRECT || styleKey === GENTLE_OLD) {
      const portrait = card.querySelector(".styleBanner img");
      if (portrait && portrait.getAttribute("src") !== absoluteAsset(GENTLE_PORTRAIT)) {
        portrait.src = absoluteAsset(GENTLE_PORTRAIT);
      }
    }
  }

  function decorateVisibleInterface() {
    document
      .querySelectorAll("#app .styleGrid > .styleCard[data-style]")
      .forEach(decorateStyleCard);
  }

  let pending = false;

  function scheduleDecoration() {
    if (pending) return;
    pending = true;

    requestAnimationFrame(() => {
      pending = false;
      decorateVisibleInterface();
    });
  }

  function refreshCurrentPageOnce() {
    try {
      if (typeof render === "function") {
        window.__keepScroll = true;
        render();
      }
    } catch (error) {
      console.error("[MHUR V520] Actualisation de la page impossible.", error);
    }
  }

  function install() {
    if (document.documentElement.dataset.mhurV520Installed === "1") {
      patchGentleCriminal();
      scheduleDecoration();
      return;
    }

    document.documentElement.dataset.mhurV520Installed = "1";

    patchGentleCriminal();
    refreshCurrentPageOnce();
    scheduleDecoration();

    const app = document.getElementById("app");
    if (app) {
      const observer = new MutationObserver(scheduleDecoration);
      observer.observe(app, {
        childList: true,
        subtree: true
      });
    }

    console.info(`[MHUR] Correctif V${VERSION} actif.`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
