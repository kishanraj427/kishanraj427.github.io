# 👨‍💻 Raj Kishan Prasad - Personal Portfolio

Welcome to the repository for my personal portfolio website. This site serves as a digital resume and a showcase of my projects, experience, and skills as a Full Stack Software Engineer.

🔗 **Live Site:** [kishanraj427.github.io](https://kishanraj427.github.io)

## 🚀 About the Project

The site is hand-built, with no framework and no build step. Open `index.html` and it runs. It is designed around a day/night theme that switches with an animated transition, and every colour, spacing and motion value comes from a single set of design tokens.

Sections:

- **Hero:** who I am, what I do, and a few numbers worth checking.
- **About:** background, how I approach engineering, and where the security-first habit came from.
- **Superpowers:** the tools and languages I work in.
- **Career:** a timeline of roles and education, most recent first.
- **Projects:** side projects, filterable by technology. Most are shipped and public.
- **Say Hi:** a contact form, plus links to GitHub, LinkedIn, email and my résumé.

## 🛠️ Built With

No dependencies. Nothing to install.

- **HTML5** for semantic structure.
- **Modern CSS** using custom properties, grid, `clamp()` and the View Transitions API.
- **Vanilla JavaScript** as ES modules, with `IntersectionObserver` for scroll behaviour.
- **Google Fonts** (Lato, JetBrains Mono).

Accessibility and motion are treated as requirements rather than extras: semantic landmarks, a skip link, visible focus states, keyboard-operable controls, AA contrast in both themes, and a single `prefers-reduced-motion` block that disables the animation without hiding any content.

## 📂 Repository Structure

```text
index.html                  Single page. Semantic markup, one section per block.

assets/css/
  01-tokens.css             Both palettes, type scale, spacing, motion tokens.
                            The only file containing literal colours.
  02-base.css               Reset, typography, focus states, skip link.
  03-layout.css             Shell, sidebar, hero, section rhythm, breakpoints.
  04-components.css         Cards, tiles, timeline, chips, buttons, form.
  05-motion.css             Keyframes, reveal states, reduced-motion block.

assets/js/                  ES modules, no bundler.
  theme.js                  Day/night toggle, persistence, circular wipe.
  nav.js                    Mobile menu, scroll-spy, scroll progress.
  reveal.js                 Shared scroll reveals and count-up.
  hero.js                   Magnetic buttons, stat animation.
  timeline.js               Scroll-linked career line.
  filters.js                Project filtering with FLIP, card tilt.
  contact.js                Form validation and submit states.
  main.js                   Entry point.

assets/images/              Photos, logos, favicon.
scripts/check.py            Static checks. Development only, never shipped.
docs/superpowers/           Design spec and implementation plan.
```

## 🧪 Checks

`scripts/check.py` verifies that every referenced asset exists, that tags are balanced and properly nested, that external links open safely, that filter chips and project tags agree, and that no colour is hardcoded outside the tokens file.

```bash
python3 scripts/check.py
```

To view the site locally, serve it rather than opening the file directly. ES modules will not load over `file://`.

```bash
python3 -m http.server 8000
```
