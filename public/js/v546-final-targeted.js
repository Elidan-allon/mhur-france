/* ==========================================================================
   MHUR NEXUS — V546
   Synchronisation légère, sans observer global permanent.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function english() {
    try {
      if (typeof lang !== "undefined") return lang === "en";
    } catch (_) {}
    return document.documentElement.lang === "en";
  }

  /* -----------------------------------------------------------------------
     MESURE DU BAS VISUEL DU HEADER
     Ne modifie jamais la hauteur du header.
     ----------------------------------------------------------------------- */
  let headerFrame = 0;

  function visibleRect(node) {
    if (!(node instanceof Element)) return null;
    const style = getComputedStyle(node);

    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) === 0
    ) {
      return null;
    }

    const rect = node.getBoundingClientRect();

    return rect.width > 0 && rect.height > 0
      ? rect
      : null;
  }

  function measureHeader() {
    cancelAnimationFrame(headerFrame);

    headerFrame = requestAnimationFrame(() => {
      const header = $('header.top[data-mhur-header-version="513"], header.top');
      if (!header) return;

      const candidates = [
        header,
        header.querySelector(".mhurMobileBrandRowV57"),
        header.querySelector(".mhurMobileToolbarV57"),
        ...header.querySelectorAll(
          ".brand,.menuBtn,.nexusHeaderBtn,#mhurAdminButton," +
          "#mhurAccountButton,.lang"
        )
      ];

      let bottom = 0;

      candidates.forEach(node => {
        const rect = visibleRect(node);
        if (rect) bottom = Math.max(bottom, rect.bottom);
      });

      const safeFallback =
        matchMedia("(max-width: 390px)").matches
          ? 107
          : matchMedia("(max-width: 760px)").matches
            ? 115
            : 72;

      bottom = Math.max(bottom, safeFallback);

      const value = `${Math.ceil(bottom + 4)}px`;

      document.documentElement.style.setProperty(
        "--mhur-v546-header-bottom",
        value
      );

      /* Seulement des variables de position, jamais la hauteur du header. */
      document.documentElement.style.setProperty(
        "--mhur-v517-measured-header-bottom",
        value
      );

      document.documentElement.style.setProperty(
        "--s18-header-offset",
        value
      );
    });
  }

  /* -----------------------------------------------------------------------
     PROFIL — NETTOYAGE TEMPORAIRE ET IDEMPOTENT
     ----------------------------------------------------------------------- */
  let profileTimer = 0;
  let temporaryObserver = null;

  function isFeedbackButton(button) {
    const text = normalize(button.textContent);
    const classes = String(button.className || "");

    return (
      /FeedbackProfileButton|FeedbackButton/i.test(classes) ||
      text.includes("suggestion probleme") ||
      text.includes("suggestion issue")
    );
  }

  function isModerationButton(button) {
    const text = normalize(button.textContent);
    const classes = String(button.className || "");

    return (
      /AdminProfileButton|ProfileAdminButton|ModerationButton/i.test(classes) ||
      text.includes("centre de moderation") ||
      text.includes("moderation center")
    );
  }

  function cleanProfileButtons() {
    const card = $(
      "#mhurAuthOverlay .mhurProfileCard," +
      "#mhurAuthOverlay [class*='ProfileCard']"
    );

    if (!card) return;

    const buttons = $$("button", card);
    const feedback = buttons.filter(isFeedbackButton);
    const moderation = buttons.filter(isModerationButton);

    if (feedback.length) {
      const keep =
        feedback.find(button =>
          /V543|V545|V546/i.test(String(button.className || ""))
        ) ||
        feedback[feedback.length - 1];

      feedback
        .filter(button => button !== keep)
        .forEach(button => button.remove());

      keep.classList.add(
        "mhurV546ProfileAction",
        "mhurV546FeedbackButton"
      );

      keep.textContent = english()
        ? "💡 Suggestion / issue"
        : "💡 Suggestion / problème";
    }

    if (moderation.length) {
      const keep =
        moderation.find(button =>
          /V543|V545|V546/i.test(String(button.className || ""))
        ) ||
        moderation[moderation.length - 1];

      moderation
        .filter(button => button !== keep)
        .forEach(button => button.remove());

      keep.classList.add(
        "mhurV546ProfileAction",
        "mhurV546ModerationButton"
      );

      keep.textContent = english()
        ? "🛡️ Moderation center"
        : "🛡️ Centre de modération";
    }
  }

  function scheduleProfileClean() {
    clearTimeout(profileTimer);
    profileTimer = setTimeout(cleanProfileButtons, 20);
  }

  function watchProfileTemporarily() {
    temporaryObserver?.disconnect();

    const overlay = document.getElementById("mhurAuthOverlay");

    if (overlay) {
      temporaryObserver = new MutationObserver(scheduleProfileClean);
      temporaryObserver.observe(overlay, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        temporaryObserver?.disconnect();
        temporaryObserver = null;
      }, 1400);
    }

    [0, 40, 120, 280, 650, 1100].forEach(delay => {
      setTimeout(cleanProfileButtons, delay);
    });
  }

  /* -----------------------------------------------------------------------
     TUTORIEL MODS
     ----------------------------------------------------------------------- */
  function cleanTutorial(root = document) {
    root.querySelectorAll?.(".modsTutorial").forEach(details => {
      const summary = details.querySelector(":scope > summary");
      if (!summary) return;

      if (!summary.classList.contains("modsTutorialSummaryV546")) {
        summary.className = "modsTutorialSummaryV546";
        summary.innerHTML =
          '<span class="modsTutorialBookV546" aria-hidden="true"></span>' +
          '<span class="modsTutorialTitleV546">' +
          (english()
            ? "Install mods - PC Steam only"
            : "Installer des mods - PC Steam uniquement") +
          "</span>" +
          '<span class="modsTutorialHintV546">' +
          (english()
            ? "Click here to open the tutorial"
            : "Clique ici pour ouvrir le tutoriel") +
          "</span>" +
          '<span class="modsTutorialChevronV546" aria-hidden="true"></span>';
      }

      [...details.children].forEach(child => {
        if (child === summary) return;

        const text = String(child.textContent || "")
          .replace(/\s+/g, "")
          .toLowerCase();

        const classes = String(child.className || "");

        if (
          ["v", "⌄", "⌃", "∨", "˅", "↓", "↑"].includes(text) ||
          /modsTutorialChevron|s18ModsHint/i.test(classes)
        ) {
          child.remove();
        }
      });
    });
  }

  /* -----------------------------------------------------------------------
     SÉCURITÉ DOM POUR GENTLE
     La méthode principale est aussi corrigée directement dans community-hub.js.
     ----------------------------------------------------------------------- */
  function cleanGentleCards(root = document) {
    const cards = $$(".mhurTierItem", root).filter(card => {
      const text = normalize(
        `${card.textContent || ""} ${card.querySelector("img")?.alt || ""}`
      );

      return text.includes("gentle criminal");
    });

    if (!cards.length) return;

    const keep =
      cards.find(card =>
        String(card.querySelector("img")?.src || "")
          .includes("gentle_criminal_technical/portrait.png")
      ) ||
      cards[0];

    cards
      .filter(card => card !== keep)
      .forEach(card => card.remove());

    keep.dataset.v546Gentle = "1";

    const image = keep.querySelector("img");

    if (image) {
      image.removeAttribute("srcset");

      if (
        !String(image.getAttribute("src") || "")
          .includes("gentle_criminal_technical/portrait.png")
      ) {
        image.src =
          "assets/gentle_criminal/" +
          "gentle_criminal_technical/portrait.png?v=546";
      }

      image.onerror = () => {
        image.onerror = null;
        image.src =
          "assets/home/season18/gentle_s18_portrait.webp?v=546";
      };
    }
  }

  /* -----------------------------------------------------------------------
     PATCH NOTES
     ----------------------------------------------------------------------- */
  function refreshNotes() {
    measureHeader();

    const modal = document.getElementById("s18NotesDevModalV10");
    if (!modal) return;

    const panel = modal.querySelector(".s18NotesPanelV10");
    const body = modal.querySelector(".s18NotesBodyV10");

    if (panel) {
      panel.style.removeProperty("height");
      panel.style.removeProperty("max-height");
    }

    if (body) {
      body.style.removeProperty("height");
      body.style.removeProperty("max-height");
    }
  }

  function install() {
    measureHeader();
    cleanTutorial(document);
    cleanGentleCards(document);

    document.addEventListener(
      "click",
      event => {
        if (
          event.target.closest(
            "#mhurAccountButton,.mhurAccountButton"
          )
        ) {
          watchProfileTemporarily();
        }

        if (
          event.target.closest(
            "#mhurPatchDevButtonV14,.mhurPatchDevButtonV14," +
            "[data-s18-notes-button]"
          )
        ) {
          [0, 30, 100].forEach(delay =>
            setTimeout(refreshNotes, delay)
          );
        }
      },
      true
    );

    addEventListener("resize", measureHeader, {
      passive: true
    });

    addEventListener("orientationchange", () => {
      setTimeout(measureHeader, 80);
    }, {
      passive: true
    });

    addEventListener("pageshow", measureHeader, {
      passive: true
    });

    addEventListener("mhur-auth-change", () => {
      measureHeader();
      scheduleProfileClean();
    });

    addEventListener("mhur-role-change", () => {
      measureHeader();
      scheduleProfileClean();
    });

    addEventListener("mhur:languagechange", () => {
      cleanTutorial(document);
      scheduleProfileClean();
    });

    const header = $('header.top');

    if (header && "ResizeObserver" in window) {
      const observer = new ResizeObserver(measureHeader);
      observer.observe(header);

      header
        .querySelectorAll(
          ".mhurMobileBrandRowV57,.mhurMobileToolbarV57"
        )
        .forEach(node => observer.observe(node));
    }

    /*
      Une observation limitée aux zones utiles :
      aucune modification permanente du profil.
    */
    const app = document.getElementById("app");

    if (app) {
      const appObserver = new MutationObserver(records => {
        let tierChanged = false;
        let modsChanged = false;

        records.forEach(record => {
          record.addedNodes.forEach(node => {
            if (!(node instanceof Element)) return;

            if (
              node.matches?.(".mhurTierItem,#mhurTierList") ||
              node.querySelector?.(".mhurTierItem")
            ) {
              tierChanged = true;
            }

            if (
              node.matches?.(".modsTutorial") ||
              node.querySelector?.(".modsTutorial")
            ) {
              modsChanged = true;
            }
          });
        });

        if (tierChanged) cleanGentleCards(app);
        if (modsChanged) cleanTutorial(app);
      });

      appObserver.observe(app, {
        childList: true,
        subtree: true
      });
    }

    [80, 250, 700, 1400].forEach(delay => {
      setTimeout(() => {
        measureHeader();
        cleanTutorial(document);
        cleanGentleCards(document);
      }, delay);
    });

    window.MHUR_V546 = {
      measureHeader,
      cleanProfileButtons,
      cleanGentleCards,
      cleanTutorial,
      refreshNotes
    };

    console.info("[MHUR] V546 actif.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, {
      once: true
    });
  } else {
    install();
  }
})();
