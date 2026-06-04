const stories = {
  start: {
    kicker: "Story 1",
    title: "Create or resume a sticker session",
    copy:
      "The first screen asks for a name and makes resume visible when local data exists. The product opens directly into the scanner workflow.",
    points: [
      "Primary action: Start scanning.",
      "Resume shows count, unique codes, and last update.",
      "Privacy promise stays short and concrete."
    ],
    screen: `
      <section class="screen-state">
        <div class="screen-top">
          <span class="screen-brand">cromoswap</span>
          <span class="badge info">Local first</span>
        </div>
        <h4 class="screen-title">Scan your duplicate stickers.</h4>
        <p class="screen-copy">Build a clean WC 2026 list from the sticker backs.</p>
        <div class="screen-field">
          <span>What is your name?</span>
          <div class="field-box">Mauro</div>
        </div>
        <div class="resume-card">
          <strong>Resume Mauro's session</strong>
          <small>42 scans, 31 unique codes. Updated today.</small>
        </div>
        <div class="screen-bottom">
          <button class="button primary full" type="button">Start scanning</button>
          <div class="privacy-note">Images stay on this device in the MVP.</div>
        </div>
      </section>`
  },
  permission: {
    kicker: "Story 2",
    title: "Grant camera access or continue manually",
    copy:
      "The permission step explains why the camera is needed and gives manual entry equal dignity when access is blocked or unavailable.",
    points: [
      "Camera request is contextual and human.",
      "Manual entry is a normal supported path.",
      "The privacy promise stays visible."
    ],
    screen: `
      <section class="screen-state">
        <div class="screen-top">
          <span class="screen-brand">Camera setup</span>
          <span class="badge review">Step 2</span>
        </div>
        <h4 class="screen-title">Use your camera to read sticker codes.</h4>
        <p class="screen-copy">Cromoswap looks for the code in the top-right corner of the sticker back.</p>
        <div class="evidence-card">
          <span class="mini-sticker"><span class="mini-code">USA13</span></span>
        </div>
        <div class="screen-bottom">
          <button class="button primary full" type="button">Allow camera</button>
          <button class="button secondary full" type="button">Enter manually</button>
          <div class="privacy-note">No camera? You can still build the list.</div>
        </div>
      </section>`
  },
  scan: {
    kicker: "Story 3",
    title: "Scan the top-right sticker code",
    copy:
      "The live camera surface is dominated by a sticker mask and amber ROI target so a child or collector knows exactly where to place the code.",
    points: [
      "Camera is the center of gravity.",
      "ROI is clearly anchored top-right.",
      "Manual and list controls stay thumb-reachable."
    ],
    screen: `
      <section class="camera-state">
        <div class="screen-top">
          <span class="screen-brand">Mauro</span>
          <span class="badge success">42 saved</span>
        </div>
        <div class="scan-target"><span class="roi-box"></span></div>
        <div class="scan-label">Place the code in the corner</div>
        <div class="scan-actions">
          <button type="button">Manual</button>
          <button type="button">Pause</button>
          <button type="button">List</button>
        </div>
      </section>`
  },
  confirm: {
    kicker: "Story 4",
    title: "Confirm or correct a detected code",
    copy:
      "OCR never saves silently. The proposed normalized code, confidence, and captured evidence are shown before the save action.",
    points: [
      "Save is explicit and primary.",
      "Correct is close enough for fast fixes.",
      "Rescan and skip are secondary exits."
    ],
    screen: `
      <section class="screen-state">
        <div class="screen-top">
          <span class="screen-brand">Check this code</span>
          <span class="badge success">High match</span>
        </div>
        <div class="evidence-card">
          <span class="mini-sticker"><span class="mini-code">ARG07</span></span>
        </div>
        <div class="detected-code">ARG07</div>
        <div class="confidence">
          <span>Confidence</span>
          <span class="meter"><span></span></span>
          <strong>86%</strong>
        </div>
        <div class="screen-bottom">
          <button class="button primary full" type="button">Save sticker</button>
          <button class="button secondary full" type="button">Correct</button>
          <button class="button quiet full" type="button">Rescan</button>
        </div>
      </section>`
  },
  correct: {
    kicker: "Story 5",
    title: "Correct or manually enter a code",
    copy:
      "Correction is a normal part of the scan loop. Prefix and number are split so users can fix one character or digit quickly.",
    points: [
      "Prefix auto-normalizes to three uppercase letters.",
      "Numbers 1 through 9 do not require a leading zero.",
      "The preview shows the saved canonical code."
    ],
    screen: `
      <section class="screen-state">
        <div class="screen-top">
          <span class="screen-brand">Correct code</span>
          <span class="badge review">Manual</span>
        </div>
        <h4 class="screen-title">Fix the sticker code.</h4>
        <p class="screen-copy">Use the three-letter team code and number 01 to 20.</p>
        <div class="split-entry">
          <div class="field-box"><span><span class="field-label">Prefix</span>ARG</span></div>
          <div class="field-box"><span><span class="field-label">No.</span>07</span></div>
        </div>
        <div class="number-grid">
          <span>01</span><span>02</span><span>03</span><span>04</span><span>05</span>
          <span>06</span><span class="active">07</span><span>08</span><span>09</span><span>10</span>
        </div>
        <div class="preview-code">ARG07</div>
        <div class="screen-bottom">
          <button class="button primary full" type="button">Save code</button>
          <button class="button secondary full" type="button">Cancel</button>
        </div>
      </section>`
  },
  collection: {
    kicker: "Story 6",
    title: "Manage saved duplicate scans",
    copy:
      "The collection view makes codes, duplicates, and manual entries easy to review before export or future sharing.",
    points: [
      "Codes are the visual anchor.",
      "Duplicate counts are visible per code.",
      "Manual additions use the same validation."
    ],
    screen: `
      <section class="screen-state">
        <div class="screen-top">
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
    title: "Export a swap-ready list",
    copy:
      "Text export is the fastest sharing path. JSON remains available as a richer local backup with scan evidence.",
    points: [
      "Text export is primary.",
      "JSON is framed as backup evidence.",
      "Metadata and counts are predictable."
    ],
    screen: `
      <section class="screen-state">
        <div class="screen-top">
          <span class="screen-brand">Export</span>
          <span class="badge success">Ready</span>
        </div>
        <h4 class="screen-title">Download your list.</h4>
        <p class="screen-copy">Text is best for sharing. JSON keeps session details and local image evidence.</p>
        <div class="export-summary">
          <span class="summary-line"><span>Total scans</span><strong>42</strong></span>
          <span class="summary-line"><span>Unique codes</span><strong>31</strong></span>
          <span class="summary-line"><span>Duplicates</span><strong>8</strong></span>
          <span class="summary-line"><span>Images</span><strong>Local only</strong></span>
        </div>
        <div class="screen-bottom">
          <button class="button primary full" type="button">Download text</button>
          <button class="button secondary full" type="button">Download JSON backup</button>
          <div class="privacy-note">Text exports only codes and counts.</div>
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
