/**
 * theme.js — the palette wheel.
 *
 * The whole site is drawn from eleven custom properties, so switching theme
 * is one attribute on <html>. This file owns the control around that: the
 * popover, its keyboard model, persistence, and keeping the browser UI
 * colour in step.
 *
 * The value is applied by an inline script in <head> before first paint —
 * this module only takes over once the page is interactive, so a stored
 * choice never flashes the default palette first.
 *
 * Accessibility: the wheel is a real radio group. Arrow keys move between
 * options and select as they go, Home/End jump to the ends, roving tabindex
 * keeps a single tab stop, and Escape closes the panel and returns focus to
 * the trigger.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'ok-theme';
  const root = document.documentElement;
  const picker = document.querySelector('[data-theme-picker]');
  if (!picker) return;

  const trigger = picker.querySelector('[data-theme-trigger]');
  const panel = picker.querySelector('[data-theme-panel]');
  const options = Array.from(picker.querySelectorAll('[data-theme-value]'));
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  /* ---------------------------------------------------------------------
     Persistence — storage can throw in private mode, so never assume it.
     --------------------------------------------------------------------- */

  function store(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      /* Preference simply won't survive the session. Not worth failing over. */
    }
  }

  function stored() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  /* ---------------------------------------------------------------------
     Applying
     --------------------------------------------------------------------- */

  /** Keep the browser chrome (mobile address bar) in step with the page.
   *  The two static tags are media-scoped for the no-JS/auto case; an
   *  explicit theme overrides both so whichever one matches is correct. */
  function syncBrowserChrome() {
    const paper = getComputedStyle(root).getPropertyValue('--paper').trim();
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute('content', paper));
  }

  function apply(value, persist) {
    root.setAttribute('data-theme', value);

    options.forEach((option) => {
      const selected = option.dataset.themeValue === value;
      option.setAttribute('aria-checked', String(selected));
      option.tabIndex = selected ? 0 : -1;
    });

    if (persist) store(value);
    syncBrowserChrome();
  }

  /* ---------------------------------------------------------------------
     Panel
     --------------------------------------------------------------------- */

  function setOpen(open) {
    trigger.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;

    if (open) {
      const selected = options.find((o) => o.getAttribute('aria-checked') === 'true');
      (selected || options[0]).focus();
    }
  }

  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';

  trigger.addEventListener('click', () => setOpen(!isOpen()));

  options.forEach((option) => {
    option.addEventListener('click', () => {
      apply(option.dataset.themeValue, true);
      setOpen(false);
      trigger.focus();
    });
  });

  /* --- Keyboard ---------------------------------------------------------
     Arrow keys within a radio group move and select in one action, which
     is the expected behaviour for this pattern.                          */
  panel.addEventListener('keydown', (event) => {
    const current = options.indexOf(document.activeElement);
    if (current === -1) return;

    let next = -1;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (current + 1) % options.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (current - 1 + options.length) % options.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = options.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    apply(options[next].dataset.themeValue, true);
    options[next].focus();
  });

  /* --- Dismissal --------------------------------------------------------- */

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      trigger.focus();
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (isOpen() && !picker.contains(event.target)) setOpen(false);
  });

  // Tabbing out of the panel closes it, so it never lingers behind focus.
  picker.addEventListener('focusout', (event) => {
    if (isOpen() && !picker.contains(event.relatedTarget)) setOpen(false);
  });

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */

  const known = options.map((option) => option.dataset.themeValue);
  const initial = known.includes(stored()) ? stored() : 'auto';

  apply(initial, false);

  // While on "auto", follow the system if it changes mid-session.
  systemDark.addEventListener('change', () => {
    if (root.getAttribute('data-theme') === 'auto') syncBrowserChrome();
  });
})();
