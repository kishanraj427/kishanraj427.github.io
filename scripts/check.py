#!/usr/bin/env python3
"""Static checks for the portfolio. Dev-only; never shipped."""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
fails = []

# 1. every referenced asset exists on disk (catches case-sensitivity bugs)
for attr in ('src', 'href'):
    for ref in re.findall(r'%s="((?!https?:|mailto:|#|data:)[^"]+)"' % attr, html):
        if not os.path.exists(os.path.join(ROOT, ref)):
            fails.append('missing asset: %s' % ref)

# 2. tag balance
for tag in ('div', 'section', 'figure', 'ul', 'li', 'button', 'a'):
    o = len(re.findall(r'<%s[\s>]' % tag, html))
    c = len(re.findall(r'</%s>' % tag, html))
    if o != c:
        fails.append('unbalanced <%s>: %d open, %d close' % (tag, o, c))

# 2b. proper nesting (tag counts alone miss <div><main></div></main>)
from html.parser import HTMLParser

VOID = {'area','base','br','col','embed','hr','img','input','link',
        'meta','param','source','track','wbr'}

class Nest(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []
    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append((tag, self.getpos()[0]))
    def handle_startendtag(self, tag, attrs):
        pass
    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append('stray </%s> at line %d' % (tag, self.getpos()[0]))
            return
        if self.stack[-1][0] == tag:
            self.stack.pop()
            return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                bad = self.stack[i + 1:]
                self.errors.append(
                    'improper nesting: </%s> at line %d closes over %s'
                    % (tag, self.getpos()[0],
                       ', '.join('<%s> (line %d)' % b for b in bad)))
                del self.stack[i:]
                return
        self.errors.append('unmatched </%s> at line %d' % (tag, self.getpos()[0]))

_n = Nest()
_n.feed(html)
fails.extend(_n.errors)
fails.extend('never closed: <%s> at line %d' % t for t in _n.stack)

# 3. external links open in a new tab, safely
for tag in re.findall(r'<a\b[^>]*>', html):
    href = re.search(r'href="(https?:[^"]+)"', tag)
    if href and ('_blank' not in tag or 'noopener' not in tag):
        fails.append('external link missing target/rel: %s' % href.group(1))

# 4. no hardcoded colours outside the tokens file
CSS = os.path.join(ROOT, 'assets/css')
LEGACY = {'templatemo-style.css', 'owl.css', 'lightbox.css',
          'flex-slider.css', 'fontawesome.css'}
for name in sorted(os.listdir(CSS)):
    if name == '01-tokens.css' or not name.endswith('.css'):
        continue
    if name in LEGACY:
        continue  # removed in Task 9; not worth reporting on every run
    css = open(os.path.join(CSS, name), encoding='utf-8').read()
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    # mask/clip stencils are alpha channels, not theme colours: they cannot be
    # themed and must not be tokenised. Exempt the whole declaration.
    css = re.sub(r'(-webkit-)?(mask|clip-path)[a-z-]*\s*:[^;]+;', '', css)
    for lit in re.findall(r'#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(', css):
        fails.append('hardcoded colour in %s: %s' % (name, lit))

# 4b. filter chips and card tags must agree in both directions
chips = set(re.findall(r'<button[^>]*class="chip"[^>]*data-filter="([^"]+)"', html))
chips |= set(re.findall(r'data-filter="([^"]+)"[^>]*class="chip"', html))
tags = set()
for group in re.findall(r'data-tags="([^"]*)"', html):
    tags |= set(group.split())
if chips:
    for t in sorted(tags - chips):
        fails.append('card tag "%s" has no filter chip' % t)
    for c in sorted(chips - tags - {'all'}):
        fails.append('filter chip "%s" matches no card' % c)

# 4c. if JS toggles visibility via the hidden property, CSS must enforce it:
# the UA [hidden] rule loses to any author rule that sets display.
JS = os.path.join(ROOT, 'assets/js')
uses_hidden = any(
    re.search(r'\.hidden\s*=', open(os.path.join(JS, f), encoding='utf-8').read())
    for f in os.listdir(JS) if f.endswith('.js')
)
if uses_hidden:
    all_css = ''.join(
        open(os.path.join(CSS, f), encoding='utf-8').read()
        for f in os.listdir(CSS) if f.endswith('.css'))
    if not re.search(r'\[hidden\][^{]*\{[^}]*display:\s*none', all_css):
        fails.append('JS toggles .hidden but no CSS [hidden] { display: none } rule '
                     'exists; author display rules will override the UA default')

# 4d. every hero stat must either match a count derived from the page, or be
# listed in CLAIMS. Matching neither is a FAIL, so a new stat can't slip
# through unchecked.
DERIVED = {
    'personal': len(re.findall(r'<li class="card', html)),
    'Google Play': len(set(re.findall(
        r'play\.google\.com/store/apps/details\?id=([\w.]+)', html))),
    'technologies': len(re.findall(r'<li class="tile"', html)),
}

# User-supplied claims — not machine-verifiable. Note: "years of" runs from
# Jan 2024 and excludes the Learnship internship on purpose.
CLAIMS = ('years of', 'enterprise projects', 'domains', 'HackerRank')

for item in re.findall(r'<li class="stat">(.*?)</li>', html, re.S):
    num = re.search(r'data-count="(\d+)"', item)
    if not num:
        continue
    label = ' '.join(re.sub(r'<[^>]+>', ' ', item).split())
    accounted = False
    for key, actual in DERIVED.items():
        if key not in label:
            continue
        accounted = True
        if int(num.group(1)) != actual:
            fails.append('hero stat "%s" says %s but the page contains %d'
                         % (key, num.group(1), actual))
    if not accounted and not any(c in label for c in CLAIMS):
        fails.append('hero stat "%s" is neither derivable from the page nor '
                     'listed in CLAIMS; add a derivation or record it as a '
                     'claim in scripts/check.py' % label)

# 6. env(safe-area-inset-*) silently resolves to 0 without viewport-fit=cover.
vp = re.search(r'<meta name="viewport" content="([^"]+)"', html)
if not vp:
    fails.append('no viewport meta tag')
elif 'viewport-fit=cover' not in vp.group(1):
    fails.append('viewport meta lacks viewport-fit=cover; the bottom bar would '
                 'sit under the iPhone home indicator')

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

# 5. the pre-paint boot script must be inline in <head>
head = html.split('</head>')[0]
if 'data-theme' not in head:
    fails.append('no pre-paint theme boot script in <head>')

print('\n'.join('FAIL ' + f for f in fails) if fails else 'OK all checks passed')
sys.exit(1 if fails else 0)
