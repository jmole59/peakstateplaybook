(() => {
  const form = document.getElementById('lessonPreviewForm');
  if (!form) return;
  const fields = form.querySelector('fieldset');
  const status = document.getElementById('lessonPreviewStatus');
  const enabled = form.dataset.signupEnabled === 'true' &&
    ['peakstateplaybook.com', 'www.peakstateplaybook.com'].includes(location.hostname);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (enabled) submit();
  });
  const previewButton = document.getElementById('lessonVideoUnlock');
  if (previewButton && typeof previewButton.addEventListener === 'function') previewButton.addEventListener('click', () => {
    const prompt = document.getElementById('lessonVideoPrompt');
    if (prompt) {
      prompt.textContent = 'Enter your details to receive this exclusive lesson by email.';
      prompt.hidden = false;
    }
    if (enabled && !form.elements.email.disabled) {
      form.elements.email.focus({ preventScroll: true });
      form.elements.email.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center'
      });
    }
  });
  if (!enabled) { fields.disabled = true; return; }
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
        requestId: crypto.randomUUID(), marketingConsent: form.elements.marketingConsent.checked,
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
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
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
          form.elements[name].disabled = pending !== null;
        });
        resetChallenge();
      }
      refreshButton();
    }
  }
})();

