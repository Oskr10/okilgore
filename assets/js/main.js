/**
 * main.js — page behaviour.
 *
 * Ordered from most to least important:
 *   1. Navigation (drawer, scrolled state, active section)
 *   2. The hero headline's variable-weight response to the pointer
 *   3. Scroll reveals and numeral parallax
 *   4. Small living details (local time, year) and the debug grid
 *
 * Every enhancement is additive. With JavaScript disabled the page is a
 * complete, readable, navigable document.
 */

(function (OK) {
  'use strict';

  /* =======================================================================
     1. Navigation
     ======================================================================= */

  const masthead = document.querySelector('[data-masthead]');

  /* --- Scrolled state ---------------------------------------------------
     A passive scroll listener that compares against the last known state
     and only touches the DOM when the threshold is actually crossed — so
     this costs one number comparison per scroll event and zero style
     invalidations while scrolling within a state.                        */
  if (masthead) {
    const THRESHOLD = 8;
    let scrolled = null;

    const update = () => {
      const next = window.scrollY > THRESHOLD;
      if (next === scrolled) return;
      scrolled = next;
      masthead.classList.toggle('is-scrolled', next);
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* --- Mobile drawer ----------------------------------------------------- */
  const toggle = document.querySelector('[data-nav-toggle]');
  const drawer = document.querySelector('[data-drawer]');

  if (toggle && drawer) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('is-open', open);
      toggle.querySelector('[data-nav-toggle-label]').textContent = open ? 'Close' : 'Menu';
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Anchor links inside the drawer should close it on the way out.
    drawer.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* --- Active section ----------------------------------------------------
     A band across the middle of the viewport decides which section is
     "current". aria-current does double duty: it drives the CSS underline
     and it is the correct semantic for assistive technology.             */
  const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));

  if (navLinks.length > 0) {
    const byId = new Map(navLinks.map((link) => [link.getAttribute('href').slice(1), link]));
    const sections = Array.from(byId.keys())
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = byId.get(entry.target.id);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((other) => other.removeAttribute('aria-current'));
            link.setAttribute('aria-current', 'true');
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* =======================================================================
     2. Hero headline — variable weight driven by pointer proximity
     =======================================================================
     The single "memorable detail" for the hero. Characters near the pointer
     gain weight; the falloff is smoothstepped so the bulge has soft edges.

     Two problems had to be solved to make this usable rather than a demo.

     1. Reflow. Changing `wght` changes each glyph's advance width, which
        would relayout the paragraph every frame and make the text crawl
        under the pointer. So each character's box is measured once at REST
        and frozen at that inline-size. The boxes never change again, so the
        line breaks are identical to the no-JavaScript layout.

     2. Collision. Inside a frozen box a heavier glyph would grow into its
        neighbours. Archivo is a two-axis variable font, so the width axis
        is driven in the opposite direction as weight rises — characters get
        bolder and slightly narrower at the same time, which keeps the ink
        width roughly constant and reads as a deliberate condensing.
     ======================================================================= */

  const REST_WEIGHT = 560;
  const PEAK_WEIGHT = 860;
  const REST_WIDTH = 96;
  const PEAK_WIDTH = 86;
  const RADIUS = 190;

  function initHeadline() {
    const headline = document.querySelector('[data-vf-headline]');
    if (!headline) return;

    const source = headline.textContent.trim();

    // Split into words (so wrapping still works) and then characters.
    const fragment = document.createDocumentFragment();
    const words = source.split(' ');

    words.forEach((word, wordIndex) => {
      const wordEl = document.createElement('span');
      wordEl.className = 'vf-word';

      Array.from(word).forEach((character) => {
        const charEl = document.createElement('span');
        charEl.className = 'vf-char';
        charEl.dataset.char = character;
        charEl.textContent = character;
        wordEl.appendChild(charEl);
      });

      fragment.appendChild(wordEl);
      if (wordIndex < words.length - 1) fragment.appendChild(document.createTextNode(' '));
    });

    headline.textContent = '';
    headline.appendChild(fragment);

    // The split markup is presentational. Naming the heading explicitly
    // stops screen readers announcing it character by character.
    headline.setAttribute('aria-label', source);

    if (!OK.canEnhancePointer()) return;
    if (!CSS.supports('font-variation-settings', '"wght" 500')) return;

    const chars = Array.from(headline.querySelectorAll('.vf-char'));
    const current = new Float32Array(chars.length).fill(REST_WEIGHT);
    const applied = new Float32Array(chars.length).fill(REST_WEIGHT);
    let centres = [];

    /** Freeze each glyph box at its resting width, then cache centres.
     *  Reads and writes are batched into two passes so the browser performs
     *  one layout rather than one per character. */
    function measure() {
      chars.forEach((el) => {
        el.style.width = '';
        el.style.setProperty('--w', REST_WEIGHT);
        el.style.setProperty('--wd', REST_WIDTH);
      });

      const widths = chars.map((el) => el.getBoundingClientRect().width);

      chars.forEach((el, i) => {
        el.style.width = `${widths[i].toFixed(2)}px`;
      });

      // Store document-relative centres so scrolling does not invalidate
      // them — only a resize or a font swap does.
      const scrollY = window.scrollY;
      centres = chars.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + scrollY + r.height / 2 };
      });
    }

    function frame() {
      if (!OK.pointer.active) return;

      const px = OK.pointer.x;
      const py = OK.pointer.y + window.scrollY;

      for (let i = 0; i < chars.length; i++) {
        const centre = centres[i];
        const distance = Math.hypot(px - centre.x, py - centre.y);
        const falloff = distance >= RADIUS ? 0 : OK.smoothstep(1 - distance / RADIUS);
        const target = REST_WEIGHT + (PEAK_WEIGHT - REST_WEIGHT) * falloff;

        current[i] = OK.lerp(current[i], target, 0.18);

        // Only write when the rendered weight would actually change — an
        // idle headline costs nothing.
        if (Math.abs(current[i] - applied[i]) >= 1) {
          const progress = (current[i] - REST_WEIGHT) / (PEAK_WEIGHT - REST_WEIGHT);
          chars[i].style.setProperty('--w', Math.round(current[i]));
          chars[i].style.setProperty(
            '--wd',
            (REST_WIDTH + (PEAK_WIDTH - REST_WIDTH) * progress).toFixed(1)
          );
          applied[i] = current[i];
        }
      }
    }

    // Only run the loop while the headline is on screen.
    const gate = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) OK.addFrame(frame);
      else OK.removeFrame(frame);
    });

    const start = () => {
      measure();
      gate.observe(headline);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start);
    } else {
      start();
    }

    OK.onResize(measure);
  }

  /* =======================================================================
     3. Scroll behaviour
     ======================================================================= */

  /* --- Reveals -----------------------------------------------------------
     Three named behaviours (mask / rule / rise) declared per element in the
     HTML, so different content moves differently. Each element is observed
     once and then released.                                              */
  function initReveals() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (targets.length === 0) return;

    if (OK.reducedMotion()) {
      targets.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, self) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          self.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* --- Numeral parallax --------------------------------------------------
     Transform only, and only while the element is in view.               */
  function initParallax() {
    const targets = Array.from(document.querySelectorAll('[data-parallax]'));
    if (targets.length === 0 || OK.reducedMotion()) return;

    const inView = new Set();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) inView.add(entry.target);
        else inView.delete(entry.target);
      });

      if (inView.size > 0) OK.addFrame(frame);
      else OK.removeFrame(frame);
    });

    function frame() {
      const mid = window.innerHeight / 2;

      inView.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - mid) / mid;
        const strength = Number(el.dataset.parallax) || 20;
        el.style.transform = `translate3d(0, ${(offset * strength).toFixed(1)}px, 0)`;
      });
    }

    targets.forEach((el) => observer.observe(el));
  }

  /* =======================================================================
     4. Details
     ======================================================================= */

  /* --- Local time --------------------------------------------------------
     Honduras does not observe DST, but deriving the time from the IANA zone
     is still the correct way to do this rather than hardcoding UTC-6.    */
  function initClock() {
    const output = document.querySelector('[data-local-time]');
    if (!output) return;

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Tegucigalpa',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const render = () => { output.textContent = `${formatter.format(new Date())} CST`; };

    render();
    setInterval(render, 30000);
  }

  function initYear() {
    const output = document.querySelector('[data-year]');
    if (output) output.textContent = String(new Date().getFullYear());
  }

  /* --- Debug grid --------------------------------------------------------
     Alt+G overlays the 12-column grid the page is built on. It is a real
     tool that got left in, which is the only kind of easter egg worth
     shipping on a portfolio.                                             */
  function initGridOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'grid-overlay grid';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<span></span>'.repeat(12);
    document.body.appendChild(overlay);

    document.addEventListener('keydown', (event) => {
      if (event.altKey && (event.key === 'g' || event.key === 'G')) {
        event.preventDefault();
        overlay.classList.toggle('is-on');
      }
    });
  }

  function greet() {
    if (!window.console) return;
    console.log(
      '%cOscar Kilgore%c\nBuilt from scratch — semantic HTML, CSS custom properties, vanilla JS.\nNo framework, no build step, no dependencies.\n\nAlt+G toggles the layout grid.\nSource: github.com/Oskr10/okilgore',
      'font: 600 15px/1.4 system-ui, sans-serif; color: #b03a1e;',
      'font: 12px/1.6 ui-monospace, monospace; color: #6e6a5b;'
    );
  }

  /* =======================================================================
     Boot
     ======================================================================= */

  initHeadline();
  initReveals();
  initParallax();
  initClock();
  initYear();
  initGridOverlay();
  greet();

  // If the user changes their motion preference mid-session, reload the
  // page state rather than leaving half-registered effects running.
  OK.motionQuery.addEventListener('change', () => window.location.reload());
})(window.OK);
