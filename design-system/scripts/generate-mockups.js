const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const svgDir = path.join(root, "mockups", "svg");
const jpgDir = path.join(root, "mockups", "jpg");
const assetDir = path.join(root, "assets");

fs.mkdirSync(svgDir, { recursive: true });
fs.mkdirSync(jpgDir, { recursive: true });

for (const dir of [svgDir, jpgDir]) {
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith(".svg") || file.endsWith(".jpg")) {
      fs.unlinkSync(path.join(dir, file));
    }
  }
}

const fontCacheDir = path.join("/private/tmp", "cromoswap-font-cache");
fs.mkdirSync(fontCacheDir, { recursive: true });
const execEnv = { ...process.env, XDG_CACHE_HOME: fontCacheDir };

const colors = {
  ink: "#121a2f",
  muted: "#5c6780",
  subtle: "#dce6ef",
  paper: "#f5f9fc",
  surface: "#ffffff",
  field: "#eef6fb",
  scan: "#18b394",
  scanStrong: "#007a65",
  info: "#3b66f5",
  review: "#ffc247",
  danger: "#ef5a6d",
  privacy: "#7657f2",
  camera: "#10172a",
  targeted: "#5ee6b5",
  ownedBg: "#def7ef",
  spareBg: "#fff1ca",
  spareText: "#755200",
  capRing: "#b37b00",
  importBg: "#e8f0ff",
  importText: "#1d4ed8",
  privacyBg: "rgba(118,87,242,0.1)",
  privacyBorder: "rgba(118,87,242,0.28)",
  privacyText: "#4f3bb1"
};

function text(value, x, y, size = 16, weight = 700, fill = colors.ink, extra = "") {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="0" ${extra}>${value}</text>`;
}

function rect(x, y, w, h, fill, stroke = "none", radius = 8, extra = "") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
}

function button(label, x, y, w, primary = true) {
  const fill = primary ? colors.scan : colors.surface;
  const stroke = primary ? colors.scan : colors.subtle;
  const color = primary ? "#ffffff" : colors.ink;
  return [
    rect(x, y, w, 52, fill, stroke),
    text(label, x + w / 2, y + 32, 15, 850, color, `text-anchor="middle"`)
  ].join("");
}

function badge(label, x, y, fill, color, width = 86) {
  return [
    rect(x, y, width, 30, fill, "none", 15),
    text(label, x + width / 2, y + 20, 12, 850, color, `text-anchor="middle"`)
  ].join("");
}

function logoMark(x, y, scale = 1) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      ${rect(0, 0, 42, 42, colors.ink, "none", 8)}
      ${rect(9, 9, 10, 3, colors.targeted, "none", 1.5)}
      ${rect(9, 9, 3, 10, colors.targeted, "none", 1.5)}
      ${rect(23, 9, 10, 3, colors.targeted, "none", 1.5)}
      ${rect(30, 9, 3, 10, colors.targeted, "none", 1.5)}
      ${rect(9, 30, 10, 3, colors.targeted, "none", 1.5)}
      ${rect(9, 23, 3, 10, colors.targeted, "none", 1.5)}
      ${rect(23, 30, 10, 3, colors.targeted, "none", 1.5)}
      ${rect(30, 23, 3, 10, colors.targeted, "none", 1.5)}
      ${rect(14, 13, 14, 16, colors.surface, "none", 3)}
      ${rect(16, 16, 10, 9, colors.paper, colors.subtle, 2, `stroke-width="1"`)}
      <path d="M17.5 24h6" stroke="${colors.scan}" stroke-width="2" stroke-linecap="round"/>
      <path d="M23 21.5 30 25 23 28.5Z" fill="${colors.info}"/>
      <circle cx="20.5" cy="22.5" r="1.9" fill="${colors.danger}"/>
    </g>`;
}

function screenShell(title, body, opts = {}) {
  const bg = opts.bg || colors.paper;
  const topColor = opts.topColor || colors.ink;
  const titleText = title
    ? text(title, opts.logo === false ? 20 : 58, 48, 15, 900, topColor)
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1170" height="2532" viewBox="0 0 390 844">
  ${rect(0, 0, 390, 844, bg, "none", 0)}
  ${opts.logo === false ? "" : logoMark(20, 20, 0.76)}
  ${titleText}
  ${body}
</svg>`;
}

function smallChip(label, x, y, owned = false) {
  const fill = owned ? colors.scan : colors.field;
  const stroke = owned ? colors.scan : colors.subtle;
  const color = owned ? "#ffffff" : colors.muted;
  return `
    ${rect(x, y, 40, 34, fill, stroke, 6)}
    ${text(label, x + 20, y + 22, 12, 900, color, `text-anchor="middle"`)}
  `;
}

function countChip(label, x, y, count = 0, capped = false) {
  const hasCount = count > 0;
  const fill = hasCount ? colors.scan : colors.field;
  const stroke = capped ? colors.capRing : hasCount ? colors.scan : colors.subtle;
  const strokeWidth = capped ? 3 : 1;
  const color = hasCount ? "#ffffff" : colors.muted;
  return `
    ${rect(x, y, 42, 36, fill, stroke, 6, `stroke-width="${strokeWidth}"`)}
    ${text(label, x + 21, y + 23, 12, 900, color, `text-anchor="middle"`)}
    ${count > 1 ? `${rect(x + 28, y - 9, 24, 22, colors.spareBg, "none", 11)}${text(String(count), x + 40, y + 6, 11, 950, colors.spareText, `text-anchor="middle"`)}`
      : ""}
  `;
}

function teamHeader(prefix, name, count, action, x, y) {
  return `
    ${rect(x, y, 350, 46, colors.field, colors.subtle)}
    ${text(`${prefix} · ${name}`, x + 14, y + 29, 15, 900)}
    ${text(count, x + 246, y + 29, 12, 800, colors.muted)}
    ${rect(x + 302, y + 11, 36, 24, action === "Clear" ? colors.field : colors.surface, colors.subtle, 12)}
    ${text(action, x + 320, y + 27, 10, 900, action === "Clear" ? colors.muted : colors.scanStrong, `text-anchor="middle"`)}
  `;
}

function scanRow(x, y, code, meta, count) {
  return `
    ${rect(x, y, 350, 66, colors.surface, colors.subtle)}
    ${rect(x + 12, y + 10, 42, 46, "#fbfdfc", colors.subtle, 6)}
    ${text(code, x + 68, y + 31, 19, 950)}
    ${text(meta, x + 68, y + 52, 11, 750, colors.muted)}
    ${rect(x + 300, y + 18, 44, 30, count === "edit" ? colors.spareBg : colors.ownedBg, "none", 15)}
    ${text(count, x + 322, y + 38, 12, 850, count === "edit" ? colors.spareText : colors.scanStrong, `text-anchor="middle"`)}
  `;
}

function summaryLine(label, value, x, y) {
  return `
    ${text(label, x, y, 14, 800, colors.muted)}
    ${text(value, 344, y, 14, 900, colors.ink, `text-anchor="end"`)}
    <line x1="${x}" y1="${y + 16}" x2="350" y2="${y + 16}" stroke="#e7eeeb"/>
  `;
}

const screens = [
  {
    file: "01-start",
    svg: screenShell(
      "cromoswap",
      `
      ${badge("Cloud optional", 260, 24, colors.importBg, colors.importText, 110)}
      ${text("Sort stickers", 20, 128, 34, 900)}
      ${text("without losing", 20, 166, 34, 900)}
      ${text("your place.", 20, 204, 34, 900)}
      ${text("Resume, import, or start a fresh scan session.", 20, 244, 15, 650, colors.muted)}
      ${rect(20, 300, 350, 82, colors.surface, colors.subtle)}
      ${text("Resume Mauro", 36, 331, 17, 900)}
      ${text("42 scans · 642 owned · 338 missing", 36, 358, 13, 750, colors.muted)}
      ${rect(20, 402, 166, 86, colors.importBg, colors.info)}
      ${text("JSON restore", 36, 434, 15, 900, colors.importText)}
      ${text("New session", 36, 460, 12, 800, colors.importText)}
      ${rect(204, 402, 166, 86, colors.spareBg, colors.review)}
      ${text("Text merge", 220, 434, 15, 900, colors.spareText)}
      ${text("Owned or reps", 220, 460, 12, 800, colors.spareText)}
      ${text("Your name", 20, 550, 12, 850, colors.muted)}
      ${rect(20, 566, 350, 54, colors.surface, colors.subtle)}
      ${text("Luca", 36, 600, 18, 850)}
      ${button("Start scanning", 20, 648, 350, true)}
      ${rect(20, 748, 350, 52, colors.privacyBg, colors.privacyBorder)}
      ${text("Local mode keeps images on this device.", 36, 780, 13, 850, colors.privacyText)}
      `
    )
  },
  {
    file: "02-import",
    svg: screenShell(
      "Import",
      `
      ${button("Back", 306, 20, 64, false)}
      ${text("Bring a list", 20, 128, 34, 900)}
      ${text("back in.", 20, 166, 34, 900)}
      ${text("Restore JSON or merge text codes non-destructively.", 20, 210, 15, 650, colors.muted)}
      ${rect(20, 270, 350, 116, colors.importBg, colors.info)}
      ${text("JSON restore", 44, 314, 22, 900, colors.importText)}
      ${text("Creates a new session with scans, images, and album.", 44, 344, 13, 750, colors.importText)}
      ${rect(20, 410, 350, 116, colors.spareBg, colors.review)}
      ${text("Text merge", 44, 454, 22, 900, colors.spareText)}
      ${text("Detects owned, missing, or duplicate headers.", 44, 484, 13, 750, colors.spareText)}
      ${rect(20, 560, 350, 108, colors.surface, colors.subtle)}
      ${summaryLine("Detected type", "My Album owned", 40, 596)}
      ${summaryLine("Codes found", "642", 40, 640)}
      ${button("Choose file", 20, 716, 350, true)}
      `
    )
  },
  {
    file: "03-scan",
    svg: screenShell(
      "",
      `
      ${button("Home", 20, 18, 74, false)}
      ${text("Mauro", 108, 48, 15, 900, "#ffffff")}
      ${badge("Targeted", 284, 24, colors.ownedBg, colors.scanStrong)}
      ${rect(0, 74, 390, 770, colors.camera, "none", 0)}
      ${rect(86, 128, 218, 320, "rgba(255,255,255,0.05)", colors.targeted, 10, `stroke-width="3"`)}
      ${rect(224, 150, 62, 50, "rgba(94,230,181,0.16)", colors.targeted, 8, `stroke-width="3"`)}
      ${rect(20, 624, 350, 44, "rgba(255,255,255,0.94)", "none")}
      ${text("Hold steady inside the frame", 195, 652, 14, 900, colors.ink, `text-anchor="middle"`)}
      ${rect(20, 744, 104, 54, "rgba(255,255,255,0.12)", "rgba(255,255,255,0.24)")}
      ${rect(143, 744, 104, 54, "rgba(255,255,255,0.12)", "rgba(255,255,255,0.24)")}
      ${rect(266, 744, 104, 54, "rgba(255,255,255,0.12)", "rgba(255,255,255,0.24)")}
      ${text("Portrait", 72, 778, 13, 850, "#ffffff", `text-anchor="middle"`)}
      ${text("Size 72%", 195, 778, 13, 850, "#ffffff", `text-anchor="middle"`)}
      ${text("Pause", 318, 778, 13, 850, "#ffffff", `text-anchor="middle"`)}
      `,
      { bg: colors.camera, topColor: "#ffffff", logo: false }
    )
  },
  {
    file: "04-album",
    svg: screenShell(
      "",
      `
      ${button("Home", 20, 18, 74, false)}
      ${text("My Album", 108, 48, 15, 900)}
      ${badge("642 owned", 276, 24, colors.ownedBg, colors.scanStrong, 94)}
      ${text("Group A", 20, 118, 30, 900)}
      ${teamHeader("MEX", "Mexico", "20 / 20", "Clear", 20, 156)}
      ${smallChip("01", 34, 222, true)}${smallChip("02", 82, 222, true)}${smallChip("03", 130, 222, true)}${smallChip("04", 178, 222, true)}${smallChip("05", 226, 222, true)}${smallChip("06", 274, 222, true)}${smallChip("07", 322, 222, true)}
      ${teamHeader("ARG", "Argentina", "18 / 20", "All", 20, 306)}
      ${smallChip("01", 34, 372, true)}${smallChip("02", 82, 372, true)}${smallChip("03", 130, 372, false)}${smallChip("04", 178, 372, true)}${smallChip("05", 226, 372, true)}${smallChip("06", 274, 372, false)}${smallChip("07", 322, 372, true)}
      ${teamHeader("AUS", "Australia", "11 / 20", "All", 20, 456)}
      ${smallChip("01", 34, 522, true)}${smallChip("02", 82, 522, false)}${smallChip("03", 130, 522, true)}${smallChip("04", 178, 522, false)}${smallChip("05", 226, 522, true)}${smallChip("06", 274, 522, false)}${smallChip("07", 322, 522, false)}
      ${button("Export owned", 20, 730, 166, true)}
      ${button("Export missing", 204, 730, 166, false)}
      `,
      { logo: false }
    )
  },
  {
    file: "05-reps-grid",
    svg: screenShell(
      "",
      `
      ${button("Home", 20, 18, 74, false)}
      ${text("My Reps", 108, 48, 15, 900)}
      ${badge("6 spare", 292, 24, colors.spareBg, colors.spareText, 78)}
      ${rect(20, 94, 350, 48, colors.surface, colors.subtle)}
      ${rect(139, 98, 112, 40, colors.scan, "none", 6)}
      ${text("Scan", 78, 125, 13, 900, colors.muted, `text-anchor="middle"`)}
      ${text("Grid", 195, 125, 13, 900, "#ffffff", `text-anchor="middle"`)}
      ${text("Export", 312, 125, 13, 900, colors.muted, `text-anchor="middle"`)}
      ${rect(20, 166, 350, 48, colors.surface, colors.subtle)}
      ${rect(26, 172, 110, 36, colors.danger, "none", 6)}
      ${rect(140, 172, 110, 36, colors.scan, "none", 6)}
      ${rect(254, 172, 110, 36, colors.ink, "none", 6)}
      ${text("-1", 81, 195, 13, 900, "#ffffff", `text-anchor="middle"`)}
      ${text("+1", 195, 195, 13, 900, "#ffffff", `text-anchor="middle"`)}
      ${text("Clear", 309, 195, 13, 900, "#ffffff", `text-anchor="middle"`)}
      ${rect(20, 248, 350, 214, colors.surface, colors.subtle)}
      ${text("GHA · Ghana", 36, 286, 17, 900)}
      ${text("16 copies · 6 spare", 230, 286, 12, 800, colors.muted)}
      ${countChip("01", 36, 316, 0)}${countChip("02", 88, 316, 3)}${countChip("03", 140, 316, 1)}${countChip("04", 192, 316, 7, true)}${countChip("05", 244, 316, 0)}${countChip("06", 296, 316, 2)}
      ${countChip("07", 36, 370, 0)}${countChip("08", 88, 370, 1)}${countChip("09", 140, 370, 0)}${countChip("10", 192, 370, 3)}${countChip("11", 244, 370, 0)}${countChip("12", 296, 370, 1)}
      ${button("Tap stickers to add copies", 20, 730, 350, true)}
      `,
      { logo: false }
    )
  },
  {
    file: "06-collection",
    svg: screenShell(
      "",
      `
      ${button("Home", 20, 18, 74, false)}
      ${text("Collection", 108, 48, 15, 900)}
      ${button("Add", 304, 20, 66, false)}
      ${rect(20, 96, 106, 74, colors.surface, colors.subtle)}
      ${rect(142, 96, 106, 74, colors.surface, colors.subtle)}
      ${rect(264, 96, 106, 74, colors.surface, colors.subtle)}
      ${text("42", 36, 130, 24, 900)}
      ${text("31", 158, 130, 24, 900)}
      ${text("8", 280, 130, 24, 900)}
      ${text("scans", 36, 154, 12, 850, colors.muted)}
      ${text("unique", 158, 154, 12, 850, colors.muted)}
      ${text("dupes", 280, 154, 12, 850, colors.muted)}
      ${scanRow(20, 212, "ARG07", "OCR, today 18:12", "x2")}
      ${scanRow(20, 290, "USA13", "OCR, today 18:10", "x1")}
      ${scanRow(20, 368, "FWC04", "Manual, today 18:08", "edit")}
      ${button("Scan more", 20, 700, 166, true)}
      ${button("Export", 204, 700, 166, false)}
      `,
      { logo: false }
    )
  },
  {
    file: "07-export",
    svg: screenShell(
      "",
      `
      ${button("Home", 20, 18, 74, false)}
      ${text("Export", 108, 48, 15, 900)}
      ${badge("Ready", 284, 24, colors.ownedBg, colors.scanStrong)}
      ${text("Download", 20, 128, 34, 900)}
      ${text("your lists.", 20, 166, 34, 900)}
      ${text("Text is for swaps. JSON restores local evidence.", 20, 210, 15, 650, colors.muted)}
      ${rect(20, 270, 350, 220, colors.surface, colors.subtle)}
      ${summaryLine("Total scans", "42", 40, 314)}
      ${summaryLine("Unique codes", "31", 40, 358)}
      ${summaryLine("Album owned", "642", 40, 402)}
      ${summaryLine("Images", "Local only", 40, 446)}
      ${button("Download text", 20, 626, 350, true)}
      ${button("Download JSON backup", 20, 690, 350, false)}
      ${rect(20, 768, 350, 44, colors.privacyBg, colors.privacyBorder)}
      ${text("Keep JSON as a personal backup.", 36, 796, 13, 850, colors.privacyText)}
      `,
      { logo: false }
    )
  }
];

function phoneFrame(svg, x, y, scale = 0.42) {
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      ${rect(-12, -12, 414, 868, colors.camera, "none", 32)}
      ${inner}
    </g>`;
}

function boardSvg() {
  const width = 1680;
  const height = 1320;
  const positions = [
    [56, 160],
    [456, 160],
    [856, 160],
    [1256, 160],
    [56, 748],
    [456, 748],
    [856, 748]
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${rect(0, 0, width, height, colors.paper, "none", 0)}
  ${logoMark(56, 48, 1.28)}
  ${text("cromoswap Cobalt Mint CX v0.3", 126, 85, 42, 900)}
  ${text("Navy/cobalt app presence with mint scanner cues across album, reps, import, export, and targeting.", 128, 120, 22, 700, colors.muted)}
  ${screens.map((screen, index) => phoneFrame(screen.svg, positions[index][0], positions[index][1], 0.49)).join("")}
</svg>`;
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content.trimStart().replace(/[ \t]+$/gm, ""));
}

for (const screen of screens) {
  writeFile(path.join(svgDir, `${screen.file}.svg`), screen.svg);
}

writeFile(path.join(svgDir, "00-board.svg"), boardSvg());

function findMagick() {
  const candidates = ["/opt/homebrew/bin/magick", "/usr/local/bin/magick", "magick"];
  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ["-version"], { stdio: "ignore", env: execEnv });
      return candidate;
    } catch (_) {
      // Keep looking.
    }
  }
  return null;
}

const magick = findMagick();

if (!magick) {
  console.warn("ImageMagick not found. SVG mockups were generated, JPEG export skipped.");
  process.exit(0);
}

for (const fileName of fs.readdirSync(svgDir).filter((file) => file.endsWith(".svg"))) {
  const source = path.join(svgDir, fileName);
  const target = path.join(jpgDir, fileName.replace(/\.svg$/, ".jpg"));
  execFileSync(magick, [
    source,
    "-background",
    "white",
    "-alpha",
    "remove",
    "-quality",
    "92",
    target
  ], { env: execEnv });
}

for (const logo of ["cromoswap-logo", "cromoswap-mark"]) {
  execFileSync(magick, [
    path.join(assetDir, `${logo}.svg`),
    "-background",
    "white",
    "-alpha",
    "remove",
    "-quality",
    "92",
    path.join(assetDir, `${logo}.jpg`)
  ], { env: execEnv });
}

console.log(`Generated ${screens.length + 1} JPEG mockups in ${jpgDir}`);
