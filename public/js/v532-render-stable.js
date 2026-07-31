/* ============================================================
   MHUR FRANCE — V532
   Empêche les rendus tardifs d'envoyer l'utilisateur ailleurs
   dans la page. Le scroll est conservé seulement si la page
   interne n'a pas changé.
   ============================================================ */
(() => {
  "use strict";

  function currentInternalPage() {
    try {
      if (typeof page !== "undefined") return String(page || "");
    } catch (_) {}

    return String(window.page || "");
  }

  function installStableRender() {
    if (
      typeof window.render !== "function" ||
      window.render.__mhurV532Stable
    ) {
      return;
    }

    const original = window.render;

    const stable = function () {
      const beforePage = currentInternalPage();
      const x = window.scrollX || 0;
      const y = window.scrollY || 0;

      const result = original.apply(this, arguments);
      const afterPage = currentInternalPage();

      /*
        Lors d'un vrai changement de rubrique, le comportement normal
        reste inchangé. Lors d'un second rendu tardif de la même page,
        la position visible est conservée.
      */
      if (beforePage === afterPage && (x > 0 || y > 0)) {
        requestAnimationFrame(() => {
          window.scrollTo({ left: x, top: y, behavior: "auto" });
        });
      }

      return result;
    };

    stable.__mhurV532Stable = true;
    window.render = stable;

    try {
      render = stable;
    } catch (_) {}
  }

  function install() {
    installStableRender();
    document.documentElement.classList.add("mhur-v532-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }

  window.addEventListener("mhur:languagechange", installStableRender);
})();
