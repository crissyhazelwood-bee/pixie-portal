#!/usr/bin/env python3
"""
inject_memory.py
Injects portal-memory.js + pixie-sigil.js into every Pixie Portal HTML page.
Also wires up game recording calls and wish tracking.
Run from pixie-portal/ directory.
"""

import re
from pathlib import Path

ROOT  = Path(__file__).parent
PUB   = ROOT / 'public'

SCRIPT_TAGS = (
    '    <script src="portal-memory.js"></script>\n'
    '    <script src="pixie-sigil.js"></script>\n'
)

# Map of HTML filename -> game name for PortalMemory.recordGame()
GAME_PAGES = {
    'wishing_well.html' : 'wishing_well',
    'mushroom_match.html': 'mushroom_match',
    'fairy_garden.html' : 'fairy_garden',
    'frog_box.html'     : 'frog_box',
    'fairy_flight.html' : 'fairy_flight',
    'constellation.html': 'constellation',
    'firefly_chase.html': 'firefly_chase',
    'petal_puzzle.html' : 'petal_puzzle',
    'dragon_dash.html'  : 'dragon_dash',
    # the_portal uses enterPortal() — handled separately
}

# Pages where the start function is enterPortal() instead of startGame()
PORTAL_PAGES = {'the_portal.html': 'the_portal'}


def inject_scripts(html: str) -> str:
    """Add portal-memory.js + pixie-sigil.js before </body>."""
    if 'portal-memory.js' in html:
        return html  # already injected
    return html.replace('</body>', SCRIPT_TAGS + '</body>', 1)


def inject_record_game(html: str, game_name: str, fn_name: str = 'startGame') -> str:
    """Add PortalMemory.recordGame() at the top of the named function."""
    call = f"if(window.PortalMemory) PortalMemory.recordGame('{game_name}');"
    if call in html:
        return html  # already injected

    # Match  function startGame() {   or   function startGame(){
    pattern = rf'(function\s+{re.escape(fn_name)}\s*\(\s*\)\s*\{{)'
    replacement = rf'\1\n        {call}'
    result, count = re.subn(pattern, replacement, html, count=1)
    if count == 0:
        print(f'  WARNING: could not find {fn_name}() in this file')
    return result


def inject_record_wish(html: str) -> str:
    """Add PortalMemory.recordWish() when a wish is scored in wishing_well.html."""
    call = 'if(window.PortalMemory) PortalMemory.recordWish();'
    if call in html:
        return html

    # The wish line: wishStreak++; wishTotal++; triggerWishFlash();
    old = 'wishStreak++; wishTotal++; triggerWishFlash();'
    new = f'wishStreak++; wishTotal++; triggerWishFlash(); {call}'
    result = html.replace(old, new, 1)
    if result == html:
        print('  WARNING: could not find wish scoring line in wishing_well.html')
    return result


def process_file(path: Path, game_name=None, fn_name='startGame', record_wish=False):
    html = path.read_text(encoding='utf-8')
    html = inject_scripts(html)
    if game_name:
        html = inject_record_game(html, game_name, fn_name)
    if record_wish:
        html = inject_record_wish(html)
    path.write_text(html, encoding='utf-8')
    print(f'  updated: {path.name}')


def sync_to_root(pub_path: Path):
    """If a matching file exists at repo root, keep it in sync."""
    root_path = ROOT / pub_path.name
    if root_path.exists():
        root_path.write_text(pub_path.read_text(encoding='utf-8'), encoding='utf-8')
        print(f'  synced:  {root_path.name} (root)')


# --- Run ---
print('\nInjecting Portal Memory + Sigil...\n')

# index.html — no game recording, just scripts
f = PUB / 'index.html'
process_file(f)
sync_to_root(f)

# Plain game pages
for fname, gname in GAME_PAGES.items():
    f = PUB / fname
    if f.exists():
        record_wish = (fname == 'wishing_well.html')
        process_file(f, game_name=gname, fn_name='startGame', record_wish=record_wish)
        sync_to_root(f)
    else:
        print(f'  SKIP (not found): {fname}')

# The Portal — uses enterPortal()
for fname, gname in PORTAL_PAGES.items():
    f = PUB / fname
    if f.exists():
        process_file(f, game_name=gname, fn_name='enterPortal')
        sync_to_root(f)

# Script-only pages (no startGame to hook)
for fname in ['spellbook.html', 'pixie_pet.html']:
    f = PUB / fname
    if f.exists():
        process_file(f)
        sync_to_root(f)

print('\nDone.')
