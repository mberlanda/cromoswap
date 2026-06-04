# UX Backlog

Status: draft v0.1  
Date: 2026-06-04

This document lists CX steps defined in the design system and user flows that are not yet
implemented in the app. Items are ordered roughly by user journey sequence.

---

## B-01 — Camera Permission Panel

**Flow reference:** Session Start → Request camera → Camera available?  
**Design reference:** `02-design-system.md` § Camera Permission Panel

The app currently starts the camera directly without handling permission states explicitly.

Missing:
- A dedicated screen that explains why camera access is needed before the browser
  permission prompt fires.
- A graceful "Allow camera" primary action and "Enter manually" secondary action.
- A blocked state shown when the user denies permission, with a clear path to manual entry.
- A no-camera state for desktop or tablet users with no camera device.

Acceptance criteria:
- The camera permission UI appears before or alongside the browser prompt.
- Blocked or no-camera states show a friendly message and offer manual entry.
- No technical language such as "NotAllowedError" is surfaced to the user.

---

## B-02 — App Shell Navigation

**Flow reference:** App Shell  
**Design reference:** `02-design-system.md` § App Shell

The app is currently a single scrolling page. The design calls for a navigation structure.

Missing:
- Bottom navigation or tab bar with Scan, Collection, and Export tabs.
- Session context visible in the shell (session name, total scan count).
- Offline/local-only status indicator when relevant.

Acceptance criteria:
- The Scan tab is selected by default.
- Navigation does not cover the camera ROI.
- The session name and scan count are visible without scrolling.

---

## B-03 — Session Start: Resume Card

**Flow reference:** Open app → Saved session?  
**Design reference:** `02-design-system.md` § Session Start

The current `SessionGate` shows a plain "Resume {name}" button list. The design calls
for a richer resume card.

Missing:
- Resume card showing session summary: user name, scan count, date of last scan.
- Resume should be the primary visual action when a session exists.
- Starting a new session should be a clearly secondary, deliberate action.

Acceptance criteria:
- The resume card appears above the new-session form when a session exists.
- The card shows at least name and scan count.
- Creating a new session does not silently overwrite an existing one.

---

## B-04 — Scan View: Status Line

**Flow reference:** Scan State Flow  
**Design reference:** `02-design-system.md` § Scan View

The current scan view shows a plain text status paragraph. The design specifies a
status line component with distinct states.

Missing:
- Distinct visual treatments for: Searching, Candidate found, Low confidence, No code yet.
- Color-coded or icon-annotated status line anchored above the bottom action area.
- Low-confidence state uses `--review` (amber) to signal "needs checking."

Acceptance criteria:
- Only one status is shown at a time.
- Status is readable over the camera preview without covering the ROI.
- Each state maps to the scan state machine in `01-flows-and-user-stories.md`.

---

## B-05 — Scan View: Sticky Bottom Action Area

**Flow reference:** Scan View  
**Design reference:** `02-design-system.md` § Scan View / Spacing And Layout

Primary scan controls are not currently pinned to the bottom of the screen.

Missing:
- Sticky bottom area containing: Scan sticker (primary), manual entry shortcut, pause or
  collection link.
- Minimum tap target 44 × 44 px on all controls.
- Primary "Scan sticker" button at 52 px height in the bottom third.

Acceptance criteria:
- The bottom action area stays visible without scrolling on a 390 × 844 viewport.
- Controls do not overlap the camera preview's ROI box.

---

## B-06 — Detection Confirmation: Confidence Visual

**Flow reference:** CandidateFound → Confirming  
**Design reference:** `02-design-system.md` § Detection Confirmation Sheet

The current confirmation view shows confidence as a plain percentage text.

Missing:
- Confidence meter (progress bar) from `design-system/styles.css` `.meter` pattern.
- Visual distinction: Save is the primary button only when confidence is acceptable;
  otherwise Correct should be equally prominent.
- Low-confidence state uses amber badge or meter color from `--review`.

Acceptance criteria:
- A confidence bar accompanies the percentage text.
- At high confidence, Save is clearly primary. At low confidence, Correct is co-primary.

---

## B-07 — Manual Code Entry: Split Prefix + Number

**Flow reference:** Manual fallback / Correction loop  
**Design reference:** `02-design-system.md` § Manual Code Entry

The current `ManualEntry` component uses a single text input for the full code.

Missing:
- Split entry: a prefix field and a separate number selector (01 – 20).
- Auto-uppercase on the prefix field.
- Number input that tolerates single-digit entry (1 → 01).
- After scans exist, show recent prefixes as quick-tap suggestions.

Acceptance criteria:
- Prefix and number are validated independently before the combined code is validated.
- Auto-uppercase fires on input, not only on submit.
- Recent prefixes appear after at least one OCR scan has been saved.

---

## B-08 — Collection List: Stats Row

**Flow reference:** Collection Management Flow  
**Design reference:** `02-design-system.md` § Collection List

The collection list currently shows no summary header.

Missing:
- Stats row at the top showing: total scans, unique codes, duplicate count.
- Duplicate count should be visually prominent so swap-organizer users can act on it
  quickly.

Acceptance criteria:
- Stats are derived from the same `countByCode` logic used for export.
- Stats update in real time as scans are added or deleted.

---

## B-09 — Collection List: Source Indicator

**Flow reference:** Collection row  
**Design reference:** `02-design-system.md` § Collection List

Scan rows do not currently show whether a code was scanned via OCR or entered manually.

Missing:
- Source label or icon on each row: "OCR" or "Manual."
- Manual entries should be visually distinguishable but not penalized.

Acceptance criteria:
- Source is always visible on each row without requiring interaction.
- Corrected scans (saved via "Correct") are marked as manual.

---

## B-10 — Export: Privacy Reminder and Summary

**Flow reference:** Export loop  
**Design reference:** `02-design-system.md` § Export

The export section has bare Export text / Export JSON buttons with no context.

Missing:
- Privacy reminder on the JSON export button: images stay on this device, JSON can be
  larger, describe it as a backup.
- Export summary block: user name, session ID, total scans, unique codes, duplicate count,
  export timestamp.

Acceptance criteria:
- The privacy note appears near the JSON button, not as a full-screen modal.
- The summary header in exported text matches the summary shown in the UI.

---

## B-11 — Connectivity / Local-Only Status

**Flow reference:** Connectivity states  
**Design reference:** `02-design-system.md` § States

The app has sync infrastructure (`sync-client.ts`) but no visible connectivity status.

Missing:
- Status indicator showing: Local only, Sync queued, Synced, Sync failed.
- Privacy-colored indicator (`--privacy`) when running local-only, so privacy-aware users
  are reassured.

Acceptance criteria:
- The indicator is unobtrusive and does not appear on the camera screen.
- "Sync failed, retry later" state includes a visible retry action.

---

## B-12 — Sticker Orientation UX

**Flow reference:** Scan View  
**Design reference:** `02-design-system.md` § Scan View

The orientation selector is currently a `<fieldset>` with two radio buttons, which is
functional but does not match the mobile-first, tactile feel of the design system.

Missing:
- Orientation toggle styled as a segmented control or icon pair (portrait / landscape).
- The mask overlay should visibly reorient to match the selected orientation.

Acceptance criteria:
- The toggle fits within the bottom action area without growing the page height.
- Both orientations pass minimum tap-target size (44 × 44 px).
