// One gesture advances one card. A running round owns input until it is paused.
export class FeedNavigation {
  constructor() { this.reset(0); }
  reset(count, index = 0) {
    this.count = count; this.index = index; this.locked = false;
    this.busyUntil = 0; this.wheelAt = -Infinity; this.wheelTotal = 0; this.wheelUsed = false;
  }
  setLocked(value) { this.locked = value; this.wheelTotal = 0; this.wheelUsed = true; }
  move(delta, now) {
    if (this.locked || now < this.busyUntil) return false;
    const next = Math.max(0, Math.min(this.count - 1, this.index + delta));
    if (next === this.index || this.count === 0) return false;
    this.index = next; this.busyUntil = now + 360; return true;
  }
  wheel(delta, now) {
    if (now - this.wheelAt > 200) { this.wheelTotal = 0; this.wheelUsed = false; }
    this.wheelAt = now;
    if (this.locked || now < this.busyUntil || this.wheelUsed) { this.wheelUsed = true; return false; }
    if (Math.sign(delta) !== Math.sign(this.wheelTotal)) this.wheelTotal = 0;
    this.wheelTotal += delta;
    if (Math.abs(this.wheelTotal) < 55) return false;
    this.wheelUsed = true;
    return this.move(Math.sign(this.wheelTotal), now);
  }
}

export function swipeDirection(dx, dy, elapsed, height) {
  if (Math.abs(dy) < Math.abs(dx) * 1.3) return 0;
  const distance = Math.min(90, Math.max(55, height * .12));
  const deliberateFlick = Math.abs(dy) > 32 && elapsed > 0 && Math.abs(dy) / elapsed > .5;
  return Math.abs(dy) >= distance || deliberateFlick ? -Math.sign(dy) : 0;
}

export function createFeedPager(feed, onChange, reducedMotion) {
  const navigation = new FeedNavigation();
  let track, gesture = null, suppressClickUntil = 0, settleTimer;
  const pointers = new Set();
  function position(drag = 0) {
    if (track) track.style.transform = `translate3d(0, calc(${-navigation.index * 100}% + ${drag}px), 0)`;
  }
  function settle(changed) {
    feed.classList.remove('is-dragging'); position();
    if (!changed) return;
    feed.classList.add('is-transitioning');
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => feed.classList.remove('is-transitioning'), reducedMotion ? 0 : 360);
    onChange(navigation.index);
  }
  function move(delta) { const changed = navigation.move(delta, performance.now()); settle(changed); return changed; }
  feed.addEventListener('wheel', event => {
    if (event.ctrlKey) return; // Preserve browser pinch-to-zoom.
    event.preventDefault();
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? feed.clientHeight : 1;
    settle(navigation.wheel(event.deltaY * factor, performance.now()));
  }, { passive: false });
  feed.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pointers.add(event.pointerId);
    if (pointers.size > 1) { gesture = null; settle(false); return; }
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now(),
      blocked: navigation.locked || performance.now() < navigation.busyUntil, dragged: false };
  });
  feed.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId || gesture.blocked || navigation.locked) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.dragged && (Math.abs(dy) < 12 || Math.abs(dy) <= Math.abs(dx) * 1.3)) return;
    gesture.dragged = true;
    feed.setPointerCapture(event.pointerId);
    feed.classList.add('is-dragging');
    const atEdge = navigation.index === 0 && dy > 0 || navigation.index === navigation.count - 1 && dy < 0;
    position(Math.max(-feed.clientHeight * .8, Math.min(feed.clientHeight * .8, dy)) * (atEdge ? .15 : 1));
  });
  function end(event, cancelled = false) {
    pointers.delete(event.pointerId);
    if (!gesture || gesture.id !== event.pointerId) return;
    const current = gesture; gesture = null;
    if (current.dragged) suppressClickUntil = performance.now() + 400;
    const direction = cancelled || current.blocked || navigation.locked ? 0 :
      swipeDirection(event.clientX - current.x, event.clientY - current.y, performance.now() - current.at, feed.clientHeight);
    if (direction) suppressClickUntil = performance.now() + 400;
    if (direction) move(direction); else settle(false);
  }
  feed.addEventListener('pointerup', event => end(event));
  feed.addEventListener('pointercancel', event => end(event, true));
  feed.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  window.addEventListener('resize', () => { gesture = null; settle(false); });
  return {
    navigation,
    reset(element, count, index) {
      clearTimeout(settleTimer); track = element; gesture = null; pointers.clear();
      navigation.reset(count, index); feed.classList.remove('is-dragging', 'is-transitioning'); position();
    },
    setLocked(value) {
      if (navigation.locked === value) return;
      navigation.setLocked(value); gesture = null; settle(false);
    },
    goTo(index) { return move(index - navigation.index); },
  };
}
