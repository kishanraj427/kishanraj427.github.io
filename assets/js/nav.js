/* nav.js — mobile menu, focus handling, scroll-spy, scroll progress.
   Replaces the nav half of the deleted custom.js and the legacy inline
   jQuery smooth-scroll/scroll-spy block. */

function initScrollSpy() {
  const links = [...document.querySelectorAll(
    '.main-menu a[href^="#"], .bottom-nav a[href^="#"]')];
  const sections = document.querySelectorAll('main section[id]');
  if (!links.length || !sections.length) return;

  // A band across the middle of the viewport, so exactly one section is
  // "current" at a time rather than every section that is partly visible.
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const href = `#${entry.target.id}`;
      links.forEach(l => {
        const current = l.getAttribute('href') === href;
        l.classList.toggle('is-current', current);
        if (current) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  sections.forEach(s => spy.observe(s));
}

function initProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;

  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    ticking = false;
  };

  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });

  addEventListener('resize', update, { passive: true });
  update();
}

/* Hide on scroll down, restore on scroll up. Phone landscape is 360px tall,
   where a persistent bar costs ~15% of the viewport. */
function initBottomBar() {
  const bar = document.querySelector('.bottom-nav');
  if (!bar) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const THRESHOLD = 120; // never hide near the top of the page
  let last = scrollY;
  let ticking = false;

  const update = () => {
    const y = scrollY;
    const down = y > last && y > THRESHOLD;
    if (!bar.contains(document.activeElement)) {
      bar.classList.toggle('is-hidden', down);
    }
    last = y;
    ticking = false;
  };

  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });

  bar.addEventListener('focusin', () => bar.classList.remove('is-hidden'));
}

export function initNav() {
  initScrollSpy();
  initProgress();
  initBottomBar();
}
