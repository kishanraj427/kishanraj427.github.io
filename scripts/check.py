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

# 4d. hero stat numbers must match what the page actually contains, so they
# cannot go stale when a project or a tile is added.
derived = {
    'personal': len(re.findall(r'<li class="card', html)),
    'Google Play': len(set(re.findall(
        r'play\.google\.com/store/apps/details\?id=([\w.]+)', html))),
    'technologies': len(re.findall(r'<li class="tile"', html)),
}
for item in re.findall(r'<li class="stat">(.*?)</li>', html, re.S):
    num = re.search(r'data-count="(\d+)"', item)
    label = re.sub(r'<[^>]+>', ' ', item)
    if not num:
        continue
    for key, actual in derived.items():
        if key in label and int(num.group(1)) != actual:
            fails.append('hero stat "%s" says %s but the page contains %d'
                         % (key, num.group(1), actual))

# 5. the pre-paint boot script must be inline in <head>
head = html.split('</head>')[0]
if 'data-theme' not in head:
    fails.append('no pre-paint theme boot script in <head>')

print('\n'.join('FAIL ' + f for f in fails) if fails else 'OK all checks passed')
sys.exit(1 if fails else 0)
