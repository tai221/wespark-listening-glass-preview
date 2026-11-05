import {updateLessonJourney} from './lesson-journey.mjs';
import {mountFooterButtons} from './lesson-footer-buttons.mjs?v=challenge-launch-20261104';
const svg=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const stageIcon=key=>svg({
 pre:'<path d="M12 21v-9M12 16C5 16 3 12 3 6c6 0 9 3 9 8M12 12c0-6 3-9 9-9 0 6-3 9-9 9Z"/>',
 while:'<path d="M3 14v-3a9 9 0 0 1 18 0v3M5 12H3v8h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Zm14 0h2v8h-2a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z"/>',
 post:'<path d="M12 16 8 12c2-6 6-9 13-9 0 7-3 11-9 13ZM8 12H3l4-5h5m0 9v5l5-4v-5M7 17c-2 0-4 2-4 4 2 0 4-2 4-4Z"/><circle cx="16" cy="8" r="1.5"/>'
}[key]);
const stageDescriptions={pre:"Làm quen chủ đề, học từ & câu",while:"Nghe và kiểm tra mức độ hiểu",post:"Luyện thêm qua hoạt động thực tế"};
const activityIcon=key=>svg({
 dictation:'<path d="M4 20h16M5 15l-1 4 4-1L19 7a2.1 2.1 0 0 0-3-3L5 15Zm9-9 3 3M4 5h5M4 9h3"/>',
 shadowing:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
 conversation:'<path d="M20 11a7 7 0 0 1-7 7H8l-5 3v-7a7 7 0 0 1 7-7h3a7 7 0 0 1 7 4ZM9 3h5a7 7 0 0 1 7 7"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>'
}[key]);
export function mountLessonShell(document,{soundButton,read=()=>({}),write=()=>{},preparationAccessible=()=>false}={}){
 const view=document.defaultView,app=document.querySelector('.app'),header=app?.querySelector('.header'),main=app?.querySelector('main'),page=document.body.dataset.sparkPage;
 if(!app||!header||!main||app.classList.contains('lesson-shell'))return;
 document.body.dataset.lessonShell='';app.classList.add('lesson-shell');
 const style=document.createElement('link');style.rel='stylesheet';style.href='lesson-shell.css?v=no-lock-ui-20261104';document.head.append(style);
 const originalHeading=main.querySelector('.lesson-identity h1,.while-identity h1,.post-heading h1,.practice-lesson-heading h1');
 const title=originalHeading||document.createElement('h1');if(!originalHeading)title.textContent=header.querySelector('.lesson-title')?.firstChild?.textContent?.trim()||'Small steps for the planet';
 const tags=main.querySelector('.context-tags,.while-tags,.post-tags,.practice-lesson-tags')||document.createElement('div');if(!tags.childElementCount){tags.className='lesson-fallback-tags';tags.innerHTML='<span>Môi trường</span><span>A2</span>';}
 const top=document.createElement('header');top.className='lesson-topbar';
 const identity=document.createElement('div');identity.className='lesson-top-identity';identity.append(title,tags);
 const tools=document.createElement('div');tools.className='lesson-top-tools';if(soundButton)tools.append(soundButton);
 const wallet=header.querySelector('.wallet');if(wallet){wallet.querySelector(':scope > span:first-child,:scope > svg')?.remove();const mark=document.createElement('span');mark.className='project-point-mark';mark.setAttribute('aria-hidden','true');mark.innerHTML=svg('<path d="m14 2-9 12h7l-2 8 9-12h-7l2-8Z"/>');wallet.prepend(mark);tools.append(wallet);}
 const close=document.createElement('a');close.className='lesson-close';close.href='library.html';close.setAttribute('aria-label','Đóng bài học · Về thư viện Listening');close.title='Đóng bài học';close.innerHTML=svg('<path d="m6 6 12 12M18 6 6 18"/>');tools.append(close);top.append(identity,tools);
 const sidebar=document.createElement('aside');sidebar.id='lesson-sidebar';sidebar.className='lesson-sidebar';sidebar.setAttribute('aria-label','Lộ trình bài học');
 const nav=document.createElement('nav');nav.setAttribute('aria-label','Các phần của bài Listening');sidebar.append(nav);
 const rail=document.createElement('div');rail.className='lesson-rail';rail.setAttribute('role','group');rail.setAttribute('aria-label','Xem lộ trình');sidebar.prepend(rail);
 const stage=page==='pre'?'pre':page==='while'?'while':'post';const links=[];
 for(const [key,label,file] of [['pre','Chuẩn bị','pre.html'],['while','Nghe hiểu','while.html'],['post','Vận dụng','post.html']]){
  const group=document.createElement('section');group.className='lesson-stage-group';group.dataset.current=String(stage===key);group.dataset.stage=key;group.hidden=true;nav.append(group);
  const marker=document.createElement('button');marker.type='button';marker.className='lesson-rail-marker';marker.dataset.railStage=key;marker.setAttribute('aria-label',`${label}${stage===key?' · Đang học':''}`);marker.setAttribute('aria-controls','lesson-route-details');marker.innerHTML=stageIcon(key);if(stage===key)marker.setAttribute('aria-current','step');rail.append(marker);
  const link=document.createElement('a');link.href=file;link.dataset.destination=file;link.className='lesson-stage-link';link.dataset.lessonStage=key;link.innerHTML=`<span class="lesson-stage-number">${stageIcon(key)}</span><span class="lesson-stage-copy"><span class="lesson-stage-heading"><strong>${label}</strong><span class="lesson-stage-status" aria-hidden="true"></span></span><small>${stageDescriptions[key]}</small></span>`;if(stage===key)link.setAttribute('aria-current','step');group.append(link);links.push(link);
  if(key==='pre'){
   const steps=main.querySelector('.stepper');if(steps)group.append(steps);
   else{const sub=document.createElement('div');sub.className='lesson-substeps';for(const [i,text] of ['Đoán ngữ cảnh','Học từ & câu','Thử sức'].entries()){const a=document.createElement('a');a.href=`pre.html?step=${i}`;a.textContent=text;sub.append(a);}group.append(sub);}
  }
  if(key==='post'){
   const sub=document.createElement('div');sub.className='lesson-substeps lesson-activities';for(const [file,text,activity] of [['dictation.html','Nghe chép','dictation'],['shadowing.html','Luyện nói theo','shadowing'],['conversation.html','Hội thoại','conversation']]){const a=document.createElement('a');a.href=file;a.dataset.destination=file;a.innerHTML=`<span class="lesson-activity-icon">${activityIcon(activity)}</span><span class="lesson-activity-label">${text}</span><span class="lesson-activity-arrow">${svg('<path d="m9 6 6 6-6 6"/>')}</span>`;a.dataset.lessonActivity=activity;if(page===activity)a.setAttribute('aria-current','page');sub.append(a);}group.append(sub);
  }
 }
 const content=document.createElement('div');content.className='lesson-content';
 [...app.children].filter(n=>n!==header).forEach(n=>content.append(n));
 const body=document.createElement('div');body.className='lesson-body';body.append(sidebar,content);header.replaceWith(top);app.append(body);
 nav.id='lesson-route-details';
 let activeMarker=null,closeTimer,hideTimer;
 const markers=[...rail.querySelectorAll('button')];
 const cancelClose=()=>{view.clearTimeout(closeTimer);view.clearTimeout(hideTimer);};
 function reveal(marker){
  cancelClose();const key=marker.dataset.railStage,changed=activeMarker!==marker;activeMarker=marker;
  [...nav.children].forEach(group=>{group.hidden=group.dataset.stage!==key;});
  markers.forEach(b=>b.setAttribute('aria-expanded',String(b===marker)));
  const offset=Math.max(0,marker.offsetTop-18);nav.style.setProperty('--route-offset',`${offset}px`);
  nav.hidden=false;nav.inert=false;app.dataset.lessonSidebar='open';
  nav.getBoundingClientRect();nav.dataset.visible='true';
  if(changed&&!view.matchMedia('(prefers-reduced-motion: reduce)').matches){const group=nav.querySelector('section:not([hidden])');group.getAnimations?.().forEach(a=>a.cancel());group.animate?.([{opacity:.45,transform:'translateX(-4px)'},{opacity:1,transform:'translateX(0)'}],{duration:180,easing:'cubic-bezier(.16,1,.3,1)'});}
 }
 function dismiss(){
  cancelClose();nav.dataset.visible='false';nav.inert=true;app.dataset.lessonSidebar='closed';markers.forEach(b=>b.setAttribute('aria-expanded','false'));
  hideTimer=view.setTimeout(()=>{nav.hidden=true;},200);
 }
 const scheduleClose=()=>{view.clearTimeout(closeTimer);closeTimer=view.setTimeout(dismiss,120);};
 nav.hidden=true;nav.inert=true;app.dataset.lessonSidebar='closed';markers.forEach(marker=>{
  marker.setAttribute('aria-expanded','false');marker.addEventListener('pointerenter',()=>reveal(marker));marker.addEventListener('focus',()=>reveal(marker));
 });
 sidebar.addEventListener('pointerenter',cancelClose);sidebar.addEventListener('pointerleave',scheduleClose);
 nav.addEventListener('pointerenter',()=>{cancelClose();nav.inert=false;nav.dataset.visible='true';app.dataset.lessonSidebar='open';if(activeMarker)activeMarker.setAttribute('aria-expanded','true');});
 sidebar.addEventListener('focusout',()=>view.queueMicrotask(()=>{if(!sidebar.contains(document.activeElement))scheduleClose();}));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!nav.hidden&&nav.dataset.visible==='true'){const marker=activeMarker;marker?.focus();dismiss();event.preventDefault();}});
 function sync(){
  const session=read(),done={pre:preparationAccessible(),while:!!session.while?.reviewComplete,post:!!session.post?.complete?.length};
  const allowed={pre:true,while:done.pre||stage==='while',post:done.while||stage==='post'};
  function access(link,value){link.setAttribute('aria-disabled',String(!value));if(value)link.setAttribute('href',link.dataset.destination);else link.removeAttribute('href');}
  links.forEach(link=>{const key=link.dataset.lessonStage;access(link,allowed[key]);link.classList.toggle('is-complete',done[key]);const statusText=stage===key?'Đang học':done[key]?'Đã xong':allowed[key]?'Sẵn sàng':'Chưa mở';const status=link.querySelector('.lesson-stage-status');status.textContent=allowed[key]?statusText:"";status.hidden=!allowed[key];link.querySelector("small").textContent=stageDescriptions[key];link.setAttribute('aria-label',`${link.querySelector('strong').textContent} · ${statusText}`);const marker=rail.querySelector(`[data-rail-stage="${key}"]`);marker.classList.toggle('is-complete',done[key]);marker.setAttribute('aria-label',`${link.querySelector('strong').textContent} · ${statusText}`);marker.innerHTML=done[key]?svg('<path d="m5 12 4 4L19 6"/>'):stageIcon(key);});
  sidebar.querySelectorAll('[data-lesson-activity]').forEach(a=>access(a,allowed.post));
  updateLessonJourney(main.querySelector('.journey'),{stage,prepComplete:done.pre,whileComplete:done.while,postComplete:done.post});
 }
 sidebar.addEventListener('click',event=>{if(event.target.closest('[aria-disabled="true"]'))event.preventDefault();});
 document.addEventListener('click',event=>{const activity=event.target.closest('[data-lesson-activity][href]');if(activity&&!event.defaultPrevented){const session=read();write({post:{...session.post,choice:activity.dataset.lessonActivity,skipped:false}});}});
 if(['dictation','shadowing','conversation'].includes(page)&&!document.body.hasAttribute('data-completion-page')){const session=read();if(session.post?.choice!==page||session.post?.skipped)write({post:{...session.post,choice:page,skipped:false}});}
 view.addEventListener('listening-session-change',sync);view.addEventListener('lesson-preparation-change',sync);sync();
 const gotoStep=()=>{if(page!=='pre')return;const step=new URL(view.location.href).searchParams.get('step');if(/^[012]$/.test(step||''))document.querySelector(`[data-step="${step}"]:not(:disabled)`)?.click();};
 if(document.readyState==='loading')view.addEventListener('DOMContentLoaded',gotoStep,{once:true});else gotoStep();
 mountFooterButtons(document);return {sidebar};
}
