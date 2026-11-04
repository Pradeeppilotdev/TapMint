// Game units use one scale on both axes, regardless of the viewport shape.
export function flapLayout(width, height) {
  const scale=Math.max(1,Math.min(width,(height-24)/.88));
  return {scale,left:(width-scale)/2,top:(height-.88*scale)/2,ground:(height+.88*scale)/2};
}
export function gridLayout(width,height,rows,started) {
  const gap=width<340?7:10,top=started?44:20,bottom=started?14:80;
  const cell=Math.max(1,Math.min((width*.84-2*gap)/3,(height-top-bottom-(rows-1)*gap)/rows));
  const gridWidth=cell*3+gap*2,gridHeight=cell*rows+gap*(rows-1);
  return {width:gridWidth,height:gridHeight,left:(width-gridWidth)/2,top:top+Math.max(0,(height-top-bottom-gridHeight)/2),gap,cell};
}
