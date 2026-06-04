# Mockup Specifications

Status: draft v0.1  
Date: 2026-06-04

The static mockup board lives at:

```text
docs/ux/mockups/index.html
```

Open it directly in a browser. It has no external dependencies and does not require a dev
server.

## Mockup Coverage

The board includes seven primary mobile screens:

1. Welcome and session start.
2. Camera permission and fallback.
3. Live scan view.
4. Detection confirmation.
5. Manual correction.
6. Collection list.
7. Export summary.

It also includes a compact design-token strip for the first visual system.

## Screen 1: Welcome And Session

Intent:

- Start or resume quickly.
- Make privacy feel simple and local.
- Set a collector-friendly tone without a landing page.

Key UI:

- App name.
- Short value statement.
- Name input.
- Primary start button.
- Resume summary.
- Local privacy note.

Review questions:

- Is resume prominent enough for returning users?
- Does the screen avoid marketing fluff?
- Can a kid understand what to do first?

## Screen 2: Camera Permission

Intent:

- Explain why camera access is needed.
- Make manual entry feel like a supported path.
- Handle denied or unavailable camera without ending the session.

Key UI:

- Camera access request.
- Primary allow action.
- Manual entry fallback.
- Short privacy note.

Review questions:

- Is the permission ask understandable before the browser prompt?
- Does manual entry feel normal instead of second-class?
- Is the local image promise visible without being heavy?

## Screen 3: Live Scan

Intent:

- Make the sticker placement obvious.
- Make the top-right ROI unmistakable.
- Keep actions thumb-reachable.

Key UI:

- Camera preview simulation.
- Sticker outline.
- Amber ROI target.
- Status chip.
- Bottom controls: manual, pause, collection.

Review questions:

- Does the ROI feel like the most important part of the overlay?
- Is the bottom control area reachable without covering the sticker?
- Would this still work in imperfect lighting?

## Screen 4: Detection Confirmation

Intent:

- Show the detected code clearly.
- Let the user save or correct without hesitation.
- Avoid storing OCR output silently.

Key UI:

- Large normalized code.
- Confidence status.
- Captured evidence crop.
- Save, Correct, Rescan, Skip.

Review questions:

- Is Save clearly the primary action?
- Is Correct close enough for fast OCR fixes?
- Does the thumbnail help verify the code?

## Screen 5: Manual Correction

Intent:

- Make correction faster than typing the whole code again.
- Normalize prefix and number input.
- Support manual additions when camera is unavailable.

Key UI:

- Split prefix and number fields.
- Validated preview code.
- Number chips for common quick selection.
- Save action.

Review questions:

- Can the user change one character or digit quickly?
- Is validation understandable without technical language?
- Does it feel like a normal path rather than a failure path?

## Screen 6: Collection List

Intent:

- Review saved scans.
- Spot duplicates and mistakes.
- Add, edit, delete, and export.

Key UI:

- Total and unique counts.
- Duplicate highlight.
- Scan rows with code, source, time, count, thumbnail.
- Row actions.

Review questions:

- Are codes easier to scan than timestamps?
- Are duplicates visible without clutter?
- Does manual entry stay available?

## Screen 7: Export

Intent:

- Make text export the fastest share path.
- Explain JSON as backup/evidence.
- Summarize what will be downloaded.

Key UI:

- Session summary.
- Text export primary action.
- JSON export secondary action.
- Privacy note for images.

Review questions:

- Is text export clearly primary?
- Does JSON sound useful but not required?
- Is the export metadata predictable?

## Responsive Notes

Mobile portrait is the primary target. Tablet and desktop should use the same core
screens in a centered app frame, with the collection list allowed to widen first.

Implementation guidance:

- Keep scan preview aspect ratio stable.
- Keep primary actions in the bottom third.
- Avoid UI that shifts when status text changes.
- Keep code text large and fixed-height.
- Use scroll only for list-heavy screens, not the scan view.

## Self-Review

Checked in this draft:

- User journeys are represented in screens.
- Primary action is clear on each screen.
- OCR uncertainty has a normal correction path.
- Collection and export screens support future sharing data.
- Visual system avoids a single-hue theme.
- Tap targets are large enough in the mockups.

Needs validation with real materials:

- ROI placement against actual sticker-back photos.
- Contrast of overlay in bright and dim rooms.
- How quickly children understand "code in the corner".
- Whether collectors want a true batch mode after confirming many scans.
