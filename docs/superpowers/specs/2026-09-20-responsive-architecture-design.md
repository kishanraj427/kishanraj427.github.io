# Responsive Architecture — container-driven layout, bottom-bar nav

**Date:** 2026-09-20
**Repo:** `kishanraj427.github.io`
**Status:** Approved design, pending implementation plan
**Supersedes:** the breakpoint and mobile-nav decisions in
`2026-08-28-portfolio-redesign-design.md` §6

---

## 1. Purpose

Make the layout hold at any screen width, rather than at the handful of widths
it was built against, and replace the off-canvas drawer with a bottom floating
navigation bar on small and medium screens.

### Success criteria

1. The content column never gets narrower as the screen gets wider.
2. Every grid responds to the space it actually occupies, not to the window.
3. Column counts derive from measured minimum widths, not from device names.
4. A screen size nobody tested still lays out sensibly.
5. Navigation on a phone is one tap, always visible — never behind a hamburger.
6. No visual redesign of the desktop layout — layout mechanics only.

### Non-goals

- No change to colour, type scale, motion, copy or section order.
- No per-device breakpoints, no device-name media queries.
- No new sections or dependencies. No build step.

---

## 2. Measured baseline

Measured 2026-09-20 with headless Chrome over CDP, 14 viewports from 320px to
1440px. The harness was throwaway; these numbers are the record.

**Already fine.** Zero horizontal overflow at every width. No collision between
the fixed toggles and content. The hero washes that extend past the viewport
are clipped by `.hero__sky { overflow: hidden }` and are not a defect.

**The defect.** Content column against viewport, as built:

| viewport | content column | sidebar |
|---|---|---|
| 845px | 797px | drawer |
| 846px | **518px** | 280px fixed |
| 1024px | 696px | 280px fixed |
| 1194px | 866px | 280px fixed |
| 1280px | 944px | 280px fixed |

Crossing 846px the column loses 279px **as the screen grows**, and does not
recover until roughly 1150px. Every tablet in landscape and every small laptop
sits in that trough.

**Root cause.** The sidebar takes 280px, but every component breakpoint is
keyed to viewport width. Below 846px viewport ≈ content, so the queries are
accidentally right; above it they are wrong by exactly the sidebar's width. At
846px the tile grid still asks for 3 columns and gets 518px to put them in.

One systemic fault, not a list of per-device bugs: **the queries measure the
window; the components live in `window − sidebar`.**

**Secondary findings.**

- 30 interactive targets under 44px at 320px. Timeline employer links 26px
  tall, filter chips 32px, hero scroll cue 22px. Chips pass WCAG 2.5.8 AA
  (24px) but fail WCAG 2.5.5 and Apple HIG.
- Hero is 1202px tall on a 320×568 phone — 2.1 screens before About.
- The hero portrait is pinned at 192px from 320px to 845px, then steps
  192 → 266 → 338 → 371.
- Document height 11145px at 320px against 7990px on desktop.
- `nav.js` has no focus trap, no background `inert`, no scroll-lock and no
  backdrop. The 2026-08-28 spec §6 claims a focus trap exists; it never did.
  §4 removes the drawer, which retires this defect rather than fixing it.

---

## 3. Decision 1 — two shell states, switching at 79.5rem

| range | navigation | identity | socials |
|---|---|---|---|
| < 79.5rem (1272px) | bottom floating bar | hero | footer |
| ≥ 79.5rem | fixed sidebar, unchanged | sidebar | sidebar |

**The breakpoint is derived, not chosen.** For the column never to shrink, the
sidebar may only appear once the remaining space still fits the container:

```
viewport − --sidebar-w  ≥  --container
viewport − 17.5rem      ≥  62rem
viewport                ≥  79.5rem  =  1272px
```

At exactly 1272px both states yield a 992px box, so the switch is invisible
rather than merely smaller.

| viewport | before | after |
|---|---|---|
| 768px | 720px | 720px |
| 846px | **518px** | 798px |
| 1024px | 696px | 944px |
| 1194px | 866px | 944px |
| 1280px | 944px | 944px |

Monotonic throughout, capped at 944px from 992px upward.

**Tablets get the bottom bar too.** A centred floating pill reads fine at
1024px and keeps the architecture at two states instead of three. The
alternative — sidebar on tablet — is exactly the 279px cliff this spec exists
to remove.

**The sidebar is `display: none` below the breakpoint**, not translated
off-screen. This is a correctness gain, not just tidiness: the 2026-08-28 spec
§5 records that the theme wipe lands in the wrong place when anything sits
outside the viewport, because view-transition pseudo-elements are sized to the
captured area. The current drawer is parked at `translateX(-102%)` with
`visibility: hidden` specifically to work around that. Removing it removes the
hazard.

---

## 4. Decision 2 — the bottom bar

A floating pill, inset from the bottom and sides, holding five icon-and-label
links. Replaces the hamburger, the drawer and the close button entirely.

**Structure.** A new `<nav class="bottom-nav" aria-label="Sections">` in
`index.html`, sibling to `<main>`. Five items:

| label | target |
|---|---|
| About | `#about` |
| Skills | `#superpowers` |
| Career | `#career` |
| Work | `#projects` |
| Say Hi | `#contact` |

The sidebar's playful labels ("Raj Kishan, who dat?") do not fit a 57px cell,
so the bottom bar uses short ones. The sidebar keeps its own labels unchanged.

**Two navs, one visible.** The sidebar nav and the bottom nav are each
`display: none` outside their range, so a screen reader only ever encounters
one. Scroll-spy in `nav.js` widens its selector to drive both.

**Sizing.** At 320px: 296px available after a 12px inset each side, minus 12px
internal padding, gives **56.8px per cell** — above the 44px floor. Each cell
is at least `--tap-min` tall.

**Safe area.** The bar adds `env(safe-area-inset-bottom)` to its offset so it
clears the iPhone home indicator. This requires `viewport-fit=cover` in the
viewport meta tag, which the page does not currently have and must gain — `env()`
resolves to `0px` without it, and the bar would sit under the indicator.

**Body padding.** `<body>` gains bottom padding equal to the bar's height plus
its inset plus the safe area, so the footer is never covered.

**Auto-hide.** The bar translates out on scroll down and back on scroll up.
This is not decoration: in phone landscape (740×360 measured) a persistent bar
costs ~15% of viewport height. rAF-coalesced like the existing scroll-progress
handler, disabled under `prefers-reduced-motion`, and always restored at the
top of the page and when any control in it has focus.

**Active state** reuses the existing scroll-spy `IntersectionObserver`. No
second observer.

**Socials move to the footer** below the breakpoint. Without this, mobile
visitors lose the GitHub, LinkedIn and résumé links entirely, since the sidebar
that holds them is gone — a regression, not a trim. The sidebar keeps its own
copy for the desktop state.

**The theme toggle stays fixed top-right** in both states. The wipe is seeded
from its centre, and the top-left corner is now free anyway.

---

## 5. Decision 3 — components query their container

Every `.section` becomes a query container (`container-type: inline-size`), as
does `.hero__inner` (the hero is not a `.section`). All component grids move
from `@media` to `@container`.

A grid then behaves identically whether it is 500px wide because the phone is
small or because something else took the space. This is what makes the layout
screen-agnostic rather than device-specific, and it structurally prevents §2's
bug class from returning.

**Support.** Chrome 105 / Safari 16 / Firefox 110, all 2022–23. The site
already ships View Transitions, which is newer, so this costs no reach.

**Containment note.** `inline-size` containment applies on the inline axis
only; sections are already `max-width`-constrained and height-auto, so nothing
about their sizing changes. `.hero` itself is deliberately *not* a container —
`.hero__sky` must keep bleeding the full width of the column.

---

## 6. Decision 4 — thresholds are arithmetic

Each grid declares a minimum comfortable column width. Thresholds are then
`n × min + (n−1) × gap`, measured against the container's content box.

| grid | min column | gap | thresholds |
|---|---|---|---|
| `.tiles` | 128px | 16px (`--space-s`) | 2col ≥ 272 · 3col ≥ 416 · 4col ≥ 560 |
| `.projects` | 300px | 24px (`--space-m`) | 2col ≥ 624 |
| `.stats` | 100px | 32px (`--space-l`) | 2col ≥ 232 · 4col ≥ 496 |
| `.form__row` | 240px | 24px (`--space-m`) | 2col ≥ 504 |
| `.hero__inner` | 420 text + 300 portrait | 72px (`--space-2xl`) | 2col ≥ 800 |

Change a minimum and the thresholds recompute. No number here is a device
width.

**Where the minimums come from.** The tile minimum is measured, not chosen:
128px is what a 320px phone renders today at 2 columns, and it works. The rest
are the narrowest width at which the component's own content stays readable — a
card needs ~300px for its body copy, a form field ~240px to be worth typing in,
a stat ~100px for a two-line label.

**Two deliberate behaviour changes fall out:**

- At a 720px container (iPad mini portrait) tiles go to **4 columns** where
  they are 3 today — 168px each, above the 128px floor, and it preserves the
  intended 4 × 5 block on more screens.
- Stats hold 2 columns slightly longer, switching to 4 at a 496px container
  rather than a 520px viewport. Four across in 472px gave 94px each, below the
  measured floor.

---

## 7. Decision 5 — continuous sizing where it is stepped

The hero portrait becomes a `clamp()` expression on `cqi` so it tracks its
column smoothly. Its 192 → 266 → 338 → 371 staircase, and its 525px-wide dead
zone at 192px, both disappear. Same principle the type scale already uses.

**The sidebar width stays fixed at 17.5rem.** An earlier draft clamped it too;
that is wrong. §3 derives the shell breakpoint *from* `--sidebar-w`, so a
variable sidebar width makes the breakpoint unsatisfiable and breaks check 1.
The sidebar only renders above 1272px, where 17.5rem always fits, so there is
nothing to gain.

---

## 8. Decision 6 — a tap-target floor

New token `--tap-min: 2.75rem` (44px), applied to **controls**: filter chips,
sidebar and footer socials, bottom-bar cells, and the hero scroll cue.

**Not applied to inline prose links**, including the timeline's employer links.
An earlier draft included them; enforcing 44px on a text link inside a
paragraph adds 18px of dead space per link and wrecks the timeline's vertical
rhythm. Those links measure 26px, which meets WCAG 2.5.8 AA (24px) — they fail
only the stricter 2.5.5 AAA and Apple's HIG, both of which target discrete
controls rather than text runs. The floor is therefore scoped to things that
look and behave like buttons.

This fixes 12 of the 30 measured undersized targets; the remaining 18 are
inline prose links covered by the paragraph above.

---

## 9. Enforcement

CSS cannot express these invariants, so `scripts/check.py` gains four checks:

1. The shell breakpoint literal equals `--container + --sidebar-w`. Media
   queries cannot read custom properties, so the value must be duplicated;
   this check keeps the duplicate honest.
2. No width-based `@media` remains in `04-components.css` — components must
   query their container.
3. Every `@container` query has a matching `container-type` declaration, so a
   query cannot silently match nothing.
4. The viewport meta tag contains `viewport-fit=cover`, without which the
   bottom bar's safe-area inset silently resolves to zero.

Check 2 is scoped to the components file by design: `03-layout.css` keeps
legitimate viewport queries for the shell, which is the one thing that *should*
care about the window.

---

## 10. Files touched

```
index.html                     viewport-fit=cover; bottom nav; footer socials;
                               remove hamburger and drawer close button
assets/css/01-tokens.css       --tap-min; portrait and sidebar clamps
assets/css/03-layout.css       shell breakpoint -> 79.5rem; bottom bar;
                               sidebar display:none below it; body padding
assets/css/04-components.css   @media -> @container across all grids
assets/js/nav.js               drop drawer; scroll-spy drives both navs;
                               bottom-bar auto-hide
scripts/check.py               four new invariant checks
```

No change to `02-base.css` or `05-motion.css`.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Container queries unsupported on a very old browser | Floor is Safari 16 (2022); View Transitions already ships and is newer. Grids fall back to single-column, which is legible. |
| Bottom bar covers content at the page end | Body bottom padding sized from bar height + inset + safe area; verified against the footer. |
| Auto-hide hides nav when the user wants it | Restored on any upward scroll, at page top, and whenever a bar control has focus. Disabled under reduced motion. |
| A floating pill reads odd at 1024px | Centred and width-capped rather than full-bleed. Flag on visual review. |
| Tile density at 720px goes 3 → 4 columns | Deliberate, §6. Flag on visual review. |
| The 1272px literal drifts from the tokens | Check 1, §9. |

---

## 12. Verification

Static: `python3 scripts/check.py` must pass, including the four new checks.

Visual and behavioural review is the user's, per their instruction that they
will report UI gaps themselves. Worth checking by hand:

- the column never narrows as the window widens, dragged slowly across 1272px
- bottom bar: safe-area clearance on a notched phone, auto-hide restores
  correctly, active state tracks the scroll-spy, footer never covered
- keyboard-only pass at 320px and at 1280px
- reduced-motion honoured in both shell states
