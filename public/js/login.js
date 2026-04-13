/**
 * login.js — DEMO: acepta cualquier input y redirige al admin
 */
(function () {
  var form = document.getElementById('loginForm');
  var btn = document.getElementById('loginBtn');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    btn.classList.add('is-loading');
    btn.disabled = true;
    setTimeout(function () {
      window.location.href = 'admin.html';
    }, 400);
  });
})();
