# Design System

Status: draft v0.1  
Date: 2026-06-04

## Design Position

The UI should feel like a focused collecting tool with a friendly surface:

- Practical for fast duplicate sorting.
- Clear enough for kids.
- Calm around OCR uncertainty.
- Mobile-first and one-handed.
- Privacy-aware without heavy legal language.

Avoid a generic SaaS dashboard look. The app is not a landing page. It is a tool used
around a table, in uneven light, with one hand holding a phone and the other holding a
sticker.

## Visual Language

Keywords:

- crisp
- bright
- trustworthy
- tactile
- quick
- forgiving

Reference mood:

- football pitch lines for scan overlays
- album checklist clarity for lists
- trading-card tactility for thumbnails
- camera app confidence for scanning

## Color Tokens

Use a light theme first. The palette should not be dominated by one hue. Green anchors
the scan action, blue supports information, amber signals review, and coral handles
destructive or blocked states.

```css
:root {
  --color-ink: #17211f;
  --color-muted: #60706b;
  --color-subtle: #d8e1dd;
  --color-paper: #f7faf8;
  --color-surface: #ffffff;
  --color-field: #eef4f1;

  --color-scan: #1f8a5f;
  --color-scan-strong: #12613f;
  --color-info: #2f74d0;
  --color-review: #f2b84b;
  --color-danger: #d94f4f;
  --color-privacy: #6d57c7;

  --color-camera: #202927;
  --color-overlay: rgba(255, 255, 255, 0.72);
  --color-roi: #f2b84b;
}
```

Semantic mapping:

- Primary action: `--color-scan`
- Secondary action: white surface with ink border
- Review or low confidence: `--color-review`
- Destructive action: `--color-danger`
- Privacy or local-only message: `--color-privacy`
- Camera backdrop: `--color-camera`

## Typography

Use the system font stack for speed and platform familiarity.

```css
font-family:
  ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Scale:

- Display: 32px / 38px, weight 780
- Page title: 24px / 30px, weight 760
- Section title: 18px / 24px, weight 720
- Body: 16px / 23px, weight 450
- Small: 13px / 18px, weight 500
- Code: 34px / 38px, weight 820, letter spacing 0

Rules:

- Do not scale type by viewport width.
- Code text should be large and extremely legible.
- Keep button labels short.
- Use sentence case for friendly clarity.

## Spacing And Layout

Base spacing unit: 4px.

Common steps:

```text
4, 8, 12, 16, 20, 24, 32, 40
```

Mobile layout:

- Target viewport: 390 x 844 logical px.
- Main actions in bottom third.
- Minimum tap target: 44 x 44 px.
- Preferred primary button height: 52 px.
- Use sticky bottom action areas for scan and confirm screens.
- Keep camera preview full-width and visually dominant.

Radius:

- Small controls: 8px.
- Inputs and list rows: 8px.
- Phone mockup frame only: larger radius is acceptable in docs.
- Avoid decorative pill shapes except for status badges.

Elevation:

- Prefer borders and subtle tonal separation.
- Use shadows sparingly for bottom sheets and floating scan controls.

## Core Components

### App Shell

Purpose: provide session context, navigation, and current total.

Elements:

- Session name.
- Total scan count.
- Tabs or bottom navigation: Scan, Collection, Export.
- Offline/local status when relevant.

Behavior:

- Scan is the default tab.
- Navigation should never cover the camera ROI.

### Session Start

Purpose: create or resume a collection session.

Elements:

- Product name.
- Name input.
- Primary "Start scanning" action.
- Resume card when local session exists.
- Short privacy note.

Design notes:

- Keep form short.
- Resume should be primary if a session exists.
- Starting a new session should be secondary and deliberate.

### Camera Permission Panel

Purpose: explain camera access and offer fallback.

Elements:

- Camera access request.
- Primary "Allow camera" action.
- Secondary "Enter manually" action.
- Blocked/no-camera state.

Design notes:

- Avoid technical permission language where possible.
- Manual entry is a normal fallback, not a failure.

### Scan View

Purpose: scan sticker backs quickly.

Elements:

- Live camera preview.
- Sticker-shaped mask.
- Top-right ROI box.
- Status line: Searching, Candidate found, Low confidence, No code yet.
- Bottom actions: manual, collection, pause or rescan.

Design notes:

- The ROI box should be amber and clearly anchored to the top-right of the sticker target.
- Use a translucent mask around the target so the sticker silhouette is obvious.
- Avoid long instructional copy on the camera screen.
- Show one prominent status at a time.

### Detection Confirmation Sheet

Purpose: let the user save or correct a candidate.

Elements:

- Proposed code.
- Confidence status.
- Captured crop or thumbnail.
- Actions: Save, Correct, Rescan, Skip.

Design notes:

- Save is primary only when the code is valid.
- Correct should be visually close to Save.
- Rescan and Skip are secondary.

### Manual Code Entry

Purpose: fast correction or manual addition.

Elements:

- Prefix input.
- Number input from 01 to 20.
- Validation hint.
- Save action.

Design notes:

- Split prefix and number to reduce mistakes.
- Auto-uppercase prefix.
- Offer recent prefixes after scans exist.
- Do not require the user to type leading zero if they enter 1 through 9.

### Collection List

Purpose: review and manage saved scans.

Elements:

- Total scans.
- Unique codes.
- Duplicate count summary.
- Rows with code, count, source, time, thumbnail.
- Edit and delete controls.
- Add manually action.

Design notes:

- Codes are the visual anchor.
- Duplicates should be easy to spot.
- Row controls should use familiar edit/delete icons in implementation.

### Export

Purpose: produce shareable files.

Elements:

- Text export as primary.
- JSON export as secondary.
- Summary: user, session, total scans, unique codes, duplicate counts.
- Privacy reminder for image-including JSON.

Design notes:

- Text export should feel quick and lightweight.
- JSON export can be described as a backup with images.

## States

Camera states:

- Prompt: ask for camera access.
- Ready: live preview active.
- Searching: no candidate yet.
- Candidate: valid code found.
- Low confidence: code needs review.
- Blocked: permission denied.
- No camera: manual entry path.

Scan states:

- Unsaved candidate.
- Saved scan.
- Duplicate saved.
- Manual entry saved.
- Validation failed.

Connectivity states:

- Local only.
- Sync queued.
- Synced.
- Sync failed, retry later.

## Accessibility

Baseline target: WCAG 2.1 AA.

Requirements:

- Color is not the only signal for state.
- All controls have visible labels or accessible names.
- Minimum contrast 4.5:1 for body text.
- Minimum target size 44 x 44 px.
- Camera guidance available as text, not only overlay geometry.
- Motion should be subtle and disabled by `prefers-reduced-motion`.
- Error language should explain the next action.

Kid-friendly accessibility:

- Avoid dense paragraphs inside the app UI.
- Keep choices small: usually two primary options per state.
- Use large code text and consistent button placement.

## Interaction Patterns

One scan loop:

```text
Searching -> Candidate -> Confirm sheet -> Save -> Return to searching
```

Correction loop:

```text
Candidate -> Correct -> Validate -> Save -> Return to scanning
```

Manual fallback:

```text
Camera blocked or no code -> Enter manually -> Save -> Collection updates
```

Export loop:

```text
Collection -> Export -> Download text or JSON -> Return to collection
```

## Copy Guidelines

Use:

- "Place the code in the corner"
- "Looks like ARG07"
- "Check this code"
- "Saved"
- "Enter manually"
- "Images stay on this device"

Avoid:

- "OCR failed"
- "Invalid input"
- "Fatal camera error"
- "Synchronous recognition pipeline"

## Implementation Handoff Notes

- Keep design tokens in CSS variables or a typed token object.
- Build scan overlay as a reusable component fed by `mask-config.json`.
- Keep confirmation sheet and manual entry modal independent from OCR internals.
- Build list rows and export summary from the same derived counts used by export logic.
- Create deterministic visual tests for permission, searching, candidate, correction,
  collection, and export states.
