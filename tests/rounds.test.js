import test from 'node:test';
import assert from 'node:assert/strict';
import { roundClock } from '../src/timing.js';
import { playAreaAction } from '../src/input.js';
import { createMole, stepMole, hitMole } from '../src/games/quick-games.js';

test('continued gameplay taps cannot restart a completed round',()=>{
  assert.equal(playAreaAction('ready'),'start');
  assert.equal(playAreaAction('paused'),'resume');
  assert.equal(playAreaAction('running'),'input');
  for(let tap=0;tap<20;tap++)assert.equal(playAreaAction('over'),null);
});
test('unlimited rounds count upward beyond the previous time limits without ending',()=>{
  const clock=roundClock(125,.1,Infinity);
  assert.equal(clock.elapsed,125.1);assert.equal(clock.over,false);
  assert.equal(clock.label,'2:05');assert.equal(Number.isFinite(clock.progress),true);
});
test('timed rounds finish exactly at their chosen limit and keep valid progress',()=>{
  for(const duration of [30,60]){
    assert.equal(roundClock(duration-1,.1,duration).over,false);
    const end=roundClock(duration-.01,.1,duration);
    assert.equal(end.over,true);assert.equal(end.elapsed,duration);
    assert.equal(end.label,'0s');assert.equal(end.progress,0);
  }
});
test('moles respawn quickly after hits and speed up with a playable lower limit',()=>{
  const state=createMole(()=>.5);stepMole(state,.01);
  assert.ok(state.expires-state.elapsed<=.75);
  const hole=state.active;assert.equal(hitMole(state,hole),true);
  stepMole(state,.079);assert.equal(state.active,-1);
  stepMole(state,.002);assert.ok(state.active>=0);assert.notEqual(state.active,hole);
  state.elapsed=1000;state.active=-1;stepMole(state,.01);
  assert.ok(Math.abs(state.expires-state.elapsed-.4)<1e-9);
});
