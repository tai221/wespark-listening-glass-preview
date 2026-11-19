// One persistent world: navigation changes the camera, never the scene layout.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function fitCamera(bounds,viewport,{padding=28,maxScale=1.1}={}){
 return {cx:bounds.x+bounds.width/2,cy:bounds.y+bounds.height/2,scale:Math.min(maxScale,Math.max(1,viewport.width-padding*2)/Math.max(1,bounds.width),Math.max(1,viewport.height-padding*2)/Math.max(1,bounds.height))};
}
export function interpolateCamera(from,to,progress,viewport){
 if(progress<=0)return {...from};if(progress>=1)return {...to};
 const t=progress*progress*(3-2*progress),distance=Math.hypot(to.cx-from.cx,to.cy-from.cy),travel=distance*Math.min(from.scale,to.scale)/Math.max(viewport.width,viewport.height,1);
 const pullback=travel>.45?Math.min(1.4,Math.log1p(travel)*.7):0;
 const scale=Math.exp(Math.log(from.scale)+(Math.log(to.scale)-Math.log(from.scale))*t-pullback*Math.sin(Math.PI*progress)**2);
 return {cx:from.cx+(to.cx-from.cx)*t,cy:from.cy+(to.cy-from.cy)*t,scale};
}
export function sceneGeometry(heights){
 const upperY=-500,lowerY=Math.max(1500,upperY+(heights[0]||650)+520);
 const trees=[{x:1200,y:upperY},{x:0,y:lowerY},{x:2400,y:lowerY}];
 const bottom=Math.max(...trees.map((tree,index)=>tree.y+(heights[index]||650)));
 return {trees,root:{x:1540,y:700},bounds:{x:-220,y:-740,width:3740,height:bottom+820}};
}
export function createPreziCamera({win,element,viewport,onState=()=>{}}){
 let view=null,frame=0,disposed=false;
 const size=()=>({width:viewport.clientWidth||700,height:viewport.clientHeight||520});
 function draw(next){
  view={...next};const {width,height}=size();
  element.style.transform=`translate(${width/2-view.cx*view.scale}px,${height/2-view.cy*view.scale}px) scale(${view.scale})`;
  // Keep overview question labels readable without relocating their anchors.
  element.style.setProperty('--mm-label-scale',String(clamp(.64/view.scale,1,3.5)));
  element.style.setProperty('--mm-topic-stroke',String(1.6/view.scale));
 }
 function cancel(){if(frame)win.cancelAnimationFrame(frame);frame=0;element.style.willChange='';onState(false);}
 function moveTo(next,{animate=true,duration=1050}={}){
  if(disposed)return;const start=view?{...view}:{...next};cancel();
  if(!view||!animate){draw(next);return;}
  if(Math.hypot(next.cx-start.cx,next.cy-start.cy)<.01&&Math.abs(next.scale-start.scale)<.00001){draw(next);return;}
  const began=win.performance.now();element.style.willChange='transform';onState(true);
  const tick=time=>{if(disposed)return;const t=clamp((time-began)/duration,0,1);draw(interpolateCamera(start,next,t,size()));if(t<1)frame=win.requestAnimationFrame(tick);else{frame=0;element.style.willChange='';onState(false);}};
  frame=win.requestAnimationFrame(tick);
 }
 return {
  get current(){return view?{...view}:null;},get moving(){return !!frame;},moveTo,cancel,
  refresh(){if(view)draw(view);},
  zoomAt(factor,point){if(!view||disposed)return;cancel();const {width,height}=size(),scale=clamp(view.scale*factor,.1,1.6),x=point?.x??width/2,y=point?.y??height/2,anchorX=view.cx+(x-width/2)/view.scale,anchorY=view.cy+(y-height/2)/view.scale;draw({cx:anchorX-(x-width/2)/scale,cy:anchorY-(y-height/2)/scale,scale});},
  panBy(dx,dy){if(!view||disposed)return;cancel();draw({...view,cx:view.cx-dx/view.scale,cy:view.cy-dy/view.scale});},
  dispose(){cancel();disposed=true;}
 };
}
