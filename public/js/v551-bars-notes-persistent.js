/* ==========================================================================
   MHUR NEXUS — V551
   Mesure du header et nettoyage très ciblé des anciennes flèches.
   La recréation complète de la fenêtre Notes est installée directement
   dans season18-fixes.js par APPLIQUER_CORRECTIF_V551.js.
   ========================================================================== */
(() => {
  "use strict";

  const LEGACY_ARROWS = [
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

  function cleanLegacyArrows(root = document) {
    if (!root.querySelectorAll) return;

    const arrows = root.querySelectorAll(LEGACY_ARROWS);

    for (
      let index = 0;
      index < arrows.length;
      index += 1
    ) {
      arrows[index].remove();
    }

    const summaries = root.querySelectorAll(
      ".modsTutorial > summary"
    );

    for (
      let index = 0;
      index < summaries.length;
      index += 1
    ) {
      summaries[index].style.removeProperty(
        "background"
      );

      summaries[index].style.removeProperty(
        "background-image"
      );
    }
  }

  let measureFrame = 0;

  function measureHeader() {
    cancelAnimationFrame(measureFrame);

    measureFrame = requestAnimationFrame(() => {
      const candidates = document.querySelectorAll(
        "header.top," +
        "#siteHeader," +
        ".nexusHeader," +
        "#topbar," +
        ".topbar," +
        ".mhurMobileBrandRowV57," +
        ".mhurMobileToolbarV57"
      );

      let bottom = 0;

      for (
        let index = 0;
        index < candidates.length;
        index += 1
      ) {
        const element = candidates[index];
        const style = getComputedStyle(element);

        if (
          style.display === "none" ||
          style.visibility === "hidden"
        ) {
          continue;
        }

        const rectangle =
          element.getBoundingClientRect();

        if (
          rectangle.width > 0 &&
          rectangle.height > 0
        ) {
          bottom = Math.max(
            bottom,
            rectangle.bottom
          );
        }
      }

      const fallback =
        matchMedia("(max-width: 760px)").matches
          ? 116
          : 58;

      bottom = Math.max(bottom, fallback);

      document.documentElement.style.setProperty(
        "--mhur-v551-notes-top",
        `${Math.ceil(bottom)}px`
      );
    });
  }

  function ensureNotesVisible() {
    const modal = document.getElementById(
      "s18NotesDevModalV10"
    );

    if (!modal) return;

    const nav = modal.querySelector(
      ".s18NotesPanelV10 > nav"
    );

    if (nav) {
      nav.hidden = false;
      nav.removeAttribute("aria-hidden");
    }

    const tabs = modal.querySelectorAll(
      '.s18NotesPanelV10 [data-tab="patch"],' +
      '.s18NotesPanelV10 [data-tab="dev"]'
    );

    for (
      let index = 0;
      index < tabs.length;
      index += 1
    ) {
      tabs[index].hidden = false;
      tabs[index].removeAttribute("aria-hidden");
      tabs[index].removeAttribute("tabindex");
    }
  }

  function install() {
    cleanLegacyArrows(document);
    measureHeader();
    ensureNotesVisible();

    const observer = new MutationObserver(
      records => {
        let cleanArrows = false;
        let checkNotes = false;

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
              cleanArrows = true;
            }

            if (
              node.id === "s18NotesDevModalV10" ||
              node.querySelector(
                "#s18NotesDevModalV10"
              )
            ) {
              checkNotes = true;
            }
          }
        }

        if (cleanArrows) {
          cleanLegacyArrows(document);
        }

        if (checkNotes) {
          requestAnimationFrame(
            ensureNotesVisible
          );
        }
      }
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    document.addEventListener(
      "click",
      event => {
        if (
          event.target.closest(
            "#mhurPatchDevButtonV14," +
            ".mhurPatchDevButtonV14," +
            "[data-s18-notes-button]," +
            "#s18NotesDevModalV10 [data-tab]"
          )
        ) {
          measureHeader();

          const delays = [0, 30, 100];

          for (
            let index = 0;
            index < delays.length;
            index += 1
          ) {
            setTimeout(
              ensureNotesVisible,
              delays[index]
            );
          }
        }
      },
      true
    );

    addEventListener(
      "resize",
      measureHeader,
      {passive: true}
    );

    addEventListener(
      "orientationchange",
      () => setTimeout(measureHeader, 100),
      {passive: true}
    );

    window.MHUR_V551 = {
      cleanLegacyArrows,
      measureHeader,
      ensureNotesVisible
    };

    console.info(
      "[MHUR] V551 : barres et fenêtre Notes réparées."
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
