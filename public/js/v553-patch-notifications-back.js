/* ==========================================================================
   MHUR NEXUS — V553
   Patch officiel v1.17.0-14.5, noms d'Alters issus du site,
   notification de version et bouton Retour mobile.
   ========================================================================== */
(() => {
  "use strict";

  const RELEASE_ID = "v553";
  const PATCH_ID = "data-update-v1.17.0-14.5-v553";

  const FR = () =>
    !(typeof lang !== "undefined" && lang === "en");

  const bi = (fr, en) => ({fr, en});

  function valueOf(value) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      return value[FR() ? "fr" : "en"] ??
        value.fr ??
        value.en ??
        "";
    }

    return value ?? "";
  }

  function norm(value) {
    return String(valueOf(value) || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function listCharacters() {
    return typeof characters !== "undefined" &&
      Array.isArray(characters)
      ? characters
      : [];
  }

  function stylesMap() {
    return typeof styles !== "undefined" &&
      styles &&
      typeof styles === "object"
      ? styles
      : {};
  }

  function findCharacter(aliases) {
    const rows = listCharacters();

    for (
      let aliasIndex = 0;
      aliasIndex < aliases.length;
      aliasIndex += 1
    ) {
      const alias = norm(aliases[aliasIndex]);

      for (
        let rowIndex = 0;
        rowIndex < rows.length;
        rowIndex += 1
      ) {
        const row = rows[rowIndex];
        const haystack = norm(
          `${row?.id || ""} ${row?.name || ""}`
        );

        if (
          haystack === alias ||
          haystack.includes(alias) ||
          alias.includes(haystack)
        ) {
          return row;
        }
      }
    }

    return null;
  }

  function characterStyleIds(character) {
    if (!character) return [];

    const map = stylesMap();
    const source = Array.isArray(character.styles)
      ? character.styles
      : [];
    const out = [];

    for (
      let index = 0;
      index < source.length;
      index += 1
    ) {
      const id = String(source[index] || "");

      if (id && map[id] && !out.includes(id)) {
        out.push(id);
      }
    }

    return out;
  }

  function findStyle(character, hints = []) {
    const map = stylesMap();
    const ids = characterStyleIds(character);

    for (
      let hintIndex = 0;
      hintIndex < hints.length;
      hintIndex += 1
    ) {
      const hint = norm(hints[hintIndex]);

      for (
        let idIndex = 0;
        idIndex < ids.length;
        idIndex += 1
      ) {
        const id = ids[idIndex];
        const style = map[id];
        const haystack = norm(
          `${id} ${valueOf(style?.name)}`
        );

        if (
          haystack === hint ||
          haystack.includes(hint) ||
          hint.includes(haystack)
        ) {
          return {id, style};
        }
      }
    }

    const original = ids.find(id =>
      norm(map[id]?.name || "Original") === "original"
    );

    const id = original || ids[0] || "";

    return {
      id,
      style: map[id] || null
    };
  }

  function reference(
    characterAliases,
    styleHints,
    slot,
    fallbackCharacter,
    fallbackStyle,
    fallbackSkill
  ) {
    const character = findCharacter(characterAliases);
    const pickedStyle = findStyle(
      character,
      styleHints
    );
    const style = pickedStyle.style;

    const skills = Array.isArray(style?.skills)
      ? style.skills
      : [];

    let skill = null;

    if (slot === "special") {
      skill = style?.special || null;
    } else if (
      Number.isInteger(slot) &&
      slot >= 0 &&
      slot < skills.length
    ) {
      skill = skills[slot];
    }

    return {
      character:
        character?.name ||
        fallbackCharacter,
      style:
        style?.name ||
        fallbackStyle ||
        "Original",
      skill:
        skill?.name ||
        fallbackSkill,
      image:
        skill?.img ||
        style?.portrait ||
        character?.portrait ||
        "",
      characterObject: character,
      styleObject: style
    };
  }

  function change(
    ref,
    tone,
    labelFr,
    labelEn,
    before,
    after,
    bullets = []
  ) {
    return {
      character: ref.character,
      style: ref.style,
      skill_name: ref.skill,
      skill_image: ref.image,
      label: bi(labelFr, labelEn),
      tone,
      before,
      after,
      bullets: bullets.map(item =>
        typeof item === "string"
          ? item
          : bi(item.fr, item.en)
      )
    };
  }

  function blankUntil(level, value) {
    const rows = [];

    for (let index = 1; index < level; index += 1) {
      rows.push("");
    }

    rows.push(value);
    return rows;
  }

  function refs() {
    const ofaA = reference(
      [
        "izuku midoriya ofa",
        "midoriya ofa",
        "deku ofa"
      ],
      ["original"],
      0,
      "Izuku Midoriya OFA",
      "Original",
      bi(
        "Delaware Smash : Rafale d'air",
        "Delaware Smash Airblast"
      )
    );

    const bakugoG = reference(
      ["katsuki bakugo", "bakugo"],
      ["original"],
      2,
      "Katsuki Bakugo",
      "Original",
      "Howitzer Impact"
    );

    const clusterA = reference(
      ["katsuki bakugo", "bakugo"],
      ["cluster"],
      0,
      "Katsuki Bakugo",
      "Cluster",
      bi(
        "Tir AP : Cluster",
        "AP Shot Cluster"
      )
    );

    const clusterB = reference(
      ["katsuki bakugo", "bakugo"],
      ["cluster"],
      1,
      "Katsuki Bakugo",
      "Cluster",
      "Nitro Cluster"
    );

    const clusterG = reference(
      ["katsuki bakugo", "bakugo"],
      ["cluster"],
      2,
      "Katsuki Bakugo",
      "Cluster",
      "Howitzer Impact Cluster"
    );

    const denkiA = reference(
      ["denki kaminari", "denki"],
      ["original"],
      0,
      "Denki Kaminari",
      "Original",
      bi("Cible électrique", "Electro-target")
    );

    const denkiSpecial = reference(
      ["denki kaminari", "denki"],
      ["original"],
      "special",
      "Denki Kaminari",
      "Original",
      bi("Électrification", "Electrification")
    );

    const mirioA = reference(
      ["mirio togata", "mirio"],
      [
        "contre eclatant",
        "sheer counter"
      ],
      0,
      "Mirio Togata",
      bi("Contre éclatant", "Sheer Counter"),
      "Phantom Smash"
    );

    const armoredA = reference(
      [
        "armored all might",
        "all might armored"
      ],
      ["original", "technique"],
      0,
      "Armored All Might",
      "Original",
      "Ice Bullet Shot"
    );

    const hawksA = reference(
      ["hawks"],
      ["original"],
      0,
      "Hawks",
      "Original",
      "Wingbeat"
    );

    const hawksB = reference(
      ["hawks"],
      ["original"],
      1,
      "Hawks",
      "Original",
      "Wind Cross"
    );

    const nagantA = reference(
      ["lady nagant", "nagant"],
      ["original"],
      0,
      "Lady Nagant",
      "Original",
      bi(
        "Tir à pointe creuse",
        "Hollow Point Shot"
      )
    );

    const nagantB = reference(
      ["lady nagant", "nagant"],
      ["original"],
      1,
      "Lady Nagant",
      "Original",
      "High Angle Fire"
    );

    const nagantG = reference(
      ["lady nagant", "nagant"],
      ["original"],
      2,
      "Lady Nagant",
      "Original",
      "Kickback Shot"
    );

    const nagantSpecial = reference(
      ["lady nagant", "nagant"],
      ["original"],
      "special",
      "Lady Nagant",
      "Original",
      bi("Mode lunette", "Scope Mode")
    );

    const kendoG = reference(
      ["itsuka kendo", "kendo"],
      ["original", "assaut", "assault"],
      2,
      "Itsuka Kendo",
      "Original",
      "Big Fist Grip"
    );

    const twiceG = reference(
      ["twice"],
      ["original"],
      2,
      "Twice",
      "Original",
      bi("Boost du pied", "Foot Boost")
    );

    const shigarakiB = reference(
      [
        "tomura shigaraki",
        "shigaraki"
      ],
      ["original", "attaque", "strike"],
      1,
      "Tomura Shigaraki",
      "Original",
      "Ground Destruction"
    );

    const gentleA = reference(
      ["gentle criminal", "gentle"],
      ["original", "technical", "technique"],
      0,
      "Gentle Criminal",
      "Original",
      "Gently Arrow"
    );

    const gentleB = reference(
      ["gentle criminal", "gentle"],
      ["original", "technical", "technique"],
      1,
      "Gentle Criminal",
      "Original",
      "Gently Rebound"
    );

    const gentleG = reference(
      ["gentle criminal", "gentle"],
      ["original", "technical", "technique"],
      2,
      "Gentle Criminal",
      "Original",
      "Gently Avant"
    );

    const gentleSpecial = reference(
      ["gentle criminal", "gentle"],
      ["original", "technical", "technique"],
      "special",
      "Gentle Criminal",
      "Original",
      "Gently Trampoline"
    );

    return {
      ofaA,
      bakugoG,
      clusterA,
      clusterB,
      clusterG,
      denkiA,
      denkiSpecial,
      mirioA,
      armoredA,
      hawksA,
      hawksB,
      nagantA,
      nagantB,
      nagantG,
      nagantSpecial,
      kendoG,
      twiceG,
      shigarakiB,
      gentleA,
      gentleB,
      gentleG,
      gentleSpecial
    };
  }

  function buildPatch() {
    const r = refs();

    const clusterBase = [
      30, 31, 32, 34, 35, 36, 37, 38, 40
    ];

    const nagantAmmoBefore = [
      6, 6, 6, 7, 7, 7, 7, 7, 8
    ];

    const nagantAmmoAfter = [
      5, 5, 5, 6, 6, 6, 6, 6, 7
    ];

    return {
      id: PATCH_ID,
      title: bi(
        "Mise à jour des données v1.17.0-14.5",
        "Data Update v1.17.0-14.5"
      ),
      date: "2026-07-29T00:13:00Z",
      source_url:
        "https://fr.ultrarumble.com/patch/1785298405",
      details: [
        {
          title: bi(
            "Changements d'équilibre : PV",
            "Balance Changes: Health"
          ),
          changes: [
            change(
              r.ofaA,
              "nerf",
              "PV",
              "HP",
              300,
              250
            )
          ]
        },
        {
          title: bi(
            "Changements d'équilibre : Dégâts",
            "Balance Changes: Damage"
          ),
          changes: [
            change(
              r.bakugoG,
              "nerf",
              "Dégâts et brise-garde — niveaux 1 à 9",
              "Damage and Guard Break — Levels 1 to 9",
              Array(9).fill(4),
              Array(9).fill(1)
            ),

            change(
              r.clusterA,
              "buff",
              "Tir normal — dégâts et brise-garde",
              "Normal shot — Damage and Guard Break",
              clusterBase,
              clusterBase.map(value => value + 10)
            ),

            change(
              r.clusterB,
              "buff",
              "Explosion — dégâts et brise-garde",
              "Explosion — Damage and Guard Break",
              clusterBase,
              clusterBase.map(value => value + 5)
            ),

            change(
              r.clusterB,
              "buff",
              "Explosion de suivi — dégâts et brise-garde",
              "Explosion follow-up — Damage and Guard Break",
              [40, 41, 42, 44, 45, 46, 47, 48, 50],
              [44, 46, 48, 50, 52, 54, 56, 58, 60]
            ),

            change(
              r.denkiA,
              "nerf",
              "Dégâts et brise-garde",
              "Damage and Guard Break",
              [55, 60, 65, 70, 72, 74, 76, 78, 80],
              [54, 56, 58, 60, 62, 64, 66, 68, 70]
            ),

            change(
              r.denkiA,
              "buff",
              "Puissance de mise au sol",
              "Down Power",
              Array(9).fill(50),
              Array(9).fill(100)
            ),

            change(
              r.mirioA,
              "nerf",
              "Tir — dégâts et brise-garde",
              "Shot — Damage and Guard Break",
              [40, 41, 42, 43, 44, 45, 46, 47, 48],
              [36, 37, 38, 39, 40, 41, 42, 43, 44]
            ),

            change(
              r.armoredA,
              "nerf",
              "Brûlure — dégâts et brise-garde",
              "Burn — Damage and Guard Break",
              [52, 54, 56, 58, 60, 62, 64, 66, 68],
              [48, 50, 52, 54, 55, 56, 57, 58, 60]
            ),

            change(
              r.hawksA,
              "nerf",
              "Tir à tête chercheuse — dégâts et brise-garde",
              "Homing shot — Damage and Guard Break",
              ["", "", "", 14, 14, 14, 14, 14, 18],
              ["", "", "", 12, 12, 12, 12, 12, 14]
            ),

            change(
              r.hawksB,
              "buff",
              "Corps à corps — dégâts et brise-garde",
              "Melee — Damage and Guard Break",
              [90, 95, 100, 110, 115, 120, 125, 130, 135],
              [100, 105, 110, 120, 125, 130, 135, 140, 150]
            ),

            change(
              r.nagantA,
              "nerf",
              "Dégâts du tir après l'impact de suivi",
              "On-hit shot after follow-up — Damage",
              [6, 6, 6, 8, 8, 8, 8, 8, 10],
              [3, 3, 3, 4, 4, 4, 4, 4, 5]
            ),

            change(
              r.nagantA,
              "nerf",
              "Tir principal — dégâts et brise-garde",
              "Main shot — Damage and Guard Break",
              [47, 49, 51, 53, 55, 57, 59, 61, 63],
              [35, 36, 37, 39, 40, 41, 42, 43, 45]
            ),

            change(
              r.nagantB,
              "nerf",
              "Tir en arc à l'impact — dégâts et brise-garde",
              "Arc on-hit shot — Damage and Guard Break",
              [25, 26, 27, 29, 30, 31, 32, 33, 35],
              [20, 21, 22, 24, 25, 26, 27, 28, 30]
            ),

            change(
              r.nagantG,
              "nerf",
              "Tir dispersé au sol — dégâts et brise-garde",
              "Ground spread shot — Damage and Guard Break",
              [120, 124, 128, 136, 140, 144, 148, 152, 160],
              [100, 103, 106, 110, 113, 116, 119, 122, 125]
            ),

            change(
              r.nagantSpecial,
              "nerf",
              "Tir en mode lunette — dégâts et brise-garde",
              "Scope Mode shot — Damage and Guard Break",
              150,
              125
            ),

            change(
              r.nagantSpecial,
              "nerf",
              "Tir à la tête en mode lunette — dégâts et brise-garde",
              "Scope Mode headshot — Damage and Guard Break",
              280,
              230
            )
          ]
        },
        {
          title: bi(
            "Changements d'équilibre : Munitions et recharge",
            "Balance Changes: Magazine and Reload"
          ),
          changes: [
            change(
              r.ofaA,
              "nerf",
              "Munitions",
              "Ammo",
              [6, 6, 6, 7, 7, 7, 7, 7, 8],
              [5, 5, 5, 6, 6, 6, 6, 6, 7]
            ),

            change(
              r.clusterA,
              "buff",
              "Munitions",
              "Ammo",
              [4, 4, 4, 5, 5, 5, 5, 5, 6],
              [5, 5, 5, 6, 6, 6, 6, 6, 7]
            ),

            change(
              r.clusterG,
              "buff",
              "Munitions — niveau 9",
              "Ammo — Level 9",
              blankUntil(9, 1),
              blankUntil(9, 2)
            ),

            change(
              r.clusterG,
              "nerf",
              "Temps de recharge — niveau 9",
              "Reload Time — Level 9",
              blankUntil(9, 7),
              blankUntil(9, 8)
            ),

            change(
              r.clusterG,
              "nerf",
              "Pénalité de recharge — niveau 9",
              "Penalty Reload — Level 9",
              blankUntil(9, 7),
              blankUntil(9, 11)
            ),

            change(
              r.denkiSpecial,
              "buff",
              "Pénalité de recharge",
              "Penalty Reload",
              14,
              9
            ),

            change(
              r.kendoG,
              "nerf",
              "Durée de pénalité — niveaux 1 à 3",
              "Penalty duration — Levels 1 to 3",
              [1, 1, 1],
              [2, 2, 2]
            ),

            change(
              r.hawksA,
              "nerf",
              "Munitions",
              "Ammo",
              [40, 41, 42, 44, 45, 46, 47, 48, 50],
              [30, 31, 32, 34, 35, 36, 37, 38, 40]
            ),

            change(
              r.twiceG,
              "buff",
              "Temps de recharge",
              "Reload Time",
              Array(9).fill(5),
              Array(9).fill(4)
            ),

            change(
              r.twiceG,
              "buff",
              "Munitions — niveau 9",
              "Ammo — Level 9",
              blankUntil(9, 3),
              blankUntil(9, 4)
            ),

            change(
              r.twiceG,
              "nerf",
              "Pénalité de recharge — niveau 9",
              "Penalty Reload — Level 9",
              blankUntil(9, 6),
              blankUntil(9, 8)
            ),

            change(
              r.nagantA,
              "nerf",
              "Munitions",
              "Ammo",
              nagantAmmoBefore,
              nagantAmmoAfter
            ),

            change(
              r.nagantG,
              "nerf",
              "Temps de recharge",
              "Reload Time",
              [7, 7, 7, 5, 5, 5, 5, 5, 5],
              [9, 9, 9, 8, 8, 8, 8, 8, 7]
            ),

            change(
              r.nagantG,
              "nerf",
              "Pénalité de recharge — niveaux 1 à 8",
              "Penalty Reload — Levels 1 to 8",
              [7, 7, 7, 5, 5, 5, 5, 5],
              [9, 9, 9, 8, 8, 8, 8, 8]
            ),

            change(
              r.nagantG,
              "buff",
              "Pénalité de recharge — niveau 9",
              "Penalty Reload — Level 9",
              8,
              7
            ),

            change(
              r.nagantG,
              "nerf",
              "Munitions — niveau 9",
              "Ammo — Level 9",
              blankUntil(9, 2),
              blankUntil(9, 1)
            )
          ]
        },
        {
          title: bi(
            "Nouveau contenu ajouté depuis v1.16.3-Rc142",
            "New Content Added since v1.16.3-Rc142"
          ),
          changes: [
            change(
              r.shigarakiB,
              "adjust",
              "Nouvelle valeur interne : impact du corps, niveaux 1 à 9",
              "New internal value: Body Impact, Levels 1 to 9",
              null,
              null,
              [
                {
                  fr:
                    "Ajout détecté dans les données de l'Alter β.",
                  en:
                    "Detected as a new value in Quirk Skill β data."
                }
              ]
            ),

            change(
              r.gentleA,
              "adjust",
              "Nouveau personnage — Alter α",
              "New character — Quirk Skill α",
              null,
              null,
              [
                {
                  fr:
                    "Gently Arrow, niveaux 1 à 9.",
                  en:
                    "Gently Arrow, Levels 1 to 9."
                }
              ]
            ),

            change(
              r.gentleB,
              "adjust",
              "Nouveau personnage — Alter β",
              "New character — Quirk Skill β",
              null,
              null,
              [
                {
                  fr:
                    "Gently Rebound : barrière, onde de choc et projectile d'air, niveaux 1 à 9.",
                  en:
                    "Gently Rebound: barrier, shockwave and air projectile, Levels 1 to 9."
                }
              ]
            ),

            change(
              r.gentleG,
              "adjust",
              "Nouveau personnage — Alter γ",
              "New character — Quirk Skill γ",
              null,
              null,
              [
                {
                  fr:
                    "Gently Avant : charge, zone et impact final, niveaux 1 à 9.",
                  en:
                    "Gently Avant: charge, area and finisher, Levels 1 to 9."
                }
              ]
            ),

            change(
              r.gentleSpecial,
              "adjust",
              "Nouvelle action spéciale",
              "New Special Action",
              null,
              null,
              [
                {
                  fr:
                    "Gently Trampoline.",
                  en:
                    "Gently Trampoline."
                }
              ]
            )
          ]
        }
      ]
    };
  }

  function installPatchData() {
    if (
      !window.MHUR_HOME_DATA ||
      typeof window.MHUR_HOME_DATA !== "object"
    ) {
      return false;
    }

    const notes = Array.isArray(
      window.MHUR_HOME_DATA.patch_notes
    )
      ? window.MHUR_HOME_DATA.patch_notes
      : [];

    const filtered = notes.filter(note => {
      const id = String(note?.id || "");
      const title = norm(note?.title || "");

      return (
        id !== PATCH_ID &&
        !title.includes("v1 17 0 14 5")
      );
    });

    window.MHUR_HOME_DATA.patch_notes = [
      buildPatch(),
      ...filtered
    ];

    window.__MHUR_V553_PATCH_READY = true;
    return true;
  }

  function refreshOpenPatchModal() {
    const modal = document.getElementById(
      "s18NotesDevModalV10"
    );

    if (!modal?.classList.contains("open")) {
      return;
    }

    const patchButton = modal.querySelector(
      '[data-tab="patch"]'
    );

    if (
      patchButton &&
      patchButton.classList.contains("active")
    ) {
      /*
        Le rendu officiel est exposé par showPatch dans les objets Saison 18.
        Une réouverture propre garantit que la nouvelle donnée est lue.
      */
      const api =
        window.MHUR_S18_V14 ||
        window.MHUR_S18_V13 ||
        window.MHUR_S18_V10;

      api?.showPatch?.(0);
    }
  }

  function markNotificationRelease() {
    const items = document.querySelectorAll(
      ".mhurNoticeItem"
    );

    for (
      let index = 0;
      index < items.length;
      index += 1
    ) {
      const item = items[index];

      if (
        norm(item.textContent).includes(
          "mise a jour 5 53"
        ) ||
        norm(item.textContent).includes(
          "5 53 update"
        )
      ) {
        item.dataset.release = RELEASE_ID;
        item.classList.add(
          "mhurV553ReleaseNotice"
        );
      }
    }
  }

  function ensureReleaseNotification() {
    const notifications =
      window.MHUR_HUB?.notifications;

    if (
      !notifications ||
      typeof notifications.list !== "function" ||
      typeof notifications.save !== "function"
    ) {
      return false;
    }

    const storageKey =
      "mhur_release_notification_v553";

    let list = notifications.list();
    const already = list.some(item =>
      item?.release === RELEASE_ID ||
      String(item?.id || "") ===
        "mhur-release-v553"
    );

    if (!already) {
      list = list.filter(item =>
        !(
          norm(item?.title).includes(
            "mise a jour 5 53"
          ) ||
          norm(item?.title).includes(
            "5 53 update"
          )
        )
      );

      list.unshift({
        id: "mhur-release-v553",
        release: RELEASE_ID,
        title: FR()
          ? "Mise à jour 5.53"
          : "5.53 update",
        text: FR()
          ? [
              "• Patch v1.17.0-14.5 entièrement corrigé et traduit.",
              "• Buffs, nerfs et changements mixtes affichés avec les bonnes couleurs.",
              "• Noms des Alters repris directement depuis les données du site.",
              "• Bouton Retour maintenant fixé sur mobile.",
              "• Compteur de notifications non lues ajouté."
            ].join("\n")
          : [
              "• Patch v1.17.0-14.5 fully corrected and translated.",
              "• Buffs, nerfs and mixed changes now use the correct colors.",
              "• Quirk names are read directly from the website data.",
              "• Back button is now fixed on mobile.",
              "• Unread notification counter added."
            ].join("\n"),
        date: new Date().toISOString(),
        read: false
      });

      notifications.save(list);
      localStorage.setItem(storageKey, "1");
    } else {
      notifications.badge?.();
    }

    requestAnimationFrame(
      markNotificationRelease
    );

    return true;
  }

  function ensureBackState() {
    const app = document.getElementById("app");
    if (!app) return;

    let hasBack = false;

    try {
      hasBack = Boolean(
        app.querySelector(":scope > .back")
      );
    } catch (_) {
      hasBack = Boolean(
        app.querySelector(".back")
      );
    }

    app.classList.toggle(
      "mhurHasBackV57",
      hasBack
    );
  }

  function install() {
    const attempts = [
      0, 40, 120, 300, 700, 1400, 2600
    ];

    for (
      let index = 0;
      index < attempts.length;
      index += 1
    ) {
      setTimeout(() => {
        if (installPatchData()) {
          refreshOpenPatchModal();
        }

        ensureReleaseNotification();
        ensureBackState();
      }, attempts[index]);
    }

    document.addEventListener(
      "click",
      event => {
        if (
          event.target.closest(
            "#mhurPatchDevButtonV14," +
            ".mhurPatchDevButtonV14," +
            "[data-s18-notes-button]"
          )
        ) {
          installPatchData();
        }

        if (
          event.target.closest(
            "#mhurNoticeBell," +
            "[onclick*='notifications.open']"
          )
        ) {
          setTimeout(
            markNotificationRelease,
            20
          );
        }
      },
      true
    );

    window.addEventListener(
      "mhur:languagechange",
      () => {
        installPatchData();
        ensureReleaseNotification();
      }
    );

    const app = document.getElementById("app");

    if (app) {
      const observer = new MutationObserver(
        () => ensureBackState()
      );

      observer.observe(app, {
        childList: true,
        subtree: false
      });
    }

    const noticeObserver = new MutationObserver(
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
            const node =
              record.addedNodes[nodeIndex];

            if (!(node instanceof Element)) {
              continue;
            }

            if (
              node.id === "mhurNoticesModal" ||
              node.querySelector(
                "#mhurNoticesModal"
              )
            ) {
              requestAnimationFrame(
                markNotificationRelease
              );
            }
          }
        }
      }
    );

    noticeObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.MHUR_V553 = {
      buildPatch,
      installPatchData,
      ensureReleaseNotification,
      ensureBackState
    };

    console.info(
      "[MHUR] V553 : patch officiel, retour fixe et notifications actifs."
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
