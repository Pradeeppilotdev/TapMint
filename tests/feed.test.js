import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedNavigation, swipeDirection } from '../src/feed.js';

test('a long trackpad wheel gesture moves exactly one game, even after animation ends', () => {
  const feed = new FeedNavigation(); feed.reset(4);
  assert.equal(feed.wheel(60, 0), true);
  for (let now = 30; now < 1500; now += 30) assert.equal(feed.wheel(60, now), false);
  assert.equal(feed.index, 1);
  assert.equal(feed.wheel(60, 1800), true); assert.equal(feed.index, 2);
});
test('small wheel noise and horizontal or short touch movements do not advance', () => {
  const feed = new FeedNavigation(); feed.reset(4);
  assert.equal(feed.wheel(10, 0), false); assert.equal(feed.wheel(15, 20), false);
  assert.equal(feed.index, 0);
  assert.equal(swipeDirection(3, 12, 15, 700), 0);
  assert.equal(swipeDirection(150, 80, 100, 700), 0);
  assert.equal(swipeDirection(2, -90, 400, 700), 1);
  assert.equal(swipeDirection(2, 40, 60, 700), -1);
});
test('running-game lock blocks wheel and all direct navigation', () => {
  const feed = new FeedNavigation(); feed.reset(4, 1); feed.setLocked(true);
  assert.equal(feed.move(1, 100), false); assert.equal(feed.move(-1, 200), false);
  assert.equal(feed.wheel(500, 300), false); assert.equal(feed.index, 1);
});
test('unlocking does not let residual momentum skip a game; a new gesture works', () => {
  const feed = new FeedNavigation(); feed.reset(4, 1); feed.setLocked(true);
  feed.wheel(90, 100); feed.setLocked(false);
  assert.equal(feed.wheel(90, 150), false); assert.equal(feed.index, 1);
  assert.equal(feed.wheel(90, 600), true); assert.equal(feed.index, 2);
});
test('feed stops at both boundaries and blocks rapid repeated navigation', () => {
  const feed = new FeedNavigation(); feed.reset(4);
  assert.equal(feed.move(-1, 0), false); assert.equal(feed.move(1, 1), true);
  assert.equal(feed.move(1, 100), false); assert.equal(feed.move(2, 500), true);
  assert.equal(feed.move(1, 900), false); assert.equal(feed.index, 3);
  feed.reset(0); assert.equal(feed.move(1, 2000), false);
});
