---
name: Page IA and content placement
overview: Align presets, synthetic clients, and the deterministic generator so each page type carries the right business content (contact details, form placement, team/about copy, services depth, work/projects) in predictable sections—not only which ReactBits components appear, but which ClientBrief fields render where.
---

# Page IA, required content, and placement

## Pipeline reminder (unchanged)

Preset `pages[]` → per-page `type` → [`pickSectionVariant`](DemoCLI/generators/project/page-builder.cjs) + [`PAGE_POLICY`](DemoCLI/generators/project/page-policy.cjs) → section builders → [`buildPageContent`](DemoCLI/generators/project/content-builder.cjs) merges `page.content` into the same `content` object used by all sections on that page.

## Target: “content contract” per page type

What you want is explicit **required fields** and **layout placement** so users and synthetic data always fill the right slots.

### Contact (`type: contact` — section `contact`)

| Block | Source today | Desired / gap |
|--------|----------------|-----------------|
| Heading | `content.contact.heading` from [`buildContactContent`](DemoCLI/generators/project/content-builder.cjs) (`Contact ${brand}`) | OK |
| Email / phone / address | `clientBrief` via `content.contact` | **Gap:** if brief is empty, section shows only generic line; no prompt to fill. **Fix:** QA or preset validation: contact page requires at least one of email, phone, location (or show structured placeholders from synthetic). |
| Contact form | Always in [`buildContactSection`](DemoCLI/generators/project/page-builder.cjs) (right column) | OK — form is always present |
| FAQs | `content.faqs` when merged from `page.content` | OK for contact; [`validatePageContentBoundary`](DemoCLI/generators/project/page-policy.cjs) already flags FAQs on wrong page type |
| Social | Footer only [`buildFooterContent`](DemoCLI/generators/project/content-builder.cjs) | **Optional:** duplicate or link social on contact column for parity with real sites |

### About (`type: about` — section `about`)

| Block | Source today | Desired / gap |
|--------|----------------|-----------------|
| Story | `content.about` from brief (`heading`, `body`, `highlight`) | OK |
| Team / people | `content.teamMembers` from `page.content` only (`about` or `custom`) | **Gap:** no separate “founder” vs “team” in `ClientBrief`; synthetic fakes names. **Fix:** extend brief + UI + `buildPageContent` for optional `founder` or `leadership` block; or document that `teamMembers` is the single people list. |
| Placement | Single [`buildAboutSection`](DemoCLI/generators/project/page-builder.cjs) grid (text + image column) | OK |

### Services (`type: services` — section `services`)

| Block | Source today | Desired / gap |
|--------|----------------|-----------------|
| Service rows | `content.features.items` after [`buildPageContent`](DemoCLI/generators/project/content-builder.cjs) maps `page.content.services` | OK when preset/synthetic fills `services` on services page |
| Selected component | If nav picks a heavy component, section can be **component-only** and skip rows | **Gap:** easy to lose textual service list. **Fix:** policy or builder rule—always render at least a short intro + rows, or merge component below copy |

### Work / projects (`type: custom` often “Work”, or section `work`)

| Block | Source today | Desired / gap |
|--------|----------------|-----------------|
| Projects | [`buildWorkSection`](DemoCLI/generators/project/page-builder.cjs) uses `content.features.items` for card titles or component JSX | **Gap:** synthetic Portfolio “Work” page is `custom`; relies on global features list, not a dedicated `projects[]` in `page.content`. **Fix:** add `page.content.projects` (or reuse `services` shape) and teach `buildPageContent` + `buildWorkSection` to prefer it on work/custom pages. |
| Imagery | Placeholders | OK |

### Home (`type: home`)

| Block | Typical sections | Hero uses global brief; features/benefits/cta use parsed services + `keyBenefits` | **Gap:** multi-page home still shares same footer links as single-page—[`buildFooterContent`](DemoCLI/generators/project/content-builder.cjs) uses `#slug` links, not React Router paths. **Fix:** pass `pages` into footer builder for multi-page and emit `to="/contact"` style links. |

---

## Synthetic client alignment (from prior analysis)

- [`buildPages`](DemoCLI/synthetic-client/local-generator.cjs): Portfolio has no **Contact** route; SaaS has no **Pricing** route—add pages so the content contract above has a route to live on.
- Synthetic [`buildPageContent`](DemoCLI/synthetic-client/local-generator.cjs) `sections[]` is **not** consumed by the generator—either document or wire (separate todo).

---

## Implementation backlog (focused on your ask)

1. **Contact page contract** — Validation + synthetic defaults so email/phone/location are non-empty when a contact page exists; optionally surface `socialLinks` in the contact column.
2. **About page contract** — Optional `ClientBrief` / `page.content` fields for founder vs team; map into `buildAboutSection` (second block or extended team grid).
3. **Services page contract** — Ensure textual service list is not dropped when a large component wins the slot; merge order: copy first, component second (or split sections).
4. **Work / projects contract** — `page.content.projects` (or equivalent) + `buildPageContent` + `buildWorkSection` consumption; synthetic Portfolio Work page fills it from `copy` / case study lines.
5. **Footer / nav links on multi-page** — Replace `#` footer links with real routes from `pagesConfig` when `isMultiPage`.
6. **Docs** — Short “Page type → required brief fields → section placement” table in [`DemoCLI/USAGE.md`](DemoCLI/USAGE.md) or preset help.

## Todos (execution order when you leave plan mode)

- [ ] `contact-page-contract` — Validate + default contact fields; optional social in contact section
- [ ] `about-founder-team` — Extend brief + `buildPageContent` + about section for founder/team semantics
- [ ] `services-never-text-only-loss` — Adjust `buildServicesSection` when `componentName` is set
- [ ] `work-projects-page-content` — `projects` in page content + builder + synthetic Portfolio
- [ ] `footer-multipage-routes` — Footer links use router paths when multi-page
- [ ] `synthetic-pages-ia` — Portfolio Contact page; SaaS pricing or variant (from prior IA plan)
- [ ] `docs-page-content-matrix` — Document contracts for authors
