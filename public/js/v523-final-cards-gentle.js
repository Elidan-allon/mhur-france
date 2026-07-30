/*
  MHUR France — V523
  Correctif autonome chargé à la place de V519/V520/V521/V522.
*/
(() => {
  "use strict";

  const GENTLE_DISCOUNT =
    "/assets/home/discounts/gentle_criminal_v523.webp?v=523";
  const GENTLE_PORTRAIT =
    "/assets/gentle_criminal/gentle_criminal_technical/portrait.png?v=523";

  const ROLE_KEYS = ["assault", "strike", "speed", "technical", "support"];
  const ROLE_CLASSES = ROLE_KEYS.map(role => `v523-role-${role}`);

  const ROLES = {
    assault: {
      fr: "Assaut",
      en: "Assault",
      icon: "/assets/roles/role_assault_clean.webp"
    },
    strike: {
      fr: "Attaque",
      en: "Strike",
      icon: "/assets/roles/role_attack_clean.webp"
    },
    speed: {
      fr: "Vitesse",
      en: "Rapid",
      icon: "/assets/roles/role_rapid.webp"
    },
    technical: {
      fr: "Technique",
      en: "Technical",
      icon: "/assets/roles/role_technical.webp"
    },
    support: {
      fr: "Soutien",
      en: "Support",
      icon: "/assets/roles/role_support.webp"
    }
  };

  const DISCOUNT_ROLES = {
    "d j board": "technical",
    "flow runner": "strike",
    "gentle criminal": "technical",
    "factor fusion": "strike",
    "cluster": "technical",
    "mirko": "speed"
  };

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

  function siteStyles() {
    try {
      if (typeof styles !== "undefined" && styles) return styles;
    } catch (_) {}
    return {};
  }

  function siteCharacters() {
    try {
      if (typeof characters !== "undefined" && Array.isArray(characters)) {
        return characters;
      }
    } catch (_) {}
    return [];
  }

  function styleRole(styleId) {
    const role = siteStyles()?.[styleId]?.role;
    return ROLE_KEYS.includes(String(role)) ? String(role) : "";
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
    if (
      value.includes("technique") ||
      value.includes("technical")
    ) return "technical";
    if (value.includes("soutien") || value.includes("support")) return "support";
    return "";
  }

  function applyRoleClass(element, role) {
    if (!(element instanceof HTMLElement)) return;
    element.classList.remove(...ROLE_CLASSES);
    if (ROLE_KEYS.includes(role)) {
      element.classList.add(`v523-role-${role}`);
    }
  }

  function patchGentleData() {
    const discounts = window.MHUR_HOME_DATA?.discounts;
    if (Array.isArray(discounts)) {
      const gentle = discounts.find(
        item => normalize(item?.name) === "gentle criminal"
      );
      if (gentle) gentle.image = GENTLE_DISCOUNT;
    }

    try {
      const gentleStyle = siteStyles().gentle_criminal_technical;
      if (gentleStyle) {
        gentleStyle.role = "technical";
        gentleStyle.portrait = GENTLE_PORTRAIT;
      }

      const gentleCharacter = siteCharacters().find(
        character => character?.id === "gentle_criminal"
      );
      if (gentleCharacter) {
        gentleCharacter.portrait = GENTLE_PORTRAIT;
        gentleCharacter.styles = ["gentle_criminal_technical"];
      }
    } catch (_) {}
  }

  function decorateDiscountCards() {
    document
      .querySelectorAll(".discountGridV296 .discountCardV296")
      .forEach(card => {
        if (!(card instanceof HTMLElement)) return;

        const name = normalize(
          card.querySelector(":scope > b")?.textContent
        );
        const role = DISCOUNT_ROLES[name] || "";
        const information = ROLES[role];

        applyRoleClass(card, role);

        card
          .querySelectorAll(
            ":scope > .v519-discount-role, " +
            ":scope > .v520-discount-role, " +
            ":scope > .v521-discount-role, " +
            ":scope > .v522-discount-role"
          )
          .forEach(node => node.remove());

        const image = card.querySelector(":scope > img");
        if (name === "gentle criminal" && image instanceof HTMLImageElement) {
          card.classList.add("v523-gentle-card");
          image.removeAttribute("srcset");
          image.removeAttribute("sizes");
          image.src = GENTLE_DISCOUNT;
          image.alt = "Gentle Criminal";
        }

        if (!information) return;

        let line = card.querySelector(":scope > .v523-discount-role");
        if (!line) {
          line = document.createElement("div");
          line.className = "v523-discount-role";
          const points = card.querySelector(":scope > span");
          card.insertBefore(line, points || null);
        }

        let icon = line.querySelector(":scope > img");
        if (!(icon instanceof HTMLImageElement)) {
          icon = document.createElement("img");
          line.prepend(icon);
        }
        icon.src = information.icon;
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");

        let label = line.querySelector(":scope > span");
        if (!(label instanceof HTMLElement)) {
          label = document.createElement("span");
          line.append(label);
        }
        label.textContent = isEnglish() ? information.en : information.fr;
      });
  }

  function decorateBuildTabs() {
    document.querySelectorAll("#app .cbStyleTabs").forEach(tabList => {
      [...tabList.querySelectorAll(":scope > button")].forEach(
        (button, index) => {
          let role = "";

          try {
            if (typeof selectedChar !== "undefined") {
              const character = siteCharacters().find(
                entry => entry?.id === selectedChar
              );
              role = styleRole(character?.styles?.[index]);
            }
          } catch (_) {}

          if (!role) {
            role = roleFromText(button.textContent);
          }

          applyRoleClass(button, role);
        }
      );
    });
  }

  function cleanTutorialTitle(summary) {
    const existing = summary.querySelector(
      ".v519-mods-main, .v520-mods-main, .v521-mods-main, " +
      ".v522-mods-main, .v523-mods-main"
    );

    if (existing?.textContent?.trim()) {
      return existing.textContent.trim();
    }

    return summary.textContent
      .replace(/Appuie ici pour ouvrir le tutoriel/gi, "")
      .replace(/Click here to open the tutorial/gi, "")
      .replace(/[⌄⌃∨∧▼▲]+/g, "")
      .trim() ||
      (isEnglish()
        ? "📘 Install mods — PC Steam only"
        : "📘 Installer des mods — PC Steam uniquement");
  }

  function decorateModsTutorial() {
    document.querySelectorAll(".modsTutorial > summary").forEach(summary => {
      if (!(summary instanceof HTMLElement)) return;
      if (summary.dataset.v523Ready === "1") return;

      const title = cleanTutorialTitle(summary);

      const main = document.createElement("span");
      main.className = "v523-mods-main";
      main.textContent = title;

      const hint = document.createElement("span");
      hint.className = "v523-mods-hint";
      hint.textContent = isEnglish()
        ? "Click here to open the tutorial"
        : "Appuie ici pour ouvrir le tutoriel";

      const arrow = document.createElement("span");
      arrow.className = "v523-mods-chevron";
      arrow.setAttribute("aria-hidden", "true");

      /* replaceChildren supprime toutes les anciennes flèches. */
      summary.replaceChildren(main, hint, arrow);
      summary.className = "v523-mods-summary";
      summary.dataset.v523Ready = "1";
    });
  }

  function applyCorrections() {
    patchGentleData();
    decorateDiscountCards();
    decorateBuildTabs();
    decorateModsTutorial();
  }

  let scheduled = false;

  function scheduleCorrections() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      applyCorrections();
    });
  }

  function install() {
    applyCorrections();

    if (!document.documentElement.dataset.v523Observer) {
      document.documentElement.dataset.v523Observer = "1";

      const observer = new MutationObserver(scheduleCorrections);
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    console.info("[MHUR] Correctif V523 actif.");
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
