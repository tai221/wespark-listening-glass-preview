import {createSoundButton} from '../ui-sound.mjs';
import {createBackgroundButton} from '../background-toggle.mjs';
import {balance} from '../session.mjs';
import {polishSpeakingLessonControls} from './speaking-lesson-controls.mjs';

const stages=[
 {key:'prepare',label:'Chuẩn bị',description:'Học từ, luyện tập và sắp xếp ý trước khi nói.',icon:'<path d="M12 21v-9M12 16C5 16 3 12 3 6c6 0 9 3 9 8M12 12c0-6 3-9 9-9 0 6-3 9-9 9Z"/>',pages:[['vocabulary','Học từ & cụm từ'],['game','Quiz/Game'],['mindmap','Sắp xếp ý'],['kit','Speaking Kit']]},
 {key:'produce',label:'Tự nói',description:'Trả lời từng câu hỏi bằng ý của bạn.',icon:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v1a7 7 0 0 0 14 0v-1m-7 8v3m-4 0h8"/>',pages:[['produce','Ghi âm câu trả lời']]},
 {key:'feedback',label:'Góp ý',description:'Hiểu góp ý và thử lại bằng cách của bạn.',icon:'<path d="M21 11a8 8 0 0 1-8 8H8l-5 3V11a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"/><path d="m8 11 3 3 5-6"/>',pages:[['feedback','Tổng quan'],['feedback-detail','Hiểu và sửa lỗi'],['version2','Nói lại lần 2'],['compare','So sánh hai lần nói']]}
];
const fileFor=id=>`key-speaking-${id}.html`;
const svg=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const node=(tag,cls)=>Object.assign(document.createElement(tag),{className:cls});

export function mountSpeakingLessonShell(app,workspace,file){
 const stage=stages.find(stage=>stage.pages.some(([id])=>fileFor(id)===file))||(file==='key-speaking-completion.html'?stages[2]:null);
 if(!stage)return;
 document.body.dataset.lessonShell='';document.body.dataset.speakingLesson='';
 // Lesson HTML loads this before rendering; the cached link keeps the per-page cascade.
 const style=node('link','');style.rel='stylesheet';style.href='speaking-lesson-shell.css';document.head.append(style);
 const context=workspace.querySelector('.project-lesson-context'),oldTitle=context?.querySelector('.project-lesson-name');
 const title=node('h1','');title.textContent=oldTitle?.firstChild?.textContent.trim()||'My hometown';
 const tags=node('div','lesson-fallback-tags');tags.innerHTML='<span>Quê hương</span><span class="speaking-shell-level">B1</span>';
 const identity=node('div','lesson-top-identity');identity.append(title,tags);
 const tools=node('div','lesson-top-tools'),wallet=node('a','wallet');wallet.href='key-spark.html';wallet.setAttribute('aria-label','SparkPoint · Xem Spark và quà');wallet.innerHTML=`<span class="project-point-mark" aria-hidden="true">${svg('<path d="m14 2-9 12h7l-2 8 9-12h-7l2-8Z"/>')}</span><strong data-balance>${balance()}</strong><small>SparkPoint</small>`;
 const close=node('a','lesson-close');close.href='key-speaking-library.html';close.title='Đóng bài học';close.setAttribute('aria-label','Đóng bài học · Về thư viện Speaking');close.innerHTML=svg('<path d="m6 6 12 12M18 6 6 18"/>');
 tools.append(createBackgroundButton(document),createSoundButton(document),wallet,close);
 const top=node('header','lesson-topbar');top.append(identity,tools);
 const sidebar=node('aside','lesson-sidebar');sidebar.setAttribute('aria-label','Lộ trình bài Speaking');
 const rail=node('div','lesson-rail');rail.setAttribute('role','group');rail.setAttribute('aria-label','Xem lộ trình');
 const nav=node('nav','');nav.id='speaking-route-details';nav.setAttribute('aria-label','Các phần của bài Speaking');nav.hidden=true;nav.inert=true;
 const markers=[];
 stages.forEach(item=>{
  const current=item===stage,marker=node('button','lesson-rail-marker');marker.type='button';marker.dataset.railStage=item.key;marker.setAttribute('aria-label',`${item.label}${current?' · Đang học':''}`);marker.setAttribute('aria-controls',nav.id);marker.setAttribute('aria-expanded','false');if(current)marker.setAttribute('aria-current','step');marker.innerHTML=svg(item.icon);rail.append(marker);markers.push(marker);
  const group=node('section','lesson-stage-group');group.dataset.stage=item.key;group.dataset.current=String(current);group.hidden=true;
  const link=node('a','lesson-stage-link');link.href=fileFor(item.pages[0][0]);if(current)link.setAttribute('aria-current','step');link.innerHTML=`<span class="lesson-stage-number">${svg(item.icon)}</span><span class="lesson-stage-copy"><span class="lesson-stage-heading"><strong>${item.label}</strong>${current?'<span class="lesson-stage-status">Đang học</span>':''}</span><small>${item.description}</small></span>`;
  const sub=node('div','lesson-substeps');item.pages.forEach(([id,label])=>{const a=node('a','');a.href=fileFor(id);a.textContent=label;if(a.getAttribute('href')===file)a.setAttribute('aria-current','page');sub.append(a);});
  group.append(link,sub);nav.append(group);
 });
 sidebar.append(rail,nav);
 // Relocate existing nodes: keep CSS radio states, hashes and click listeners intact.
 const content=node('div','lesson-content');
 [...workspace.children].filter(el=>el!==context).forEach(el=>content.append(el));
 content.querySelectorAll('.steps,.speaking-pre-outline,.inputnav').forEach(el=>el.remove());
 const body=node('div','lesson-body');body.append(sidebar,content);
 app.replaceChildren(top,body);app.classList.remove('project-shell');app.classList.add('app','lesson-shell');app.removeAttribute('data-sidebar');app.dataset.lessonSidebar='closed';
 polishSpeakingLessonControls(content);
 document.querySelectorAll('#speaking-account,#speaking-notifications').forEach(el=>el.remove());

 let active=null,closeTimer,hideTimer;
 const cancel=()=>{clearTimeout(closeTimer);clearTimeout(hideTimer);};
 function reveal(marker){cancel();active=marker;[...nav.children].forEach(group=>group.hidden=group.dataset.stage!==marker.dataset.railStage);markers.forEach(el=>el.setAttribute('aria-expanded',String(el===marker)));nav.style.setProperty('--route-offset',`${Math.max(0,marker.offsetTop-18)}px`);nav.hidden=false;nav.inert=false;app.dataset.lessonSidebar='open';nav.getBoundingClientRect();nav.dataset.visible='true';}
 function dismiss(){cancel();nav.dataset.visible='false';nav.inert=true;app.dataset.lessonSidebar='closed';markers.forEach(el=>el.setAttribute('aria-expanded','false'));hideTimer=setTimeout(()=>nav.hidden=true,200);}
 const schedule=()=>{clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(!nav.contains(document.activeElement))dismiss();},120);};
 markers.forEach((marker,index)=>{
  marker.setAttribute('aria-keyshortcuts','ArrowUp ArrowDown ArrowRight');
  marker.addEventListener('pointerenter',()=>reveal(marker));marker.addEventListener('focus',()=>reveal(marker));marker.addEventListener('click',()=>reveal(marker));
  marker.addEventListener('keydown',event=>{
   if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();markers[(index+(event.key==='ArrowDown'?1:markers.length-1))%markers.length].focus();}
   if(event.key==='ArrowRight'||event.key==='Enter'||event.key===' '||(event.key==='Tab'&&!event.shiftKey)){
    event.preventDefault();reveal(marker);(nav.querySelector('section:not([hidden]) .lesson-substeps a[aria-current]')||nav.querySelector('section:not([hidden]) .lesson-substeps a'))?.focus();
   }
  });
 });
 sidebar.addEventListener('pointerenter',cancel);sidebar.addEventListener('pointerleave',schedule);nav.addEventListener('pointerenter',cancel);
 sidebar.addEventListener('focusout',()=>queueMicrotask(()=>{if(!sidebar.contains(document.activeElement))schedule();}));
 nav.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();active?.focus();dismiss();}});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.dataset.visible==='true'){active?.focus();dismiss();event.preventDefault();}});
 app.addEventListener('click',event=>{
  const a=event.target.closest('a[href]');if(!a||event.defaultPrevented)return;
  const destination=new URL(a.href,location.href);if(destination.href===location.href)return;
  const pending=document.querySelector('#state-recording:checked,#state-review:checked');
  if(pending&&!confirm('Bạn đang có lượt ghi âm chưa gửi. Rời màn này và bỏ lượt đang dở?')){event.preventDefault();event.stopImmediatePropagation();}
 },true);
}
