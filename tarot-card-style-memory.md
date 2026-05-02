# Tarot Card Face Style Memory

The accepted tarot card face direction is **soft pastel illustrated storybook tarot**, matching the user-provided reference deck.

## What Worked

- Use actual raster illustrated card art for important cards, not CSS icon compositions.
- The successful assets are:
  - `public/assets/tarot/hanged-man-art.png`
  - `public/assets/tarot/page-pentacles-art.png`
  - `public/assets/tarot/temperance-art.png`
- These should be displayed inside the existing cream tarot card frame through `.tarot-painted-scene img`.
- The cards should immediately read as real printed pastel tarot cards in the 3-card spread.

## Required Visual Language

- Warm ivory / cream tarot card body.
- Soft rounded corners.
- Thin pale gold / beige inner border.
- Pastel watercolor illustration panel.
- Dreamy, low-contrast, hand-drawn fairytale/fairy style.
- Lavender, blush pink, pale yellow, mint green, baby blue.
- Delicate stars, flowers, garden details, water, wings, flowing fabric.
- Elegant serif title at the bottom.
- Roman numeral or court label centered at the top.

## Avoid

- Do not use emoji-based card faces.
- Do not use abstract geometric symbols as the main art.
- Do not use simple CSS icon/mannequin placeholders for finished Tarot faces.
- Do not make the cards dark, gothic, harsh neon, or app-icon-like.
- Do not only adjust colors/borders/shadows if the center art is still placeholder-like.

## Implementation Notes

- Keep Tarot draw logic, spread layout, spread tabs, card names, and meanings unchanged.
- The card face rendering logic is in `index.html` and mirrored to `public/index.html`.
- The key renderer is `buildTarotLineArt(card)`, called by `buildCardScene(card)`.
- For finished important cards, return:
  - `<div class="tarot-painted-scene"><img src="assets/tarot/...png" alt=""></div>`
- Root `index.html` and `public/index.html` must stay synchronized for this static Pages workflow.

## Prompt Pattern For More Card Art

Use image generation for additional finished cards. Prompt in this direction:

> Create a soft pastel storybook tarot illustration for [CARD NAME], matching a gentle pastel tarot deck reference style: cream/off-white tarot aesthetic, delicate hand-drawn fairytale linework, watercolor texture, dreamy low contrast. Use lavender, blush pink, pale yellow, mint green, baby blue, and warm ivory accents. Make a full illustrated tarot scene with characters, landscape, flowers/stars/water/wings as appropriate. No typography, no watermark, no harsh neon, no gothic mood, no abstract icon, no flat app icon, no symbol-only composition. Vertical tarot inner art panel; the website frame supplies the border and title text.

## Accepted Example

The user approved the generated/wired style after the three problem cards were replaced with actual pastel illustrations. Quote from user: "that is perfect."
