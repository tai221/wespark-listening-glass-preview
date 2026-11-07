import {enhanceSpeaking} from './speaking-layout.mjs';
import {mountSpeakingLessonShell} from './speaking-lesson-shell.mjs';
// Desktop shell adapter; move existing lesson nodes to preserve radio/hash state hooks.
const desktop=matchMedia('(min-width:1100px)');
const paths={panel:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m5-11-3 3 3 3"/>',plan:'<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V3h6v2M9 11h6m-6 5h4"/>',listen:'<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',speak:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v1a7 7 0 0 0 14 0v-1m-7 8v3m-4 0h8"/>',book:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',progress:'<path d="M4 4v16h16M8 15l4-5 4 2 4-7"/>',gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13m0-13C4 8 6 1 9 3l3 5Zm0 0c8 0 6-7 3-5l-3 5Z"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
function mount(){
 const app=document.querySelector('.browser'),header=app?.querySelector('.topbar');
 if(!app||!header||app.classList.contains('project-shell'))return;
 document.body.dataset.speakingGlass='';app.classList.add('project-shell');
 const file=location.pathname.split('/').pop(),browsing=file==='key-speaking-library.html';
 const pageLabel=document.title.split('·').map(s=>s.trim()).filter(s=>!['WeSpark','Local mockup'].includes(s)).join(' · ');
 const journey=header.querySelector('.journey'),lesson=header.querySelector('.lesson-title,.title'),session=header.querySelector('.session');
 const layout=document.createElement('div');layout.className='project-layout';
 const sidebar=document.createElement('aside');sidebar.id='speaking-sidebar';sidebar.className='project-sidebar';sidebar.setAttribute('aria-label','Điều hướng chính');
 const groups=[['Kế hoạch',[['plan','OKRs của tôi','key-okrs-management.html']]],['Học tập',[['listen','Listening','../library.html'],['speak','Speaking','key-speaking-library.html'],['book','Từ vựng','#preview-unavailable']]],['Theo dõi',[['progress','Hồ sơ học tập','key-profile.html']]],['Phần thưởng',[['gift','Spark & quà','key-spark.html']]]];
 sidebar.innerHTML='<nav aria-label="Các tính năng">'+groups.map(([group,items])=>`<div class="project-nav-group"><h2>${group}</h2>${items.map(([glyph,label,href])=>`<a class="project-nav-item" href="${href}" title="${label}" aria-label="${label}"${glyph==='speak'?' aria-current="page"':''}>${icon(glyph)}<span>${label}</span></a>`).join('')}</div>`).join('')+'</nav>';
 const workspace=document.createElement('div');workspace.className='project-workspace';
 [...app.children].filter(el=>el!==header).forEach(el=>workspace.append(el));
 if(lesson||journey||session){const context=document.createElement('section');context.className='project-lesson-context';if(lesson){lesson.classList.add('project-lesson-name');context.append(lesson);}if(journey)context.append(journey);if(session)context.append(session);workspace.prepend(context);}
 const toggle=document.createElement('button');toggle.type='button';toggle.className='project-nav-toggle';toggle.setAttribute('aria-controls',sidebar.id);toggle.innerHTML=icon('panel');
 const brand=document.createElement('a');brand.className='brand';brand.href='../index.html';brand.innerHTML='<img class="speaking-logo" src="../assets/wespark-logo.svg" alt="WeSpark" width="152" height="36">';
 const identity=document.createElement('div');identity.className='project-identity';identity.append(toggle,brand);
 const breadcrumb=document.createElement('nav');breadcrumb.className='project-breadcrumb';breadcrumb.setAttribute('aria-label','Vị trí hiện tại');
 const library=document.createElement('a');library.href='key-speaking-library.html';library.textContent='Speaking';const separator=document.createElement('span');separator.className='project-crumb-separator';separator.textContent='/';separator.setAttribute('aria-hidden','true');const current=document.createElement('span');current.setAttribute('aria-current','page');current.textContent=browsing?'Thư viện':pageLabel;breadcrumb.append(library,separator,current);
 const utilities=document.createElement('div');utilities.className='project-utilities';
 // No sample balance: this prototype does not have a shared learner account.
 const rewards=document.createElement('a');rewards.className='project-account';rewards.href='key-spark.html';rewards.setAttribute('aria-label','Spark và quà');rewards.title='Spark và quà';rewards.innerHTML=icon('gift');utilities.append(rewards);
 for(const [id,glyph,label,markup] of [['speaking-notifications','bell','Thông báo','<h2>Thông báo</h2><p>Bạn chưa có thông báo nào.</p>'],['speaking-account','user','Tài khoản','<strong>Tài khoản của bạn</strong><a href="key-profile.html">Hồ sơ học tập</a><a href="key-profile-edit.html">Điều chỉnh hồ sơ</a><a href="key-email-settings.html">Nhắc học qua email</a>']]){
  const button=document.createElement('button');button.type='button';button.className=glyph==='bell'?'project-notification-button':'project-account';button.setAttribute('aria-label',label);button.setAttribute('aria-controls',id);button.setAttribute('aria-expanded','false');button.setAttribute('popovertarget',id);button.innerHTML=icon(glyph);
  const popover=document.createElement('section');popover.id=id;popover.className=glyph==='bell'?'project-notifications':'project-account-menu';popover.setAttribute('popover','auto');popover.setAttribute('aria-label',label);popover.innerHTML=markup;document.body.append(popover);utilities.append(button);
  button.addEventListener('click',()=>{const rect=button.getBoundingClientRect();popover.style.top=`${rect.bottom+10}px`;popover.style.right=`${Math.max(16,innerWidth-rect.right)}px`;});popover.addEventListener('toggle',event=>button.setAttribute('aria-expanded',String(event.newState==='open')));
 }
 header.replaceChildren(identity,breadcrumb,utilities);header.classList.add('project-header');layout.append(sidebar,workspace);app.append(layout);
 function expand(value){app.dataset.sidebar=value?'expanded':'collapsed';toggle.setAttribute('aria-expanded',String(value));toggle.setAttribute('aria-label',value?'Thu gọn menu':'Mở rộng menu');toggle.title=value?'Thu gọn menu':'Mở rộng menu';}
 toggle.addEventListener('click',()=>expand(app.dataset.sidebar!=='expanded'));expand(browsing);
 const main=workspace.querySelector('main');if(main){if(!main.id)main.id='speaking-content';const skip=document.createElement('a');skip.className='speaking-skip';skip.href=`#${main.id}`;skip.textContent='Đến nội dung';document.body.prepend(skip);}
 document.querySelectorAll('a[href="key-listening-library.html"]').forEach(a=>a.href='../library.html');
 enhanceSpeaking(workspace,file);
 mountSpeakingLessonShell(app,workspace,file);
}
if(desktop.matches)mount();desktop.addEventListener('change',event=>{if(event.matches)mount();});
