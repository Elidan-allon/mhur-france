/*
  MHUR France — Correctif V521
  Gentle Criminal, logos des rôles, couleurs des builds et tutoriel des mods.
*/
(() => {
  "use strict";

  const GENTLE_STYLE = "gentle_criminal_technical";
  const GENTLE_OLD_STYLE = "gentle_criminal_support";
  const GENTLE_PORTRAIT =
    "assets/gentle_criminal/gentle_criminal_technical/portrait.png?v=521";

  const ROLE_KEYS = ["assault", "strike", "speed", "technical", "support"];
  const ROLE_CLASSES = ROLE_KEYS.map(role => `v521-role-${role}`);

  const FALLBACK_ROLES = {
    assault: {
      fr: "Assaut",
      en: "Assault",
      icon: "assets/roles/role_assault_clean.webp"
    },
    strike: {
      fr: "Attaque",
      en: "Strike",
      icon: "assets/roles/role_attack_clean.webp"
    },
    speed: {
      fr: "Vitesse",
      en: "Rapid",
      icon: "assets/roles/role_rapid.webp"
    },
    technical: {
      fr: "Technique",
      en: "Technical",
      icon: "assets/roles/role_technical.webp"
    },
    support: {
      fr: "Soutien",
      en: "Support",
      icon: "assets/roles/role_support.webp"
    }
  };

  /* Secours utilisé uniquement si les données du site ne permettent pas le rapprochement. */
  const DISCOUNT_ROLE_FALLBACK = {
    "d j board": "technical",
    "flow runner": "strike",
    "gentle criminal": "technical",
    "factor fusion": "strike",
    "cluster": "technical",
    "mirko": "speed"
  };

  function isEnglish() {
    try {
      if (typeof lang !== "undefined") return String(lang).toLowerCase() === "en";
    } catch (_) {}
    return String(document.documentElement.lang || "fr").toLowerCase().startsWith("en");
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function rootAsset(path) {
    const value = String(path || "");
    if (!value || /^(?:https?:|data:|blob:|\/)/i.test(value)) return value;
    return "/" + value.replace(/^(?:\.{1,2}\/)+/, "");
  }

  function translated(value) {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    return isEnglish()
      ? value.en || value.fr || ""
      : value.fr || value.en || "";
  }

  function roleInfo(role) {
    const key = ROLE_KEYS.includes(String(role)) ? String(role) : "";
    if (!key) return null;

    try {
      if (typeof roles !== "undefined" && roles && roles[key]) {
        const source = roles[key];
        return {
          key,
          label: isEnglish() ? source.en || source.fr : source.fr || source.en,
          icon: rootAsset(source.img || FALLBACK_ROLES[key].icon)
        };
      }
    } catch (_) {}

    const fallback = FALLBACK_ROLES[key];
    return {
      key,
      label: isEnglish() ? fallback.en : fallback.fr,
      icon: rootAsset(fallback.icon)
    };
  }

  function allStyles() {
    try {
      if (typeof styles !== "undefined" && styles) return styles;
    } catch (_) {}
    return {};
  }

  function allCharacters() {
    try {
      if (typeof characters !== "undefined" && Array.isArray(characters)) return characters;
    } catch (_) {}
    return [];
  }

  function styleRole(styleId) {
    const style = allStyles()[styleId];
    return style && ROLE_KEYS.includes(String(style.role)) ? String(style.role) : "";
  }

  function roleFromVisibleLabel(text) {
    const value = normalize(text);
    if (["assaut", "assault"].includes(value)) return "assault";
    if (["attaque", "attack", "strike"].includes(value)) return "strike";
    if (["vitesse", "rapid", "speed"].includes(value)) return "speed";
    if (["technique", "technical", "tech"].includes(value)) return "technical";
    if (["soutien", "support"].includes(value)) return "support";
    return "";
  }

  function findRoleByStyleName(name) {
    const wanted = normalize(name);
    if (!wanted) return "";

    for (const style of Object.values(allStyles())) {
      if (!style || !ROLE_KEYS.includes(String(style.role))) continue;
      if (normalize(translated(style.name)) === wanted) return String(style.role);
    }
    return "";
  }

  function findRoleByCharacterName(name) {
    const wanted = normalize(name);
    const character = allCharacters().find(entry => normalize(entry && entry.name) === wanted);
    if (!character) return "";

    for (const styleId of character.styles || []) {
      const role = styleRole(styleId);
      if (role) return role;
    }
    return "";
  }

  function resolveDiscountRole(item, name) {
    const direct = item && ROLE_KEYS.includes(String(item.role)) ? String(item.role) : "";
    if (direct) return direct;

    const styleId = item && (item.style_id || item.styleId || item.style);
    const fromId = styleRole(styleId);
    if (fromId) return fromId;

    const fromStyleName = findRoleByStyleName(name);
    if (fromStyleName) return fromStyleName;

    const fromCharacter = findRoleByCharacterName(name);
    if (fromCharacter) return fromCharacter;

    return DISCOUNT_ROLE_FALLBACK[normalize(name)] || "";
  }

  function readExactData() {
    const source = document.getElementById("ultrarumble-exact-data");
    if (!source) return null;
    try {
      return JSON.parse(source.textContent || "{}");
    } catch (error) {
      console.warn("[MHUR V521] Données exactes illisibles.", error);
      return null;
    }
  }

  function patchGentleCriminalData() {
    const exact = readExactData();
    const exactStyle = exact?.generated_styles?.[GENTLE_STYLE];

    try {
      if (typeof styles !== "undefined" && styles) {
        if (exactStyle) {
          styles[GENTLE_STYLE] = {
            ...exactStyle,
            role: "technical",
            portrait: GENTLE_PORTRAIT
          };
        } else if (styles[GENTLE_STYLE]) {
          styles[GENTLE_STYLE].role = "technical";
          styles[GENTLE_STYLE].portrait = GENTLE_PORTRAIT;
        }

        if (styles[GENTLE_STYLE]) {
          styles[GENTLE_OLD_STYLE] = {
            ...styles[GENTLE_STYLE],
            role: "technical",
            portrait: GENTLE_PORTRAIT
          };
        }
      }
    } catch (error) {
      console.warn("[MHUR V521] Style Gentle non corrigé.", error);
    }

    try {
      const gentle = allCharacters().find(character => character?.id === "gentle_criminal");
      if (gentle) {
        gentle.portrait = GENTLE_PORTRAIT;
        gentle.styles = [GENTLE_STYLE];
        gentle.side = gentle.side || "villain";
      }
    } catch (error) {
      console.warn("[MHUR V521] Personnage Gentle non corrigé.", error);
    }

    try {
      if (typeof tunings !== "undefined" && tunings && exact?.generated_tunings?.[GENTLE_STYLE]) {
        tunings[GENTLE_STYLE] = exact.generated_tunings[GENTLE_STYLE];
      }
    } catch (_) {}

    const discounts = window.MHUR_HOME_DATA?.discounts;
    if (Array.isArray(discounts)) {
      const gentleDiscount = discounts.find(item => normalize(item?.name) === "gentle criminal");
      if (gentleDiscount) gentleDiscount.image = GENTLE_PORTRAIT;
    }

    try {
      if (typeof selectedStyle !== "undefined" && selectedStyle === GENTLE_OLD_STYLE) {
        selectedStyle = GENTLE_STYLE;
      }
    } catch (_) {}
  }

  function applyRoleClass(element, role) {
    if (!(element instanceof HTMLElement)) return;
    element.classList.remove(...ROLE_CLASSES);
    if (ROLE_KEYS.includes(role)) element.classList.add(`v521-role-${role}`);
  }

  function cleanOldStylePickerDecorations() {
    document.querySelectorAll("#app .styleCard[data-style]").forEach(card => {
      card.classList.remove(
        "v519-role-assault", "v519-role-strike", "v519-role-speed",
        "v519-role-technical", "v519-role-support",
        "v520-role-assault", "v520-role-strike", "v520-role-speed",
        "v520-role-technical", "v520-role-support"
      );
      card.removeAttribute("data-v520-role");
      card.querySelectorAll(".v519-style-role,.v520-style-role").forEach(node => node.remove());
    });
  }

  function decorateDiscountCards() {
    const cards = [...document.querySelectorAll(".discountGridV296 .discountCardV296")];
    if (!cards.length) return;

    const discounts = Array.isArray(window.MHUR_HOME_DATA?.discounts)
      ? window.MHUR_HOME_DATA.discounts
      : [];

    cards.forEach((card, index) => {
      const name = card.querySelector(":scope > b")?.textContent?.trim() || "";
      const item = discounts.find(entry => normalize(entry?.name) === normalize(name)) || discounts[index] || null;
      const role = resolveDiscountRole(item, name);
      const information = roleInfo(role);

      applyRoleClass(card, role);

      const portrait = card.querySelector(":scope > img");
      if (portrait instanceof HTMLImageElement) {
        portrait.classList.add("v521-discount-portrait");
        if (normalize(name) === "gentle criminal") {
          const wanted = rootAsset(GENTLE_PORTRAIT);
          if (portrait.getAttribute("src") !== wanted) portrait.src = wanted;
          portrait.alt = "Gentle Criminal";
        }
      }

      let roleLine = card.querySelector(":scope > .v521-discount-role");
      if (!information) {
        roleLine?.remove();
        return;
      }

      if (!roleLine) {
        roleLine = document.createElement("div");
        roleLine.className = "v521-discount-role";
        const points = card.querySelector(":scope > span");
        card.insertBefore(roleLine, points || null);
      }

      let icon = roleLine.querySelector(":scope > img");
      if (!(icon instanceof HTMLImageElement)) {
        icon = document.createElement("img");
        roleLine.prepend(icon);
      }
      if (icon.getAttribute("src") !== information.icon) icon.src = information.icon;
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");

      let labelNode = roleLine.querySelector(":scope > span");
      if (!(labelNode instanceof HTMLElement)) {
        labelNode = document.createElement("span");
        roleLine.append(labelNode);
      }
      if (labelNode.textContent !== information.label) labelNode.textContent = information.label;
      if (roleLine.title !== information.label) roleLine.title = information.label;
      if (roleLine.getAttribute("aria-label") !== information.label) {
        roleLine.setAttribute("aria-label", information.label);
      }
    });
  }

  function roleForBuildTab(button, index) {
    try {
      if (typeof selectedChar !== "undefined") {
        const character = allCharacters().find(entry => entry?.id === selectedChar);
        const styleId = character?.styles?.[index];
        const role = styleRole(styleId);
        if (role) return role;
      }
    } catch (_) {}

    const labelNode = button.querySelector("small");
    return roleFromVisibleLabel(labelNode?.textContent || "");
  }

  function decorateBuildTabs() {
    document.querySelectorAll("#app .cbStyleTabs").forEach(tabList => {
      [...tabList.querySelectorAll(":scope > button")].forEach((button, index) => {
        const role = roleForBuildTab(button, index);
        applyRoleClass(button, role);
      });
    });
  }

  function decorateModsTutorial() {
    document.querySelectorAll(".modsTutorial > summary").forEach(summary => {
      if (!(summary instanceof HTMLElement)) return;
      if (summary.dataset.v521Ready === "1") return;

      const original = summary.textContent.trim();
      const main = document.createElement("span");
      main.className = "v521-mods-main";
      main.textContent = original;

      const hint = document.createElement("span");
      hint.className = "v521-mods-hint";
      hint.textContent = isEnglish()
        ? "Click here to open the tutorial"
        : "Appuie ici pour ouvrir le tutoriel";

      const arrow = document.createElement("span");
      arrow.className = "v521-mods-chevron";
      arrow.setAttribute("aria-hidden", "true");

      summary.replaceChildren(main, hint, arrow);
      summary.classList.add("v521-mods-summary");
      summary.dataset.v521Ready = "1";
    });
  }

  function applyVisibleCorrections() {
    cleanOldStylePickerDecorations();
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
      applyVisibleCorrections();
    });
  }

  function install() {
    patchGentleCriminalData();
    applyVisibleCorrections();

    if (!document.documentElement.dataset.v521Observer) {
      document.documentElement.dataset.v521Observer = "1";
      const observer = new MutationObserver(scheduleCorrections);
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    console.info("[MHUR] Correctif V521 actif.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }

  setTimeout(install, 180);
  setTimeout(install, 900);
})();
