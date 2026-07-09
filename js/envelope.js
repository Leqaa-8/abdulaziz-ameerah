(function () {
  'use strict';

  var page = document.getElementById('openingPage');
  var seal = document.getElementById('sealClick');

  if (!page || !seal) return;

  var opened = false;

  function openEnvelope() {
    if (opened) return;
    opened = true;

    /* Start background music (user gesture — safe to call play here) */
    if (window.WeddingAudio) {
      window.WeddingAudio.start();
    }

    /* Phase 1 — zoom in */
    page.classList.add('is-opening');

    /* Phase 2 — fade out (1300ms) */
    setTimeout(function () {
      page.classList.add('is-exiting');
    }, 1300);

    /* Phase 3 — navigate (2300ms) */
    setTimeout(function () {
      window.location.href = 'invitation.html';
    }, 2300);
  }

  seal.addEventListener('click', openEnvelope);

  seal.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelope();
    }
  });
})();
