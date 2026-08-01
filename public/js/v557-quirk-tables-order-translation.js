/* ==========================================================================
   MHUR NEXUS — V557
   - traduction complète FR / EN des tableaux d'Alters ;
   - Effets de montée toujours placés en premier.
   ========================================================================== */
(() => {
  "use strict";

  const escapeHtml = value =>
    String(value ?? "").replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]
    );

  function currentLanguage() {
    try {
      if (
        typeof lang !== "undefined" &&
        (lang === "fr" || lang === "en")
      ) {
        return lang;
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

  function clean(value) {
    return String(value ?? "")
      .replace(
        /\s*\([^)]*[\u3040-\u30ff\u3400-\u9fff][^)]*\)/g,
        ""
      )
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function normalized(value) {
    return clean(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/[^a-z0-9αβγ+]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /*
    Expressions complètes d'abord, puis mots génériques.
    Cela évite par exemple de transformer « Vitesse de rechargement »
    morceau par morceau.
  */
  const TO_ENGLISH = [
    [/\bEffets? de montée(?: de niveau)?\b/gi, "Level-up Effects"],
    [/\bEffets? d'amélioration de niveau\b/gi, "Level-up Effects"],
    [/\bValeurs? Action spéciale\b/gi, "Special Action Values"],
    [/\bValeurs? de l'Action spéciale\b/gi, "Special Action Values"],
    [/\bValeurs? supplémentaires\b/gi, "Additional Values"],
    [/\bValeurs? de base\b/gi, "Base Values"],
    [/\bMunitions et recharge\b/gi, "Ammo and Reload"],
    [/\bDégâts ([αβγ]) supplémentaires\b/gi, "Additional $1 damage"],
    [/\bDégâts supplémentaires ([αβγ])\b/gi, "Additional $1 damage"],
    [/\bDégâts supplémentaires\b/gi, "Additional damage"],
    [/\bVitesse de rechargement\b/gi, "Reload Speed"],
    [/\bPuissance de mise au sol\b/gi, "Down Power"],
    [/\bPuissance d'attaque\b/gi, "Attack Power"],
    [/\bVitesse de déplacement\b/gi, "Movement Speed"],
    [/\bHauteur du saut vertical\b/gi, "Vertical Jump Height"],
    [/\bConsommation de munitions\b/gi, "Ammo Use"],
    [/\bConsommation\b/gi, "Ammo Use"],
    [/\bPV Max\b/gi, "Max HP"],
    [/\bPG Max\b/gi, "Max GP"],

    [/\bDistance courte\b/gi, "Short Range"],
    [/\bDistance moyenne\b/gi, "Medium Range"],
    [/\bDistance longue\b/gi, "Long Range"],
    [/\bCoup à portée maximale\b/gi, "Max-Range Hit"],
    [/\bDétection de la cible\b/gi, "Target Detection"],
    [/\bVérifications? d'activation\b/gi, "Activation Checks"],
    [/\bCoup de talon\b/gi, "Heel Drop"],
    [/\bOnde de choc au sol\b/gi, "Ground Shockwave"],
    [/\bImpact au sol\b/gi, "Ground Impact"],
    [/\bSaisie aérienne\b/gi, "Aerial Grab"],
    [/\bAttaque aérienne\b/gi, "Aerial Attack"],
    [/\bDégât initial\b/gi, "Initial Damage"],
    [/\bDégâts initiaux\b/gi, "Initial Damage"],
    [/\bImpact initial\b/gi, "Initial Impact"],
    [/\bImpact final\b/gi, "Final Impact"],
    [/\bDernier coup\b/gi, "Final Hit"],
    [/\bCoup chargé\b/gi, "Charged Hit"],
    [/\bFinisher de charge\b/gi, "Charge Finisher"],
    [/\bPremière onde de choc\b/gi, "First Shockwave"],
    [/\bDeuxième onde de choc\b/gi, "Second Shockwave"],
    [/\bAppui court\b/gi, "Short Press"],
    [/\bÀ l'activation\b/gi, "On Activation"],
    [/\bCharge max(?:imale)?\b/gi, "Max Charge"],
    [/\bRush aérien\b/gi, "Aerial Rush"],
    [/\bRuée aérienne\b/gi, "Aerial Rush"],
    [/\bRotation aérienne\b/gi, "Aerial Spin"],
    [/\bCharge entravante\b/gi, "Binding Charge"],
    [/\bProjectile renforcé\b/gi, "Enhanced Projectile"],
    [/\bZone de lévitation\b/gi, "Levitation Zone"],
    [/\bContact pendant la charge\b/gi, "Contact During Charge"],
    [/\bExécuter de nouveau\b/gi, "Use Again"],
    [/\bUtiliser de nouveau\b/gi, "Use Again"],

    [/\bRuée\b/gi, "Rush"],
    [/\bRebond\b/gi, "Rebound"],
    [/\bÉcrasement\b/gi, "Slamming"],
    [/\bOnde de choc\b/gi, "Shockwave"],
    [/\bSaisie\b/gi, "Grab"],
    [/\bDéploiement\b/gi, "Deployment"],
    [/\bRelâchement\b/gi, "Release"],
    [/\bAccroupi\b/gi, "Crouching"],
    [/\bDéployée?\b/gi, "Deployed"],
    [/\bPilier\b/gi, "Pillar"],
    [/\bCorps à corps\b/gi, "Melee"],
    [/\bPlongée\b/gi, "Dive"],
    [/\bBrûlure\b/gi, "Burn"],
    [/\bProjectile d'air\b/gi, "Air Projectile"],
    [/\bBarrière\b/gi, "Barrier"],
    [/\bCharge\b/gi, "Charge"],
    [/\bZone\b/gi, "Area"],

    [/\bNiveau\b/gi, "Level"],
    [/\bDégâts\b/gi, "Damage"],
    [/\bDégât\b/gi, "Damage"],
    [/\bMunitions\b/gi, "Ammo"],
    [/\bRecharge\b/gi, "Reload"],
    [/\bDurée\b/gi, "Duration"],
    [/\bPortée\b/gi, "Range"],
    [/\bTaille\b/gi, "Size"],
    [/\bEffet\b/gi, "Effect"],
    [/\bValeurs\b/gi, "Values"],
    [/\bValeur\b/gi, "Value"],
    [/\bType\b/gi, "Type"],
    [/\bSol\b/gi, "Ground"],
    [/\bMaintenir\b/gi, "Hold"],
    [/\bNormal\b/gi, "Normal"],
    [/\bRapide\b/gi, "Quick"]
  ];

  const TO_FRENCH = [
    [/\bLevel[- ]?up Effects?\b/gi, "Effets de montée"],
    [/\bSpecial Action Values?\b/gi, "Valeurs Action spéciale"],
    [/\bAdditional Values?\b/gi, "Valeurs supplémentaires"],
    [/\bBase Values?\b/gi, "Valeurs de base"],
    [/\bAmmo\s*(?:and|&)\s*Reload\b/gi, "Munitions et recharge"],
    [/\bAdditional ([αβγ]) damage\b/gi, "Dégâts $1 supplémentaires"],
    [/\bAdditional damage\b/gi, "Dégâts supplémentaires"],
    [/\bReload Speed\b/gi, "Vitesse de rechargement"],
    [/\bDown Power\b/gi, "Puissance de mise au sol"],
    [/\bAttack Power\b/gi, "Puissance d'attaque"],
    [/\bMovement Speed\b/gi, "Vitesse de déplacement"],
    [/\bVertical Jump Height\b/gi, "Hauteur du saut vertical"],
    [/\bAmmo Use\b/gi, "Consommation"],
    [/\bUse Ammo\b/gi, "Consommation"],
    [/\bMax HP\b/gi, "PV Max"],
    [/\bMax GP\b/gi, "PG Max"],

    [/\bShort Range\b/gi, "Distance courte"],
    [/\bMedium Range\b/gi, "Distance moyenne"],
    [/\bLong Range\b/gi, "Distance longue"],
    [/\bMax[- ]?Range Hit\b/gi, "Coup à portée maximale"],
    [/\bTarget Detection\b/gi, "Détection de la cible"],
    [/\bActivation Checks?\b/gi, "Vérifications d'activation"],
    [/\bHeel Drop\b/gi, "Coup de talon"],
    [/\bGround Shockwave\b/gi, "Onde de choc au sol"],
    [/\bGround Impact\b/gi, "Impact au sol"],
    [/\bAerial Grab\b/gi, "Saisie aérienne"],
    [/\bAerial Attack\b/gi, "Attaque aérienne"],
    [/\bInitial Damage\b/gi, "Dégât initial"],
    [/\bInitial Impact\b/gi, "Impact initial"],
    [/\bFinal Impact\b/gi, "Impact final"],
    [/\bFinal Hit\b/gi, "Dernier coup"],
    [/\bCharged Hit\b/gi, "Coup chargé"],
    [/\bCharge Finisher\b/gi, "Finisher de charge"],
    [/\bFirst Shockwave\b/gi, "Première onde de choc"],
    [/\bSecond Shockwave\b/gi, "Deuxième onde de choc"],
    [/\bShort Press\b/gi, "Appui court"],
    [/\bOn Activation\b/gi, "À l'activation"],
    [/\bMax Charge\b/gi, "Charge max"],
    [/\bAerial Rush\b/gi, "Rush aérien"],
    [/\bAerial Spin\b/gi, "Rotation aérienne"],
    [/\bBinding Charge\b/gi, "Charge entravante"],
    [/\bEnhanced Projectile\b/gi, "Projectile renforcé"],
    [/\bLevitation Zone\b/gi, "Zone de lévitation"],
    [/\bContact During Charge\b/gi, "Contact pendant la charge"],
    [/\bUse Again\b/gi, "Exécuter de nouveau"],

    [/\bRush\b/gi, "Ruée"],
    [/\bRebound\b/gi, "Rebond"],
    [/\bSlamming\b/gi, "Écrasement"],
    [/\bShockwave\b/gi, "Onde de choc"],
    [/\bGrab\b/gi, "Saisie"],
    [/\bDeployment\b/gi, "Déploiement"],
    [/\bRelease\b/gi, "Relâchement"],
    [/\bCrouching\b/gi, "Accroupi"],
    [/\bDeployed\b/gi, "Déployée"],
    [/\bPillar\b/gi, "Pilier"],
    [/\bMelee\b/gi, "Corps à corps"],
    [/\bDive\b/gi, "Plongée"],
    [/\bBurn\b/gi, "Brûlure"],
    [/\bAir Projectile\b/gi, "Projectile d'air"],
    [/\bBarrier\b/gi, "Barrière"],

    [/\bLevel Up Effect\b/gi, "Effet de montée"],
    [/\bLevel\b/gi, "Niveau"],
    [/\bDamage\b/gi, "Dégâts"],
    [/\bAmmo\b/gi, "Munitions"],
    [/\bReload\b/gi, "Recharge"],
    [/\bConsumption\b/gi, "Consommation"],
    [/\bDuration\b/gi, "Durée"],
    [/\bRange\b/gi, "Portée"],
    [/\bSize\b/gi, "Taille"],
    [/\bEffect\b/gi, "Effet"],
    [/\bValues\b/gi, "Valeurs"],
    [/\bValue\b/gi, "Valeur"],
    [/\bType\b/gi, "Type"],
    [/\bGround\b/gi, "Sol"],
    [/\bHold\b/gi, "Maintenir"],
    [/\bNormal\b/gi, "Normal"],
    [/\bQuick\b/gi, "Rapide"]
  ];

  function applyMap(value, replacements) {
    let text = clean(value);

    for (
      let index = 0;
      index < replacements.length;
      index += 1
    ) {
      const [expression, replacement] =
        replacements[index];

      text = text.replace(
        expression,
        replacement
      );
    }

    return text
      .replace(/\s*\+\s*/g, " + ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function translate(value) {
    return currentLanguage() === "en"
      ? applyMap(value, TO_ENGLISH)
      : applyMap(value, TO_FRENCH);
  }

  function isLevelUpTitle(value) {
    const text = normalized(value);

    return (
      text.includes("level up effect") ||
      text.includes("levelup effect") ||
      text.includes("effet de montee") ||
      text.includes("effets de montee") ||
      text.includes("effet d amelioration de niveau")
    );
  }

  function orderedTables(items) {
    return (Array.isArray(items) ? items : [])
      .map((item, index) => ({
        item,
        index,
        levelUp: isLevelUpTitle(
          item?.title
        )
      }))
      .sort((left, right) => {
        if (
          left.levelUp !== right.levelUp
        ) {
          return left.levelUp ? -1 : 1;
        }

        return left.index - right.index;
      })
      .map(entry => entry.item);
  }

  function renderTablesV557(items) {
    const ordered = orderedTables(items);

    return (
      `<div class="tables">` +
      ordered.map(table => {
        const levelUp =
          isLevelUpTitle(table?.title);

        const title =
          translate(table?.title);

        const columns =
          Array.isArray(table?.cols)
            ? table.cols
            : [];

        const rows =
          Array.isArray(table?.rows)
            ? table.rows
            : [];

        return (
          `<button type="button" ` +
            `class="toggle" ` +
            `aria-expanded="false" ` +
            (
              levelUp
                ? `data-v557-level-up="1" `
                : ""
            ) +
          `>` +
            `<span class="statsToggleTitle">` +
              escapeHtml(title) +
            `</span>` +
            `<span class="statsToggleArrow" aria-hidden="true">▾</span>` +
          `</button>` +
          `<div class="simpleTable hidden" ` +
            `hidden aria-hidden="true" ` +
            `style="display:none!important">` +
            `<table class="dataTable">` +
              `<thead><tr>` +
                columns.map(column =>
                  `<th>${escapeHtml(translate(column))}</th>`
                ).join("") +
              `</tr></thead>` +
              `<tbody>` +
                rows.map(row =>
                  `<tr>` +
                    (
                      Array.isArray(row)
                        ? row
                        : []
                    ).map(cell =>
                      `<td>${escapeHtml(translate(cell))}</td>`
                    ).join("") +
                  `</tr>`
                ).join("") +
              `</tbody>` +
            `</table>` +
          `</div>`
        );
      }).join("") +
      `</div>`
    );
  }

  function installRenderer() {
    try {
      if (
        typeof tables !== "undefined"
      ) {
        tables = renderTablesV557;
      }

      window.tables =
        renderTablesV557;

      return true;
    } catch (error) {
      console.error(
        "[V557] remplacement du rendu impossible",
        error
      );

      return false;
    }
  }

  function tablePairs(container) {
    const children =
      Array.from(container.children);

    const pairs = [];

    for (
      let index = 0;
      index < children.length;
      index += 1
    ) {
      const button = children[index];

      if (
        !button.classList.contains("toggle")
      ) {
        continue;
      }

      const panel =
        children[index + 1];

      pairs.push({
        button,
        panel:
          panel?.classList.contains("simpleTable")
            ? panel
            : null,
        index,
        levelUp:
          isLevelUpTitle(
            button.querySelector(
              ".statsToggleTitle"
            )?.textContent ||
            button.textContent
          )
      });
    }

    return pairs;
  }

  function moveLevelUpFirst(container) {
    const pairs =
      tablePairs(container);

    const ordered = [
      ...pairs.filter(pair => pair.levelUp),
      ...pairs.filter(pair => !pair.levelUp)
    ];

    for (
      let index = 0;
      index < ordered.length;
      index += 1
    ) {
      const pair = ordered[index];

      if (pair.levelUp) {
        pair.button.dataset.v557LevelUp =
          "1";
      } else {
        delete pair.button.dataset.v557LevelUp;
      }

      container.appendChild(
        pair.button
      );

      if (pair.panel) {
        container.appendChild(
          pair.panel
        );
      }
    }
  }

  function translateElementText(element) {
    if (!(element instanceof Element)) {
      return;
    }

    const original =
      String(element.textContent || "")
        .trim();

    const translated =
      translate(original);

    if (
      translated &&
      translated !== original
    ) {
      element.textContent =
        translated;
    }
  }

  function normalizeExistingTables(
    root = document
  ) {
    if (!root.querySelectorAll) {
      return;
    }

    const containers =
      root.querySelectorAll(
        ".skillText .tables"
      );

    for (
      let containerIndex = 0;
      containerIndex < containers.length;
      containerIndex += 1
    ) {
      const container =
        containers[containerIndex];

      moveLevelUpFirst(container);

      const textElements =
        container.querySelectorAll(
          ".statsToggleTitle," +
          ".dataTable th," +
          ".dataTable td"
        );

      for (
        let index = 0;
        index < textElements.length;
        index += 1
      ) {
        translateElementText(
          textElements[index]
        );
      }
    }

    if (
      root instanceof Element &&
      root.matches(".skillText .tables")
    ) {
      moveLevelUpFirst(root);

      const textElements =
        root.querySelectorAll(
          ".statsToggleTitle," +
          ".dataTable th," +
          ".dataTable td"
        );

      for (
        let index = 0;
        index < textElements.length;
        index += 1
      ) {
        translateElementText(
          textElements[index]
        );
      }
    }
  }

  function repair() {
    installRenderer();
    normalizeExistingTables(document);
  }

  let scheduled = false;

  function scheduleRepair() {
    if (scheduled) {
      return;
    }

    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      repair();
    });
  }

  function install() {
    repair();

    const app =
      document.getElementById("app") ||
      document.body;

    const observer =
      new MutationObserver(records => {
        let relevant = false;

        for (
          let recordIndex = 0;
          recordIndex < records.length;
          recordIndex += 1
        ) {
          const record =
            records[recordIndex];

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
                ".tables,.simpleTable,.dataTable"
              ) ||
              node.querySelector(
                ".tables,.simpleTable,.dataTable"
              )
            ) {
              relevant = true;
              break;
            }
          }

          if (relevant) {
            break;
          }
        }

        if (relevant) {
          scheduleRepair();
        }
      });

    observer.observe(app, {
      childList: true,
      subtree: true
    });

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
            repair,
            delays[index]
          );
        }
      }
    );

    document.addEventListener(
      "click",
      event => {
        if (
          event.target.closest(
            ".styleCard," +
            ".card[data-char]," +
            ".back," +
            "#langToggle"
          )
        ) {
          const delays = [
            0,
            40,
            140,
            320
          ];

          for (
            let index = 0;
            index < delays.length;
            index += 1
          ) {
            setTimeout(
              repair,
              delays[index]
            );
          }
        }
      },
      true
    );

    const delays = [
      40,
      120,
      300,
      700,
      1400
    ];

    for (
      let index = 0;
      index < delays.length;
      index += 1
    ) {
      setTimeout(
        repair,
        delays[index]
      );
    }

    window.MHUR_V557 = {
      repair,
      translate,
      isLevelUpTitle,
      orderedTables,
      renderTablesV557,
      normalizeExistingTables
    };

    console.info(
      "[MHUR] V557 : tableaux d'Alters traduits et Effets de montée placés en premier."
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
