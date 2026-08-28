/* hero.js — hero-only behaviour: magnetic CTAs and the stat count-up.
   Kept out of main.js so the entry point stays a wiring file. */

import { countUp, onFirstView } from './reveal.js';

const MAGNET_STRENGTH = 0.28; // fraction of cursor offset the button follows
const MAGNET_RADIUS = 1.6;    // multiples of the button's half-size

function canAnimate() {
  return !matchMedia('(prefers-reduced-motion: reduce)').matches
      && matchMedia('(pointer: fine)').matches;
}

/* Magnetic CTAs. Hero buttons only — a magnetic control inside a tilting card
   would produce compounding, fighting transforms. */
function initMagnetic() {
  if (!canAnimate()) return;

  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    const reset = () => { btn.style.transform = ''; };

    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const limit = Math.max(r.width, r.height) * MAGNET_RADIUS;
      if (Math.hypot(dx, dy) > limit) { reset(); return; }
      btn.style.transform =
        `translate(${dx * MAGNET_STRENGTH}px, ${dy * MAGNET_STRENGTH}px)`;
    });

    btn.addEventListener('pointerleave', reset);
    btn.addEventListener('blur', reset);
  });
}

/* Stats count up the first time the strip is seen — not on load. */
function initStats() {
  const strip = document.querySelector('.stats');
  if (!strip) return;

  onFirstView(strip, () => {
    strip.querySelectorAll('[data-count]').forEach(el => {
      const to = Number(el.dataset.count);
      if (Number.isFinite(to)) countUp(el, to);
    });
  });
}

export function initHero() {
  initMagnetic();
  initStats();
}
