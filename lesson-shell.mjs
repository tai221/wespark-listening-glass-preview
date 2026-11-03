import {updateLessonJourney} from './lesson-journey.mjs';
import {mountFooterButtons} from './lesson-footer-buttons.mjs';
const SIDEBAR_KEY='wespark-lesson-sidebar-v1';
const svg=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
export function mountLessonShell(document,{soundButton,read=()=>({}),write=()=>{},preparationAccessible=()=>false}={}){
 const view=document.defaultView,app=document.querySelector('.app'),header=app?.querySelector('.header'),main=app?.querySelector('main'),page=document.body.dataset.sparkPage;
 if(!app||!header||!main||app.classList.contains('lesson-shell'))return;
 document.body.dataset.lessonShell='';app.classList.add('lesson-shell');
 const style=document.createElement('link');style.rel='stylesheet';style.href='lesson-shell.css?v=20261103';document.head.append(style);
 const originalHeading=main.querySelector('.lesson-identity h1,.while-identity h1,.post-heading h1,.practice-lesson-heading h1');
 const title=originalHeading||document.createElement('h1');if(!originalHeading)title.textContent=header.querySelector('.lesson-title')?.firstChild?.textContent?.trim()||'Small steps for the planet';
 const tags=main.querySelector('.context-tags,.while-tags,.post-tags,.practice-lesson-tags')||document.createElement('div');if(!tags.childElementCount){tags.className='lesson-fallback-tags';tags.innerHTML='<span>Môi trường</span><span>A2</span>';}
 const top=document.createElement('header');top.className='lesson-topbar';
 const toggle=document.createElement('button');toggle.type='button';toggle.className='lesson-menu-toggle';toggle.setAttribute('aria-controls','lesson-sidebar');toggle.innerHTML=svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m4-10h4m-4 4h4"/>')+'<span>Lộ trình</span>';
 const identity=document.createElement('div');identity.className='lesson-top-identity';identity.append(title,tags);
 const tools=document.createElement('div');tools.className='lesson-top-tools';if(soundButton)tools.append(soundButton);
 const wallet=header.querySelector('.wallet');if(wallet){wallet.querySelector(':scope > span:first-child,:scope > svg')?.remove();const mark=document.createElement('span');mark.className='project-point-mark';mark.setAttribute('aria-hidden','true');mark.innerHTML=svg('<path d="m14 2-9 12h7l-2 8 9-12h-7l2-8Z"/>');wallet.prepend(mark);tools.append(wallet);}
 const close=document.createElement('a');close.className='lesson-close';close.href='library.html';close.setAttribute('aria-label','Đóng bài học · Về thư viện Listening');close.title='Đóng bài học';close.innerHTML=svg('<path d="m6 6 12 12M18 6 6 18"/>');tools.append(close);top.append(toggle,identity,tools);
 const sidebar=document.createElement('aside');sidebar.id='lesson-sidebar';sidebar.className='lesson-sidebar';sidebar.setAttribute('aria-label','Lộ trình bài học');
 const nav=document.createElement('nav');nav.setAttribute('aria-label','Các phần của bài Listening');sidebar.append(nav);
 const stage=page==='pre'?'pre':page==='while'?'while':'post';const links=[];
 for(const [index,key,label,file] of [[1,'pre','Chuẩn bị','pre.html'],[2,'while','Nghe hiểu','while.html'],[3,'post','Vận dụng','post.html']]){
  const link=document.createElement('a');link.href=file;link.dataset.destination=file;link.className='lesson-stage-link';link.dataset.lessonStage=key;link.innerHTML=`<span class="lesson-stage-number">${index}</span><span>${label}</span><span class="lesson-stage-status" aria-hidden="true"></span>`;if(stage===key)link.setAttribute('aria-current','step');nav.append(link);links.push(link);
  if(key==='pre'){
   const steps=main.querySelector('.stepper');if(steps)nav.append(steps);
   else{const sub=document.createElement('div');sub.className='lesson-substeps';for(const [i,text] of ['Đoán ngữ cảnh','Học từ & câu','Thử sức'].entries()){const a=document.createElement('a');a.href=`pre.html?step=${i}`;a.textContent=text;sub.append(a);}nav.append(sub);}
  }
  if(key==='post'){
   const sub=document.createElement('div');sub.className='lesson-substeps';for(const [file,text,activity] of [['dictation.html','Nghe chép','dictation'],['shadowing.html','Luyện nói theo','shadowing'],['conversation.html','Hội thoại','conversation']]){const a=document.createElement('a');a.href=file;a.dataset.destination=file;a.textContent=text;a.dataset.lessonActivity=activity;if(page===activity)a.setAttribute('aria-current','page');sub.append(a);}nav.append(sub);
  }
 }
 const content=document.createElement('div');content.className='lesson-content';
 [...app.children].filter(n=>n!==header).forEach(n=>content.append(n));
 const body=document.createElement('div');body.className='lesson-body';body.append(sidebar,content);header.replaceWith(top);app.append(body);
 function expanded(value){sidebar.hidden=!value;app.dataset.lessonSidebar=value?'open':'closed';toggle.setAttribute('aria-expanded',String(value));toggle.setAttribute('aria-label',value?'Ẩn lộ trình bài học':'Hiện lộ trình bài học');}
 let stored=false;try{stored=view.sessionStorage.getItem(SIDEBAR_KEY)==='open';}catch{}expanded(stored);
 toggle.addEventListener('click',()=>{const open=sidebar.hidden;expanded(open);try{view.sessionStorage.setItem(SIDEBAR_KEY,open?'open':'closed');}catch{}});
 function sync(){
  const session=read(),done={pre:preparationAccessible(),while:!!session.while?.reviewComplete,post:!!session.post?.complete?.length};
  const allowed={pre:true,while:done.pre||stage==='while',post:done.while||stage==='post'};
  function access(link,value){link.setAttribute('aria-disabled',String(!value));if(value)link.setAttribute('href',link.dataset.destination);else link.removeAttribute('href');}
  links.forEach(link=>{const key=link.dataset.lessonStage;access(link,allowed[key]);link.classList.toggle('is-complete',done[key]);link.querySelector('.lesson-stage-status').innerHTML=done[key]?svg('<path d="m5 12 4 4L19 6"/>'):'';});
  sidebar.querySelectorAll('[data-lesson-activity]').forEach(a=>access(a,allowed.post));
  updateLessonJourney(main.querySelector('.journey'),{stage,prepComplete:done.pre,whileComplete:done.while,postComplete:done.post});
 }
 sidebar.addEventListener('click',event=>{if(event.target.closest('[aria-disabled="true"]'))event.preventDefault();});
 document.addEventListener('click',event=>{const activity=event.target.closest('[data-lesson-activity][href]');if(activity&&!event.defaultPrevented){const session=read();write({post:{...session.post,choice:activity.dataset.lessonActivity,skipped:false}});}});
 if(['dictation','shadowing','conversation'].includes(page)&&!document.body.hasAttribute('data-completion-page')){const session=read();if(session.post?.choice!==page||session.post?.skipped)write({post:{...session.post,choice:page,skipped:false}});}
 view.addEventListener('listening-session-change',sync);view.addEventListener('lesson-preparation-change',sync);sync();
 const gotoStep=()=>{if(page!=='pre')return;const step=new URL(view.location.href).searchParams.get('step');if(/^[012]$/.test(step||''))document.querySelector(`[data-step="${step}"]:not(:disabled)`)?.click();};
 if(document.readyState==='loading')view.addEventListener('DOMContentLoaded',gotoStep,{once:true});else gotoStep();
 mountFooterButtons(document);return {sidebar,toggle};
}
