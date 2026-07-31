/* ============================================================
   MHUR NEXUS — V542
   Gestionnaire unique et fiable du bouton Patch Notes.
   Aucun ResizeObserver sur le header.
   ============================================================ */
(() => {
  "use strict";

  const BUTTON_SELECTOR = [
    "#mhurPatchDevButtonV14",
    ".mhurPatchDevButtonV14",
    "[data-s18-notes-button]"
  ].join(",");

  function openNotes(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    let opened = false;
    const api =
      window.MHUR_S18_V14 ||
      window.MHUR_S18_V13 ||
      window.MHUR_S18_V10;

    try {
      if (typeof api?.openNotes === "function") {
        api.openNotes();
        opened = true;
      }
    } catch (error) {
      console.error("[MHUR V542] Patch Notes", error);
    }

    const modal = document.getElementById("s18NotesDevModalV10");

    if (modal) {
      modal.classList.add("open");
      document.body.classList.add("s18NotesOpenV11");

      try {
        api?.showPatch?.(0);
      } catch (_) {}

      opened = true;
    }

    if (!opened) {
      window.__s18OpenNotesRequested = true;

      try {
        window.MHUR_S18_OPEN_NOTES_EARLY?.();
      } catch (_) {}
    }

    return false;
  }

  function cleanButtons() {
    document.querySelectorAll(BUTTON_SELECTOR).forEach(button => {
      button.onclick = null;
      button.dataset.mhurV542Notes = "1";
      button.setAttribute("aria-label", "Patch Notes / Dev Notes");
    });
  }

  window.MHUR_V542_OPEN_NOTES = openNotes;

  document.addEventListener(
    "click",
    event => {
      const button = event.target.closest?.(BUTTON_SELECTOR);
      if (!button) return;
      openNotes(event);
    },
    true
  );

  document.documentElement.style.removeProperty(
    "--mhur-v541-header-space"
  );

  cleanButtons();

  const header = document.querySelector("header.top");

  if (header) {
    new MutationObserver(cleanButtons).observe(header, {
      childList: true,
      subtree: true
    });
  }

  window.addEventListener("mhur:languagechange", cleanButtons);

  console.info(
    "[MHUR] V542 : Patch Notes fiable et header mobile verrouillé."
  );
})();
