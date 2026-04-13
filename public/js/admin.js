/**
 * admin.js — DEMO: genera links fake sin backend
 */
(function () {
  var createForm = document.getElementById('createForm');
  var createBtn = document.getElementById('createBtn');
  var generatedResult = document.getElementById('generatedResult');
  var copyLinkBtn = document.getElementById('copyLinkBtn');
  var copyFeedback = document.getElementById('copyFeedback');
  var logoutBtn = document.getElementById('logoutBtn');

  var currentLink = '';
  var langNames = { es: 'Español', en: 'English', pt: 'Português' };

  // Logout — volver a login
  logoutBtn.addEventListener('click', function () {
    window.location.href = 'login.html';
  });

  // Generar link fake
  createForm.addEventListener('submit', function (e) {
    e.preventDefault();
    generatedResult.classList.remove('visible');
    copyFeedback.classList.remove('visible');

    var language = document.getElementById('cf-language').value || 'es';
    var clientName = document.getElementById('cf-clientName').value.trim() || 'demo';

    // Fake slug
    var slug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 15) + '-' + Date.now().toString(36);
    var fakeId = 'id-' + Math.random().toString(36).slice(2, 10);

    currentLink = window.location.origin + '/form.html?slug=' + slug + '&lang=' + language;

    // Simular loading corto
    createBtn.classList.add('is-loading');
    createBtn.disabled = true;

    setTimeout(function () {
      createBtn.classList.remove('is-loading');
      createBtn.disabled = false;

      document.getElementById('genInstanceId').textContent = fakeId;
      document.getElementById('genSlug').textContent = slug;
      document.getElementById('genLink').textContent = currentLink;
      document.getElementById('genLanguage').textContent = langNames[language] || language;

      generatedResult.classList.add('visible');
    }, 500);
  });

  // Copiar link
  copyLinkBtn.addEventListener('click', function () {
    if (!currentLink) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentLink).then(function () {
        flashCopy();
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = currentLink;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flashCopy();
    }
  });

  function flashCopy() {
    copyFeedback.classList.add('visible');
    setTimeout(function () {
      copyFeedback.classList.remove('visible');
    }, 2500);
  }
})();
