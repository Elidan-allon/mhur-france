/* ============================================================
   MHUR FRANCE — V540
   Dernier passage synchrone : aucun render retarde.
   ============================================================ */
(() => {
  "use strict";

  function removeLatestUpdate() {
    const card = document.querySelector(
      ".homeV296 .latestPatchCardV303"
    );

    if (!card) return;

    const title = card.previousElementSibling;
    const divider =
      title && title.classList.contains("homeTitleV296")
        ? title.previousElementSibling
        : null;

    card.remove();

    if (title && title.classList.contains("homeTitleV296")) {
      title.remove();
    }

    if (divider && divider.classList.contains("homeDividerV296")) {
      divider.remove();
    }
  }

  function cleanModsTutorial() {
    const summary = document.querySelector(
      ".modsTutorial > summary"
    );

    if (!summary) return;

    const english =
      document.documentElement.lang === "en";

    summary.className = "modsTutorialSummaryV540";
    summary.innerHTML =
      '<span class="modsTutorialBookV540" aria-hidden="true"></span>' +
      '<span class="modsTutorialTitleV540">' +
      (english
        ? "Install mods - PC Steam only"
        : "Installer des mods - PC Steam uniquement") +
      "</span>" +
      '<span class="modsTutorialHintV540">' +
      (english
        ? "Click here to open the tutorial"
        : "Clique ici pour ouvrir le tutoriel") +
      "</span>" +
      '<span class="modsTutorialChevronV540" aria-hidden="true"></span>';
  }

  function afterRender() {
    removeLatestUpdate();
    cleanModsTutorial();
    window.MHUR_HOME_REFRESH?.();
  }

  function wrapFinalRender() {
    if (
      typeof window.render !== "function" ||
      window.render.__mhurV540Final
    ) {
      return;
    }

    const previous = window.render;

    const wrapped = function () {
      const result = previous.apply(this, arguments);
      afterRender();
      return result;
    };

    wrapped.__mhurV540Final = true;
    window.render = wrapped;

    try {
      render = wrapped;
    } catch (_) {}
  }

  function startFinalLayout() {
    wrapFinalRender();

    const app = document.getElementById("app");
    const needsFirstLayout =
      Boolean(window.__MHUR_FINAL_LAYOUT_PENDING__) ||
      !app ||
      !app.firstElementChild;

    if (
      needsFirstLayout &&
      typeof window.layout === "function"
    ) {
      window.__MHUR_FORCE_HOME_RENDER__ = true;
      window.__MHUR_FINAL_LAYOUT_PENDING__ = false;
      window.layout();
      window.__MHUR_FORCE_HOME_RENDER__ = false;
    }

    afterRender();
    document.documentElement.classList.remove("mhurV540Boot");

    console.info(
      "[MHUR] V540 : premier affichage final et stable."
    );
  }

  startFinalLayout();
})();
