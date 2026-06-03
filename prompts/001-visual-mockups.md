# Visual Mockups & Diagrams Prompt — WC 2026 Sticker Scanner

A reusable, self-contained prompt for generating mockups, diagrams, comparisons, and
other visuals for this project. Paste it into an image/diagram-capable model (or a
visual companion tool) and fill in the `>>> ASK <<<` block at the bottom for the
specific artifact you want.

---

## Context (always include)

You are a product designer + frontend architect helping visualize a **mobile-first web
app** for scanning the backs of duplicate **Panini World Cup 2026** stickers.

Core facts:

- **Primary device:** a phone held in one hand, used one-handed while the other hand
  holds a sticker up to the camera. Design for portrait, ~390×844 logical px, with
  thumb-reachable controls in the bottom third.
- **Tech stack target:** React + TypeScript + Vite, browser MediaDevices camera,
  Tesseract.js-style OCR behind an adapter, IndexedDB local-first storage.
- **Sticker code domain:** `<PREFIX><NN>` where PREFIX is a 3-letter country/team code
  and NN is 01–20 (e.g. `ARG01`, `USA13`, `FWC07`). The code sits near the **top-right
  corner** of the sticker back. Most stickers are portrait; some team stickers are
  landscape.
- **Tone:** fast, forgiving, utilitarian. OCR is unreliable, so confirm/correct must be
  effortless. Privacy-local: images never leave the device in the MVP.

## Screens & flows to cover

1. **Welcome / session** — "What's your name?" entry; resume existing session.
2. **Camera permission states** — prompt, granted, denied/blocked, no-camera fallback.
3. **Live scan view** — camera preview with a fixed **scan-area overlay** and an
   emphasized **top-right region-of-interest (ROI)** target box; subtle guidance text.
4. **Detection result** — proposed code + confidence + captured thumbnail, with
   Confirm / Correct / Skip / Rescan actions.
5. **Manual entry** — fallback keypad/segmented input for PREFIX + NN.
6. **Collection list** — confirmed scans: code, captured time, thumbnail, duplicate
   count badge; per-row edit/delete; "add manually" affordance.
7. **Export** — choose text vs JSON/ZIP; summary (user, session, totals, counts by code).

## Diagram types to support

- **User-flow diagram** of the 10-step journey (open → name → permission → scan → detect
  → confirm/correct → store → manage → export).
- **OCR pipeline diagram:** capture frame → crop top-right ROI → preprocess → OCR adapter
  → parse candidates → normalize → validate (prefix + 01–20) → rank → present. Show the
  follow-up **rotation** branch (try 0/90/180/270°) as an extension point.
- **Data model / ER diagram:** Session (id, userName, createdAt, updatedAt) → Scan
  (id, sessionId, normalizedCode, count, imageRef, createdAt, source: ocr|manual).
- **Component/module boundary diagram:** UI ↔ OCR adapter ↔ parser/validator ↔
  persistence adapter, emphasizing testable seams.

## Output expectations

- Mobile mockups: annotated wireframes, light theme, clear primary action per screen.
- Comparisons: present 2–3 labeled variants side by side with one-line trade-offs.
- Diagrams: prefer clean boxes-and-arrows; emit Mermaid source when text-only.
- Keep it legible at phone size; call out tap targets and the ROI box explicitly.

---

## >>> ASK <<<

Produce: `{e.g. "the live scan view, 2 overlay variants side by side"}`

Constraints / focus: `{e.g. "show ROI box prominence A/B; bottom-thumb controls"}`

Format: `{mockup | comparison | flow-diagram | er-diagram | pipeline-diagram}`
