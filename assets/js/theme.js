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

    // No animation path: reduced motion, or a browser without View Transitions
    // (older Safari). The theme still changes, just instantly.
    if (
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !document.startViewTransition
    ) {
      apply(next);
      return;
    }

    wipe(next, btn);
  });
}

/* A circular reveal of the real page, expanding from the toggle button.

   This uses the View Transitions API because it is the only way to reveal
   actual content: the browser snapshots the old and new pages, and the new one
   is clipped open over the old. An overlay cannot do this, it can only carry a
   flat colour, which blanks the screen.

   The earlier trouble with this approach was never the API. ::view-transition
   pseudo-elements are sized to the CAPTURED AREA, and the page was putting
   things outside the viewport: the closed mobile sidebar sat ~320px to the
   left, and the skip link was parked above the top. That moved the capture's
   origin, so viewport coordinates landed somewhere else, which is why a button
   on the right produced a wipe from the left on a phone. Both are now hidden
   rather than displaced, so the capture matches the viewport and the maths
   lines up. */
function wipe(next, btn) {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const ms = parseFloat(cs.getPropertyValue('--dur-slow')) || 620;
  const easing = cs.getPropertyValue('--ease-inout').trim() || 'ease-in-out';

  const r = btn.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  // reach the furthest corner, so the circle always covers the whole viewport
  const far = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y)
  );

  const transition = document.startViewTransition(() => apply(next));

  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${far}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: ms,
          easing,
          pseudoElement: '::view-transition-new(root)',
        }
      );
    })
    .catch(() => { /* transition skipped; the theme has still been applied */ });
}
