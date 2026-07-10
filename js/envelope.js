(function () {
  'use strict';

  var page    = document.getElementById('openingPage');
  var seal    = document.getElementById('sealClick');
  var invWrap = document.getElementById('invitation');

  if (!page || !seal || !invWrap) return;

  var opened = false;

  function revealInvitation() {
    /* Unlock scrolling (overrides style.css overflow:hidden) */
    document.documentElement.style.height    = 'auto';
    document.documentElement.style.overflowY = 'auto';
    document.body.style.height               = 'auto';
    document.body.style.overflowY            = 'auto';

    /* Show invitation content */
    invWrap.removeAttribute('hidden');

    /* Reset scroll position */
    window.scrollTo(0, 0);

    /* Notify canvas to resize (particles live inside the now-visible hero) */
    window.dispatchEvent(new Event('resize'));

    /* Attempt background video playback */
    var heroVideo = invWrap.querySelector('.hero-video');
    if (heroVideo) {
      heroVideo.muted        = true;
      heroVideo.defaultMuted = true;
      heroVideo.volume       = 0;

      heroVideo.play().then(function () {
        /* Normal: video autoplays silently */
        document.documentElement.classList.add('video-autoplay-active');
      }).catch(function () {
        /* Low Power Mode or strict policy: hide video, poster shows as bg */
        document.documentElement.classList.add('video-autoplay-blocked');
        heroVideo.hidden = true;
      });
    }
  }

  function openEnvelope() {
    if (opened) return;
    opened = true;

    /* Start wedding music on this user gesture — single persistent Audio object */
    if (window.WeddingAudio) {
      window.WeddingAudio.start();
    }

    /* Phase 1 — gentle zoom in */
    page.classList.add('is-opening');

    /* Phase 2 — fade out */
    setTimeout(function () {
      page.classList.add('is-exiting');
    }, 1300);

    /* Phase 3 — remove envelope, reveal invitation (no page navigation) */
    setTimeout(function () {
      page.style.display = 'none';
      revealInvitation();
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
