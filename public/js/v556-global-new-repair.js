/* ==========================================================================
   MHUR NEXUS — V556
   Réparation ciblée des données et de l'interface.
   ========================================================================== */
(() => {
  "use strict";

  const NEW_SELECTOR = [
    ".s18NewBadge",
    ".s18NewBadgeV9",
    ".mhurCharacterNewV555",
    ".mhurCostumeNewV555",
    ".mhurCharacterNewV554",
    ".mhurCostumeNewV554",
    ".mhurNewV556"
  ].join(",");

  const OLD_ARROW_SELECTOR = [
    ".modsTutorialChevronV537",
    ".modsTutorialChevronV540",
    ".modsTutorialChevronV544",
    ".modsTutorialChevronV545",
    ".modsTutorialChevronV546",
    ".modsTutorialChevronV549",
    ".modsTutorialChevronV552",
    ".mhurModsArrow",
    "[data-mods-arrow]",
    "[data-v549-old-arrow='1']"
  ].join(",");

  const ROLE_BY_DISCOUNT = {
    dj_board: "technical",
    flow_runner: "strike",
    gentle_criminal: "technical",
    factor_fusion: "strike",
    cluster: "technical",
    mirko: "speed"
  };

  const ROLE_TEXT = {
    fr: {
      assault: "ASSAUT",
      strike: "ATTAQUE",
      speed: "VITESSE",
      technical: "TECHNIQUE",
      support: "SOUTIEN"
    },
    en: {
      assault: "ASSAULT",
      strike: "STRIKE",
      speed: "RAPID",
      technical: "TECHNICAL",
      support: "SUPPORT"
    }
  };

  const UI_TRANSLATIONS = new Map([
    ["Installer des mods - PC Steam uniquement", "Install mods - PC Steam only"],
    ["Installer des mods — PC Steam uniquement", "Install mods — PC Steam only"],
    ["Clique ici pour ouvrir le tutoriel", "Click here to open the tutorial"],
    ["Ouvrir le tutoriel", "Open tutorial"],
    ["Rechercher par nom, auteur, personnage...", "Search by name, author, character..."],
    ["Rechercher par nom, auteur, personnage…", "Search by name, author, character…"],
    ["Toutes les catégories", "All categories"],
    ["Tous les personnages", "All characters"],
    ["Plus récents", "Most recent"],
    ["Les plus récents", "Most recent"],
    ["Modifier", "Edit"],
    ["Supprimer", "Delete"],
    ["Empreinte SHA-256", "SHA-256 fingerprint"],
    ["Réductions de points personnage", "Character point discounts"],
    ["Clique pour choisir le style.", "Click to choose a style."],
    ["Personnages — HÉROS", "Characters — HEROES"],
    ["Personnages — SUPER-VILAINS", "Characters — SUPER-VILLAINS"],
    ["Costumes — HÉROS", "Costumes — HEROES"],
    ["Costumes — SUPER-VILAINS", "Costumes — SUPER-VILLAINS"],
    ["T.U.N.I.N.G — HÉROS", "T.U.N.I.N.G — HEROES"],
    ["T.U.N.I.N.G — SUPER-VILAINS", "T.U.N.I.N.G — SUPER-VILLAINS"],
    ["Builds communauté — HÉROS", "Community builds — HEROES"],
    ["Builds communauté — SUPER-VILAINS", "Community builds — SUPER-VILLAINS"],
    ["HÉROS", "HEROES"],
    ["SUPER-VILAINS", "SUPER-VILLAINS"],
    ["Assaut", "Assault"],
    ["Attaque", "Strike"],
    ["Vitesse", "Rapid"],
    ["Technique", "Technical"],
    ["Soutien", "Support"],
    ["ASSAUT", "ASSAULT"],
    ["ATTAQUE", "STRIKE"],
    ["VITESSE", "RAPID"],
    ["TECHNIQUE", "TECHNICAL"],
    ["SOUTIEN", "SUPPORT"],
    ["Notes de patch / Notes des développeurs", "Patch Notes / Dev Notes"]
  ]);

  const REVERSE_TRANSLATIONS = new Map(
    Array.from(UI_TRANSLATIONS.entries()).map(
      ([fr, en]) => [en, fr]
    )
  );

  function currentLang() {
    try {
      if (
        typeof lang !== "undefined" &&
        lang === "en"
      ) {
        return "en";
      }
    } catch (_) {}

    const stored =
      localStorage.getItem("mhur_lang") ||
      localStorage.getItem("lang") ||
      "";

    return (
      stored === "en" ||
      document.documentElement.lang === "en"
    )
      ? "en"
      : "fr";
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
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

  function absoluteAsset(source) {
    const value = String(source || "");

    if (
      !value ||
      /^(?:https?:|data:|blob:|\/)/i.test(value)
    ) {
      return value;
    }

    return "/" + value.replace(
      /^(?:\.{1,2}\/)+/,
      ""
    );
  }

  function isGentle(value) {
    const key = normalize(value);

    return (
      key.includes("gentle_criminal") ||
      key === "gentle"
    );
  }

  function elementIsGentle(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const values = [
      element.dataset.char,
      element.dataset.style,
      element.dataset.character,
      element.dataset.characterId,
      element.dataset.name,
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      element.textContent
    ];

    const images = element.querySelectorAll("img");

    for (
      let index = 0;
      index < images.length;
      index += 1
    ) {
      values.push(
        images[index].getAttribute("src"),
        images[index].getAttribute("alt")
      );
    }

    return values.some(isGentle);
  }

  function selectedCharacterIsGentle() {
    const values = [];

    try {
      if (typeof selectedChar !== "undefined") {
        values.push(selectedChar);
      }
    } catch (_) {}

    values.push(
      window.selectedChar,
      document.body.dataset.selectedChar
    );

    return values.some(isGentle);
  }

  function makeNewBadge() {
    const badge = document.createElement("span");

    badge.className = "mhurNewV556";
    badge.textContent = "NEW!";
    badge.setAttribute("aria-label", "NEW");
    badge.setAttribute("aria-hidden", "true");

    return badge;
  }

  function removeNewBadges(container) {
    if (!(container instanceof Element)) {
      return;
    }

    const badges = container.querySelectorAll(
      NEW_SELECTOR
    );

    for (
      let index = 0;
      index < badges.length;
      index += 1
    ) {
      badges[index].remove();
    }
  }

  function setUnifiedNew(container, active) {
    if (!(container instanceof Element)) {
      return;
    }

    removeNewBadges(container);

    if (!active) {
      delete container.dataset.v556GentleNew;
      return;
    }

    container.dataset.v556GentleNew = "1";
    container.insertBefore(
      makeNewBadge(),
      container.firstChild
    );
  }

  function syncMainCards() {
    const cards = document.querySelectorAll(
      ".card[data-char]," +
      ".styleCard[data-style]"
    );

    for (
      let index = 0;
      index < cards.length;
      index += 1
    ) {
      const card = cards[index];

      setUnifiedNew(
        card,
        elementIsGentle(card)
      );
    }
  }

  function syncCostumes() {
    const costumeCards = document.querySelectorAll(
      ".costumeTile,.costumeCard"
    );

    const selectedGentle =
      selectedCharacterIsGentle();

    for (
      let index = 0;
      index < costumeCards.length;
      index += 1
    ) {
      const card = costumeCards[index];

      const groupText =
        card.closest(
          ".costumeGalleryGroup," +
          ".costumeGroup"
        )?.textContent || "";

      const active =
        elementIsGentle(card) ||
        (
          selectedGentle &&
          !normalize(groupText).includes("a_venir") &&
          !normalize(groupText).includes("upcoming")
        );

      setUnifiedNew(card, active);
    }
  }

  function syncTierList() {
    const items = document.querySelectorAll(
      ".mhurTierItem"
    );

    for (
      let index = 0;
      index < items.length;
      index += 1
    ) {
      const item = items[index];

      setUnifiedNew(
        item,
        elementIsGentle(item)
      );
    }
  }

  function syncHomeNew() {
    const planned = document.querySelectorAll(
      ".s18PlannedCardV12"
    );

    for (
      let index = 0;
      index < planned.length;
      index += 1
    ) {
      const card = planned[index];
      const badge = card.querySelector(
        ".s18PlannedNewV12"
      );

      if (!badge) {
        continue;
      }

      const released =
        card.dataset.planned === "gentle" &&
        !card.classList.contains("is-disabled") &&
        card.getAttribute("aria-disabled") !== "true";

      if (released) {
        badge.dataset.v556New = "1";
        badge.setAttribute(
          "aria-hidden",
          "false"
        );
      } else {
        delete badge.dataset.v556New;
        badge.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    }
  }

  /* ------------------------------------------------------------------------
     Réductions de points
     ------------------------------------------------------------------------ */
  function roleLabel(role) {
    return (
      ROLE_TEXT[currentLang()]?.[role] ||
      ROLE_TEXT.fr[role] ||
      role
    );
  }

  function roleBadgeHtml(role) {
    try {
      if (typeof roleBadge === "function") {
        return roleBadge(role);
      }
    } catch (_) {}

    try {
      const entry =
        typeof roles !== "undefined"
          ? roles?.[role]
          : window.roles?.[role];

      if (entry) {
        const image = absoluteAsset(entry.img);
        return (
          `<span class="badge ${escapeHtml(entry.cls || role)}">` +
            (
              image
                ? `<img class="roleIcon" src="${escapeHtml(image)}" alt="">`
                : ""
            ) +
            `${escapeHtml(roleLabel(role))}` +
          `</span>`
        );
      }
    } catch (_) {}

    return (
      `<span class="badge ${escapeHtml(role)}">` +
        `${escapeHtml(roleLabel(role))}` +
      `</span>`
    );
  }

  function discountSources(item) {
    const key = normalize(item?.name);
    const sources = [];

    if (key === "gentle_criminal") {
      sources.push(
        "/assets/home/discounts/gentle_criminal_v531.png?v=531"
      );
    }

    if (item?.image) {
      sources.push(
        absoluteAsset(item.image)
      );
    }

    const styleKeys = {
      dj_board: "present_mic_technical",
      flow_runner: "aizawa_strike",
      gentle_criminal: "gentle_criminal",
      factor_fusion: "overhaul_assault",
      cluster: "bakugo_technical",
      mirko: "mirko_rapid"
    };

    const styleKey = styleKeys[key];

    if (styleKey) {
      const databaseSource =
        window.MHUR_DATABASE_ASSETS
          ?.styles
          ?.[styleKey]
          ?.portrait;

      if (databaseSource) {
        sources.push(
          absoluteAsset(databaseSource)
        );
      }
    }

    return Array.from(
      new Set(
        sources.filter(Boolean)
      )
    );
  }

  function discountImageHtml(item) {
    const sources = discountSources(item);
    const source = sources[0] || "";
    const fallbacks = sources.slice(1);

    return (
      `<img ` +
        `src="${escapeHtml(source)}" ` +
        `data-v556-fallbacks="${escapeHtml(JSON.stringify(fallbacks))}" ` +
        `data-v556-fallback-index="0" ` +
        `alt="${escapeHtml(item?.name || "")}" ` +
        `loading="eager" decoding="async">`
    );
  }

  function renderDiscountCard(item) {
    const key = normalize(item?.name);
    const role =
      ROLE_BY_DISCOUNT[key] ||
      "technical";

    return (
      `<article class="discountCardV296 mhurDiscountCardV556" ` +
        `data-discount="${escapeHtml(key)}">` +
        `<div class="mhurDiscountArtV556">` +
          discountImageHtml(item) +
        `</div>` +
        `<b class="mhurDiscountNameV556">` +
          escapeHtml(item?.name || "") +
        `</b>` +
        `<div class="mhurDiscountRoleV556">` +
          roleBadgeHtml(role) +
        `</div>` +
        `<span class="mhurDiscountPointsV556">` +
          escapeHtml(item?.points ?? "") +
          ` Pts.` +
        `</span>` +
      `</article>`
    );
  }

  function installDiscountFallbacks(grid) {
    const images = grid.querySelectorAll(
      ".mhurDiscountArtV556 img"
    );

    for (
      let index = 0;
      index < images.length;
      index += 1
    ) {
      const image = images[index];

      image.onerror = () => {
        let fallbacks = [];

        try {
          fallbacks = JSON.parse(
            image.dataset.v556Fallbacks || "[]"
          );
        } catch (_) {}

        const fallbackIndex =
          Number(
            image.dataset.v556FallbackIndex || 0
          );

        if (
          fallbackIndex >= 0 &&
          fallbackIndex < fallbacks.length
        ) {
          image.dataset.v556FallbackIndex =
            String(fallbackIndex + 1);

          image.src =
            fallbacks[fallbackIndex];

          return;
        }

        image.onerror = null;
        image.style.objectFit = "contain";
      };
    }
  }

  function repairDiscounts() {
    const discounts =
      Array.isArray(
        window.MHUR_HOME_DATA?.discounts
      )
        ? window.MHUR_HOME_DATA.discounts
        : [];

    const grids = document.querySelectorAll(
      ".discountGridV296"
    );

    const signature =
      discounts
        .map(item =>
          [
            normalize(item?.name),
            item?.points,
            item?.image
          ].join(":")
        )
        .join("|") +
      "|" +
      currentLang();

    for (
      let index = 0;
      index < grids.length;
      index += 1
    ) {
      const grid = grids[index];

      if (
        grid.dataset.v556DiscountSig === signature &&
        grid.querySelector(
          ".mhurDiscountCardV556"
        )
      ) {
        continue;
      }

      grid.innerHTML =
        discounts.length
          ? discounts
              .map(renderDiscountCard)
              .join("")
          : (
              `<div class="emptyV296">` +
              (
                currentLang() === "en"
                  ? "No discount."
                  : "Aucune réduction."
              ) +
              `</div>`
            );

      grid.dataset.v556DiscountSig =
        signature;

      installDiscountFallbacks(grid);
    }

    const footers = document.querySelectorAll(
      ".homeFootV296"
    );

    for (
      let index = 0;
      index < footers.length;
      index += 1
    ) {
      footers[index].remove();
    }
  }

  /* ------------------------------------------------------------------------
     Patch PV : retire skill_name et skill_image dans les données.
     ------------------------------------------------------------------------ */
  function patchHpData() {
    const notes =
      window.MHUR_HOME_DATA?.patch_notes;

    if (!Array.isArray(notes)) {
      return;
    }

    for (
      let noteIndex = 0;
      noteIndex < notes.length;
      noteIndex += 1
    ) {
      const note = notes[noteIndex];
      const details =
        Array.isArray(note?.details)
          ? note.details
          : [];

      for (
        let detailIndex = 0;
        detailIndex < details.length;
        detailIndex += 1
      ) {
        const detail = details[detailIndex];
        const title = normalize(
          typeof detail?.title === "object"
            ? (
                detail.title.fr ||
                detail.title.en ||
                ""
              )
            : detail?.title
        );

        const hpSection =
          title.includes("pv") ||
          title.includes("hp") ||
          title.includes("health");

        if (!hpSection) {
          continue;
        }

        const changes =
          Array.isArray(detail?.changes)
            ? detail.changes
            : [];

        for (
          let changeIndex = 0;
          changeIndex < changes.length;
          changeIndex += 1
        ) {
          const change = changes[changeIndex];
          const label = normalize(
            typeof change?.label === "object"
              ? (
                  change.label.fr ||
                  change.label.en ||
                  ""
                )
              : change?.label
          );

          if (
            label === "pv" ||
            label === "hp" ||
            label.includes("health")
          ) {
            delete change.skill_name;
            delete change.skill_image;
          }
        }
      }
    }
  }

  function cleanRenderedHpChanges() {
    const changes = document.querySelectorAll(
      ".s18PatchChangeV10"
    );

    for (
      let index = 0;
      index < changes.length;
      index += 1
    ) {
      const change = changes[index];
      const label = normalize(
        change.querySelector(
          ".s18PatchLabelV10"
        )?.textContent
      );

      const sectionTitle = normalize(
        change.closest(
          ".s18PatchSectionV10"
        )?.querySelector(
          ":scope > h3," +
          ":scope > h2," +
          ".s18PatchSectionTitleV10"
        )?.textContent
      );

      const values = normalize(
        change.textContent
      );

      const hpChange =
        (
          label === "pv" ||
          label === "hp" ||
          sectionTitle.includes("pv") ||
          sectionTitle.includes("hp")
        ) &&
        (
          values.includes("300_250") ||
          values.includes("300250")
        );

      if (!hpChange) {
        continue;
      }

      change.classList.add(
        "mhurHpOnlyV556"
      );

      const picture =
        change.querySelector(
          ".s18PatchSkillV10 > div:first-child"
        );

      if (picture) {
        picture.remove();
      }

      const title =
        change.querySelector(
          ".s18PatchSkillV10 h5"
        );

      if (title) {
        title.textContent =
          currentLang() === "en"
            ? "HP"
            : "PV";
      }
    }
  }

  /* ------------------------------------------------------------------------
     Tutoriel Mods : une seule flèche.
     ------------------------------------------------------------------------ */
  function repairTutorial() {
    const tutorials = document.querySelectorAll(
      ".modsTutorial"
    );

    for (
      let tutorialIndex = 0;
      tutorialIndex < tutorials.length;
      tutorialIndex += 1
    ) {
      const details =
        tutorials[tutorialIndex];

      const oldArrows =
        details.querySelectorAll(
          OLD_ARROW_SELECTOR
        );

      for (
        let index = 0;
        index < oldArrows.length;
        index += 1
      ) {
        oldArrows[index].remove();
      }

      const summary =
        details.querySelector(
          ":scope > summary"
        );

      if (!summary) {
        continue;
      }

      const current =
        summary.querySelectorAll(
          ".mhurModsArrowV556"
        );

      for (
        let index = 1;
        index < current.length;
        index += 1
      ) {
        current[index].remove();
      }

      if (!current.length) {
        const arrow =
          document.createElement("span");

        arrow.className =
          "mhurModsArrowV556";

        arrow.setAttribute(
          "aria-hidden",
          "true"
        );

        summary.appendChild(arrow);
      }
    }
  }

  /* ------------------------------------------------------------------------
     Traductions d'interface visibles.
     ------------------------------------------------------------------------ */
  function translatedExact(value) {
    const language = currentLang();

    if (language === "en") {
      return (
        UI_TRANSLATIONS.get(value) ||
        value
      );
    }

    return (
      REVERSE_TRANSLATIONS.get(value) ||
      value
    );
  }

  function translateTextElement(element) {
    if (!(element instanceof Element)) {
      return;
    }

    if (
      element.children.length === 0
    ) {
      const raw =
        String(element.textContent || "")
          .trim();

      let next = translatedExact(raw);

      if (
        currentLang() === "en"
      ) {
        const match = raw.match(
          /^(\d+)\s+mods?\s+trouvés?$/i
        );

        if (match) {
          next =
            `${match[1]} mods found`;
        }
      } else {
        const match = raw.match(
          /^(\d+)\s+mods?\s+found$/i
        );

        if (match) {
          next =
            `${match[1]} mods trouvés`;
        }
      }

      if (next !== raw) {
        element.textContent = next;
      }
    }

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      const placeholder =
        element.getAttribute("placeholder");

      if (placeholder) {
        element.setAttribute(
          "placeholder",
          translatedExact(placeholder)
        );
      }
    }

    if (
      element instanceof HTMLOptionElement
    ) {
      const raw =
        String(element.textContent || "")
          .trim();

      const next =
        translatedExact(raw);

      if (next !== raw) {
        element.textContent = next;
      }
    }
  }

  function translateVisibleUi(root = document) {
    if (!root.querySelectorAll) {
      return;
    }

    const selectors = [
      ".modsTutorial",
      ".modsPage",
      ".modsToolbar",
      ".modsFilters",
      ".modCard",
      ".pageFrame",
      "#mhurPatchDevButtonV14",
      "select option",
      "input[placeholder]",
      "textarea[placeholder]"
    ].join(",");

    const roots = root.querySelectorAll(
      selectors
    );

    for (
      let rootIndex = 0;
      rootIndex < roots.length;
      rootIndex += 1
    ) {
      const container =
        roots[rootIndex];

      translateTextElement(container);

      const descendants =
        container.querySelectorAll(
          "button,span,b,strong,label," +
          "option,h1,h2,h3,h4,p,small," +
          "input,textarea"
        );

      for (
        let index = 0;
        index < descendants.length;
        index += 1
      ) {
        translateTextElement(
          descendants[index]
        );
      }
    }
  }

  function repairAll() {
    patchHpData();
    syncMainCards();
    syncCostumes();
    syncTierList();
    syncHomeNew();
    repairDiscounts();
    cleanRenderedHpChanges();
    repairTutorial();
    translateVisibleUi(document);
  }

  let scheduled = false;

  function scheduleRepair() {
    if (scheduled) {
      return;
    }

    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      repairAll();
    });
  }

  function install() {
    repairAll();

    const observer =
      new MutationObserver(
        records => {
          let relevant = false;

          for (
            let recordIndex = 0;
            recordIndex < records.length;
            recordIndex += 1
          ) {
            const record =
              records[recordIndex];

            if (
              record.type === "childList" &&
              (
                record.addedNodes.length ||
                record.removedNodes.length
              )
            ) {
              relevant = true;
              break;
            }
          }

          if (relevant) {
            scheduleRepair();
          }
        }
      );

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

    document.addEventListener(
      "click",
      event => {
        if (
          event.target.closest(
            "#mhurPatchDevButtonV14," +
            ".mhurPatchDevButtonV14," +
            "[data-s18-notes-button]," +
            ".navItem," +
            ".card[data-char]," +
            ".styleCard[data-style]"
          )
        ) {
          const delays = [
            0,
            30,
            100,
            250
          ];

          for (
            let index = 0;
            index < delays.length;
            index += 1
          ) {
            setTimeout(
              repairAll,
              delays[index]
            );
          }
        }
      },
      true
    );

    window.addEventListener(
      "mhur:languagechange",
      () => {
        const delays = [
          0,
          40,
          140,
          350
        ];

        for (
          let index = 0;
          index < delays.length;
          index += 1
        ) {
          setTimeout(
            repairAll,
            delays[index]
          );
        }
      }
    );

    const startupDelays = [
      40,
      120,
      300,
      700,
      1400,
      2600
    ];

    for (
      let index = 0;
      index < startupDelays.length;
      index += 1
    ) {
      setTimeout(
        repairAll,
        startupDelays[index]
      );
    }

    window.MHUR_V556 = {
      repairAll,
      patchHpData,
      repairDiscounts,
      repairTutorial,
      syncMainCards,
      syncCostumes,
      syncTierList,
      translateVisibleUi
    };

    console.info(
      "[MHUR] V556 : NEW unifié, réductions, PV, tutoriel et traductions réparés."
    );
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      install,
      {once: true}
    );
  } else {
    install();
  }
})();
