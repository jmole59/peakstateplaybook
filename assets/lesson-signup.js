(() => {
  const form = document.getElementById('lessonPreviewForm');
  if (!form) return;
  const fields = form.querySelector('fieldset');
  const status = document.getElementById('lessonPreviewStatus');
  // Deliberate release gate. Requires approved backend deployment and controlled test.
  const previewTest = form.dataset.signupTestEnabled === 'true' &&
    location.hostname === 'deploy-preview-7--cool-cajeta-ad120e.netlify.app';
  const productionTest = form.dataset.signupTestEnabled === 'true' &&
    ['peakstateplaybook.com', 'www.peakstateplaybook.com'].includes(location.hostname) &&
    new URLSearchParams(location.search).get('lesson-test') === '1';
  const enabled = previewTest || productionTest || (form.dataset.signupEnabled === 'true' &&
    ['peakstateplaybook.com', 'www.peakstateplaybook.com'].includes(location.hostname));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (enabled) submit();
  });
  if (!enabled) { fields.disabled = true; return; }
  if (previewTest || productionTest) {
    form.elements.email.value = 'info@peakstateplaybook.com';
    form.elements.email.readOnly = true;
    status.textContent = 'Controlled test only. Sends to info@peakstateplaybook.com.';
  }
  if (productionTest) {
    form.elements.marketingConsent.checked = false;
    form.elements.marketingConsent.disabled = true;
  }
  let widget, token = '', pending = null, busy = false, saved = false;
  const button = form.querySelector('button[type="submit"]');
  function refreshButton() { button.disabled = busy || saved || !token; }
  function resetChallenge() {
    token = ''; refreshButton();
    if (widget !== undefined) window.turnstile.reset(widget);
  }
  window.pspLessonTurnstileReady = () => {
    widget = window.turnstile.render('#lessonTurnstile', {
      sitekey: '0x4AAAAAAFO0hWrXM1YPyaBS', action: 'lesson_signup', theme: 'dark',
      callback(value) { token = value; refreshButton(); },
      'expired-callback'() { resetChallenge(); },
      'error-callback'() { token = ''; refreshButton(); status.textContent = 'Verification could not load. Please refresh and try again.'; }
    });
    fields.disabled = false; refreshButton();
  };
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=pspLessonTurnstileReady';
  script.async = true;
  script.onerror = () => { status.textContent = 'Verification could not load. Please refresh and try again.'; };
  document.head.append(script);
  async function submit() {
    if (busy || saved || !token || !form.reportValidity()) return;
    if (!pending) {
      pending = {
        email: form.elements.email.value.trim(), firstName: form.elements.firstName.value.trim(),
        requestId: crypto.randomUUID(), marketingConsent: productionTest ? false : form.elements.marketingConsent.checked,
        consentVersion: 'psp-tips-v1', website: form.elements.website.value
      };
    }
    // Lock the same payload after an uncertain response; retry with the same UUID.
    busy = true; fields.disabled = true; refreshButton();
    status.textContent = 'Saving your request…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch('/.netlify/functions/lesson-signup', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(productionTest ? {'X-PSP-Release-Test': 'production'} : {}) },
        body: JSON.stringify({ ...pending, turnstileToken: token }), signal: controller.signal
      });
      const result = await response.json();
      if (response.status === 202 && result.ok === true && result.saved === true) {
        saved = true;
        status.textContent = 'Your request is saved. Your lesson email will be sent shortly.';
      } else {
        if (response.status === 400) { pending = null; fields.disabled = false; }
        status.textContent = response.status === 503
          ? 'Signup is temporarily unavailable. Your details are retained. Please try again shortly.'
          : 'Your request could not be confirmed. Your details are retained. Please check verification and try again.';
      }
    } catch (_) {
      status.textContent = 'We could not confirm your request. Your details are retained. Please retry safely.';
    } finally {
      clearTimeout(timeout); busy = false;
      if (!saved) {
        // Allow retry button/challenge, keep uncertain request values locked.
        fields.disabled = false;
        ['email', 'firstName', 'marketingConsent', 'website'].forEach(name => {
          form.elements[name].disabled = pending !== null || (productionTest && name === 'marketingConsent');
        });
        resetChallenge();
      }
      refreshButton();
    }
  }
})();
