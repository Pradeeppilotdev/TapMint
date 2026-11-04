import fs from "fs";
import path from "path";

const src = path.join("data", "markets.json");
const dest = path.join("public", "tapmint", "markets.json");
if (!fs.existsSync(src)) {
  console.error("Missing data/markets.json — run npm run create-markets first");
  process.exit(1);
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log("Synced", dest);
