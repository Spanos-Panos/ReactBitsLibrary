# AXIOM — BRAND ASSETS & VISUAL NOTES

---

## LOGO / WORDMARK

We do not have a logomark (icon/symbol). The brand is the wordmark: the word **AXIOM** set in Cormorant Garamond Light, all caps, with generous letter-spacing (`0.2em`).

**Do not create a logo SVG.** The studio name IS the logo. Render it as styled text in the hero.

---

## IMAGES

We are intentionally image-free on this site. No project thumbnails. No team photos. No hero image.

The aesthetic choice here is deliberate: we work in motion — stills don't represent us. The work section shows project titles, categories, and years only. If a component requires an image prop, use one of the provided joker placeholder images — but style it so it doesn't look like a placeholder (apply a strong dark overlay, desaturate, etc.).

**If any component absolutely requires an image:**
- Use `/joker-landscape.jpg` as the source
- Apply CSS: `filter: grayscale(1) brightness(0.3)` on the image
- Never use the image without this treatment

---

## DIVIDER / RULE STYLE

Between sections, use a thin horizontal rule:
- `1px solid #C8A96E` (gold)
- Width: `4rem`
- Do not center it — align left

This gold line should appear once between the hero and the work section, and once between the work and services section. Not between every section.

---

## WHAT GOOD LOOKS LIKE (REFERENCE AESTHETIC)

I cannot share links for legal reasons, but the aesthetic reference points are:

- **Typography feel:** Think of editorial spreads from Wallpaper* or Dazed — wide margins, large type, lots of breathing room
- **Motion feel:** Weight and gravity. Not spring physics. Not bouncy. If it bounces, it's wrong.
- **Section transitions:** Slow fade-in as sections enter viewport — not sliding, not scaling aggressively
- **Overall vibe:** If someone squints at the page, it should look like a film poster or a luxury lookbook, not a website

---

## FONTS — GOOGLE FONTS EMBED

Load these in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@400;500&family=Space+Mono&display=swap" rel="stylesheet">
```

---

## CSS VARIABLES TO SET

```css
--font-heading: 'Cormorant Garamond', Georgia, serif;
--font-body: 'DM Sans', sans-serif;
--font-accent: 'Space Mono', monospace;

--color-bg: #080808;
--color-text: #E8E4DC;
--color-accent: #C8A96E;
--color-muted: #5A5A5A;
--color-surface: #111111;

--max-width: 1320px;
--section-padding: clamp(6rem, 12vw, 14rem);
```

---

## THINGS I WILL REJECT

If I open the site and see any of the following, we will redo it:

1. Any color not in the palette (no blues, no purples, no red accents)
2. Cards with border-radius > 0 — all corners are sharp
3. Box shadows on anything
4. Sticky header or any persistent navigation
5. The word "portfolio" anywhere on the page — it's "selected work"
6. Any section that says "Get in touch" — it says "Work with us."
7. Emoji. Anywhere. Ever.
8. The font Inter, Roboto, or any system font as the primary typeface
