/* reveal.js — shared scroll-reveal and count-up.
   Consumed by the hero, About, Superpowers, Career and Projects. Do not
   reimplement either of these per section. */

const STAGGER_CAP = 8; // 8 x 60ms = 480ms; uncapped, a 20-tile grid crawls

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initReveal(selector = '[data-reveal]') {
  const targets = document.querySelectorAll(selector);
  if (!targets.length) return;

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      // stagger index within the element's own group of siblings
      const siblings = [...entry.target.parentElement.children]
        .filter(el => el.matches(selector));
      const i = Math.min(Math.max(siblings.indexOf(entry.target), 0), STAGGER_CAP);

      entry.target.style.setProperty('--i', i);
      entry.target.classList.add('is-revealed');
      obs.unobserve(entry.target); // reveal once, then stop watching
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  targets.forEach(el => io.observe(el));
}

export function countUp(el, to, ms = 620) {
  if (reduced()) {
    el.textContent = String(to); // final value, never skipped
    return;
  }
  const start = performance.now();
  const tick = now => {
    const p = Math.min((now - start) / ms, 1);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = String(Math.round(to * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* Run a callback the first time an element scrolls into view. */
export function onFirstView(el, fn, rootMargin = '0px 0px -15% 0px') {
  if (!el) return;
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      fn();
    });
  }, { rootMargin });
  io.observe(el);
}
