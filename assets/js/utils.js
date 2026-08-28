/**
 * utils.js — shared runtime for the interactive layer.
 *
 * Three things live here so the rest of the site does not duplicate them:
 *
 *   1. ONE requestAnimationFrame loop. Every pointer-driven effect
 *      subscribes to it instead of starting its own loop, so the page never
 *      runs four rAF loops competing for the same frame budget. The loop
 *      stops itself when the last subscriber leaves.
 *
 *   2. ONE pointermove listener. Handlers record the position and nothing
 *      else — all reading, measuring and writing happens inside the frame
 *      loop, which is what keeps `pointermove` off the critical path.
 *
 *   3. ONE debounced resize bus, for cached geometry that has to be
 *      re-measured when the layout changes.
 *
 * Loaded first; every other script depends on it.
 */

window.OK = (function () {
  'use strict';

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------------------------------------------------------------------
     Frame loop
     --------------------------------------------------------------------- */

  const subscribers = new Set();
  let running = false;

  function tick(now) {
    subscribers.forEach((fn) => fn(now));

    if (subscribers.size > 0) {
      requestAnimationFrame(tick);
    } else {
      running = false;
    }
  }

  function addFrame(fn) {
    subscribers.add(fn);
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }

  function removeFrame(fn) {
    subscribers.delete(fn);
  }

  /* ---------------------------------------------------------------------
     Pointer
     --------------------------------------------------------------------- */

  const pointer = { x: 0, y: 0, active: false };

  if (pointerQuery.matches) {
    window.addEventListener(
      'pointermove',
      (event) => {
        // Ignore synthesised mouse events from touch and pen input.
        if (event.pointerType !== 'mouse') return;
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.active = true;
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------------------
     Resize bus
     --------------------------------------------------------------------- */

  const resizeHandlers = new Set();
  let resizeTimer = 0;

  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => resizeHandlers.forEach((fn) => fn()), 150);
    },
    { passive: true }
  );

  function onResize(fn) {
    resizeHandlers.add(fn);
  }

  /* ---------------------------------------------------------------------
     Maths
     --------------------------------------------------------------------- */

  const lerp = (from, to, amount) => from + (to - from) * amount;

  const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);

  /** Smoothstep — eases a normalised 0..1 falloff so proximity effects
   *  ramp in and out instead of moving linearly with distance. */
  const smoothstep = (t) => t * t * (3 - 2 * t);

  return {
    addFrame,
    removeFrame,
    onResize,
    pointer,
    lerp,
    clamp,
    smoothstep,
    motionQuery,
    pointerQuery,

    reducedMotion: () => motionQuery.matches,
    finePointer: () => pointerQuery.matches,

    /** The single gate every pointer-driven enhancement checks before it
     *  registers anything. Touch devices and reduced-motion users never
     *  pay for code they cannot use. */
    canEnhancePointer: () => pointerQuery.matches && !motionQuery.matches
  };
})();
