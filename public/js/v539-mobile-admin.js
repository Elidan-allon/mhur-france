/* ========================================================================== */
/* MHUR NEXUS — V539 : correctifs mobiles + boîte de réception modération    */
/* ========================================================================== */
(() => {
  'use strict';

  const CFG = window.MHUR_COMMUNITY_CONFIG || {};
  const API = String(CFG.supabaseUrl || '').replace(/\/+$/, '');
  const PATCH_SELECTOR = '#mhurPatchDevButtonV14,.mhurPatchDevButtonV14,[data-s18-notes-button]';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const lang = () => String(document.documentElement.lang || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
  const tx = (fr, en) => lang() === 'en' ? en : fr;
  const user = () => window.MHUR_AUTH?.getUser?.() || null;

  async function api(path, options = {}) {
    if (!API) throw new Error(tx('Supabase n’est pas configuré.','Supabase is not configured.'));
    const runner = window.MHUR_AUTH?.fetch || fetch;
    const response = await runner(API + path, {
      ...options,
      headers: {'Content-Type':'application/json', ...(options.headers || {})}
    });
    const raw = await response.text();
    let data = raw;
    try { data = raw ? JSON.parse(raw) : null; } catch (_) {}
    if (!response.ok) throw new Error(data?.message || data?.hint || data?.error || raw || `HTTP ${response.status}`);
    return data;
  }

  function isMobile() { return matchMedia('(max-width:760px)').matches; }

  /* -------------------------- hauteur réelle du header ------------------- */
  let headerFrame = 0;
  function measureHeader() {
    cancelAnimationFrame(headerFrame);
    headerFrame = requestAnimationFrame(() => {
      if (!isMobile()) {
        document.documentElement.style.removeProperty('--mhur-v539-header-space');
        return;
      }
      const header = $('header.top[data-mhur-header-version="513"],header.top');
      if (!header) return;
      const parts = [header, $('.mhurMobileBrandRowV57', header), $('.mhurMobileToolbarV57', header)].filter(Boolean);
      const bottom = Math.max(...parts.map(node => node.getBoundingClientRect().bottom), 0);
      const height = Math.max(112, Math.ceil(bottom));
      document.documentElement.style.setProperty('--mhur-v539-header-space', `${height}px`);
    });
  }

  function installHeaderMeasure() {
    measureHeader();
    addEventListener('resize', measureHeader, {passive:true});
    addEventListener('orientationchange', measureHeader, {passive:true});
    addEventListener('pageshow', measureHeader, {passive:true});
    const header = $('header.top');
    if (header && 'ResizeObserver' in window) new ResizeObserver(measureHeader).observe(header);
  }

  /* ----------------------- bouton Patch Notes fiable --------------------- */
  let lastPatchOpen = 0;
  function findPatchOpenFunction() {
    return window.MHUR_S18_V14?.openNotes || window.MHUR_S18_V13?.openNotes || window.MHUR_S18_V10?.openNotes || window.MHUR_S18_OPEN_NOTES_EARLY || null;
  }
  function openPatchNotes(attempt = 0) {
    const now = Date.now();
    if (attempt === 0 && now - lastPatchOpen < 450) return;
    if (attempt === 0) lastPatchOpen = now;
    const open = findPatchOpenFunction();
    if (typeof open === 'function') {
      open();
      measureHeader();
      requestAnimationFrame(() => {
        const modal = $('#s18NotesDevModalV10,.s18NotesOverlayV10.open');
        modal?.querySelector('.s18NotesBodyV10>main')?.scrollTo({top:0,left:0,behavior:'auto'});
      });
      return;
    }
    window.__s18OpenNotesRequested = true;
    if (attempt < 18) setTimeout(() => openPatchNotes(attempt + 1), 55);
  }
  function patchButtonEvent(event) {
    const button = event.target.closest?.(PATCH_SELECTOR);
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    openPatchNotes();
  }
  function installPatchButtonGuard() {
    document.addEventListener('pointerup', patchButtonEvent, true);
    document.addEventListener('click', patchButtonEvent, true);
    document.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.closest?.(PATCH_SELECTOR)) patchButtonEvent(event);
    }, true);
  }

  /* --------------------------- rôles / profil ---------------------------- */
  function role() {
    const values = [
      window.MHUR_MODERATION?.state?.role,
      window.MHUR_AUTH?.getProfile?.()?.role,
      localStorage.getItem('mhur_role')
    ];
    return String(values.find(Boolean) || 'user').toLowerCase();
  }
  function isAdmin() {
    return Boolean(window.MHUR_MODERATION?.isAdmin?.() || ['admin','administrator','moderator'].includes(role()));
  }

  function closeAuthProfile() { try { window.MHUR_AUTH?.close?.(); } catch (_) {} }

  function ensureProfileButtons() {
    const card = $('#mhurAuthOverlay .mhurProfileCard');
    if (!card || !user()) return;
    card.querySelectorAll('.s18ProfileAdminButtonV10').forEach(button => button.remove());
    const logout = $('.mhurLogout', card);
    if (!card.querySelector('.mhurV539FeedbackProfileButton')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mhurV539ProfileAction mhurV539FeedbackProfileButton';
      button.textContent = tx('💡 Suggestion / problème','💡 Suggestion / issue');
      button.onclick = () => { closeAuthProfile(); openFeedback(); };
      card.insertBefore(button, logout || null);
    }
    let adminButton = card.querySelector('.mhurV539AdminProfileButton');
    if (isAdmin()) {
      if (!adminButton) {
        adminButton = document.createElement('button');
        adminButton.type = 'button';
        adminButton.className = 'mhurV539ProfileAction mhurV539AdminProfileButton';
        adminButton.textContent = tx('🛡️ Centre de modération','🛡️ Moderation center');
        adminButton.onclick = () => { closeAuthProfile(); openHub(); };
        card.insertBefore(adminButton, logout || null);
      }
      adminButton.hidden = false;
    } else if (adminButton) adminButton.hidden = true;
  }

  let profileFrame = 0;
  function scheduleProfileButtons() {
    cancelAnimationFrame(profileFrame);
    profileFrame = requestAnimationFrame(ensureProfileButtons);
  }

  /* ---------------------------- overlays -------------------------------- */
  function overlay(id, eyebrow, title) {
    let node = document.getElementById(id);
    if (node) return node;
    node = document.createElement('div');
    node.id = id;
    node.className = 'mhurV539Overlay';
    node.innerHTML = `<section class="mhurV539Panel" role="dialog" aria-modal="true"><header><div><span>${esc(eyebrow)}</span><h2>${esc(title)}</h2></div><button class="mhurV539Close" type="button" aria-label="${esc(tx('Fermer','Close'))}">×</button></header><div class="mhurV539Body"></div></section>`;
    document.body.appendChild(node);
    $('.mhurV539Close', node).onclick = () => closeOverlay(node);
    node.addEventListener('click', event => { if (event.target === node) closeOverlay(node); });
    return node;
  }
  function showOverlay(node) {
    node.classList.add('open');
    document.body.classList.add('mhurV539ModalOpen');
    measureHeader();
  }
  function closeOverlay(node) {
    node.classList.remove('open');
    if (!$('.mhurV539Overlay.open,.s18NotesOverlayV10.open,.s18AdminOverlayV10.open')) document.body.classList.remove('mhurV539ModalOpen');
  }

  /* -------------------------- formulaire feedback ------------------------ */
  function feedbackModal() {
    const modal = overlay('mhurV539Feedback', tx('CONTACT MODÉRATION','MODERATION CONTACT'), tx('Envoyer une suggestion','Send feedback'));
    const body = $('.mhurV539Body', modal);
    if (!body.dataset.ready) {
      body.dataset.ready = '1';
      body.innerHTML = `<form class="mhurV539Form"><p class="mhurV539Intro">${esc(tx('Ta demande apparaîtra dans la boîte de réception des modérateurs.','Your message will appear in the moderators inbox.'))}</p><label>${esc(tx('Type','Type'))}<select name="type"><option value="suggestion">${esc(tx('Suggestion','Suggestion'))}</option><option value="bug">${esc(tx('Problème / bug','Issue / bug'))}</option><option value="help">${esc(tx('Demande d’aide','Help request'))}</option><option value="other">${esc(tx('Autre','Other'))}</option></select></label><label>${esc(tx('Sujet','Subject'))}<input name="subject" maxlength="120" required></label><label>${esc(tx('Message','Message'))}<textarea name="message" maxlength="2000" required></textarea></label><button class="mhurV539Primary" type="submit">${esc(tx('Envoyer à la modération','Send to moderation'))}</button><div data-feedback-status></div></form>`;
      $('form', body).onsubmit = async event => {
        event.preventDefault();
        const status = $('[data-feedback-status]', body);
        const form = event.currentTarget;
        const current = user();
        if (!current) { status.innerHTML = `<div class="mhurV539Error">${esc(tx('Connecte-toi avant d’envoyer.','Sign in before sending.'))}</div>`; return; }
        status.innerHTML = `<div class="mhurV539Loading">${esc(tx('Envoi…','Sending…'))}</div>`;
        try {
          await api('/rest/v1/community_feedback', {method:'POST', headers:{Prefer:'return=minimal'}, body:JSON.stringify({user_id:current.id,type:form.type.value,subject:form.subject.value.trim(),message:form.message.value.trim(),status:'open'})});
          form.reset();
          status.innerHTML = `<div class="mhurV539Empty">✅ ${esc(tx('Message envoyé à la modération.','Message sent to moderation.'))}</div>`;
        } catch (error) {
          status.innerHTML = `<div class="mhurV539Error">${esc(error.message || error)}<div class="mhurV539SqlNotice">${esc(tx('Si la table Suggestions n’existe pas encore, exécute le fichier SQL V539 dans Supabase.','If the Suggestions table does not exist yet, run the V539 SQL file in Supabase.'))}</div></div>`;
        }
      };
    }
    return modal;
  }
  function openFeedback() { showOverlay(feedbackModal()); }

  /* ------------------------- centre de modération ------------------------ */
  const hubState = {counts:{}, feedback:[], appeals:[], errors:{}};
  const querySpecs = {
    deletion: ['/rest/v1/account_deletion_requests?select=*&order=requested_at.desc&limit=500', rows => rows.filter(row => !['processed','rejected','resolved'].includes(String(row.status || 'pending').toLowerCase()))],
    builds: ['/rest/v1/community_build_reports?status=eq.open&select=*&order=created_at.asc&limit=500', rows => rows],
    mods: ['/rest/v1/community_mod_reports?status=eq.open&select=*&order=created_at.asc&limit=500', rows => rows],
    feedback: ['/rest/v1/community_feedback?status=eq.open&select=*&order=created_at.asc&limit=500', rows => rows],
    appeals: ['/rest/v1/moderation_appeals?status=eq.open&select=*&order=created_at.asc&limit=500', rows => rows]
  };

  async function loadInboxData() {
    hubState.errors = {};
    await Promise.all(Object.entries(querySpecs).map(async ([key,[path,filter]]) => {
      try {
        const rows = await api(path) || [];
        const filtered = filter(Array.isArray(rows) ? rows : []);
        hubState.counts[key] = filtered.length;
        if (key === 'feedback' || key === 'appeals') hubState[key] = filtered;
      } catch (error) {
        hubState.counts[key] = null;
        hubState.errors[key] = error.message || String(error);
        if (key === 'feedback' || key === 'appeals') hubState[key] = [];
      }
    }));
  }

  function card(key, icon, title, help, action) {
    const count = hubState.counts[key];
    const error = hubState.errors[key];
    return `<button class="mhurV539InboxCard" type="button" data-hub-action="${esc(action)}"><strong>${icon} ${esc(title)}</strong><small>${esc(error || help)}</small><span class="mhurV539Count${error?' error':''}">${error?'!':(count ?? '—')}</span></button>`;
  }

  function hubModal() {
    let modal = document.getElementById('mhurV539Hub');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'mhurV539Hub';
    modal.className = 'mhurV539Overlay';
    modal.innerHTML = `<section class="mhurV539Panel" role="dialog" aria-modal="true"><header><div><span>MHUR NEXUS</span><h2>${esc(tx('Centre de modération','Moderation center'))}</h2></div><button class="mhurV539Close" type="button">×</button></header><nav class="mhurV539Tabs"><button class="active" data-hub-tab="overview">${esc(tx('Réception','Inbox'))}</button><button data-hub-tab="feedback">${esc(tx('Suggestions','Feedback'))}</button><button data-hub-tab="appeals">${esc(tx('Recours','Appeals'))}</button></nav><main class="mhurV539Body"></main></section>`;
    document.body.appendChild(modal);
    $('.mhurV539Close', modal).onclick = () => closeOverlay(modal);
    modal.onclick = event => { if (event.target === modal) closeOverlay(modal); };
    $$('[data-hub-tab]', modal).forEach(button => button.onclick = () => renderHub(button.dataset.hubTab));
    return modal;
  }

  function setActiveTab(tab) {
    const modal = hubModal();
    $$('[data-hub-tab]', modal).forEach(button => button.classList.toggle('active', button.dataset.hubTab === tab));
  }

  function openExistingCenter(name) {
    closeOverlay(hubModal());
    if (name === 'deletion') return window.MHUR_S18_V14?.openAdminCenter?.() || window.MHUR_S18_V13?.openAdminCenter?.();
    if (name === 'builds') return window.MHUR_MODERATION?.openAdmin?.();
    if (name === 'mods') return window.MHUR_PLUS?.modReport?.admin?.();
    if (name === 'players') return window.MHUR_PROFILE_DIRECTORY?.open?.();
  }

  function bindOverviewActions(body) {
    $$('[data-hub-action]', body).forEach(button => button.onclick = () => {
      const action = button.dataset.hubAction;
      if (action === 'feedback' || action === 'appeals') renderHub(action);
      else openExistingCenter(action);
    });
  }

  function overviewHtml() {
    return `<p class="mhurV539Intro">${esc(tx('Toutes les entrées reçues par la modération sont regroupées ici.','Everything received by moderation is grouped here.'))}</p><div class="mhurV539Dashboard">${card('deletion','🗑️',tx('Suppressions de compte','Account deletions'),tx('Demandes envoyées depuis Confidentialité.','Requests sent from Privacy.'),'deletion')}${card('builds','🚩',tx('Signalements de builds','Build reports'),tx('Builds signalés par les membres.','Builds reported by members.'),'builds')}${card('mods','🧩',tx('Signalements de mods','Mod reports'),tx('Mods cassés, volés ou inappropriés.','Broken, stolen or inappropriate mods.'),'mods')}${card('feedback','💡',tx('Suggestions et problèmes','Feedback and issues'),tx('Suggestions, bugs et demandes d’aide.','Suggestions, bugs and help requests.'),'feedback')}${card('appeals','📩',tx('Recours de sanctions','Sanction appeals'),tx('Messages envoyés après une sanction.','Messages sent after a sanction.'),'appeals')}<button class="mhurV539InboxCard" type="button" data-hub-action="players"><strong>👥 ${esc(tx('Liste des joueurs','Player list'))}</strong><small>${esc(tx('Profils, rôles et actions de modération.','Profiles, roles and moderation actions.'))}</small><span class="mhurV539Count">→</span></button></div>`;
  }

  function feedbackHtml() {
    if (hubState.errors.feedback) return `<div class="mhurV539Error">${esc(hubState.errors.feedback)}<div class="mhurV539SqlNotice">${esc(tx('Exécute configuration/A_EXECUTER_DANS_SUPABASE_V539.sql pour activer les suggestions.','Run configuration/A_EXECUTER_DANS_SUPABASE_V539.sql to enable feedback.'))}</div></div>`;
    if (!hubState.feedback.length) return `<div class="mhurV539Empty">${esc(tx('Aucune suggestion ouverte.','No open feedback.'))}</div>`;
    return `<div class="mhurV539List">${hubState.feedback.map(row => `<article class="mhurV539Item"><header><div><h3>${esc(row.subject || tx('Sans sujet','No subject'))}</h3><small>${esc(row.type || 'suggestion')} · ${esc(row.user_id || '')}</small></div><small>${row.created_at ? new Date(row.created_at).toLocaleString() : ''}</small></header><p>${esc(row.message || '')}</p><div class="mhurV539Actions"><button class="success" type="button" data-feedback-resolve="${esc(row.id)}">${esc(tx('Marquer traitée','Mark resolved'))}</button></div></article>`).join('')}</div>`;
  }

  function appealsHtml() {
    if (hubState.errors.appeals) return `<div class="mhurV539Error">${esc(hubState.errors.appeals)}</div>`;
    if (!hubState.appeals.length) return `<div class="mhurV539Empty">${esc(tx('Aucun recours ouvert.','No open appeals.'))}</div>`;
    return `<div class="mhurV539List">${hubState.appeals.map(row => `<article class="mhurV539Item"><header><div><h3>📩 ${esc(tx('Recours','Appeal'))}</h3><small>${esc(row.user_id || '')} · sanction ${esc(row.sanction_id || '')}</small></div><small>${row.created_at ? new Date(row.created_at).toLocaleString() : ''}</small></header><p>${esc(row.message || '')}</p><textarea data-appeal-reply="${esc(row.id)}" placeholder="${esc(tx('Réponse au membre…','Reply to member…'))}"></textarea><div class="mhurV539Actions"><button class="success" type="button" data-appeal-resolve="${esc(row.id)}">${esc(tx('Répondre et classer','Reply and resolve'))}</button></div></article>`).join('')}</div>`;
  }

  async function resolveFeedback(id) {
    await api(`/rest/v1/community_feedback?id=eq.${encodeURIComponent(id)}`, {method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'resolved',resolved_at:new Date().toISOString(),resolved_by:user()?.id})});
    await renderHub('feedback', true);
  }
  async function resolveAppeal(id, message) {
    await api(`/rest/v1/moderation_appeals?id=eq.${encodeURIComponent(id)}`, {method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'resolved',response_message:message || null,responded_at:new Date().toISOString(),responded_by:user()?.id})});
    await renderHub('appeals', true);
  }

  async function renderHub(tab = 'overview', reload = false) {
    const modal = hubModal();
    const body = $('.mhurV539Body', modal);
    setActiveTab(tab);
    if (reload || !modal.dataset.loaded) {
      body.innerHTML = `<div class="mhurV539Loading">${esc(tx('Chargement de la réception…','Loading inbox…'))}</div>`;
      await loadInboxData();
      modal.dataset.loaded = '1';
    }
    body.innerHTML = tab === 'feedback' ? feedbackHtml() : tab === 'appeals' ? appealsHtml() : overviewHtml();
    if (tab === 'overview') bindOverviewActions(body);
    $$('[data-feedback-resolve]', body).forEach(button => button.onclick = async () => {
      try { button.disabled = true; await resolveFeedback(button.dataset.feedbackResolve); } catch (error) { alert(error.message || error); button.disabled = false; }
    });
    $$('[data-appeal-resolve]', body).forEach(button => button.onclick = async () => {
      const id = button.dataset.appealResolve;
      const message = $(`[data-appeal-reply="${CSS.escape(id)}"]`, body)?.value.trim() || '';
      try { button.disabled = true; await resolveAppeal(id, message); } catch (error) { alert(error.message || error); button.disabled = false; }
    });
  }

  async function openHub() {
    if (!isAdmin()) { alert(tx('Accès réservé à la modération.','Moderation access only.')); return; }
    const modal = hubModal();
    modal.dataset.loaded = '';
    showOverlay(modal);
    await renderHub('overview', true);
  }

  /* ------------------------------ démarrage ------------------------------ */
  function install() {
    installHeaderMeasure();
    installPatchButtonGuard();
    scheduleProfileButtons();
    const observer = new MutationObserver(scheduleProfileButtons);
    observer.observe(document.body, {childList:true,subtree:true});
    window.addEventListener('mhur-auth-change', scheduleProfileButtons);
    window.addEventListener('mhur-role-change', scheduleProfileButtons);
    window.addEventListener('mhur:languagechange', scheduleProfileButtons);
    window.MHUR_V539 = {openHub,openFeedback,measureHeader};
    console.info('[MHUR] Correctif mobile et modération V539 actif.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
