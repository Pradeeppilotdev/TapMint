// Adapted from OpenGames' whac-a-mole/game.js and memory/game.js.
// See licenses/OpenGames-MIT.txt and THIRD_PARTY.md.
export function createMole(random = Math.random) {
  return { score: 0, elapsed: 0, active: -1, previous: -1, expires: 0, nextSpawn: 0, random };
}
export function stepMole(state, dt) {
  state.elapsed += dt;
  if (state.active >= 0 && state.elapsed >= state.expires) { state.active = -1; state.nextSpawn = state.elapsed + .10; }
  if (state.active === -1 && state.elapsed >= state.nextSpawn) {
    const choices = Array.from({ length: 9 }, (_, i) => i).filter(i => i !== state.previous);
    state.active = choices[Math.floor(state.random() * choices.length)];
    state.previous = state.active;
    state.expires = state.elapsed + .75 - Math.min(state.elapsed / 60, 1) * .35;
  }
}
export function hitMole(state, index) {
  if (index !== state.active || state.active < 0 || state.elapsed >= state.expires) return false;
  state.score++; state.active = -1; state.nextSpawn = state.elapsed + .08; return true;
}
export function createMemory(random = Math.random) {
  const deck = Array.from({ length: 12 }, (_, i) => i % 6);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return { deck, matched: [], open: [], remaining: 0, score: 0, moves: 0, over: false };
}
export function flipMemory(state, index) {
  if (state.over || state.remaining > 0 || state.matched.includes(index) || state.open.includes(index) || index < 0 || index >= state.deck.length) return false;
  state.open.push(index);
  if (state.open.length === 2) {
    state.moves++;
    if (state.deck[state.open[0]] === state.deck[state.open[1]]) {
      state.matched.push(...state.open); state.open = []; state.score++;
      state.over = state.matched.length === state.deck.length;
    } else state.remaining = .85;
  }
  return true;
}
export function stepMemory(state, dt) {
  if (state.remaining > 0) { state.remaining = Math.max(0, state.remaining - dt); if (!state.remaining) state.open = []; }
}
