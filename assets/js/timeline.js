/* timeline.js — scroll-linked draw of the career line.

   The plan specified an SVG stroke-dashoffset. This uses transform: scaleY()
   on a plain element instead: it is GPU-composited and satisfies the project
   rule of animating transform and opacity only, where stroke-dashoffset
   repaints the SVG every frame. Same visual result. */

export function initTimeline() {
  const wrap = document.querySelector('.timeline');
  const line = document.querySelector('.timeline__line');
  if (!wrap || !line) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    line.style.setProperty('--draw', '1'); // fully drawn, no animation
    return;
  }

  let ticking = false;

  const draw = () => {
    const r = wrap.getBoundingClientRect();
    // 0 when the top of the list reaches the lower third of the viewport,
    // 1 once its bottom has passed the same point.
    const anchor = innerHeight * 0.66;
    const progress = (anchor - r.top) / r.height;
    line.style.setProperty('--draw', String(Math.min(Math.max(progress, 0), 1)));
    ticking = false;
  };

  // Coalesce to one write per frame; writing on every scroll event janks on
  // a mid-range phone.
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(draw); }
  }, { passive: true });

  addEventListener('resize', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(draw); }
  }, { passive: true });

  draw();
}
