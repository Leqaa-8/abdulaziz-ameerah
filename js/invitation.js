(function () {
  'use strict';

  // ── Video autoplay — silent decorative background ──────────────
  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    // Lock muted state in JS — required for iOS autoplay policy
    heroVideo.muted        = true;
    heroVideo.defaultMuted = true;
    heroVideo.volume       = 0;

    var startVideo = function () {
      heroVideo.muted  = true;
      heroVideo.volume = 0;
      var promise = heroVideo.play();
      if (promise !== undefined) {
        promise.catch(function () {});
      }
    };

    // Try immediately on DOM ready
    startVideo();

    // Re-attempt on first touch — covers Safari strict autoplay gate
    document.addEventListener('touchstart',       startVideo, { once: true, passive: true });
    // Re-attempt on click — covers WhatsApp / Telegram in-app browsers
    document.addEventListener('click',            startVideo, { once: true });
    // Re-attempt after back-navigation (bfcache restore)
    window.addEventListener('pageshow',           startVideo);
    // Re-attempt when tab becomes visible again
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) startVideo();
    });
  }

  // ── Countdown timer ──────────────────────────────────────────
  var TARGET = new Date('2026-08-14T20:00:00');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function setNum(id, val) {
    var el = document.getElementById(id);
    if (!el || el.textContent === val) return;
    el.style.opacity = '0';
    setTimeout(function () {
      el.textContent   = val;
      el.style.opacity = '1';
    }, 120);
  }

  function tick() {
    var diff = TARGET - Date.now();

    if (diff <= 0) {
      ['cd-days','cd-hours','cd-minutes','cd-seconds'].forEach(function (id) {
        setNum(id, '00');
      });
      return;
    }

    setNum('cd-days',    pad(Math.floor(diff / 86400000)));
    setNum('cd-hours',   pad(Math.floor((diff % 86400000) / 3600000)));
    setNum('cd-minutes', pad(Math.floor((diff % 3600000)  / 60000)));
    setNum('cd-seconds', pad(Math.floor((diff % 60000)    / 1000)));
  }

  tick();
  setInterval(tick, 1000);

  // ── Floating dust particles ───────────────────────────────────
  (function () {
    var canvas = document.querySelector('.hero-particles');
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ctx = canvas.getContext('2d');
    var pts = [];
    var N   = 36;

    function resize() {
      var hero = document.getElementById('s-hero');
      canvas.width  = hero ? hero.offsetWidth  : window.innerWidth;
      canvas.height = hero ? hero.offsetHeight : window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    for (var i = 0; i < N; i++) {
      pts.push({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        r:  0.6 + Math.random() * 1.4,
        vx: (Math.random() - 0.5) * 0.09,
        vy: -(0.04 + Math.random() * 0.10),
        o:  0.020 + Math.random() * 0.045
      });
    }

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var j = 0; j < pts.length; j++) {
        var p = pts[j];
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4)                p.y = canvas.height + 4;
        if (p.x < -4)                p.x = canvas.width  + 4;
        if (p.x > canvas.width  + 4) p.x = -4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(196,158,66,' + p.o + ')';
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    frame();
  })();

  // ── Scroll reveal via IntersectionObserver ───────────────────
  var revealEls = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el   = entry.target;
        var d    = parseInt(el.getAttribute('data-d') || '0', 10);
        // Hero elements wait for the card entrance animation to settle
        var base = el.closest && el.closest('#s-hero') ? 200 : 0;

        setTimeout(function () {
          el.classList.add('is-visible');
        }, base + d * 140);

        observer.unobserve(el);
      });
    }, { threshold: 0.12 });

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: reveal everything at once
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

})();
