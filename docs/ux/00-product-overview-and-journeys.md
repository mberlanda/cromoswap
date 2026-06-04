# Product Overview And User Journeys

Status: draft v0.1  
Date: 2026-06-04

## Website Overview

WC 2026 Sticker Scanner is a mobile web app for people sorting duplicate Panini stickers.
It helps users scan the code printed on the back of each sticker, confirm or correct the
detected code, and export a clean list.

The app is designed for collection-focused users and kids:

- Collectors get speed, duplicate counts, manual fixes, and reliable export.
- Kids get a clear camera target, simple choices, big buttons, and forgiving recovery.
- Families get privacy-local image handling and a session that survives reloads.

The website should open directly into the usable app. It should not start with a
marketing landing page. The first meaningful action is starting or resuming a collection
session.

## Audience Segments

### Completionist Collector

Motivation: process many duplicate stickers quickly and accurately.  
Needs: speed, confidence, duplicate counts, edit history, export.  
Stress point: repeated OCR mistakes or accidental duplicate entries.

### Kid Collector

Motivation: help scan their own duplicates and see progress.  
Needs: large controls, low reading burden, clear success feedback.  
Stress point: camera permission errors, confusing correction flows, too many options.

### Parent Or Family Helper

Motivation: help a child organize stickers without sending images to a server.  
Needs: privacy clarity, resume, export, simple deletion and correction.  
Stress point: losing data after a page refresh.

### Swap Organizer

Motivation: prepare a clean list for future exchanges.  
Needs: normalized codes, counts by code, easy text export, future share path.  
Stress point: inconsistent formats such as `ARG 1`, `arg01`, and `ARG-01`.

## Experience Principles

- The camera screen is the app center of gravity.
- The user confirms before the app stores anything.
- Corrections should take seconds, not feel like an error state.
- Every screen should have one obvious primary action.
- The app should work with imperfect lighting, rotated stickers, and impatient hands.
- Text should be short, friendly, and direct.

## Journey 1: First Scan With A Kid

Context: a child opens the app with a pile of duplicate stickers.

1. The app asks "What is your name?"
2. The child enters a name and starts a session.
3. The browser asks for camera access.
4. The app shows a large sticker-shaped target.
5. The child places the sticker back inside the target.
6. The top-right code area is highlighted.
7. The app detects a code and pauses on a confirmation sheet.
8. The child taps "Save" if the code looks right.
9. The saved list count increases.
10. The app returns to scanning for the next sticker.

UX implication: use large controls, clear focus areas, and reassuring labels such as
"Looks like ARG07" instead of technical OCR language.

## Journey 2: Collector Speed Run

Context: an adult collector has 80 duplicate stickers and wants an exportable list.

1. The collector resumes the previous session.
2. They hold each sticker in the overlay.
3. The scanner detects a code.
4. They quickly confirm, correct, or skip.
5. Duplicate counts update as they go.
6. They use the collection tab to spot obvious mistakes.
7. They export a text list.

UX implication: keep confirm, correct, and rescan thumb-reachable. Avoid dialogs that
interrupt batch rhythm.

## Journey 3: OCR Fails Or Sticker Is Rotated

Context: the code is blurry, rotated, or partially outside the ROI.

1. The app either shows low confidence or no valid code.
2. The user can rescan without losing the current session.
3. The user can correct the proposed code.
4. The user can use manual entry if scanning keeps failing.
5. The saved entry still looks the same as OCR entries, with source marked as manual.

UX implication: failure states should be neutral. The app should say "No code yet" or
"Check the code" rather than "Error".

## Journey 4: Returning Session

Context: the user scanned stickers yesterday and opens the app again.

1. The app detects a saved local session.
2. The user sees name, total scans, and last updated time.
3. The user can resume scanning or start a new session.
4. The previous list is preserved.

UX implication: resume should be visible on the first screen. Starting over should be
available but secondary.

## Journey 5: Export For Swapping

Context: the user wants to send a clean duplicate list to someone else.

1. The user opens the collection view.
2. The user checks totals and duplicate counts.
3. The user edits any suspicious codes.
4. The user opens export.
5. The app offers text first and JSON with images second.
6. The user downloads the file.

UX implication: text export should be the primary export. JSON export should explain that
it includes local evidence images and may be larger.

## MVP Journey Priorities

Priority 1:

- First scan.
- Confirm or correct.
- Saved collection list.
- Text export.

Priority 2:

- Resume session.
- Manual entry.
- Permission fallback.
- JSON export.

Priority 3:

- Rotation-aware scan retry.
- Better batch-mode shortcuts.
- Share and matchmaking entry points.
