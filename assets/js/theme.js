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

    const transition = document.startViewTransition(() => apply(next));

    // Drive the wipe from JS with literal pixel values rather than from CSS
    // keyframes reading custom properties.
    //
    // ::view-transition-new(root) lives in the view-transition pseudo tree,
    // not the normal DOM. A keyframe there has to inherit --wipe-x/y from
    // :root AND resolve it at the moment the keyframes are computed. When that
    // fails the keyframe silently falls back to its default origin, so the
    // wipe starts from the middle of the screen instead of the button. That
    // resolution differs between Chrome versions, which made the same page
    // behave differently on two machines. Passing numbers straight into
    // element.animate() removes the indirection entirely.
    transition.ready
      .then(() => {
        const cs = getComputedStyle(document.documentElement);
        const ms = parseFloat(cs.getPropertyValue('--dur-slow')) || 620;
        const easing = cs.getPropertyValue('--ease-inout').trim() || 'ease-in-out';

        document.documentElement.animate(
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
      .catch(() => { /* transition skipped; the theme still applied */ });
  });
}
