# TapMint

**One more game.**

A mobile-first vertical feed of instant games. This milestone implements the Web2 arcade for the atomic-games + memecoin-launchpad concept. It requires no wallet, account, backend, build dependencies, or API keys.

## Run

Requires Node.js 20 or newer. No dependency installation is needed.

```sh
npm run dev
```

Open http://localhost:5173. Set `PORT` to choose another port.

```sh
npm test
npm run build
```

The build produces `dist/index.html`, a self-contained HTML/JS/CSS bundle that can also be opened directly. Upload `dist/` to a static host. Optional Google Fonts require a connection; gameplay and fallback fonts work offline. Direct links and sharing require a hosted HTTP(S) URL.

## Games

| Game | Controls | Round |
| --- | --- | --- |
| Pocket Flap | Tap the scene / Space | Until collision |
| Mole Patrol | Tap a mole / keys 1–9 | 30 seconds, 60 seconds, or endless |
| Mint Condition | Arrow keys / on-screen direction pad | Until collision |
| Double Take | Tap cards / Tab and Enter | Until six matched pairs; no time limit |

The white and Monad purple (`#6E54FF`) interface uses a fixed viewport and vertically animated cards. A deliberate swipe or wheel gesture moves exactly one game; trackpad momentum cannot skip through the collection. J/K, Page Up/Down, and navigation arrows also switch games. Reduced-motion settings disable the slide animation.

While a round is running, short swipes and small scrolls are ignored. A long vertical swipe (roughly one third of the card, capped at 220 px) or a longer wheel gesture switches exactly one game and pauses the current round. A quick flick alone cannot bypass this protection. Navigation buttons and filters remain locked until you tap Pause (or press P) or finish the round. Returning to a paused game preserves progress. Tap its play area or Resume to continue. R restarts. Snake steering uses arrow keys or its on-screen direction pad. Switching browser tabs or opening a dialog pauses the current round. The hint below the feed explains the long-swipe gesture during play.

Saved games, high scores, Mole round length, sound preferences, and counts of starts/completions/retries use `tapmint:` localStorage keys, with in-memory fallback when blocked. They are device-local, unauthenticated, and not suitable as trusted scores or token-reward inputs. Switching feed filters recreates game sessions. No analytics are transmitted.

Direct links use `?game=flap`, `?game=mole`, `?game=snake`, or `?game=memory`. Unknown game IDs fall back to the first game. Scores are specific to each game and are not compared across games. Mole Patrol keeps separate best scores for 30-second, 60-second, and endless rounds; earlier 15-second scores stay stored but are not mixed into the new modes. Moles initially stay up for 0.75 seconds, speeding up to 0.4 seconds over a minute, with an 80 ms gap after a hit. The custom three-button round picker exposes all modes directly, with a visible selected state. It stays in place and is disabled during a round. Results and replay use the same playfield dimensions, so the board does not resize when restarting. Endless Mole rounds have an explicit Finish button.

## Design

The editable [Figma redesign](https://www.figma.com/design/jOrDBj3JQPxOd701KEQgw8) includes mobile discovery, mobile active-play, and desktop discovery frames. The implementation follows the [official Monad brandkit](https://monad.xyz/brand-and-media-kit): primary purple `#6E54FF`, lavender `#DDD7FE`, near-black `#0E091C`, and white. The earlier `#A190FF` remains a supporting accent.

Inter is used as the heading fallback because Britti Sans was unavailable in the connected Figma environment. Body text uses Inter and small labels use Roboto Mono. TapMint retains its own play mark; this is a Web2 preview, not a claim of Monad integration.

The earlier Pocket Flap SVG exports remain in `src/assets/`. The current expanded playfield uses responsive canvas scenery so the bird, pipes, and Snake cells retain their proportions. The compact information panel leaves most of the card available for play. Navigation arrows, sound controls, score units, and sharing through the help menu are retained. The Figma file documents the preceding visual direction; the live implementation includes the newer touch-to-play layout.

## Themes and responsive rendering

Use the Light/Dark switch in the header. The first visit follows the device theme; an explicit choice is saved in this browser and applied before the next page paint. The theme covers menus, dialogs, controls, and game scenery. Switching during play redraws the scene without resetting the round.

Pocket Flap uses one scale for both physics axes and the bird, with the arena fitted inside the available playfield. Extra space shows scenery rather than stretching the game. Memory cards remain square and mole targets remain circular at both ready and active sizes. Snake cells remain square, with space reserved for the actual on-screen direction controls.

## Touch and sound

A deliberate tap anywhere in the play area starts a round. The same tap reveals the selected memory card or hits the visible first mole. A drag, swipe, long press, cancelled touch, or multi-touch gesture does not start play. After a round ends, game-area taps and the gameplay Space key leave the result visible. Choose **Play again** beneath **Round complete** in the game area to restart (or use the explicit R shortcut). Keyboard-accessible Play, Pause, Resume, and Play again controls remain available.

Sound is muted by default, with a visible **Sound off** control before play. Enabling it resumes Web Audio inside the user gesture and plays a confirmation tone once ready. The saved choice is respected; starting/resuming a round unlocks audio again when needed. Interrupted audio drops stale effects, mute stops current tones, and errors expose a retry action. Check the phone's media volume and output route if the browser says Sound on but cannot be heard.

## Structure

- `src/app.js`: feed, round lifecycle, controls, sharing, local stats.
- `src/layout.js`: aspect-preserving arena and grid geometry.
- `src/theme.js`: persistent light/dark theme and system preference.
- `src/input.js`: tap intent, movement tolerance, long-press and multi-touch rejection.
- `src/audio.js`: gesture-unlocked audio, mute, interruption recovery, and effect playback.
- `src/feed.js`: card transitions, gesture thresholds, momentum handling, and gameplay navigation lock.
- `src/games/`: adapted OpenGames logic.
- `src/art.js`: original canvas scenery and rendering.
- `src/styles.css`: responsive desktop and mobile layout.
- `scripts/`: dependency-free development server and static build.
- `tests/`: game logic regression tests.

See [THIRD_PARTY.md](THIRD_PARTY.md) for source attribution and retained license. The original game logic is integrated as local modules; no third-party iframe or live game host is required.

## Next milestone

Creator customization and a memecoin publishing flow can build on the game catalogue. This version does not implement creator uploads, a backend, wallets, tokens, swaps, or rewards.

## Verification

Thirty-one automated checks cover the four game engines, local storage, guarded long-swipe navigation and wheel momentum, tap intent, completed-round input protection, timed/endless clocks, faster Mole pacing, audio resume/mute recovery, frame timing, canvas proportions, square grids, and theme resolution. Browser checks also cover a short swipe staying in an active round, a long swipe switching and preserving paused progress, Mole round selection and manual completion, and repeated taps leaving results visible. Phone layouts are checked at 390 × 844 and 320 × 568. Physical-device touch behaviour and audible speaker output still require device testing.
