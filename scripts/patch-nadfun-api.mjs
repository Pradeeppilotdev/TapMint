/**
 * @nadfun/sdk 0.4.3 ships inverted/broken API hosts.
 * Run after npm install: node scripts/patch-nadfun-api.mjs
 */
import fs from "fs";
import path from "path";

const files = [
  path.join("node_modules", "@nadfun", "sdk", "dist", "index.js"),
  path.join("node_modules", "@nadfun", "sdk", "dist", "index.mjs"),
  path.join("node_modules", "@nadfun", "sdk", "src", "common", "constants.ts"),
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, "utf8");
  const next = text
    .replaceAll("https://dev-api.nad.fun", "https://dev-api.nadapp.net")
    .replaceAll("https://api.nadapp.net", "https://api.nad.fun");
  if (next !== text) {
    fs.writeFileSync(file, next);
    console.log("Patched", file);
  } else {
    console.log("OK", file);
  }
}
