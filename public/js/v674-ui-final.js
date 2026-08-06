(() => {
  'use strict';

  const BUILD = "674-bc9343612019";
  const root = document.documentElement;
  const startedAt =
    Number(window.__MHUR_V674_STARTED_AT) ||
    performance.now();

  const OWNER_SELECTOR = [
    '.card[data-char]',
    '.styleCard[data-style]',
    '.costumeTile',
    '.costumeCard',
    '.costumeResult'
  ].join(',');

  const LEGACY_SELECTOR = [
    '.s18NewBadge',
    '.s18NewBadgeV9',
    '.releaseNewBadgeV9',
    '.s18SeasonNewV10',
    '.s18PlannedNewV12',
    '[class*="NewBadge"]',
    '[class*="newBadge"]',
    '[class*="NewPulse"]',
    '[class*="newPulse"]',
    '[class*="NewSticker"]',
    '[class*="newSticker"]',
    '[class*="NewTag"]',
    '[class*="newTag"]',
    '[class*="CostumeNew"]',
    '[class*="CharacterNew"]',
    '[class*="StyleNew"]',
    '[class*="mhurNew"]:not(.mhurNewV582)',
    '[aria-label="NEW"]:not(.mhurNewV582)',
    'img[src*="new_badge"]:not(.mhurNewV582)'
  ].join(',');

  const pendingOwners = new Set();
  let ownerFrame = 0;
  let revealed = false;
  let currentProgress = 7;
  let progressTimer = 0;
  let patchFixFrame = 0;
  let patchFixRunning = false;
  let pendingPatchScope = null;

  function cleanupOldSplashArtifacts() {
    document.querySelectorAll(
      '[id^="mhurV66"][id$="Splash"]'
    ).forEach(node => {
      if (node.id !== 'mhurV674Splash') node.remove();
    });

    document.querySelectorAll(
      '[class*="mhurV66"][class*="Hero"]'
    ).forEach(node => {
      if (!node.closest('#mhurV674Splash')) node.remove();
    });

    document.querySelectorAll(
      '[id*="LeftHeroImage"],' +
      '[id*="RightHeroImage"],' +
      '[id*="MiniHeroImage"]'
    ).forEach(node => {
      if (!node.closest('#mhurV674Splash')) {
        (node.closest('figure,div') || node).remove();
      }
    });
  }

  function patchLanguage() {
    try {
      if (typeof lang !== 'undefined' && lang === 'en') {
        return 'en';
      }
    } catch (_error) {}

    return String(document.documentElement.lang || '')
      .toLowerCase()
      .startsWith('en')
      ? 'en'
      : 'fr';
  }

  function fixPatchByIds(scope = document) {
    if (patchFixRunning) return;

    patchFixRunning = true;

    try {
      const articleSelector = [
        'article.s18PatchCharacterV10',
        '[data-v608-character-id="armored_all_might"]',
        '[data-v608-style="armored_all_might_technical"]'
      ].join('');

      const articles = new Set();

      if (scope instanceof Element) {
        if (scope.matches(articleSelector)) {
          articles.add(scope);
        }

        const parent = scope.closest?.(articleSelector);
        if (parent) articles.add(parent);
      }

      scope.querySelectorAll?.(articleSelector).forEach(article => {
        articles.add(article);
      });

      const expectedBefore = [
        52, 54, 56, 58, 60, 62, 64, 66, 68
      ];
      const expectedAfter = [
        48, 50, 52, 54, 55, 56, 57, 58, 60
      ];

      const values = (card, selector) => [
        ...card.querySelectorAll(selector)
      ]
        .map(cell =>
          Number(
            String(cell.textContent || '')
              .trim()
              .replace(',', '.')
          )
        )
        .filter(Number.isFinite);

      const same = (left, right) =>
        left.length === right.length &&
        left.every(
          (value, index) =>
            Math.abs(value - right[index]) < 0.001
        );

      const setDataset = (element, key, value) => {
        if (element.dataset[key] !== value) {
          element.dataset[key] = value;
        }
      };

      const sameAsset = (current, expected) => {
        try {
          return new URL(
            current,
            location.origin
          ).pathname === expected;
        } catch (_error) {
          return String(current || '').split('?')[0] === expected;
        }
      };

      articles.forEach(article => {
        article.querySelectorAll(
          '.s18PatchChangeV10'
        ).forEach(card => {
          const skillId =
            card.dataset.v608SkillId || '';

          const isTarget =
            skillId === 'armored_all_might_alpha_burn' ||
            (
              same(
                values(card, 'tr.before td'),
                expectedBefore
              ) &&
              same(
                values(card, 'tr.after td'),
                expectedAfter
              )
            );

          if (!isTarget) return;

          setDataset(
            card,
            'v608CharacterId',
            'armored_all_might'
          );
          setDataset(
            card,
            'v608Style',
            'armored_all_might_technical'
          );
          setDataset(
            card,
            'v608SkillId',
            'armored_all_might_alpha_burn'
          );

          const expectedTitle =
            patchLanguage() === 'en'
              ? 'α - Ice Bullet Shot (Burn)'
              : 'α - Ice Bullet Shot (Brûlure)';

          const title = card.querySelector('h5');

          if (
            title &&
            String(title.textContent || '').trim() !== expectedTitle
          ) {
            title.textContent = expectedTitle;
          }

          const expectedImage =
            '/assets/armored_all_might/' +
            'armored_all_might_technical/alpha.webp';

          let image = card.querySelector(
            '.s18PatchImageV608 img,' +
            '.s18PatchSkillV10 img'
          );

          if (!image) {
            const skill = card.querySelector(
              '.s18PatchSkillV10'
            );

            if (skill) {
              let wrapper = skill.querySelector(
                ':scope > .s18PatchImageV608'
              );

              if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 's18PatchImageV608';
                skill.prepend(wrapper);
              }

              image = wrapper.querySelector('img');

              if (!image) {
                image = document.createElement('img');
                wrapper.appendChild(image);
              }

              skill.classList.remove(
                's18NoSkillImageV608'
              );
            }
          }

          if (image) {
            if (!sameAsset(image.currentSrc || image.src, expectedImage)) {
              image.setAttribute('src', expectedImage);
            }

            if (image.getAttribute('alt') !== expectedTitle) {
              image.setAttribute('alt', expectedTitle);
            }

            if (image.getAttribute('loading') !== 'eager') {
              image.setAttribute('loading', 'eager');
            }

            if (image.getAttribute('decoding') !== 'async') {
              image.setAttribute('decoding', 'async');
            }
          }
        });
      });
    } finally {
      patchFixRunning = false;
    }
  }

  function schedulePatchFix(scope = document) {
    pendingPatchScope = scope || document;

    if (patchFixFrame) return;

    patchFixFrame = requestAnimationFrame(() => {
      patchFixFrame = 0;
      const target = pendingPatchScope || document;
      pendingPatchScope = null;
      fixPatchByIds(target);
    });
  }

  function releaseInteractions() {
    root.classList.remove('mhur-v674-booting');
    root.classList.add('mhur-v674-ready');

    document.documentElement.style.removeProperty(
      'pointer-events'
    );

    document.body?.style.removeProperty(
      'pointer-events'
    );

    const splash = document.getElementById(
      'mhurV674Splash'
    );

    if (splash) {
      splash.style.setProperty(
        'pointer-events',
        'none',
        'important'
      );
      splash.style.setProperty(
        'display',
        'none',
        'important'
      );
      splash.remove();
    }
  }

  function depth(node) {
    let value = 0;
    let cursor = node;

    while (cursor?.parentElement) {
      value += 1;
      cursor = cursor.parentElement;
    }

    return value;
  }

  function directCanonical(owner) {
    try {
      return [
        ...owner.querySelectorAll(':scope > .mhurNewV582')
      ];
    } catch (_error) {
      return [...owner.children].filter(
        child => child.classList?.contains('mhurNewV582')
      );
    }
  }

  function isInsideDifferentOwner(node, owner) {
    const marked = node.closest?.('[data-mhur-new-owner="1"]');
    return Boolean(marked && marked !== owner);
  }

  function cleanOwner(owner) {
    if (!(owner instanceof Element)) return;

    const canonical = directCanonical(owner);

    if (!canonical.length) {
      owner.removeAttribute('data-mhur-new-owner');
      return;
    }

    owner.dataset.mhurNewOwner = '1';

    canonical.slice(1).forEach(node => node.remove());

    owner.querySelectorAll(LEGACY_SELECTOR).forEach(node => {
      if (node.classList?.contains('mhurNewV582')) return;
      if (isInsideDifferentOwner(node, owner)) return;

      const parent = node.parentElement;
      node.remove();

      if (
        parent &&
        parent !== owner &&
        parent.childElementCount === 0 &&
        !String(parent.textContent || '').trim() &&
        !parent.matches('picture,slot')
      ) {
        parent.remove();
      }
    });
  }

  function flushOwners() {
    ownerFrame = 0;

    [...pendingOwners]
      .sort((a, b) => depth(b) - depth(a))
      .forEach(cleanOwner);

    pendingOwners.clear();
  }

  function queueOwner(owner) {
    if (!(owner instanceof Element)) return;

    pendingOwners.add(owner);

    if (!ownerFrame) {
      ownerFrame = requestAnimationFrame(flushOwners);
    }
  }

  function scanCanonical(scope = document) {
    if (scope instanceof Element) {
      if (scope.classList.contains('mhurNewV582')) {
        queueOwner(scope.parentElement);
      }

      if (scope.matches(OWNER_SELECTOR)) {
        directCanonical(scope).forEach(() => queueOwner(scope));
      }
    }

    scope.querySelectorAll?.('.mhurNewV582').forEach(
      badge => queueOwner(badge.parentElement)
    );
  }

  function handleAddedNode(node) {
    if (!(node instanceof Element)) return;

    schedulePatchFix(node);
    scanCanonical(node);

    if (node.matches(LEGACY_SELECTOR)) {
      const owner =
        node.closest('[data-mhur-new-owner="1"]') ||
        node.closest(OWNER_SELECTOR);

      if (owner?.querySelector(':scope > .mhurNewV582')) {
        queueOwner(owner);
      }
    }

    node.querySelectorAll?.(LEGACY_SELECTOR).forEach(legacy => {
      const owner =
        legacy.closest('[data-mhur-new-owner="1"]') ||
        legacy.closest(OWNER_SELECTOR);

      if (owner?.querySelector(':scope > .mhurNewV582')) {
        queueOwner(owner);
      }
    });
  }

  function tuneImages(scope = document) {
    const images = scope.querySelectorAll
      ? scope.querySelectorAll(
          'img:not([data-mhur-v674-image])'
        )
      : [];

    images.forEach((image, index) => {
      image.dataset.mhurV674Image = '1';
      image.decoding = 'async';

      if (image.closest('#mhurV674Splash')) return;

      const rect = image.getBoundingClientRect();
      const visible =
        rect.top < window.innerHeight * 1.45 &&
        rect.bottom > -120;

      if (!visible || index > 14) {
        image.loading = 'lazy';
        image.fetchPriority = 'low';
      }
    });
  }

  function statusFor(progress) {
    if (progress < 24) return 'Initialisation de MHUR France…';
    if (progress < 44) return 'Synchronisation des personnages…';
    if (progress < 62) return 'Préparation des Alters et compétences…';
    if (progress < 79) return 'Chargement des costumes et T.U.N.I.N.G…';
    if (progress < 94) return 'Application des dernières données…';
    if (progress < 100) return 'Finalisation de l’interface…';
    return 'Prêt !';
  }

  function setProgress(value) {
    currentProgress = Math.max(
      currentProgress,
      Math.min(100, Math.round(value))
    );

    const fill = document.getElementById('mhurV674Fill');
    const percent = document.getElementById('mhurV674Percent');
    const status = document.getElementById('mhurV674Status');

    if (fill) fill.style.width = `${currentProgress}%`;
    if (percent) percent.textContent = `${currentProgress}%`;
    if (status) status.textContent = statusFor(currentProgress);
  }

  function beginProgress() {
    setProgress(9);

    progressTimer = window.setInterval(() => {
      if (currentProgress >= 92) return;

      const remaining = 92 - currentProgress;
      const gain = Math.max(
        1,
        Math.ceil(remaining * (Math.random() * .11 + .045))
      );

      setProgress(currentProgress + gain);
    }, 125);
  }

  function finishReveal() {
    if (revealed) return;
    revealed = true;

    clearInterval(progressTimer);
    scanCanonical(document);
    tuneImages(document);
    setProgress(100);

    const elapsed = performance.now() - startedAt;
    const wait = Math.max(230, 760 - elapsed);

    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.classList.remove('mhur-v674-booting');
          root.classList.add('mhur-v674-ready');
          root.dataset.mhurBuild = BUILD;

          releaseInteractions();

          window.dispatchEvent(
            new CustomEvent('mhur:v674-ready', {
              detail: { build: BUILD }
            })
          );
        });
      });
    }, wait);
  }

  function start() {
    cleanupOldSplashArtifacts();
    beginProgress();
    schedulePatchFix(document);
    scanCanonical(document);
    tuneImages(document);

    new MutationObserver(mutations => {
      let patchChanged = false;

      for (const mutation of mutations) {
        mutation.addedNodes.forEach(handleAddedNode);

        if (mutation.addedNodes.length > 0) {
          patchChanged = true;
        }
      }

      if (patchChanged) {
        schedulePatchFix(document);
      }
    }).observe(document.documentElement, {
      childList: true,
      subtree: true
    });


    setTimeout(() => {
      schedulePatchFix(document);
      scanCanonical(document);
    }, 60);
    setTimeout(() => {
      schedulePatchFix(document);
      scanCanonical(document);
    }, 240);
    setTimeout(() => {
      schedulePatchFix(document);
      scanCanonical(document);
    }, 850);

    finishReveal();
  }

  document.addEventListener(
    'click',
    () => {
      setTimeout(() => {
        schedulePatchFix(document);
        scanCanonical(document);
      }, 0);
      setTimeout(() => {
        schedulePatchFix(document);
        scanCanonical(document);
      }, 100);
    },
    true
  );

  window.addEventListener(
    'mhur:languagechange',
    () => {
      schedulePatchFix(document);
      scanCanonical(document);
    }
  );

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      start,
      { once: true }
    );
  } else {
    start();
  }

  /* Le site ne reste jamais bloqué ou non cliquable. */
  setTimeout(() => {
    releaseInteractions();

    if (!revealed) {
      finishReveal();
    }
  }, 2600);

  window.MHUR_V674 = {
    build: BUILD,
    refreshNew: () => scanCanonical(document),
    fixPatchByIds: () => schedulePatchFix(document),
    releaseInteractions,
    cleanOwner
  };
})();
