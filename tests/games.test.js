import test from 'node:test';
import assert from 'node:assert/strict';
import Flap from '../public/tapmint/src/games/flap.js';
import Snake from '../public/tapmint/src/games/snake.js';
import { createMole, stepMole, hitMole, createMemory, flipMemory, stepMemory } from '../public/tapmint/src/games/quick-games.js';
import { read, write, bestFor } from '../public/tapmint/src/storage.js';

test('Flap stays ready until input, then falls and ends on ground collision',()=>{
  const state=Flap.create('easy',()=>.5);const y=state.bird.y;
  Flap.step(state,1/240);assert.equal(state.bird.y,y);
  Flap.flap(state);for(let i=0;i<1000&&!state.over;i++)Flap.step(state,1/240);
  assert.equal(state.over,true);assert.equal(Flap.flap(state),false);
});
test('Flap scores a passed gate only once',()=>{
  const state=Flap.create('easy',()=>.5);state.started=true;
  state.posts=[{x:Flap.birdX-Flap.postWidth/2-.001,y:state.bird.y,scored:false}];
  assert.equal(Flap.step(state,1/240),'score');Flap.step(state,1/240);assert.equal(state.score,1);
});
test('Snake rejects reverse turns and counts food',()=>{
  const state=Snake.create(16,()=>0);assert.equal(Snake.turn(state,'left'),false);
  state.food={x:state.body[0].x+1,y:state.body[0].y};assert.equal(Snake.step(state,()=>0),'eat');assert.equal(state.score,1);assert.equal(state.body.length,4);
  assert.ok(!state.body.some(p=>p.x===state.food.x&&p.y===state.food.y));
});
test('Snake ends on a wall and cannot continue scoring',()=>{
  const state=Snake.create(16,()=>0);for(let i=0;i<16&&!state.over;i++)Snake.step(state);
  assert.equal(state.over,true);assert.equal(Snake.step(state),'over');
});
test('Mole can be hit only once and does not respawn in the same hole',()=>{
  const state=createMole(()=>.5);stepMole(state,.01);const first=state.active;
  assert.equal(hitMole(state,first),true);assert.equal(hitMole(state,first),false);assert.equal(state.score,1);
  stepMole(state,.31);assert.notEqual(state.active,first);
});
test('Mole timeout does not award a hit',()=>{
  const state=createMole(()=>.5);stepMole(state,.01);const old=state.active;
  stepMole(state,2);assert.equal(hitMole(state,old),false);assert.equal(state.score,0);
});
test('Memory mismatch locks extra flips until the reveal delay ends',()=>{
  const state=createMemory(()=>.5);const first=0,second=state.deck.findIndex(x=>x!==state.deck[first]);
  flipMemory(state,first);assert.equal(flipMemory(state,first),false);flipMemory(state,second);
  assert.equal(flipMemory(state,11),false);stepMemory(state,.9);assert.deepEqual(state.open,[]);assert.equal(state.moves,1);
});
test('Memory contains six pairs, wins after all matches, and rejects further input',()=>{
  const state=createMemory(()=>.5);
  for(let symbol=0;symbol<6;symbol++){const pair=state.deck.map((x,i)=>x===symbol?i:-1).filter(i=>i>=0);assert.equal(pair.length,2);pair.forEach(i=>flipMemory(state,i));}
  assert.equal(state.score,6);assert.equal(state.over,true);assert.equal(flipMemory(state,0),false);
});
test('Scores survive blocked storage for the current session, and malformed values are ignored',()=>{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});
  write('best:flap',4);assert.equal(bestFor('flap'),4);write('best:snake','bad');assert.equal(bestFor('snake'),0);assert.equal(read('missing',7),7);
  delete globalThis.localStorage;
});
