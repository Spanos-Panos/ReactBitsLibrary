# Practice Site 01 — Client brief: Frame & Datum Ltd

**Document type:** Creative / web brief (simulated commission)  
**Prepared for:** You (contractor)  
**Prepared by:** Client stakeholder (simulated)  
**Version:** 1.0  
**Date context:** 2026  

---

## Why this brief exists (market grounding)

Before writing this, the “client” assumed how real buyers behave in 2025–2026:

| Source of pressure | What it means for your build |
|-------------------|------------------------------|
| **Marketplace buyers** (Fiverr, Contra, etc.) | They expect **named deliverables** (source files, formats, revision boundaries, commercial use, timeline). Vague “modern website” loses to sellers who list exactly what ships. |
| **B2B creative studios** (archviz, CGI, product viz) | Buyers skim on **mobile between meetings**. Heavy hero galleries are normal, but **slow LCP and layout shift** read as “sloppy production” — the opposite of the brand promise. |
| **Lead quality** | Studios do not want **every** inquiry; they want **brief-ready** leads (project type, timeline, budget band). The site should **filter** as much as **attract**. |
| **Trust** | SSL, working contact paths, credible copy, and **legal/privacy stubs** matter even for a v1 brochure site. Missing footer trust signals feels amateur to corporate procurement. |

This brief is intentionally **tighter than a hobby tutorial** and **looser than an enterprise RFP** — similar to a disciplined small-business commission.

---

## About the client (read as if they emailed you)

### Who we are

**Legal name:** Frame & Datum Ltd (fictional — treat as real for this exercise)  
**What we sell:** Architectural visualization — stills, short films, and VR-style flythroughs for **residential developers** and **boutique architecture practices** in the UK and EU.  
**Team size:** 6 people (2 art directors, 4 artists). No in-house web developer.  
**Current pain:** Our site is a **dated Squarespace template** from 2019. It loads slowly on phones, our **best work is buried**, and we lose leads because the **contact path** feels like an afterthought. Competitors with worse reels have **clearer positioning** and win RFP shortlists.

### What success looks like (12 months)

- **Primary:** Increase **qualified** project inquiries (we can measure: form submissions that include budget band + timeline — fields we want on the form).
- **Secondary:** Reduce time spent answering “what formats do you deliver?” and “what’s your process?” — those answers should live on the site in **FAQ + Process**.
- **Tertiary:** A site we are **not embarrassed** to put on the last slide of a deck when pitching a €2–8M residential scheme.

### Who the site is for (ICP)

1. **Development project managers** (35–55, time-poor, risk-averse).  
2. **Associate-level architects** compiling **three bids** for a partner — they need **fast comprehension**: sector fit, output types, turnaround philosophy.

### Competitors we mentally compare ourselves to (fictional names)

- **Northline Viz** — ultra-minimal, fast site, weak storytelling.  
- **Lumen Foundry** — flashy WebGL hero, slow on mid-tier phones — we **do not** want that trade-off.  
- **Cartograph Studio** — dense portfolio, feels “premium” but **contact is buried** — we want the opposite lesson.

### Brand and tone

- **Voice:** Confident, calm, precise. Short sentences. No hype adjectives (“world-class”, “revolutionary”).  
- **Visual:** Editorial, **image-led**, generous whitespace. One **accent** color only; neutrals carry the structure.  
- **Motion:** Restrained. If you animate, it must respect **`prefers-reduced-motion`**.

### Things we actively dislike (“you will hear this in feedback”)

- **Generic AI tone** in headlines (“Unlock the future of visualization”).  
- **Mystery meat navigation** (icons without labels for primary nav).  
- **Tiny contrast** grey-on-grey body copy.  
- **Auto-playing video with sound** (instant rejection).  
- **Fake metrics** (we do not claim “500+ projects” unless you invent plausible fictional stats and we explicitly approve — **default: no fake numbers**).

---

## Scope of work (what you are delivering)

### In scope — single-page marketing site (section-based)

Ship as a **production-ready** static or Vite-based site (your stack choice), deployable to **Netlify / Vercel / similar** or hand-offable as a **zip + Git**.

**Required sections (anchors from one nav):**

| # | Section | Job to be done |
|---|---------|----------------|
| 1 | **Nav + primary CTA** | Always visible path to “Start a project”. |
| 2 | **Hero** | In **one screen** (mobile + desktop): who we are, what we sell, why we fit **developer + architect** audiences, **two** CTAs (primary: start project; secondary: view work). |
| 3 | **Capabilities** | 3–5 **outcome-led** tiles (e.g. “Planning-stage massing”, “Marketing launch stills”) — not software feature lists. |
| 4 | **Selected work** | **6** projects. Each: title, sector tag, year, **one** line of outcome, hero thumb. Interaction: **modal OR inline expand** (your choice) with **2–3 extra lines** + image (no separate CMS). |
| 5 | **Process** | 4 steps from kickoff to delivery — written so a PM can **forward the link** to their boss. |
| 6 | **Deliverables & formats** | Short, scannable list (files, revisions policy **as we describe below**, typical turnaround **ranges** framed honestly as “indicative”). |
| 7 | **Social proof** | **3** testimonials. You may use **fictional** names and companies if each carries a **believable** role + project type. Label in README if fictional. |
| 8 | **FAQ** | Minimum **6** questions covering: timelines, revisions, NDA, file formats, on-site photography, **how we qualify projects**. |
| 9 | **Contact / inquiry** | Fields: **Full name**, **Work email**, **Company**, **Project type** (select), **Budget band** (select), **Desired start** (approx month), **Message**. **Client-side validation** + accessible error text. Success state after submit. |
| 10 | **Footer** | Address block (use a **clearly fictional** London-style address or “Address supplied at handoff”), email, LinkedIn placeholder, **Privacy** + **Terms** (see legal note). |

### Out of scope (do not build unless you want stretch conflict)

- CMS, blog, careers portal, client login.  
- Real payment.  
- Backend form endpoint — **not required** for this exercise; use a pattern you document (e.g. `mailto:` with limitations, or Formspree-style placeholder with env var). **The client cares that the UX is real and honest**, not that SMTP is wired on day one.

### Legal / privacy (v1 practice standard)

Provide **short** Privacy + Terms pages or on-page modals (static copy is fine) covering: data you collect via the form, retention “TBD / client to finalize with counsel”, cookies if you add analytics later. This is **practice copy**, not legal advice — but the **habit** matters for real clients.

---

## Business rules we will judge you on

### Revision policy (simulated contract)

Assume **two rounds** of structured feedback on **layout + copy** after first delivery. “Unlimited revisions” is **not** in scope — scope creep should be **blocked by clear brief** (this document).

### Content ownership

- You may use **Unsplash / Pexels / own placeholders** — document URLs and licenses in `CREDITS.md`.  
- Any **ReactBits** or third-party UI: document license/attribution requirements the same way.

---

## Technical and quality bar (general — must pass)

### UX / IA

- [ ] **One** primary CTA concept sitewide (wording may vary slightly).  
- [ ] Mobile navigation is **obvious** (hamburger is acceptable if labeled for screen readers).  
- [ ] No horizontal scroll at common breakpoints (375 / 390 / 768 / 1280).  
- [ ] Form: labels, errors, focus order, submit loading/disabled state.

### UI / visual

- [ ] **8-point** (or documented) spacing rhythm; no random margins.  
- [ ] Max **two** font families; comfortable measure for body copy.  
- [ ] **WCAG 2.1 AA** contrast for body text and interactive states (including **focus-visible**).

### Performance (we will open DevTools and Lighthouse mentally)

- [ ] Hero **LCP** image: intentional priority; dimensions or aspect-ratio to **avoid CLS**.  
- [ ] Below-fold imagery: **lazy** loaded.  
- [ ] No multi-megabyte assets in repo without strong justification.

### SEO / sharing

- [ ] Unique `<title>` and meta description.  
- [ ] Open Graph tags + **one** `og:image` that exists in build output.

### Code hygiene

- [ ] `README.md`: install, run, build, env vars, form behavior, known gaps.  
- [ ] `CREDITS.md` or README section: fonts, images, libs.  
- [ ] No secrets committed.

---

## Advanced bar (how you earn a “strong pass”)

- [ ] **INP / interaction** stays light — no heavy scroll jank on mid-tier mobile.  
- [ ] **Reduced motion** path tested (macOS / Windows setting).  
- [ ] **Print stylesheet** OR at least “prints without broken nav” — bonus only.  
- [ ] **404** route if SPA.  
- [ ] **Self-review.md**: 10 bullets — what you’d change with +40% budget.

---

## Deliverables checklist (what you hand in at the end)

Use this as the **invoice line items** mindset.

| # | Deliverable | Required |
|---|-------------|----------|
| 1 | Source project (Git or zip) | Yes |
| 2 | `README.md` (run, build, deploy notes) | Yes |
| 3 | `CREDITS.md` or equivalent | Yes |
| 4 | Production build passes locally | Yes |
| 5 | Deployed URL **or** screenshot pack (see below) | One of the two |
| 6 | `SELF_REVIEW.md` | Yes |

**Screenshot pack (if no deploy):** minimum **8** images — mobile + desktop for: hero, work grid, modal/detail, form error state, form success, footer/legal.

---

## Final review — pass / fail (when you send to a reviewer)

**Pass (ship to stakeholder):** All **In scope** sections present; **General** checklist ≥ 90%; no broken mobile layout; README + credits complete; copy does not read as generic AI; form UX is honest about backend.

**Conditional pass:** Visual strong but **one** accessibility or performance gap documented with fix ETA in `SELF_REVIEW.md`.

**Fail (expect revision notes):** Generic headline soup; contact buried; contrast failures; huge unoptimized images; missing meta/OG; README missing; horizontal scroll on mobile.

---

## Client sign-off block (for your practice)

**Client name:** Frame & Datum Ltd (fictional)  
**Approver:** Jordan Ellis, Studio Director (fictional)  
**Approved brief:** v1.0 — single-page marketing site as specified above.

---

*This document is a training artifact for your portfolio pipeline. It is not legal, financial, or architectural advice.*
