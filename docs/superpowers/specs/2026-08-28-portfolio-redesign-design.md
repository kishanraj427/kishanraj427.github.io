# Portfolio Redesign — Day/Night Duality

**Date:** 2026-08-28
**Repo:** `kishanraj427.github.io`
**Branch:** `redesign/day-night`
**Status:** Approved design, pending implementation plan

---

## 1. Purpose

Rebuild the personal portfolio at `kishanraj427.github.io` into a visually
striking, interactive site that reads as credible to a technical recruiter and
as warm and legible to a non-technical one.

The current site is a 2019-era TemplateMo template: Lato, a single brick-red
accent (`#a43f49`), a 744-line stylesheet with ~18 transitions total, and
~3.7 MB of vendored jQuery, Bootstrap, Isotope, Owl Carousel and Lightbox. Its
information architecture is clear and worth keeping. Its visual language is not
— it reads as bought, which undercuts the work it describes.

### Success criteria

1. Nothing on the page reads as a template.
2. A non-technical screener understands who Raj is and what he ships within
   about five seconds of landing.
3. A technical recruiter can distinguish employment history from side projects
   without reading every card.
4. The site is faster than the one it replaces, on a mid-range phone.
5. Motion is impressive on first scroll and never impedes reading.

### Non-goals

- No CMS, no build step, no framework, no CI pipeline.
- No new written content beyond the hero pitch line and the stat strip.
- No change to the deploy model (GitHub Pages from the repo root).
- No blog, no case-study sub-pages.

---

## 2. Constraints

| Constraint | Source |
|---|---|
| Static single page, no build step | Existing GitHub Pages deploy; user choice |
| Preserve the existing information architecture | Explicit user requirement |
| Must honour `prefers-reduced-motion` | Accessibility baseline |
| Nothing pushed to the remote without explicit approval | Explicit user instruction |
| Work happens on a branch; `main` stays deployable | Agreed in design review |

The IA requirement is the important one. The user's words: *"my current
portfolio is well structured make sure your new design is also well
structured."* The rebuild changes visual language and motion. It does not
relocate content or invent new navigation concepts.

---

## 3. Information architecture

Current structure is four sections behind a fixed sidebar. The redesign keeps
that spine, adds a hero above it, and splits the overloaded work section in two.

```
Sidebar (identity + nav + socials)     [kept]
Hero                                   [new]
01 / About                             [kept, restyled]
02 / Superpowers                       [kept, restyled]
03 / Career                            [split out of old section 3]
04 / Projects                          [split out of old section 3]
05 / Say Hi                            [kept, was section 4]
```

### Why the split

The current section 3 holds 17 cards in one flat grid, mixing three kinds of
thing: jobs (Eicore, essentia.dev, Wit/Bit), an internship (Learnship),
education (VIT), and side projects (Wire, Tour 360°, JAC eLearning, PDF to
Audio, Expense Manager, JRSU, Do Not Press, Typing Test, Harber). A recruiter
scanning that grid cannot tell a salaried role from a weekend build, which
undersells the roles.

Splitting gives each half a form that suits it: employment is chronological, so
it becomes a timeline; projects are browsable, so they become a filterable grid.

---

## 4. Design tokens

All colour, type, spacing, easing and duration values live in
`01-tokens.css` as custom properties. Themes swap **values**, never rules. No
component stylesheet may hardcode a colour.

### Palette

| Role | Day 🌿 | Night 💻 |
|---|---|---|
| Canvas | warm parchment | deep blue-black |
| Surface (cards) | raised warm white | lifted slate |
| Text primary | deep ink | soft white |
| Text muted | warm grey | cool grey |
| Accent (vivid) | organic green | electric cyan |
| Accent-ink (text-safe) | deepened green | deepened cyan |
| Secondary | sun amber | moon silver |
| Border | soft sand | low-contrast slate |

**The accent is two tokens, not one.** A single accent cannot serve both roles:
the vivid green and electric cyan that make the themes feel alive are too light
against their canvases to carry body-size text at AA. `--accent` is for
decoration, glows, rules, borders and large display type; `--accent-ink` is a
darkened/adjusted variant used for any text at body size, including inline
links. Components must not use `--accent` for running text.

Exact hex values are chosen during implementation and **both** accents are
verified at 4.5:1 for body text and 3:1 for large text and UI borders, in both
themes. The legacy `#a43f49` is retired.

### Typography

| Face | Role |
|---|---|
| Lato (400/700/900) | headings, hero name, body copy — the whole page |
| JetBrains Mono (400) | section numbers, dates, tech tags — metadata only |

**Lato is retained from the original site.** The first implementation attempt
used Fraunces as a display serif; the user rejected it as unprofessional for a
recruiter-facing page, which is the correct call — a stylised serif signals
"designed" where this page needs to signal "credible". Lato carries both
display and body.

Distinctiveness therefore comes from colour, motion, layout and the day/night
concept rather than from an unusual typeface. JetBrains Mono is retained for
metadata only — dates, section numbers and tech tags — where a monospace face
reads as engineering convention rather than decoration.

Headings use Lato 900 with slightly tightened tracking so display type still
has presence without a second family. Measured payload 88.2 KB, within the
120 KB budget.

### Scale

Fluid type via `clamp()`. Spacing on a consistent step scale. One shadow ramp,
one radius scale — all tokenised.

### Motion scale

Seven different effects sharing no timing vocabulary would read as seven
different websites. The whole system draws from three durations and two
easings, and every effect declares which pair it uses:

| Token | Value | Used by |
|---|---|---|
| `--dur-fast` | ~160ms | tile hover, chip press, focus rings |
| `--dur-base` | ~320ms | scroll reveals, filter FLIP, tilt settle |
| `--dur-slow` | ~620ms | theme wipe, timeline draw, count-up |
| `--ease-out` | `cubic-bezier(.22,.61,.36,1)` | anything entering or responding to input |
| `--ease-inout` | `cubic-bezier(.65,0,.35,1)` | anything moving between two positions |

Stagger is **60ms per item, capped at 8 items** (480ms total). Without the cap
the 20-tile Superpowers grid would take over a second to finish arriving, which
reads as slow rather than considered.

---

## 5. The theme transition

This is the site's signature interaction and the main thing a visitor is
expected to remember. It must feel *cute and smooth*, per the user's words —
not an instant class swap.

### Behaviour

1. The control is a sun that **morphs into a crescent moon** — an SVG whose
   mask offset animates, so the sun is eaten into a crescent rather than
   cross-faded.
2. On activation, a **circular reveal expands from the button's own
   coordinates**, wiping the incoming theme across the page. Implemented with
   the View Transitions API (`document.startViewTransition`) driving a
   `clip-path: circle()` keyframe, seeded with the button's centre.
3. Simultaneously the hero's sky gradient shifts, stars fade in or out, and
   every accent animates via custom-property transitions.

### Applying the theme before first paint

A theme read from `localStorage` in a deferred module runs *after* the browser
has already painted, so a night-theme visitor sees a white flash on every load.
To prevent it, a tiny **blocking inline script in `<head>`** — before any
stylesheet — reads the stored preference (or `prefers-color-scheme`) and sets
`data-theme` on `<html>`. This is the one piece of inline JS in the project and
it exists solely to beat first paint.

That same script adds a `js` class to `<html>`. Scroll-reveal start states
(`opacity: 0`) are scoped to `.js` so that **with JavaScript disabled or failed,
every section renders fully visible** instead of the page appearing blank. A
portfolio that shows nothing when a script 404s is worse than one with no
animation at all.

It also sets a `no-transitions` class that `main.js` removes on the next frame,
so applying the stored theme at boot does not play the wipe animation.

### View Transitions and fixed elements

The sidebar and the scroll-progress bar are `position: fixed`. The View
Transitions API snapshots the old and new states of the page, and fixed
elements are captured in place — during the circular wipe they can appear to
duplicate or jump. Each fixed element therefore gets its own
`view-transition-name` so it is animated as its own layer and cross-fades in
place rather than travelling with the wipe.

### Fallbacks and rules

- Browsers without View Transitions get a plain opacity crossfade. Feature-
  detected, never user-agent sniffed.
- Choice persists to `localStorage`. Reads are wrapped in `try/catch` —
  private-mode browsers can throw on access.
- First visit with no stored preference honours `prefers-color-scheme`.
- Under `prefers-reduced-motion`, the theme still changes; the circular wipe
  is replaced by an instant swap.
- The control is a real `<button>` with `aria-pressed` and an accessible label
  that reflects the action, not the state.

---

## 6. Section specifications

### Hero

Two-column on desktop, stacked on mobile.

Left: name, role, one-line pitch, the morphing day/night tagline
(*"Nature Lover by Day 🌿 / Code Ninja by Night 💻"*), a stat strip, primary
CTAs (View Work · Résumé · Say Hi), and a compact Wire badge linking to Google
Play. Right: `kishan.jpg`, presented **untreated** — no filter, no overlay, no
tint, in either theme. Only the frame around it responds to the theme.

The spec originally called for a theme-tinted portrait (a brightness/contrast
nudge plus a low-opacity accent overlay, explicitly avoiding hue-rotation). It
was built, reviewed and removed at the user's request: they want the photograph
of themselves to look natural rather than styled. This is the right call for a
portrait — any tint on a photo of a person is a cost with no informational
benefit, and the theme is already carried by everything around it.

**Stat strip**, counting up once when it first scrolls into view (not on page
load — see §7; the earlier "on load" wording was inconsistent and is corrected
here). Every figure is verifiable from site content:

| Figure | Derivation |
|---|---|
| 2+ years of experience | Jan 2024 (Wit/Bit, first full-time role) to present. **Deliberately excludes the Learnship internship**: companies count professional experience from the first full-time role, so counting an internship would inflate the figure and would not survive an interview. Do not "correct" this upward to 3+. |
| 5+ enterprise projects delivered | Derived from the Career timeline copy: OneBuzz, insurance web apps, CRM, inventory management, eCommerce. **User-supplied claim, not machine-verifiable.** |
| 4+ domains worked in | AI SaaS, insurance, retail/eCommerce, CRM and inventory. **User-supplied claim, not machine-verifiable.** |
| 5★ HackerRank Problem Solving | The user's HackerRank rating. |

Every figure carries a `+` at the user's request, so none reads as an exact
ceiling.

Three earlier stats were removed on the user's instruction: the MCA grade, the
count of apps live on Google Play, and the technology count. The MCA grade and
the Play Store apps both remain visible elsewhere on the page (Career timeline
and Projects section respectively), so nothing was lost, only de-emphasised in
the hero.

`scripts/check.py` verifies hero stats against page content where the number is
derivable from markup. The enterprise-projects and domains figures are claims
about work that is not represented as countable elements on the page, so the
checker cannot validate them. They are the two numbers to re-confirm before the
site goes live.

The user selected the photo, the tagline and the Wire badge *and* "keep it
clean." These are composed to coexist. If review finds the hero busy, the Wire
badge is cut first — Wire already appears featured-large in Projects.

### 01 / About

Copy unchanged. Restyled for the new type scale and reveal motion.

### 02 / Superpowers

20 tiles. Hover lifts and glows; entry is a staggered reveal. Tiles keep their
existing images, including the four added this session (`react`, `express`,
`playwright`, `claudecode-color`).

**The logos are fixed-colour PNGs and do not respond to the theme.** Each
therefore sits on a chip that follows the theme — a plate slightly darker than
the surface by day, slightly lighter by night.

**Correction, made during implementation.** This spec originally called for a
consistent *light* chip in both themes, on the basis that several logos were
too dark for the night canvas (citing mean luminance: angular 86, kotlin 94,
sql 99, playwright 113). That metric is wrong — mean luminance is skewed by
anti-aliased edges. Measuring the darkest ink in each mark instead shows only
**4 of 20** carry genuinely dark ink (android, jetpack-compose, c, playwright),
and a light plate would have destroyed the 16 light-coloured logos: React falls
to 1.37:1 on it, node to 1.87:1, web to 1.79:1.

With a theme-following chip, measured separation at night is **5.3:1 to
15.6:1** across all twenty. In day theme the light-coloured marks stay
inherently soft on any light surface — true of the current live site and of
React's own branding — which is acceptable because **every tile carries a
visible text label**, so the logo is decorative and never the sole carrier of
meaning.

No logo is recoloured, inverted or filtered, and adding a new logo later
requires no per-asset tuning.

### 03 / Career

Vertical timeline that draws itself as it scrolls into view, using an SVG
stroke with animated `stroke-dashoffset`. Entries, newest first:

| Role | Dates |
|---|---|
| Eicore — Software Engineer | Feb 2026 – Present |
| essentia.dev — Software Engineer | Jun 2025 – Feb 2026 |
| Wit/Bit — Full-Stack Mobile Developer, Kolkata (Remote) | Jan 2024 – May 2025 |
| Learnship — Internship, Chennai (On-site) | Sep 2023 – Jan 2024 |
| Vellore Institute of Technology — MCA, 9.01 | Sep 2022 – May 2024 |
| Jharkhand Raksha Shakti University — B.Sc Computer Science & Cyber Security, 9.19 | 2019 – 2022 |

Education entries are rendered in a visually distinct style from roles (hollow
node, muted rule) so the timeline reads as one continuous history without
implying the degrees were jobs.

**The MCA (to May 2024) overlaps the start of Wit/Bit (Jan 2024).** This is
real, not a data error — the final months of the degree ran alongside the job.
The timeline must render the overlap honestly rather than forcing a false
sequence, and must not visually imply a gap or a conflict.

Dates supplied directly by the user on 2026-08-28 and treated as
authoritative. Two corrections to live content fall out of this and are part of
the work: **Wit/Bit currently reads "2024" and must become Jan 2024 – May
2025**, and **Learnship currently carries no dates at all**.

The Eicore start date is **Feb 2026**, confirmed directly by the user on
2026-08-28 when asked to settle it against a pasted LinkedIn excerpt that read
*"Mar 2026 - Present · 6 mos."* Feb is authoritative; the LinkedIn figure is
superseded.

### 04 / Projects

Filterable card grid. Filter chips: **All / Flutter / Android / Web**.

The spec originally specified a Backend chip. The actual project set does not
support it — only Wire has a backend component, and a filter matching one card
is noise. Android earns a chip instead (JRSU App, Monthly Expense Manager),
and the split now reflects what is really there: Flutter 6, Android 2, Web 2,
across nine projects. Filtering is
hand-written (`filters.js`) and replaces Isotope; it animates with FLIP
(measure, reflow, invert, play) so cards glide between positions.

Wire is featured in a double-width card: Flutter · PostgreSQL · WebSocket, the
bike-trip origin story, and links to both Google Play
(`com.wire.location`) and the open-source repo (`kishanraj427/wayfarer-sync`).

Harber is a personal project, not a role: a Flutter app for booking a slot at
the nearest barber shop (2023, source at `kishanraj427/harber`). It sits in this
grid under `Flutter`, not in the Career timeline.

The two **JRSU** project cards are the app built for Jharkhand Raksha Shakti
University, where the user took their B.Sc. That link is currently invisible to
a reader; the project copy should make it explicit, since building the official
app for your own university is a stronger story than an unattributed app.

Filter chips are radio-grouped, keyboard-operable, and announce state.

### Sidebar and navigation

`custom.js` is deleted, so its two surviving behaviours are reimplemented in
`nav.js`: the mobile menu open/close (below 846px, closing on link activation)
and active-section highlighting in the sidebar as the page scrolls, via the
same `IntersectionObserver` used for reveals. The menu traps focus while open,
closes on `Escape`, and is a real `<button>` rather than the current `<i>`
element, which is not keyboard-reachable.

The nav grows from four items to five, matching the new IA: About ·
Superpowers · Career · Projects · Say Hi. The existing playful labels are kept
where they still fit ("Raj Kishan, who dat?", "Say Hi!"); Career and Projects
are new entries, not renames of an existing one.

### 05 / Say Hi

Formspree endpoint (`xzzbqjbk`) kept as-is. Adds real validation states,
accessible error messaging tied by `aria-describedby`, and a submit button with
pending/success/error states.

---

## 7. Motion system

One system, defined in `05-motion.css` and driven by `reveal.js`. Not a pile of
per-element rules.

| Effect | Mechanism |
|---|---|
| Scroll reveals | `IntersectionObserver`, stagger via a `--i` index property |
| Career timeline draw | Scroll-linked `stroke-dashoffset` |
| Skill tile hover | `transform` lift + accent glow |
| Magnetic CTAs | Pointer-relative `translate`, released on leave |
| Card tilt | Subtle rotate on pointer, **disabled on touch and coarse pointers** |
| — | **Magnetic and tilt must never nest.** Both write `transform` on pointer move; a magnetic button inside a tilting card produces compounding, fighting transforms. Tilt applies to project cards only; magnetic applies to hero CTAs only. |
| Stat count-up | Runs once, on first intersection |
| Scroll progress | Fixed bar bound to document scroll |

**Rules.** Animate `transform` and `opacity` only — never layout properties.
Target 60fps on a mid-range phone. Every observer disconnects when done. No
scroll-jacking: the page never fights the user's own scrolling.

**Reduced motion.** A single `@media (prefers-reduced-motion: reduce)` block in
`05-motion.css` collapses all of the above to instant opacity changes. The
count-up renders its **final value immediately** rather than being skipped, so
no figure is ever missing; the timeline renders fully drawn; magnetic and tilt
are disabled outright, not merely shortened. This is
one override block by design, not guards scattered through the codebase, so the
behaviour is auditable in one place.

---

## 8. Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `section`, `footer`.
- Skip-to-content link as the first focusable element.
- Visible `:focus-visible` rings in both themes.
- AA contrast for all text in both themes, verified during implementation.
- The theme toggle and filter chips are real controls with correct roles,
  states and labels.
- Every interaction reachable by keyboard alone.
- Images carry meaningful `alt`; decorative art is `aria-hidden`.

---

## 9. Performance

| Budget | Target |
|---|---|
| JS shipped | < 15 KB uncompressed, no dependencies |
| CSS shipped | < 30 KB across five files |
| Vendor code | zero |
| Fonts | 3 families, < 120 KB total, `display=swap`, system fallbacks |

Fonts are the largest remaining payload and the one place this design can
quietly undo its own performance win — a variable serif plus two more families
can exceed the JS and CSS budgets combined several times over. Constraints:
latin subset only, and a strict weight list (Fraunces 400/700, Inter 400/600,
JetBrains Mono 400). If the measured total exceeds budget, Fraunces is kept for
display and one of the remaining two families is dropped in favour of a system
stack.

Removing `vendor/` (~3.7 MB), the plugin CSS/JS, and the FontAwesome font
files (~600 KB) means the redesign should ship dramatically lighter than the
site it replaces despite doing far more.

Social icons become inline SVG, eliminating the icon-font dependency entirely.

---

## 10. File structure

```
index.html

assets/css/
  01-tokens.css       palettes, type scale, spacing, easing, durations
  02-base.css         reset, root, typography, focus-visible
  03-layout.css       shell, sidebar, section rhythm, containers
  04-components.css   card · tile · timeline · chip · button · badge · form
  05-motion.css       keyframes, reveal states, reduced-motion overrides

assets/js/            ES modules, no bundler
  theme.js            toggle, persistence, transition
  reveal.js           IntersectionObserver stagger
  timeline.js         scroll-linked career draw
  filters.js          project filtering (FLIP)
  nav.js              mobile menu open/close, scroll-spy section highlighting
  main.js             init

assets/images/        kept
docs/superpowers/specs/
```

### Deleted

`vendor/` (jQuery, Bootstrap — 3.7 MB) · `assets/js/isotope.min.js` ·
`assets/js/owl-carousel.js` · `assets/js/lightbox.js` ·
`assets/js/custom.js` · `assets/css/owl.css` · `assets/css/lightbox.css` ·
`assets/css/flex-slider.css` · `assets/css/templatemo-style.css` ·
`assets/css/fontawesome.css` · `assets/fonts/` · `prepros-6.config`

---

## 11. Content carried forward

All content edits made earlier in this session are preserved into the new
markup, not re-derived:

- Eicore card (Feb 2026 – Present, internalized from essentia.dev, OneBuzz),
  linked to `https://www.eicoretech.com/`.
- Wire card with real URLs, replacing the `lnkd.in` shorteners.
- essentia.dev corrected to a past role, Jun 2025 – Feb 2026.
- Age removed from About; "currently working at" points to Eicore.
- Two leftover assistant artifacts removed from About and JAC eLearning.
- Filled `meta description` and `author`.
- All external links open in a new tab with `rel="noopener noreferrer"`;
  in-page anchors and `mailto:` deliberately excluded.

### Positioning material (from the user's LinkedIn About, 2026-08-28)

Authoritative for the hero pitch, the About rewrite and the Eicore card. The
user supplied this instead of picking a drafted pitch line, so it is their
voice, not invented copy.

- **Current focus:** AI-powered SaaS products at Eicore Technologies —
  integrating AI into production without sacrificing performance or code
  quality. **OneBuzz is a web product for the insurance sector, not mobile** —
  corrected 2026-08-31 after the site initially described it as web and mobile. This is what OneBuzz is; the Eicore card should
  say so rather than naming the product alone.
- **Security-first mindset:** an early background in Cyber Security (the JRSU
  B.Sc) means they approach development security-first and systems-level. This
  is a genuine differentiator and belongs in About — it ties the B.Sc to how
  they work rather than leaving it as a dangling qualification.
- **Stack, in their own grouping:** mobile (Android, Flutter), web (React,
  Angular), backend (Node.js, **Bun.js**, Spring).
- **Architecture:** system design, RESTful API design, solving real production
  performance bottlenecks — not just writing code.
- **5-star HackerRank rating in Problem Solving.** Concrete and verifiable; it
  replaced the vaguer "20 technologies" figure in the hero stat strip, since the
  Superpowers grid already shows the technology count visually.
- **Education:** MCA, Vellore Institute of Technology.

Chosen hero pitch, condensed from the above:

> I turn complex business needs into scalable, high-performing applications —
> right now, AI-powered SaaS at Eicore.

**Open:** Bun.js appears in their stack but has no tile in the Superpowers
grid and no image in `assets/images/`. Either add an asset or leave it to the
Career/Projects copy.

### Known loose ends

- `React.png` and `Playwrite.png` are capitalised while every other image is
  lowercase, and *Playwrite* misspells *Playwright*. GitHub Pages is
  case-sensitive; local dev is not. Rename to `react.png` and
  `playwright.png` during implementation.
- Four images remain untracked and must be `git add`ed or the tiles 404 live.
- The résumé Google Drive PDF still lacks the Eicore role. Outside this repo;
  the user's action.

---

## 12. Verification

There is no test suite in this repo and none is being added — the deliverable
is a static page whose correctness is visual and behavioural.

Per the user's standing instruction, **the user runs commands; the assistant
does not run test suites.** Verification the assistant performs is limited to
static checks it can make cheaply and report honestly:

- every `src`/`href` resolves to a file that exists on disk
- tag balance across `div`, `figure`, `figcaption`, `h4`
- no external link left without `target`/`rel`
- no hardcoded colour outside `01-tokens.css`

Handed back for the user to run:

```
kishanraj427.github.io    python3 -m http.server 8000    # then open localhost:8000
```

Manual review checklist for the user: both themes, the toggle transition,
keyboard-only navigation, reduced-motion behaviour (via OS setting), and
mobile width.

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| Wholesale `index.html` replacement loses content | Content changes committed as a restore point before implementation begins |
| View Transitions unsupported in some browsers | Feature-detected crossfade fallback |
| Motion feels excessive to a non-technical viewer | Budget capped at Section 7; reduced-motion honoured; no scroll-jacking |
| Three font families feel heavy | `display=swap` + system fallbacks; drop to two if load cost shows |
| Hero over-filled with four optional elements | Wire badge is the designated first cut |

---

## 14. Open questions

1. ~~**Eicore start date** — Feb vs Mar 2026?~~ **Resolved 2026-08-28:**
   **Feb 2026**, confirmed by the user directly. The Mar 2026 figure in the
   pasted LinkedIn excerpt is superseded.
2. **Hero pitch line** — to be drafted during implementation and shown for
   approval; the user has not yet written one.
3. ~~**Harber** — job or side project?~~ **Resolved 2026-08-28:** a personal
   project, a Flutter app for booking a slot at the nearest barber shop.
   Belongs in Projects under the `Flutter` filter. Its existing card copy and
   GitHub link are kept as-is.
