// A tap must stay within its small tolerance for the entire gesture.
export class TapIntent {
  constructor() { this.pointers = new Set(); this.gesture = null; this.valid = false; }
  down(id, x, y, now, primary = true) {
    this.valid = false;
    this.pointers.add(id);
    if (!primary || this.pointers.size !== 1) { this.gesture = null; return; }
    this.gesture = { id, x, y, now, moved: false };
  }
  move(id, x, y) {
    const g = this.gesture;
    if (g?.id === id && Math.hypot(x - g.x, y - g.y) >= 12) g.moved = true;
  }
  up(id, x, y, now) {
    this.move(id, x, y);
    const g = this.gesture;
    this.valid = !!g && g.id === id && !g.moved && now - g.now < 650 && this.pointers.size === 1;
    this.pointers.delete(id); this.gesture = null;
  }
  cancel(id) { this.pointers.delete(id); this.gesture = null; this.valid = false; }
  consume() { const valid = this.valid; this.valid = false; return valid; }
}
