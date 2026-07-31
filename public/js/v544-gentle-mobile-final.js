/* ==========================================================================
   MHUR NEXUS — V544
   Dernier correctif chargé : tableaux robustes, Gentle unique et tutoriel.
   ========================================================================== */
(() => {
  "use strict";

  const GENTLE_PORTRAIT =
    "/assets/gentle_criminal/gentle_criminal_technical/portrait.webp?v=544";

  function language() {
    try {
      if (typeof lang !== "undefined" && lang === "en") return "en";
    } catch (_) {}
    return document.documentElement.lang === "en" ? "en" : "fr";
  }

  function localized(value) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const current = language();
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

    if (Array.isArray(selected)) {
      return selected.join(" / ");
    }

    return selected ?? "";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]
    );
  }

  function normalized(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function levelUpTitle(value) {
    const title = normalized(localized(value));

    return (
      /effets? de montee/.test(title) ||
      /level up effects?/.test(title)
    );
  }

  /*
    Accepte :
    - cols/rows sous forme de tableaux ;
    - cols/rows sous forme {fr:[], en:[]};
    - cellules localisées ;
    - données absentes ou mal formées.
  */
  function robustTables(tableList) {
    const source = arrayValue(tableList);

    const ordered = source
      .map((table, index) => ({
        table: table && typeof table === "object" ? table : {},
        index,
        priority: levelUpTitle(table?.title) ? 0 : 1
      }))
      .sort(
        (first, second) =>
          first.priority - second.priority ||
          first.index - second.index
      );

    return `<div class="tables">${ordered.map(entry => {
      const table = entry.table;
      const title = localized(table.title);
      const columns = arrayValue(table.cols);
      const rows = arrayValue(table.rows);

      return (
        `<button class="toggle" ` +
        `onclick="this.nextElementSibling.classList.toggle('hidden')">` +
        `${escapeHtml(title)} ▾</button>` +
        `<div class="simpleTable hidden">` +
        `<table class="dataTable">` +
        `<thead><tr>${columns.map(column =>
          `<th>${escapeHtml(cellValue(column))}</th>`
        ).join("")}</tr></thead>` +
        `<tbody>${rows.map(row => {
          const cells = arrayValue(row);

          return `<tr>${cells.map(cell =>
            `<td>${escapeHtml(cellValue(cell))}</td>`
          ).join("")}</tr>`;
        }).join("")}</tbody>` +
        `</table></div>`
      );
    }).join("")}</div>`;
  }

  function installTables() {
    try {
      window.tables = robustTables;
      tables = robustTables;
    } catch (_) {
      window.tables = robustTables;
    }
  }

  function cleanTutorial(root = document) {
    root.querySelectorAll?.(".modsTutorial").forEach(details => {
      const summary = details.querySelector(":scope > summary");
      if (!summary) return;

      const isEnglish = language() === "en";

      summary.className = "modsTutorialSummaryV544";
      summary.innerHTML =
        '<span class="modsTutorialBookV544" aria-hidden="true"></span>' +
        '<span class="modsTutorialTitleV544">' +
        (isEnglish
          ? "Install mods - PC Steam only"
          : "Installer des mods - PC Steam uniquement") +
        "</span>" +
        '<span class="modsTutorialHintV544">' +
        (isEnglish
          ? "Click here to open the tutorial"
          : "Clique ici pour ouvrir le tutoriel") +
        "</span>" +
        '<span class="modsTutorialChevronV544" aria-hidden="true"></span>';

      /*
        Certains anciens correctifs ont créé une vraie deuxième pastille
        en enfant direct de <details>. On retire uniquement ces orphelins.
      */
      [...details.children].forEach(child => {
        if (child === summary) return;

        const text = String(child.textContent || "").trim().toLowerCase();
        const classes = String(child.className || "");

        const oldArrow =
          /modsTutorialChevron|s18ModsHint/.test(classes) ||
          ["v", "⌄", "⌃", "˅", "∨"].includes(text);

        if (
          oldArrow &&
          !child.matches(
            ".modsTutorialSteps,.modsTutorialContent,.modsTutorialBody"
          )
        ) {
          child.remove();
        }
      });
    });
  }

  function styleName(style, fallback) {
    const value = localized(style?.name);
    return String(value || fallback || "");
  }

  function characterName(character, fallback) {
    const value = localized(character?.name);
    return String(value || fallback || "");
  }

  function portraitKey(value) {
    return String(value || "")
      .split("?")[0]
      .replace(/^\/+/, "")
      .toLowerCase();
  }

  function isGentle(id, style, character) {
    const text = normalized(
      [
        id,
        styleName(style, ""),
        style?.portrait,
        characterName(character, "")
      ].join(" ")
    );

    return (
      text.includes("gentle criminal") ||
      text.includes("gentle_criminal")
    );
  }

  function canonicalKey(id, style, character) {
    if (isGentle(id, style, character)) {
      return "gentle-criminal-technical";
    }

    return [
      normalized(characterName(character, "")),
      normalized(styleName(style, id)),
      normalized(style?.role || ""),
      portraitKey(style?.portrait)
    ].join("|");
  }

  function safeStyleRole(role) {
    const value = String(role || "").toLowerCase();

    const map = {
      attack: "strike",
      rapid: "speed",
      vitesse: "speed",
      technique: "technical",
      assaut: "assault",
      soutien: "support"
    };

    return map[value] || value || "unknown";
  }

  function installTierRender() {
    const tier = window.MHUR_HUB?.tier;

    if (!tier || tier.render?.__mhurV544) return Boolean(tier);

    const render = function () {
      const output = document.getElementById("mhurTierList");
      if (!output) return;

      let sourceCharacters = [];
      let sourceStyles = {};

      try {
        sourceCharacters =
          typeof characters !== "undefined" &&
          Array.isArray(characters)
            ? characters
            : [];
      } catch (_) {}

      try {
        sourceStyles =
          typeof styles !== "undefined" &&
          styles &&
          typeof styles === "object"
            ? styles
            : {};
      } catch (_) {}

      const selectedRole =
        document.getElementById("mhurTierRole")?.value || "";

      const items = [];
      const seenIds = new Set();
      const seenCanonical = new Set();

      const addItem = (id, character) => {
        const style = sourceStyles[id];

        if (!style || seenIds.has(String(id))) return;

        const role = safeStyleRole(style.role);
        if (selectedRole && role !== selectedRole) return;

        const canonical = canonicalKey(id, style, character);
        if (seenCanonical.has(canonical)) return;

        seenIds.add(String(id));
        seenCanonical.add(canonical);

        const gentle = isGentle(id, style, character);
        const cleanStyle = {
          ...style,
          role,
          portrait: gentle
            ? GENTLE_PORTRAIT
            : style.portrait
        };

        items.push({
          id: String(id),
          character,
          style: cleanStyle,
          tier: this.ownVotes?.[id] || "U",
          gentle
        });
      };

      /*
        Priorité aux styles réellement reliés à un personnage.
        Les styles orphelins sont ajoutés ensuite seulement s'ils ne sont
        pas déjà représentés par la même identité canonique.
      */
      sourceCharacters.forEach(character => {
        arrayValue(character?.styles).forEach(id =>
          addItem(String(id), character)
        );
      });

      const owners = [...sourceCharacters].sort(
        (first, second) =>
          String(second?.id || "").length -
          String(first?.id || "").length
      );

      Object.keys(sourceStyles).forEach(id => {
        if (seenIds.has(String(id))) return;

        const owner = owners.find(character => {
          const characterId = String(character?.id || "");

          return (
            id === characterId ||
            id.startsWith(`${characterId}_`)
          );
        });

        addItem(
          id,
          owner || {
            id: `style-${id}`,
            name: styleName(sourceStyles[id], id),
            portrait: sourceStyles[id]?.portrait || "",
            styles: [id]
          }
        );
      });

      const translated = (fr, en) => {
        try {
          if (typeof lang !== "undefined" && lang === "en") return en;
        } catch (_) {}
        return fr;
      };

      const row = letter => {
        const content = items
          .filter(item => item.tier === letter)
          .map(item => {
            const character = item.character || {};
            const style = item.style || {};
            const name = characterName(
              character,
              styleName(style, item.id)
            );
            const styleLabel = styleName(style, item.id);

            return (
              `<div class="mhurTierItem ` +
              `mhurTierRole-${escapeHtml(style.role)}" ` +
              `${item.gentle ? 'data-v544-gentle="1"' : ""} ` +
              `draggable="true" ` +
              `ondragstart="MHUR_HUB.tier.dragStart(event,'${escapeHtml(item.id)}')" ` +
              `ondragend="MHUR_HUB.tier.dragEnd(event)">` +
              `<img src="${escapeHtml(style.portrait || character.portrait || "")}" ` +
              `alt="${escapeHtml(name)}">` +
              `<small>${escapeHtml(name)}</small>` +
              `<span class="mhurTierStyleName">${escapeHtml(styleLabel)}</span>` +
              `</div>`
            );
          })
          .join("");

        return (
          `<div class="mhurTierRow ${letter === "U" ? "unranked" : ""}">` +
          `<div class="mhurTierLabel ${letter}">` +
          `${letter === "U" ? translated("Non classés", "Unranked") : letter}` +
          `</div>` +
          `<div class="mhurTierItems" ` +
          `ondragover="MHUR_HUB.tier.dragOver(event)" ` +
          `ondragleave="MHUR_HUB.tier.dragLeave(event)" ` +
          `ondrop="MHUR_HUB.tier.drop(event,'${letter}')">` +
          `${content}` +
          `<div class="mhurTierDropHint">${translated("Dépose ici", "Drop here")}</div>` +
          `</div></div>`
        );
      };

      output.innerHTML =
        `<div class="mhurTierDragHelp">` +
        `${translated(
          "Les déplacements sont enregistrés uniquement dans ton navigateur. Publie ta Tier List lorsque tu veux la partager.",
          "Changes are saved only in your browser. Publish your Tier List when you want to share it."
        )}</div>` +
        ["S", "A", "B", "C", "D", "U"].map(row).join("");
    };

    render.__mhurV544 = true;
    tier.render = render;

    if (document.getElementById("mhurTierList")) {
      tier.render();
    }

    return true;
  }

  function repairCurrentCharacterPage() {
    const app = document.getElementById("app");
    if (!app) return;

    const text = String(app.textContent || "");

    if (
      /table\.cols|cols\s*\|\|\s*\[\]/i.test(text) &&
      /erreur d.affichage|display error/i.test(text)
    ) {
      try {
        window.__keepScroll = true;
        window.render?.();
      } catch (error) {
        console.error("[MHUR V544] nouveau rendu Gentle", error);
      }
    }
  }

  function run(root = document) {
    installTables();
    cleanTutorial(root);
    installTierRender();
  }

  function install() {
    run(document);
    repairCurrentCharacterPage();

    let attempts = 0;
    const retry = setInterval(() => {
      attempts += 1;
      run(document);

      if (
        attempts >= 20 ||
        (
          window.MHUR_HUB?.tier?.render?.__mhurV544 &&
          document.querySelector(".modsTutorial")
        )
      ) {
        clearInterval(retry);
      }
    }, 150);

    const observer = new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          if (node instanceof Element) {
            cleanTutorial(node);
          }
        });
      });

      installTables();
      installTierRender();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener("mhur:languagechange", () => {
      cleanTutorial(document);
      window.MHUR_HUB?.tier?.render?.();
    });

    console.info(
      "[MHUR] V544 : Gentle, Tier List, Mods et mobile corrigés."
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
