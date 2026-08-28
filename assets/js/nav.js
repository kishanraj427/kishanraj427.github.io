/* nav.js — mobile menu, focus handling, scroll-spy, scroll progress.
   Replaces the nav half of the deleted custom.js and the legacy inline
   jQuery smooth-scroll/scroll-spy block. */

const MOBILE = 846; // matches the original site's breakpoint

function initMenu() {
  const menu = document.getElementById('menu');
  const openBtn = document.getElementById('menu-toggle');
  const closeBtn = document.getElementById('menu-close');
  if (!menu || !openBtn || !closeBtn) return;

  const setOpen = on => {
    menu.classList.toggle('is-open', on);
    openBtn.setAttribute('aria-expanded', String(on));
    (on ? closeBtn : openBtn).focus();
  };

  openBtn.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
  });

  // Close after navigating on mobile, where the menu covers the content.
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      if (innerWidth < MOBILE) setOpen(false);
    });
  });
}

function initScrollSpy() {
  const links = [...document.querySelectorAll('.main-menu a[href^="#"]')];
  const sections = document.querySelectorAll('main section[id]');
  if (!links.length || !sections.length) return;

  // A band across the middle of the viewport, so exactly one section is
  // "current" at a time rather than every section that is partly visible.
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const href = `#${entry.target.id}`;
      links.forEach(l => l.classList.toggle('is-current', l.getAttribute('href') === href));
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

export function initNav() {
  initMenu();
  initScrollSpy();
  initProgress();
}
