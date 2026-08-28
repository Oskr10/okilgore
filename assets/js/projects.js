/**
 * projects.js — the Selected Work index.
 *
 * Two responsibilities:
 *
 *   1. Row engagement. Hovering or focusing a row marks it active and puts
 *      the whole index into an engaged state, which dims the other rows.
 *      The visual result is entirely CSS — this file only owns the state.
 *
 *   2. The pointer-following preview. One fixed layer, moved with
 *      translate3d inside the shared frame loop.
 *
 *      Placement rule: the preview is offset ABOVE the pointer, or below it
 *      when there is no room above. It is never placed level with the
 *      pointer, so it cannot cover the row you are currently reading — it
 *      overlaps the neighbouring rows, which are dimmed at that moment.
 *      Horizontally it tracks the pointer and is clamped inside the
 *      viewport with a consistent margin.
 *
 * Without JavaScript, or on a touch device, each row renders its thumbnail
 * inline instead (see .index__thumb) and nothing below is needed.
 */

(function (OK) {
  'use strict';

  const index = document.querySelector('[data-work-index]');
  if (!index) return;

  const links = Array.from(index.querySelectorAll('[data-project]'));
  if (links.length === 0) return;

  /* -----------------------------------------------------------------------
     Row state — runs on every device, including touch and keyboard.
     ----------------------------------------------------------------------- */

  function engage(link) {
    index.classList.add('is-engaged');
    link.closest('.index__row').classList.add('is-active');
  }

  function disengage(link) {
    link.closest('.index__row').classList.remove('is-active');
    if (!index.querySelector('.is-active')) index.classList.remove('is-engaged');
  }

  /* -----------------------------------------------------------------------
     Case studies that do not exist yet.
     Phase 1 ships the index and its interaction design; the six case-study
     pages are Phase 2. Rather than link to six 404s, intercept the click
     and say so. Delete this block (and the data-pending attributes) when
     the pages land.
     ----------------------------------------------------------------------- */

  const note = document.querySelector('[data-work-note]');

  links.forEach((link) => {
    if (!link.hasAttribute('data-pending')) return;

    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (!note) return;
      const title = link.querySelector('.index__title').textContent.trim();
      note.textContent = `“${title}” — case study page is not built yet (Phase 2).`;
      note.hidden = false;
    });
  });

  /* -----------------------------------------------------------------------
     Keyboard: focus mirrors hover so the two paths never diverge.
     ----------------------------------------------------------------------- */

  links.forEach((link) => {
    link.addEventListener('focus', () => engage(link));
    link.addEventListener('blur', () => disengage(link));
  });

  /* -----------------------------------------------------------------------
     Pointer preview
     ----------------------------------------------------------------------- */

  if (!OK.canEnhancePointer()) {
    // Still give pointer devices the row state, just without the preview.
    links.forEach((link) => {
      link.addEventListener('pointerenter', () => engage(link));
      link.addEventListener('pointerleave', () => disengage(link));
    });
    return;
  }

  const preview = document.createElement('div');
  preview.className = 'preview';
  preview.setAttribute('aria-hidden', 'true');
  preview.innerHTML =
    '<div class="preview__frame">' +
      '<img class="preview__img" alt="" decoding="async">' +
      '<span class="preview__label"></span>' +
    '</div>';

  document.body.appendChild(preview);

  const image = preview.querySelector('.preview__img');
  const label = preview.querySelector('.preview__label');

  const GAP = 24;

  let size = { w: 0, h: 0 };
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let visible = false;
  let activeLink = null;
  let revealRequest = 0;

  function measure() {
    const rect = preview.getBoundingClientRect();
    if (rect.width) size = { w: rect.width, h: rect.height };
  }

  function pointerIsInside(el) {
    const r = el.getBoundingClientRect();
    const { x: px, y: py } = OK.pointer;
    return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
  }

  function frame() {
    // Self-healing guard. `pointerleave` is not guaranteed to arrive: the
    // page can scroll out from under a stationary pointer, the layout can
    // shift, the window can lose focus mid-gesture, or the event can be
    // swallowed during a fast diagonal exit. Rather than trusting the event
    // alone, every frame re-checks that the pointer is still inside the row
    // that opened the preview — so a missed event self-corrects on the very
    // next frame instead of leaving the image stranded over the page.
    if (activeLink && !pointerIsInside(activeLink)) {
      deactivate();
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Horizontal: centred on the pointer, kept inside the viewport.
    targetX = OK.clamp(OK.pointer.x - size.w / 2, GAP, vw - size.w - GAP);

    // Vertical: prefer above the pointer; drop below when there is no room.
    const above = OK.pointer.y - size.h - GAP;
    targetY = above >= GAP ? above : OK.pointer.y + GAP;
    targetY = OK.clamp(targetY, GAP, vh - size.h - GAP);

    // Slightly looser on x than y, so lateral movement carries a little
    // inertia while vertical repositioning stays crisp.
    x = OK.lerp(x, targetX, 0.14);
    y = OK.lerp(y, targetY, 0.2);

    preview.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  }

  function show(link) {
    const thumb = link.querySelector('.index__thumb img') || link.querySelector('img');
    if (!thumb) return;

    image.src = thumb.currentSrc || thumb.src;
    label.textContent = link.dataset.previewLabel || 'View case study';

    if (!visible) {
      visible = true;
      if (!size.w) measure();

      // Seed the position at the pointer so the first frame does not slide
      // in from the previous location.
      x = OK.clamp(OK.pointer.x - size.w / 2, GAP, window.innerWidth - size.w - GAP);
      y = OK.clamp(OK.pointer.y - size.h - GAP, GAP, window.innerHeight - size.h - GAP);

      preview.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      // Deferred to the next frame so the browser registers the seeded
      // position before the scale-up transition on .preview__frame begins.
      // The handle is kept so hide() can cancel it — otherwise a hide that
      // lands between show() and this callback would be undone by it, and
      // the preview would be left visible with no frame loop running to
      // move or dismiss it. That was the stuck-image bug.
      cancelAnimationFrame(revealRequest);
      revealRequest = requestAnimationFrame(() => {
        if (visible) preview.classList.add('is-visible');
      });

      OK.addFrame(frame);
    }
  }

  function hide() {
    cancelAnimationFrame(revealRequest);
    if (!visible) return;
    visible = false;
    preview.classList.remove('is-visible');
    OK.removeFrame(frame);
  }

  /** Clear both the row state and the preview together. */
  function deactivate() {
    if (activeLink) {
      disengage(activeLink);
      activeLink = null;
    }
    hide();
  }

  links.forEach((link) => {
    link.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      // Another row may still be marked active if its leave event was lost.
      if (activeLink && activeLink !== link) disengage(activeLink);
      activeLink = link;
      engage(link);
      show(link);
    });

    link.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'mouse') return;
      if (activeLink === link) deactivate();
      else disengage(link);
    });
  });

  // Backstops for the cases a per-row pointerleave cannot cover.
  document.addEventListener('pointerleave', deactivate);
  window.addEventListener('blur', deactivate);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) deactivate();
  });

  OK.onResize(() => { measure(); deactivate(); });

  measure();
})(window.OK);
