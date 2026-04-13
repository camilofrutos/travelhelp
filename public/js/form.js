/**
 * form.js — DEMO: formulario paso a paso sin backend
 * Toma idioma de ?lang=, renderiza directo, submit va a success.html
 */
(function () {
  // --- State ---
  var lang = 'es';
  var currentStep = 0;
  var totalSteps = FORM_STEPS.length;

  // --- DOM refs ---
  var stepsContainer = document.getElementById('stepsContainer');
  var progressBar = document.getElementById('progressBar');
  var stepCounter = document.getElementById('stepCounter');

  // --- Get language from querystring ---
  var params = new URLSearchParams(window.location.search);
  var qLang = params.get('lang');
  if (qLang && I18N[qLang]) lang = qLang;
  document.documentElement.lang = lang;

  // --- Init: render form immediately ---
  buildSteps();
  goToStep(0);

  // --- Build Steps ---
  function buildSteps() {
    stepsContainer.innerHTML = '';

    FORM_STEPS.forEach(function (step, idx) {
      var stepEl = document.createElement('div');
      stepEl.className = 'form-step';
      stepEl.id = 'step-' + idx;
      stepEl.setAttribute('data-step', idx);

      var html = '';
      html += '<div class="form-step-number">' + (idx + 1) + '</div>';
      html += '<h2 class="form-step-title">' + esc(t(step.titleKey, lang)) + '</h2>';
      html += '<p class="form-step-subtitle">' + esc(t(step.subtitleKey, lang)) + '</p>';

      step.fields.forEach(function (field) {
        html += buildField(field);
      });

      // Navigation
      html += '<div class="form-step-nav">';
      if (idx > 0) {
        html += '<button type="button" class="btn btn-secondary" data-action="prev">' + esc(t('formPrev', lang)) + '</button>';
      } else {
        html += '<span></span>';
      }
      if (idx < totalSteps - 1) {
        html += '<button type="button" class="btn btn-primary" data-action="next">' + esc(t('formNext', lang)) + '</button>';
      } else {
        html += '<button type="button" class="btn btn-primary" data-action="submit">' +
          '<span class="btn-text">' + esc(t('formSubmit', lang)) + '</span></button>';
      }
      html += '</div>';

      if (idx < totalSteps - 1) {
        html += '<p class="enter-hint">' + esc(t('formEnterHint', lang)) + '</p>';
      }

      stepEl.innerHTML = html;
      stepsContainer.appendChild(stepEl);
    });

    // Nav click handler
    stepsContainer.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      if (action === 'prev') prevStep();
      if (action === 'next') nextStep();
      if (action === 'submit') submitDemo();
    });

    // Enter to advance
    stepsContainer.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (currentStep < totalSteps - 1) nextStep();
      }
    });
  }

  function buildField(field) {
    var html = '';
    var label = t(field.labelKey, lang);
    var placeholder = field.placeholderKey ? t(field.placeholderKey, lang) : '';
    var helpText = field.helpKey ? t(field.helpKey, lang) : '';

    if (field.type === 'checkbox') {
      html += '<div class="form-group">';
      html += '<label class="form-check">';
      html += '<input type="checkbox" id="field-' + field.id + '" name="' + field.id + '">';
      html += '<span class="form-check-label">' + label + '</span>';
      html += '</label>';
      html += '</div>';
      return html;
    }

    if (field.type === 'radio') {
      html += '<div class="form-group">';
      html += '<label class="form-label">' + label + '</label>';
      (field.options || []).forEach(function (opt) {
        html += '<label class="form-check">';
        html += '<input type="radio" name="' + field.id + '" value="' + escAttr(opt.value) + '">';
        html += '<span class="form-check-label">' + esc(t(opt.labelKey, lang)) + '</span>';
        html += '</label>';
      });
      if (helpText) html += '<p class="form-help">' + esc(helpText) + '</p>';
      html += '</div>';
      return html;
    }

    html += '<div class="form-group">';
    html += '<label class="form-label" for="field-' + field.id + '">' + label + '</label>';

    if (field.type === 'select') {
      html += '<select class="form-select" id="field-' + field.id + '" name="' + field.id + '">';
      (field.options || []).forEach(function (opt) {
        html += '<option value="' + escAttr(opt.value) + '">' + esc(t(opt.labelKey, lang)) + '</option>';
      });
      html += '</select>';
    } else if (field.type === 'textarea') {
      html += '<textarea class="form-textarea" id="field-' + field.id + '" name="' + field.id + '"' +
        ' rows="3"' +
        (placeholder ? ' placeholder="' + escAttr(placeholder) + '"' : '') +
        '></textarea>';
    } else {
      html += '<input class="form-input" type="' + field.type + '" id="field-' + field.id + '" name="' + field.id + '"' +
        (placeholder ? ' placeholder="' + escAttr(placeholder) + '"' : '') +
        '>';
    }

    if (helpText) html += '<p class="form-help">' + esc(helpText) + '</p>';
    html += '</div>';
    return html;
  }

  // --- Navigation ---
  function goToStep(idx) {
    currentStep = idx;
    var allSteps = stepsContainer.querySelectorAll('.form-step');
    allSteps.forEach(function (s) { s.classList.remove('active'); });

    var target = document.getElementById('step-' + idx);
    if (target) {
      target.classList.add('active');
      setTimeout(function () {
        var first = target.querySelector('input, select, textarea');
        if (first) first.focus();
      }, 100);
    }
    updateProgress();
  }

  function nextStep() {
    if (currentStep < totalSteps - 1) goToStep(currentStep + 1);
  }

  function prevStep() {
    if (currentStep > 0) goToStep(currentStep - 1);
  }

  function updateProgress() {
    var pct = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;
    progressBar.style.width = pct + '%';
    stepCounter.textContent = (currentStep + 1) + ' ' + t('formStepOf', lang) + ' ' + totalSteps;
  }

  // --- Submit demo ---
  function submitDemo() {
    window.location.href = 'success.html?lang=' + encodeURIComponent(lang);
  }

  // --- Utils ---
  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

})();
