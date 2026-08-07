(() => {
  'use strict';

  const CURRENT = "679-257aeb174dc9";
  const RELOAD_KEY = 'mhur-v674-reloaded-build';
  let checking = false;

  async function remoteBuild() {
    const response = await fetch(
      `/version.json?t=${Date.now()}`,
      {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      }
    );

    if (!response.ok) {
      throw new Error(`version ${response.status}`);
    }

    const data = await response.json();
    return String(data?.build || data?.version || '');
  }

  async function registerWorker() {
    if (
      !('serviceWorker' in navigator) ||
      location.protocol !== 'https:'
    ) {
      return;
    }

    const registrations =
      await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      const script =
        registration.active?.scriptURL ||
        registration.waiting?.scriptURL ||
        registration.installing?.scriptURL ||
        '';

      if (script && !script.includes('/service-worker.js')) {
        await registration.unregister();
      }
    }

    const registration = await navigator.serviceWorker.register(
      `/service-worker.js?v=${encodeURIComponent(CURRENT)}`,
      {
        scope: '/',
        updateViaCache: 'none'
      }
    );

    await registration.update();
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
  }

  async function check() {
    if (
      checking ||
      document.visibilityState === 'hidden' ||
      !navigator.onLine
    ) {
      return;
    }

    checking = true;

    try {
      const remote = await remoteBuild();

      if (!remote || remote === CURRENT) return;

      await registerWorker();

      if (sessionStorage.getItem(RELOAD_KEY) === remote) {
        return;
      }

      sessionStorage.setItem(RELOAD_KEY, remote);
      location.reload();
    } catch (error) {
      console.debug('MHUR update check:', error);
    } finally {
      checking = false;
    }
  }

  addEventListener(
    'load',
    async () => {
      try {
        await registerWorker();
      } catch (error) {
        console.debug('MHUR service worker:', error);
      }

      check();
      setInterval(check, 300000);
    },
    { once: true }
  );

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });

  addEventListener('online', check);
})();
