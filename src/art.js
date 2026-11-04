import { flapLayout } from './layout.js';
// Original TapMint vector scenery. No external image requests or game assets.
function shape(c, color, points) { c.fillStyle = color; c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); c.fill(); }
function pill(c,x,y,w,h,color,r=8){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
export function bird(c, x, y, scale = 1, tilt = 0) {
  c.save();c.translate(x,y);c.scale(scale,scale);c.rotate(tilt);
  c.fillStyle='#0002';c.beginPath();c.ellipse(2,23,24,6,0,0,Math.PI*2);c.fill();
  shape(c,'#f8ad54',[[20,-1],[35,6],[20,12]]);
  pill(c,-24,-20,49,43,'#ffffff',17);pill(c,-20,4,41,17,'#e4dcff',8);
  shape(c,'#f6f2ff',[[-18,-17],[-26,-29],[-8,-22],[1,-30],[4,-19]]);
  pill(c,-25,-1,22,19,'#a190ff',8);pill(c,6,-13,14,18,'#ffffff',6);pill(c,14,-8,5,8,'#3b295b',2);
  c.restore();
}
export function drawScene(canvas, game, state, elapsed, playing, {dark=false,controlSpace=110}={}) {
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  if(!w||!h)return;
  const W=420,H=h/w*W;
  const palette=dark?{sky:'#211A33',moon:'#574575',grid:'#a190ff18',board:'#171222',pipe:'#8266FF',cap:'#B9AAFF'}:{sky:'#DDD7FE',moon:'#FFFFFF',grid:'#6e54ff12',board:'#F7F5FB',pipe:'#6E54FF',cap:'#A190FF'};
  c.clearRect(0,0,w,h);c.save();c.scale(w/W,w/W);
  c.fillStyle=palette.sky;c.fillRect(0,0,W,H);
  if(game==='flap'){
    c.fillStyle=palette.moon;c.beginPath();c.arc(310,H*.20,44,0,Math.PI*2);c.fill();
    c.fillStyle='#85E6FF';c.beginPath();c.arc(290,H*.16,4,0,Math.PI*2);c.fill();
    for(let i=0;i<5;i++){const x=i*100+40;c.globalAlpha=.12+i*.04;shape(c,i%2?'#A190FF':'#6E54FF',[[x,H*.66],[x+100,H],[x-100,H]]);}c.globalAlpha=1;
    if(playing){
      const {scale,left,top,ground}=flapLayout(W,H);
      c.save();c.beginPath();c.rect(left,top,scale,ground-top+14);c.clip();
      for(const p of state.posts){const x=left+p.x*scale,pw=.15*scale,ty=top+(p.y-state.gap/2)*scale,by=top+(p.y+state.gap/2)*scale;
        pill(c,x,top,pw,Math.max(0,ty-top),palette.pipe,4);pill(c,x,Math.max(top,ty-12),pw,12,palette.cap,4);
        pill(c,x,by,pw,Math.max(0,ground-by),palette.pipe,4);pill(c,x,by,pw,12,palette.cap,4);
      }
      pill(c,left,ground,scale,8,palette.cap,0);
      bird(c,left+.3*scale,top+state.bird.y*scale,.55*scale/W,Math.max(-.35,Math.min(.9,state.bird.vy)));
      c.restore();
    }else{pill(c,325,H*.42,57,H*.58,'#6E54FF',6);pill(c,318,H*.42,71,18,'#A190FF',5);bird(c,182,H*.38,1.5,-.08);}
  }else if(game==='snake'){
    c.strokeStyle=palette.grid;c.lineWidth=1;
    for(let x=0;x<W;x+=28){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
    for(let y=0;y<H;y+=28){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
    // Reserve a separate strip for directional controls; cells stay square.
    const reserve=playing?controlSpace:70,size=16,u=Math.min(23,Math.max(4,(H-reserve-30)/size));
    const ox=(W-size*u)/2,oy=Math.max(16,(H-reserve-size*u)/2);
    pill(c,ox-6,oy-6,size*u+12,size*u+12,palette.board,14);
    const body=playing?state.body:[{x:8,y:6},{x:7,y:6},{x:6,y:6},{x:5,y:6},{x:4,y:6},{x:4,y:7},{x:4,y:8},{x:5,y:8},{x:6,y:8}];
    body.forEach((p,i)=>pill(c,ox+p.x*u+1,oy+p.y*u+1,u-2,u-2,i?'#A190FF':'#6E54FF',Math.min(5,u/3)));
    const head=body[0];c.fillStyle='#FFF';c.fillRect(ox+(head.x+.62)*u,oy+(head.y+.2)*u,u*.14,u*.14);c.fillRect(ox+(head.x+.62)*u,oy+(head.y+.65)*u,u*.14,u*.14);
    const food=playing?state.food:{x:11,y:6};if(food)pill(c,ox+(food.x+.2)*u,oy+(food.y+.2)*u,u*.6,u*.6,'#FFAE45',u*.2);
  }else{
    c.strokeStyle=palette.grid;c.lineWidth=1;
    for(const radius of [140,190,240]){c.beginPath();c.arc(W/2,H/2,radius,0,Math.PI*2);c.stroke();}
  }
  c.restore();
}
