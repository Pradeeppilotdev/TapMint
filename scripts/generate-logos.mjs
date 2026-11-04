import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "assets", "token-logos");
fs.mkdirSync(outDir, { recursive: true });

const logos = [
  { id: "flap", label: "FLAP", bg: "#6E54FF", fg: "#FFFFFF" },
  { id: "mole", label: "MOLE", bg: "#1B4332", fg: "#3DCF8E" },
  { id: "snake", label: "SNEK", bg: "#3D2C08", fg: "#F5A524" },
  { id: "memory", label: "MEMO", bg: "#3B0A2A", fg: "#FF6B9D" },
];

for (const logo of logos) {
  const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${logo.bg}"/>
      <stop offset="100%" stop-color="#0E091C"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#g)"/>
  <circle cx="256" cy="210" r="88" fill="${logo.fg}" opacity="0.18"/>
  <text x="256" y="230" text-anchor="middle" font-family="Arial Black, Helvetica, sans-serif"
        font-size="92" font-weight="700" fill="${logo.fg}">${logo.label}</text>
  <text x="256" y="360" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="28" fill="${logo.fg}" opacity="0.7">TapMint · Testnet</text>
</svg>`;

  const out = path.join(outDir, `${logo.id}.png`);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log("Wrote", out);
}
