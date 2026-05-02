# Tarot Full Deck Production Memory

The user wants the entire 78-card Fairy Tarot deck converted to the approved **soft pastel illustrated storybook tarot** style.

## Current Status

The full 78-card Fairy Tarot deck now has stable painted raster assets and is wired in both:

- `index.html`
- `public/index.html`

Both tarot asset folders contain the complete deck plus the two reference images:

- `assets/tarot/`
- `public/assets/tarot/`

Verification on 2026-05-01:

- `npm.cmd run test:safety` passed.
- The painted-art renderer map has 78 entries.
- No mapped art files are missing from `assets/tarot/`.

The style was approved by the user after seeing the first three generated/wired card illustrations:

- `public/assets/tarot/hanged-man-art.png`
- `public/assets/tarot/page-pentacles-art.png`
- `public/assets/tarot/temperance-art.png`

User feedback:

- "that is perfect"
- "they look amazing keep it up!!!!!"

Do not go back to CSS icon/mannequin tarot art for final card faces. Use actual raster illustrations for finished cards.

## Stable Asset Naming

Use lowercase kebab-case filenames:

- `fool-art.png`
- `magician-art.png`
- `high-priestess-art.png`
- `empress-art.png`
- `emperor-art.png`
- `hierophant-art.png`
- `lovers-art.png`
- `chariot-art.png`
- etc.

Store each final asset in both:

- `public/assets/tarot/`
- `assets/tarot/`

## Assets Created So Far

Approved/wired first cards:

- `hanged-man-art.png`
- `page-pentacles-art.png`
- `temperance-art.png`

Generated and copied as stable project assets in the latest batch:

- `fool-art.png`
- `magician-art.png`
- `high-priestess-art.png`
- `empress-art.png`
- `emperor-art.png`
- `hierophant-art.png`
- `lovers-art.png`
- `chariot-art.png`
- `strength-art.png`
- `hermit-art.png`
- `wheel-of-fortune-art.png`
- `justice-art.png`
- `death-art.png`
- `devil-art.png`
- `tower-art.png`
- `star-art.png`
- `moon-art.png`
- `sun-art.png`
- `judgement-art.png`
- `world-art.png`

All 22 Major Arcana now have stable painted assets, plus `page-pentacles-art.png`.

Wands suit is complete and wired:

- `ace-wands-art.png`
- `two-wands-art.png`
- `three-wands-art.png`
- `four-wands-art.png`
- `five-wands-art.png`
- `six-wands-art.png`
- `seven-wands-art.png`
- `eight-wands-art.png`
- `nine-wands-art.png`
- `ten-wands-art.png`
- `page-wands-art.png`
- `knight-wands-art.png`
- `queen-wands-art.png`
- `king-wands-art.png`

Cups suit is complete and wired:

- `ace-cups-art.png`
- `two-cups-art.png`
- `three-cups-art.png`
- `four-cups-art.png`
- `five-cups-art.png`
- `six-cups-art.png`
- `seven-cups-art.png`
- `eight-cups-art.png`
- `nine-cups-art.png`
- `ten-cups-art.png`
- `page-cups-art.png`
- `knight-cups-art.png`
- `queen-cups-art.png`
- `king-cups-art.png`

Swords suit is complete and wired:

- `ace-swords-art.png`
- `two-swords-art.png`
- `three-swords-art.png`
- `four-swords-art.png`
- `five-swords-art.png`
- `six-swords-art.png`
- `seven-swords-art.png`
- `eight-swords-art.png`
- `nine-swords-art.png`
- `ten-swords-art.png`
- `page-swords-art.png`
- `knight-swords-art.png`
- `queen-swords-art.png`
- `king-swords-art.png`

Pentacles suit is complete and wired:

- `ace-pentacles-art.png`
- `two-pentacles-art.png`
- `three-pentacles-art.png`
- `four-pentacles-art.png`
- `five-pentacles-art.png`
- `six-pentacles-art.png`
- `seven-pentacles-art.png`
- `eight-pentacles-art.png`
- `nine-pentacles-art.png`
- `ten-pentacles-art.png`
- `page-pentacles-art.png`
- `knight-pentacles-art.png`
- `queen-pentacles-art.png`
- `king-pentacles-art.png`

The source generated images remain under:

- `C:\Users\criss\.codex\generated_images\019dd4cb-66ce-7e91-9e1f-9fccd56caf40`
- `C:\Users\criss\.codex\generated_images\019de522-4ce3-78d2-9fac-2938e5d1054b`

## Prompt DNA

Use the same prompt pattern for each card:

```text
Use case: illustration-story
Asset type: tarot card face inner artwork panel for a website
Primary request: Create a soft pastel storybook tarot illustration for [CARD NAME].
Scene/backdrop: [card-specific pastel fairytale scene].
Subject: [card-specific fairy/person/symbolic action].
Style/medium: soft pastel watercolor tarot art, delicate hand-drawn fairytale linework, dreamy low contrast.
Composition/framing: vertical tarot inner art panel, full illustrated scene fills the image, centered subject, no card border and no title text.
Color palette: lavender, blush pink, pale yellow, mint green, baby blue, warm ivory.
Constraints: no typography, no watermark, no harsh neon, no gothic mood, no abstract icon, no flat app icon, no symbol-only composition.
```

## Implementation Notes

- Keep Tarot draw logic, spread layout, tabs, card names, and meanings unchanged.
- Card face renderer is in `index.html`, mirrored to `public/index.html`.
- Important function: `buildTarotLineArt(card)`, called by `buildCardScene(card)`.
- Finished cards should return:

```html
<div class="tarot-painted-scene"><img src="assets/tarot/[filename].png" alt=""></div>
```

- After changing root `index.html`, mirror it to `public/index.html`.
- Verify with `npm run test:safety`.
- For browser QA, force specific cards into the spread with Puppeteer and confirm `.tarot-painted-scene img` loads.

## Continue From Here

The full deck asset pass is complete. Continue with QA, performance, compression, and deployment.

Recommended next checks:

- The darker cards should stay soft, pastel, and fairytale, not gothic.
- Browser QA the tarot draw flow and force sample cards from each suit.
- Consider compressing the large PNGs before deploy if Pages upload or page load gets heavy.
- Commit the complete deck assets before further iteration.
