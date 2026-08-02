/*
  MHUR FRANCE — CORRECTIF V558
  Verrouille les portraits des réductions de points personnage.
  Factor Fusion = All For One (Strike), jamais Overhaul.
*/
(() => {
  "use strict";

  const CANONICAL_DISCOUNTS = [
    {
      name: "D.J. Board",
      points: 100,
      image: "assets/present_mic/present_mic_technical/portrait.webp",
      character: "Present Mic",
      style: "Technical",
      style_id: "present_mic_technical",
      role: "technical"
    },
    {
      name: "Flow Runner",
      points: 100,
      image: "assets/aizawa/aizawa_strike/portrait.webp",
      character: "Shota Aizawa",
      style: "Strike",
      style_id: "aizawa_strike",
      role: "strike"
    },
    {
      name: "Gentle Criminal",
      points: 100,
      image: "assets/home/discounts/gentle_criminal_v531.png?v=531",
      character: "Gentle Criminal",
      style: "Technical",
      style_id: "gentle_criminal",
      role: "technical"
    },
    {
      name: "Factor Fusion",
      points: 50,
      image: "assets/all_for_one/all_for_one_strike/portrait.png",
      character: "All For One",
      style: "Strike",
      style_id: "all_for_one_strike",
      role: "strike"
    },
    {
      name: "Cluster",
      points: 50,
      image: "assets/bakugo/bakugo_technical/portrait.webp",
      character: "Katsuki Bakugo",
      style: "Technical",
      style_id: "bakugo_technical",
      role: "technical"
    },
    {
      name: "Mirko",
      points: 50,
      image: "assets/mirko/mirko_rapid/portrait.webp",
      character: "Mirko",
      style: "Rapid",
      style_id: "mirko_rapid",
      role: "speed"
    }
  ];

  const normalize = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const byName = new Map(CANONICAL_DISCOUNTS.map(item => [normalize(item.name), item]));

  function assetUrl(path) {
    const raw = String(path || "").trim();
    if (!raw) return "";
    if (/^(?:https?:|data:|blob:)/i.test(raw)) return raw;
    try {
      if (typeof rootAsset === "function") return rootAsset(raw.replace(/^\/+/, ""));
    } catch (_) {}
    return new URL(raw.replace(/^\/+/, ""), document.baseURI).href;
  }

  function cloneDiscounts() {
    return CANONICAL_DISCOUNTS.map(item => ({ ...item }));
  }

  function lockData() {
    if (!window.MHUR_HOME_DATA || typeof window.MHUR_HOME_DATA !== "object") return;
    const current = Array.isArray(window.MHUR_HOME_DATA.discounts)
      ? window.MHUR_HOME_DATA.discounts
      : [];
    const signature = current.map(item => `${normalize(item?.name)}:${item?.points}:${item?.image}`).join("|");
    const wanted = CANONICAL_DISCOUNTS.map(item => `${normalize(item.name)}:${item.points}:${item.image}`).join("|");
    if (signature !== wanted) window.MHUR_HOME_DATA.discounts = cloneDiscounts();
  }

  function patchCard(card) {
    if (!(card instanceof HTMLElement)) return;
    const name = normalize(card.querySelector(":scope > b")?.textContent || card.dataset.discount || "");
    const item = byName.get(name);
    if (!item) return;
    const image = card.querySelector("img");
    if (!(image instanceof HTMLImageElement)) return;
    const desired = assetUrl(item.image);
    if (!desired) return;
    if (image.src !== desired) image.src = desired;
    image.dataset.fallback = desired;
    image.removeAttribute("srcset");
    image.removeAttribute("sizes");
    image.alt = item.name;
    image.dataset.v558DiscountPortrait = "1";
    card.dataset.v558Character = item.character;
    card.dataset.v558Style = item.style_id;
  }

  function patchGrid(root = document) {
    lockData();
    root.querySelectorAll?.(".discountGridV296 .discountCardV296").forEach(patchCard);
  }

  function patchDashboardHtml(html) {
    if (typeof html !== "string" || !html.includes("discountGridV296")) return html;
    try {
      const template = document.createElement("template");
      template.innerHTML = html.trim();
      patchGrid(template.content);
      return template.innerHTML;
    } catch (_) {
      return html;
    }
  }

  function wrapDashboard() {
    lockData();
    const current = window.renderHomeDashboard;
    if (typeof current !== "function" || current.__mhurV558DiscountLock) return;
    const wrapped = function (...args) {
      lockData();
      return patchDashboardHtml(current.apply(this, args));
    };
    wrapped.__mhurV558DiscountLock = true;
    wrapped.__mhurV558Original = current;
    window.renderHomeDashboard = wrapped;
    try { renderHomeDashboard = wrapped; } catch (_) {}
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      wrapDashboard();
      patchGrid(document);
    });
  }

  wrapDashboard();
  patchGrid(document);

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  }
  window.addEventListener("mhur:languagechange", schedule);
  window.addEventListener("mhur-auth-change", schedule);
  window.addEventListener("mhur-role-change", schedule);
  setTimeout(schedule, 100);
  setTimeout(schedule, 600);

  window.MHUR_V558_DISCOUNT_LOCK = {
    apply: schedule,
    discounts: cloneDiscounts
  };
})();
