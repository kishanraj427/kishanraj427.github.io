/* filters.js — project filtering with a FLIP animation. Replaces Isotope. */

const DUR = 320; // --dur-base
const EASE = 'cubic-bezier(.22,.61,.36,1)'; // --ease-out

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initFilters() {
  const grid = document.getElementById('projects-grid');
  const chips = [...document.querySelectorAll('.filters .chip')];
  const empty = document.querySelector('.projects__empty');
  if (!grid || !chips.length) return;

  const cards = [...grid.children];

  const apply = tag => {
    // FIRST: record positions of the cards that are currently VISIBLE only.
    // A display:none element returns an all-zero rect, and treating that as a
    // real position makes cards fly in from the viewport's top-left corner.
    const before = new Map();
    cards.forEach(c => {
      if (!c.hidden) before.set(c, c.getBoundingClientRect());
    });

    let shown = 0;
    cards.forEach(c => {
      const tags = (c.dataset.tags || '').split(' ');
      const show = tag === 'all' || tags.includes(tag);
      c.hidden = !show;
      if (show) shown++;
    });

    if (empty) empty.hidden = shown > 0;
    if (reduced()) return;

    cards.forEach(c => {
      if (c.hidden) return;

      const prev = before.get(c);

      // Newly revealed: it had no previous position, so there is nothing to
      // invert. Fade it up in place instead of sliding it from nowhere.
      if (!prev) {
        c.animate(
          [
            { opacity: 0, transform: 'translateY(8px) scale(0.985)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: DUR, easing: EASE }
        );
        return;
      }

      // Stayed visible and moved: INVERT + PLAY.
      const last = c.getBoundingClientRect();
      const dx = prev.left - last.left;
      const dy = prev.top - last.top;
      if (!dx && !dy) return;

      c.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: DUR, easing: EASE }
      );
    });
  };

  const select = chip => {
    chips.forEach(c => c.setAttribute('aria-checked', String(c === chip)));
    chip.focus();
    apply(chip.dataset.filter);
  };

  chips.forEach((chip, i) => {
    chip.addEventListener('click', () => select(chip));

    // radiogroup keyboard convention: arrows move and select
    chip.addEventListener('keydown', e => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      select(chips[(i + dir + chips.length) % chips.length]);
    });
  });
}

/* Subtle tilt on project cards. Cards only — never on anything containing a
   magnetic button, or the two transforms compound and fight. */
export function initTilt() {
  if (reduced() || !matchMedia('(pointer: fine)').matches) return;

  const MAX = 4; // degrees

  document.querySelectorAll('[data-tilt]').forEach(card => {
    const reset = () => { card.style.transform = ''; };

    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        `perspective(700px) rotateX(${-py * MAX}deg) rotateY(${px * MAX}deg)`;
    });

    card.addEventListener('pointerleave', reset);
  });
}
