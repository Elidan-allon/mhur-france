/* MHUR NEXUS — V549
   Retire les anciennes flèches du tutoriel Mods.
*/
(() => {
  "use strict";

  function normalizedText(element) {
    return String(element.textContent || "")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  function looksLikeArrow(element) {
    if (!(element instanceof Element)) return false;

    const classes = String(element.className || "");
    const id = String(element.id || "");
    const aria = String(
      element.getAttribute("aria-label") || ""
    ).toLowerCase();
    const title = String(
      element.getAttribute("title") || ""
    ).toLowerCase();
    const text = normalizedText(element);

    if (
      /chevron|arrow|modshint|modsarrow/i.test(
        classes + " " + id
      )
    ) {
      return true;
    }

    if (
      /ouvrir|fermer|open|close|toggle|déplier|replier/.test(
        aria + " " + title
      ) &&
      element.children.length <= 1
    ) {
      return true;
    }

    if (
      [
        "v",
        "∨",
        "⌄",
        "˅",
        "↓",
        "↑",
        "⌃",
        "▲",
        "▼",
        "❯",
        "❮"
      ].includes(text)
    ) {
      return true;
    }

    /*
      Ancienne pastille ronde vide : petit bouton direct sous details,
      sans texte utile et sans contenu du tutoriel.
    */
    if (
      element.matches("button,span,div") &&
      element.children.length <= 1 &&
      text.length <= 1
    ) {
      const rect = element.getBoundingClientRect();

      if (
        rect.width > 0 &&
        rect.width <= 80 &&
        rect.height > 0 &&
        rect.height <= 80
      ) {
        return true;
      }
    }

    return false;
  }

  function cleanTutorial(details) {
    if (!(details instanceof Element)) return;

    const summary = details.querySelector(
      ":scope > summary"
    );

    if (!summary) return;

    /*
      Supprime les flèches ajoutées dans le summary.
      La nouvelle flèche est uniquement le pseudo-élément CSS.
    */
    const summaryCandidates = summary.querySelectorAll(
      '[class*="Chevron"],' +
      '[class*="chevron"],' +
      '[class*="Arrow"],' +
      '[class*="arrow"],' +
      ".s18ModsHintV10," +
      ".mhurModsArrow," +
      "[data-mods-arrow]"
    );

    for (
      let index = 0;
      index < summaryCandidates.length;
      index += 1
    ) {
      summaryCandidates[index].remove();
    }

    /*
      Traite uniquement les enfants directs de details.
      Le vrai contenu du tutoriel n'est jamais supprimé.
    */
    const children = Array.from(details.children);

    for (
      let index = 0;
      index < children.length;
      index += 1
    ) {
      const child = children[index];

      if (child === summary) continue;

      if (looksLikeArrow(child)) {
        child.setAttribute(
          "data-v549-old-arrow",
          "1"
        );
        child.remove();
      }
    }
  }

  function cleanAll(root = document) {
    const tutorials = root.querySelectorAll
      ? root.querySelectorAll(".modsTutorial")
      : [];

    for (
      let index = 0;
      index < tutorials.length;
      index += 1
    ) {
      cleanTutorial(tutorials[index]);
    }

    if (
      root instanceof Element &&
      root.matches(".modsTutorial")
    ) {
      cleanTutorial(root);
    }
  }

  function install() {
    cleanAll(document);

    const app =
      document.getElementById("app") ||
      document.body;

    const observer = new MutationObserver(
      records => {
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
              node.matches(".modsTutorial") ||
              node.querySelector(".modsTutorial")
            ) {
              cleanAll(node);
            }
          }
        }
      }
    );

    observer.observe(app, {
      childList: true,
      subtree: true
    });

    [50, 180, 500, 1100].forEach(delay => {
      setTimeout(() => cleanAll(document), delay);
    });

    window.MHUR_V549 = {
      cleanTutorial,
      cleanAll
    };

    console.info(
      "[MHUR] V549 : une seule flèche dans le tutoriel Mods."
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
