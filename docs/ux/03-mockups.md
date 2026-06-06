# Mockup Specifications

Status: draft v0.2
Date: 2026-06-05

The static mockup board lives at:

```text
design-system/index.html
```

Open it directly in a browser. It has no external dependencies and does not require a dev
server. The generated SVG/JPEG mockups live in `design-system/mockups/`.

## Mockup Coverage

The board includes seven primary mobile screens:

1. Start, resume, or import.
2. Import text or JSON.
3. Live scan with centered sticker frame.
4. My Album team All/Clear.
5. My Reps counter grid.
6. Collection list.
7. Export summary.

It also includes color-scheme cards, reusable component samples, and links to
implementation-facing CSS, JSON, SVG, and mockup assets.

## Screen 1: Start, Resume, Import

Intent:

- Make returning users fast.
- Put import beside resume because both recover previous work.
- Keep new-session creation deliberate and short.

Key UI:

- Product name.
- Resume card with scan and album counts.
- Import JSON and Import text actions.
- Name input.
- Primary start button.
- Local/privacy note.

Review questions:

- Is resume prominent enough for returning users?
- Does import feel like recovery, not a hidden advanced feature?
- Can a kid understand the first action?

## Screen 2: Import

Intent:

- Restore JSON backups without overwriting.
- Merge text exports with clear semantics.
- Handle ambiguous text before making changes.

Key UI:

- JSON restore card.
- Text merge card.
- Detected import summary.
- Choose file and confirm actions.

Review questions:

- Is the difference between restore and merge clear?
- Does blue vs amber map to information vs review?
- Does the screen feel non-destructive?

## Screen 3: Live Scan

Intent:

- Make sticker placement obvious.
- Tie the OCR ROI to the sticker frame.
- Give immediate confidence via the green targeted state.

Key UI:

- Camera preview simulation.
- Centered sticker outline.
- Nested top-right ROI target.
- Targeted status badge.
- Bottom controls for orientation, size, and pause.

Review questions:

- Does the centered frame look like the physical sticker?
- Is the ROI still visually tied to the code corner?
- Does the green targeted state read as success rather than save/confirm?

## Screen 4: My Album

Intent:

- Speed up mostly-complete team marking.
- Preserve the simple binary checklist model.

Key UI:

- Team cards grouped by album group.
- Owned and missing chips.
- Compact All pill when incomplete.
- Compact Clear pill when complete.
- Owned/missing export actions.

Review questions:

- Is the All/Clear pill visible without dominating the team header?
- Can users infer the workflow: All, then untick missing stickers?
- Does read-only leaderboard usage remain visually compatible?

## Screen 5: My Reps Grid

Intent:

- Count duplicates quickly using the album mental model.
- Keep grid data tied to existing scan rows.

Key UI:

- Scan/Grid view switch.
- Tap-mode segmented control.
- 0 to 7 count chips.
- Amber spare badges.
- Cap ring at seven.

Review questions:

- Is the active tap mode unmistakable?
- Are zero, one, duplicate, and capped counts distinguishable at a glance?
- Does the grid avoid feeling like a separate album feature?

## Screen 6: Collection List

Intent:

- Preserve row-level review, editing, deletion, thumbnails, and source metadata.
- Keep it secondary to the grid for fast duplicate counting.

Key UI:

- Stats row.
- Scan rows with code, source, time, count, and thumbnail.
- Add, scan more, and export actions.

Review questions:

- Are codes easier to scan than timestamps?
- Are manual entries visible without feeling penalized?
- Does the row list still justify its place after the grid exists?

## Screen 7: Export

Intent:

- Make text export the fastest sharing path.
- Position JSON as a restorable personal backup.
- Keep import compatibility visible through predictable summaries.

Key UI:

- Session summary.
- Text export primary action.
- JSON backup secondary action.
- Privacy note for image-backed JSON.

Review questions:

- Is text clearly the sharing format?
- Does JSON sound useful but not required?
- Is the export metadata consistent with import detection?

## Responsive Notes

Mobile portrait is the primary target. Tablet and desktop should use the same core
screens in a centered app frame, with album and reps grids allowed to widen first.

Implementation guidance:

- Keep scan preview aspect ratio stable.
- Keep primary actions in the bottom third.
- Avoid UI that shifts when status text changes.
- Keep code text and chip sizes fixed.
- Use scroll for grid-heavy screens, not the scan target itself.

## Self-Review

Checked in this draft:

- June 5 CX specs are represented in screens.
- Import and export are visually connected.
- Album and reps grids share structure but not semantics.
- Scanner targeting uses the approved centered frame and nested ROI.
- Visual system avoids a single-hue theme.
- Tap targets are large enough in the mockups.

Needs validation with real materials:

- Scanner contrast in bright and dim rooms.
- Whether the green targeted frame is obvious during movement.
- How quickly children understand the reps tap mode.
- Whether import detection copy is clear with real exported files.
