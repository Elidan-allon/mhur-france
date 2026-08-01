/* ==========================================================================
   MHUR NEXUS — V554
   Affiche NEW uniquement sur les sorties disponibles.
   ========================================================================== */
(() => {
  "use strict";

  /*
    Dates officielles connues pour les cartes Saison 18 actuellement créées
    dans season18-early.js.

    Tsuyu n'a pas encore de date exacte : elle reste donc sans badge NEW.
  */
  const RELEASES = {
    gentle: Date.parse("2026-07-29T07:00:00+03:00"),
    twice: Date.parse("2026-08-19T07:00:00+03:00"),
    tsuyu: null
  };

  function normalized(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function plannedKey(card) {
    return String(card.dataset.planned || "")
      .toLowerCase()
      .trim();
  }

  function isExplicitlyAvailable(card) {
    if (
      card.classList.contains("is-clickable") &&
      !card.classList.contains("is-disabled") &&
      card.getAttribute("aria-disabled") !== "true"
    ) {
      return true;
    }

    const text = normalized(card.textContent);

    return (
      text.includes("disponible depuis") ||
      text.includes("available since") ||
      text.includes("maintenant disponible") ||
      text.includes("available now")
    );
  }

  function isReleased(card) {
    const key = plannedKey(card);

    /*
      Pour les cartes Saison 18 officielles :
      - une carte explicitement activée est disponible ;
      - sinon, une date passée peut activer automatiquement le badge ;
      - une carte sans date exacte reste masquée.
    */
    if (isExplicitlyAvailable(card)) {
      return true;
    }

    if (key && Object.prototype.hasOwnProperty.call(RELEASES, key)) {
      const releaseTime = RELEASES[key];

      return (
        Number.isFinite(releaseTime) &&
        Date.now() >= releaseTime
      );
    }

    /*
      Sécurité pour l'ancien rendu de secours.
      On ne montre jamais NEW si le texte indique une sortie future.
    */
    const text = normalized(card.textContent);

    if (
      text.includes("prévu") ||
      text.includes("planned") ||
      text.includes("sortie le") ||
      text.includes("releases ")
    ) {
      return false;
    }

    return isExplicitlyAvailable(card);
  }

  function applyCard(card) {
    if (!(card instanceof Element)) {
      return;
    }

    const released = isReleased(card);

    if (released) {
      card.dataset.v554Released = "1";
    } else {
      delete card.dataset.v554Released;
    }

    const badges = card.querySelectorAll(
      ".s18PlannedNewV12," +
      ".s18SeasonNewV10"
    );

    for (
      let index = 0;
      index < badges.length;
      index += 1
    ) {
      const badge = badges[index];

      badge.setAttribute(
        "aria-hidden",
        released ? "false" : "true"
      );
    }
  }

  function applyAll(root = document) {
    if (!root.querySelectorAll) {
      return;
    }

    const cards = root.querySelectorAll(
      ".releaseGridV296 .s18PlannedCardV12," +
      ".releaseGridV296 .s18SeasonReleaseV10"
    );

    for (
      let index = 0;
      index < cards.length;
      index += 1
    ) {
      applyCard(cards[index]);
    }

    if (
      root instanceof Element &&
      root.matches(
        ".releaseGridV296 .s18PlannedCardV12," +
        ".releaseGridV296 .s18SeasonReleaseV10"
      )
    ) {
      applyCard(root);
    }
  }

  function install() {
    applyAll(document);

    const app =
      document.getElementById("app") ||
      document.body;

    const observer = new MutationObserver(
      records => {
        let mustApply = false;

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
              node.matches(
                ".releaseGridV296," +
                ".s18PlannedCardV12," +
                ".s18SeasonReleaseV10"
              ) ||
              node.querySelector(
                ".releaseGridV296," +
                ".s18PlannedCardV12," +
                ".s18SeasonReleaseV10"
              )
            ) {
              mustApply = true;
            }
          }
        }

        if (mustApply) {
          requestAnimationFrame(
            () => applyAll(document)
          );
        }
      }
    );

    observer.observe(app, {
      childList: true,
      subtree: true
    });

    /*
      Revérification périodique légère :
      le badge Twice pourra apparaître automatiquement à sa date de sortie.
    */
    window.setInterval(
      () => applyAll(document),
      60 * 1000
    );

    window.addEventListener(
      "mhur:languagechange",
      () => requestAnimationFrame(
        () => applyAll(document)
      )
    );

    const delays = [40, 150, 400, 900, 1800];

    for (
      let index = 0;
      index < delays.length;
      index += 1
    ) {
      window.setTimeout(
        () => applyAll(document),
        delays[index]
      );
    }

    window.MHUR_V554 = {
      applyAll,
      applyCard,
      isReleased
    };

    console.info(
      "[MHUR] V554 : NEW animé uniquement sur les sorties disponibles."
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
