import { mkdir, cp, rm, readFile, writeFile } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const path of ['index.html', 'src', 'licenses']) await cp(path, `dist/${path}`, { recursive: true });
// A small dependency-free bundle also supports opening dist/index.html directly.
const sources = ['src/games/flap.js', 'src/games/snake.js', 'src/games/quick-games.js', 'src/storage.js', 'src/layout.js', 'src/art.js', 'src/feed.js', 'src/audio.js', 'src/input.js', 'src/timing.js', 'src/theme.js', 'src/app.js'];
let bundle = '';
for (const source of sources) {
  let text = await readFile(source, 'utf8');
  text = text.replace(/^import .*;\n/gm, '').replace(/^export default (\w+);/gm, '').replace(/^export /gm, '');
  bundle += text + '\n';
  if (source.endsWith('/flap.js')) bundle += 'const Flap = FlapLogic;\n';
  if (source.endsWith('/snake.js')) bundle += 'const Snake = SnakeLogic;\n';
}
let html = await readFile('index.html', 'utf8');
let css = await readFile('src/styles.css', 'utf8');
// Embed exported Figma SVGs so the standalone build remains portable.
for (const name of ['flap-preview.svg', 'flap-preview-wide.svg']) {
  const asset = await readFile(`src/assets/${name}`);
  css = css.replaceAll(`./assets/${name}`, `data:image/svg+xml;base64,${asset.toString('base64')}`);
}
html = html.replace('<link rel="stylesheet" href="/src/styles.css">', () => `<style>${css}</style>`)
  .replace('<script type="module" src="/src/app.js"></script>', () => `<script type="module">${bundle.replaceAll('</script', '<\\/script')}</script>`);
await writeFile('dist/index.html', html);
console.log('Built TapMint into dist/ — deploy to any static host or open dist/index.html.');
