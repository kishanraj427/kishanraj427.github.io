/* ambient.js — sparse, occasional hero motion.

   Nothing here runs on a loop. Each event fires once after a random interval,
   which is the whole point: a CSS animation with a fixed delay produces the
   same rhythm every cycle and the eye learns it within a minute. Random gaps
   read as incidental instead.

   Night gets bursts of 2 to 4 star twinkles, day gets a flock of 2 to 4
   birds crossing. Both are
   scheduled regardless of theme, and the CSS opacity tokens decide which one
   is actually visible, so the toggle never has to restart a timer. */

const STAR_GAP = [850, 2400];    // ms between bursts of twinkles
const BIRD_GAP = [9000, 20000];  // ms between fly-pasts

const rand = (min, max) => min + Math.random() * (max - min);

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Run `fn` once after a random gap, then schedule the next one. Timers are
   skipped while the tab is hidden: a backgrounded page should not be queueing
   animations, and browsers throttle the callbacks unevenly anyway. */
function loop(fn, [min, max]) {
  const tick = () => {
    if (!document.hidden) fn();
    setTimeout(tick, rand(min, max));
  };
  setTimeout(tick, rand(min, max));
}

/* Play a one-shot animation by adding a class and removing it when the
   animation ends, so the element is clean and re-triggerable next time. */
function once(el, cls) {
  if (!el || el.classList.contains(cls)) return;
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

export function initAmbient() {
  if (reduced()) return;

  const stars = [...document.querySelectorAll('.hero__star')];
  const birds = [...document.querySelectorAll('.hero__bird')];

  if (stars.length) {
    loop(() => {
      const idle = stars.filter(s => !s.classList.contains('is-twinkling'));
      if (!idle.length) return;

      // 2 to 4 at once, picked at random from whatever is not already lit
      const count = Math.min(idle.length, 2 + Math.floor(Math.random() * 3));
      const pick = idle.sort(() => Math.random() - 0.5).slice(0, count);

      pick.forEach(star => {
        // a short random offset each, so they never blink in unison
        star.style.animationDelay = `${rand(0, 240)}ms`;
        once(star, 'is-twinkling');
      });
    }, STAR_GAP);
  }

  if (birds.length) {
    loop(() => {
      const idle = birds.filter(b => !b.classList.contains('is-flying'));
      if (idle.length < 2) return;

      // 2 to 4 of them, as a loose flock rather than a formation
      const count = Math.min(idle.length, 2 + Math.floor(Math.random() * 3));
      const lead = rand(10, 26);

      idle.slice(0, count).forEach((b, i) => {
        // each bird sits a little below and behind the one in front, with the
        // offsets randomised so the shape of the flock differs every pass
        b.style.top = `${lead + i * rand(2.5, 5.5)}%`;
        b.style.setProperty('--bird-scale', (0.95 - i * rand(0.06, 0.13)).toFixed(2));
        b.style.animationDelay = `${i * rand(160, 420)}ms`;
        once(b, 'is-flying');
      });
    }, BIRD_GAP);
  }
}
