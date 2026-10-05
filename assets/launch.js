(() => {
  // 1 November 2026, 00:00 Australia/Melbourne (AEDT, UTC+11).
  const deadline = Date.parse('2026-10-31T13:00:00Z');
  const dialog = document.getElementById('gamePlanLaunch');
  const seenKey = 'psp-game-plan-launch-2026';
  let previousFocus;
  function closeDialog() {
    if (dialog && dialog.open) dialog.close();
  }
  if (dialog) {
    dialog.querySelector('.launch-dialog-close').addEventListener('click', closeDialog);
    dialog.querySelector('.launch-dialog-dismiss').addEventListener('click', closeDialog);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('launch-dialog-open');
      if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    });
    let seen = false;
    try { seen = sessionStorage.getItem(seenKey) === 'seen'; } catch (_) {}
    if (!seen && Date.now() < deadline && typeof dialog.showModal === 'function') {
      setTimeout(() => {
        if (Date.now() >= deadline) return;
        previousFocus = document.activeElement;
        dialog.showModal();
        document.body.classList.add('launch-dialog-open');
        try { sessionStorage.setItem(seenKey, 'seen'); } catch (_) {}
      }, 1800);
    }
  }
  function updateOffer() {
    if (Date.now() < deadline) return;
    closeDialog();
    document.querySelectorAll('[data-launch-offer]').forEach(offer => {
      offer.querySelector('[data-offer-label]').textContent = offer.classList.contains('launch-summary') ? 'Full price' : 'The G.A.M.E. Plan';
      offer.querySelector('[data-offer-price]').textContent = '$699';
      ['[data-offer-normal]', '[data-offer-saving]', '[data-offer-code]'].forEach(selector => {
        const element = offer.querySelector(selector);
        if (element) element.hidden = true;
      });
      const description = offer.querySelector('[data-offer-deadline]');
      if (description) description.textContent = 'Program access is live. Train the mental side of your game.';
    });
    const badge = document.querySelector('.peak-card.active .status');
    if (badge) badge.textContent = 'Available Now';
  }
  updateOffer();
  setInterval(updateOffer, 1000);
})();
