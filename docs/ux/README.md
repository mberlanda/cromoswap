# UX Package - WC 2026 Sticker Scanner

Status: draft v0.2
Date: 2026-06-05
Scope: UX, visual direction, implementation-facing tokens, and static mockups.

This folder defines the user experience direction for the sticker scanner app. It is
written for two overlapping audiences:

- Collection-focused users who want to process a pile of duplicate stickers quickly.
- Kids and family users who need clear, forgiving steps and large tap targets.

The product should feel like a practical collecting tool, not a marketing site. The first
screen should help the user start or resume a collection session immediately.

## Artifacts

- [Product Overview And Journeys](00-product-overview-and-journeys.md)
- [Flows And User Stories](01-flows-and-user-stories.md)
- [Design System](02-design-system.md)
- [Mockup Specifications](03-mockups.md)
- [Static Design System And Mockup Board](../../design-system/index.html)

## UX Direction

The core experience is:

```text
Name -> Resume/import/create -> Scan or grid-count -> Album/reps review -> Export
```

Design principles:

- One-handed mobile use first.
- Fast collector workflow, with low-friction correction.
- Friendly language without feeling childish.
- Privacy-local confidence: images stay on the device in the MVP.
- OCR transparency: show what was detected and let the user fix it quickly.
- Durable collection data: counts, duplicates, and exports are visible and predictable.

## Self-Review Summary

This v0.2 package covers:

- Primary journeys for collectors, kids, returning users, OCR failures, import, and export.
- MVP flows and user stories aligned with `docs/specs/00-product-spec.md`.
- A visual system with colors, typography, spacing, controls, and states.
- Implementation-facing CSS/JSON color scheme assets.
- A standalone HTML/CSS design-system board covering the planned CX surfaces.

Known next UX work:

- Test the scan overlay against real sticker-back photos.
- Validate language with children and non-technical collectors.
- Validate the Reps grid tap-mode copy with real duplicate sorting.
- Create high-fidelity implementation components for import and Reps grid.
