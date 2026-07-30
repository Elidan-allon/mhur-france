/*
  MHUR France — Correctif V522
  - Force le bon portrait de Gentle Criminal.
  - Reconstruit proprement le résumé du tutoriel avec une seule flèche.
*/
(() => {
  "use strict";

  const GENTLE_NAME = "gentle criminal";
  const GENTLE_PORTRAIT =
    "/assets/gentle_criminal/gentle_criminal_technical/portrait.png?v=522";

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

  function patchGentleHomeData() {
    const discounts = window.MHUR_HOME_DATA?.discounts;
    if (!Array.isArray(discounts)) return;

    const gentle = discounts.find(
      item => normalize(item?.name) === GENTLE_NAME
    );

    if (gentle) {
      gentle.image =
        "assets/gentle_criminal/gentle_criminal_technical/portrait.png?v=522";
    }
  }

  function forceGentleDiscountPortrait() {
    document
      .querySelectorAll(".discountGridV296 .discountCardV296")
      .forEach(card => {
        const name = normalize(
          card.querySelector(":scope > b")?.textContent
        );

        if (name !== GENTLE_NAME) return;

        card.classList.add("v522-gentle-card");

        const portrait = card.querySelector(":scope > img");
        if (!(portrait instanceof HTMLImageElement)) return;

        portrait.removeAttribute("srcset");
        portrait.removeAttribute("sizes");

        if (portrait.getAttribute("src") !== GENTLE_PORTRAIT) {
          portrait.setAttribute("src", GENTLE_PORTRAIT);
        }

        portrait.alt = "Gentle Criminal";
        portrait.dataset.v522Gentle = "1";
      });
  }

  function tutorialTitle(summary) {
    const existingMain = summary.querySelector(
      ".v522-mods-main, .v521-mods-main, .v520-mods-main"
    );

    if (existingMain?.textContent?.trim()) {
      return existingMain.textContent.trim();
    }

    const text = summary.textContent.trim();
    const hintFr = "Appuie ici pour ouvrir le tutoriel";
    const hintEn = "Click here to open the tutorial";

    return text
      .replace(hintFr, "")
      .replace(hintEn, "")
      .trim() ||
      (isEnglish()
        ? "📘 Install mods — PC Steam only"
        : "📘 Installer des mods — PC Steam uniquement");
  }

  function rebuildModsTutorialSummary(summary) {
    if (!(summary instanceof HTMLElement)) return;
    if (summary.dataset.v522Ready === "1") return;

    const title = tutorialTitle(summary);

    const main = document.createElement("span");
    main.className = "v522-mods-main";
    main.textContent = title;

    const hint = document.createElement("span");
    hint.className = "v522-mods-hint";
    hint.textContent = isEnglish()
      ? "Click here to open the tutorial"
      : "Appuie ici pour ouvrir le tutoriel";

    const arrow = document.createElement("span");
    arrow.className = "v522-mods-chevron";
    arrow.setAttribute("aria-hidden", "true");

    /* Supprime l'ancienne flèche du bas et tout marqueur ajouté auparavant. */
    summary.replaceChildren(main, hint, arrow);

    summary.classList.remove("v519-mods-summary", "v520-mods-summary");
    summary.classList.add("v521-mods-summary", "v522-mods-summary");

    /* Empêche l'observateur V521 de recréer une deuxième flèche. */
    summary.dataset.v521Ready = "1";
    summary.dataset.v522Ready = "1";
  }

  function fixModsTutorial() {
    document
      .querySelectorAll(".modsTutorial > summary")
      .forEach(rebuildModsTutorialSummary);
  }

  function applyCorrections() {
    patchGentleHomeData();
    forceGentleDiscountPortrait();
    fixModsTutorial();
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

    if (!document.documentElement.dataset.v522Observer) {
      document.documentElement.dataset.v522Observer = "1";

      const observer = new MutationObserver(scheduleCorrections);
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    console.info("[MHUR] Correctif V522 actif.");
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
