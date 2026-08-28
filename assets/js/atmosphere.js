/**
 * atmosphere.js — cursor spotlight and its touch-device fallback.
 *
 * Desktop: the glow layer follows the pointer. It writes two custom
 * properties and nothing else, and it does so inside the shared frame loop
 * from utils.js — no new listener, no new requestAnimationFrame loop.
 *
 * The glow is moved with translate3d only. Its gradient is painted once and
 * never repositioned, so following the pointer costs a composite rather than
 * a full-screen repaint. See the note at the top of atmosphere.css.
 *
 * Touch: nothing tracks the finger. The glow parks at a per-section position
 * and eases between them as sections scroll into view, which gives the same
 * atmosphere for none of the cost.
 */

(function (OK) {
  'use strict';

  if (!OK) return;

  const layer = document.querySelector('[data-atmos-glow]');
  if (!layer) return;

  const root = document.documentElement;

  /* ---------------------------------------------------------------------
     Desktop — pointer following
     --------------------------------------------------------------------- */

  if (OK.canEnhancePointer()) {
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.3;

    const frame = () => {
      // Eased rather than pinned: the glow trails the pointer slightly,
      // which is what stops it reading as an object attached to the cursor.
      x = OK.lerp(x, OK.pointer.x, 0.08);
      y = OK.lerp(y, OK.pointer.y, 0.08);
      root.style.setProperty('--glow-x', `${x.toFixed(1)}px`);
      root.style.setProperty('--glow-y', `${y.toFixed(1)}px`);
    };

    OK.addFrame(frame);
    return;
  }

  /* ---------------------------------------------------------------------
     Touch / reduced motion — per-section parking
     ---------------------------------------------------------------------
     Positions are deliberately off-centre and different per section so the
     background is never quite the same twice while scrolling.             */

  if (OK.reducedMotion()) return;

  const PARKS = {
    top:             ['70vw', '20vh'],
    work:            ['30vw', '40vh'],
    'beyond-build':  ['65vw', '55vh'],
    capabilities:    ['25vw', '45vh'],
    about:           ['75vw', '50vh'],
    'opening-hand':  ['40vw', '45vh'],
    contact:         ['60vw', '35vh']
  };

  const sections = Object.keys(PARKS)
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const park = PARKS[entry.target.id];
        if (!park) return;
        root.style.setProperty('--glow-x', park[0]);
        root.style.setProperty('--glow-y', park[1]);
      });
    },
    { rootMargin: '-35% 0px -35% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
})(window.OK);
