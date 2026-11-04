import test from 'node:test';
import assert from 'node:assert/strict';
import { TapIntent } from '../src/input.js';
import { GameAudio } from '../src/audio.js';
import { frameDelta } from '../src/timing.js';

test('a deliberate tap can be consumed only once',()=>{
  const t=new TapIntent();t.down(1,50,50,0);t.up(1,54,52,120);
  assert.equal(t.consume(),true);assert.equal(t.consume(),false);
});
test('dragging away and returning, long presses, and cancelled pointers never start play',()=>{
  const t=new TapIntent();t.down(1,50,50,0);t.move(1,50,150);t.up(1,50,50,200);assert.equal(t.consume(),false);
  t.down(1,0,0,0);t.up(1,0,0,700);assert.equal(t.consume(),false);
  t.down(1,0,0,0);t.cancel(1);t.up(1,0,0,50);assert.equal(t.consume(),false);
  t.down(2,0,0,100);t.up(2,0,0,180);assert.equal(t.consume(),true);
});
test('pinch and secondary-button gestures are rejected; a fresh tap still works',()=>{
  const t=new TapIntent();t.down(1,0,0,0);t.down(2,40,40,20);t.up(1,0,0,80);t.up(2,40,40,90);assert.equal(t.consume(),false);
  t.down(3,0,0,100,false);t.up(3,0,0,160);assert.equal(t.consume(),false);
  t.down(4,0,0,200);t.up(4,0,0,240);assert.equal(t.consume(),true);
});
function fakeContext(){
  const events=[];
  const context={state:'suspended',currentTime:1,destination:{},events,
    async resume(){this.state='running';events.push('resume');},
    createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},disconnect(){events.push('disconnect');},start(){events.push('start');},stop(){events.push('stop');}};},
    createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}};
  return context;
}
test('muted audio does not construct a context or play sounds',async()=>{
  const audio=new GameAudio({createContext(){throw Error('must not construct');}});
  assert.equal(await audio.unlock(),false);assert.equal(audio.play(),false);assert.equal(audio.state,'muted');
});
test('audio resumes before effects play and mute immediately stops active voices',async()=>{
  const context=fakeContext(),audio=new GameAudio({muted:false,createContext:()=>context});
  assert.equal(audio.play(),false);assert.equal(await audio.unlock(),true);
  assert.equal(audio.state,'running');assert.equal(audio.play(),true);assert.deepEqual(context.events.slice(0,2),['resume','start']);
  audio.setMuted(true);assert.equal(audio.play(),false);assert.equal(audio.voices.size,0);assert.equal(audio.state,'muted');
});
test('muting during a pending resume prevents delayed playback',async()=>{
  const context=fakeContext();let finish;
  context.resume=()=>new Promise(resolve=>{finish=()=>{context.state='running';resolve();};});
  const audio=new GameAudio({muted:false,createContext:()=>context});const pending=audio.unlock();
  audio.setMuted(true);finish();assert.equal(await pending,false);assert.equal(audio.play(),false);
});
test('resume rejection and unsupported audio report failure without breaking gameplay',async()=>{
  const context=fakeContext();context.resume=async()=>{throw Error('blocked');};
  const audio=new GameAudio({muted:false,createContext:()=>context});
  assert.equal(await audio.unlock(),false);assert.equal(audio.state,'unavailable');assert.equal(audio.play(),false);
  context.resume=async()=>{context.state='running';};assert.equal(await audio.unlock(),true);assert.equal(audio.play(),true);
  const unsupported=new GameAudio({muted:false,createContext(){throw Error('not supported');}});assert.equal(await unsupported.unlock(),false);
});
test('interrupted audio drops stale effects and can be resumed by a new gesture',async()=>{
  const context=fakeContext(),audio=new GameAudio({muted:false,createContext:()=>context});
  await audio.unlock();context.state='interrupted';assert.equal(audio.play(),false);
  assert.equal(await audio.unlock(),true);assert.equal(audio.play(),true);
});

test('restarting between frame timestamps cannot increase the round timer',()=>{
  assert.equal(frameDelta(100,105),0);
  assert.equal(Math.ceil(15-frameDelta(100,105)),15);
  assert.equal(frameDelta(116,100),.016);
  assert.equal(frameDelta(10000,100),.1);
});
