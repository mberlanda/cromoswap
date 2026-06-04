# UX Package - WC 2026 Sticker Scanner

Status: draft v0.1  
Date: 2026-06-04  
Scope: UX, visual direction, and static mockups only. No application code changes.

This folder defines the first user experience direction for the sticker scanner app. It is
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
- [Static Mockup Board](mockups/index.html)

## UX Direction

The core experience is:

```text
Name -> Camera permission -> Scan -> Confirm or correct -> Saved list -> Export
```

Design principles:

- One-handed mobile use first.
- Fast collector workflow, with low-friction correction.
- Friendly language without feeling childish.
- Privacy-local confidence: images stay on the device in the MVP.
- OCR transparency: show what was detected and let the user fix it quickly.
- Durable collection data: counts, duplicates, and exports are visible and predictable.

## Self-Review Summary

This v0.1 package covers:

- Primary journeys for collectors, kids, returning users, OCR failures, and export.
- MVP flows and user stories aligned with `docs/specs/00-product-spec.md`.
- A first visual system with colors, typography, spacing, controls, and states.
- A standalone HTML/CSS mockup board covering the main app surfaces.

Known next UX work:

- Test the scan overlay against real sticker-back photos.
- Validate language with children and non-technical collectors.
- Decide whether the app needs a lightweight "batch mode" after the first prototype.
- Create high-fidelity implementation components once the React app exists.
