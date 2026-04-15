/**
 * admin.js — DEMO: genera links auto-contenidos + guarda en localStorage + JSON export
 *
 * Cómo funciona:
 * - Al crear una instancia se codifica toda la data en el link (base64) → funciona desde cualquier lado
 * - Se guarda en localStorage para ver historial en este browser
 * - Se muestra un bloque JSON para copiar manualmente a public/data/logins.json si querés persistir
 */
(function () {
  var createForm = document.getElementById('createForm');
  var createBtn = document.getElementById('createBtn');
  var generatedResult = document.getElementById('generatedResult');
  var copyLinkBtn = document.getElementById('copyLinkBtn');
  var copyFeedback = document.getElementById('copyFeedback');
  var logoutBtn = document.getElementById('logoutBtn');

  var currentLink = '';
  var currentJson = '';
  var langNames = { es: 'Español', en: 'English', pt: 'Português' };
  var STORAGE_KEY = 'supra_demo_logins';

  // ─── Base64 helpers (unicode safe) ─────────────────────────
  function encodeData(obj) {
    var str = JSON.stringify(obj);
    // encode UTF-8 safely
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // ─── LocalStorage helpers ──────────────────────────────────
  function loadStored() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) { return []; }
  }

  function saveStored(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // ─── Logout ────────────────────────────────────────────────
  logoutBtn.addEventListener('click', function () {
    window.location.href = 'login.html';
  });

  // ─── Crear instancia ───────────────────────────────────────
  createForm.addEventListener('submit', function (e) {
    e.preventDefault();
    generatedResult.classList.remove('visible');
    copyFeedback.classList.remove('visible');

    var language = document.getElementById('cf-language').value || 'es';
    var clientName = document.getElementById('cf-clientName').value.trim() || 'cliente';
    var clientEmail = document.getElementById('cf-clientEmail').value.trim();
    var username = document.getElementById('cf-username').value.trim();
    var password = document.getElementById('cf-password').value.trim();
    var createdBy = document.getElementById('cf-createdBy').value.trim();
    var notes = document.getElementById('cf-notes').value.trim();

    var slug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 15) + '-' + Date.now().toString(36);
    var instanceId = 'id-' + Math.random().toString(36).slice(2, 10);

    var record = {
      slug: slug,
      instanceId: instanceId,
      username: username,
      password: password,
      clientName: clientName,
      clientEmail: clientEmail,
      createdBy: createdBy,
      language: language,
      notes: notes,
      createdAt: new Date().toISOString()
    };

    // Link auto-contenido (base64) → funciona desde cualquier lado
    var encoded = encodeData(record);
    var base = window.location.origin + window.location.pathname.replace(/admin\.html.*$/, '');
    currentLink = base + 'form.html?slug=' + encodeURIComponent(slug) +
                  '&lang=' + language + '&t=' + encoded;

    // Guardar en localStorage
    var stored = loadStored();
    stored.unshift(record);
    saveStored(stored);

    // JSON block para copiar al archivo
    currentJson = JSON.stringify(record, null, 2);

    // UI feedback
    createBtn.classList.add('is-loading');
    createBtn.disabled = true;

    setTimeout(function () {
      createBtn.classList.remove('is-loading');
      createBtn.disabled = false;

      document.getElementById('genInstanceId').textContent = instanceId;
      document.getElementById('genSlug').textContent = slug;
      document.getElementById('genLink').textContent = currentLink;
      document.getElementById('genLanguage').textContent = langNames[language] || language;
      document.getElementById('genJson').textContent = currentJson;

      generatedResult.classList.add('visible');
      renderHistory();
    }, 400);
  });

  // ─── Copiar link ───────────────────────────────────────────
  copyLinkBtn.addEventListener('click', function () {
    copyToClipboard(currentLink, copyFeedback);
  });

  // ─── Copiar JSON ───────────────────────────────────────────
  var copyJsonBtn = document.getElementById('copyJsonBtn');
  if (copyJsonBtn) {
    copyJsonBtn.addEventListener('click', function () {
      copyToClipboard(currentJson, document.getElementById('copyJsonFeedback'));
    });
  }

  function copyToClipboard(text, feedbackEl) {
    if (!text) return;
    var done = function () {
      if (feedbackEl) {
        feedbackEl.classList.add('visible');
        setTimeout(function () { feedbackEl.classList.remove('visible'); }, 2500);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    }
  }

  // ─── Historial local ───────────────────────────────────────
  function renderHistory() {
    var historyList = document.getElementById('historyList');
    var historyEmpty = document.getElementById('historyEmpty');
    if (!historyList) return;

    var stored = loadStored();

    historyList.innerHTML = '';
    if (!stored.length) {
      if (historyEmpty) historyEmpty.classList.remove('hidden');
      return;
    }

    if (historyEmpty) historyEmpty.classList.add('hidden');

    stored.slice(0, 20).forEach(function (r) {
      var base = window.location.origin + window.location.pathname.replace(/admin\.html.*$/, '');
      var link = base + 'form.html?slug=' + encodeURIComponent(r.slug) +
                 '&lang=' + r.language + '&t=' + encodeData(r);

      var item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML =
        '<div class="history-item-main">' +
          '<div class="history-item-name">' + esc(r.clientName) + '</div>' +
          '<div class="history-item-meta">' +
            '<span class="badge badge-active">' + (langNames[r.language] || r.language) + '</span>' +
            '<span class="history-item-date">' + formatDate(r.createdAt) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="history-item-actions">' +
          '<button type="button" class="btn btn-secondary btn-sm" data-copy="' + escAttr(link) + '">Copiar link</button>' +
          '<a href="' + escAttr(link) + '" target="_blank" class="btn btn-ghost btn-sm">Abrir</a>' +
        '</div>';
      historyList.appendChild(item);
    });

    // Copiar desde historial
    historyList.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var link = btn.getAttribute('data-copy');
        copyToClipboard(link, null);
        var original = btn.textContent;
        btn.textContent = 'Copiado ✓';
        setTimeout(function () { btn.textContent = original; }, 1500);
      });
    });
  }

  // ─── Clear history button ──────────────────────────────────
  var clearHistoryBtn = document.getElementById('clearHistoryBtn');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', function () {
      if (confirm('¿Borrar historial local?')) {
        saveStored([]);
        renderHistory();
      }
    });
  }

  // ─── Helpers ───────────────────────────────────────────────
  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function escAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
           ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  // Init
  renderHistory();
})();
