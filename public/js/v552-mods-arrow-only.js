/* MHUR NEXUS — V552
   Garde une seule flèche dans le tutoriel Mods.
*/
(() => {
  "use strict";

  const LEGACY_SELECTOR = [
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

  function fixTutorial(details) {
    if (!(details instanceof Element)) return;

    const summary = details.querySelector(":scope > summary");
    if (!summary) return;

    const oldArrows = details.querySelectorAll(LEGACY_SELECTOR);

    for (
      let index = 0;
      index < oldArrows.length;
      index += 1
    ) {
      oldArrows[index].remove();
    }

    const existing = summary.querySelectorAll(
      ".modsTutorialChevronV552"
    );

    for (
      let index = 1;
      index < existing.length;
      index += 1
    ) {
      existing[index].remove();
    }

    if (!existing.length) {
      const arrow = document.createElement("span");
      arrow.className = "modsTutorialChevronV552";
      arrow.setAttribute("aria-hidden", "true");
      summary.appendChild(arrow);
    }
  }

  function fixAll(root = document) {
    if (!root.querySelectorAll) return;

    const tutorials = root.querySelectorAll(".modsTutorial");

    for (
      let index = 0;
      index < tutorials.length;
      index += 1
    ) {
      fixTutorial(tutorials[index]);
    }

    if (
      root instanceof Element &&
      root.matches(".modsTutorial")
    ) {
      fixTutorial(root);
    }
  }

  function install() {
    fixAll(document);

    const observer = new MutationObserver(records => {
      let mustFix = false;

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
            mustFix = true;
          }
        }
      }

      if (mustFix) {
        fixAll(document);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    const delays = [50, 180, 500, 1000];

    for (
      let index = 0;
      index < delays.length;
      index += 1
    ) {
      setTimeout(() => fixAll(document), delays[index]);
    }

    window.MHUR_V552 = {
      fixTutorial,
      fixAll
    };

    console.info(
      "[MHUR] V552 : flèche unique du tutoriel Mods."
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
