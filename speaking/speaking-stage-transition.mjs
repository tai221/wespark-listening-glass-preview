const file=path=>String(path).split('/').pop().split(/[?#]/)[0];
let moving=false,currentURL='';
export function transitionFor(from,to){
 const pair=`${file(from)}>${file(to)}`;
 if(pair==='key-speaking-mindmap.html>key-speaking-produce.html')return {carryFrom:'.mm-map',depart:'.mm-editor',carryTo:'.practice-map',arrive:'.mapped-layout>.practice-scene',layout:'.mm-layout'};
 if(pair==='key-speaking-produce.html>key-speaking-feedback.html')return {carryFrom:'.mapped-layout>.practice-scene',depart:'.practice-map',carryTo:'.rf-transcripts',arrive:'.rf-analysis',layout:'.mapped-layout'};
 return null;
}
export function panelMotion(carry,target,depart,arrive,gap=24){return {carryX:target.left-carry.left,carryY:target.top-carry.top,scaleX:target.width/carry.width,scaleY:target.height/carry.height,departX:-(depart.width+gap),arriveX:carry.right+gap-arrive.left};}
async function stylesheet(doc,name){
 const href=new URL(name,doc.baseURI).href;
 if([...doc.styleSheets].some(sheet=>sheet.href===href))return;
 await new Promise((resolve,reject)=>{const link=doc.createElement('link');link.rel='stylesheet';link.href=href;link.onload=resolve;link.onerror=reject;doc.head.append(link);});
}
async function renderStage(main,route,stageReady){
 if(route==='key-speaking-produce.html'){const {mountSpeakingRound}=await import('./speaking-round.mjs');return mountSpeakingRound(main,{stageReady});}
 if(route==='key-speaking-feedback.html'){const {mountRoundResults}=await import('./speaking-round-results.mjs');return mountRoundResults(main);}
 const {mountSpeakingMindmap}=await import('./speaking-mindmap.mjs');return mountSpeakingMindmap(main);
}
export async function navigateSpeakingStage(destination,{pop=false}={}){
 const win=window,doc=win.document,url=new URL(destination,win.location.href),to=file(url.pathname);
 const source=doc.querySelector('.lesson-content>main');
 if(!source||!doc.querySelector('.lesson-shell')||!['key-speaking-mindmap.html','key-speaking-produce.html','key-speaking-feedback.html'].includes(to)){win.location.href=url.href;return;}
 if(moving)return;
 if(source.speakingStageCanLeave&&!source.speakingStageCanLeave()){if(pop)win.history.pushState(null,'',currentURL);return;}
 const from=source.dataset.stageRoute||file(win.location.pathname),plan=transitionFor(from,to),reduced=win.matchMedia('(prefers-reduced-motion: reduce)').matches;
 moving=true;doc.documentElement.dataset.speakingStageTransition='preparing';
 let target=null,resolveReady;const stageReady=new Promise(resolve=>resolveReady=resolve),oldURL=currentURL||win.location.href,animations=[];
 const savedOverflow=doc.documentElement.style.overflowX;
 try{
  const sheets=to==='key-speaking-mindmap.html'?['speaking-mindmap.css']:to==='key-speaking-produce.html'?['speaking-practice.css?v=20261109-mic-raised','speaking-mapped-practice.css']:['speaking-round-results.css'];
  await Promise.all(sheets.map(name=>stylesheet(doc,name)));
  const sourceRect=source.getBoundingClientRect();
  target=doc.createElement('main');target.className='main';target.dataset.stageRoute=to;target.inert=true;
  Object.assign(target.style,{position:'fixed',left:`${sourceRect.left}px`,top:`${sourceRect.top}px`,width:`${sourceRect.width}px`,margin:'0',visibility:'hidden',zIndex:'10'});source.after(target);
  doc.querySelectorAll('.lesson-top-tools>.round-preview,.lesson-top-tools>.rf-preview').forEach(node=>node.remove());
  if(!pop)win.history.pushState(null,'',url);target.speakingStageDispose=await renderStage(target,to,stageReady);
  await doc.fonts.ready;await new Promise(resolve=>win.requestAnimationFrame(()=>win.requestAnimationFrame(resolve)));
  const carry=plan&&source.querySelector(plan.carryFrom),depart=plan&&source.querySelector(plan.depart),nextCarry=plan&&target.querySelector(plan.carryTo),arrive=plan&&target.querySelector(plan.arrive);
  if(plan&&!reduced&&carry&&depart&&nextCarry&&arrive){
   const gap=parseFloat(win.getComputedStyle(source.querySelector(plan.layout)).columnGap)||24;
   source.speakingStagePrepare?.();
   const a=carry.getBoundingClientRect(),b=depart.getBoundingClientRect(),motion=panelMotion(a,nextCarry.getBoundingClientRect(),b,arrive.getBoundingClientRect(),gap);
   const settings={duration:1100,easing:'cubic-bezier(.22,.8,.28,1)',fill:'forwards'};
   source.style.height=`${sourceRect.height}px`;source.inert=true;
   for(const [node,rect,role] of [[carry,a,'carry'],[depart,b,'depart']]){Object.assign(node.style,{position:'fixed',left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,margin:'0',zIndex:'20',transformOrigin:'top left'});node.dataset.speakingMotion=role;}
   target.style.visibility='visible';nextCarry.style.opacity='0';arrive.dataset.speakingMotion='arrive';
   const heading=source.querySelector('.mm-heading,.mapped-heading');if(heading)heading.style.visibility='hidden';
   doc.documentElement.style.overflowX='clip';doc.documentElement.dataset.speakingStageTransition='moving';
   animations.push(carry.animate([{transform:'none',opacity:1},{offset:.82,opacity:1},{transform:`translate3d(${motion.carryX}px,${motion.carryY}px,0) scale(${motion.scaleX},${motion.scaleY})`,opacity:0}],settings));
   animations.push(depart.animate([{transform:'none',opacity:1},{transform:`translate3d(${motion.departX}px,0,0)`,opacity:0}],settings));
   animations.push(nextCarry.animate([{opacity:0},{offset:.82,opacity:0},{opacity:1}],settings));
   animations.push(arrive.animate([{transform:`translate3d(${motion.arriveX}px,0,0)`},{transform:'none'}],settings));
   await Promise.all(animations.map(animation=>animation.finished.catch(()=>{})));nextCarry.style.removeProperty('opacity');
  }
  source.speakingStageDispose?.();source.remove();target.id=source.id||'speaking-content';
  target.removeAttribute('style');target.inert=false;target.querySelectorAll('[data-speaking-motion]').forEach(node=>node.removeAttribute('data-speaking-motion'));animations.forEach(animation=>animation.cancel());
  doc.body.toggleAttribute('data-speaking-mindmap',to==='key-speaking-mindmap.html');
  doc.body.classList.toggle('speaking-practice-page',to==='key-speaking-produce.html');
  currentURL=win.location.href;
  const focus=target.querySelector('h1');if(focus){focus.tabIndex=-1;focus.focus({preventScroll:true});}
 }catch(error){target?.speakingStageDispose?.();target?.remove();win.history.replaceState(null,'',oldURL);win.location.assign(url.href);}
 finally{resolveReady();doc.documentElement.style.overflowX=savedOverflow;delete doc.documentElement.dataset.speakingStageTransition;moving=false;}
}
export function mountSpeakingStageTransitions(win=window){
 const doc=win.document;currentURL=win.location.href;const main=doc.querySelector('.lesson-content>main');if(main)main.dataset.stageRoute=file(win.location.pathname);
 if(doc.documentElement.dataset.speakingStageRouter)return;doc.documentElement.dataset.speakingStageRouter='true';
 doc.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target&&link.target!=='_self')return;
  const url=new URL(link.href,win.location.href);if(url.origin!==win.location.origin||!transitionFor(file(win.location.pathname),file(url.pathname)))return;
  event.preventDefault();void navigateSpeakingStage(url.href);
 });
 win.addEventListener('popstate',()=>{if(doc.querySelector('.lesson-content>main')?.dataset.stageRoute===file(win.location.pathname)){currentURL=win.location.href;return;}void navigateSpeakingStage(win.location.href,{pop:true});});
}
