/**
 * login.js — Admin login handler
 */
(function () {
  var form = document.getElementById('loginForm');
  var btn = document.getElementById('loginBtn');
  var errorEl = document.getElementById('loginError');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
  }

  function hideError() {
    errorEl.classList.remove('visible');
  }

  function setLoading(loading) {
    if (loading) {
      btn.classList.add('is-loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();

    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value.trim();

    if (!username || !password) {
      showError('Completá todos los campos.');
      return;
    }

    setLoading(true);

    fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password }),
      credentials: 'same-origin'
    })
      .then(function (res) {
        if (!res.ok) throw new Error('login_failed');
        return res.json();
      })
      .then(function (data) {
        if (data.token) localStorage.setItem('adminToken', data.token);
        window.location.href = '/admin.html';
      })
      .catch(function () {
        setLoading(false);
        showError('Credenciales inválidas. Intentá nuevamente.');
      });
  });
})();
