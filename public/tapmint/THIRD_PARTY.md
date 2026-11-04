# OpenGames attribution

TapMint adapts four games from https://github.com/opengames-dev/opengames-dev.github.io, retrieved November 4, 2026. Copyright (c) 2026 OpenGames contributors. The complete MIT license is retained in [licenses/OpenGames-MIT.txt](licenses/OpenGames-MIT.txt).

| TapMint game | Upstream source | Source Git blob SHA | Adaptation |
| --- | --- | --- | --- |
| Pocket Flap | `flap/logic.js` | `799593cecfb7431f912e27d65e192c0e203759aa` | Original logic with an ES module export; new portrait rendering, easy difficulty, 15-second cap |
| Mint Condition | `snake/logic.js` | `d26178e951f0465f5e0f0310769ca284165e1780` | Original logic with an ES module export; new rendering, 16-cell board, 30-second cap |
| Mole Patrol | `whac-a-mole/game.js` | `919ae50231685ac7d43052578c294523c77523bc` | Extracted spawn, expiry, scoring, and no-repeat behavior into `quick-games.js`; 15-second rounds |
| Double Take | `memory/game.js` | `4b9871f667c2175e68562f3d6d74ed6b85f044d6` | Adapted shuffle, pair matching, and mismatch delay into `quick-games.js`; six pairs and 30-second rounds |

TapMint's feed, controls, styling, and canvas scenery are new code. Emoji render with the operating system's fonts. DM Sans and Space Grotesk are requested from Google Fonts, with local sans-serif fallbacks. No PlayAtoms code or artwork is included.
