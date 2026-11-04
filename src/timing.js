// A frame timestamp can precede the user event that restarted the round.
// Never run the simulation backwards or count a background-tab gap as play.
export function frameDelta(now, last) {
  return Math.max(0, Math.min((now - last) / 1000, .1));
}
