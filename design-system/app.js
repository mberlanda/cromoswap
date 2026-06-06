const stories = {
  start: {
    kicker: "Story 1",
    title: "Create, resume, or import",
    copy:
      "The first screen makes returning work fast: resume is prominent, import is available next to recovery, and new sessions remain deliberate.",
    points: [
      "Resume shows scan and album counts.",
      "Import accepts text lists and JSON backups from the start screen.",
      "The primary path still starts a clean scanner session."
    ],
    screen: `
      <section class="screen-state">
        <div class="screen-top">
          <span class="screen-brand">cromoswap</span>
          <span class="badge info">Cloud optional</span>
        </div>
        <h4 class="screen-title">Sort stickers without losing your place.</h4>
        <p class="screen-copy">Scan duplicates, fill your album, or restore an existing list.</p>
        <div class="resume-card">
          <strong>Resume Mauro</strong>
          <small>42 scans · 642 owned · 338 missing</small>
        </div>
        <div class="import-card-mini">
          <span class="import-choice json"><strong>Import JSON</strong>Restore a session.</span>
          <span class="import-choice text"><strong>Import text</strong>Merge codes.</span>
        </div>
        <div class="screen-field">
          <span>Your name</span>
          <div class="field-box">Luca</div>
        </div>
        <div class="screen-bottom">
          <button class="button primary full" type="button">Start scanning</button>
          <div class="privacy-note">Local mode keeps images on this device.</div>
        </div>
      </section>`
  },
  import: {
    kicker: "Story 2",
    title: "Import text or JSON without overwriting",
    copy:
      "Import is non-destructive. JSON restores a new session; text merges owned, missing, or duplicate codes depending on the detected header.",
    points: [
      "JSON import creates a new session instead of overwriting.",
      "Text import detects owned, missing, and duplicate headers.",
      "Ambiguous text asks for a kind before merging."
    ],
    screen: `
      <section class="screen-state">
        <div class="screen-top">
          <span class="screen-brand">Import</span>
          <button class="button quiet" type="button">Back</button>
        </div>
        <h4 class="screen-title">Bring a list back in.</h4>
        <p class="screen-copy">Choose a .txt export or a JSON backup. Cromoswap will never replace an existing session silently.</p>
        <div class="import-card-mini">
          <span class="import-choice json"><strong>JSON restore</strong>New session with scans, images, and album.</span>
          <span class="import-choice text"><strong>Text merge</strong>Owned, missing, or duplicate codes.</span>
        </div>
        <div class="export-summary">
          <span class="summary-line"><span>Detected type</span><strong>My Album owned</strong></span>
          <span class="summary-line"><span>Codes found</span><strong>642</strong></span>
          <span class="summary-line"><span>Merge action</span><strong>Set owned</strong></span>
        </div>
        <div class="screen-bottom">
          <button class="button primary full" type="button">Choose file</button>
          <button class="button secondary full" type="button">Confirm import</button>
        </div>
      </section>`
  },
  scan: {
    kicker: "Story 3",
    title: "Target the sticker with a centered frame",
    copy:
      "The scanner now uses a centered sticker-shaped guide and nested top-right ROI. The frame turns green when the sticker is well targeted.",
    points: [
      "Sticker frame is locked to portrait or landscape aspect ratio.",
      "ROI is nested inside the guide, not the full camera preview.",
      "Size tuning remains thumb-reachable in the sticky scan controls."
    ],
    screen: `
      <section class="camera-state">
        <div class="screen-top">
          <button class="button quiet" type="button">Home</button>
          <span class="badge success">Targeted</span>
        </div>
        <div class="scan-target targeted"><span class="roi-box targeted"></span></div>
        <div class="scan-label">Hold steady inside the frame</div>
        <div class="scan-actions">
          <button type="button">Portrait</button>
          <button type="button">Size 72%</button>
          <button type="button">Pause</button>
        </div>
      </section>`
  },
  album: {
    kicker: "Story 4",
    title: "Fill or clear a team in one tap",
    copy:
      "My Album keeps the checklist layout, but each team gains a compact All/Clear pill for fast completion workflows.",
    points: [
      "All marks the whole team owned, then users untick missing stickers.",
      "Clear appears when a team is complete.",
      "The chip model stays binary and familiar."
    ],
    screen: `
      <section class="screen-state">
        <div class="screen-top">
          <button class="button quiet" type="button">Home</button>
          <span class="screen-brand">My Album</span>
          <span class="badge success">642 owned</span>
        </div>
        <h4 class="screen-title">Group A</h4>
        <div class="mini-team-card">
          <div class="mini-team-header">
            <span><strong>MEX</strong> · Mexico</span>
            <span class="mini-team-actions"><span>20 / 20</span><span class="mini-pill clear">Clear</span></span>
          </div>
          <div class="mini-chips">
            <span class="mini-chip owned">01</span><span class="mini-chip owned">02</span><span class="mini-chip owned">03</span><span class="mini-chip owned">04</span><span class="mini-chip owned">05</span><span class="mini-chip owned">06</span><span class="mini-chip owned">07</span><span class="mini-chip owned">08</span><span class="mini-chip owned">09</span><span class="mini-chip owned">10</span>
          </div>
        </div>
        <div class="mini-team-card">
          <div class="mini-team-header">
            <span><strong>ARG</strong> · Argentina</span>
            <span class="mini-team-actions"><span>18 / 20</span><span class="mini-pill">All</span></span>
          </div>
          <div class="mini-chips">
            <span class="mini-chip owned">01</span><span class="mini-chip owned">02</span><span class="mini-chip">03</span><span class="mini-chip owned">04</span><span class="mini-chip owned">05</span><span class="mini-chip">06</span><span class="mini-chip owned">07</span><span class="mini-chip owned">08</span><span class="mini-chip owned">09</span><span class="mini-chip owned">10</span>
          </div>
        </div>
        <div class="screen-bottom">
          <button class="button primary full" type="button">Export owned</button>
        </div>
      </section>`
  },
  repsGrid: {
    kicker: "Story 5",
    title: "Count duplicates from the album grid",
    copy:
      "My Reps adds a grid view over the same scan rows. Each chip carries a 0-7 counter and responds to the active tap mode.",
    points: [
      "Scan and Grid are views of the same session data.",
      "+1 adds a manual scan, -1 deletes one row, Clear deletes all rows for a code.",
      "Counts above one use amber spare badges; seven gets a cap ring."
    ],
    screen: `
      <section class="screen-state">
        <div class="screen-top">
          <button class="button quiet" type="button">Home</button>
          <span class="screen-brand">My Reps</span>
          <span class="badge review">6 spare</span>
        </div>
        <div class="segmented-sample">
          <span>Scan</span>
          <span class="add">Grid</span>
          <span>Export</span>
        </div>
        <div class="segmented-sample">
          <span class="remove">-1</span>
          <span class="add">+1</span>
          <span class="clear">Clear</span>
        </div>
        <div class="mini-team-card">
          <div class="mini-team-header">
            <span><strong>GHA</strong> · Ghana</span>
            <span>16 copies · 6 spare</span>
          </div>
          <div class="count-grid">
            <span class="count-chip">01</span>
            <span class="count-chip has-count">02<span class="count-badge">3</span></span>
            <span class="count-chip has-count">03</span>
            <span class="count-chip has-count capped">04<span class="count-badge">7</span></span>
            <span class="count-chip">05</span>
            <span class="count-chip has-count">06<span class="count-badge">2</span></span>
            <span class="count-chip">07</span>
            <span class="count-chip has-count">08</span>
            <span class="count-chip">09</span>
            <span class="count-chip has-count">10<span class="count-badge">3</span></span>
          </div>
        </div>
        <div class="screen-bottom">
          <button class="button primary full" type="button">Tap stickers to add copies</button>
        </div>
      </section>`
  },
  collection: {
    kicker: "Story 6",
    title: "Review scans with source and duplicate context",
    copy:
      "The list view remains useful for evidence, edits, and deletes after the reps grid handles fast counting.",
    points: [
      "Codes stay the visual anchor.",
      "Source labels distinguish OCR from manual entries.",
      "Duplicate counts match the grid projection."
    ],
    screen: `
      <section class="screen-state">
        <div class="screen-top">
          <button class="button quiet" type="button">Home</button>
          <span class="screen-brand">Collection</span>
          <button class="button secondary" type="button">Add</button>
        </div>
        <div class="stats-row">
          <span class="stat-box"><strong>42</strong><span>scans</span></span>
          <span class="stat-box"><strong>31</strong><span>unique</span></span>
          <span class="stat-box"><strong>8</strong><span>dupes</span></span>
        </div>
        <div class="mini-list">
          <div class="scan-row"><span class="thumb"></span><span><strong>ARG07</strong><small>OCR, today 18:12</small></span><span class="badge success">x2</span></div>
          <div class="scan-row"><span class="thumb"></span><span><strong>USA13</strong><small>OCR, today 18:10</small></span><span class="badge info">x1</span></div>
          <div class="scan-row"><span class="thumb"></span><span><strong>FWC04</strong><small>Manual, today 18:08</small></span><span class="badge review">edit</span></div>
        </div>
        <div class="screen-bottom">
          <button class="button primary full" type="button">Scan more</button>
          <button class="button secondary full" type="button">Export</button>
        </div>
      </section>`
  },
  export: {
    kicker: "Story 7",
    title: "Export lists that can be imported later",
    copy:
      "Text remains the fastest share path, while JSON now carries enough optional data to restore scans and album ownership.",
    points: [
      "Owned and missing album exports keep recognizable headers.",
      "Reps JSON can restore a full session without overwriting.",
      "Privacy copy stays close to the image-backed JSON action."
    ],
    screen: `
      <section class="screen-state">
        <div class="screen-top">
          <button class="button quiet" type="button">Home</button>
          <span class="screen-brand">Export</span>
          <span class="badge success">Ready</span>
        </div>
        <h4 class="screen-title">Download your lists.</h4>
        <p class="screen-copy">Share text for swaps. Keep JSON for restoring evidence and album progress.</p>
        <div class="export-summary">
          <span class="summary-line"><span>Total scans</span><strong>42</strong></span>
          <span class="summary-line"><span>Unique codes</span><strong>31</strong></span>
          <span class="summary-line"><span>Album owned</span><strong>642</strong></span>
          <span class="summary-line"><span>Images</span><strong>Local only</strong></span>
        </div>
        <div class="screen-bottom">
          <button class="button primary full" type="button">Download text</button>
          <button class="button secondary full" type="button">Download JSON backup</button>
          <div class="privacy-note">JSON may include image data. Keep it as a personal backup.</div>
        </div>
      </section>`
  }
};

const tabs = Array.from(document.querySelectorAll(".story-tab"));
const title = document.querySelector("#story-title");
const copy = document.querySelector("#story-copy");
const kicker = document.querySelector("#story-kicker");
const points = document.querySelector("#story-points");
const screen = document.querySelector("#story-screen");

function setStory(id) {
  const story = stories[id] || stories.start;
  kicker.textContent = story.kicker;
  title.textContent = story.title;
  copy.textContent = story.copy;
  points.replaceChildren(
    ...story.points.map((point) => {
      const item = document.createElement("li");
      item.textContent = point;
      return item;
    })
  );
  screen.innerHTML = story.screen;
  tabs.forEach((tab) => {
    const isActive = tab.dataset.story === id;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setStory(tab.dataset.story));
});

setStory("start");
