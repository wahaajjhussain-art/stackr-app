/**
 * STACKR — Intro Animation Controller
 *
 * Timeline (ms):
 *   0        → Screen dark, landing visible behind backdrop-filter blur
 *   400      → Phase 2: bars appear (staggered, 170ms apart)
 *   1100     → Wordmark fades in
 *   1400     → Phase 3: bars shift to tighter alignment (1000ms ease)
 *   2550     → Phase 4: glow halo pulses briefly (380ms)
 *   3050     → Phase 5: intro exits, navbar logo appears
 *   4000     → Overlay removed from paint tree
 */

(function () {
  'use strict';

  /* ---------------------------------------------------------------
     Bar configuration
     initX  → starting horizontal offset (scattered, imperfect stack)
     endX   → resting horizontal offset  (tighter but still offset)
     Offsets symbolise habit imperfection → gradual alignment
  --------------------------------------------------------------- */
  var BARS = [
    { initX: 20, endX: 10 },   /* bar 0 — top    */
    { initX: 8,  endX: 4  },   /* bar 1           */
    { initX: 30, endX: 14 },   /* bar 2 — widest scatter */
    { initX: 4,  endX: 2  },   /* bar 3           */
    { initX: 16, endX: 8  }    /* bar 4 — bottom  */
  ];

  /* ---------------------------------------------------------------
     Phase timing (milliseconds)
  --------------------------------------------------------------- */
  var T = {
    P2_START : 400,    /* first bar appears         */
    STAGGER  : 170,    /* delay between each bar    */
    LABEL_AT : 1100,   /* wordmark fades in         */
    P3_START : 1400,   /* alignment begins          */
    P3_DUR   : 1000,   /* alignment transition ms   */
    P4_START : 2550,   /* glow pulse starts         */
    P4_DUR   : 380,    /* glow pulse duration ms    */
    P5_START : 3050,   /* exit + nav reveal begins  */
    CLEANUP  : 4000    /* overlay removed from DOM  */
  };

  /* ---------------------------------------------------------------
     Helpers
  --------------------------------------------------------------- */
  function el(id)       { return document.getElementById(id); }
  function wait(fn, ms) { return setTimeout(fn, ms); }

  function applyStyle(node, props) {
    Object.keys(props).forEach(function (k) { node.style[k] = props[k]; });
  }

  /* ---------------------------------------------------------------
     Main init — runs once DOM is ready
  --------------------------------------------------------------- */
  function init() {
    var overlay  = el('stackr-intro');
    var center   = el('intro-center');
    var label    = el('intro-label');
    var glow     = el('intro-glow');
    var bars     = Array.from(document.querySelectorAll('.ibar'));
    var navIcon  = document.querySelector('.s-nav-icon');
    var navName  = document.querySelector('.s-nav-name');

    /* Guard: overlay already removed (e.g. cached page) */
    if (!overlay) return;

    /* ---- Set initial bar positions immediately (no transition) ---- */
    bars.forEach(function (bar, i) {
      applyStyle(bar, {
        transition : 'none',
        transform  : 'translate(' + BARS[i].initX + 'px, 16px)',
        opacity    : '0'
      });
    });


    /* ---- Phase 2: bars rise in one-by-one ---- */
    bars.forEach(function (bar, i) {
      wait(function () {
        applyStyle(bar, {
          transition : 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
          transform  : 'translate(' + BARS[i].initX + 'px, 0px)',
          opacity    : '1'
        });
      }, T.P2_START + i * T.STAGGER);
    });


    /* ---- Wordmark appears after last bar ---- */
    wait(function () {
      label.classList.add('s-visible');
    }, T.LABEL_AT);


    /* ---- Phase 3: bars drift into tighter alignment ---- */
    wait(function () {
      bars.forEach(function (bar, i) {
        applyStyle(bar, {
          transition : 'transform ' + T.P3_DUR + 'ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transform  : 'translate(' + BARS[i].endX + 'px, 0px)'
        });
      });
    }, T.P3_START);


    /* ---- Phase 4: subtle glow confirms identity ---- */
    wait(function () {
      glow.classList.add('s-active');
      wait(function () {
        glow.classList.remove('s-active');
      }, T.P4_DUR);
    }, T.P4_START);


    /* ---- Phase 5: intro exits, landing page fully revealed ---- */
    wait(function () {
      /* Logo contracts and fades */
      center.classList.add('s-exit');

      /* Overlay fades; backdrop-filter lifts → landing becomes sharp */
      overlay.classList.add('s-fade-out');

      /* Navbar logo assembles into view */
      if (navIcon) navIcon.classList.add('s-visible');
      if (navName) navName.classList.add('s-visible');
    }, T.P5_START);


    /* ---- Cleanup: remove overlay from paint tree ---- */
    wait(function () {
      overlay.classList.add('s-done');
    }, T.CLEANUP);
  }


  /* ---------------------------------------------------------------
     Bootstrap
  --------------------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
