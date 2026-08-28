/**
 * opening-hand.js — Opening Hand, the Mulligan system, and Investigation Mode.
 *
 * Deals seven cards from a 29-card pool. Occasionally, and only after a few
 * mulligans, something else turns up.
 *
 * Structure:
 *   1. State
 *   2. Shuffle and draw
 *   3. Rendering
 *   4. Deal / clear / mulligan
 *   5. Card interaction
 *   6. Investigation Mode
 *
 * Design notes:
 *   - The fan geometry is CSS. This file writes two unitless numbers per card
 *     (--card-i and --card-lift) and never touches units, angles or
 *     breakpoints. See opening-hand.css.
 *   - No new requestAnimationFrame loop. Dealing is CSS transitions driven by
 *     a class plus a per-card transition-delay; hover states are pure CSS.
 *   - Investigation Mode content lives in the HTML, not in template strings
 *     here. This file only reveals it.
 *
 * Testing: set `window.__OK_FORCE_BUG = true` in the console, then mulligan.
 */

(function (OK, CARDS) {
  'use strict';

  const root = document.querySelector('[data-opening-hand]');
  if (!root || !CARDS) return;

  const HAND_SIZE = CARDS.HAND_SIZE;

  /* Probability of THE BUG appearing, indexed by mulligan count. The initial
     deal and the first mulligan are both zero; it caps at 12%. */
  const BUG_ODDS = [0, 0, 0.03, 0.04, 0.05, 0.07, 0.10, 0.12];

  /* =======================================================================
     1. State
     ======================================================================= */

  const state = {
    phase: 'HAND',            // HAND | INVESTIGATING | RESOLVED
    currentHand: [],
    mulliganCount: 0,
    bugDealt: false,          // THE BUG is in the hand on screen
    bugResolved: false,       // resolved this session — never drawn again
    inspectedEvidence: new Set(),
    selectedHypothesis: null
  };

  /* --- Elements ---------------------------------------------------------- */

  const hand = root.querySelector('[data-oh-hand]');
  const handView = root.querySelector('[data-oh-hand-view]');
  const incident = root.querySelector('[data-oh-incident]');
  const mulliganBtn = root.querySelector('[data-oh-mulligan]');
  const countHand = root.querySelector('[data-oh-count-hand]');
  const countMull = root.querySelector('[data-oh-count-mulligans]');
  const aside = root.querySelector('[data-oh-aside]');
  const live = root.querySelector('[data-oh-live]');

  const announce = (message) => { if (live) live.textContent = message; };

  const reduced = () => OK && OK.reducedMotion();

  /* =======================================================================
     2. Shuffle and draw
     ======================================================================= */

  /** Fisher–Yates, in place, on a copy the caller owns. */
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const signature = (cards) => cards.map((c) => c.id).sort((a, b) => a - b).join(',');

  /** Draw `count` unique cards, avoiding an exact repeat of the hand on
   *  screen. With C(29,7) = 1,560,780 possible hands the guard almost never
   *  fires, but a repeated hand would read as a broken shuffle. */
  function draw(count) {
    const previous = signature(state.currentHand);
    let picked = [];

    for (let attempt = 0; attempt < 3; attempt++) {
      picked = shuffle(CARDS.POOL.slice()).slice(0, count);
      if (signature(picked) !== previous) break;
    }

    return picked;
  }

  function shouldDealBug() {
    if (state.bugResolved) return false;
    if (window.__OK_FORCE_BUG) return true;

    const odds = BUG_ODDS[Math.min(state.mulliganCount, BUG_ODDS.length - 1)];
    return Math.random() < odds;
  }

  function buildHand() {
    if (!shouldDealBug()) {
      state.bugDealt = false;
      return draw(HAND_SIZE);
    }

    // Six normal cards, then THE BUG dropped in at a random position.
    const cards = draw(HAND_SIZE - 1);
    cards.splice(Math.floor(Math.random() * HAND_SIZE), 0, CARDS.BUG);
    state.bugDealt = true;
    return cards;
  }

  /* =======================================================================
     3. Rendering
     ======================================================================= */

  const escape = (value) =>
    String(value).replace(/[&<>"]/g, (ch) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])
    );

  const cardNumber = (card) => (card === CARDS.BUG ? '???' : String(card.id).padStart(3, '0'));

  function cardMarkup(card, index) {
    const isBug = card === CARDS.BUG;
    const backId = `oh-back-${card.id}`;
    const title = card.frontLabel.map(escape).join('<br>');
    const action = isBug ? 'Investigate' : 'View';

    const classes = ['oh-card', `oh-card--${card.category.toLowerCase()}`];
    if (isBug) classes.push('oh-card--bug');
    if (isBug && state.bugResolved) classes.push('is-resolved');

    // Normal cards are filed by type and number. THE BUG was never filed —
    // it carries an incident reference and a status instead.
    const meta = isBug
      ? `Incident / ${state.bugResolved ? '001' : '???'}`
      : `${escape(card.type)} / ${cardNumber(card)}`;

    const footLeft = isBug
      ? `Status / ${state.bugResolved ? 'Resolved' : 'Intermittent'}`
      : escape(card.category);

    // --card-i positions the card; --card-lift is its distance from the
    // middle of the hand. CSS turns both into geometry.
    const lift = Math.abs(index - (HAND_SIZE - 1) / 2);

    return (
      `<li class="oh-hand__slot">` +
        `<button class="${classes.join(' ')}" type="button"` +
          ` style="--card-i:${index};--card-lift:${lift.toFixed(1)}"` +
          ` aria-expanded="false" aria-controls="${backId}"` +
          ` data-card-id="${card.id}"` +
          (isBug ? ' data-cursor-label="Investigate"' : '') +
        `>` +
          `<span class="oh-card__inner">` +
            `<span class="oh-card__face oh-card__face--front">` +
              `<span class="oh-card__meta" data-card-meta>${meta}</span>` +
              `<span class="oh-card__title">${title}</span>` +
              `<span class="oh-card__rule" aria-hidden="true"></span>` +
              `<span class="oh-card__foot">` +
                `<span data-card-foot>${footLeft}</span>` +
                `<span class="oh-card__action">${action}</span>` +
              `</span>` +
            `</span>` +
            `<span class="oh-card__face oh-card__face--back" id="${backId}" aria-hidden="true">` +
              `<span class="oh-card__meta">${escape(card.category)} / ${escape(card.type)}</span>` +
              `<span class="oh-card__desc">${escape(card.description)}</span>` +
              (card.note ? `<span class="oh-card__note">${escape(card.note)}</span>` : '') +
            `</span>` +
          `</span>` +
        `</button>` +
      `</li>`
    );
  }

  function renderHand() {
    hand.innerHTML = state.currentHand.map(cardMarkup).join('');
    if (countHand) countHand.textContent = String(state.currentHand.length);
    if (countMull) countMull.textContent = String(state.mulliganCount);
    renderAside();
  }

  /** One annotation at a time, and never early. */
  function renderAside() {
    if (!aside) return;

    let text = '';
    if (state.mulliganCount >= 7) text = '// at this point we’re blaming the shuffler';
    else if (state.mulliganCount === 5) text = '// statistically, maybe keep this one';

    aside.textContent = text;
    aside.hidden = text === '';
  }

  /* =======================================================================
     4. Deal / clear / mulligan
     ======================================================================= */

  function deal() {
    state.currentHand = buildHand();
    renderHand();

    // Force a frame so the browser registers the pre-deal state before the
    // transition to the dealt state begins.
    requestAnimationFrame(() => {
      hand.classList.remove('is-clearing');
      hand.classList.add('is-dealt');
    });

    if (state.bugDealt) onBugDealt();
  }

  function mulligan() {
    state.mulliganCount += 1;

    if (reduced()) {
      deal();
      announce(`New hand dealt. ${HAND_SIZE} cards. Mulligans: ${state.mulliganCount}.`);
      return;
    }

    mulliganBtn.disabled = true;
    hand.classList.remove('is-dealt');
    hand.classList.add('is-clearing');

    // Longest card delay (6 × 40ms) plus the transition itself.
    window.setTimeout(() => {
      deal();
      mulliganBtn.disabled = false;
      announce(`New hand dealt. ${HAND_SIZE} cards. Mulligans: ${state.mulliganCount}.`);
    }, 400);
  }

  /** THE BUG gets exactly one anomaly, once, after the hand settles. */
  function onBugDealt() {
    if (window.console) console.log('Incident 001 detected.');
    if (reduced()) return;

    const card = hand.querySelector('.oh-card--bug');
    if (!card) return;

    window.setTimeout(() => {
      card.classList.add('is-glitching');
      window.setTimeout(() => card.classList.remove('is-glitching'), 80);
    }, 900);
  }

  mulliganBtn.addEventListener('click', mulligan);

  /* =======================================================================
     5. Card interaction
     ======================================================================= */

  hand.addEventListener('click', (event) => {
    const card = event.target.closest('.oh-card');
    if (!card) return;

    if (card.classList.contains('oh-card--bug')) {
      openIncident();
      return;
    }

    const expanded = card.getAttribute('aria-expanded') === 'true';
    card.setAttribute('aria-expanded', String(!expanded));

    // Keep the hidden face out of the accessibility tree so a collapsed card
    // never leaks its description.
    const back = card.querySelector('.oh-card__face--back');
    const front = card.querySelector('.oh-card__face--front');
    back.setAttribute('aria-hidden', String(expanded));
    front.setAttribute('aria-hidden', String(!expanded));
  });

  /* =======================================================================
     6. Investigation Mode
     ======================================================================= */

  const incidentTitle = incident.querySelector('[data-incident-title]');
  const statusEls = incident.querySelectorAll('[data-incident-status]');
  const paths = incident.querySelectorAll('[data-path]');
  const hypothesisBlock = incident.querySelector('[data-hypothesis-block]');
  const hypothesisOptions = incident.querySelectorAll('[data-hypothesis]');
  const hypothesisFeedback = incident.querySelector('[data-hypothesis-feedback]');
  const resolution = incident.querySelector('[data-resolution]');
  const returnBtn = incident.querySelector('[data-return-hand]');

  function setStatus(value, modifier) {
    statusEls.forEach((el) => {
      el.textContent = value;
      el.className = `incident__status incident__status--${modifier}`;
    });
  }

  function openIncident() {
    // Already solved: show the closed report rather than replaying it.
    if (state.bugResolved) {
      showIncident();
      setStatus('Resolved', 'resolved');
      return;
    }

    state.phase = 'INVESTIGATING';
    showIncident();
    setStatus('Open', 'open');
    history.replaceState(null, '', '#incident-001');
  }

  function showIncident() {
    handView.hidden = true;
    incident.hidden = false;
    incidentTitle.focus();
  }

  paths.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.path;
      if (state.inspectedEvidence.has(key)) return;

      state.inspectedEvidence.add(key);
      button.setAttribute('aria-pressed', 'true');

      const block = incident.querySelector(`[data-evidence="${key}"]`);
      block.hidden = false;

      const verdict = block.dataset.verdict;
      announce(`${button.textContent.trim()}: ${verdict}`);
      setStatus('Investigating', 'active');

      // Two lines of evidence are enough to form a theory.
      if (state.inspectedEvidence.size >= 2) hypothesisBlock.hidden = false;
    });
  });

  hypothesisOptions.forEach((button) => {
    button.addEventListener('click', () => {
      if (state.phase === 'RESOLVED') return;

      const choice = button.dataset.hypothesis;
      state.selectedHypothesis = choice;

      if (choice !== 'b') {
        button.classList.add('is-wrong');
        hypothesisFeedback.hidden = false;
        hypothesisFeedback.classList.remove('is-resolved');
        hypothesisFeedback.innerHTML =
          '<span class="incident__label">Hypothesis not supported</span>' +
          '<p>The available evidence doesn’t strongly support this yet.</p>';
        announce('Hypothesis not supported.');
        return;
      }

      resolve(button);
    });
  });

  function resolve(button) {
    state.phase = 'RESOLVED';
    state.bugResolved = true;

    button.classList.add('is-right');
    hypothesisOptions.forEach((option) => { option.disabled = option !== button; });

    hypothesisFeedback.hidden = false;
    hypothesisFeedback.classList.add('is-resolved');
    hypothesisFeedback.innerHTML = '<span class="incident__label">Root cause identified</span>';

    resolution.hidden = false;
    setStatus('Resolved', 'resolved');
    announce('Root cause identified. Incident resolved.');

    history.replaceState(null, '', '#resolved-001');
    if (window.console) console.log('Incident 001 resolved.');

    markBugResolved();
    revealFooterCount();
  }

  /** The card keeps its place in the hand it was resolved in. */
  function markBugResolved() {
    const card = hand.querySelector('.oh-card--bug');
    if (!card) return;

    card.classList.add('is-resolved');
    card.querySelector('[data-card-meta]').textContent = 'Incident / 001';
    card.querySelector('[data-card-foot]').textContent = 'Status / Resolved';
    card.querySelector('.oh-card__action').textContent = 'Review';
    card.querySelector('.oh-card__desc').textContent =
      'Root cause identified. Delayed JavaScript execution was preventing a required dependency from being available when the page needed it.';
  }

  /** The only change this feature makes outside its own section. */
  function revealFooterCount() {
    const el = document.querySelector('[data-bugs-resolved]');
    if (el) el.hidden = false;
  }

  returnBtn.addEventListener('click', () => {
    incident.hidden = true;
    handView.hidden = false;
    history.replaceState(null, '', window.location.pathname + window.location.search);

    const card = hand.querySelector('.oh-card--bug');
    if (card) card.focus();
  });

  /* =======================================================================
     Boot — deal when the section first comes into view.
     ======================================================================= */

  if (reduced()) {
    deal();
  } else {
    const observer = new IntersectionObserver(
      (entries, self) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          deal();
          self.disconnect();
        });
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 0.1 }
    );

    observer.observe(root);
  }
})(window.OK, window.OK_CARDS);
