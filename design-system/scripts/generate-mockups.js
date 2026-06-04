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
  ink: "#17211f",
  muted: "#60706b",
  subtle: "#d8e1dd",
  paper: "#f7faf8",
  surface: "#ffffff",
  field: "#eef4f1",
  scan: "#1f8a5f",
  scanStrong: "#12613f",
  info: "#2f74d0",
  review: "#f2b84b",
  danger: "#d94f4f",
  privacy: "#6d57c7",
  camera: "#202927"
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

function badge(label, x, y, fill, color) {
  return [
    rect(x, y, 86, 30, fill, "none", 15),
    text(label, x + 43, y + 20, 12, 850, color, `text-anchor="middle"`)
  ].join("");
}

function logoMark(x, y, scale = 1) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      ${rect(0, 0, 42, 42, colors.ink, "none", 8)}
      <path d="M14 7h15c2 0 4 2 4 4v20c0 2-2 4-4 4H14c-2 0-4-2-4-4V11c0-2 2-4 4-4Z" fill="${colors.surface}"/>
      <rect x="22" y="13" width="8" height="2.6" rx="1.3" fill="${colors.review}"/>
      <rect x="27.4" y="13" width="2.6" height="8" rx="1.3" fill="${colors.review}"/>
      <rect x="14" y="19" width="14" height="3" rx="1.5" fill="${colors.scan}"/>
      <path d="M28 16.5 34 20.5 28 24.5Z" fill="${colors.scan}"/>
      <rect x="15" y="27" width="14" height="3" rx="1.5" fill="${colors.info}"/>
      <path d="M15 24.5 9 28.5 15 32.5Z" fill="${colors.info}"/>
      <circle cx="21" cy="25" r="2.4" fill="${colors.danger}"/>
    </g>`;
}

function screenShell(title, body, opts = {}) {
  const bg = opts.bg || colors.paper;
  const topColor = opts.topColor || colors.ink;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1170" height="2532" viewBox="0 0 390 844">
  ${rect(0, 0, 390, 844, bg, "none", 0)}
  ${opts.logo === false ? "" : logoMark(20, 20, 0.76)}
  ${text(title, opts.logo === false ? 20 : 58, 48, 15, 900, topColor)}
  ${body}
</svg>`;
}

function stickerPreview(x, y, code = "ARG07") {
  return `
    ${rect(x, y, 230, 150, colors.surface, colors.subtle)}
    ${rect(x + 78, y + 18, 86, 112, "#fbfdfc", colors.subtle)}
    ${rect(x + 122, y + 30, 48, 24, "rgba(242,184,75,0.12)", colors.review, 6)}
    ${text(code, x + 146, y + 47, 11, 900, colors.ink, `text-anchor="middle"`)}
  `;
}

const screens = [
  {
    file: "01-start",
    svg: screenShell(
      "cromoswap",
      `
      ${badge("Local first", 284, 24, "#eaf2ff", "#184f94")}
      ${text("Scan your", 20, 128, 34, 900)}
      ${text("duplicate stickers.", 20, 166, 34, 900)}
      ${text("Build a clean WC 2026 list from sticker backs.", 20, 210, 15, 650, colors.muted)}
      ${text("What is your name?", 20, 278, 12, 850, colors.muted)}
      ${rect(20, 292, 350, 54, colors.surface, colors.subtle)}
      ${text("Mauro", 36, 326, 18, 850)}
      ${button("Start scanning", 20, 368, 350, true)}
      ${rect(20, 440, 350, 80, colors.surface, colors.subtle)}
      ${text("Resume Mauro's session", 36, 470, 16, 850)}
      ${text("42 scans, 31 unique codes. Updated today.", 36, 496, 13, 700, colors.muted)}
      ${rect(20, 740, 350, 60, "rgba(109,87,199,0.08)", "rgba(109,87,199,0.24)")}
      ${text("Images stay on this device in the MVP.", 36, 776, 13, 850, "#4b3b91")}
      `
    )
  },
  {
    file: "02-permission",
    svg: screenShell(
      "Camera setup",
      `
      ${badge("Step 2", 284, 24, "#fff2cc", "#735000")}
      ${text("Use your camera", 20, 128, 34, 900)}
      ${text("to read sticker codes.", 20, 166, 34, 900)}
      ${text("Cromoswap looks for the top-right code corner.", 20, 210, 15, 650, colors.muted)}
      ${stickerPreview(80, 262, "USA13")}
      ${button("Allow camera", 20, 640, 350, true)}
      ${button("Enter codes manually", 20, 704, 350, false)}
      ${rect(20, 776, 350, 44, "rgba(109,87,199,0.08)", "rgba(109,87,199,0.24)")}
      ${text("No camera? Manual entry still works.", 36, 804, 13, 850, "#4b3b91")}
      `
    )
  },
  {
    file: "03-scan",
    svg: screenShell(
      "Mauro",
      `
      ${badge("42 saved", 284, 24, "#e6f3ed", colors.scanStrong)}
      ${rect(0, 74, 390, 770, colors.camera, "none", 0)}
      ${rect(86, 128, 218, 320, "rgba(255,255,255,0.05)", "rgba(255,255,255,0.9)", 10, `stroke-width="3"`)}
      ${rect(224, 150, 62, 50, "rgba(242,184,75,0.16)", colors.review, 8, `stroke-width="3"`)}
      ${text("Code corner", 221, 222, 12, 850, "#ffffff")}
      ${rect(20, 624, 350, 44, "rgba(255,255,255,0.94)", "none")}
      ${text("Place the code in the corner", 195, 652, 14, 900, colors.ink, `text-anchor="middle"`)}
      ${rect(20, 744, 104, 54, "rgba(255,255,255,0.12)", "rgba(255,255,255,0.24)")}
      ${rect(143, 744, 104, 54, "rgba(255,255,255,0.12)", "rgba(255,255,255,0.24)")}
      ${rect(266, 744, 104, 54, "rgba(255,255,255,0.12)", "rgba(255,255,255,0.24)")}
      ${text("Manual", 72, 778, 13, 850, "#ffffff", `text-anchor="middle"`)}
      ${text("Pause", 195, 778, 13, 850, "#ffffff", `text-anchor="middle"`)}
      ${text("List", 318, 778, 13, 850, "#ffffff", `text-anchor="middle"`)}
      `,
      { bg: colors.camera, topColor: "#ffffff", logo: false }
    )
  },
  {
    file: "04-confirm",
    svg: screenShell(
      "Check this code",
      `
      ${badge("High match", 284, 24, "#e6f3ed", colors.scanStrong)}
      ${stickerPreview(80, 112, "ARG07")}
      ${text("ARG07", 20, 330, 42, 950)}
      ${text("Confidence", 20, 372, 13, 850, colors.muted)}
      ${rect(108, 362, 190, 10, colors.field, "none", 5)}
      ${rect(108, 362, 164, 10, colors.scan, "none", 5)}
      ${text("86%", 318, 374, 13, 900, colors.muted)}
      ${button("Save sticker", 20, 626, 350, true)}
      ${button("Correct", 20, 690, 166, false)}
      ${button("Rescan", 204, 690, 166, false)}
      ${rect(20, 760, 350, 44, "#fee7e7", "#fee7e7")}
      ${text("Skip", 195, 788, 14, 900, "#8e2727", `text-anchor="middle"`)}
      `
    )
  },
  {
    file: "05-correct",
    svg: screenShell(
      "Correct code",
      `
      ${badge("Manual", 284, 24, "#fff2cc", "#735000")}
      ${text("Fix the sticker", 20, 128, 34, 900)}
      ${text("code.", 20, 166, 34, 900)}
      ${text("Use the team code and number 01 to 20.", 20, 210, 15, 650, colors.muted)}
      ${rect(20, 276, 226, 70, colors.surface, colors.subtle)}
      ${rect(264, 276, 106, 70, colors.surface, colors.subtle)}
      ${text("Prefix", 36, 304, 12, 850, colors.muted)}
      ${text("ARG", 36, 332, 24, 950)}
      ${text("No.", 280, 304, 12, 850, colors.muted)}
      ${text("07", 280, 332, 24, 950)}
      ${numberCell("01", 20, 386)}
      ${numberCell("02", 90, 386)}
      ${numberCell("03", 160, 386)}
      ${numberCell("04", 230, 386)}
      ${numberCell("05", 300, 386)}
      ${numberCell("06", 20, 438)}
      ${numberCell("07", 90, 438, true)}
      ${numberCell("08", 160, 438)}
      ${numberCell("09", 230, 438)}
      ${numberCell("10", 300, 438)}
      ${rect(20, 530, 350, 64, "#e6f3ed", "none")}
      ${text("ARG07", 195, 572, 34, 950, colors.scanStrong, `text-anchor="middle"`)}
      ${button("Save code", 20, 690, 350, true)}
      ${button("Cancel", 20, 754, 350, false)}
      `
    )
  },
  {
    file: "06-collection",
    svg: screenShell(
      "Collection",
      `
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
      `
    )
  },
  {
    file: "07-export",
    svg: screenShell(
      "Export",
      `
      ${badge("Ready", 284, 24, "#e6f3ed", colors.scanStrong)}
      ${text("Download", 20, 128, 34, 900)}
      ${text("your list.", 20, 166, 34, 900)}
      ${text("Text is best for sharing. JSON keeps evidence.", 20, 210, 15, 650, colors.muted)}
      ${rect(20, 270, 350, 220, colors.surface, colors.subtle)}
      ${summaryLine("Total scans", "42", 40, 314)}
      ${summaryLine("Unique codes", "31", 40, 358)}
      ${summaryLine("Duplicates", "8", 40, 402)}
      ${summaryLine("Images", "Local only", 40, 446)}
      ${button("Download text", 20, 626, 350, true)}
      ${button("Download JSON backup", 20, 690, 350, false)}
      ${rect(20, 768, 350, 44, "rgba(109,87,199,0.08)", "rgba(109,87,199,0.24)")}
      ${text("Text exports only codes and counts.", 36, 796, 13, 850, "#4b3b91")}
      `
    )
  }
];

function scanRow(x, y, code, meta, count) {
  return `
    ${rect(x, y, 350, 66, colors.surface, colors.subtle)}
    ${rect(x + 12, y + 10, 42, 46, "#fbfdfc", colors.subtle, 6)}
    ${text(code, x + 68, y + 31, 19, 950)}
    ${text(meta, x + 68, y + 52, 11, 750, colors.muted)}
    ${rect(x + 300, y + 18, 44, 30, count === "edit" ? "#fff2cc" : "#e6f3ed", "none", 15)}
    ${text(count, x + 322, y + 38, 12, 850, count === "edit" ? "#735000" : colors.scanStrong, `text-anchor="middle"`)}
  `;
}

function numberCell(label, x, y, active = false) {
  const fill = active ? "#e6f3ed" : colors.surface;
  const stroke = active ? colors.scan : colors.subtle;
  const color = active ? colors.scanStrong : colors.ink;
  return `
    ${rect(x, y, 50, 42, fill, stroke)}
    ${text(label, x + 25, y + 27, 13, 900, color, `text-anchor="middle"`)}
  `;
}

function summaryLine(label, value, x, y) {
  return `
    ${text(label, x, y, 14, 800, colors.muted)}
    ${text(value, 344, y, 14, 900, colors.ink, `text-anchor="end"`)}
    <line x1="${x}" y1="${y + 16}" x2="350" y2="${y + 16}" stroke="#e7eeeb"/>
  `;
}

function phoneFrame(svg, x, y, scale = 0.42) {
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      ${rect(-12, -12, 414, 868, "#101615", "none", 32)}
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
  ${text("cromoswap mockups", 126, 85, 42, 900)}
  ${text("Scanner-first screens for collectors, kids, and future swapping.", 128, 120, 22, 700, colors.muted)}
  ${screens.map((screen, index) => phoneFrame(screen.svg, positions[index][0], positions[index][1], 0.49)).join("")}
</svg>`;
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content.trimStart());
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
