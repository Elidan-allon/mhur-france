/* ==========================================================================
   MHUR NEXUS — V547
   Dédoublonnage stable du profil et hauteur automatique des cartes.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

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
      text.includes("moderation center") ||
      text.includes("admin moderation")
    );
  }

  function choosePreferred(buttons, preferredPatterns) {
    let preferred = [];

    for (let index = 0; index < buttons.length; index += 1) {
      const classes = String(buttons[index].className || "");

      for (
        let patternIndex = 0;
        patternIndex < preferredPatterns.length;
        patternIndex += 1
      ) {
        if (preferredPatterns[patternIndex].test(classes)) {
          preferred.push(buttons[index]);
          break;
        }
      }
    }

    if (preferred.length) {
      return preferred[preferred.length - 1];
    }

    return buttons.length
      ? buttons[buttons.length - 1]
      : null;
  }

  function markGroup(buttons, keep, type) {
    for (let index = 0; index < buttons.length; index += 1) {
      const button = buttons[index];

      button.removeAttribute("data-v547-profile-duplicate");
      button.removeAttribute("data-v547-profile-keep");
      button.removeAttribute("aria-hidden");
      button.removeAttribute("tabindex");

      if (button === keep) {
        button.setAttribute("data-v547-profile-keep", type);
        button.hidden = false;
        continue;
      }

      button.setAttribute("data-v547-profile-duplicate", "1");
      button.setAttribute("aria-hidden", "true");
      button.setAttribute("tabindex", "-1");
    }
  }

  let cleaningProfile = false;

  function cleanProfile() {
    if (cleaningProfile) return;

    const card = $(
      "#mhurAuthOverlay .mhurProfileCard," +
      "#mhurAuthOverlay [class*='ProfileCard']"
    );

    if (!card) return;

    cleaningProfile = true;

    try {
      const buttons = $$("button", card);
      const feedback = [];
      const moderation = [];

      for (let index = 0; index < buttons.length; index += 1) {
        const button = buttons[index];

        if (isFeedbackButton(button)) {
          feedback.push(button);
        }

        if (isModerationButton(button)) {
          moderation.push(button);
        }
      }

      const keepFeedback = choosePreferred(
        feedback,
        [
          /mhurV543FeedbackProfileButton/i,
          /mhurV539FeedbackProfileButton/i,
          /mhurV547FeedbackButton/i
        ]
      );

      const keepModeration = choosePreferred(
        moderation,
        [
          /mhurV543AdminProfileButton/i,
          /mhurV539AdminProfileButton/i,
          /s18ProfileAdminButtonV10/i,
          /mhurV547ModerationButton/i
        ]
      );

      markGroup(feedback, keepFeedback, "feedback");
      markGroup(moderation, keepModeration, "moderation");
    } finally {
      cleaningProfile = false;
    }
  }

  let profileScheduled = false;

  function scheduleProfileClean() {
    if (profileScheduled) return;
    profileScheduled = true;

    requestAnimationFrame(() => {
      profileScheduled = false;
      cleanProfile();
    });
  }

  function fixRoleCards(root = document) {
    const cards = $$(".card[data-char]", root);

    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index];
      const body = $(".cardBody", card);

      card.style.setProperty("height", "auto", "important");
      card.style.setProperty("min-height", "0", "important");
      card.style.setProperty("max-height", "none", "important");

      if (body) {
        body.style.setProperty("height", "auto", "important");
        body.style.setProperty("min-height", "0", "important");
        body.style.setProperty("max-height", "none", "important");
        body.style.setProperty("overflow", "visible", "important");
      }
    }
  }

  function fixPatchNotes(root = document) {
    const cards = $$(".s18PatchCharacterV10", root);

    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index];
      const header = $(":scope > header", card);
      const changes = $(".s18PatchChangesV10", card);

      if (header) {
        header.style.setProperty("height", "auto", "important");
        header.style.setProperty("max-height", "none", "important");
      }

      if (changes) {
        changes.style.setProperty("height", "auto", "important");
        changes.style.setProperty("max-height", "none", "important");
        changes.style.setProperty("margin-top", "0", "important");
      }
    }
  }

  function runVisibleFixes(root = document) {
    fixRoleCards(root);
    fixPatchNotes(root);
    scheduleProfileClean();
  }

  function install() {
    runVisibleFixes(document);

    const authOverlay = document.getElementById("mhurAuthOverlay");

    if (authOverlay) {
      const authObserver = new MutationObserver(() => {
        scheduleProfileClean();
      });

      authObserver.observe(authOverlay, {
        childList: true,
        subtree: true
      });
    }

    const app = document.getElementById("app");

    if (app) {
      const appObserver = new MutationObserver(records => {
        let mustFixCards = false;
        let mustFixNotes = false;

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

            if (!(node instanceof Element)) continue;

            if (
              node.matches(".card[data-char],.cardsGrid") ||
              node.querySelector(".card[data-char]")
            ) {
              mustFixCards = true;
            }

            if (
              node.matches(".s18PatchCharacterV10") ||
              node.querySelector(".s18PatchCharacterV10")
            ) {
              mustFixNotes = true;
            }
          }
        }

        if (mustFixCards) fixRoleCards(app);
        if (mustFixNotes) fixPatchNotes(document);
      });

      appObserver.observe(app, {
        childList: true,
        subtree: true
      });
    }

    document.addEventListener(
      "click",
      event => {
        if (
          event.target.closest(
            "#mhurAccountButton,.mhurAccountButton"
          )
        ) {
          const delays = [0, 40, 120, 300, 700, 1300];

          for (
            let index = 0;
            index < delays.length;
            index += 1
          ) {
            setTimeout(scheduleProfileClean, delays[index]);
          }
        }

        if (
          event.target.closest(
            "#mhurPatchDevButtonV14,.mhurPatchDevButtonV14," +
            "[data-s18-notes-button]"
          )
        ) {
          const delays = [0, 40, 120, 300];

          for (
            let index = 0;
            index < delays.length;
            index += 1
          ) {
            setTimeout(() => fixPatchNotes(document), delays[index]);
          }
        }
      },
      true
    );

    window.addEventListener(
      "mhur-auth-change",
      scheduleProfileClean
    );

    window.addEventListener(
      "mhur-role-change",
      scheduleProfileClean
    );

    window.addEventListener(
      "mhur:languagechange",
      scheduleProfileClean
    );

    const startupDelays = [60, 180, 450, 900, 1600];

    for (
      let index = 0;
      index < startupDelays.length;
      index += 1
    ) {
      setTimeout(
        () => runVisibleFixes(document),
        startupDelays[index]
      );
    }

    window.MHUR_V547 = {
      cleanProfile,
      fixRoleCards,
      fixPatchNotes
    };

    console.info(
      "[MHUR] V547 : profil, mobile, rôles et Patch Notes corrigés."
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
