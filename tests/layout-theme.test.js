import test from 'node:test';
import assert from 'node:assert/strict';
import { flapLayout, gridLayout } from '../src/layout.js';
import { drawScene } from '../src/art.js';
import { resolveTheme } from '../src/theme.js';

const sizes=[[374,562],[304,293],[414,640],[480,620],[650,180]];
test('Flap rendering never stretches either axis on phones or landscape displays',()=>{
  for(const [width,height] of sizes)for(const dpr of [1,2]){
    const scales=[];
    const context=new Proxy({scale:(x,y)=>scales.push([x,y])},{get:(target,key)=>key in target?target[key]:()=>{}});
    drawScene({width:width*dpr,height:height*dpr,getContext:()=>context},'flap',{bird:{y:.44,vy:.1},posts:[{x:.8,y:.45}],gap:.32},0,true);
    assert.ok(scales.length>=2);
    for(const [x,y] of scales)assert.equal(x,y,`${width}×${height} must scale uniformly`);
    const layout=flapLayout(width,height);
    assert.ok(layout.left>=0&&layout.top>=0&&layout.ground<=height);
    assert.ok(Math.abs((layout.ground-layout.top)/layout.scale-.88)<1e-9);
  }
});
test('memory tiles and mole holes remain square, within the play area, before and during play',()=>{
  for(const [width,height] of sizes)for(const rows of [3,4])for(const started of [false,true]){
    const g=gridLayout(width,height,rows,started);
    assert.ok(Math.abs((g.width-2*g.gap)/3-(g.height-(rows-1)*g.gap)/rows)<1e-9);
    assert.ok(g.left>=0&&g.top>=0&&g.left+g.width<=width+.001&&g.top+g.height<=height+.001);
  }
});
test('saved light or dark theme overrides system preference; unknown values follow the system',()=>{
  assert.equal(resolveTheme('light',true),'light');assert.equal(resolveTheme('dark',false),'dark');
  for(const value of [null,undefined,'invalid',{},false]){
    assert.equal(resolveTheme(value,true),'dark');assert.equal(resolveTheme(value,false),'light');
  }
});
