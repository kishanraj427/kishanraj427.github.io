/* theme.js — day/night toggle, persistence, and the circular wipe.
   The theme is first applied by the inline boot script in <head>; this module
   only handles user-initiated changes. */

const KEY = 'theme';

const read = () => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};

const write = value => {
  try { localStorage.setItem(KEY, value); } catch { /* private mode */ }
};

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(theme === 'night'));
  const label = btn.querySelector('.visually-hidden');
  if (label) {
    // the label names the ACTION, not the current state
    label.textContent = theme === 'night' ? 'Switch to day theme' : 'Switch to night theme';
  }
}

export function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  apply(document.documentElement.getAttribute('data-theme') || 'day');

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'night' ? 'day' : 'night';
    write(next);

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !document.startViewTransition) {
      apply(next);
      return;
    }

    // Seed the wipe at the button's centre, and size it to the furthest
    // corner so the circle always covers the viewport.
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const far = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );
    const root = document.documentElement;
    root.style.setProperty('--wipe-x', `${x}px`);
    root.style.setProperty('--wipe-y', `${y}px`);
    root.style.setProperty('--wipe-r', `${far}px`);

    document.startViewTransition(() => apply(next));
  });
}
