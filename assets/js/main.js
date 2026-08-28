/* main.js — single module entry point. Imports and initialises each feature. */

import { initTheme } from './theme.js';
import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { initHero } from './hero.js';
import { initTimeline } from './timeline.js';
import { initFilters, initTilt } from './filters.js';
import { initContact } from './contact.js';

initTheme();
initNav();
initReveal();
initHero();
initTimeline();
initFilters();
initTilt();
initContact();

/* The boot script sets `no-transitions` so applying the stored theme at load
   does not play the wipe. Two nested frames, not one: the class must survive
   past the first style recalculation, or the boot theme still animates. */
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('no-transitions');
  });
});
