/* ==========================================================================
   MHUR NEXUS — V555
   Ajoute et normalise les badges NEW de Gentle Criminal.
   ========================================================================== */
(() => {
  "use strict";

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function isGentleText(value) {
    const text = normalize(value);

    return (
      text.includes("gentle criminal") ||
      text.includes("gentle_criminal")
    );
  }

  function isNewElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    if (
      element.classList.contains("mhurCharacterNewV555") ||
      element.classList.contains("mhurCostumeNewV555")
    ) {
      return false;
    }

    const text = normalize(element.textContent);
    const alt = normalize(element.getAttribute("alt"));
    const title = normalize(element.getAttribute("title"));
    const aria = normalize(element.getAttribute("aria-label"));
    const classes = normalize(element.className);

    const directLabel = [text, alt, title, aria].some(value =>
      value === "new" ||
      value === "new!"
    );

    const classLabel =
      classes.includes("new badge") ||
      classes.includes("badge new") ||
      classes.endsWith(" new") ||
      classes.startsWith("new ");

    return directLabel || classLabel;
  }

  function createBadge(className) {
    const badge = document.createElement("span");

    badge.className = className;
    badge.textContent = "NEW!";
    badge.setAttribute("aria-label", "Nouveau");
    badge.setAttribute("aria-hidden", "true");

    return badge;
  }

  /* ------------------------------------------------------------------------
     Carte du menu Personnages
     ------------------------------------------------------------------------ */
  function findGentleCharacterCards(root = document) {
    if (!root.querySelectorAll) {
      return [];
    }

    return Array.from(
      root.querySelectorAll(
        ".cardsGrid .card.characterMode," +
        ".pageFrame.charactersFrame .card.characterMode"
      )
    ).filter(card => {
      const id = normalize(card.dataset.char);
      const title = normalize(
        card.querySelector("h3")?.textContent
      );

      return (
        id === "gentle criminal" ||
        id === "gentle_criminal" ||
        title === "gentle criminal"
      );
    });
  }

  function applyCharacterBadge(card) {
    if (!(card instanceof Element)) {
      return;
    }

    card.dataset.v555GentleNew = "1";

    const badges = card.querySelectorAll(
      ".mhurCharacterNewV555"
    );

    for (
      let index = 1;
      index < badges.length;
      index += 1
    ) {
      badges[index].remove();
    }

    if (!badges.length) {
      card.appendChild(
        createBadge("mhurCharacterNewV555")
      );
    }
  }

  /* ------------------------------------------------------------------------
     Cartes costumes Gentle Criminal
     ------------------------------------------------------------------------ */
  function selectedCharacterIsGentle() {
    try {
      if (
        typeof selectedChar !== "undefined" &&
        isGentleText(selectedChar)
      ) {
        return true;
      }
    } catch (_) {}

    return isGentleText(window.selectedChar);
  }

  function groupContainsGentleImages(group) {
    const images = group.querySelectorAll(
      ".costumeTile img[src]"
    );

    for (
      let index = 0;
      index < images.length;
      index += 1
    ) {
      const src = normalize(
        images[index].getAttribute("src")
      );

      if (
        src.includes("gentle criminal") ||
        src.includes("gentle_criminal")
      ) {
        return true;
      }
    }

    return false;
  }

  function isRequestedCostumeGroup(group) {
    if (!(group instanceof Element)) {
      return false;
    }

    const title = normalize(
      group.querySelector(
        ".costumeGalleryHead," +
        ".costumeHead," +
        "h2," +
        "h3"
      )?.textContent
    );

    const requestedTitle =
      title.includes("tenue de super vilain") ||
      title.includes("super villain outfit");

    if (!requestedTitle) {
      return false;
    }

    return (
      selectedCharacterIsGentle() ||
      groupContainsGentleImages(group)
    );
  }

  function removeOldNewBadges(tile) {
    const elements = Array.from(
      tile.querySelectorAll("*")
    );

    for (
      let index = 0;
      index < elements.length;
      index += 1
    ) {
      const element = elements[index];

      if (!isNewElement(element)) {
        continue;
      }

      /*
        L'ancien badge peut être un span, div ou img.
        Il est marqué puis supprimé pour empêcher un doublon visuel.
      */
      element.dataset.v555OldNew = "1";
      element.remove();
    }
  }

  function applyCostumeBadge(tile) {
    if (!(tile instanceof Element)) {
      return;
    }

    tile.dataset.v555GentleCostume = "1";

    removeOldNewBadges(tile);

    const current = tile.querySelectorAll(
      ".mhurCostumeNewV555"
    );

    for (
      let index = 1;
      index < current.length;
      index += 1
    ) {
      current[index].remove();
    }

    if (!current.length) {
      tile.appendChild(
        createBadge("mhurCostumeNewV555")
      );
    }
  }

  function applyCostumeGroups(root = document) {
    if (!root.querySelectorAll) {
      return;
    }

    const groups = root.querySelectorAll(
      ".costumeGalleryGroup"
    );

    for (
      let groupIndex = 0;
      groupIndex < groups.length;
      groupIndex += 1
    ) {
      const group = groups[groupIndex];

      if (!isRequestedCostumeGroup(group)) {
        continue;
      }

      const tiles = group.querySelectorAll(
        ".costumeTile"
      );

      for (
        let tileIndex = 0;
        tileIndex < tiles.length;
        tileIndex += 1
      ) {
        /*
          Cela inclut Original, Vers. Héros, Combat et Dangereux.
        */
        applyCostumeBadge(tiles[tileIndex]);
      }
    }
  }

  function applyAll(root = document) {
    const characterCards =
      findGentleCharacterCards(root);

    for (
      let index = 0;
      index < characterCards.length;
      index += 1
    ) {
      applyCharacterBadge(
        characterCards[index]
      );
    }

    applyCostumeGroups(root);
  }

  function install() {
    applyAll(document);

    const app =
      document.getElementById("app") ||
      document.body;

    const observer = new MutationObserver(
      records => {
        let relevant = false;

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
            const node =
              record.addedNodes[nodeIndex];

            if (!(node instanceof Element)) {
              continue;
            }

            if (
              node.matches(
                ".card.characterMode," +
                ".costumeGalleryGroup," +
                ".costumeTile"
              ) ||
              node.querySelector(
                ".card.characterMode," +
                ".costumeGalleryGroup," +
                ".costumeTile"
              )
            ) {
              relevant = true;
            }
          }
        }

        if (relevant) {
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

    window.addEventListener(
      "mhur:languagechange",
      () => requestAnimationFrame(
        () => applyAll(document)
      )
    );

    const delays = [
      40,
      140,
      350,
      750,
      1400
    ];

    for (
      let index = 0;
      index < delays.length;
      index += 1
    ) {
      setTimeout(
        () => applyAll(document),
        delays[index]
      );
    }

    window.MHUR_V555 = {
      applyAll,
      applyCharacterBadge,
      applyCostumeGroups
    };

    console.info(
      "[MHUR] V555 : NEW Gentle ajouté au menu et aux costumes."
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
