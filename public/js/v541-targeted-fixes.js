/* ============================================================
   MHUR NEXUS — V541
   ============================================================ */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const CFG = window.MHUR_COMMUNITY_CONFIG || {};
  const API = String(CFG.supabaseUrl || "").replace(/\/+$/, "");
  const profileCache = new Map();
  const sanctionCache = new Map();

  function english() {
    return String(document.documentElement.lang || "fr").toLowerCase().startsWith("en");
  }
  function tx(fr, en) { return english() ? en : fr; }
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[c]);
  }

  /* ------------------------ hauteur mobile réelle ----------------------- */
  let headerFrame = 0;
  function measureMobileHeader() {
    cancelAnimationFrame(headerFrame);
    headerFrame = requestAnimationFrame(() => {
      if (!matchMedia("(max-width:760px)").matches) {
        document.documentElement.style.removeProperty("--mhur-v541-header-space");
        return;
      }
      const header = $("header.top[data-mhur-header-version='513'], header.top");
      if (!header) return;
      const height = Math.max(120, Math.ceil(header.getBoundingClientRect().height + 14));
      document.documentElement.style.setProperty("--mhur-v541-header-space", `${height}px`);
    });
  }

  /* ---------------------- Tier List / Gentle ---------------------------- */
  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function roleForText(text, imageSource) {
    const allText = normalize(`${text} ${imageSource}`);
    try {
      const styleEntries = Object.entries(window.styles || {});
      for (const [key, style] of styleEntries) {
        const portrait = normalize(style?.portrait || "");
        const name = normalize(typeof style?.name === "object"
          ? `${style.name.fr || ""} ${style.name.en || ""}` : style?.name || "");
        if ((portrait && allText.includes(portrait.split(" ").pop())) ||
            (name && allText.includes(name))) {
          return style?.role || "";
        }
      }
    } catch (_) {}

    if (/gentle criminal/.test(allText)) return "technical";
    if (/full bullet|attaque|attack/.test(allText)) return "attack";
    if (/vitesse|rapid|speed/.test(allText)) return "rapid";
    if (/technique|technical/.test(allText)) return "technical";
    if (/support/.test(allText)) return "support";
    if (/assaut|assault/.test(allText)) return "assault";
    return "";
  }

  function decorateTierLists(root = document) {
    const images = $$('[class*="tier" i] img, [id*="tier" i] img', root);
    images.forEach(img => {
      let card = img.closest("button,article,li,figure,div");
      if (!card) return;
      for (let i = 0; i < 3 && card.parentElement; i++) {
        if (card.textContent.trim().length > 1) break;
        card = card.parentElement;
      }
      const text = card.textContent || img.alt || "";
      const src = img.currentSrc || img.getAttribute("src") || "";

      if (/gentle criminal/i.test(text)) {
        img.src = "/assets/home/discounts/gentle_criminal_v531.png?v=541";
        img.removeAttribute("srcset");
      }

      const role = roleForText(text, src);
      if (!role) return;

      ["assault","attack","rapid","technical","support"].forEach(r =>
        card.classList.remove(`v541TierRole-${r}`)
      );
      card.classList.add(`v541TierRole-${role}`);

      const imageBox = img.parentElement;
      if (imageBox && imageBox !== card) {
        ["assault","attack","rapid","technical","support"].forEach(r =>
          imageBox.classList.remove(`v541TierRole-${r}`)
        );
        imageBox.classList.add(`v541TierRole-${role}`);
      }
    });
  }

  /* ------------------------ Recours enrichis ---------------------------- */
  async function api(path) {
    if (!API) return null;
    const runner = window.MHUR_AUTH?.fetch || fetch;
    const response = await runner(API + path, {
      headers: {"Content-Type":"application/json"}
    });
    if (!response.ok) return null;
    try { return await response.json(); } catch (_) { return null; }
  }

  async function getProfile(userId) {
    if (!userId) return null;
    if (profileCache.has(userId)) return profileCache.get(userId);
    const promise = api(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,username,avatar_url,provider&limit=1`)
      .then(rows => Array.isArray(rows) ? rows[0] || null : null);
    profileCache.set(userId, promise);
    return promise;
  }

  async function getSanction(userId, sanctionId) {
    const key = `${userId}|${sanctionId}`;
    if (sanctionCache.has(key)) return sanctionCache.get(key);
    const filters = sanctionId
      ? `sanction_id=eq.${encodeURIComponent(sanctionId)}`
      : `user_id=eq.${encodeURIComponent(userId)}`;
    const promise = api(`/rest/v1/user_moderation?${filters}&select=*&limit=1`)
      .then(rows => Array.isArray(rows) ? rows[0] || null : null);
    sanctionCache.set(key, promise);
    return promise;
  }

  function sanctionLabel(record) {
    if (!record) return tx("Sanction introuvable", "Sanction not found");
    if (record.banned_permanent) return tx("Bannissement définitif", "Permanent ban");
    if (record.banned_until && Date.parse(record.banned_until) > Date.now()) {
      return tx("Bannissement temporaire", "Temporary ban");
    }
    if (record.warning_message) return tx("Avertissement", "Warning");
    return tx("Sanction terminée", "Expired sanction");
  }

  async function enrichAppealCard(card) {
    if (card.dataset.v541AppealReady) return;
    const text = card.textContent || "";
    const ids = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/ig) || [];
    const userId = ids[0] || "";
    const sanctionId = ids[1] || "";
    if (!userId) return;

    card.dataset.v541AppealReady = "loading";
    const [profile, sanction] = await Promise.all([
      getProfile(userId),
      getSanction(userId, sanctionId)
    ]);

    const old = $(".v541AppealIdentity", card);
    if (old) old.remove();

    const identity = document.createElement("div");
    identity.className = "v541AppealIdentity";
    const reason = sanction?.ban_reason || sanction?.warning_message || tx("Aucun motif enregistré.", "No reason saved.");
    const until = sanction?.banned_until
      ? new Date(sanction.banned_until).toLocaleString()
      : "";
    identity.innerHTML =
      `<strong>👤 ${esc(profile?.username || tx("Utilisateur inconnu", "Unknown user"))}</strong>` +
      `<span>${esc(userId)}</span>` +
      `<span class="v541AppealSanction">${esc(sanctionLabel(sanction))}</span>` +
      `<small><b>${esc(tx("Motif", "Reason"))} :</b> ${esc(reason)}</small>` +
      (until ? `<small><b>${esc(tx("Fin", "End"))} :</b> ${esc(until)}</small>` : "") +
      (sanctionId ? `<small><b>ID sanction :</b> ${esc(sanctionId)}</small>` : "");

    const header = card.querySelector("header");
    if (header) header.insertAdjacentElement("afterend", identity);
    else card.prepend(identity);
    card.dataset.v541AppealReady = "1";
  }

  function enrichAppeals(root = document) {
    $$(".mhurV539Item", root).forEach(card => {
      if (/recours|appeal/i.test(card.textContent || "")) void enrichAppealCard(card);
    });
  }

  /* ---------------- Retour vers le centre de modération ----------------- */
  function closeModerationSubview(node) {
    const dialog = node.closest("dialog");
    if (dialog) {
      try { dialog.close(); } catch (_) { dialog.removeAttribute("open"); }
    }
    const overlay = node.closest(
      ".mhurModerationOverlay,.s18AdminOverlayV10,.mhurV539Overlay,[class*='Overlay'],[class*='overlay']"
    );
    if (overlay && overlay.id !== "mhurV539Hub") {
      overlay.classList.remove("open");
      overlay.hidden = true;
    }
    setTimeout(() => window.MHUR_V539?.openHub?.(), 30);
  }

  function addModerationBackButtons(root = document) {
    const candidates = $$(
      ".mhurModerationOverlay.open,#s18AdminCenterV10.open,dialog[open],.mhurV539Overlay.open",
      root
    );
    candidates.forEach(panel => {
      if (panel.id === "mhurV539Hub") return;
      const text = normalize(panel.textContent);
      if (!/(signalement|report|suppression|deletion|profil|player|moderation)/.test(text)) return;
      const target =
        panel.querySelector(".mhurAdminBody,.mhurAdminPanelV10>main,.mhurV539Body,main,section") ||
        panel;
      if (target.querySelector(":scope > .v541ModerationBack")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "v541ModerationBack";
      button.textContent = `← ${tx("Retour au centre de modération", "Back to moderation center")}`;
      button.addEventListener("click", () => closeModerationSubview(button));
      target.prepend(button);
    });
  }

  /* ------------------------------- Install ------------------------------ */
  function run(root = document) {
    measureMobileHeader();
    decorateTierLists(root);
    enrichAppeals(root);
    addModerationBackButtons(root);
  }

  function install() {
    run(document);
    addEventListener("resize", measureMobileHeader, {passive:true});
    addEventListener("orientationchange", measureMobileHeader, {passive:true});
    addEventListener("pageshow", measureMobileHeader, {passive:true});

    const header = $("header.top");
    if (header && "ResizeObserver" in window) {
      new ResizeObserver(measureMobileHeader).observe(header);
    }

    const observer = new MutationObserver(records => {
      for (const record of records) {
        record.addedNodes.forEach(node => {
          if (node instanceof Element) run(node);
        });
      }
      run(document);
    });
    observer.observe(document.body, {childList:true,subtree:true});

    window.addEventListener("mhur:languagechange", () => run(document));
    console.info("[MHUR] Correctif ciblé V541 actif.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, {once:true});
  } else {
    install();
  }
})();
