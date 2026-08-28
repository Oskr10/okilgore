/**
 * magnetic.js — pointer attraction for a small, named set of elements.
 *
 * Applied to `[data-magnetic]` only, which on this site means the primary
 * hero call to action and the contact link. Making every button magnetic
 * turns a nice detail into noise, so the opt-in is explicit in the markup.
 *
 * Behaviour: within RADIUS of the element's centre, the element eases
 * toward the pointer by up to MAX_SHIFT pixels. A child marked
 * `[data-magnetic-inner]` travels further (INNER_RATIO), which is what
 * produces the slight parallax between the box and its label. Release is
 * spring-eased back to zero.
 *
 * Geometry is cached and invalidated on resize and scroll rather than
 * re-measured every frame — getBoundingClientRect() forces layout, and a
 * pointer effect has no business doing that 60 times a second.
 */

(function (OK) {
  'use strict';

  if (!OK.canEnhancePointer()) return;

  const elements = Array.from(document.querySelectorAll('[data-magnetic]'));
  if (elements.length === 0) return;

  const RADIUS = 110;      // px from centre at which attraction begins
  const MAX_SHIFT = 9;     // px — restrained on purpose
  const INNER_RATIO = 0.45;
  const EASE_IN = 0.16;    // approach
  const EASE_OUT = 0.11;   // release, slightly slower so it settles

  const items = elements.map((el) => ({
    el,
    inner: el.querySelector('[data-magnetic-inner]'),
    rect: null,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  }));

  let geometryStale = true;

  function measure() {
    items.forEach((item) => {
      const r = item.el.getBoundingClientRect();
      item.rect = { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    });
    geometryStale = false;
  }

  function frame() {
    if (geometryStale) measure();

    for (const item of items) {
      const dx = OK.pointer.x - item.rect.cx;
      const dy = OK.pointer.y - item.rect.cy;
      const distance = Math.hypot(dx, dy);

      let ease = EASE_OUT;

      if (distance < RADIUS) {
        const pull = OK.smoothstep(1 - distance / RADIUS);
        item.targetX = dx * pull * (MAX_SHIFT / RADIUS) * 2;
        item.targetY = dy * pull * (MAX_SHIFT / RADIUS) * 2;
        ease = EASE_IN;
      } else {
        item.targetX = 0;
        item.targetY = 0;
      }

      item.x = OK.lerp(item.x, item.targetX, ease);
      item.y = OK.lerp(item.y, item.targetY, ease);

      // Below a quarter pixel the movement is invisible; snap and skip the
      // style write so idle buttons cost nothing.
      if (Math.abs(item.x) < 0.25 && Math.abs(item.y) < 0.25) {
        if (item.el.style.transform !== '') {
          item.el.style.transform = '';
          if (item.inner) item.inner.style.transform = '';
          item.x = 0;
          item.y = 0;
        }
        continue;
      }

      item.el.style.transform = `translate3d(${item.x.toFixed(2)}px, ${item.y.toFixed(2)}px, 0)`;

      if (item.inner) {
        item.inner.style.transform =
          `translate3d(${(item.x * INNER_RATIO).toFixed(2)}px, ${(item.y * INNER_RATIO).toFixed(2)}px, 0)`;
      }
    }
  }

  const invalidate = () => { geometryStale = true; };

  OK.onResize(invalidate);
  window.addEventListener('scroll', invalidate, { passive: true });

  measure();
  OK.addFrame(frame);
})(window.OK);
