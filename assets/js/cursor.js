/**
 * cursor.js — contextual cursor label.
 *
 * Deliberate decision: the native cursor is NOT hidden or replaced.
 * Replacing it costs real usability (system cursor shapes communicate
 * text selection, resizing, loading and disabled states for free) and buys
 * decoration. Instead this adds a small label that appears only over
 * elements that declare a context:
 *
 *     <a data-cursor="external">          → ↗  OPENS IN NEW TAB
 *     <a data-cursor="view">              → VIEW
 *     <figure data-cursor="explore">      → EXPLORE
 *     <div data-cursor-label="DRAG">      → DRAG   (custom label)
 *
 * Nothing here is required to understand or operate the page.
 */

(function (OK) {
  'use strict';

  if (!OK.canEnhancePointer()) return;

  const LABELS = {
    view: 'View',
    explore: 'Explore',
    external: 'Opens in new tab',
    drag: 'Drag'
  };

  const GLYPHS = {
    external: '↗',
    drag: '↔'
  };

  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');

  const glyph = document.createElement('span');
  const text = document.createElement('span');
  el.append(glyph, text);
  document.body.appendChild(el);

  // Offset so the label sits below-right of the hotspot and never covers
  // the thing being pointed at.
  const OFFSET_X = 16;
  const OFFSET_Y = 18;

  let x = 0;
  let y = 0;
  let visible = false;

  function frame() {
    // Follows tightly — a slow-following label reads as lag, not polish.
    x = OK.lerp(x, OK.pointer.x + OFFSET_X, 0.35);
    y = OK.lerp(y, OK.pointer.y + OFFSET_Y, 0.35);
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  }

  function show(target) {
    const kind = target.dataset.cursor;
    const label = target.dataset.cursorLabel || LABELS[kind] || '';
    const mark = GLYPHS[kind] || '';

    glyph.textContent = mark;
    glyph.hidden = !mark;
    text.textContent = label;

    if (!visible) {
      visible = true;
      // Jump to the pointer before fading in, so it does not fly across
      // the screen from wherever it was last used.
      x = OK.pointer.x + OFFSET_X;
      y = OK.pointer.y + OFFSET_Y;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      el.classList.add('is-visible');
      OK.addFrame(frame);
    }
  }

  function hide() {
    if (!visible) return;
    visible = false;
    el.classList.remove('is-visible');
    OK.removeFrame(frame);
  }

  // Delegated, so case-study pages added later need no extra wiring.
  document.addEventListener('pointerover', (event) => {
    const target = event.target.closest('[data-cursor], [data-cursor-label]');
    if (target) show(target);
  });

  document.addEventListener('pointerout', (event) => {
    const target = event.target.closest('[data-cursor], [data-cursor-label]');
    if (target && !target.contains(event.relatedTarget)) hide();
  });

  // A label left floating after the pointer leaves the window looks broken.
  document.addEventListener('pointerleave', hide);
  window.addEventListener('blur', hide);
})(window.OK);
