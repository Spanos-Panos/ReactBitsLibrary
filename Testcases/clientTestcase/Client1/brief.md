# CLIENT PROJECT BRIEF — AXIOM STUDIO

---

## 01. WHO WE ARE

**Studio name:** AXIOM  
**Tagline:** *Motion. Direction. Obsession.*  
**Industry:** Motion design, creative direction, and brand film production  
**Location:** Berlin, Germany  
**Founded:** 2019  
**Team size:** 7 people  

We are a boutique motion design studio. We do not take on every project — we take on the right ones. Our clients are fashion houses, tech startups that care about craft, and music labels. We turn briefs into obsessions.

Our current site is embarrassing. It looks like a Squarespace template from 2017. We need something that reflects what we actually do.

---

## 02. WHAT THIS SITE NEEDS TO DO

1. Make potential clients feel something within the first 3 seconds
2. Showcase 4–5 selected past projects (not a full portfolio dump — curated)
3. Explain what we do and who we do it for
4. Get people to email us — that's the ONLY call to action
5. Function on desktop first. Mobile is secondary. We accept this tradeoff.

**One page. Scroll experience. No routing, no sub-pages.**

---

## 03. STYLE

This is non-negotiable. If you miss this, the whole thing is wrong.

**Aesthetic:** Dark. Cinematic. Editorial. Not "tech startup dark" with gradients everywhere — I mean a film poster at 2am kind of dark. Think A24, not SaaS.

**What I want to feel:** Controlled. Precise. A little unsettling in a good way. Like the studio knows exactly what it's doing and doesn't need to explain itself.

**What I absolutely do NOT want:**
- Blue-to-purple gradients anywhere
- Cards with rounded corners and drop shadows
- "Glassmorphism" or frosted panels
- Hero text that says anything vague like "We create experiences" or "Elevating brands"
- Animations that feel "fun" or "bouncy" — everything should feel deliberate and weighted
- Stock-photo-looking placeholder content
- A sticky navigation bar at the top

**Layout feeling:** Generous whitespace (or rather, *darkspace*). Sections that breathe. Not cluttered. Not busy.

---

## 04. COLORS

**I have a palette. Use it.**

| Role | Hex | Notes |
|------|-----|-------|
| Background | `#080808` | Near-black, not pure black |
| Primary text | `#E8E4DC` | Warm off-white, not #ffffff |
| Accent | `#C8A96E` | Muted gold — used sparingly, maximum 3–4 elements |
| Secondary text | `#5A5A5A` | For labels, metadata, small UI |
| Surface / card | `#111111` | If you need a slightly raised surface |

**Color rules:**
- The gold (`#C8A96E`) appears on: the studio name in the hero, one rule/divider line, and the email CTA button. Nowhere else.
- Do not invent new colors. Do not add transparency layers on these colors.
- Do not use white (`#ffffff`) anywhere — only the warm off-white.

---

## 05. TYPOGRAPHY

**I have specific fonts. Load them from Google Fonts.**

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Heading | `Cormorant Garamond` | 300 (light) | H1, H2 only — large, elegant, editorial |
| Body | `DM Sans` | 400 | All body text, paragraphs, metadata |
| Accent / label | `Space Mono` | 400 | Small caps labels, section numbers like `01.`, `02.` — maximum 10% of text |

**Typography rules:**
- H1 must be large. At minimum `clamp(5rem, 12vw, 10rem)`. I want it to feel oversized.
- Letter-spacing on headings: `-0.03em`
- Line-height on headings: `0.9` — tight
- Body text: `1.1rem`, line-height `1.7`
- Section labels (like `01.`, `02.`, `SELECTED WORK`): Space Mono, uppercase, `0.7rem`, letter-spacing `0.15em`, color `#5A5A5A`

---

## 06. COMPONENTS

**This is where I need your input too.** I know the tool has specific components available. Here's what I want and what I'll leave to you:

### I want these specifically:
- **Something atmospheric as the background** — I want the page to feel alive without being distracting. Should be dark and subtle. Whatever background component you think fits this aesthetic best — NOT colorful, NOT pulsating rainbow colors. Subtle motion only.
- **A text animation for the studio name in the hero** — "AXIOM" displayed large with some kind of reveal or shine effect. Not a bounce, not a typewriter. Something refined.

### I'll let you decide:
- The hero component — I want something that commands attention. Physics-based, interactive, or cinematic. Surprise me. But it has to justify its presence.
- One component to act as a visual divider or motion element between sections — something that creates a sense of movement between the work section and the about section.

### I do NOT want:
- Any cursor-following effects (cursor trails, blob cursors, etc.) — we find them gimmicky
- Any carousels or auto-playing sliders
- Navigation components — we don't have navigation, it's one page

---

## 07. CONTENT / COPY

> See `content.md` for all text content — use it verbatim. Do not write placeholder copy.

---

## 08. PROJECT STRUCTURE

**5 sections in this order:**

1. **HERO** — Full viewport. Studio name. Tagline. The atmospheric background lives here and throughout.
2. **SELECTED WORK** — 4 project cards. Titles, year, category. No images (intentional — we're mysterious about unreleased work).
3. **WHAT WE DO** — Short paragraph about services + a 3-item list.
4. **ABOUT** — Two-sentence manifesto + founding year + team size.
5. **CONTACT** — The email, big. Nothing else.

---

## 09. WHAT I'M LEAVING TO YOU

- Exact component props and configuration — you know the components better than I do
- Spacing between sections — follow the editorial feeling
- Any micro-interactions beyond the entrance animations
- The exact hero component (within the aesthetic constraint above)

---

## 10. WHAT SUCCESS LOOKS LIKE

If I open this site and feel like we made it — not a tool made it — that's success. If it looks like a template, we start over.

**The site should feel like it could be a case study on Awwwards. Dark category.**

---

*Brief prepared: 2026-04-20*  
*Contact for questions: hello@axiom.studio*
