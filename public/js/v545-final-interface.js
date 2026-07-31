/* ==========================================================================
   MHUR NEXUS — V545
   Dernière couche ciblée, sans modifier la hauteur du header.
   ========================================================================== */
(() => {
  "use strict";

  const GENTLE_PORTRAIT =
    "/assets/gentle_criminal/gentle_criminal_technical/portrait.png?v=545";

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

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
      if (typeof lang !== "undefined") return lang === "en";
    } catch (_) {}

    return document.documentElement.lang === "en";
  }

  /* -----------------------------------------------------------------------
     TABLEAUX D'ALTERS ROBUSTES
     ----------------------------------------------------------------------- */
  function localized(value) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const current = isEnglish() ? "en" : "fr";
      return value[current] ?? value.fr ?? value.en ?? "";
    }

    return value ?? "";
  }

  function arrayValue(value) {
    if (Array.isArray(value)) return value;

    const selected = localized(value);

    if (Array.isArray(selected)) return selected;
    if (selected === "" || selected == null) return [];

    return [selected];
  }

  function cellValue(value) {
    const selected = localized(value);

    return Array.isArray(selected)
      ? selected.join(" / ")
      : String(selected ?? "");
  }

  function robustTables(tableList) {
    const source = arrayValue(tableList);

    const ordered = source
      .map((table, index) => {
        const safe =
          table && typeof table === "object"
            ? table
            : {};

        const title = cellValue(safe.title);
        const normalizedTitle = normalize(title);

        const priority =
          /effets? de montee/.test(normalizedTitle) ||
          /level up effects?/.test(normalizedTitle)
            ? 0
            : 1;

        return {table: safe, index, title, priority};
      })
      .sort(
        (first, second) =>
          first.priority - second.priority ||
          first.index - second.index
      );

    return `<div class="tables">${ordered.map(entry => {
      const columns = arrayValue(entry.table.cols);
      const rows = arrayValue(entry.table.rows);

      return (
        `<button class="toggle" ` +
        `onclick="this.nextElementSibling.classList.toggle('hidden')">` +
        `${entry.title} ▾</button>` +
        `<div class="simpleTable hidden">` +
        `<table class="dataTable">` +
        `<thead><tr>${columns.map(column =>
          `<th>${cellValue(column)}</th>`
        ).join("")}</tr></thead>` +
        `<tbody>${rows.map(row => {
          const cells = arrayValue(row);

          return `<tr>${cells.map(cell =>
            `<td>${cellValue(cell)}</td>`
          ).join("")}</tr>`;
        }).join("")}</tbody>` +
        `</table></div>`
      );
    }).join("")}</div>`;
  }

  function installTables() {
    window.tables = robustTables;

    try {
      tables = robustTables;
    } catch (_) {}
  }

  function repairCharacterError() {
    const app = document.getElementById("app");
    if (!app) return;

    const text = normalize(app.textContent);

    if (
      text.includes("table cols") &&
      text.includes("map is not a function")
    ) {
      try {
        window.__keepScroll = true;
        window.render?.();
      } catch (error) {
        console.error("[MHUR V545] Rendu personnage", error);
      }
    }
  }

  /* -----------------------------------------------------------------------
     GENTLE CRIMINAL DANS LA TIER LIST
     ----------------------------------------------------------------------- */
  function fixGentleTier(root = document) {
    $$(".mhurTierItem", root).forEach(card => {
      const text = normalize(
        `${card.textContent || ""} ` +
        `${card.querySelector("img")?.alt || ""}`
      );

      if (!text.includes("gentle criminal")) return;

      card.dataset.v545Gentle = "1";

      const image = card.querySelector("img");
      if (!image) return;

      const expected = GENTLE_PORTRAIT;

      if (
        !String(image.getAttribute("src") || "").includes(
          "gentle_criminal_technical/portrait.png"
        )
      ) {
        image.removeAttribute("srcset");
        image.src = expected;
      }

      image.onerror = () => {
        image.onerror = null;
        image.removeAttribute("srcset");
        image.src =
          "/assets/home/discounts/gentle_criminal_v531.png?v=545";
      };
    });
  }

  /* -----------------------------------------------------------------------
     TUTORIEL MODS — SUPPRESSION PHYSIQUE DE LA DEUXIÈME FLÈCHE
     ----------------------------------------------------------------------- */
  function cleanTutorial(root = document) {
    root.querySelectorAll?.(".modsTutorial").forEach(details => {
      const summary = details.querySelector(":scope > summary");
      if (!summary) return;

      summary.className = "modsTutorialSummaryV545";
      summary.innerHTML =
        '<span class="modsTutorialBookV545" aria-hidden="true"></span>' +
        '<span class="modsTutorialTitleV545">' +
        (isEnglish()
          ? "Install mods - PC Steam only"
          : "Installer des mods - PC Steam uniquement") +
        "</span>" +
        '<span class="modsTutorialHintV545">' +
        (isEnglish()
          ? "Click here to open the tutorial"
          : "Clique ici pour ouvrir le tutoriel") +
        "</span>" +
        '<span class="modsTutorialChevronV545" aria-hidden="true"></span>';

      /*
        Les anciens correctifs pouvaient ajouter un vrai bouton rond
        directement sous <details>. On enlève seulement les éléments
        dont le contenu est exclusivement une flèche.
      */
      [...details.children].forEach(child => {
        if (child === summary) return;

        const classes = String(child.className || "");
        const text = String(child.textContent || "")
          .replace(/\s+/g, "")
          .toLowerCase();

        const arrowOnly =
          ["v", "⌄", "⌃", "∨", "˅", "↓", "↑"].includes(text);

        const legacyClass =
          /modsTutorialChevron|s18ModsHint/i.test(classes);

        if (arrowOnly || legacyClass) {
          child.remove();
        }
      });
    });
  }

  /* -----------------------------------------------------------------------
     PROFIL — DÉDOUBLONNAGE PERMANENT
     ----------------------------------------------------------------------- */
  let profileCleaning = false;

  function currentProfile() {
    return window.MHUR_AUTH?.getProfile?.() || null;
  }

  function isStaff(existingAdminButtons) {
    const role = normalize(
      currentProfile()?.role ||
      localStorage.getItem("mhur_role") ||
      ""
    );

    return Boolean(
      existingAdminButtons.length ||
      window.MHUR_MODERATION?.isAdmin?.() ||
      ["admin", "administrator", "moderator"].includes(role)
    );
  }

  function feedbackButtons(card) {
    return $$("button", card).filter(button => {
      const text = normalize(button.textContent);
      const classes = String(button.className || "");

      return (
        /mhurV539FeedbackProfileButton|mhurV543FeedbackProfileButton|mhurV545FeedbackButton/.test(classes) ||
        text.includes("suggestion probleme") ||
        text.includes("suggestion issue")
      );
    });
  }

  function moderationButtons(card) {
    return $$("button", card).filter(button => {
      const text = normalize(button.textContent);
      const classes = String(button.className || "");

      return (
        /mhurV539AdminProfileButton|s18ProfileAdminButtonV10|mhurV543AdminProfileButton|mhurV545ModerationButton/.test(classes) ||
        text.includes("centre de moderation") ||
        text.includes("moderation center")
      );
    });
  }

  function cleanProfileButtons() {
    if (profileCleaning) return;

    const card = $(
      "#mhurAuthOverlay .mhurProfileCard, " +
      "#mhurAuthOverlay [class*='ProfileCard']"
    );

    if (!card || !window.MHUR_AUTH?.getUser?.()) return;

    profileCleaning = true;

    try {
      const logout = $(".mhurLogout", card);
      const feedbackList = feedbackButtons(card);
      const adminList = moderationButtons(card);

      let feedback = feedbackList[0];

      if (!feedback) {
        feedback = document.createElement("button");
        feedback.type = "button";
        card.insertBefore(feedback, logout || null);
      }

      feedback.className =
        "mhurV539ProfileAction " +
        "mhurV539FeedbackProfileButton " +
        "mhurV543FeedbackProfileButton " +
        "mhurV545ProfileAction mhurV545FeedbackButton";

      feedback.textContent = isEnglish()
        ? "Suggestion / issue"
        : "Suggestion / problème";

      feedback.hidden = false;

      feedback.onclick = event => {
        event.preventDefault();
        event.stopPropagation();

        window.MHUR_AUTH?.close?.();

        if (window.MHUR_V543?.openFeedback) {
          window.MHUR_V543.openFeedback();
        } else {
          window.MHUR_V539?.openFeedback?.();
        }
      };

      feedbackList
        .filter(button => button !== feedback)
        .forEach(button => button.remove());

      if (isStaff(adminList)) {
        let moderation = adminList[0];

        if (!moderation) {
          moderation = document.createElement("button");
          moderation.type = "button";
          card.insertBefore(moderation, logout || null);
        }

        moderation.className =
          "mhurV539ProfileAction " +
          "mhurV539AdminProfileButton " +
          "s18ProfileAdminButtonV10 " +
          "mhurV543AdminProfileButton " +
          "mhurV545ProfileAction mhurV545ModerationButton";

        moderation.textContent = isEnglish()
          ? "Moderation center"
          : "Centre de modération";

        moderation.hidden = false;

        moderation.onclick = event => {
          event.preventDefault();
          event.stopPropagation();

          window.MHUR_AUTH?.close?.();

          if (window.MHUR_V543?.openHub) {
            window.MHUR_V543.openHub("overview");
          } else if (window.MHUR_V539?.openHub) {
            window.MHUR_V539.openHub();
          } else {
            window.MHUR_MODERATION?.openAdmin?.();
          }
        };

        adminList
          .filter(button => button !== moderation)
          .forEach(button => button.remove());
      } else {
        adminList.forEach(button => button.remove());
      }

      /*
        Ordre stable : profil public, liste, suggestion, modération,
        puis déconnexion.
      */
      if (logout) {
        card.insertBefore(feedback, logout);

        const moderation = $(
          ".mhurV545ModerationButton",
          card
        );

        if (moderation) {
          card.insertBefore(moderation, logout);
        }
      }
    } finally {
      profileCleaning = false;
    }
  }

  /* -----------------------------------------------------------------------
     MOBILE — MESURE SANS MODIFIER LE HEADER
     ----------------------------------------------------------------------- */
  let mobileFrame = 0;

  function syncMobileOffset() {
    cancelAnimationFrame(mobileFrame);

    mobileFrame = requestAnimationFrame(() => {
      if (!matchMedia("(max-width: 760px)").matches) {
        document.documentElement.style.removeProperty(
          "--mhur-v545-header-space"
        );
        return;
      }

      const header = $(
        'header.top[data-mhur-header-version="513"], header.top'
      );

      if (!header) return;

      const rectangle = header.getBoundingClientRect();

      /*
        On utilise la position réelle du bas du header + 12 px.
        Cette variable n'est jamais utilisée pour dimensionner le header.
      */
      const bottom = Math.max(
        rectangle.bottom,
        rectangle.height
      );

      const space = Math.max(112, Math.ceil(bottom + 12));

      document.documentElement.style.setProperty(
        "--mhur-v545-header-space",
        `${space}px`
      );

      document.documentElement.style.setProperty(
        "--s18-header-offset",
        `${space}px`
      );
    });
  }

  /* -----------------------------------------------------------------------
     BOUCLE DE SYNCHRONISATION LÉGÈRE
     ----------------------------------------------------------------------- */
  let scheduled = false;

  function runAll(root = document) {
    installTables();
    fixGentleTier(root);
    cleanTutorial(root);
    cleanProfileButtons();
    syncMobileOffset();
  }

  function scheduleAll() {
    if (scheduled) return;
    scheduled = true;

    queueMicrotask(() => {
      scheduled = false;
      runAll(document);
    });
  }

  function install() {
    runAll(document);
    repairCharacterError();

    const observer = new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          if (!(node instanceof Element)) return;

          fixGentleTier(node);
          cleanTutorial(node);
        });
      });

      scheduleAll();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    const header = $(
      'header.top[data-mhur-header-version="513"], header.top'
    );

    /*
      Le ResizeObserver ne modifie que l'espace du contenu.
      Il ne change jamais height/min-height du header.
    */
    if (header && "ResizeObserver" in window) {
      new ResizeObserver(syncMobileOffset).observe(header);
    }

    addEventListener("resize", syncMobileOffset, {
      passive: true
    });

    addEventListener("orientationchange", syncMobileOffset, {
      passive: true
    });

    addEventListener("pageshow", syncMobileOffset, {
      passive: true
    });

    addEventListener("mhur-auth-change", scheduleAll);
    addEventListener("mhur-role-change", scheduleAll);
    addEventListener("mhur:languagechange", scheduleAll);

    /*
      Les scripts de compte sont nombreux. Quelques passages courts
      garantissent le dédoublonnage après leur initialisation, sans boucle
      permanente.
    */
    [60, 160, 350, 700, 1200, 2000].forEach(delay => {
      setTimeout(scheduleAll, delay);
    });

    window.MHUR_V545 = {
      syncMobileOffset,
      cleanProfileButtons,
      fixGentleTier,
      cleanTutorial
    };

    console.info(
      "[MHUR] V545 : interface finale synchronisée."
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, {
      once: true
    });
  } else {
    install();
  }
})();
