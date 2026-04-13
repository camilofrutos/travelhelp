/**
 * form.js — Public form: status check, login, dynamic step-by-step form, submit
 */
(function () {
  // --- State ---
  var slug = '';
  var lang = 'es';
  var token = null;
  var currentStep = 0;
  var totalSteps = FORM_STEPS.length;
  var formData = {};

  // --- DOM refs ---
  var loadingState = document.getElementById('loadingState');
  var statusError = document.getElementById('statusError');
  var statusIcon = document.getElementById('statusIcon');
  var statusTitle = document.getElementById('statusTitle');
  var statusMsg = document.getElementById('statusMsg');
  var loginSection = document.getElementById('loginSection');
  var formSection = document.getElementById('formSection');
  var stepsContainer = document.getElementById('stepsContainer');
  var progressWrapper = document.getElementById('progressWrapper');
  var progressBar = document.getElementById('progressBar');
  var stepCounter = document.getElementById('stepCounter');
  var submitError = document.getElementById('submitError');

  // --- Extract slug from URL ---
  // Expects /f/:slug or /form.html?slug=xxx
  function getSlug() {
    var match = window.location.pathname.match(/\/f\/([^/]+)/);
    if (match) return match[1];
    var params = new URLSearchParams(window.location.search);
    return params.get('slug') || '';
  }

  slug = getSlug();

  // --- Init ---
  if (!slug) {
    showStatus('error', t('formNotFound', lang), t('formNotFoundMsg', lang));
    return;
  }

  checkStatus();

  // --- Check status ---
  function checkStatus() {
    fetch('/f/' + encodeURIComponent(slug) + '/status')
      .then(function (res) {
        if (res.status === 404) throw { type: 'not_found' };
        if (!res.ok) throw { type: 'error' };
        return res.json();
      })
      .then(function (data) {
        // Detect language
        if (data.language && I18N[data.language]) {
          lang = data.language;
        }
        document.documentElement.lang = lang;

        if (data.status === 'completed') {
          showStatus('error', t('formCompleted', lang), t('formCompletedMsg', lang));
          return;
        }

        if (data.status !== 'active') {
          showStatus('error', t('formUnavailable', lang), t('formUnavailableMsg', lang));
          return;
        }

        // Show login
        showLogin();
      })
      .catch(function (err) {
        if (err && err.type === 'not_found') {
          showStatus('error', t('formNotFound', lang), t('formNotFoundMsg', lang));
        } else {
          showStatus('error', t('formUnavailable', lang), t('formUnavailableMsg', lang));
        }
      });
  }

  // --- Status display ---
  function showStatus(type, title, message) {
    loadingState.classList.add('hidden');
    loginSection.classList.add('hidden');
    formSection.classList.add('hidden');
    progressWrapper.style.display = 'none';
    stepCounter.textContent = '';

    statusIcon.className = 'status-message-icon ' + type;
    statusIcon.innerHTML = type === 'error' ? '&#10005;' : '&#10003;';
    statusTitle.textContent = title;
    statusMsg.textContent = message;
    statusError.classList.remove('hidden');
  }

  // --- Login ---
  function showLogin() {
    loadingState.classList.add('hidden');
    statusError.classList.add('hidden');
    loginSection.classList.remove('hidden');

    document.getElementById('formLoginTitle').textContent = t('formLoginTitle', lang);
    document.getElementById('formLoginSubtitle').textContent = t('formLoginSubtitle', lang);
    document.getElementById('flUsernameLabel').textContent = t('formLoginUsername', lang);
    document.getElementById('flPasswordLabel').textContent = t('formLoginPassword', lang);
    document.getElementById('formLoginBtnText').textContent = t('formLoginBtn', lang);
  }

  var formLoginForm = document.getElementById('formLoginForm');
  var formLoginBtn = document.getElementById('formLoginBtn');
  var formLoginError = document.getElementById('formLoginError');

  formLoginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    formLoginError.classList.remove('visible');

    var username = document.getElementById('fl-username').value.trim();
    var password = document.getElementById('fl-password').value.trim();

    if (!username || !password) return;

    formLoginBtn.classList.add('is-loading');
    formLoginBtn.disabled = true;

    fetch('/f/' + encodeURIComponent(slug) + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password }),
      credentials: 'same-origin'
    })
      .then(function (res) {
        if (!res.ok) throw new Error('auth_failed');
        return res.json();
      })
      .then(function (data) {
        formLoginBtn.classList.remove('is-loading');
        formLoginBtn.disabled = false;
        token = data.token || null;
        showForm();
      })
      .catch(function () {
        formLoginBtn.classList.remove('is-loading');
        formLoginBtn.disabled = false;
        formLoginError.textContent = t('formLoginError', lang);
        formLoginError.classList.add('visible');
      });
  });

  // --- Build & Show Form ---
  function showForm() {
    loginSection.classList.add('hidden');
    formSection.classList.remove('hidden');
    progressWrapper.style.display = 'block';

    buildSteps();
    goToStep(0);
  }

  function buildSteps() {
    stepsContainer.innerHTML = '';

    FORM_STEPS.forEach(function (step, idx) {
      var stepEl = document.createElement('div');
      stepEl.className = 'form-step';
      stepEl.id = 'step-' + idx;
      stepEl.setAttribute('data-step', idx);

      var html = '';
      html += '<div class="form-step-number">' + (idx + 1) + '</div>';
      html += '<h2 class="form-step-title">' + escHtml(t(step.titleKey, lang)) + '</h2>';
      html += '<p class="form-step-subtitle">' + escHtml(t(step.subtitleKey, lang)) + '</p>';

      step.fields.forEach(function (field) {
        html += buildField(field);
      });

      // Navigation
      html += '<div class="form-step-nav">';
      if (idx > 0) {
        html += '<button type="button" class="btn btn-secondary" data-action="prev">' + escHtml(t('formPrev', lang)) + '</button>';
      } else {
        html += '<span></span>';
      }
      if (idx < totalSteps - 1) {
        html += '<button type="button" class="btn btn-primary" data-action="next">' + escHtml(t('formNext', lang)) + '</button>';
      } else {
        html += '<button type="button" class="btn btn-primary" data-action="submit" id="submitBtn">' +
          '<span class="spinner"></span><span class="btn-text">' + escHtml(t('formSubmit', lang)) + '</span></button>';
      }
      html += '</div>';

      // Enter hint on non-last steps
      if (idx < totalSteps - 1) {
        html += '<p class="enter-hint">' + escHtml(t('formEnterHint', lang)) + '</p>';
      }

      stepEl.innerHTML = html;
      stepsContainer.appendChild(stepEl);
    });

    // Attach nav handlers
    stepsContainer.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      if (action === 'prev') prevStep();
      if (action === 'next') nextStep();
      if (action === 'submit') submitForm(btn);
    });

    // Enter key to advance
    stepsContainer.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        var stepEl = e.target.closest('.form-step');
        if (!stepEl) return;
        var idx = parseInt(stepEl.getAttribute('data-step'), 10);
        if (idx < totalSteps - 1) {
          nextStep();
        }
      }
    });
  }

  function buildField(field) {
    var html = '';
    var labelText = t(field.labelKey, lang);
    var placeholder = field.placeholderKey ? t(field.placeholderKey, lang) : '';
    var helpText = field.helpKey ? t(field.helpKey, lang) : '';
    var reqAttr = field.required ? ' required' : '';
    var reqMark = field.required ? ' <span style="color:var(--primary);">*</span>' : '';

    if (field.type === 'checkbox') {
      html += '<div class="form-group">';
      html += '<label class="form-check">';
      html += '<input type="checkbox" id="field-' + field.id + '" name="' + field.id + '"' + reqAttr + '>';
      html += '<span class="form-check-label">' + labelText + reqMark + '</span>';
      html += '</label>';
      html += '<div class="form-error-text" id="error-' + field.id + '">' + escHtml(t('formRequiredField', lang)) + '</div>';
      html += '</div>';
      return html;
    }

    if (field.type === 'radio') {
      html += '<div class="form-group">';
      html += '<label class="form-label">' + labelText + reqMark + '</label>';
      (field.options || []).forEach(function (opt) {
        html += '<label class="form-check">';
        html += '<input type="radio" name="' + field.id + '" value="' + escAttr(opt.value) + '"' + reqAttr + '>';
        html += '<span class="form-check-label">' + escHtml(t(opt.labelKey, lang)) + '</span>';
        html += '</label>';
      });
      html += '<div class="form-error-text" id="error-' + field.id + '">' + escHtml(t('formRequiredField', lang)) + '</div>';
      if (helpText) html += '<p class="form-help">' + escHtml(helpText) + '</p>';
      html += '</div>';
      return html;
    }

    html += '<div class="form-group">';
    html += '<label class="form-label" for="field-' + field.id + '">' + labelText + reqMark + '</label>';

    if (field.type === 'select') {
      html += '<select class="form-select" id="field-' + field.id + '" name="' + field.id + '"' + reqAttr + '>';
      (field.options || []).forEach(function (opt) {
        html += '<option value="' + escAttr(opt.value) + '">' + escHtml(t(opt.labelKey, lang)) + '</option>';
      });
      html += '</select>';
    } else if (field.type === 'textarea') {
      html += '<textarea class="form-textarea" id="field-' + field.id + '" name="' + field.id + '"' +
        ' rows="3"' + reqAttr +
        (placeholder ? ' placeholder="' + escAttr(placeholder) + '"' : '') +
        '></textarea>';
    } else {
      html += '<input class="form-input" type="' + field.type + '" id="field-' + field.id + '" name="' + field.id + '"' +
        reqAttr +
        (placeholder ? ' placeholder="' + escAttr(placeholder) + '"' : '') +
        '>';
    }

    html += '<div class="form-error-text" id="error-' + field.id + '">' + escHtml(t('formRequiredField', lang)) + '</div>';
    if (helpText) html += '<p class="form-help">' + escHtml(helpText) + '</p>';
    html += '</div>';

    return html;
  }

  // --- Step Navigation ---
  function goToStep(idx) {
    currentStep = idx;

    // Hide all steps
    var allSteps = stepsContainer.querySelectorAll('.form-step');
    allSteps.forEach(function (s) { s.classList.remove('active'); });

    // Show target step
    var target = document.getElementById('step-' + idx);
    if (target) {
      target.classList.add('active');

      // Focus first input
      setTimeout(function () {
        var first = target.querySelector('input, select, textarea');
        if (first) first.focus();
      }, 100);
    }

    updateProgress();
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    collectStepData(currentStep);
    if (currentStep < totalSteps - 1) {
      goToStep(currentStep + 1);
    }
  }

  function prevStep() {
    collectStepData(currentStep);
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }

  function updateProgress() {
    var pct = totalSteps > 1 ? ((currentStep) / (totalSteps - 1)) * 100 : 0;
    progressBar.style.width = pct + '%';
    stepCounter.textContent = (currentStep + 1) + ' ' + t('formStepOf', lang) + ' ' + totalSteps;
  }

  // --- Validation ---
  function validateStep(idx) {
    var step = FORM_STEPS[idx];
    var valid = true;

    step.fields.forEach(function (field) {
      var errorEl = document.getElementById('error-' + field.id);
      if (errorEl) {
        errorEl.classList.remove('visible');
        errorEl.textContent = t('formRequiredField', lang);
      }

      if (!field.required) return;

      var value = getFieldValue(field);

      if (field.type === 'checkbox') {
        var cb = document.getElementById('field-' + field.id);
        if (cb && !cb.checked) {
          markInvalid(field.id);
          valid = false;
        }
        return;
      }

      if (!value || (typeof value === 'string' && !value.trim())) {
        markInvalid(field.id);
        valid = false;
        return;
      }

      // Email validation
      if (field.type === 'email' && value) {
        var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(value)) {
          markInvalid(field.id, t('formInvalidEmail', lang));
          valid = false;
          return;
        }
      }

      // Phone validation
      if (field.type === 'tel' && value) {
        var phoneRe = /^[+]?[\d\s\-().]{7,20}$/;
        if (!phoneRe.test(value)) {
          markInvalid(field.id, t('formInvalidPhone', lang));
          valid = false;
          return;
        }
      }
    });

    return valid;
  }

  function markInvalid(fieldId, msg) {
    var el = document.getElementById('field-' + fieldId);
    if (el) el.classList.add('has-error');

    var errorEl = document.getElementById('error-' + fieldId);
    if (errorEl) {
      if (msg) errorEl.textContent = msg;
      errorEl.classList.add('visible');
    }

    // Clear error on next input
    if (el) {
      var handler = function () {
        el.classList.remove('has-error');
        if (errorEl) errorEl.classList.remove('visible');
        el.removeEventListener('input', handler);
        el.removeEventListener('change', handler);
      };
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    } else {
      // Radio group
      var radios = document.querySelectorAll('input[name="' + fieldId + '"]');
      radios.forEach(function (r) {
        r.addEventListener('change', function handler() {
          if (errorEl) errorEl.classList.remove('visible');
          radios.forEach(function (rr) { rr.removeEventListener('change', handler); });
        });
      });
    }
  }

  // --- Data Collection ---
  function getFieldValue(field) {
    if (field.type === 'radio') {
      var checked = document.querySelector('input[name="' + field.id + '"]:checked');
      return checked ? checked.value : '';
    }
    if (field.type === 'checkbox') {
      var cb = document.getElementById('field-' + field.id);
      return cb ? cb.checked : false;
    }
    var el = document.getElementById('field-' + field.id);
    return el ? el.value : '';
  }

  function collectStepData(idx) {
    var step = FORM_STEPS[idx];
    step.fields.forEach(function (field) {
      formData[field.id] = getFieldValue(field);
    });
  }

  // --- Submit ---
  function submitForm(btn) {
    if (!validateStep(currentStep)) return;
    collectStepData(currentStep);

    submitError.classList.remove('visible');
    btn.classList.add('is-loading');
    btn.disabled = true;

    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    fetch('/f/' + encodeURIComponent(slug) + '/submit', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(formData),
      credentials: 'same-origin'
    })
      .then(function (res) {
        if (!res.ok) throw new Error('submit_failed');
        return res.json();
      })
      .then(function () {
        // Logout silently
        var logoutHeaders = {};
        if (token) logoutHeaders['Authorization'] = 'Bearer ' + token;
        fetch('/f/' + encodeURIComponent(slug) + '/logout', {
          method: 'POST',
          headers: logoutHeaders,
          credentials: 'same-origin'
        }).catch(function () {});

        window.location.href = '/success.html?lang=' + encodeURIComponent(lang);
      })
      .catch(function () {
        btn.classList.remove('is-loading');
        btn.disabled = false;
        submitError.textContent = t('formSubmitError', lang);
        submitError.classList.add('visible');
      });
  }

  // --- Utilities ---
  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escAttr(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

})();
