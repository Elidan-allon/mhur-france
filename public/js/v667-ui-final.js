(() => {
  'use strict';

  const BUILD = "667-6207f2438790";
  const root = document.documentElement;
  const startedAt =
    Number(window.__MHUR_V667_STARTED_AT) ||
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
          'img:not([data-mhur-v667-image])'
        )
      : [];

    images.forEach((image, index) => {
      image.dataset.mhurV667Image = '1';
      image.decoding = 'async';

      if (image.closest('#mhurV667Splash')) return;

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

    const fill = document.getElementById('mhurV667Fill');
    const percent = document.getElementById('mhurV667Percent');
    const status = document.getElementById('mhurV667Status');

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
          root.classList.remove('mhur-v667-booting');
          root.classList.add('mhur-v667-ready');
          root.dataset.mhurBuild = BUILD;

          setTimeout(() => {
            document.getElementById('mhurV667Splash')?.remove();
          }, 360);

          window.dispatchEvent(
            new CustomEvent('mhur:v667-ready', {
              detail: { build: BUILD }
            })
          );
        });
      });
    }, wait);
  }

  function start() {
    beginProgress();
    scanCanonical(document);
    tuneImages(document);

    new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(handleAddedNode);
      }
    }).observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    setTimeout(() => scanCanonical(document), 60);
    setTimeout(() => scanCanonical(document), 240);
    setTimeout(() => scanCanonical(document), 850);

    finishReveal();
  }

  document.addEventListener(
    'click',
    () => {
      setTimeout(() => scanCanonical(document), 0);
      setTimeout(() => scanCanonical(document), 100);
    },
    true
  );

  window.addEventListener(
    'mhur:languagechange',
    () => scanCanonical(document)
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

  /* Le site ne reste jamais bloqué derrière le splash. */
  setTimeout(finishReveal, 3800);

  window.MHUR_V667 = {
    build: BUILD,
    refreshNew: () => scanCanonical(document),
    cleanOwner
  };
})();
