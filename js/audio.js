(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     CONFIG
  ───────────────────────────────────────────── */
  var TRACK      = 'assets/audio/wedding-music.m4a';
  var KEY        = 'wa_v3';
  var TARGET_VOL = 0.45;
  var FADE_IN_MS = 800;

  /* ─────────────────────────────────────────────
     STATE  (localStorage)
     { started, playing, muted, pos }
  ───────────────────────────────────────────── */
  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }

  function saveState(patch) {
    var s = loadState();
    for (var k in patch) { if (patch.hasOwnProperty(k)) s[k] = patch[k]; }
    try { localStorage.setItem(KEY, JSON.stringify(s)); }
    catch (e) {}
  }

  /* ─────────────────────────────────────────────
     AUDIO ELEMENT
  ───────────────────────────────────────────── */
  var audio     = new Audio(TRACK);
  audio.loop    = true;
  audio.preload = 'auto';
  audio.volume  = 0;

  audio.addEventListener('canplaythrough', function () {
    console.log('[WA] audio ready:', TRACK);
  });
  audio.addEventListener('error', function () {
    console.error('[WA] load error — code:', audio.error && audio.error.code, TRACK);
  });

  /* ─────────────────────────────────────────────
     FADE  (rAF — only used for the initial fade-in)
  ───────────────────────────────────────────── */
  var _raf = null;

  function fadeIn(ms) {
    cancelAnimationFrame(_raf);
    var t0 = null;
    (function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / ms, 1);
      audio.volume = Math.max(0, Math.min(TARGET_VOL, TARGET_VOL * p));
      if (p < 1) {
        _raf = requestAnimationFrame(step);
      } else {
        audio.volume = TARGET_VOL;
      }
    })(performance.now());
  }

  /* ─────────────────────────────────────────────
     POSITION TRACKING  (every 500 ms)
  ───────────────────────────────────────────── */
  var _tracker = null;

  function startTracking() {
    if (_tracker) return;
    _tracker = setInterval(function () {
      if (!audio.paused) {
        saveState({ pos: audio.currentTime });
      }
    }, 500);
  }

  /* ─────────────────────────────────────────────
     PLAY HELPER
  ───────────────────────────────────────────── */
  function playFrom(pos, muted, doFade) {
    audio.currentTime = pos || 0;
    audio.muted       = !!muted;
    /* If muted, keep volume at TARGET_VOL so unmuting is instant */
    audio.volume      = muted ? TARGET_VOL : 0;

    return audio.play().then(function () {
      if (!audio.muted && doFade) {
        fadeIn(FADE_IN_MS);
      } else if (!audio.muted) {
        audio.volume = TARGET_VOL;
      }
      saveState({ playing: true, muted: !!muted });
      startTracking();
    });
  }

  /* ─────────────────────────────────────────────
     BUTTON  (injected once per page)
  ───────────────────────────────────────────── */
  var _btn = null;

  var SVG_ON =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
    '<path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var SVG_OFF =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
    '<line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '<line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '</svg>';

  var BTN_CSS =
    '#wa-btn{' +
      'position:fixed;bottom:28px;left:28px;z-index:9999;' +
      'width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;color:#4A4037;' +
      'background:rgba(255,255,255,.82);' +
      'backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);' +
      'box-shadow:0 4px 24px rgba(60,44,20,.15),0 1px 6px rgba(60,44,20,.09),inset 0 1px 0 rgba(255,255,255,.9);' +
      'outline:none;-webkit-tap-highlight-color:transparent;' +
      'transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s ease;' +
      'animation:wa-pop .55s cubic-bezier(.22,1,.36,1) both;' +
    '}' +
    '#wa-btn svg{display:block;width:22px;height:22px;flex-shrink:0;}' +
    '#wa-btn:hover{transform:scale(1.09);box-shadow:0 8px 32px rgba(60,44,20,.2),0 2px 8px rgba(60,44,20,.11),inset 0 1px 0 rgba(255,255,255,.9);}' +
    '#wa-btn:active{transform:scale(.93);}' +
    '#wa-btn:focus-visible{outline:2px solid rgba(196,162,101,.65);outline-offset:3px;}' +
    '@keyframes wa-pop{from{opacity:0;transform:scale(.7) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}' +
    '@media(max-width:480px){#wa-btn{bottom:20px;left:20px;width:52px;height:52px;}#wa-btn svg{width:20px;height:20px;}}';

  function setIcon(muted) {
    if (!_btn) return;
    _btn.innerHTML = muted ? SVG_OFF : SVG_ON;
    _btn.setAttribute('aria-label', muted ? 'تشغيل الموسيقى' : 'كتم الموسيقى');
  }

  function injectButton(muted) {
    if (_btn || document.getElementById('wa-btn')) {
      /* Button already exists — just sync the icon */
      _btn = _btn || document.getElementById('wa-btn');
      setIcon(!!muted);
      return;
    }

    if (!document.getElementById('wa-styles')) {
      var st = document.createElement('style');
      st.id  = 'wa-styles';
      st.textContent = BTN_CSS;
      document.head.appendChild(st);
    }

    _btn      = document.createElement('button');
    _btn.id   = 'wa-btn';
    _btn.type = 'button';
    setIcon(!!muted);

    _btn.addEventListener('click', function () {
      WeddingAudio.toggle();
    });

    document.body.appendChild(_btn);
  }

  /* ─────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────── */
  var WeddingAudio = window.WeddingAudio = {

    /**
     * start() — called once on the seal click (first user gesture).
     * Always plays. Fades in unless the user had previously muted.
     */
    start: function () {
      var s = loadState();
      saveState({ started: true });

      if (!audio.paused) {
        /* Already playing (shouldn't happen on index.html but guard it) */
        injectButton(audio.muted);
        return;
      }

      console.log('[WA] starting from', (parseFloat(s.pos) || 0).toFixed(1) + 's', s.muted ? '(muted)' : '');

      playFrom(parseFloat(s.pos) || 0, !!s.muted, true)
        .then(function () {
          console.log('[WA] playing');
          injectButton(audio.muted);
        })
        .catch(function (err) {
          console.error('[WA] start blocked:', err);
        });
    },

    /**
     * toggle() — mute ↔ unmute instantly via audio.muted.
     * Never stops the audio object. Icon updates synchronously.
     */
    toggle: function () {
      var nowMuted = !audio.muted;

      /* Update icon immediately — no async, no callbacks */
      audio.muted = nowMuted;
      setIcon(nowMuted);
      saveState({ muted: nowMuted });

      if (!nowMuted) {
        /* Unmuting: ensure volume is audible */
        audio.volume = TARGET_VOL;

        /* If somehow the audio paused (e.g. browser suspended it) — resume */
        if (audio.paused) {
          var pos = parseFloat(loadState().pos) || audio.currentTime;
          audio.currentTime = pos;
          audio.play()
            .then(function () {
              console.log('[WA] resumed after unmute');
              startTracking();
            })
            .catch(function (err) {
              console.error('[WA] resume after unmute failed:', err);
            });
        }

        console.log('[WA] unmuted at', audio.currentTime.toFixed(1) + 's');
      } else {
        console.log('[WA] muted at', audio.currentTime.toFixed(1) + 's');
      }
    }
  };

  /* ─────────────────────────────────────────────
     SAVE POSITION BEFORE NAVIGATION
  ───────────────────────────────────────────── */
  window.addEventListener('beforeunload', function () {
    saveState({
      pos:     audio.currentTime,
      playing: !audio.paused,
      muted:   audio.muted
    });
  });

  window.addEventListener('pagehide', function () {
    /* pagehide fires on mobile Safari where beforeunload may not */
    saveState({
      pos:     audio.currentTime,
      playing: !audio.paused,
      muted:   audio.muted
    });
  });

  /* ─────────────────────────────────────────────
     AUTO-RESUME ON PAGE LOAD
     Restores seamless playback when navigating to invitation.html
     or on a hard refresh.
  ───────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var s = loadState();

    /* Nothing to do if music was never started */
    if (!s.started) return;

    var pos = parseFloat(s.pos) || 0;

    injectButton(!!s.muted);

    if (s.playing) {
      console.log('[WA] auto-resume at', pos.toFixed(1) + 's', s.muted ? '(muted)' : '');

      playFrom(pos, !!s.muted, true)
        .then(function () {
          console.log('[WA] auto-resumed');
          setIcon(audio.muted);
        })
        .catch(function (err) {
          /* Autoplay blocked — button is visible; user tap will resume */
          console.warn('[WA] auto-resume blocked (awaiting user gesture):', err);
          setIcon(true); /* show muted icon since we can't play yet */

          /* One-shot: resume on next user interaction anywhere on the page */
          function onGesture() {
            document.removeEventListener('click',      onGesture, true);
            document.removeEventListener('touchstart', onGesture, true);
            if (audio.paused) {
              playFrom(parseFloat(loadState().pos) || 0, !!loadState().muted, true)
                .then(function () {
                  setIcon(audio.muted);
                  console.log('[WA] resumed on user gesture');
                })
                .catch(function () {});
            }
          }

          document.addEventListener('click',      onGesture, true);
          document.addEventListener('touchstart', onGesture, true);
        });
    }
  });

})();
