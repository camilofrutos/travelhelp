/**
 * admin.js — Admin panel: create instances, list, logout
 */
(function () {
  var createForm = document.getElementById('createForm');
  var createBtn = document.getElementById('createBtn');
  var createError = document.getElementById('createError');
  var generatedResult = document.getElementById('generatedResult');
  var instancesList = document.getElementById('instancesList');
  var emptyState = document.getElementById('emptyState');
  var logoutBtn = document.getElementById('logoutBtn');
  var copyLinkBtn = document.getElementById('copyLinkBtn');
  var copyFeedback = document.getElementById('copyFeedback');

  var currentLink = '';
  var adminToken = localStorage.getItem('adminToken') || '';

  // Language display names
  var langNames = { es: 'Español', en: 'English', pt: 'Português' };

  function authHeaders(extra) {
    var h = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    if (adminToken) h['Authorization'] = 'Bearer ' + adminToken;
    return h;
  }

  // --- Helpers ---

  function showAlert(el, msg) {
    el.textContent = msg;
    el.classList.add('visible');
  }

  function hideAlert(el) {
    el.classList.remove('visible');
  }

  function setLoading(btn, loading) {
    if (loading) {
      btn.classList.add('is-loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // --- Logout ---

  logoutBtn.addEventListener('click', function () {
    fetch('/admin/logout', { method: 'POST', headers: authHeaders(), credentials: 'same-origin' })
      .finally(function () {
        localStorage.removeItem('adminToken');
        window.location.href = '/login.html';
      });
  });

  // --- Create Instance ---

  createForm.addEventListener('submit', function (e) {
    e.preventDefault();
    hideAlert(createError);
    generatedResult.classList.remove('visible');
    copyFeedback.classList.remove('visible');

    var payload = {
      username: document.getElementById('cf-username').value.trim(),
      password: document.getElementById('cf-password').value.trim(),
      createdBy: document.getElementById('cf-createdBy').value.trim(),
      clientName: document.getElementById('cf-clientName').value.trim(),
      clientEmail: document.getElementById('cf-clientEmail').value.trim(),
      notes: document.getElementById('cf-notes').value.trim(),
      language: document.getElementById('cf-language').value
    };

    // Basic validation
    if (!payload.username || !payload.password || !payload.createdBy || !payload.clientName) {
      showAlert(createError, 'Completá los campos obligatorios (usuario, contraseña, creado por, nombre del cliente).');
      return;
    }

    setLoading(createBtn, true);

    fetch('/admin/forms/create', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    })
      .then(function (res) {
        if (!res.ok) throw new Error('create_failed');
        return res.json();
      })
      .then(function (data) {
        setLoading(createBtn, false);

        var link = window.location.origin + '/f/' + data.slug;
        currentLink = data.link || link;

        document.getElementById('genInstanceId').textContent = data.instanceId || '—';
        document.getElementById('genSlug').textContent = data.slug || '—';
        document.getElementById('genLink').textContent = currentLink;
        document.getElementById('genLanguage').textContent = langNames[payload.language] || payload.language;

        generatedResult.classList.add('visible');
        createForm.reset();

        // Refresh list
        loadInstances();
      })
      .catch(function () {
        setLoading(createBtn, false);
        showAlert(createError, 'Error al crear la instancia. Intentá nuevamente.');
      });
  });

  // --- Copy Link ---

  copyLinkBtn.addEventListener('click', function () {
    if (!currentLink) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentLink).then(function () {
        flashCopyFeedback();
      });
    } else {
      // Fallback
      var textarea = document.createElement('textarea');
      textarea.value = currentLink;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      flashCopyFeedback();
    }
  });

  function flashCopyFeedback() {
    copyFeedback.classList.add('visible');
    setTimeout(function () {
      copyFeedback.classList.remove('visible');
    }, 2500);
  }

  // --- Load Instances ---

  function loadInstances() {
    fetch('/admin/forms', { headers: authHeaders(), credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('fetch_failed');
        return res.json();
      })
      .then(function (data) {
        renderInstances(data.instances || data || []);
      })
      .catch(function () {
        // silently handle
      });
  }

  function renderInstances(instances) {
    if (!instances.length) {
      emptyState.classList.remove('hidden');
      // Remove any previously rendered cards
      var existing = instancesList.querySelectorAll('.instance-card');
      existing.forEach(function (el) { el.remove(); });
      return;
    }

    emptyState.classList.add('hidden');

    // Clear existing cards
    var existing = instancesList.querySelectorAll('.instance-card');
    existing.forEach(function (el) { el.remove(); });

    // Build cards
    var wrapper = document.createDocumentFragment();

    instances.forEach(function (inst) {
      var card = document.createElement('div');
      card.className = 'instance-card';

      var isCompleted = inst.status === 'completed';
      var badgeClass = isCompleted ? 'badge-completed' : 'badge-active';
      var badgeText = isCompleted ? 'Completado' : 'Activo';

      card.innerHTML =
        '<div class="instance-card-info">' +
          '<dl class="instance-card-field"><dt>Cliente</dt><dd>' + escHtml(inst.clientName || '—') + '</dd></dl>' +
          '<dl class="instance-card-field"><dt>Usuario</dt><dd>' + escHtml(inst.username || '—') + '</dd></dl>' +
          '<dl class="instance-card-field"><dt>Slug</dt><dd>' + escHtml(inst.slug || '—') + '</dd></dl>' +
          '<dl class="instance-card-field"><dt>Idioma</dt><dd>' + escHtml(langNames[inst.language] || inst.language || '—') + '</dd></dl>' +
          '<dl class="instance-card-field"><dt>Creado</dt><dd>' + formatDate(inst.createdAt) + '</dd></dl>' +
          (isCompleted ? '<dl class="instance-card-field"><dt>Completado</dt><dd>' + formatDate(inst.completedAt) + '</dd></dl>' : '') +
        '</div>' +
        '<div class="instance-card-status"><span class="badge ' + badgeClass + '">' + badgeText + '</span></div>';

      wrapper.appendChild(card);
    });

    instancesList.appendChild(wrapper);
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Init ---
  loadInstances();

})();
