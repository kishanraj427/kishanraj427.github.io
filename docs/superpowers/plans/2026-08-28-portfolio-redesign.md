# Portfolio Day/Night Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Rebuild `kishanraj427.github.io` as a hand-written, dependency-free static site with a day/night theme, an animated theme transition, a hero, and the work section split into a career timeline and a filterable project grid.

**Architecture:** One `index.html`, five layered CSS files (tokens → base → layout → components → motion), and six ES modules (`theme`, `nav`, `reveal`, `timeline`, `filters`, `main`). No build step, no framework, no dependencies. A single blocking inline script in `<head>` applies the theme and the `js` class before first paint. All colour, spacing and motion values are custom properties defined once in `01-tokens.css`; themes swap values, never rules.

**Tech Stack:** HTML5, modern CSS (custom properties, grid, `clamp()`, View Transitions API), vanilla ES modules, `IntersectionObserver`. Google Fonts (Lato 400/700/900 for display and body, JetBrains Mono 400 for metadata). Fraunces and Inter were both rejected during Task 1 — see the spec's typography section. Deployed as-is by GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-28-portfolio-redesign-design.md` — read it alongside this plan. Every task argues from it.

---

## Global Constraints

Every task's requirements implicitly include this section.

- **Branch:** all work happens on `redesign/day-night`. Do not create branches. Do not touch `main`.
- **DO NOT COMMIT. DO NOT PUSH.** The user commits their own work. This overrides the writing-plans skill's standard "commit" step — tasks end at a checkpoint that reports to the user instead. Never run `git commit`, `git push`, `git reset`, or `git checkout` of a branch.
- **DO NOT RUN TEST SUITES.** Per the user's global instructions, the user runs tests. There is no test framework in this repo and none is being added. Verification is (a) static checks the agent runs via `scripts/check.py`, and (b) a browser check the *user* performs.
- **No build step, no dependencies, no `node_modules`, no CI.** If a task seems to need one, stop and ask.
- **No hardcoded colours outside `01-tokens.css`.** `scripts/check.py` enforces this.
- **Accent discipline:** `--accent` is for decoration, glows, rules, borders and large display type only. `--accent-ink` is for any text at body size, including inline links. Never use `--accent` for running text.
- **Motion vocabulary** — use these tokens, never ad-hoc values:
  - `--dur-fast` ~160ms — tile hover, chip press, focus rings
  - `--dur-base` ~320ms — scroll reveals, filter FLIP, tilt settle
  - `--dur-slow` ~620ms — theme wipe, timeline draw, count-up
  - `--ease-out` `cubic-bezier(.22,.61,.36,1)` — anything entering or responding to input
  - `--ease-inout` `cubic-bezier(.65,0,.35,1)` — anything moving between two positions
  - Stagger: 60ms per item, **capped at 8 items** (480ms total)
- **Animate `transform` and `opacity` only.** Never animate layout properties.
- **Magnetic and tilt must never nest.** Tilt on project cards only; magnetic on hero CTAs only.
- **Typography never changes with theme** — only colour and motion respond to the toggle.
- **Contrast:** every text colour verified at 4.5:1 (body) / 3:1 (large text, UI borders) in **both** themes.
- **Reduced motion:** one `@media (prefers-reduced-motion: reduce)` block in `05-motion.css`. Count-ups render their final value; the timeline renders fully drawn; magnetic and tilt are disabled outright.
- **Images:** every meaningful image carries a descriptive `alt`; decorative art gets `alt=""` plus `aria-hidden="true"`. Inline SVG icons inside a labelled control are `aria-hidden`, with the label on the control.
- **Content is authoritative from the spec**, §6 and §11. Do not re-derive dates or invent copy.

### Employment and education data (spec §6, authoritative)

| Entry | Dates |
|---|---|
| Eicore — Software Engineer | Feb 2026 – Present |
| essentia.dev — Software Engineer | Jun 2025 – Feb 2026 |
| Wit/Bit — Full-Stack Mobile Developer, Kolkata (Remote) | Jan 2024 – May 2025 |
| Learnship — Internship, Chennai (On-site) | Sep 2023 – Jan 2024 |
| Vellore Institute of Technology — MCA, 9.01 | Sep 2022 – May 2024 |
| Jharkhand Raksha Shakti University — B.Sc CS & Cyber Security, 9.19 | 2019 – 2022 |

The MCA (to May 2024) deliberately overlaps Wit/Bit (from Jan 2024). Render it honestly; do not force a false sequence.

---

## File Structure

| File | Responsibility |
|---|---|
| `index.html` | All markup. Semantic landmarks, one `<section>` per block. |
| `assets/css/01-tokens.css` | Both palettes, type scale, spacing, radii, shadows, motion tokens. The only file with literal colours. |
| `assets/css/02-base.css` | Reset, `:root` wiring, typography, focus-visible, skip link. |
| `assets/css/03-layout.css` | Page shell, sidebar, section rhythm, containers, responsive breakpoints. |
| `assets/css/04-components.css` | Card, tile, timeline, chip, button, badge, form, stat. |
| `assets/css/05-motion.css` | Keyframes, reveal start/end states, view-transition rules, the single reduced-motion block. |
| `assets/js/theme.js` | Toggle, persistence, the circular wipe. |
| `assets/js/nav.js` | Mobile menu, focus trap, Escape, scroll-spy. |
| `assets/js/reveal.js` | Shared `IntersectionObserver` reveal + stagger. Consumed by four sections. |
| `assets/js/timeline.js` | Scroll-linked career line draw. |
| `assets/js/filters.js` | Project filtering with FLIP animation. |
| `assets/js/main.js` | Imports and initialises the above; removes `no-transitions`. |
| `scripts/check.py` | Dev-only static checks. Never referenced by `index.html`. |

**Deleted in Task 9:** `vendor/`, `assets/js/{custom,isotope.min,owl-carousel,lightbox}.js`, `assets/css/{templatemo-style,owl,lightbox,flex-slider,fontawesome}.css`, `assets/fonts/`, `prepros-6.config`.

---

## Task 1: Foundation — tokens, base, theme boot, verification script

Establishes the design system and the pre-paint boot script everything else depends on. Also fixes the asset naming inconsistency now, before any markup references it.

**Files:**
- Create: `assets/css/01-tokens.css`, `assets/css/02-base.css`, `scripts/check.py`
- Modify: `index.html` (head only — keep the existing body untouched this task)
- Rename: `assets/images/React.png` → `react.png`, `assets/images/Playwrite.png` → `playwright.png`

**Interfaces:**
- Produces: every custom property later tasks consume; `<html data-theme>`, `<html class="js">`, `<html class="no-transitions">`; `scripts/check.py` used by all later tasks.

- [x] **Step 1: Rename the two mis-cased assets**

`React.png` and `Playwrite.png` are capitalised while every other image is lowercase, and *Playwrite* misspells *Playwright*. GitHub Pages is case-sensitive; local dev is not, so this breaks in production only.

```bash
git mv assets/images/React.png assets/images/react.png
git mv assets/images/Playwrite.png assets/images/playwright.png
```

`git mv` stages the rename. **Do not commit** — leave it staged for the user.

- [x] **Step 2: Write `scripts/check.py`**

Dev-only. Verifies what an agent can verify honestly without a browser.

```python
#!/usr/bin/env python3
"""Static checks for the portfolio. Dev-only; never shipped."""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
fails = []

# 1. every referenced asset exists on disk (catches case-sensitivity bugs)
for attr in ('src', 'href'):
    for ref in re.findall(r'%s="((?!https?:|mailto:|#)[^"]+)"' % attr, html):
        if not os.path.exists(os.path.join(ROOT, ref)):
            fails.append('missing asset: %s' % ref)

# 2. tag balance
for tag in ('div', 'section', 'figure', 'ul', 'li', 'button', 'a'):
    o = len(re.findall(r'<%s[\s>]' % tag, html))
    c = len(re.findall(r'</%s>' % tag, html))
    if o != c:
        fails.append('unbalanced <%s>: %d open, %d close' % (tag, o, c))

# 3. external links open in a new tab, safely
for tag in re.findall(r'<a\b[^>]*>', html):
    href = re.search(r'href="(https?:[^"]+)"', tag)
    if href and ('_blank' not in tag or 'noopener' not in tag):
        fails.append('external link missing target/rel: %s' % href.group(1))

# 4. no hardcoded colours outside the tokens file
CSS = os.path.join(ROOT, 'assets/css')
for name in sorted(os.listdir(CSS)):
    if name == '01-tokens.css' or not name.endswith('.css'):
        continue
    css = open(os.path.join(CSS, name), encoding='utf-8').read()
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    for lit in re.findall(r'#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(', css):
        fails.append('hardcoded colour in %s: %s' % (name, lit))

# 5. the pre-paint boot script must be inline in <head>
head = html.split('</head>')[0]
if 'data-theme' not in head:
    fails.append('no pre-paint theme boot script in <head>')

print('\n'.join('FAIL ' + f for f in fails) if fails else 'OK all checks passed')
sys.exit(1 if fails else 0)
```

- [x] **Step 3: Run it against the current page to confirm it reports real state**

Run: `python3 scripts/check.py`
Expected: FAIL lines for hardcoded colours in the legacy CSS and a missing boot script. This proves the checker works before it is trusted.

- [x] **Step 4: Write `assets/css/01-tokens.css`**

Define, on `:root`, the day palette plus every non-colour token; then redefine **only the colour tokens** under `:root[data-theme="night"]`. Structure:

```css
:root {
  /* ── day palette ────────────────────────────── */
  --canvas:      /* warm parchment */;
  --surface:     /* raised warm white */;
  --text:        /* deep ink */;
  --text-muted:  /* warm grey */;
  --accent:      /* organic green, vivid — decoration only */;
  --accent-ink:  /* deepened green — body text, links, 4.5:1 on --canvas */;
  --secondary:   /* sun amber */;
  --border:      /* soft sand */;

  /* ── motion (never redefined per theme) ─────── */
  --dur-fast: 160ms;
  --dur-base: 320ms;
  --dur-slow: 620ms;
  --ease-out: cubic-bezier(.22,.61,.36,1);
  --ease-inout: cubic-bezier(.65,0,.35,1);
  --stagger: 60ms;

  /* type scale, spacing scale, radii, shadow ramp */
}

:root[data-theme="night"] {
  --canvas:      /* deep blue-black */;
  --surface:     /* lifted slate */;
  --text:        /* soft white */;
  --text-muted:  /* cool grey */;
  --accent:      /* electric cyan, vivid */;
  --accent-ink:  /* adjusted cyan — 4.5:1 on the night canvas */;
  --secondary:   /* moon silver */;
  --border:      /* low-contrast slate */;
}
```

Concrete starting values — use these unless measurement rejects one:

| Token | Day | Night |
|---|---|---|
| `--canvas` | `#faf6ef` | `#0d1117` |
| `--surface` | `#fffdf8` | `#161b22` |
| `--text` | `#1c1a17` | `#e8e6e3` |
| `--text-muted` | `#6b6459` | `#9aa4b2` |
| `--accent` | `#2f9e5e` | `#39d3ee` |
| `--accent-ink` | `#1d6b3f` | `#7fe4f7` |
| `--secondary` | `#e0952f` | `#c3cad6` |
| `--border` | `#e6ddcd` | `#2a323d` |

Verify every text pairing before moving on: `--text` and `--text-muted` on `--canvas` **and** on `--surface`, and `--accent-ink` on both. Body text needs 4.5:1; large text and UI borders need 3:1. Note `--accent-ink` inverts direction between themes — darker than `--accent` on the light canvas, lighter on the dark one. Record the measured ratios in a comment at the top of the file and adjust anything that misses.

- [x] **Step 5: Write `assets/css/02-base.css`**

Reset, box-sizing, `body` background/colour from tokens, fluid type via `clamp()`, heading scale, link styling using `--accent-ink`, a visible `:focus-visible` ring, and the skip-link (visually hidden until focused).

- [x] **Step 6: Add the pre-paint boot script and stylesheet links to `<head>`**

This is the **only** inline JS in the project. It must be blocking and must come before any stylesheet.

```html
<script>
  (function () {
    var r = document.documentElement;
    r.classList.add('js', 'no-transitions');
    var t = null;
    try { t = localStorage.getItem('theme'); } catch (e) {}
    if (t !== 'day' && t !== 'night') {
      t = matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
    }
    r.setAttribute('data-theme', t);
  })();
</script>
```

Three jobs: set `data-theme` before paint so no theme flashes; add `js` so reveal start-states apply only when JS is alive; add `no-transitions` so applying the stored theme at boot does not play the wipe. The `try/catch` is required — `localStorage` throws outright in some privacy modes.

Then link the five stylesheets in numeric order and the Google Fonts stylesheet (latin subset; Fraunces 400/700, Inter 400/600, JetBrains Mono 400; `display=swap`).

Measure the font payload before accepting it — fonts are the largest remaining cost and the one place this design can quietly undo its own performance win. Budget is **120 KB** for all three families combined. Over budget: keep Fraunces for display and drop one of the remaining families to a system stack. Check with the Network panel filtered to `font`, or by summing the `.woff2` responses the Google Fonts CSS references.

- [x] **Step 7: Verify**

Run: `python3 scripts/check.py`
Expected: the "no pre-paint theme boot script" failure is gone. Hardcoded-colour failures for legacy CSS remain until Task 9 — that is expected.

- [x] **Step 8: Checkpoint — hand back to the user**

**Do not commit.** Report: files created, the two renames (staged), the chosen palette values with their contrast ratios, and remaining known-failing checks. Ask the user to open the page and confirm no flash of the wrong theme on reload in either OS colour scheme.

---

## Task 2: Theme toggle and the circular wipe

The site's signature interaction. Built early because every later task must be checked in both themes.

**Files:**
- Create: `assets/js/theme.js`, `assets/js/main.js`
- Modify: `index.html` (toggle button markup), `assets/css/05-motion.css` (create), `assets/css/04-components.css` (create)

**Interfaces:**
- Consumes: `data-theme`, `no-transitions`, motion tokens from Task 1.
- Produces: `initTheme()` exported from `theme.js`; `main.js` as the single module entry point (`<script type="module" src="assets/js/main.js">`).

- [x] **Step 1: Add the toggle button to `index.html`**

A real `<button>` — the current site uses `<i>` elements for controls, which are not keyboard-reachable.

```html
<button id="theme-toggle" class="theme-toggle" type="button" aria-pressed="false">
  <span class="visually-hidden">Switch to night theme</span>
  <svg class="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <mask id="moon-mask">
      <rect width="100%" height="100%" fill="#fff"/>
      <circle class="theme-toggle__bite" cx="24" cy="10" r="6" fill="#000"/>
    </mask>
    <circle class="theme-toggle__disc" cx="12" cy="12" r="6" mask="url(#moon-mask)"/>
    <g class="theme-toggle__rays"><!-- 8 <line> rays --></g>
  </svg>
</button>
```

The crescent is produced by animating the masking circle's `cx` from 24 (clear of the disc, so a full sun) to 14 (biting into it, so a crescent). The rays fade and scale out over the same duration. No cross-fade between two icons.

- [x] **Step 2: Write `assets/js/theme.js`**

```js
const KEY = 'theme';
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const write = v => { try { localStorage.setItem(KEY, v); } catch {} };

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  btn.setAttribute('aria-pressed', String(theme === 'night'));
  btn.querySelector('.visually-hidden').textContent =
    theme === 'night' ? 'Switch to day theme' : 'Switch to night theme';
}

export function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  apply(document.documentElement.getAttribute('data-theme'));

  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'night' ? 'day' : 'night';
    write(next);

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !document.startViewTransition) { apply(next); return; }

    // seed the wipe at the button's centre
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.style.setProperty('--wipe-x', x + 'px');
    document.documentElement.style.setProperty('--wipe-y', y + 'px');
    document.documentElement.style.setProperty('--wipe-r', far + 'px');

    document.startViewTransition(() => apply(next));
  });
}
```

- [x] **Step 3: Write the view-transition CSS in `05-motion.css`**

```css
::view-transition-old(root) { animation: none; }
::view-transition-new(root) {
  animation: wipe var(--dur-slow) var(--ease-inout);
}
@keyframes wipe {
  from { clip-path: circle(0 at var(--wipe-x) var(--wipe-y)); }
  to   { clip-path: circle(var(--wipe-r) at var(--wipe-x) var(--wipe-y)); }
}
```

**Fixed elements must be named or they duplicate and jump during the wipe.** The sidebar and scroll-progress bar are `position: fixed`; give each a `view-transition-name` so it animates as its own layer and cross-fades in place:

```css
.sidebar        { view-transition-name: sidebar; }
.scroll-progress{ view-transition-name: progress; }
```

These two elements are not created until Task 3. Writing their rules now is deliberate and harmless — CSS for a selector matching nothing is inert — and it keeps the whole view-transition contract in one place. Re-check the wipe after Task 3, once the elements exist.


- [x] **Step 4: Write `assets/js/main.js` and wire it up**

```js
import { initTheme } from './theme.js';

initTheme();
requestAnimationFrame(() =>
  requestAnimationFrame(() => document.documentElement.classList.remove('no-transitions'))
);
```

Two nested frames, not one: the class must survive until after the first style recalculation, or the boot theme still animates. Add `<script type="module" src="assets/js/main.js"></script>` before `</body>`.

- [x] **Step 5: Add the `no-transitions` guard to `05-motion.css`**

```css
.no-transitions * { transition: none !important; animation: none !important; }
```

- [x] **Step 6: Verify**

Run: `python3 scripts/check.py`
Expected: no new failures.

- [x] **Step 7: Checkpoint — hand back to the user**

**Do not commit.** Ask the user to check: the wipe expands from the button; the sun visibly *morphs* into a crescent rather than cross-fading; the sidebar does not jump during the wipe; the choice survives a reload; and with OS "reduce motion" on, the theme still switches but does so instantly.

---

## Task 3: Layout shell, sidebar and navigation

**Files:**
- Create: `assets/css/03-layout.css`, `assets/js/nav.js`
- Modify: `index.html` (sidebar + shell), `assets/js/main.js`

**Interfaces:**
- Consumes: tokens (Task 1).
- Produces: `initNav()`; the `.section` wrapper and `data-section` ids every later section uses; `.scroll-progress` element.

- [x] **Step 1: Write the shell and sidebar markup**

Semantic landmarks: `<header class="sidebar">` containing identity, `<nav>`, and socials; `<main id="content">` for sections; `<footer>`. First focusable element in `<body>` is the skip link:

```html
<a class="skip-link" href="#content">Skip to content</a>
```

Nav grows from four items to five, matching the new IA. Keep the existing playful labels where they still fit:

| Label | Target |
|---|---|
| Raj Kishan, who dat? | `#about` |
| My Superpowers | `#superpowers` |
| Career | `#career` |
| Projects | `#projects` |
| Say Hi! | `#contact` |

The menu markup **must** carry the three ids `nav.js` looks up, or the module throws on load and takes every later `init*()` call down with it:

```html
<button id="menu-toggle" class="menu-toggle" type="button" aria-expanded="false">
  <span class="visually-hidden">Open menu</span>
</button>
<div id="menu" class="menu">
  <button id="menu-close" class="menu-close" type="button">
    <span class="visually-hidden">Close menu</span>
  </button>
  <!-- identity, nav, socials -->
</div>
```

Both are real `<button>` elements — the current site uses `<i>` for these, which is not keyboard-reachable.

Replace the FontAwesome `<i>` social icons with inline `<svg>` (LinkedIn, GitHub, email, résumé). This removes the last dependency on the icon font, which Task 9 deletes. Keep every external link's `target="_blank" rel="noopener noreferrer"`; the `mailto:` link gets neither.

- [x] **Step 2: Write `assets/css/03-layout.css`**

Fixed sidebar on desktop, off-canvas below 846px (the existing breakpoint). Section rhythm and container widths from spacing tokens. Include `.scroll-progress` as a fixed bar.

- [x] **Step 3: Write `assets/js/nav.js`**

```js
export function initNav() {
  const menu = document.getElementById('menu');
  const open = document.getElementById('menu-toggle');
  const close = document.getElementById('menu-close');
  const setOpen = on => {
    menu.classList.toggle('is-open', on);
    open.setAttribute('aria-expanded', String(on));
    (on ? close : open).focus();
  };
  open.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
  });
  menu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => { if (innerWidth < 846) setOpen(false); })
  );

  // scroll-spy: highlight the section currently in view
  const links = [...menu.querySelectorAll('a[href^="#"]')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l =>
        l.classList.toggle('is-current', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));

  // scroll progress
  const bar = document.querySelector('.scroll-progress');
  addEventListener('scroll', () => {
    const max = document.body.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  }, { passive: true });
}
```

The `rootMargin` creates a band across the middle of the viewport so exactly one section is "current" at a time. `scaleX` on a `transform-origin: left` bar keeps the progress indicator off the layout path.

- [x] **Step 4: Import `initNav` in `main.js` and call it**

- [x] **Step 5: Verify**

Run: `python3 scripts/check.py`
Expected: OK, or only the known legacy-CSS colour failures.

- [x] **Step 6: Checkpoint — hand back to the user**

**Do not commit.** Ask the user to check keyboard-only navigation: Tab reveals the skip link first, the menu opens and closes with the keyboard, Escape closes it, and the sidebar highlight follows the scroll.

---

## Task 4: Hero

**Files:**
- Modify: `index.html` (hero section), `assets/css/04-components.css`, `assets/css/05-motion.css`
- Create: `assets/js/reveal.js`
- Modify: `assets/js/main.js`

**Interfaces:**
- Consumes: tokens, `.js` class, motion tokens.
- Produces: `initReveal()` and `countUp()` from `reveal.js` — **reused by Tasks 5, 6 and 7**; do not reimplement either.

- [x] **Step 1: Write `assets/js/reveal.js`**

Shared by four sections. Stagger is capped at 8 so the 20-tile grid does not crawl.

```js
const CAP = 8;

export function initReveal(selector = '[data-reveal]') {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const group = [...entry.target.parentElement.children]
        .filter(el => el.matches(selector));
      const i = Math.min(group.indexOf(entry.target), CAP);
      entry.target.style.setProperty('--i', i);
      entry.target.classList.add('is-revealed');
      obs.unobserve(entry.target);          // reveal once, then stop observing
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll(selector).forEach(el => io.observe(el));
}

export function countUp(el, to, ms) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = to;                     // final value, never skipped
    return;
  }
  const start = performance.now();
  const tick = now => {
    const p = Math.min((now - start) / ms, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));  // ease-out cubic
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
```

- [x] **Step 2: Write the reveal states in `05-motion.css`**

Start-states are scoped to `.js` so a JS failure leaves the page fully readable rather than blank.

```css
.js [data-reveal] {
  opacity: 0;
  transform: translateY(1rem);
  transition: opacity var(--dur-base) var(--ease-out),
              transform var(--dur-base) var(--ease-out);
  transition-delay: calc(var(--i, 0) * var(--stagger));
}
.js [data-reveal].is-revealed { opacity: 1; transform: none; }
```

- [x] **Step 3: Write the hero markup**

Two columns on desktop, stacked on mobile. Left column, in order: name (`<h1>`), role, one-line pitch, the day/night tagline, the stat strip, the CTAs, the Wire badge. Right column: `kishan.jpg`.

**The pitch line is not yet written.** Draft two or three options and present them to the user at this task's checkpoint; do not invent one silently and move on.

Stat strip — figures are fixed by the spec, all verifiable from site content:

| Figure | Label |
|---|---|
| 3 | yrs shipping in production |
| 6 | apps live on Google Play |
| 20 | technologies |
| — | MCA 9.01, VIT |

CTAs: View Work (`#projects`), Résumé (Drive link, new tab), Say Hi (`#contact`).

- [x] **Step 4: Style the hero and the photo treatment**

The photo tint is a **low-opacity overlay plus a brightness/contrast nudge only**. No `hue-rotate`, no saturation shift — those discolour skin tones. If the face does not read naturally in either theme, drop the effect entirely and say so at the checkpoint.

- [x] **Step 5: Add magnetic CTAs**

Pointer-relative translate on the hero CTAs, released on `pointerleave`, skipped when `(pointer: coarse)` or reduced-motion is set. **Hero CTAs only** — a magnetic control inside a tilting card produces compounding, fighting transforms.

- [x] **Step 6: Trigger the count-up on first intersection**

Not on load. Observe the stat strip; on first intersection call `countUp(el, value, 620)` for each numeric stat, then unobserve.

- [x] **Step 7: Verify**

Run: `python3 scripts/check.py`
Expected: no new failures.

- [x] **Step 8: Checkpoint — hand back to the user**

**Do not commit.** Present the pitch-line options for a decision. Ask the user whether the hero feels crowded with the photo, tagline, stat strip, CTAs and Wire badge all present — the spec designates the **Wire badge as the first cut** if it does, since Wire is already featured large in Projects.

---

## Task 5: About and Superpowers

**Files:**
- Modify: `index.html`, `assets/css/04-components.css`

**Interfaces:**
- Consumes: `initReveal()` (Task 4) — already initialised globally; these sections only need `data-reveal` attributes.

- [x] **Step 1: Write the About section**

Copy is unchanged from the current site (spec §11 — the age line and the two assistant artifacts are already removed on `main`; do not reintroduce them). Restyle only.

- [x] **Step 2: Write the Superpowers grid**

20 tiles, each `data-reveal`, referencing the **lowercase** filenames after Task 1's rename (`react.png`, `playwright.png`).

- [x] **Step 3: Give every tile a surface chip**

The logos are fixed-colour PNGs that do not respond to the theme. Measured mean luminance of opaque pixels shows several lose definition on the night canvas — `angular.png` 86, `kotlin.png` 94, `sql.png` 99, `playwright.png` 113. `express.png` is a dark disc with a white wordmark, so on a dark canvas the disc vanishes and only the letters float.

Every tile sits on a rounded plate using `--surface`, in **both** themes. Do not recolour, invert or filter any logo, and do not special-case individual assets — adding a new logo later must not require re-tuning anything.

- [x] **Step 4: Add hover treatment**

Lift via `transform` plus an `--accent` glow, at `--dur-fast` / `--ease-out`.

- [x] **Step 5: Verify**

Run: `python3 scripts/check.py`
Expected: OK — this is the task where the lowercase renames are first exercised, so a case bug surfaces here as a missing-asset failure.

- [x] **Step 6: Checkpoint — hand back to the user**

**Do not commit.** Ask the user to confirm every one of the 20 logos is clearly legible in **night** theme specifically.

---

## Task 6: Career timeline

**Files:**
- Create: `assets/js/timeline.js`
- Modify: `index.html`, `assets/css/04-components.css`, `assets/js/main.js`

**Interfaces:**
- Consumes: tokens, motion tokens.
- Produces: `initTimeline()`.

- [x] **Step 1: Write the timeline markup**

Six entries in the order given in Global Constraints, newest first. Each entry: role/qualification, organisation, dates in JetBrains Mono, and a one-line description. Education entries carry a modifier class.

Content for the four roles comes from the current site (spec §11); **two corrections are part of this task** — Wit/Bit currently reads "2024" and must become Jan 2024 – May 2025, and Learnship currently carries no dates at all.

- [x] **Step 2: Style role vs education distinctly**

Education gets a hollow node and a muted rule so one continuous timeline never implies the degrees were jobs.

The MCA (to May 2024) overlaps Wit/Bit (from Jan 2024). Render both honestly — do not reorder to remove the overlap, and do not draw a gap or a visual conflict where the ranges cross.

- [x] **Step 3: Write `assets/js/timeline.js`**

An SVG line whose `stroke-dashoffset` is driven by scroll position.

```js
export function initTimeline() {
  const line = document.querySelector('.timeline__line');
  const wrap = document.querySelector('.timeline');
  if (!line || !wrap) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    line.style.strokeDashoffset = '0';        // fully drawn, no animation
    return;
  }

  const len = line.getTotalLength();
  line.style.strokeDasharray = len;
  line.style.strokeDashoffset = len;

  let ticking = false;
  const draw = () => {
    const r = wrap.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight - r.top) / (r.height + innerHeight), 0), 1);
    line.style.strokeDashoffset = len * (1 - p);
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(draw); }
  }, { passive: true });
  draw();
}
```

The `ticking` flag coalesces scroll events into one write per frame; writing `strokeDashoffset` on every scroll event causes jank on a mid-range phone.

- [x] **Step 4: Import and call `initTimeline` in `main.js`**

- [x] **Step 5: Verify**

Run: `python3 scripts/check.py`
Expected: no new failures.

- [x] **Step 6: Checkpoint — hand back to the user**

**Do not commit.** Ask the user to confirm all six entries and their dates are correct, that the line draws smoothly, and that with reduced-motion on it appears fully drawn immediately.

---

## Task 7: Projects grid and filtering

**Files:**
- Create: `assets/js/filters.js`
- Modify: `index.html`, `assets/css/04-components.css`, `assets/js/main.js`

**Interfaces:**
- Consumes: tokens, motion tokens.
- Produces: `initFilters()`.

- [x] **Step 1: Write the projects markup**

All side projects from the current site, each with `data-tags`. Wire is a double-width featured card: Flutter · PostgreSQL · WebSocket, the bike-trip origin, and links to Google Play (`com.wire.location`) and the repo (`kishanraj427/wayfarer-sync`).

Harber is a personal project — a Flutter app for booking a slot at the nearest barber shop (2023, `kishanraj427/harber`). It belongs here under `Flutter`, **not** in the Career timeline.

The two JRSU cards are the app for Jharkhand Raksha Shakti University, where the user took their B.Sc. Make that connection explicit in the copy — building the official app for your own university is a stronger story than an unattributed app, and it is currently invisible to a reader.

- [x] **Step 2: Write the filter chips**

Radio-grouped (`role="radiogroup"`, one `role="radio"` per chip), keyboard-operable with arrow keys, `aria-checked` reflecting state. Chips: All / Flutter / Web / Backend.

- [x] **Step 3: Write `assets/js/filters.js`**

FLIP so cards glide rather than snap. Replaces Isotope entirely.

```js
export function initFilters() {
  const grid = document.querySelector('.projects__grid');
  const chips = document.querySelectorAll('.chip');
  if (!grid || !chips.length) return;
  const cards = [...grid.children];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const applyFilter = tag => {
    const first = cards.map(c => c.getBoundingClientRect());   // FIRST

    cards.forEach(c => {
      const tags = (c.dataset.tags || '').split(' ');
      c.hidden = !(tag === 'all' || tags.includes(tag));
    });
    if (reduced) return;

    cards.forEach((c, i) => {                                  // LAST + INVERT + PLAY
      if (c.hidden) return;
      const last = c.getBoundingClientRect();
      const dx = first[i].left - last.left;
      const dy = first[i].top - last.top;
      if (!dx && !dy) return;
      c.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: 320, easing: 'cubic-bezier(.22,.61,.36,1)' }
      );
    });
  };

  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.setAttribute('aria-checked', String(c === chip)));
    applyFilter(chip.dataset.filter);
  }));
}
```

Reading every `getBoundingClientRect()` into `first` **before** any mutation is what keeps this to a single layout pass; interleaving reads and writes causes layout thrashing.

- [x] **Step 4: Add card tilt**

Subtle rotate on pointer over project cards, disabled on `(pointer: coarse)` and under reduced-motion. **Project cards only** — never on anything containing a magnetic button.

- [x] **Step 5: Import and call `initFilters` in `main.js`**

- [x] **Step 6: Verify**

Run: `python3 scripts/check.py`
Expected: no new failures. All six Play Store links and both Wire links must resolve as existing external links with `target`/`rel`.

- [x] **Step 7: Checkpoint — hand back to the user**

**Do not commit.** Ask the user to confirm filtering animates smoothly, chips are keyboard-operable, and no project is missing from the grid.

---

## Task 8: Contact section

**Files:**
- Modify: `index.html`, `assets/css/04-components.css`

- [x] **Step 1: Rebuild the form**

Keep the existing Formspree endpoint exactly: `action="https://formspree.io/f/xzzbqjbk" method="POST"`. Fields: name, `_replyto` (email), subject, message — preserving the current `name` attributes, since Formspree relies on them.

- [x] **Step 2: Add accessible validation**

Every field gets a real `<label>` (the current site uses placeholders alone, which vanish on focus and are not announced). Errors are tied by `aria-describedby`; the submit button carries pending/success/error states.

- [x] **Step 3: Verify**

Run: `python3 scripts/check.py`
Expected: OK.

- [x] **Step 4: Checkpoint — hand back to the user**

**Do not commit.** Ask the user to send one real test submission and confirm it arrives.

---

## Task 9: Remove the old stack and final sweep

Last, so the site stays viewable throughout.

**Files:**
- Delete: `vendor/`, `assets/js/{custom,isotope.min,owl-carousel,lightbox}.js`, `assets/css/{templatemo-style,owl,lightbox,flex-slider,fontawesome}.css`, `assets/fonts/`, `prepros-6.config`
- Modify: `README.md`

- [x] **Step 1: Confirm nothing references the doomed files**

```bash
grep -nE 'vendor/|templatemo|owl|lightbox|flex-slider|fontawesome|isotope|custom\.js' index.html || echo "clean"
```

Expected: `clean`. If anything matches, fix `index.html` before deleting.

- [x] **Step 2: Delete**

```bash
git rm -r --cached vendor >/dev/null && rm -rf vendor
rm -rf assets/fonts
rm -f assets/js/custom.js assets/js/isotope.min.js assets/js/owl-carousel.js assets/js/lightbox.js
rm -f assets/css/templatemo-style.css assets/css/owl.css assets/css/lightbox.css \
      assets/css/flex-slider.css assets/css/fontawesome.css
rm -f prepros-6.config
```

- [x] **Step 3: Update `README.md`**

The stack section currently claims Bootstrap/jQuery. Rewrite it to describe the hand-written CSS and vanilla ES modules, and update the repository-structure block to match the new file layout.

- [x] **Step 4: Final verification**

```bash
python3 scripts/check.py
du -sh assets && ls vendor 2>&1 | head -1
```

Expected: `OK all checks passed` — including **zero** hardcoded-colour failures, since the legacy stylesheets that caused them are now gone. `vendor` should not exist.

- [x] **Step 5: Checkpoint — hand back to the user**

**Do not commit.** Report the before/after page weight and hand over the full manual review checklist:

```
kishanraj427.github.io    python3 -m http.server 8000    # then open localhost:8000
```

- both themes, and the toggle transition between them
- no flash of the wrong theme on reload, in both OS colour schemes
- keyboard-only navigation end to end
- reduced-motion behaviour, via the OS setting
- mobile width
- **JavaScript disabled — every section must still be readable**

---

## Notes for the executor

- **Never commit or push.** Every task ends by reporting to the user, who commits themselves.
- **Never run a test suite.** There isn't one. Run `scripts/check.py` and hand browser checks to the user.
- If a task appears to need a dependency, a build step or a framework — stop and ask. The no-build constraint is not negotiable.
- Check every visual change in **both** themes before calling a task done.
- `scripts/check.py` reports hardcoded-colour failures for the legacy stylesheets until Task 9 deletes them. That is expected; it is not licence to ignore new failures in files you wrote.
