// A frame timestamp can precede the user event that restarted the round.
// Never run the simulation backwards or count a background-tab gap as play.
export function frameDelta(now, last) {
  return Math.max(0, Math.min((now - last) / 1000, .1));
}

// Infinity means the game ends through its own rules or an explicit Finish.
export function roundClock(elapsed, dt, duration) {
  const next = Math.min(duration, elapsed + Math.max(0, dt));
  const timed = Number.isFinite(duration);
  const seconds = timed ? Math.ceil(Math.max(0, duration - next)) : Math.floor(next);
  return { elapsed: next, over: timed && next >= duration,
    label: timed ? `${seconds}s` : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
    progress: timed ? Math.max(0, 1 - next / duration) : 1 };
}
