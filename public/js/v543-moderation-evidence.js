/* ==========================================================================
   MHUR NEXUS — V543 : signalements, preuves et réponses
   ========================================================================== */
(() => {
  'use strict';

  const CFG = window.MHUR_COMMUNITY_CONFIG || {};
  const API = String(CFG.supabaseUrl || '').replace(/\/+$/, '');
  const BUCKET = 'moderation-attachments';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);
  const english = () => String(document.documentElement.lang || 'fr')
    .toLowerCase().startsWith('en');
  const tx = (fr, en) => english() ? en : fr;
  const currentUser = () => window.MHUR_AUTH?.getUser?.() || null;
  const currentProfile = () => window.MHUR_AUTH?.getProfile?.() || null;
  const profileCache = new Map();
  const signedCache = new Map();

  function isStaff() {
    const role = String(
      window.MHUR_MODERATION?.state?.role ||
      currentProfile()?.role ||
      localStorage.getItem('mhur_role') ||
      'user'
    ).toLowerCase();

    return Boolean(
      window.MHUR_MODERATION?.isAdmin?.() ||
      ['admin','administrator','moderator'].includes(role)
    );
  }

  function rowsOf(value) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.rows)) return value.rows;
    if (value && typeof value === 'object' &&
        (value.id || value.user_id || value.reporter_id)) return [value];
    return [];
  }

  async function request(path, options = {}) {
    if (!API) {
      throw new Error(tx(
        'Supabase n’est pas configuré.',
        'Supabase is not configured.'
      ));
    }

    const runner = window.MHUR_AUTH?.fetch || fetch;
    const headers = {...(options.headers || {})};

    if (options.body && !(options.body instanceof Blob) &&
        !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await runner(API + path, {
      ...options,
      headers
    });

    const text = await response.text();
    let data = text;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {}

    if (!response.ok) {
      throw new Error(
        data?.message ||
        data?.hint ||
        data?.error_description ||
        data?.error ||
        text ||
        `HTTP ${response.status}`
      );
    }

    return data;
  }

  function encodePath(path) {
    return String(path || '')
      .split('/')
      .map(part => encodeURIComponent(part))
      .join('/');
  }

  function safeName(name) {
    return String(name || 'image')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(-80) || 'image';
  }

  function selectedImages(input) {
    const files = [...(input?.files || [])].filter(file =>
      /^image\/(jpeg|png|webp|gif)$/i.test(file.type)
    );

    if (files.length > 3) {
      throw new Error(tx(
        'Tu peux envoyer trois images maximum.',
        'You can upload a maximum of three images.'
      ));
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(tx(
          `L’image « ${file.name} » dépasse 5 Mo.`,
          `The image “${file.name}” is larger than 5 MB.`
        ));
      }
    }

    return files;
  }

  function renderDrafts(input, root) {
    const box = $('[data-v543-drafts]', root);
    if (!box) return;

    let files = [];

    try {
      files = selectedImages(input);
    } catch (error) {
      input.value = '';
      box.innerHTML = `<div class="mhurV543Error">${esc(error.message)}</div>`;
      return;
    }

    box.innerHTML = files.map(file => {
      const url = URL.createObjectURL(file);
      return `<figure><img src="${esc(url)}" alt=""><figcaption>${esc(file.name)}</figcaption></figure>`;
    }).join('');
  }

  async function uploadImages(files, category) {
    const user = currentUser();
    if (!user || !files.length) return [];

    const uploaded = [];

    for (const file of files) {
      const id = crypto.randomUUID();
      const path = `${user.id}/${category}/${id}-${safeName(file.name)}`;

      await request(
        `/storage/v1/object/${BUCKET}/${encodePath(path)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'x-upsert': 'false'
          },
          body: file
        }
      );

      uploaded.push({
        path,
        name: file.name,
        type: file.type,
        size: file.size
      });
    }

    return uploaded;
  }

  function parseAttachments(value) {
    if (Array.isArray(value)) return value.slice(0, 3);

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
      } catch (_) {}
    }

    return [];
  }

  async function signedUrl(path) {
    if (!path) return '';
    if (signedCache.has(path)) return signedCache.get(path);

    const promise = request(
      `/storage/v1/object/sign/${BUCKET}/${encodePath(path)}`,
      {
        method: 'POST',
        body: JSON.stringify({expiresIn: 3600})
      }
    ).then(data => {
      const signed = data?.signedURL || data?.signedUrl || '';
      if (!signed) return '';
      return signed.startsWith('http')
        ? signed
        : `${API}${signed}`;
    }).catch(() => '');

    signedCache.set(path, promise);
    return promise;
  }

  function attachmentsHtml(value) {
    const files = parseAttachments(value);
    if (!files.length) return '';

    return `<div class="mhurV543Attachments">${files.map((file, index) =>
      `<a class="mhurV543Attachment" target="_blank" rel="noopener" data-v543-path="${esc(file.path || '')}">
        <img alt="${esc(file.name || `Preuve ${index + 1}`)}">
        <span>${esc(file.name || `Preuve ${index + 1}`)}</span>
      </a>`
    ).join('')}</div>`;
  }

  async function hydrateAttachments(root) {
    const links = $$('[data-v543-path]', root);

    await Promise.all(links.map(async link => {
      const url = await signedUrl(link.dataset.v543Path);
      if (!url) {
        link.remove();
        return;
      }

      link.href = url;
      const image = $('img', link);
      if (image) image.src = url;
    }));
  }

  async function profilesByIds(ids) {
    const unique = [...new Set(ids.filter(Boolean).map(String))];
    const missing = unique.filter(id => !profileCache.has(id));

    if (missing.length) {
      try {
        const rows = rowsOf(await request(
          `/rest/v1/profiles?id=in.(${missing.map(encodeURIComponent).join(',')})&select=id,username,avatar_url,provider,role`
        ));

        rows.forEach(profile => {
          profileCache.set(String(profile.id), profile);
        });
      } catch (_) {}

      missing.forEach(id => {
        if (!profileCache.has(id)) profileCache.set(id, null);
      });
    }

    return new Map(unique.map(id => [id, profileCache.get(id)]));
  }

  function userHtml(profile, id) {
    const name = profile?.username || tx('Utilisateur inconnu', 'Unknown user');
    const avatar = profile?.avatar_url
      ? `<img src="${esc(profile.avatar_url)}" alt="">`
      : `<span class="mhurV543UserAvatar">${esc(name.slice(0, 2).toUpperCase())}</span>`;

    return `<div class="mhurV543User">${avatar}<div><b>${esc(name)}</b><small>${esc(id || '')}</small></div></div>`;
  }

  /* --------------------------- fenêtre générique ------------------------- */

  function overlay(id, eyebrow, title) {
    let node = document.getElementById(id);

    if (!node) {
      node = document.createElement('div');
      node.id = id;
      node.className = 'mhurV543Overlay';
      node.innerHTML = `
        <section class="mhurV543Panel" role="dialog" aria-modal="true">
          <header>
            <div><span></span><h2></h2></div>
            <button class="mhurV543Close" type="button" aria-label="${esc(tx('Fermer','Close'))}">×</button>
          </header>
          <main class="mhurV543Body"></main>
        </section>`;
      document.body.appendChild(node);

      $('.mhurV543Close', node).onclick = () => closeOverlay(node);
      node.onclick = event => {
        if (event.target === node) closeOverlay(node);
      };
    }

    $('header span', node).textContent = eyebrow;
    $('header h2', node).textContent = title;
    return node;
  }

  function openOverlay(node) {
    node.classList.add('open');
    document.body.classList.add('mhurV543ModalOpen');
  }

  function closeOverlay(node) {
    node.classList.remove('open');

    if (!$('.mhurV543Overlay.open')) {
      document.body.classList.remove('mhurV543ModalOpen');
    }
  }

  function friendlySqlError(error) {
    const message = String(error?.message || error || '');

    if (/attachments|moderation-attachments|mhur_staff_|moderator_reply|schema cache|PGRST/i.test(message)) {
      return `${message}\n\n${tx(
        'Exécute configuration/A_EXECUTER_DANS_SUPABASE_V543.sql dans Supabase.',
        'Run configuration/A_EXECUTER_DANS_SUPABASE_V543.sql in Supabase.'
      )}`;
    }

    return message;
  }

  /* ---------------------------- signaler un mod -------------------------- */

  function modReportModal(modId) {
    const modal = overlay(
      'mhurV543ModReport',
      'MHUR NEXUS',
      tx('Signaler ce mod', 'Report this mod')
    );
    const body = $('.mhurV543Body', modal);
    body.innerHTML = `
      <form class="mhurV543Form" data-v543-mod-report>
        <label>${esc(tx('Raison','Reason'))}
          <select name="reason">
            <option value="broken">${esc(tx('Fichier cassé ou dangereux','Broken or unsafe file'))}</option>
            <option value="stolen">${esc(tx('Création volée','Stolen creation'))}</option>
            <option value="inappropriate">${esc(tx('Contenu inapproprié','Inappropriate content'))}</option>
            <option value="misleading">${esc(tx('Description trompeuse','Misleading description'))}</option>
            <option value="other">${esc(tx('Autre','Other'))}</option>
          </select>
        </label>
        <label>${esc(tx('Message','Message'))}
          <textarea name="details" maxlength="1200" required placeholder="${esc(tx('Explique clairement le problème…','Clearly explain the issue…'))}"></textarea>
        </label>
        <label>${esc(tx('Photos de preuve — 3 maximum','Evidence images — maximum 3'))}
          <input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple>
          <span class="mhurV543FileHelp">${esc(tx('JPEG, PNG, WEBP ou GIF · 5 Mo maximum par image.','JPEG, PNG, WEBP or GIF · maximum 5 MB per image.'))}</span>
        </label>
        <div class="mhurV543Drafts" data-v543-drafts></div>
        <button class="mhurV543Primary" type="submit">${esc(tx('Envoyer le signalement','Send report'))}</button>
        <div data-v543-status></div>
      </form>`;

    const form = $('[data-v543-mod-report]', body);
    const input = form.elements.images;
    input.onchange = () => renderDrafts(input, form);

    form.onsubmit = async event => {
      event.preventDefault();
      const status = $('[data-v543-status]', form);
      const user = currentUser();

      if (!user) {
        status.innerHTML = `<div class="mhurV543Error">${esc(tx('Connecte-toi avant de signaler.','Sign in before reporting.'))}</div>`;
        return;
      }

      try {
        status.innerHTML = `<div class="mhurV543Loading">${esc(tx('Envoi du signalement…','Sending report…'))}</div>`;
        const files = selectedImages(input);
        const attachments = await uploadImages(files, 'mod-reports');

        await request('/rest/v1/community_mod_reports', {
          method: 'POST',
          headers: {Prefer: 'return=minimal'},
          body: JSON.stringify({
            mod_id: modId,
            reporter_id: user.id,
            reason: form.elements.reason.value,
            details: form.elements.details.value.trim(),
            attachments
          })
        });

        status.innerHTML = `<div class="mhurV543Status">✅ ${esc(tx('Signalement envoyé.','Report sent.'))}</div>`;
        setTimeout(() => closeOverlay(modal), 850);
      } catch (error) {
        status.innerHTML = `<div class="mhurV543Error">${esc(friendlySqlError(error))}</div>`;
      }
    };

    return modal;
  }

  function openModReport(modId) {
    if (!window.MHUR_AUTH?.requireLogin?.(tx(
      'Connecte-toi pour signaler ce mod.',
      'Sign in to report this mod.'
    ))) return;

    openOverlay(modReportModal(String(modId)));
  }

  /* --------------------------- signaler un build ------------------------- */

  function buildReportModal(buildId) {
    const modal = overlay(
      'mhurV543BuildReport',
      'MHUR NEXUS',
      tx('Signaler ce build', 'Report this build')
    );
    const body = $('.mhurV543Body', modal);
    body.innerHTML = `
      <form class="mhurV543Form" data-v543-build-report>
        <label>${esc(tx('Raison','Reason'))}
          <select name="reason">
            <option value="spam">Spam</option>
            <option value="inappropriate">${esc(tx('Contenu inapproprié','Inappropriate content'))}</option>
            <option value="misleading">${esc(tx('Build trompeur','Misleading build'))}</option>
            <option value="harassment">${esc(tx('Harcèlement','Harassment'))}</option>
            <option value="other">${esc(tx('Autre','Other'))}</option>
          </select>
        </label>
        <label>${esc(tx('Message','Message'))}
          <textarea name="details" maxlength="1200" required placeholder="${esc(tx('Explique clairement le problème…','Clearly explain the issue…'))}"></textarea>
        </label>
        <label>${esc(tx('Photos de preuve — 3 maximum','Evidence images — maximum 3'))}
          <input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple>
          <span class="mhurV543FileHelp">${esc(tx('JPEG, PNG, WEBP ou GIF · 5 Mo maximum par image.','JPEG, PNG, WEBP or GIF · maximum 5 MB per image.'))}</span>
        </label>
        <div class="mhurV543Drafts" data-v543-drafts></div>
        <button class="mhurV543Primary" type="submit">${esc(tx('Envoyer le signalement','Send report'))}</button>
        <div data-v543-status></div>
      </form>`;

    const form = $('[data-v543-build-report]', body);
    const input = form.elements.images;
    input.onchange = () => renderDrafts(input, form);

    form.onsubmit = async event => {
      event.preventDefault();
      const status = $('[data-v543-status]', form);
      const user = currentUser();

      if (!user) {
        status.innerHTML = `<div class="mhurV543Error">${esc(tx('Connecte-toi avant de signaler.','Sign in before reporting.'))}</div>`;
        return;
      }

      try {
        status.innerHTML = `<div class="mhurV543Loading">${esc(tx('Envoi du signalement…','Sending report…'))}</div>`;
        const files = selectedImages(input);
        const attachments = await uploadImages(files, 'build-reports');

        await request('/rest/v1/community_build_reports', {
          method: 'POST',
          headers: {Prefer: 'return=minimal'},
          body: JSON.stringify({
            build_id: buildId,
            reporter_id: user.id,
            reason: form.elements.reason.value,
            details: form.elements.details.value.trim(),
            attachments
          })
        });

        status.innerHTML = `<div class="mhurV543Status">✅ ${esc(tx('Signalement envoyé.','Report sent.'))}</div>`;
        setTimeout(() => closeOverlay(modal), 850);
      } catch (error) {
        status.innerHTML = `<div class="mhurV543Error">${esc(friendlySqlError(error))}</div>`;
      }
    };

    return modal;
  }

  function openBuildReport(buildId) {
    if (!window.MHUR_AUTH?.requireLogin?.(tx(
      'Connecte-toi pour signaler ce build.',
      'Sign in to report this build.'
    ))) return;

    openOverlay(buildReportModal(String(buildId)));
  }

  /* ------------------------- suggestions utilisateur --------------------- */

  async function ownFeedbackHtml() {
    const user = currentUser();
    if (!user) return '';

    const rows = rowsOf(await request(
      `/rest/v1/community_feedback?user_id=eq.${encodeURIComponent(user.id)}&select=*&order=created_at.desc&limit=30`
    ));

    if (!rows.length) {
      return `<div class="mhurV543Empty">${esc(tx('Tu n’as encore envoyé aucun message.','You have not sent any messages yet.'))}</div>`;
    }

    return `<div class="mhurV543List">${rows.map(row => `
      <article class="mhurV543Item">
        <header>
          <div><b>${esc(row.subject || tx('Sans sujet','No subject'))}</b><small class="mhurV543Meta">${esc(row.type || 'suggestion')} · ${esc(row.status || 'open')}</small></div>
          <small class="mhurV543Date">${row.created_at ? new Date(row.created_at).toLocaleString() : ''}</small>
        </header>
        <p class="mhurV543Message">${esc(row.message || '')}</p>
        ${attachmentsHtml(row.attachments)}
        ${row.moderator_reply ? `<div class="mhurV543ReplyBox"><strong>${esc(tx('Réponse de la modération','Moderation reply'))}</strong><div>${esc(row.moderator_reply)}</div></div>` : ''}
      </article>`).join('')}</div>`;
  }

  function feedbackModal() {
    const modal = overlay(
      'mhurV543Feedback',
      'CONTACT MODÉRATION',
      tx('Suggestion / problème', 'Suggestion / issue')
    );
    const body = $('.mhurV543Body', modal);

    body.innerHTML = `
      <form class="mhurV543Form" data-v543-feedback>
        <label>${esc(tx('Type','Type'))}
          <select name="type">
            <option value="suggestion">${esc(tx('Suggestion','Suggestion'))}</option>
            <option value="bug">${esc(tx('Problème / bug','Issue / bug'))}</option>
            <option value="help">${esc(tx('Demande d’aide','Help request'))}</option>
            <option value="other">${esc(tx('Autre','Other'))}</option>
          </select>
        </label>
        <label>${esc(tx('Sujet','Subject'))}
          <input name="subject" maxlength="120" required>
        </label>
        <label>${esc(tx('Message','Message'))}
          <textarea name="message" maxlength="2000" required></textarea>
        </label>
        <label>${esc(tx('Photos — 3 maximum','Images — maximum 3'))}
          <input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple>
          <span class="mhurV543FileHelp">${esc(tx('JPEG, PNG, WEBP ou GIF · 5 Mo maximum par image.','JPEG, PNG, WEBP or GIF · maximum 5 MB per image.'))}</span>
        </label>
        <div class="mhurV543Drafts" data-v543-drafts></div>
        <button class="mhurV543Primary" type="submit">${esc(tx('Envoyer à la modération','Send to moderation'))}</button>
        <div data-v543-status></div>
      </form>
      <hr>
      <div class="mhurV543ViewHead"><h3>${esc(tx('Mes messages','My messages'))}</h3><button class="mhurV543Refresh" type="button" data-v543-own-refresh>${esc(tx('Actualiser','Refresh'))}</button></div>
      <div data-v543-own-feedback><div class="mhurV543Loading">${esc(tx('Chargement…','Loading…'))}</div></div>`;

    const form = $('[data-v543-feedback]', body);
    const input = form.elements.images;
    input.onchange = () => renderDrafts(input, form);

    const loadOwn = async () => {
      const target = $('[data-v543-own-feedback]', body);
      try {
        target.innerHTML = await ownFeedbackHtml();
        await hydrateAttachments(target);
      } catch (error) {
        target.innerHTML = `<div class="mhurV543Error">${esc(friendlySqlError(error))}</div>`;
      }
    };

    $('[data-v543-own-refresh]', body).onclick = loadOwn;

    form.onsubmit = async event => {
      event.preventDefault();
      const status = $('[data-v543-status]', form);
      const user = currentUser();

      if (!user) {
        status.innerHTML = `<div class="mhurV543Error">${esc(tx('Connecte-toi avant d’envoyer.','Sign in before sending.'))}</div>`;
        return;
      }

      try {
        status.innerHTML = `<div class="mhurV543Loading">${esc(tx('Envoi…','Sending…'))}</div>`;
        const files = selectedImages(input);
        const attachments = await uploadImages(files, 'feedback');

        await request('/rest/v1/community_feedback', {
          method: 'POST',
          headers: {Prefer: 'return=minimal'},
          body: JSON.stringify({
            user_id: user.id,
            type: form.elements.type.value,
            subject: form.elements.subject.value.trim(),
            message: form.elements.message.value.trim(),
            attachments,
            status: 'open'
          })
        });

        form.reset();
        $('[data-v543-drafts]', form).innerHTML = '';
        status.innerHTML = `<div class="mhurV543Status">✅ ${esc(tx('Message envoyé.','Message sent.'))}</div>`;
        await loadOwn();
      } catch (error) {
        status.innerHTML = `<div class="mhurV543Error">${esc(friendlySqlError(error))}</div>`;
      }
    };

    loadOwn();
    return modal;
  }

  function openFeedback() {
    if (!window.MHUR_AUTH?.requireLogin?.(tx(
      'Connecte-toi pour contacter la modération.',
      'Sign in to contact moderation.'
    ))) return;

    openOverlay(feedbackModal());
  }

  /* ------------------------- centre de modération ------------------------ */

  const hubState = {
    view: 'overview',
    modReports: [],
    buildReports: [],
    feedback: [],
    appeals: [],
    deletions: [],
    profiles: new Map(),
    mods: new Map(),
    builds: new Map()
  };

  function hubModal() {
    return overlay(
      'mhurV543Hub',
      'MHUR NEXUS',
      tx('Centre de modération', 'Moderation center')
    );
  }

  async function loadCollection(path) {
    return rowsOf(await request(path));
  }

  async function fetchMap(table, ids, columns = '*') {
    const unique = [...new Set(ids.filter(Boolean).map(String))];
    if (!unique.length) return new Map();

    const rows = rowsOf(await request(
      `/rest/v1/${table}?id=in.(${unique.map(encodeURIComponent).join(',')})&select=${columns}`
    ));

    return new Map(rows.map(row => [String(row.id), row]));
  }

  async function counts() {
    const endpoints = {
      deletions: '/rest/v1/account_deletion_requests?status=in.(pending,open)&select=user_id,status',
      builds: '/rest/v1/community_build_reports?status=eq.open&select=id',
      mods: '/rest/v1/community_mod_reports?status=eq.open&select=id',
      feedback: '/rest/v1/community_feedback?status=eq.open&select=id',
      appeals: '/rest/v1/moderation_appeals?status=eq.open&select=id'
    };

    const result = {};

    await Promise.all(Object.entries(endpoints).map(async ([key, path]) => {
      try {
        result[key] = (await loadCollection(path)).length;
      } catch (_) {
        result[key] = '!';
      }
    }));

    return result;
  }

  async function renderOverview() {
    const modal = hubModal();
    const body = $('.mhurV543Body', modal);
    body.innerHTML = `<div class="mhurV543Loading">${esc(tx('Chargement de la réception…','Loading inbox…'))}</div>`;
    const count = await counts();

    const card = (key, icon, title, help) => `
      <button class="mhurV543DashboardCard" type="button" data-v543-view="${key}">
        <strong>${icon} ${esc(title)}</strong>
        <small>${esc(help)}</small>
        <span class="mhurV543Count">${esc(count[key] ?? '—')}</span>
      </button>`;

    body.innerHTML = `
      <p class="mhurV543Intro">${esc(tx(
        'Chaque signalement affiche maintenant son auteur, le contenu concerné, le message et les preuves envoyées.',
        'Every report now shows its author, the reported content, the message and uploaded evidence.'
      ))}</p>
      <div class="mhurV543Dashboard">
        ${card('mods','🧩',tx('Signalements de mods','Mod reports'),tx('Voir le mod, supprimer le mod ou supprimer seulement le signalement.','View the mod, delete it, or delete only the report.'))}
        ${card('builds','🚩',tx('Signalements de builds','Build reports'),tx('Voir le build, supprimer le build ou classer sans action.','View the build, delete it, or dismiss the report.'))}
        ${card('feedback','💡',tx('Suggestions et problèmes','Feedback and issues'),tx('Répondre directement à la personne.','Reply directly to the sender.'))}
        ${card('deletions','🗑️',tx('Suppressions de compte','Account deletions'),tx('Demandes robustes sans erreur rows.map.','Requests displayed without the rows.map error.'))}
        ${card('appeals','📩',tx('Recours','Appeals'),tx('Répondre aux recours de sanctions.','Reply to sanction appeals.'))}
        <button class="mhurV543DashboardCard" type="button" data-v543-view="players">
          <strong>👥 ${esc(tx('Liste des joueurs','Player list'))}</strong>
          <small>${esc(tx('Ouvrir les profils et les rôles.','Open profiles and roles.'))}</small>
          <span class="mhurV543Count">→</span>
        </button>
      </div>`;

    $$('[data-v543-view]', body).forEach(button => {
      button.onclick = () => openHub(button.dataset.v543View);
    });
  }

  function viewShell(title) {
    return `
      <button class="mhurV543Back" type="button" data-v543-back>← ${esc(tx('Retour au centre de modération','Back to moderation center'))}</button>
      <div class="mhurV543ViewHead">
        <h3>${esc(title)}</h3>
        <button class="mhurV543Refresh" type="button" data-v543-refresh>${esc(tx('Actualiser','Refresh'))}</button>
      </div>
      <div data-v543-view-content><div class="mhurV543Loading">${esc(tx('Chargement…','Loading…'))}</div></div>`;
  }

  async function loadModReports() {
    const reports = await loadCollection(
      '/rest/v1/community_mod_reports?status=eq.open&select=*&order=created_at.asc&limit=500'
    );
    const profileMap = await profilesByIds(reports.map(row => row.reporter_id));
    const modMap = await fetchMap(
      'community_mods',
      reports.map(row => row.mod_id),
      'id,title,creator_id,preview_url,description,is_hidden,category,character_name'
    );

    hubState.modReports = reports;
    hubState.profiles = profileMap;
    hubState.mods = modMap;
  }

  async function renderModReports() {
    const root = $('[data-v543-view-content]', hubModal());

    try {
      await loadModReports();

      root.innerHTML = hubState.modReports.length
        ? `<div class="mhurV543List">${hubState.modReports.map(row => {
            const reporter = hubState.profiles.get(String(row.reporter_id));
            const mod = hubState.mods.get(String(row.mod_id));

            return `<article class="mhurV543Item">
              <header>
                ${userHtml(reporter, row.reporter_id)}
                <small class="mhurV543Date">${row.created_at ? new Date(row.created_at).toLocaleString() : ''}</small>
              </header>
              <span class="mhurV543Reason">${esc(row.reason || tx('Sans raison','No reason'))}</span>
              <p class="mhurV543Message">${esc(row.details || tx('Aucun message.','No message.'))}</p>
              <section class="mhurV543Target">
                ${mod?.preview_url ? `<img src="${esc(mod.preview_url)}" alt="">` : '<div></div>'}
                <div>
                  <h4>${esc(mod?.title || tx('Mod déjà supprimé','Mod already deleted'))}</h4>
                  <p>${esc(mod?.description || mod?.character_name || '')}</p>
                  <small class="mhurV543Meta">ID : ${esc(row.mod_id || '')}</small>
                </div>
              </section>
              ${attachmentsHtml(row.attachments)}
              <div class="mhurV543Actions">
                ${mod ? `<button type="button" data-v543-view-mod="${esc(mod.id)}">${esc(tx('Voir le mod','View mod'))}</button>` : ''}
                ${mod ? `<button class="danger" type="button" data-v543-delete-mod="${esc(row.id)}">${esc(tx('Supprimer le mod','Delete mod'))}</button>` : ''}
                <button class="neutral" type="button" data-v543-dismiss-mod="${esc(row.id)}">${esc(tx('Ne rien faire — supprimer le signalement','No action — delete report'))}</button>
              </div>
            </article>`;
          }).join('')}</div>`
        : `<div class="mhurV543Empty">${esc(tx('Aucun signalement de mod ouvert.','No open mod reports.'))}</div>`;

      await hydrateAttachments(root);

      $$('[data-v543-view-mod]', root).forEach(button => {
        button.onclick = async () => {
          const id = button.dataset.v543ViewMod;
          let mod = window.MHUR_MODS?.state?.rows?.find(row => String(row.id) === id);

          if (!mod) {
            mod = hubState.mods.get(id);
            if (mod && window.MHUR_MODS?.state?.rows) {
              window.MHUR_MODS.state.rows.push(mod);
            }
          }

          if (mod) window.MHUR_MODS?.openDetail?.(id);
        };
      });

      $$('[data-v543-delete-mod]', root).forEach(button => {
        button.onclick = async () => {
          if (!confirm(tx(
            'Supprimer définitivement ce mod et le signalement ?',
            'Permanently delete this mod and the report?'
          ))) return;

          button.disabled = true;

          try {
            await request('/rest/v1/rpc/mhur_staff_handle_mod_report', {
              method: 'POST',
              body: JSON.stringify({
                p_report: button.dataset.v543DeleteMod,
                p_action: 'delete_target'
              })
            });
            await renderModReports();
          } catch (error) {
            alert(friendlySqlError(error));
            button.disabled = false;
          }
        };
      });

      $$('[data-v543-dismiss-mod]', root).forEach(button => {
        button.onclick = async () => {
          if (!confirm(tx(
            'Supprimer ce signalement sans agir sur le mod ?',
            'Delete this report without acting on the mod?'
          ))) return;

          button.disabled = true;

          try {
            await request('/rest/v1/rpc/mhur_staff_handle_mod_report', {
              method: 'POST',
              body: JSON.stringify({
                p_report: button.dataset.v543DismissMod,
                p_action: 'dismiss'
              })
            });
            await renderModReports();
          } catch (error) {
            alert(friendlySqlError(error));
            button.disabled = false;
          }
        };
      });
    } catch (error) {
      root.innerHTML = `<div class="mhurV543Error">${esc(friendlySqlError(error))}</div>`;
    }
  }

  async function loadBuildReports() {
    const reports = await loadCollection(
      '/rest/v1/community_build_reports?status=eq.open&select=*&order=created_at.asc&limit=500'
    );
    const profileMap = await profilesByIds(reports.map(row => row.reporter_id));
    const buildMap = await fetchMap(
      'community_builds',
      reports.map(row => row.build_id),
      'id,title,author,creator_id,character_id,style_id,costume_img,is_hidden'
    );

    hubState.buildReports = reports;
    hubState.profiles = profileMap;
    hubState.builds = buildMap;
  }

  async function renderBuildReports() {
    const root = $('[data-v543-view-content]', hubModal());

    try {
      await loadBuildReports();

      root.innerHTML = hubState.buildReports.length
        ? `<div class="mhurV543List">${hubState.buildReports.map(row => {
            const reporter = hubState.profiles.get(String(row.reporter_id));
            const build = hubState.builds.get(String(row.build_id));

            return `<article class="mhurV543Item">
              <header>
                ${userHtml(reporter, row.reporter_id)}
                <small class="mhurV543Date">${row.created_at ? new Date(row.created_at).toLocaleString() : ''}</small>
              </header>
              <span class="mhurV543Reason">${esc(row.reason || tx('Sans raison','No reason'))}</span>
              <p class="mhurV543Message">${esc(row.details || tx('Aucun message.','No message.'))}</p>
              <section class="mhurV543Target">
                ${build?.costume_img ? `<img src="${esc(build.costume_img)}" alt="">` : '<div></div>'}
                <div>
                  <h4>${esc(build?.title || tx('Build déjà supprimé','Build already deleted'))}</h4>
                  <p>${esc(build?.author || '')}</p>
                  <small class="mhurV543Meta">ID : ${esc(row.build_id || '')}</small>
                </div>
              </section>
              ${attachmentsHtml(row.attachments)}
              <div class="mhurV543Actions">
                ${build ? `<button type="button" data-v543-view-build="${esc(build.id)}">${esc(tx('Voir le build','View build'))}</button>` : ''}
                ${build ? `<button class="danger" type="button" data-v543-delete-build="${esc(row.id)}">${esc(tx('Supprimer le build','Delete build'))}</button>` : ''}
                <button class="neutral" type="button" data-v543-dismiss-build="${esc(row.id)}">${esc(tx('Ne rien faire — supprimer le signalement','No action — delete report'))}</button>
              </div>
            </article>`;
          }).join('')}</div>`
        : `<div class="mhurV543Empty">${esc(tx('Aucun signalement de build ouvert.','No open build reports.'))}</div>`;

      await hydrateAttachments(root);

      $$('[data-v543-view-build]', root).forEach(button => {
        button.onclick = () => {
          const build = hubState.builds.get(button.dataset.v543ViewBuild);
          if (!build) return;
          closeOverlay(hubModal());
          window.openCommunityBuildDetail?.(
            build.id,
            build.character_id,
            build.style_id
          );
        };
      });

      $$('[data-v543-delete-build]', root).forEach(button => {
        button.onclick = async () => {
          if (!confirm(tx(
            'Supprimer définitivement ce build et le signalement ?',
            'Permanently delete this build and the report?'
          ))) return;

          button.disabled = true;

          try {
            await request('/rest/v1/rpc/mhur_staff_handle_build_report', {
              method: 'POST',
              body: JSON.stringify({
                p_report: button.dataset.v543DeleteBuild,
                p_action: 'delete_target'
              })
            });
            await renderBuildReports();
          } catch (error) {
            alert(friendlySqlError(error));
            button.disabled = false;
          }
        };
      });

      $$('[data-v543-dismiss-build]', root).forEach(button => {
        button.onclick = async () => {
          if (!confirm(tx(
            'Supprimer ce signalement sans agir sur le build ?',
            'Delete this report without acting on the build?'
          ))) return;

          button.disabled = true;

          try {
            await request('/rest/v1/rpc/mhur_staff_handle_build_report', {
              method: 'POST',
              body: JSON.stringify({
                p_report: button.dataset.v543DismissBuild,
                p_action: 'dismiss'
              })
            });
            await renderBuildReports();
          } catch (error) {
            alert(friendlySqlError(error));
            button.disabled = false;
          }
        };
      });
    } catch (error) {
      root.innerHTML = `<div class="mhurV543Error">${esc(friendlySqlError(error))}</div>`;
    }
  }

  async function renderFeedback() {
    const root = $('[data-v543-view-content]', hubModal());

    try {
      const rows = await loadCollection(
        '/rest/v1/community_feedback?status=eq.open&select=*&order=created_at.asc&limit=500'
      );
      const profiles = await profilesByIds(rows.map(row => row.user_id));

      root.innerHTML = rows.length
        ? `<div class="mhurV543List">${rows.map(row => `
            <article class="mhurV543Item">
              <header>
                ${userHtml(profiles.get(String(row.user_id)), row.user_id)}
                <small class="mhurV543Date">${row.created_at ? new Date(row.created_at).toLocaleString() : ''}</small>
              </header>
              <span class="mhurV543Reason">${esc(row.type || 'suggestion')}</span>
              <h4>${esc(row.subject || tx('Sans sujet','No subject'))}</h4>
              <p class="mhurV543Message">${esc(row.message || '')}</p>
              ${attachmentsHtml(row.attachments)}
              <textarea class="mhurV543Reply" data-v543-feedback-reply="${esc(row.id)}" placeholder="${esc(tx('Réponse envoyée à la personne…','Reply sent to the user…'))}"></textarea>
              <div class="mhurV543Actions">
                <button class="success" type="button" data-v543-feedback-send="${esc(row.id)}">${esc(tx('Envoyer la réponse et classer','Send reply and resolve'))}</button>
                <button class="neutral" type="button" data-v543-feedback-close="${esc(row.id)}">${esc(tx('Classer sans réponse','Resolve without reply'))}</button>
              </div>
            </article>`).join('')}</div>`
        : `<div class="mhurV543Empty">${esc(tx('Aucune suggestion ouverte.','No open feedback.'))}</div>`;

      await hydrateAttachments(root);

      const resolve = async (id, reply) => {
        await request('/rest/v1/rpc/mhur_staff_reply_feedback', {
          method: 'POST',
          body: JSON.stringify({
            p_feedback: id,
            p_reply: reply || null
          })
        });
        await renderFeedback();
      };

      $$('[data-v543-feedback-send]', root).forEach(button => {
        button.onclick = async () => {
          const id = button.dataset.v543FeedbackSend;
          const reply = $(`[data-v543-feedback-reply="${CSS.escape(id)}"]`, root)?.value.trim() || '';

          if (!reply) {
            alert(tx('Écris une réponse avant de l’envoyer.','Write a reply before sending it.'));
            return;
          }

          button.disabled = true;

          try {
            await resolve(id, reply);
          } catch (error) {
            alert(friendlySqlError(error));
            button.disabled = false;
          }
        };
      });

      $$('[data-v543-feedback-close]', root).forEach(button => {
        button.onclick = async () => {
          if (!confirm(tx('Classer cette demande sans réponse ?','Resolve this request without a reply?'))) return;
          button.disabled = true;

          try {
            await resolve(button.dataset.v543FeedbackClose, '');
          } catch (error) {
            alert(friendlySqlError(error));
            button.disabled = false;
          }
        };
      });
    } catch (error) {
      root.innerHTML = `<div class="mhurV543Error">${esc(friendlySqlError(error))}</div>`;
    }
  }

  async function renderDeletions() {
    const root = $('[data-v543-view-content]', hubModal());

    try {
      const data = await request(
        '/rest/v1/account_deletion_requests?select=*&order=requested_at.desc&limit=500'
      );
      const rows = rowsOf(data);
      const profiles = await profilesByIds(rows.map(row => row.user_id));

      root.innerHTML = rows.length
        ? `<div class="mhurV543List">${rows.map(row => `
            <article class="mhurV543Item">
              <header>
                ${userHtml(profiles.get(String(row.user_id)), row.user_id)}
                <small class="mhurV543Date">${row.requested_at ? new Date(row.requested_at).toLocaleString() : ''}</small>
              </header>
              <span class="mhurV543Reason">${esc(row.status || 'pending')}</span>
              <p class="mhurV543Message">${esc(row.reason || tx('Demande de suppression du compte.','Account deletion request.'))}</p>
              <div class="mhurV543Actions">
                <button class="success" type="button" data-v543-deletion-status="processed" data-v543-deletion-user="${esc(row.user_id)}">${esc(tx('Marquer traitée','Mark processed'))}</button>
                <button class="neutral" type="button" data-v543-deletion-status="rejected" data-v543-deletion-user="${esc(row.user_id)}">${esc(tx('Refuser','Reject'))}</button>
                <button type="button" data-v543-copy="${esc(row.user_id)}">${esc(tx("Copier l’ID","Copy ID"))}</button>
              </div>
            </article>`).join('')}</div>`
        : `<div class="mhurV543Empty">${esc(tx('Aucune demande de suppression.','No deletion requests.'))}</div>`;

      $$('[data-v543-copy]', root).forEach(button => {
        button.onclick = () => navigator.clipboard?.writeText(button.dataset.v543Copy);
      });

      $$('[data-v543-deletion-status]', root).forEach(button => {
        button.onclick = async () => {
          button.disabled = true;

          try {
            await request('/rest/v1/rpc/mhur_staff_update_deletion_request', {
              method: 'POST',
              body: JSON.stringify({
                p_user: button.dataset.v543DeletionUser,
                p_status: button.dataset.v543DeletionStatus
              })
            });
            await renderDeletions();
          } catch (error) {
            alert(friendlySqlError(error));
            button.disabled = false;
          }
        };
      });
    } catch (error) {
      root.innerHTML = `<div class="mhurV543Error">${esc(friendlySqlError(error))}</div>`;
    }
  }

  async function renderAppeals() {
    const root = $('[data-v543-view-content]', hubModal());

    try {
      const rows = await loadCollection(
        '/rest/v1/moderation_appeals?status=eq.open&select=*&order=created_at.asc&limit=500'
      );
      const profiles = await profilesByIds(rows.map(row => row.user_id));

      root.innerHTML = rows.length
        ? `<div class="mhurV543List">${rows.map(row => `
            <article class="mhurV543Item">
              <header>
                ${userHtml(profiles.get(String(row.user_id)), row.user_id)}
                <small class="mhurV543Date">${row.created_at ? new Date(row.created_at).toLocaleString() : ''}</small>
              </header>
              <span class="mhurV543Reason">${esc(tx('Recours de sanction','Sanction appeal'))}</span>
              <small class="mhurV543Meta">ID sanction : ${esc(row.sanction_id || '')}</small>
              <p class="mhurV543Message">${esc(row.message || '')}</p>
              <textarea class="mhurV543Reply" data-v543-appeal-reply="${esc(row.id)}" placeholder="${esc(tx('Réponse au membre…','Reply to member…'))}"></textarea>
              <div class="mhurV543Actions">
                <button class="success" type="button" data-v543-appeal-send="${esc(row.id)}">${esc(tx('Répondre et classer','Reply and resolve'))}</button>
              </div>
            </article>`).join('')}</div>`
        : `<div class="mhurV543Empty">${esc(tx('Aucun recours ouvert.','No open appeals.'))}</div>`;

      $$('[data-v543-appeal-send]', root).forEach(button => {
        button.onclick = async () => {
          const id = button.dataset.v543AppealSend;
          const reply = $(`[data-v543-appeal-reply="${CSS.escape(id)}"]`, root)?.value.trim() || '';

          try {
            button.disabled = true;
            await request(`/rest/v1/moderation_appeals?id=eq.${encodeURIComponent(id)}`, {
              method: 'PATCH',
              headers: {Prefer: 'return=minimal'},
              body: JSON.stringify({
                status: 'resolved',
                response_message: reply || null,
                responded_at: new Date().toISOString(),
                responded_by: currentUser()?.id
              })
            });
            await renderAppeals();
          } catch (error) {
            alert(friendlySqlError(error));
            button.disabled = false;
          }
        };
      });
    } catch (error) {
      root.innerHTML = `<div class="mhurV543Error">${esc(friendlySqlError(error))}</div>`;
    }
  }

  async function renderView(view) {
    const modal = hubModal();
    const body = $('.mhurV543Body', modal);
    hubState.view = view;

    if (view === 'overview') {
      await renderOverview();
      return;
    }

    if (view === 'players') {
      closeOverlay(modal);
      window.MHUR_PROFILE_DIRECTORY?.open?.();
      return;
    }

    const titles = {
      mods: tx('Signalements des mods','Mod reports'),
      builds: tx('Signalements des builds','Build reports'),
      feedback: tx('Suggestions et problèmes','Feedback and issues'),
      deletions: tx('Demandes de suppression','Deletion requests'),
      appeals: tx('Recours','Appeals')
    };

    body.innerHTML = viewShell(titles[view] || view);
    $('[data-v543-back]', body).onclick = () => renderView('overview');
    $('[data-v543-refresh]', body).onclick = () => renderView(view);

    if (view === 'mods') await renderModReports();
    if (view === 'builds') await renderBuildReports();
    if (view === 'feedback') await renderFeedback();
    if (view === 'deletions') await renderDeletions();
    if (view === 'appeals') await renderAppeals();
  }

  async function openHub(view = 'overview') {
    if (!isStaff()) {
      alert(tx('Accès réservé à la modération.','Moderation access only.'));
      return;
    }

    document.getElementById('mhurV539Hub')?.classList.remove('open');
    document.getElementById('mhurModReportAdminModal')?.classList.remove('open');
    document.getElementById('mhurAdminOverlay')?.classList.remove('open');
    document.getElementById('s18AdminCenterV10')?.classList.remove('open');

    const modal = hubModal();
    openOverlay(modal);
    await renderView(view);
  }

  /* ---------------------------- branchements ----------------------------- */

  function createProfileButtons() {
    const card = $('#mhurAuthOverlay .mhurProfileCard');
    if (!card || !currentUser()) return;

    const logout = $('.mhurLogout', card);
    let feedback = $('.mhurV539FeedbackProfileButton,.mhurV543FeedbackProfileButton', card);

    if (!feedback) {
      feedback = document.createElement('button');
      feedback.type = 'button';
      feedback.className = 'mhurV539ProfileAction mhurV543FeedbackProfileButton';
      feedback.textContent = tx('💡 Suggestion / problème','💡 Suggestion / issue');
      card.insertBefore(feedback, logout || null);
    }

    feedback.onclick = event => {
      event.preventDefault();
      window.MHUR_AUTH?.close?.();
      openFeedback();
    };

    let admin = $('.mhurV539AdminProfileButton,.s18ProfileAdminButtonV10,.mhurV543AdminProfileButton', card);

    if (isStaff()) {
      if (!admin) {
        admin = document.createElement('button');
        admin.type = 'button';
        admin.className = 'mhurV539ProfileAction mhurV543AdminProfileButton';
        admin.textContent = tx('🛡️ Centre de modération','🛡️ Moderation center');
        card.insertBefore(admin, logout || null);
      }

      admin.hidden = false;
      admin.onclick = event => {
        event.preventDefault();
        window.MHUR_AUTH?.close?.();
        openHub('overview');
      };
    } else if (admin) {
      admin.hidden = true;
    }
  }

  function overrideApis() {
    if (window.MHUR_PLUS?.modReport) {
      window.MHUR_PLUS.modReport.open = openModReport;
      window.MHUR_PLUS.modReport.admin = () => openHub('mods');
    }

    if (window.MHUR_MODERATION) {
      window.MHUR_MODERATION.openReport = openBuildReport;
      window.MHUR_MODERATION.openAdmin = () => openHub('builds');
    }

    ['MHUR_S18_V10','MHUR_S18_V13','MHUR_S18_V14'].forEach(key => {
      if (window[key]) {
        window[key].openAdminCenter = () => openHub('deletions');
      }
    });

    if (window.MHUR_V539) {
      window.MHUR_V539.openHub = openHub;
      window.MHUR_V539.openFeedback = openFeedback;
    }
  }

  function install() {
    overrideApis();
    createProfileButtons();

    const observer = new MutationObserver(() => {
      overrideApis();
      createProfileButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('mhur-auth-change', createProfileButtons);
    window.addEventListener('mhur-role-change', () => {
      overrideApis();
      createProfileButtons();
    });
    window.addEventListener('mhur:languagechange', createProfileButtons);

    window.MHUR_V543 = {
      openHub,
      openFeedback,
      openModReport,
      openBuildReport
    };

    console.info('[MHUR] Centre de modération V543 actif.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, {once: true});
  } else {
    install();
  }
})();
