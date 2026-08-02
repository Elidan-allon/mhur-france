/* ==========================================================================
   MHUR NEXUS — V550
   Répare le tutoriel et reconstruit proprement la fenêtre Notes si nécessaire.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const LEGACY_ARROW_SELECTOR = [
    ".modsTutorialChevronV537",
    ".modsTutorialChevronV540",
    ".modsTutorialChevronV544",
    ".modsTutorialChevronV545",
    ".modsTutorialChevronV546",
    ".modsTutorialChevronV549",
    ".mhurModsArrow",
    "[data-mods-arrow]",
    "[data-v549-old-arrow='1']"
  ].join(",");

  function cleanModsTutorial(root = document) {
    const tutorials = [];

    if (
      root instanceof Element &&
      root.matches(".modsTutorial")
    ) {
      tutorials.push(root);
    }

    if (root.querySelectorAll) {
      const found = root.querySelectorAll(".modsTutorial");

      for (let index = 0; index < found.length; index += 1) {
        tutorials.push(found[index]);
      }
    }

    for (
      let tutorialIndex = 0;
      tutorialIndex < tutorials.length;
      tutorialIndex += 1
    ) {
      const details = tutorials[tutorialIndex];
      const legacyArrows = details.querySelectorAll(
        LEGACY_ARROW_SELECTOR
      );

      for (
        let arrowIndex = 0;
        arrowIndex < legacyArrows.length;
        arrowIndex += 1
      ) {
        legacyArrows[arrowIndex].remove();
      }

      /*
        Le V549 pouvait poser son attribut sur un ancien bouton.
        On ne supprime rien d'autre que les éléments explicitement marqués.
      */
      const summary = details.querySelector(":scope > summary");

      if (summary) {
        summary.style.removeProperty("background-image");
        summary.style.removeProperty("background");
      }
    }
  }

  function measureNotesTop() {
    const selectors = [
      "header.top",
      "#siteHeader",
      ".nexusHeader",
      "#topbar",
      ".topbar"
    ];

    let bottom = 0;

    for (
      let selectorIndex = 0;
      selectorIndex < selectors.length;
      selectorIndex += 1
    ) {
      const nodes = document.querySelectorAll(
        selectors[selectorIndex]
      );

      for (
        let nodeIndex = 0;
        nodeIndex < nodes.length;
        nodeIndex += 1
      ) {
        const node = nodes[nodeIndex];
        const style = getComputedStyle(node);

        if (
          style.display === "none" ||
          style.visibility === "hidden"
        ) {
          continue;
        }

        const rectangle = node.getBoundingClientRect();

        if (
          rectangle.width > 0 &&
          rectangle.height > 0
        ) {
          bottom = Math.max(bottom, rectangle.bottom);
        }
      }
    }

    const fallback = matchMedia("(max-width: 760px)").matches
      ? 116
      : 58;

    bottom = Math.max(bottom, fallback);

    document.documentElement.style.setProperty(
      "--mhur-v550-notes-top",
      `${Math.ceil(bottom)}px`
    );

    return bottom;
  }

  function notesModal() {
    return document.getElementById(
      "s18NotesDevModalV10"
    );
  }

  function modalHasWorkingTabs(modal) {
    if (!modal) return false;

    const nav = modal.querySelector(
      ".s18NotesPanelV10 > nav"
    );

    const patch = nav?.querySelector(
      '[data-tab="patch"]'
    );

    const dev = nav?.querySelector(
      '[data-tab="dev"]'
    );

    return Boolean(nav && patch && dev);
  }

  let rebuildingModal = false;

  function rebuildNotesModal(openAfter = false) {
    if (rebuildingModal) return;

    rebuildingModal = true;

    try {
      const oldModal = notesModal();
      const wasOpen = Boolean(
        oldModal?.classList.contains("open")
      );

      if (oldModal) {
        oldModal.remove();
      }

      document.body.classList.remove(
        "s18NotesOpenV11"
      );

      if (
        (openAfter || wasOpen) &&
        window.MHUR_S18_V10?.openNotes
      ) {
        window.MHUR_S18_V10.openNotes();
      }
    } finally {
      rebuildingModal = false;
    }
  }

  function repairNotesModal() {
    measureNotesTop();

    const modal = notesModal();

    if (!modal) return;

    if (!modalHasWorkingTabs(modal)) {
      rebuildNotesModal(
        modal.classList.contains("open")
      );
      return;
    }

    const panel = modal.querySelector(
      ".s18NotesPanelV10"
    );

    const body = modal.querySelector(
      ".s18NotesBodyV10"
    );

    if (panel) {
      panel.style.removeProperty("height");
      panel.style.removeProperty("max-height");
    }

    if (body) {
      body.style.removeProperty("height");
      body.style.removeProperty("max-height");
    }

    const nav = modal.querySelector(
      ".s18NotesPanelV10 > nav"
    );

    if (nav) {
      nav.hidden = false;
      nav.removeAttribute("aria-hidden");
    }

    const tabButtons = modal.querySelectorAll(
      ".s18NotesPanelV10 > nav [data-tab]"
    );

    for (
      let index = 0;
      index < tabButtons.length;
      index += 1
    ) {
      tabButtons[index].hidden = false;
      tabButtons[index].removeAttribute(
        "aria-hidden"
      );
      tabButtons[index].removeAttribute(
        "tabindex"
      );
    }
  }

  function prepareFreshNotesOpen() {
    /*
      Le gestionnaire original est posé avec button.onclick.
      Ce gestionnaire en capture passe avant lui : on supprime donc
      l'ancienne fenêtre cassée, puis le code original en recrée une neuve.
    */
    const modal = notesModal();

    if (modal && !modalHasWorkingTabs(modal)) {
      modal.remove();
      document.body.classList.remove(
        "s18NotesOpenV11"
      );
    }

    measureNotesTop();

    const delays = [0, 30, 90, 180];

    for (
      let index = 0;
      index < delays.length;
      index += 1
    ) {
      setTimeout(repairNotesModal, delays[index]);
    }
  }

  function ensureDevScrollAfterClick(event) {
    const button = event.target.closest(
      '.s18NotesPanelV10 [data-tab="dev"]'
    );

    if (!button) return;

    const delays = [0, 30, 100];

    for (
      let index = 0;
      index < delays.length;
      index += 1
    ) {
      setTimeout(() => {
        repairNotesModal();

        const main = notesModal()?.querySelector(
          ".s18NotesBodyV10 > main"
        );

        if (main) {
          main.scrollTop = 0;
        }
      }, delays[index]);
    }
  }

  function install() {
    cleanModsTutorial(document);
    measureNotesTop();
    repairNotesModal();

    document.addEventListener(
      "click",
      event => {
        const notesButton = event.target.closest(
          "#mhurPatchDevButtonV14," +
          ".mhurPatchDevButtonV14," +
          "[data-s18-notes-button]"
        );

        if (notesButton) {
          prepareFreshNotesOpen();
        }

        ensureDevScrollAfterClick(event);
      },
      true
    );

    const app =
      document.getElementById("app") ||
      document.body;

    const observer = new MutationObserver(
      records => {
        let modsChanged = false;
        let notesChanged = false;

        for (
          let recordIndex = 0;
          recordIndex < records.length;
          recordIndex += 1
        ) {
          const record = records[recordIndex];

          for (
            let nodeIndex = 0;
            nodeIndex < record.addedNodes.length;
            nodeIndex += 1
          ) {
            const node = record.addedNodes[nodeIndex];

            if (!(node instanceof Element)) {
              continue;
            }

            if (
              node.matches(".modsTutorial") ||
              node.querySelector(".modsTutorial")
            ) {
              modsChanged = true;
            }

            if (
              node.id === "s18NotesDevModalV10" ||
              node.querySelector(
                "#s18NotesDevModalV10"
              )
            ) {
              notesChanged = true;
            }
          }
        }

        if (modsChanged) {
          cleanModsTutorial(app);
        }

        if (notesChanged) {
          setTimeout(repairNotesModal, 0);
        }
      }
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    addEventListener(
      "resize",
      () => {
        measureNotesTop();
        repairNotesModal();
      },
      {passive: true}
    );

    addEventListener(
      "orientationchange",
      () => {
        setTimeout(() => {
          measureNotesTop();
          repairNotesModal();
        }, 100);
      },
      {passive: true}
    );

    const startupDelays = [50, 180, 500, 1100];

    for (
      let index = 0;
      index < startupDelays.length;
      index += 1
    ) {
      setTimeout(() => {
        cleanModsTutorial(document);
        repairNotesModal();
      }, startupDelays[index]);
    }

    window.MHUR_V550 = {
      cleanModsTutorial,
      repairNotesModal,
      rebuildNotesModal,
      measureNotesTop
    };

    console.info(
      "[MHUR] V550 : tutoriel et Patch/Dev Notes réparés."
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      install,
      {once: true}
    );
  } else {
    install();
  }
})();
