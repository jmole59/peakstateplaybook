(() => {
  // 1 November 2026, 00:00 Australia/Melbourne (AEDT, UTC+11).
  const deadline = Date.parse('2026-10-31T13:00:00Z');
  function updateOffer() {
    if (Date.now() < deadline) return;
    document.querySelectorAll('[data-launch-offer]').forEach(offer => {
      offer.querySelector('[data-offer-label]').textContent = 'The G.A.M.E. Plan';
      offer.querySelector('[data-offer-price]').textContent = 'A$699';
      offer.querySelector('[data-offer-normal]').hidden = true;
      offer.querySelector('[data-offer-saving]').hidden = true;
      offer.querySelector('[data-offer-deadline]').textContent = 'Program access is live. Train the mental side of your game.';
    });
    const badge = document.querySelector('.peak-card.active .status');
    if (badge) badge.textContent = 'Available Now';
  }
  updateOffer();
  setInterval(updateOffer, 1000);
})();
