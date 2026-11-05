// A finite launch transition; only the caller changes preparation progress.
export function mountStartTransition(document){
 const view=document.defaultView,root=document.querySelector('.app'),reduced=view.matchMedia('(prefers-reduced-motion: reduce)');
 const portrait=document.createElement('img');portrait.src=new URL('./assets/spark-talk-rest-v1.webp',import.meta.url).href;portrait.alt='';portrait.width=112;portrait.height=112;
 let active=null;
 function allowed(){return !reduced.matches&&!document.hidden&&document.body.dataset.glassMotion==='true';}
 function settle(open=true){
  const run=active;if(!run)return;active=null;
  view.clearTimeout(run.revealTimer);view.clearTimeout(run.finishTimer);run.overlay.remove();
  root.inert=run.inert;run.busy===null?root.removeAttribute('aria-busy'):root.setAttribute('aria-busy',run.busy);
  if(!open)return;
  try{if(!run.committed)run.commit();}finally{run.focus();}
 }
 portrait.addEventListener('error',settle);
 reduced.addEventListener('change',()=>{if(reduced.matches)settle();});
 view.addEventListener('glass-motion-change',event=>{if(!event.detail.enabled)settle();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
 view.addEventListener('pagehide',()=>settle(false));
 return function start(commit,focus){
  if(active)return;
  if(!root||!allowed()||portrait.complete&&!portrait.naturalWidth){commit();focus();return;}
  const overlay=document.createElement('div');overlay.className='challenge-transition';overlay.setAttribute('role','status');
  overlay.innerHTML='<span class="sr-only">Đang mở hoạt động…</span><div class="challenge-transition-flight" aria-hidden="true"><span class="challenge-transition-trail"></span></div>';
  overlay.lastChild.append(portrait);
  const run={overlay,commit,focus,inert:root.inert,busy:root.getAttribute('aria-busy'),committed:false};active=run;
  root.inert=true;root.setAttribute('aria-busy','true');document.body.append(overlay);
  run.revealTimer=view.setTimeout(()=>{
   if(active!==run)return;
   // Keep the actual activity inert until the visual surface has left.
   run.committed=true;
   try{commit();overlay.classList.add('is-leaving');}catch(error){settle();throw error;}
  },820);
  run.finishTimer=view.setTimeout(settle,1080);
 };
}
