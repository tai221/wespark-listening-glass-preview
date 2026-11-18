import {CYCLE_STORAGE_KEY,restoreCycleState} from './speaking-cycle-model.mjs';
import {speakingPreparationEntry,visibleSpeakingPreparationSteps} from './speaking-preparation-visibility.mjs';
import {createSoundButton} from '../ui-sound.mjs';
import {createBackgroundButton} from '../background-toggle.mjs';
import {balance} from '../session.mjs';
import {polishSpeakingLessonControls} from './speaking-lesson-controls.mjs';

const icons={
 mindmap:'<rect x="9" y="9" width="6" height="6" rx="1.5"/><path d="M12 9V5m0 10v4M9 12H5m10 0h4"/><circle cx="12" cy="3" r="2"/><circle cx="12" cy="21" r="2"/><circle cx="3" cy="12" r="2"/><circle cx="21" cy="12" r="2"/>',
 mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v1a7 7 0 0 0 14 0v-1m-7 8v3m-4 0h8"/>',
 feedback:'<path d="M21 11a8 8 0 0 1-8 8H8l-5 3V11a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"/><path d="M8 9h8m-8 4h5"/>',
 retry:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/><rect x="10" y="7" width="4" height="7" rx="2"/><path d="M8 12a4 4 0 0 0 8 0m-4 4v2"/>',
 result:'<path d="M8 3H5a2 2 0 0 0-2 2v15a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V5a2 2 0 0 0-2-2h-3"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m8 13 3 3 5-6"/>'
};
const stages=[
 {key:'prepare',label:'Mindmap',description:'Sắp xếp ý trước khi nói.',icon:icons.mindmap,pages:[['vocabulary','Học từ & cụm từ'],['game','Quiz/Game'],['mindmap','Mindmap'],['kit','Speaking Kit']]},
 {key:'produce',label:'Nói lần 1',description:'Ghi âm câu trả lời bằng ý của bạn.',icon:icons.mic,pages:[['produce','Nói lần 1']]},
 {key:'feedback',label:'Nhận xét & sửa bài',description:'Xem nhận xét, nói lại khi cần.',icon:icons.feedback,pages:[['feedback','Nhận xét lần 1'],['feedback-detail','Nhận xét lần 1'],['version2','Nói lại lần 2'],['compare','Kết quả lần 2']]}
];
const feedbackSteps=[['feedback','Nhận xét lần 1',icons.feedback],['version2','Nói lại lần 2',icons.retry],['compare','Kết quả lần 2',icons.result]];
const fileFor=id=>`key-speaking-${id}.html`;
const svg=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const node=(tag,cls)=>Object.assign(document.createElement(tag),{className:cls});

export function mountSpeakingLessonShell(app,workspace,file){
 const isMindmap=file==='key-speaking-mindmap.html';
 const isDrill=file==='key-speaking-drill-repeat.html';
 const lessonStages=isDrill?[{key:'drill',label:'Luyện lại',description:'Nhắc lại câu đã sửa từ buổi trước.',icon:icons.retry,pages:[['drill-repeat','Luyện lại']]},stages[0]]:stages;
 const stage=lessonStages.find(stage=>stage.pages.some(([id])=>fileFor(id)===file))||(file==='key-speaking-completion.html'?stages[2]:null);
 if(!stage)return;
 document.body.dataset.lessonShell='';document.body.dataset.speakingLesson='';
 // Lesson HTML loads this before rendering; the cached link keeps the per-page cascade.
 const style=node('link','');style.rel='stylesheet';style.href='speaking-lesson-shell.css';document.head.append(style);
 const context=workspace.querySelector('.project-lesson-context'),oldTitle=context?.querySelector('.project-lesson-name');
 const title=node('h1','');title.textContent=oldTitle?.firstChild?.textContent.trim()||'My hometown';
 const tags=node('div','lesson-fallback-tags');tags.innerHTML='<span>Quê hương</span><span class="speaking-shell-level">B1</span>';
 const progress=node('nav','speaking-question-progress');progress.setAttribute('aria-label','Tiến độ từng câu');
 let saved=null;try{saved=sessionStorage.getItem(CYCLE_STORAGE_KEY);}catch{}
 const lessonState=restoreCycleState(saved);
 lessonState.questions.forEach((question,index)=>{
  const button=node('button','');button.type='button';button.textContent=`Q${index+1}`;
  button.dataset.questionState=question.completed?'done':index>lessonState.current?'locked':'current';
  button.disabled=!isMindmap&&index>lessonState.current;
  const focused=isMindmap?index===0:index===lessonState.current&&lessonState.stage!=='completion';
  if(isMindmap)button.dataset.questionState=index===0?'current':'available';
  button.dataset.focused=String(focused);if(focused)button.setAttribute('aria-current','step');
  const label=isMindmap?`Câu ${index+1} · Xem nhánh Mind Map`:`Câu ${index+1} · ${question.completed?'Hoàn thành · Xem lại':button.disabled?'Chưa mở':'Đang học'}`;
  button.title=label;button.setAttribute('aria-label',label);
  if(question.completed&&!isMindmap)button.insertAdjacentHTML('afterbegin',svg('<path d="m5 12 4 4L19 6"/>'));
  button.addEventListener('click',()=>{if(isMindmap){app.querySelector(`button[data-map-question="${index}"]`)?.click();return;}location.href=question.completed?`key-speaking-feedback-detail.html#question-${index+1}`:'key-speaking-produce.html';});
  progress.append(button);
 });
 if(!isDrill)tags.append(progress);
 const identity=node('div','lesson-top-identity');identity.append(title,tags);
 const tools=node('div','lesson-top-tools'),wallet=node('a','wallet');wallet.href='key-spark.html';wallet.setAttribute('aria-label','SparkPoint · Xem Spark và quà');wallet.innerHTML=`<span class="project-point-mark" aria-hidden="true">${svg('<path d="m14 2-9 12h7l-2 8 9-12h-7l2-8Z"/>')}</span><strong data-balance>${balance()}</strong><small>SparkPoint</small>`;
 const close=node('a','lesson-close');close.href='key-speaking-library.html';close.title='Đóng bài học';close.setAttribute('aria-label','Đóng bài học · Về thư viện Speaking');close.innerHTML=svg('<path d="m6 6 12 12M18 6 6 18"/>');
 tools.append(createBackgroundButton(document),createSoundButton(document),wallet,close);
 const top=node('header','lesson-topbar');top.append(identity,tools);
 const sidebar=node('aside','lesson-sidebar');sidebar.setAttribute('aria-label','Lộ trình bài Speaking');
 const rail=node('div','lesson-rail');rail.setAttribute('role','group');rail.setAttribute('aria-label','Xem lộ trình');
 const nav=node('nav','');nav.id='speaking-route-details';nav.setAttribute('aria-label','Các phần của bài Speaking');nav.hidden=true;nav.inert=true;
 const markers=[];
 lessonStages.forEach(item=>{
  const current=item===stage,marker=node('button','lesson-rail-marker');marker.type='button';marker.dataset.railStage=item.key;marker.setAttribute('aria-label',`${item.label}${current?' · Đang học':''}`);marker.setAttribute('aria-controls',nav.id);marker.setAttribute('aria-expanded','false');if(current)marker.setAttribute('aria-current','step');marker.innerHTML=svg(item.icon);rail.append(marker);markers.push(marker);
  const group=node('section','lesson-stage-group');group.dataset.stage=item.key;group.dataset.current=String(current);group.hidden=true;
  const link=node('a','lesson-stage-link');link.href=item.key==='prepare'?speakingPreparationEntry():fileFor(item.pages[0][0]);if(current)link.setAttribute('aria-current','step');link.innerHTML=`<span class="lesson-stage-number">${svg(item.icon)}</span><span class="lesson-stage-copy"><span class="lesson-stage-heading"><strong data-stage-label="${item.label}">${item.label}</strong>${current?'<span class="lesson-stage-status">Đang học</span>':''}</span><small>${item.description}</small></span>`;
  const steps=item.key==='feedback'?feedbackSteps:item.key==='prepare'?visibleSpeakingPreparationSteps().map(({id,label})=>[id,label,icons.mindmap]):item.pages;
  group.dataset.single=String(steps.length===1);group.append(link);
  if(steps.length>1){
   const sub=node('div','lesson-substeps');
   steps.forEach(([id,label,icon])=>{const a=node('a','');a.href=fileFor(id);a.dataset.speakingSubstep=id;a.innerHTML=`<span class="speaking-substep-icon">${svg(icon)}</span><span>${label}</span>`;if(a.getAttribute('href')===file||(id==='feedback'&&file==='key-speaking-feedback-detail.html'))a.setAttribute('aria-current','page');sub.append(a);});
   group.append(sub);
  }
  nav.append(group);
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
    event.preventDefault();reveal(marker);(nav.querySelector('section:not([hidden]) .lesson-substeps:not([hidden]) a[aria-current]')||nav.querySelector('section:not([hidden]) .lesson-stage-link'))?.focus();
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
