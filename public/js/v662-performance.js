(() => {
  'use strict';

  const BUILD = "662-271b70d1d145";
  const root = document.documentElement;
  let revealed = false;
  let scheduled = false;

  function tuneImages() {
    document
      .querySelectorAll('img:not([data-mhur-v662-image])')
      .forEach((image, index) => {
        image.dataset.mhurV662Image = '1';
        image.decoding = 'async';

        const rect = image.getBoundingClientRect();
        const visible =
          rect.top < window.innerHeight * 1.35 &&
          rect.bottom > -100;

        if (!visible || index > 12) {
          image.loading = 'lazy';
          image.fetchPriority = 'low';
        }
      });
  }

  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;

    const run = () => {
      scheduled = false;
      tuneImages();
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 700 });
    } else {
      setTimeout(run, 50);
    }
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    scheduleScan();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('mhur-v662-booting');
        root.classList.add('mhur-v662-ready');
        root.dataset.mhurBuild = BUILD;
      });
    });
  }

  function start() {
    new MutationObserver(scheduleScan).observe(document.body, {
      childList: true,
      subtree: true
    });
    reveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  setTimeout(reveal, 3500);
})();
