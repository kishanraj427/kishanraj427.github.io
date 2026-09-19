# Responsive Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the layout hold at any screen width by keying components to their own container instead of the window, and replace the off-canvas drawer with a bottom floating nav bar below 1272px.

**Architecture:** Mobile-first. One `@media (min-width: 79.5rem)` block in `03-layout.css` adds the desktop sidebar; everything below it is the default. Component grids move from `@media` to `@container`, with column thresholds computed as `n × min-column + (n−1) × gap`. `scripts/check.py` is the test harness — it gains four invariants that make these rules mechanically enforced.

**Tech Stack:** HTML5, hand-authored CSS (custom properties, grid, container queries, `clamp()`, `env()`), vanilla ES modules. No build step, no dependencies. Python 3 for `scripts/check.py`.

**Spec:** `docs/superpowers/specs/2026-09-20-responsive-architecture-design.md`

---

## HOW TO EXECUTE THIS PLAN — READ FIRST

**These rules override any habit or general instruction you have.**

1. **NEVER run a git command.** No `git commit`, `git add`, `git checkout`, `git stash`, no branches. Leave every change in the working tree. If a skill tells you to commit, ignore it. Committing is the user's job.

2. **Every "FIND" block is exact text from the real file.** Copy it as your match target character for character, including indentation and comments. **If the text does not match, STOP and report it.** Do not search for something similar, do not improvise a replacement, do not rewrite the file from scratch.

3. **After every single step, run the verification command.** If it fails and the step did not say it should fail, STOP and report the exact output. Do not proceed to the next step. Do not try to fix it by making unrelated changes.

4. **Never invent CSS, HTML or JS that is not written in this plan.** Every line you need is here. If you think something is missing, STOP and say so.

5. **Do not reformat, re-indent, re-order or "tidy" anything you were not told to change.** Do not delete comments you were not told to delete.

6. **Do not add new comments** beyond the ones written in this plan. The ones here are one or two lines on purpose — keep them that way.

7. **Line numbers are hints only.** They drift as you edit. The FIND text is the authority.

**Verification command — run after every step:**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Success is exactly `OK all checks passed` and exit code 0.

---

## Global Constraints

Copied from the spec. Every task's requirements implicitly include these.

- `01-tokens.css` is the ONLY file allowed to contain a literal colour. Every other stylesheet consumes custom properties. `scripts/check.py` enforces this.
- Animate `transform` and `opacity` only. Never layout properties.
- Motion values come from existing tokens: `--dur-fast` 160ms, `--dur-base` 320ms, `--dur-slow` 620ms, `--ease-out` `cubic-bezier(0.22, 0.61, 0.36, 1)`, `--ease-inout` `cubic-bezier(0.65, 0, 0.35, 1)`, `--stagger` 60ms.
- The single `@media (prefers-reduced-motion: reduce)` block in `05-motion.css` is the only place reduced motion is handled in CSS. Do not add per-component guards.
- Scroll-reveal start states stay scoped to `.js`, so the page renders fully visible if JavaScript fails.
- Every external link keeps `target="_blank"` and `rel="noopener noreferrer"`. In-page `#` anchors and `mailto:` are excluded.
- No new dependencies, no framework, no build step.
- The shell breakpoint is **79.5rem** = `--container` (62rem) + `--sidebar-w` (17.5rem). The hero's own two-column threshold is **53rem**. These are the only two `min-width` rem breakpoints allowed in `03-layout.css`.

---

## File Structure

| File | Responsibility after this plan |
|---|---|
| `index.html` | `viewport-fit=cover`, the bottom nav, footer socials. Hamburger and drawer-close buttons removed. |
| `assets/css/01-tokens.css` | Adds `--tap-min`. `--container` and `--sidebar-w` stay fixed — the shell breakpoint is derived from them. |
| `assets/css/03-layout.css` | Mobile-first shell. Bottom bar, body bottom padding, query containers, and the single `min-width: 79.5rem` desktop block. |
| `assets/css/04-components.css` | Component grids via `@container` only. No width-based `@media` may remain. |
| `assets/js/nav.js` | Scroll-spy across both navs, scroll progress, bottom-bar auto-hide. Drawer code removed. |
| `scripts/check.py` | Four new invariants. |

**Task order keeps the page working at every step.** The bottom bar is added and wired up while the drawer still exists (Tasks 1–3); only then is the drawer removed (Task 4).

---

## Task 1: Foundation — viewport-fit, tap token, first check

**Files:**
- Modify: `scripts/check.py` (insert before the `# 5.` block, around line 145)
- Modify: `index.html` (line 6)
- Modify: `assets/css/01-tokens.css` (layout group, around line 132)

**Interfaces:**
- Consumes: nothing.
- Produces: token `--tap-min: 2.75rem`, used by Tasks 2, 5 and 7.

- [ ] **Step 1: Write the failing check**

In `scripts/check.py`, FIND this exact line:

```python
# 5. the pre-paint boot script must be inline in <head>
```

INSERT the following immediately **above** it (leave a blank line between the new block and the `# 5.` line):

```python
# 6. env(safe-area-inset-*) silently resolves to 0 without viewport-fit=cover.
vp = re.search(r'<meta name="viewport" content="([^"]+)"', html)
if not vp:
    fails.append('no viewport meta tag')
elif 'viewport-fit=cover' not in vp.group(1):
    fails.append('viewport meta lacks viewport-fit=cover; the bottom bar would '
                 'sit under the iPhone home indicator')
```

- [ ] **Step 2: Run it and confirm it FAILS**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected output contains: `FAIL viewport meta lacks viewport-fit=cover`
Expected exit code: 1

This failure is correct. Continue.

- [ ] **Step 3: Add viewport-fit to the meta tag**

In `index.html`, FIND:

```html
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
```

REPLACE with:

```html
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
```

- [ ] **Step 4: Run it and confirm it PASSES**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: `OK all checks passed`, exit 0

- [ ] **Step 5: Add the tap-target token**

In `assets/css/01-tokens.css`, FIND:

```css
  --sidebar-w: 17.5rem;
  --container: 62rem;
```

REPLACE with:

```css
  --sidebar-w: 17.5rem;
  --container: 62rem;

  /* minimum hit area for controls (WCAG 2.5.5, Apple HIG) */
  --tap-min: 2.75rem;
```

- [ ] **Step 6: Verify**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: `OK all checks passed`, exit 0

---

## Task 2: Bottom nav markup and styling

Purely additive. The drawer still works after this task; the bar simply appears at all widths. Task 4 hides it on desktop. **Do not add that rule here.**

**Files:**
- Modify: `index.html` (between `</footer>` and the `</div>` closing `#page-wraper`, around line 730)
- Modify: `assets/css/03-layout.css` (append at end of file)

**Interfaces:**
- Consumes: `--tap-min` from Task 1.
- Produces: `nav.bottom-nav` containing `ul.bottom-nav__list` and five `a[href^="#"]`. Class `.is-hidden` is styled here and toggled by Task 3.

- [ ] **Step 1: Add the markup**

In `index.html`, FIND:

```html
    </footer>
  </div>
```

REPLACE with:

```html
    </footer>

    <nav class="bottom-nav" aria-label="Sections">
      <ul class="bottom-nav__list">
        <li>
          <a href="#about">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" /></svg>
            <span>About</span>
          </a>
        </li>
        <li>
          <a href="#superpowers">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
            <span>Skills</span>
          </a>
        </li>
        <li>
          <a href="#career">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></svg>
            <span>Career</span>
          </a>
        </li>
        <li>
          <a href="#projects">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>
            <span>Work</span>
          </a>
        </li>
        <li>
          <a href="#contact">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z" /></svg>
            <span>Say Hi</span>
          </a>
        </li>
      </ul>
    </nav>
  </div>
```

- [ ] **Step 2: Verify the markup is balanced**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: `OK all checks passed`, exit 0

If you see `unbalanced <li>` or `unbalanced <a>`, a tag was mistyped. Fix it before continuing.

- [ ] **Step 3: Style the bar**

APPEND to the very end of `assets/css/03-layout.css`:

```css
/* ── bottom nav ────────────────────────────────────────────────────────── */

/* translateX is part of the centring, so .is-hidden has to repeat it */
.bottom-nav {
  position: fixed;
  z-index: 60;
  left: 50%;
  bottom: calc(var(--space-xs) + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  width: calc(100% - var(--space-m));
  max-width: 26rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-2);
  transition:
    transform var(--dur-base) var(--ease-out),
    opacity var(--dur-base) var(--ease-out),
    background var(--dur-base) var(--ease-inout),
    border-color var(--dur-base) var(--ease-inout);
}

.bottom-nav.is-hidden {
  transform: translateX(-50%) translateY(calc(100% + var(--space-l)));
  opacity: 0;
}

.bottom-nav__list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  padding: var(--space-3xs);
  margin: 0;
}

.bottom-nav a {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 2px;
  min-height: var(--tap-min);
  padding: var(--space-3xs) 2px;
  border-radius: var(--radius-pill);
  color: var(--text-muted);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  line-height: 1.2;
  transition:
    color var(--dur-fast) var(--ease-out),
    background var(--dur-fast) var(--ease-out);
}

.bottom-nav svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.bottom-nav a:hover { color: var(--text); }

.bottom-nav a.is-current {
  color: var(--accent-ink);
  background: var(--canvas);
}

/* clear the bar so the footer is never covered */
body {
  padding-block-end: calc(4.5rem + env(safe-area-inset-bottom, 0px));
}
```

- [ ] **Step 4: Verify**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: `OK all checks passed`, exit 0

---

## Task 3: Wire the bottom bar into nav.js

**Files:**
- Modify: `assets/js/nav.js` (line 35, and a new function before `export function initNav`)

**Interfaces:**
- Consumes: `.bottom-nav` and `.is-hidden` from Task 2.
- Produces: `initBottomBar()`, called from `initNav()`. `initNav` remains the module's only export.

- [ ] **Step 1: Broaden the scroll-spy selector**

In `assets/js/nav.js`, FIND:

```js
  const links = [...document.querySelectorAll('.main-menu a[href^="#"]')];
```

REPLACE with:

```js
  const links = [...document.querySelectorAll(
    '.main-menu a[href^="#"], .bottom-nav a[href^="#"]')];
```

One observer drives both navs. Only one nav is ever displayed, so both can carry `is-current` safely.

- [ ] **Step 2: Add the auto-hide function**

In `assets/js/nav.js`, FIND:

```js
export function initNav() {
  initMenu();
  initScrollSpy();
  initProgress();
}
```

REPLACE with:

```js
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
  initMenu();
  initScrollSpy();
  initProgress();
  initBottomBar();
}
```

`initMenu()` still exists at this point. Task 4 removes it.

- [ ] **Step 3: Verify**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: `OK all checks passed`, exit 0

---

## Task 4: Move the shell breakpoint and remove the drawer

The behavioural heart of the plan and the largest task. **The page will look wrong between steps — that is expected. Complete all steps before judging anything.**

`03-layout.css` contains **two separate** `@media (max-width: 845px)` blocks. Both are removed here. Do not stop after the first.

**Files:**
- Modify: `scripts/check.py` (after the `# 6.` block from Task 1)
- Modify: `assets/css/03-layout.css` (five separate edits)
- Modify: `index.html` (two deletions)
- Modify: `assets/js/nav.js` (two deletions)

**Interfaces:**
- Consumes: `.bottom-nav` from Task 2.
- Produces: a single `@media (min-width: 79.5rem)` block, plus a `@media (min-width: 53rem)` hero block. Check 7 asserts both.

- [ ] **Step 1: Write the failing check**

In `scripts/check.py`, FIND:

```python
# 5. the pre-paint boot script must be inline in <head>
```

INSERT the following immediately **above** it (so it sits after the `# 6.` block added in Task 1):

```python
# 7. the shell breakpoint must equal --container + --sidebar-w. Media queries
# can't read custom properties, so keep the duplicated literal honest.
tokens_css = open(os.path.join(CSS, '01-tokens.css'), encoding='utf-8').read()
layout_css = open(os.path.join(CSS, '03-layout.css'), encoding='utf-8').read()

def _rem(name):
    m = re.search(r'--%s:\s*([\d.]+)rem' % name, tokens_css)
    return float(m.group(1)) if m else None

_container, _sidebar = _rem('container'), _rem('sidebar-w')
if _container is None or _sidebar is None:
    fails.append('--container or --sidebar-w missing or not in rem')
else:
    want = _container + _sidebar
    HERO = 53.0  # the hero's own two-column threshold
    found = [float(v) for v in
             re.findall(r'@media\s*\(min-width:\s*([\d.]+)rem\s*\)', layout_css)]
    if not any(abs(v - want) < 1e-6 for v in found):
        fails.append('no shell breakpoint at %grem in 03-layout.css '
                     '(--container + --sidebar-w)' % want)
    for v in found:
        if abs(v - want) > 1e-6 and abs(v - HERO) > 1e-6:
            fails.append('unexpected rem breakpoint %grem in 03-layout.css; '
                         'only %grem and %grem are allowed' % (v, want, HERO))

for v in re.findall(r'@media\s*\((?:min|max)-width:\s*(\d+)px\s*\)', layout_css):
    fails.append('px-based breakpoint %spx in 03-layout.css; use the derived '
                 'rem value' % v)
```

- [ ] **Step 2: Run it and confirm it FAILS**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected output contains all of:
- `FAIL no shell breakpoint at 79.5rem in 03-layout.css`
- `FAIL px-based breakpoint 846px in 03-layout.css`
- `FAIL px-based breakpoint 845px in 03-layout.css` (twice — there are two such blocks)

Expected exit code: 1. These failures are correct. Continue.

- [ ] **Step 3: Replace the desktop and first mobile block**

In `assets/css/03-layout.css`, FIND this entire region (it starts after the closing brace of `.menu-toggle svg, .menu-close svg` and ends with the closing brace of the mobile block):

```css
/* ── desktop ───────────────────────────────────────────────────────────── */

@media (min-width: 846px) {
  #page-wraper { padding-inline-start: var(--sidebar-w); }
}

/* ── mobile ────────────────────────────────────────────────────────────── */

@media (max-width: 845px) {
  .sidebar {
    width: min(20rem, 85vw);
    transform: translateX(-102%);
    box-shadow: var(--shadow-2);
    /* Hidden only after it has finished sliding out, so the animation still
       plays but the closed sidebar never sits in the captured area. */
    visibility: hidden;
    transition:
      background var(--dur-base) var(--ease-inout),
      border-color var(--dur-base) var(--ease-inout),
      transform var(--dur-base) var(--ease-out),
      visibility 0s linear var(--dur-base);
  }

  .sidebar.is-open {
    transform: none;
    visibility: visible;
    transition-delay: 0s;
  }

  .menu-toggle {
    display: grid;
    position: fixed;
    top: var(--space-s);
    left: var(--space-s);
    z-index: 55;
  }

  .menu-close {
    display: grid;
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
  }

  .section { padding-block: var(--space-2xl); }
}
```

**DELETE the whole region.** Replace it with nothing — the desktop block is
added at the very end of the file in Step 8, not here.

**Why the end of the file matters:** media queries add no specificity. Task 2
appended `body { padding-block-end: ... }` at the end of this file, and the
desktop block resets that same property. If the desktop block sat here, at line
~196, the later base rule would win *even on desktop* and the footer would keep
a 4.5rem gap with no bar under it. The desktop block must come last.

- [ ] **Step 4: Delete the two menu-button rules**

In `assets/css/03-layout.css`, FIND and DELETE this entire region:

```css
/* ── menu buttons (mobile only) ────────────────────────────────────────── */

.menu-toggle,
.menu-close {
  display: none;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-1);
  color: var(--text);
  cursor: pointer;
}

.menu-toggle svg,
.menu-close svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}
```

- [ ] **Step 5: Make the sidebar hidden by default and the section padding mobile-first**

In `assets/css/03-layout.css`, FIND:

```css
.sidebar {
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;
  z-index: 50;

  display: flex;
```

REPLACE with:

```css
.sidebar {
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;
  z-index: 50;

  /* display:none, not translated off-screen: it must stay out of the
     view-transition capture the theme wipe depends on */
  display: none;
```

Then FIND:

```css
.section {
  max-width: var(--container);
  margin-inline: auto;
  padding-block: var(--space-3xl);
  padding-inline: var(--space-m);
  scroll-margin-top: var(--space-l);
}
```

REPLACE with:

```css
.section {
  max-width: var(--container);
  margin-inline: auto;
  padding-block: var(--space-2xl);
  padding-inline: var(--space-m);
  scroll-margin-top: var(--space-l);
}
```

- [ ] **Step 6: Make the hero mobile-first**

In `assets/css/03-layout.css`, FIND:

```css
  overflow: hidden;
  overflow: clip;
  display: grid;
  align-content: center;
  min-height: min(100svh, 54rem);
  padding-block: var(--space-3xl) var(--space-2xl);
}
```

REPLACE with:

```css
  overflow: hidden;
  overflow: clip;
  display: grid;
  align-content: center;
  min-height: auto;
  padding-block: var(--space-2xl);
}
```

Then FIND:

```css
.hero__inner {
  width: 100%;
  max-width: var(--container);
  margin-inline: auto;
  padding-inline: var(--space-m);
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  align-items: center;
  gap: var(--space-2xl);
}
```

REPLACE with:

```css
.hero__inner {
  width: 100%;
  max-width: var(--container);
  margin-inline: auto;
  padding-inline: var(--space-m);
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: var(--space-l);
}
```

- [ ] **Step 7: Replace the second mobile block with the hero's two-column form**

In `assets/css/03-layout.css`, FIND this block (it is at the very end of the hero section, after the `@keyframes nudge` rule):

```css
@media (max-width: 845px) {
  .hero { min-height: auto; padding-block: var(--space-2xl); }
  .hero__inner { grid-template-columns: 1fr; gap: var(--space-l); }
  .hero__portrait { order: -1; max-width: 12rem; }
  .stats { gap: var(--space-m) var(--space-l); }
}
```

REPLACE with:

```css
/* stacked by default; portrait sits above the text */
.hero__portrait {
  order: -1;
  max-width: clamp(11rem, 50cqi, 16rem);
  margin-inline: auto;
}

/* 53rem = 420px text + 300px portrait + 72px gap, plus the section padding */
@media (min-width: 53rem) {
  .hero {
    min-height: min(100svh, 54rem);
    padding-block: var(--space-3xl) var(--space-2xl);
  }

  .hero__inner {
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    gap: var(--space-2xl);
  }

  .hero__portrait {
    order: 0;
    max-width: 100%;
    margin-inline: 0;
  }
}
```

The `.stats` line from the old block was a no-op — it repeated the base `gap` exactly — so it is not carried over. `cqi` resolves against `.hero__inner`, which Task 6 makes a container; until then it falls back to viewport units, which is harmless.

- [ ] **Step 8: Add the desktop block at the very end of the file**

APPEND to the very end of `assets/css/03-layout.css`, after the `.bottom-nav` rules added in Task 2. It must be the last thing in the file — see the note in Step 3.

```css
/* ── desktop shell ─────────────────────────────────────────────────────────
   79.5rem = --container (62rem) + --sidebar-w (17.5rem). Below it the column
   would get narrower as the screen grows. check.py asserts this.
   Last in the file on purpose: it overrides base rules that set the same
   properties, and media queries carry no extra specificity. */

@media (min-width: 79.5rem) {
  #page-wraper { padding-inline-start: var(--sidebar-w); }
  .sidebar { display: flex; }
  .bottom-nav { display: none; }
  body { padding-block-end: 0; }
  .section { padding-block: var(--space-3xl); }
}
```

- [ ] **Step 9: Run the check — it should now PASS**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: `OK all checks passed`, exit 0

If you still see `px-based breakpoint 845px`, one of the two mobile blocks was missed. Find it and remove it as described in Step 3 or Step 7.

- [ ] **Step 10: Remove the drawer close button from the markup**

In `index.html`, FIND and DELETE (including the blank line after it):

```html
      <button id="menu-close" class="menu-close" type="button">
        <span class="visually-hidden">Close menu</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

```

- [ ] **Step 11: Remove the hamburger from the markup**

In `index.html`, FIND:

```html
    </header>

    <button id="menu-toggle" class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu">
      <span class="visually-hidden">Open menu</span>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
    </button>
```

REPLACE with:

```html
    </header>
```

- [ ] **Step 12: Verify the markup**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: `OK all checks passed`, exit 0

If you see `unbalanced <button>`, part of a button was left behind. Fix it before continuing.

- [ ] **Step 13: Remove the drawer logic from nav.js**

In `assets/js/nav.js`, FIND and DELETE this entire region (the constant, the function, and the blank line after it):

```js
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

```

- [ ] **Step 14: Stop calling it**

In `assets/js/nav.js`, FIND:

```js
export function initNav() {
  initMenu();
  initScrollSpy();
```

REPLACE with:

```js
export function initNav() {
  initScrollSpy();
```

- [ ] **Step 15: Confirm no drawer references remain**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && grep -rn "menu-toggle\|menu-close\|initMenu\|is-open\|MOBILE" index.html assets/css assets/js; echo "exit=$?"
```

Expected: no output, `exit=1` (grep found nothing). If anything is listed, delete it.

- [ ] **Step 16: Verify**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: `OK all checks passed`, exit 0

---

## Task 5: Footer socials

Without this, every width below 79.5rem loses the GitHub, LinkedIn, email and résumé links — the sidebar that held them no longer renders. This is a regression fix, not an optional extra.

**Files:**
- Modify: `index.html` (inside `<footer class="footer">`)
- Modify: `assets/css/04-components.css` (append at end)
- Modify: `assets/css/03-layout.css` (one line inside the 79.5rem block)

**Interfaces:**
- Consumes: `--tap-min` from Task 1; the `@media (min-width: 79.5rem)` block from Task 4.
- Produces: `ul.footer__social`.

- [ ] **Step 1: Add the markup**

In `index.html`, FIND:

```html
        <a href="https://github.com/kishanraj427/kishanraj427.github.io" target="_blank" rel="noopener noreferrer">Source on GitHub</a>.
      </p>
    </footer>
```

REPLACE with:

```html
        <a href="https://github.com/kishanraj427/kishanraj427.github.io" target="_blank" rel="noopener noreferrer">Source on GitHub</a>.
      </p>

      <ul class="footer__social">
        <li>
          <a href="https://www.linkedin.com/in/raj-kishan-prasad-7893ab1aa" target="_blank" rel="noopener noreferrer">
            <span class="visually-hidden">LinkedIn</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05a4.2 4.2 0 0 1 3.75-2c4 0 4.75 2.6 4.75 6V21h-4v-5.6c0-1.35-.03-3.1-1.9-3.1s-2.2 1.48-2.2 3v5.7h-4z" /></svg>
          </a>
        </li>
        <li>
          <a href="https://github.com/kishanraj427" target="_blank" rel="noopener noreferrer">
            <span class="visually-hidden">GitHub</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.26.8-.57v-2c-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.21.68.81.57A12 12 0 0 0 12 .5z" /></svg>
          </a>
        </li>
        <li>
          <a href="mailto:kishanraj427@gmail.com">
            <span class="visually-hidden">Email</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.5 2L12 12.5 19.5 7z" /></svg>
          </a>
        </li>
        <li>
          <a href="https://drive.google.com/file/d/1KK_xdIuRj-cizsDoA7vNn5IfmEqzczhz/view" target="_blank" rel="noopener noreferrer">
            <span class="visually-hidden">R&eacute;sum&eacute;</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 2h7l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm7 1.5V8h4.5zM8 12h8v1.5H8zm0 3.5h8V17H8z" /></svg>
          </a>
        </li>
      </ul>
    </footer>
```

- [ ] **Step 2: Verify the links**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: `OK all checks passed`, exit 0

Check 3 verifies the three new `https:` links carry `target` and `rel`. The `mailto:` is correctly exempt.

- [ ] **Step 3: Style it**

APPEND to the very end of `assets/css/04-components.css`:

```css
/* ── footer socials (below the desktop breakpoint only) ────────────────── */

.footer__social {
  display: flex;
  gap: var(--space-2xs);
  margin-block-start: var(--space-s);
  padding: 0;
}

.footer__social a {
  display: grid;
  place-items: center;
  width: var(--tap-min);
  height: var(--tap-min);
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  color: var(--text-muted);
  transition:
    color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out);
}

.footer__social svg {
  width: 1.05rem;
  height: 1.05rem;
  fill: currentColor;
}

.footer__social a:hover {
  color: var(--accent-ink);
  border-color: var(--accent);
}
```

- [ ] **Step 4: Hide it on desktop**

In `assets/css/03-layout.css`, FIND:

```css
@media (min-width: 79.5rem) {
  #page-wraper { padding-inline-start: var(--sidebar-w); }
  .sidebar { display: flex; }
  .bottom-nav { display: none; }
  body { padding-block-end: 0; }
  .section { padding-block: var(--space-3xl); }
}
```

REPLACE with:

```css
@media (min-width: 79.5rem) {
  #page-wraper { padding-inline-start: var(--sidebar-w); }
  .sidebar { display: flex; }
  .bottom-nav { display: none; }
  .footer__social { display: none; }
  body { padding-block-end: 0; }
  .section { padding-block: var(--space-3xl); }
}
```

- [ ] **Step 5: Verify**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: `OK all checks passed`, exit 0

---

## Task 6: Container queries for every grid

**Files:**
- Modify: `scripts/check.py` (after the `# 7.` block)
- Modify: `assets/css/03-layout.css` (two `container-type` declarations)
- Modify: `assets/css/04-components.css` (four grids, six edits)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `.section` and `.hero__inner` as query containers.

**Note:** `04-components.css` contains **two** `@media (max-width: 620px)` blocks — one for `.tiles`, one for `.form__row`. They are handled in different steps. Match the surrounding text, not just the media line.

- [ ] **Step 1: Write the failing checks**

In `scripts/check.py`, FIND:

```python
# 5. the pre-paint boot script must be inline in <head>
```

INSERT the following immediately **above** it:

```python
# 8. components must query their container, not the window
comp_css = open(os.path.join(CSS, '04-components.css'), encoding='utf-8').read()
comp_css = re.sub(r'/\*.*?\*/', '', comp_css, flags=re.S)
for m in re.findall(r'@media[^{]*(?:min|max)-width[^{]*', comp_css):
    fails.append('width-based @media in 04-components.css: %s' % ' '.join(m.split()))

# 9. a @container query with no container-type matches nothing
_all_css = ''.join(
    open(os.path.join(CSS, f), encoding='utf-8').read()
    for f in sorted(os.listdir(CSS)) if f.endswith('.css'))
if '@container' in _all_css and not re.search(r'container-type\s*:', _all_css):
    fails.append('@container queries exist but no container-type is declared')
```

- [ ] **Step 2: Run it and confirm it FAILS**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: four `FAIL width-based @media in 04-components.css` lines, naming `max-width: 520px`, `1100px`, `620px`, `720px` and `620px`. Exit code 1. These failures are correct.

- [ ] **Step 3: Declare the containers**

In `assets/css/03-layout.css`, FIND:

```css
.section {
  max-width: var(--container);
  margin-inline: auto;
  padding-block: var(--space-2xl);
  padding-inline: var(--space-m);
  scroll-margin-top: var(--space-l);
}
```

REPLACE with:

```css
.section {
  max-width: var(--container);
  margin-inline: auto;
  padding-block: var(--space-2xl);
  padding-inline: var(--space-m);
  scroll-margin-top: var(--space-l);
  container-type: inline-size;
}
```

Then FIND:

```css
.hero__inner {
  width: 100%;
  max-width: var(--container);
  margin-inline: auto;
  padding-inline: var(--space-m);
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: var(--space-l);
}
```

REPLACE with:

```css
.hero__inner {
  width: 100%;
  max-width: var(--container);
  margin-inline: auto;
  padding-inline: var(--space-m);
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: var(--space-l);
  container-type: inline-size;
}
```

`.hero` itself must NOT become a container — `.hero__sky` bleeds the full column width. Do not add `container-type` to it.

- [ ] **Step 4: Convert the stats grid**

In `assets/css/04-components.css`, FIND:

```css
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-m) var(--space-l);
  padding: 0;
  margin-block: var(--space-m);
  max-width: 34rem;
}

@media (max-width: 520px) {
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

REPLACE with:

```css
/* n x 100px min stat + (n-1) x 32px gap */
.stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-m) var(--space-l);
  padding: 0;
  margin-block: var(--space-m);
  max-width: 34rem;
}

@container (min-width: 232px) { .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@container (min-width: 496px) { .stats { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
```

- [ ] **Step 5: Convert the tiles grid**

In `assets/css/04-components.css`, FIND:

```css
.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-s);
  padding: 0;
}

@media (max-width: 1100px) {
  .tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 620px) {
  .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

REPLACE with:

```css
/* n x 128px min tile + (n-1) x 16px gap */
.tiles {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-s);
  padding: 0;
}

@container (min-width: 272px) { .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@container (min-width: 416px) { .tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@container (min-width: 560px) { .tiles { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
```

- [ ] **Step 6: Convert the projects grid**

In `assets/css/04-components.css`, FIND:

```css
.projects {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-m);
  padding: 0;
}
```

REPLACE with:

```css
/* 2 x 300px min card + 24px gap */
.projects {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-m);
  padding: 0;
}

@container (min-width: 624px) { .projects { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
```

Then FIND and DELETE:

```css
@media (max-width: 720px) {
  .projects { grid-template-columns: 1fr; }
}
```

- [ ] **Step 7: Convert the form row**

In `assets/css/04-components.css`, FIND:

```css
.form__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-m);
}
```

REPLACE with:

```css
/* 2 x 240px min field + 24px gap */
.form__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-m);
}

@container (min-width: 504px) { .form__row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
```

Then FIND and DELETE:

```css
@media (max-width: 620px) {
  .form__row { grid-template-columns: 1fr; }
}
```

- [ ] **Step 8: Verify**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: `OK all checks passed`, exit 0

If any `width-based @media in 04-components.css` remains, one of the four grids was missed.

---

## Task 7: The tap-target floor

Applies to controls only. **Do not apply it to the timeline's employer links or any other inline prose link** — forcing 44px on a text run inside a paragraph adds 18px of dead space per link and wrecks the vertical rhythm. Those links measure 26px, which meets WCAG 2.5.8 AA.

**Files:**
- Modify: `assets/css/03-layout.css` (two rules)
- Modify: `assets/css/04-components.css` (one rule)

**Interfaces:**
- Consumes: `--tap-min` from Task 1.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Raise the sidebar socials**

In `assets/css/03-layout.css`, FIND:

```css
.sidebar__social a {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
```

REPLACE with:

```css
.sidebar__social a {
  display: grid;
  place-items: center;
  width: var(--tap-min);
  height: var(--tap-min);
```

- [ ] **Step 2: Give the scroll cue a real hit area**

In `assets/css/03-layout.css`, FIND:

```css
.hero__scroll {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  margin-block-start: var(--space-xl);
```

REPLACE with:

```css
.hero__scroll {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap-min);
  padding-inline: var(--space-2xs);
  gap: var(--space-3xs);
  margin-block-start: var(--space-xl);
```

- [ ] **Step 3: Raise the filter chips**

In `assets/css/04-components.css`, FIND:

```css
.chip {
  padding: var(--space-3xs) var(--space-s);
```

REPLACE with:

```css
.chip {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap-min);
  padding: var(--space-3xs) var(--space-s);
```

- [ ] **Step 4: Verify**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py
```

Expected: `OK all checks passed`, exit 0

---

## Task 8: Final sweep

**Files:**
- Modify: `docs/superpowers/specs/2026-08-28-portfolio-redesign-design.md`

- [ ] **Step 1: Confirm no dead selectors remain**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && grep -rn "menu-toggle\|menu-close\|initMenu\|is-open\|visibility: hidden" index.html assets/css assets/js; echo "exit=$?"
```

Expected: no output, `exit=1`. Anything listed is a leftover — delete it.

- [ ] **Step 2: Confirm the breakpoints are exactly the two allowed ones**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && grep -rn "@media\|@container" assets/css/ | grep -v "prefers-reduced-motion\|prefers-color-scheme"
```

Expected: exactly two `@media` width lines in `03-layout.css` (`min-width: 79.5rem` and `min-width: 53rem`), and eight `@container` lines in `04-components.css`. No width `@media` in any other file.

- [ ] **Step 3: Note the supersession in the old spec**

In `docs/superpowers/specs/2026-08-28-portfolio-redesign-design.md`, FIND:

```markdown
### Sidebar and navigation
```

REPLACE with:

```markdown
### Sidebar and navigation

> **Superseded 2026-09-20** by `2026-09-20-responsive-architecture-design.md`:
> the mobile drawer is replaced by a bottom floating nav bar, and the shell
> breakpoint moves from 846px to a derived 79.5rem.
```

- [ ] **Step 4: Full verification**

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 scripts/check.py && echo "--- css bytes ---" && cat assets/css/*.css | wc -c && echo "--- js bytes ---" && cat assets/js/*.js | wc -c
```

Expected: `OK all checks passed`, exit 0.

- [ ] **Step 5: Hand off for visual review**

Report to the user that implementation is complete, state that nothing was committed, and give them:

```bash
cd "/Users/rajkishan/Desktop/Personal work/kishanraj427.github.io" && python3 -m http.server 8000
```

Things worth checking by hand:
- drag the window slowly across 1272px — the content column must never get narrower as the window gets wider
- bottom bar: auto-hide restores on scroll up, active item tracks the scroll-spy, footer is never covered
- keyboard-only pass at 320px and at 1280px
- theme wipe still starts at the toggle button in both shell states
- reduced motion on: the bar must not auto-hide, and all content must still be visible

---

## Notes for the executor

- **Never run git.** Not once, not at the end, not "just to check". `git status` is the only exception and you do not need it.
- `scripts/check.py` is the test harness. Every red/green cycle runs through it.
- Task 4 is the only task that leaves the page visibly broken mid-task. Finish all 16 steps before judging anything.
- If a container query appears to match nothing, its ancestor is missing `container-type`. An element can never query itself.
- Every number in this plan is derived, not chosen. If one must change, change the minimum column width it came from and recompute `n × min + (n−1) × gap`.
- Two files contain repeated media queries that look identical: `03-layout.css` has two `@media (max-width: 845px)` blocks, and `04-components.css` has two `@media (max-width: 620px)` blocks. Always match the surrounding text, never the media line alone.
