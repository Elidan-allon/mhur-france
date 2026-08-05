(() => {
  'use strict';

  const BUILD = "663-db1d3bf81ac3";
  const root = document.documentElement;
  const CARD_SELECTOR = [
    '.costumeTile',
    '.costumeCard',
    '.costumeResult',
    '[data-costume-id]',
    '[data-costume]'
  ].join(',');

  const LEGACY_SELECTOR = [
    '.s18NewBadge',
    '[class*="s18NewBadge"]',
    '[class*="s18NewPulse"]',
    '[class*="s18CostumeNew"]',
    '[class*="mhurNew"]:not(.mhurNewV582)',
    '[aria-label="NEW"]:not(.mhurNewV582)',
    'img[src*="new_badge"]:not(.mhurNewV582)'
  ].join(',');

  let revealed = false;
  let queued = false;

  function directChildren(card, selector) {
    try {
      return [...card.querySelectorAll(`:scope > ${selector}`)];
    } catch (_error) {
      return [...card.children].filter(child => child.matches?.(selector));
    }
  }

  function dedupeCard(card) {
    if (!card) return;

    const canonical = directChildren(card, '.mhurNewV582');

    canonical.slice(1).forEach(node => node.remove());

    directChildren(card, LEGACY_SELECTOR).forEach(node => {
      if (!node.classList?.contains('mhurNewV582')) {
        node.remove();
      }
    });

    /*
      Certains anciens scripts placent le badge dans un petit wrapper.
      On retire uniquement les wrappers qui ne contiennent rien d'autre.
    */
    card.querySelectorAll(LEGACY_SELECTOR).forEach(node => {
      if (node.classList?.contains('mhurNewV582')) return;

      const parent = node.parentElement;
      node.remove();

      if (
        parent &&
        parent !== card &&
        parent.childElementCount === 0 &&
        !String(parent.textContent || '').trim()
      ) {
        parent.remove();
      }
    });
  }

  function dedupeAll(scope = document) {
    const cards = [];

    if (scope.matches?.(CARD_SELECTOR)) {
      cards.push(scope);
    }

    if (scope.querySelectorAll) {
      cards.push(...scope.querySelectorAll(CARD_SELECTOR));
    }

    [...new Set(cards)].forEach(dedupeCard);
  }

  function tuneImages(scope = document) {
    scope
      .querySelectorAll?.('img:not([data-mhur-v663-image])')
      .forEach((image, index) => {
        image.dataset.mhurV663Image = '1';
        image.decoding = 'async';

        const rect = image.getBoundingClientRect();
        const visible =
          rect.top < window.innerHeight * 1.4 &&
          rect.bottom > -100;

        if (!visible || index > 12) {
          image.loading = 'lazy';
          image.fetchPriority = 'low';
        }
      });
  }

  function work(scope = document) {
    dedupeAll(scope);
    tuneImages(scope);
  }

  function schedule(scope = document) {
    if (queued) return;
    queued = true;

    requestAnimationFrame(() => {
      queued = false;
      work(scope);
    });
  }

  function reveal() {
    if (revealed) return;
    revealed = true;

    work(document);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('mhur-v663-booting');
        root.classList.add('mhur-v663-ready');
        root.dataset.mhurBuild = BUILD;

        const splash = document.getElementById('mhurV663Splash');

        if (splash) {
          setTimeout(() => splash.remove(), 280);
        }

        window.dispatchEvent(
          new CustomEvent('mhur:v663-ready', {
            detail: { build: BUILD }
          })
        );
      });
    });
  }

  function start() {
    new MutationObserver(mutations => {
      const added = mutations.flatMap(mutation =>
        [...(mutation.addedNodes || [])]
      );

      if (!added.length) return;

      schedule(document);
    }).observe(document.body, {
      childList: true,
      subtree: true
    });

    reveal();

    setTimeout(() => schedule(document), 80);
    setTimeout(() => schedule(document), 300);
    setTimeout(() => schedule(document), 900);
  }

  document.addEventListener(
    'click',
    event => {
      if (
        event.target?.closest?.(
          '.costumeTile,.costumeCard,.costumeResult,' +
          '[data-costume-id],[data-costume]'
        )
      ) {
        setTimeout(() => schedule(document), 0);
        setTimeout(() => schedule(document), 100);
      }
    },
    true
  );

  window.addEventListener('mhur:languagechange', () => {
    schedule(document);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  /* Sécurité : le site ne reste jamais bloqué derrière le splash. */
  setTimeout(reveal, 3500);

  window.MHUR_V663 = {
    build: BUILD,
    refresh: () => schedule(document),
    dedupe: dedupeAll
  };
})();
