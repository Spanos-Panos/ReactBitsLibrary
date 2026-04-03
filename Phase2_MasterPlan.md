# ReactBits Phase 2: High-Fidelity App Architect 🔥

**The Core Goal**: 
Move the pipeline from creating generic "demo layouts" to crafting **premium, high-quality frontend applications** that feel immediately complete.

To achieve this, we need to focus purely on "Frontend Context Enhancement" across three stages:

---

## 1. Enrich the Original Prompt (Before it hits Haiku)
Right now, the text box is just a simple string. We need to silently give Haiku rules on what constitutes a "good design". 
* **Backend System Context Injection**: We need to expand the system prompt in `electron/promptEnhancer.cjs`.
* **Rules to add**: 
  - Color harmony (e.g., forcing HSL or coherent HEX palettes instead of raw primary colors).
  - Modern spacing/padding constraints (forcing breathable whitespace).
  - Explicit styling mandates (glassmorphism rules, neumorphism shadows, etc).

## 2. Elevate the Enhanced Prompt (Haiku's Output)
Currently, Haiku spits out a `JSON` file. This works for computers, but Large Language Models (like Sonnet 4-6) are trained to read and comprehend rich **Markdown** incredibly well.
* **Format Switch**: Let's stop generating `enhancedPrompt.json` and start making Haiku write a fully fleshed out `DESIGN_SYSTEM.md` or `PRD.md`.
* **Required Blueprint Details**:
  - The generated file must explicitly list **Google Fonts** to import.
  - It must list out the exact `tailwind.config` hex codes to use.
  - It needs to contain instructions for generating highly realistic filler text (instead of "lorem ipsum").
  - Clear architectural layout (e.g., CSS Grid vs Flexbox).

## 3. Supercharge Claude Code CLI (`CLAUDE.md`)
This is where Sonnet 4-6 natively runs. Currently, we just say: *"Read the file, build the UI, and STOP."*
* **Skill Injection**: We need to teach the native Claude Assistant *how* to use its tools.
* **Directives to Add**:
  - *"Rule #1: Create new folders in `src/components/layout/` to wrap our injected ReactBits components."*
  - *"Rule #2: Verify all Hex codes from the Design System before applying them."*
  - *"Rule #3: You are allowed to use `/tools` like terminal commands if you need to double-check file paths."*

---

### 🤔 Things to Think About Before We Start:
1. **User Interface**: Do you want to add dropdowns to the desktop app for "Select Vibe" (e.g., Cyberpunk, Sleek, Neumorphism) and "Select Primary Color", or keep just the one text box?
2. **Output Formatting**: Are you okay with retiring the `.json` approach and moving to a Markdown-style brief for the AI hand-off to make it strictly read like a professional product requirements document?
