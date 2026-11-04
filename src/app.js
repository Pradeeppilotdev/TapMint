import Flap from './games/flap.js';
import Snake from './games/snake.js';
import { createMole, stepMole, hitMole, createMemory, flipMemory, stepMemory } from './games/quick-games.js';
import { read, write, bestFor } from './storage.js';
import { drawScene } from './art.js';
import { createFeedPager } from './feed.js';
import { GameAudio } from './audio.js';
import { TapIntent } from './input.js';
import { frameDelta } from './timing.js';

const games = [
  { id:'flap', name:'Pocket Flap', emoji:'🐤', category:'ONE TAP. INSTANT OBSESSION.', description:'Find your rhythm. Fly a little further.', tags:['One tap','Reflex','15-second rounds'], duration:15, unit:'gates', instruction:'Tap the game or press Space to flap.' },
  { id:'mole', name:'Mole Patrol', emoji:'🐹', category:'QUICK REFLEXES', description:'They pop up. You tap back. Keep up.', tags:['Tap targets','Reflex','15-second rounds'], duration:15, unit:'hits', instruction:'Tap the moles as they appear. Keyboard: 1–9.' },
  { id:'snake', name:'Mint Condition', emoji:'〰', category:'A FRESH CLASSIC', description:'A familiar classic. An appetite for more.', tags:['Directional','Classic','30-second rounds'], duration:30, unit:'bites', instruction:'Use the arrow keys or on-screen direction buttons.' },
  { id:'memory', name:'Double Take', emoji:'✿', category:'A LITTLE BRAIN BREAK', description:'Look twice. Match once. Find all six pairs.', tags:['Match pairs','Memory','30-second rounds'], duration:30, unit:'pairs', instruction:'Tap two cards to find a pair. Find all six to win.' },
];
const $ = (selector, root=document) => root.querySelector(selector);
const feed = $('#feed');
const savedValue = read('saved', []);
let saved = new Set(Array.isArray(savedValue) ? savedValue.filter(id=>games.some(g=>g.id===id)) : []);
let filter='all', sessions=[], active=null, toastTimer;
const audio = new GameAudio({muted:read('muted',true)!==false,onChange:syncSound});
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pager = createFeedPager(feed, index => selectSession(sessions[index]), reducedMotion);
const icons=['●','▲','◆','✿','♥','ϟ'];
const heartIcon='<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M19.1 4.1a5.04 5.04 0 0 0-7.13 0L11 5.07l-.97-.97A5.04 5.04 0 0 0 2.9 11.23L11 19.33l8.1-8.1a5.04 5.04 0 0 0 0-7.13Z"/></svg>';
const symbolNames=['Circle','Triangle','Diamond','Flower','Heart','Bolt'];
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600);}
function sound(frequency=520){audio.play(frequency);}
function syncSound(){
  document.querySelectorAll('.sound-button').forEach(button=>{
    const state=audio.state;
    button.dataset.audioState=state;
    button.textContent=audio.muted?'Sound off':state==='running'?'Sound on':state==='unavailable'?'Retry sound':'Enable sound';
    button.setAttribute('aria-label',audio.muted?'Enable sound':state==='running'?'Mute sound':state==='unavailable'?'Retry enabling sound':'Enable sound');
    button.setAttribute('aria-pressed',String(!audio.muted&&state==='running'));
  });
}
async function enableRoundSound(session){
  if(await audio.unlock())if(session.active&&session.mode==='running')sound(520);
}
async function toggleSound(){
  if(!audio.muted&&audio.state==='running'){audio.setMuted(true);write('muted',true);return;}
  audio.setMuted(false);write('muted',false);
  if(await audio.unlock()){sound(660);toast('Sound on · game effects enabled');}
  else if(!audio.muted)toast('Sound could not start. Tap Retry sound to try again.');
}

function metric(game,event){const key=`metrics:${game}`;const value=read(key,{});const stats=value && typeof value==='object' && !Array.isArray(value)?value:{};stats[event]=(Number(stats[event])||0)+1;write(key,stats);}
function syncSaved(){ $('#saved-count').textContent=saved.size;document.querySelectorAll('.save-button').forEach(button=>{const isSaved=saved.has(button.dataset.game);button.setAttribute('aria-pressed',String(isSaved));button.setAttribute('aria-label',`${isSaved?'Unsave':'Save'} ${games.find(g=>g.id===button.dataset.game).name}`);}); }
function toggleSaved(id){if(filter==='saved'&&!canLeaveGame())return;if(saved.has(id))saved.delete(id);else saved.add(id);write('saved',[...saved]);syncSaved();if(filter==='saved')renderFeed();}
async function share(game){
  if(location.protocol==='file:'){toast('Share links become available when TapMint is hosted.');return;}
  const url=new URL(location.href);url.search='';url.searchParams.set('game',game.id);
  if(navigator.share){try{await navigator.share({title:`${game.name} on TapMint`,text:'Your next little play break.',url:url.href});return;}catch(error){if(error.name==='AbortError')return;}}
  try{await navigator.clipboard.writeText(url.href);toast('Game link copied. Send a little play break.');}
  catch{openModal('Share this game',`<p>Copy this direct link:</p><input aria-label="Game link" readonly class="share-link" />`);$('#modal-body input').value=url.href;$('#modal-body input').select();}
}
function openModal(title,content){active?.pause();$('#modal-title').textContent=title;$('#modal-body').innerHTML=content;$('#modal').showModal();}
$('#close-modal').onclick=()=>$('#modal').close();
$('#modal').addEventListener('click',event=>{if(event.target===$('#modal')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
$('#help').onclick=()=>{openModal('A little play break.',`<p>Tap <strong>anywhere in the game area</strong> to start, or use the Play button. A swipe only browses; it never starts a game. Each game lasts 15–30 seconds, or until you lose. Retry as often as you like.</p><p>Swipe vertically or scroll to move exactly one game at a time. Use <kbd>J</kbd> / <kbd>K</kbd> on desktop. Arrow keys steer Snake; <kbd>P</kbd> pauses and <kbd>R</kbd> retries.</p><p><strong>While you play, the feed stays locked.</strong> Accidental swipes cannot switch games. Tap Pause to unlock the feed, or finish your round. Tap the game area or Resume to continue a paused round.</p><p>Use <strong>Sound off</strong> to enable game sounds; a short tone confirms audio is ready. Use the heart to save a game. Best scores and saved games stay in this browser when storage is available. Switching browser tabs pauses your round.</p><p>This first build is the Web2 arcade. Wallets, tokens, and the launchpad come later.</p><button class="dialog-action" id="share-current">Share this game ↗</button>`);$('#share-current').disabled=!active;$('#share-current').onclick=()=>{if(active){$('#modal').close();share(active.game);}};};
$('#nav-best').onclick=()=>openModal('Your personal bests',games.map(g=>`<div class="score-row"><span>${g.emoji} ${g.name}</span><strong>${bestFor(g.id)} ${g.unit}</strong></div>`).join('')+'<p>Personal scores on this device. No global leaderboard yet.</p>');

class GameSession{
  constructor(game){
    this.game=game;this.mode='ready';this.elapsed=0;this.raf=0;this.last=0;this.accumulator=0;this.active=false;this.state=this.createState();
    this.el=document.createElement('article');this.el.className='game-section';this.el.dataset.id=game.id;this.el.setAttribute('aria-label',game.name);
    this.el.innerHTML=`<div class="playfield" role="group" aria-label="${game.name} play area"><div class="game-visual"><canvas aria-label="${game.name} game area" role="img"></canvas></div><div class="tap-prompt" aria-hidden="true"><span class="tap-symbol">↗</span><strong>Tap anywhere to play</strong><small>${game.instruction}</small></div></div><div class="timer-bar"></div><div class="game-header"><span class="game-chip">${String(games.indexOf(game)+1).padStart(2,'0')} / QUICK PLAY</span><div class="round-tools"><button class="sound-button" aria-label="Enable sound" aria-pressed="false">Sound off</button><span class="round-length">${game.duration}s</span><button class="icon-button pause-button" aria-label="Pause game" hidden>Ⅱ</button></div></div><div class="hud"><span class="hud-score"><small>SCORE</small><span class="score-value">00</span></span><span class="hud-time">${game.duration}s</span></div><div class="game-content"><div class="title-row"><div><div class="game-meta">${game.category}</div><h2>${game.name}</h2></div><button class="save-button" data-game="${game.id}" aria-label="Save ${game.name}" aria-pressed="false">${heartIcon}</button></div><p class="description">${game.description}</p><p class="round-status" role="status" aria-live="polite"></p><div class="play-row"><span class="best-line">Best <b class="best-value">${bestFor(game.id)}</b> ${game.unit}</span><button class="play-button">Play now ↗</button></div></div>`;
    this.field=$('.playfield',this.el);
    this.canvas=$('canvas',this.el);
    this.resizeObserver=new ResizeObserver(()=>this.draw());this.resizeObserver.observe(this.canvas);
    this.playButton=$('.play-button',this.el);this.status=$('.round-status',this.el);
    this.playButton.onclick=()=>this.primary();$('.save-button',this.el).onclick=()=>toggleSaved(game.id);
    $('.pause-button',this.el).onclick=()=>this.mode==='running'?this.pause():this.resume();
    $('.sound-button',this.el).onclick=toggleSound;
    const tap=new TapIntent();this.inputAbort=new AbortController();
    const listenerOptions={signal:this.inputAbort.signal};
    this.field.addEventListener('pointerdown',e=>tap.down(e.pointerId,e.clientX,e.clientY,performance.now(),e.button===0));
    window.addEventListener('pointermove',e=>tap.move(e.pointerId,e.clientX,e.clientY),listenerOptions);
    window.addEventListener('pointerup',e=>tap.up(e.pointerId,e.clientX,e.clientY,performance.now()),listenerOptions);
    window.addEventListener('pointercancel',e=>tap.cancel(e.pointerId),listenerOptions);
    this.field.addEventListener('click',e=>{
      // Keyboard clicks have detail=0. Pointer clicks must follow a genuine tap.
      if(e.detail!==0&&!tap.consume())return;
      if(!this.active||feed.classList.contains('is-transitioning'))return;
      const before=this.mode;
      if(before==='ready'||before==='over')this.start();
      else if(before==='paused')this.resume();
      if(this.mode!=='running')return;
      const tile=e.target.closest('[data-tile]'),direction=e.target.closest('[data-dir]');
      if(tile)this.input(Number(tile.dataset.tile));
      else if(direction&&game.id==='snake'){if(Snake.turn(this.state,direction.dataset.dir))sound(360);}
      else if(game.id==='flap'&&before==='running'){Flap.flap(this.state);sound(400);}
    });
    if(game.id==='mole'||game.id==='memory')this.makeBoard();
    if(game.id==='snake'){
      const pad=document.createElement('div');pad.className='dpad';pad.setAttribute('aria-label','Snake controls');pad.innerHTML=[['up','↑'],['left','←'],['down','↓'],['right','→']].map(([d,i])=>`<button aria-label="Move ${d}" data-dir="${d}">${i}</button>`).join('');this.field.append(pad);
    }
    this.draw();
  }
  createState(){switch(this.game.id){case'flap':return Flap.create('easy');case'snake':return Snake.create(16);case'mole':return createMole();case'memory':return createMemory();}}
  makeBoard(){
    this.board=document.createElement('div');this.board.className=`board ${this.game.id==='mole'?'mole':'memory'}-board`;
    this.buttons=Array.from({length:this.game.id==='mole'?9:12},(_,i)=>{const button=document.createElement('button');button.className=this.game.id==='mole'?'hole':'memory-tile';button.setAttribute('aria-label',this.game.id==='mole'?`Hole ${i+1}`:`Card ${i+1}, face down`);button.innerHTML=this.game.id==='mole'?`<span class="mole-character" aria-hidden="true">🐹</span><small>${i+1}</small>`:'✦';button.dataset.tile=i;this.board.append(button);return button;});this.field.append(this.board);
  }
  input(index){if(this.mode!=='running')return;const before=this.state.score;const ok=this.game.id==='mole'?hitMole(this.state,index):flipMemory(this.state,index);if(ok)sound(this.state.score>before?720:440);this.update();this.draw();if(this.state.over)this.finish('All six pairs found!');}
  primary(){if(this.mode==='ready'||this.mode==='over')this.start();else if(this.mode==='paused')this.resume();else this.pause();}
  start(){
    if(!this.active||feed.classList.contains('is-transitioning'))return;
    if(this.mode!=='ready')metric(this.game.id,'retries');metric(this.game.id,'starts');
    this.stopFrame();this.state=this.createState();
    if(this.game.id==='mole'){this.state.active=4;this.state.previous=4;this.state.expires=1.15;}
this.elapsed=0;this.accumulator=0;this.mode='running';this.el.classList.add('is-started','is-playing');
    this.status.textContent=this.game.instruction;this.playButton.textContent='Ⅱ Pause';$('.pause-button',this.el).textContent='Ⅱ';$('.pause-button',this.el).setAttribute('aria-label','Pause game');
    if(this.game.id==='flap')Flap.flap(this.state);
    $('.pause-button',this.el).disabled=false;enableRoundSound(this);syncNavigation();feed.focus({preventScroll:true});this.update();this.draw();this.wake();
  }
  stopFrame(){cancelAnimationFrame(this.raf);this.raf=0;}
  wake(){if(!this.raf&&this.mode==='running'&&this.active){this.last=performance.now();this.raf=requestAnimationFrame(t=>this.tick(t));}}
  pause(){if(this.mode!=='running')return;this.mode='paused';this.stopFrame();this.el.classList.remove('is-playing');this.status.textContent='Take your time. Your round is paused.';this.playButton.textContent='Resume ↗';$('.pause-button',this.el).textContent='▶';$('.pause-button',this.el).setAttribute('aria-label','Resume game');syncNavigation();this.draw();}
  resume(){if(!this.active||this.mode!=='paused')return;this.mode='running';this.el.classList.add('is-playing');this.status.textContent=this.game.instruction;this.playButton.textContent='Ⅱ Pause';$('.pause-button',this.el).textContent='Ⅱ';$('.pause-button',this.el).setAttribute('aria-label','Pause game');enableRoundSound(this);syncNavigation();feed.focus({preventScroll:true});this.draw();this.wake();}
  tick(now){
    this.raf=0;if(this.mode!=='running'||!this.active||document.hidden)return;
    const dt=frameDelta(now,this.last);this.last=now;this.elapsed=Math.min(this.game.duration,this.elapsed+dt);
    const score=this.state.score;
    if(this.game.id==='flap'){this.accumulator+=dt;while(this.accumulator>=1/240&&!this.state.over){Flap.step(this.state,1/240);this.accumulator-=1/240;}}
    if(this.game.id==='snake'){this.accumulator+=dt;while(this.accumulator>=.17&&!this.state.over){Snake.step(this.state);this.accumulator-=.17;}}
    if(this.game.id==='mole')stepMole(this.state,dt);
    if(this.game.id==='memory')stepMemory(this.state,dt);
    if(this.state.score>score)sound(720);this.update();this.draw();
    if(this.state.over){this.finish(this.game.id==='memory'?'All six pairs found!':'So close. One more go?');return;}
    if(this.elapsed>=this.game.duration){this.finish('Round complete. Nicely played.');return;}
    this.raf=requestAnimationFrame(t=>this.tick(t));
  }
  update(){
    $('.score-value',this.el).textContent=String(this.state.score).padStart(2,'0');$('.hud-time',this.el).textContent=`${Math.ceil(this.game.duration-this.elapsed)}s`;$('.timer-bar',this.el).style.transform=`scaleX(${1-this.elapsed/this.game.duration})`;
    if(this.state.score>bestFor(this.game.id))write('best:'+this.game.id,this.state.score);$('.best-value',this.el).textContent=bestFor(this.game.id);
  }
  draw(){
    const rect=this.field.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);
    const width=Math.round(rect.width*ratio),height=Math.round(rect.height*ratio);
    if(width>0&&height>0&&(this.canvas.width!==width||this.canvas.height!==height)){this.canvas.width=width;this.canvas.height=height;}
    drawScene(this.canvas,this.game.id,this.state,this.elapsed,this.mode!=='ready');
    if(this.game.id==='mole')this.buttons.forEach((b,i)=>{const up=this.mode==='ready'?i===4:i===this.state.active; b.classList.toggle('up',up);b.disabled=false;b.setAttribute('aria-label',`Hole ${i+1}, ${up?'mole':'empty'}`);});
    if(this.game.id==='memory')this.buttons.forEach((b,i)=>{const matched=this.state.matched.includes(i),open=matched||this.state.open.includes(i);b.classList.toggle('revealed',open);b.classList.toggle('matched',matched);b.textContent=open?icons[this.state.deck[i]]:'✦';b.disabled=matched&&this.mode!=='over';b.setAttribute('aria-label',`Card ${i+1}, ${open?symbolNames[this.state.deck[i]]:'face down'}${matched?', matched':''}`);});
  }
  finish(message){this.mode='over';this.stopFrame();this.el.classList.remove('is-playing');this.status.textContent=`${message} ${this.state.score} ${this.game.unit}.`;this.playButton.textContent='One more? ↻';$('.pause-button',this.el).disabled=true;metric(this.game.id,'completions');syncNavigation();this.draw();sound(260);}
  setActive(value){this.active=value;if(!value)this.pause();this.el.inert=!value;this.el.setAttribute('aria-hidden',String(!value));this.draw();}
  destroy(){this.stopFrame();this.resizeObserver.disconnect();this.inputAbort.abort();}
}

function canLeaveGame() {
  if (active?.mode !== 'running') return true;
  toast('Pause your game first to browse.'); return false;
}
function syncNavigation() {
  const locked = active?.mode === 'running';
  pager.setLocked(locked);
  feed.classList.toggle('is-locked', locked);
  const i = sessions.indexOf(active);
  $('#previous').disabled = locked || i <= 0;
  $('#next').disabled = locked || i < 0 || i >= sessions.length - 1;
  for (const selector of ['#for-you', '#saved', '#nav-play', '#nav-saved']) $(selector).disabled = locked;
  document.querySelectorAll('.game-list-item').forEach(button => button.disabled = locked);
  $('.scroll-hint').textContent = locked ? 'Feed locked · Pause to explore' : !sessions.length ? 'Save a favourite to build your collection' : sessions.length===1 ? 'Your game. Your next best.' : i===sessions.length-1 ? 'Swipe down to revisit a game' : 'Swipe up for your next game';
  $('.scroll-hint').classList.toggle('locked', locked);
  if(active){
    active.el.dataset.mode=active.mode;
    $('.pause-button',active.el).hidden=active.mode!=='running'&&active.mode!=='paused';
    const prompt=$('.tap-prompt',active.el);prompt.hidden=active.mode==='running';
    $('strong',prompt).textContent=active.mode==='paused'?'Paused · tap to resume':active.mode==='over'?'One more game?':'Tap anywhere to play';
    $('small',prompt).textContent=active.mode==='over'?`${active.state.score} ${active.game.unit} · tap to try again`:active.game.instruction;
    $('.game-chip',active.el).textContent=locked?'PLAYING / FOCUS MODE':`${String(games.indexOf(active.game)+1).padStart(2,'0')} / QUICK PLAY`;$('.game-meta',active.el).textContent=locked?'STAY IN THE GAME':active.game.category;}
}
function selectSession(session,updateURL=true){
  if(!session||active===session)return;
  active=session;sessions.forEach(s=>s.setActive(s===session));
  const i=sessions.indexOf(session);$('.feed-count').innerHTML=`${String(i+1).padStart(2,'0')} <span>/ ${String(sessions.length).padStart(2,'0')}</span>`;
  syncNavigation();
  document.querySelectorAll('.game-list-item').forEach(b=>{b.classList.toggle('current',b.dataset.game===session.game.id);if(b.dataset.game===session.game.id)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
  if(updateURL){const url=new URL(location.href);url.searchParams.set('game',session.game.id);history.replaceState(null,'',url);}
}
function navigate(delta){if(!canLeaveGame())return;const target=sessions[sessions.indexOf(active)+delta];if(target)scrollToSession(target);}
function scrollToSession(target){if(target&&canLeaveGame())pager.goTo(sessions.indexOf(target));}
function renderFeed(targetId){
  sessions.forEach(s=>s.destroy());active=null;feed.replaceChildren();
  sessions=games.filter(g=>filter==='all'||saved.has(g.id)).map(g=>new GameSession(g));
  if(!sessions.length){pager.reset(null,0,0);feed.innerHTML='<div class="empty-state"><div><h2>Keep the good ones.</h2><p>Tap a heart on any game.<br>Your favourites will be waiting here.</p><button id="discover">Discover games ↗</button></div></div>';$('#discover').onclick=()=>setFilter('all');$('.feed-count').textContent='00 / 00';syncNavigation();document.querySelectorAll('.game-list-item').forEach(b=>{b.classList.remove('current');b.removeAttribute('aria-current');});return;}
  const track=document.createElement('div');track.className='feed-track';
  sessions.forEach(s=>track.append(s.el));feed.append(track);
  const target=sessions.find(s=>s.game.id===targetId)||sessions[0];
  pager.reset(track,sessions.length,sessions.indexOf(target));selectSession(target);syncSaved();syncSound();
}
function setFilter(value,targetId){if(!canLeaveGame())return;filter=value;$('#for-you').classList.toggle('active',value==='all');$('#saved').classList.toggle('active',value==='saved');$('#nav-play').classList.toggle('selected',value==='all');$('#nav-saved').classList.toggle('selected',value==='saved');renderFeed(targetId);}
$('#for-you').onclick=$('#nav-play').onclick=()=>setFilter('all');$('#saved').onclick=$('#nav-saved').onclick=()=>setFilter('saved');
$('#previous').onclick=()=>navigate(-1);$('#next').onclick=()=>navigate(1);
$('#game-list').innerHTML=games.map((g,i)=>`<button class="game-list-item" data-game="${g.id}"><span class="game-thumbnail" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span><strong>${g.name}</strong><small>${g.tags[1]} / ${g.duration} sec</small></span></button>`).join('');
$('#game-list').addEventListener('click',event=>{const button=event.target.closest('[data-game]');if(!button)return;if(filter==='saved')setFilter('all',button.dataset.game);else scrollToSession(sessions.find(s=>s.game.id===button.dataset.game));});
document.addEventListener('keydown',event=>{
  if(event.altKey||event.metaKey||event.ctrlKey||event.target.closest('input,textarea,select')||$('#modal').open)return;
  const key=event.key.toLowerCase();
  if(['j','k','pagedown','pageup'].includes(key)){event.preventDefault();if(!event.repeat)navigate(key==='j'||key==='pagedown'?1:-1);return;}
  if((event.key==='ArrowDown'||event.key==='ArrowUp')&&active?.mode!=='running'&&!event.target.closest('button')){event.preventDefault();if(!event.repeat)navigate(event.key==='ArrowDown'?1:-1);return;}
  if(!active)return;
  if(key==='p'){event.preventDefault();active.mode==='running'?active.pause():active.resume();}
  if(key==='r'&&!event.repeat){event.preventDefault();active.start();}
  if(event.key===' '&&!event.target.closest('button,a')){event.preventDefault();if(active.mode==='running'&&active.game.id==='flap'){Flap.flap(active.state);sound(400);}else if(!event.repeat&&active.mode!=='running')active.primary();}
  if(active.mode==='running'&&active.game.id==='snake'){const direction={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[event.key];if(direction){event.preventDefault();Snake.turn(active.state,direction);}}
  if(active.mode==='running'&&active.game.id==='mole'&&/^[1-9]$/.test(event.key)&&!event.repeat)active.input(Number(event.key)-1);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){active?.pause();audio.silence();}});window.addEventListener('blur',()=>active?.pause());
document.querySelectorAll('.brand').forEach(brand=>brand.addEventListener('click',event=>{event.preventDefault();setFilter('all','flap');}));
window.addEventListener('popstate',()=>setFilter('all',new URLSearchParams(location.search).get('game')));
renderFeed(new URLSearchParams(location.search).get('game'));
syncSound();
