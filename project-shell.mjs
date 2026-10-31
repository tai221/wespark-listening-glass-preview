// Shared desktop navigation; existing lesson nodes and state hooks are retained.
import {balance,read,prep} from './session.mjs';
import {updateLessonJourney} from './lesson-journey.mjs';
const desktop = matchMedia('(min-width:1100px)');
const icons = {
  panel:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m5-11-3 3 3 3"/>',
  plan:'<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V3h6v2M9 11h6m-6 5h4"/>',
  listen:'<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',
  speak:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v1a7 7 0 0 0 14 0v-1m-7 8v3m-4 0h8"/>',
  book:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
  progress:'<path d="M4 4v16h16M8 15l4-5 4 2 4-7"/>',
  gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13m0-13C4 8 6 1 9 3l3 5Zm0 0c8 0 6-7 3-5l-3 5Z"/>',
  bolt:'<path d="m14 2-9 12h7l-2 8 9-12h-7l2-8Z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
function mount(){
  const app=document.querySelector('.app'),header=app?.querySelector('.header');
  if(!app||!header||app.classList.contains('project-shell'))return;
  const clouds=document.createElement('div');clouds.className='paper-clouds';clouds.setAttribute('aria-hidden','true');
  for(let i=0;i<3;i++){const cloud=document.createElement('span');cloud.className='paper-cloud';clouds.append(cloud);}
  app.append(clouds);
  const file=location.pathname.split('/').pop()||'index.html';
  const browsing=['index.html','library.html'].includes(file);
  const labels={'index.html':'Góc học tập','library.html':'Thư viện','pre.html':'Chuẩn bị','while.html':'Nghe hiểu','post.html':'Vận dụng','dictation.html':'Nghe chép','shadowing.html':'Luyện nói theo','conversation.html':'Hội thoại'};
  const brand=header.querySelector('.brand'),journey=header.querySelector('.journey');
  const wallet=header.querySelector('.wallet')||document.createElement('div');
  if(!wallet.classList.contains('wallet')){
    wallet.className='wallet';wallet.innerHTML=icon('bolt')+`<strong data-balance>${balance()}</strong><small>SparkPoint</small>`;
  }
  // Normalize the mark, retaining balance nodes/IDs used by lesson rewards.
  wallet.querySelector(':scope > span:first-child,:scope > svg')?.remove();
  const mark=document.createElement('span');mark.className='project-point-mark';mark.setAttribute('aria-hidden','true');mark.innerHTML=icon('bolt');wallet.prepend(mark);
  const lessonName=header.querySelector('.lesson-name')?.textContent||header.querySelector('.lesson-title')?.firstChild?.textContent||'Small steps for the planet';
  const layout=document.createElement('div');layout.className='project-layout';
  const sidebar=document.createElement('aside');sidebar.id='project-sidebar';sidebar.className='project-sidebar';sidebar.setAttribute('aria-label','Điều hướng chính');
  const groups=[
    ['Kế hoạch',[['plan','OKRs của tôi','../key-okrs-management.html']]],
    ['Học tập',[['listen','Listening','library.html'],['speak','Speaking','../key-speaking-library.html'],['book','Từ vựng','http://localhost:3000/tu-vung']]],
    ['Theo dõi',[['progress','Hồ sơ học tập','../key-profile.html']]],
    ['Phần thưởng',[['gift','Spark & quà','../key-spark.html']]],
  ];
  sidebar.innerHTML='<nav aria-label="Các tính năng">'+groups.map(([group,items])=>`<div class="project-nav-group"><h2>${group}</h2>${items.map(([glyph,label,href])=>`<a class="project-nav-item" href="${href}" title="${label}" aria-label="${label}"${glyph==='listen'?' aria-current="page"':''}>${icon(glyph)}<span>${label}</span></a>`).join('')}</div>`).join('')+'</nav>';
  const workspace=document.createElement('div');workspace.className='project-workspace';
  // Move, rather than copy, controls so listeners, IDs and progress remain intact.
  [...app.children].filter(el=>el!==header).forEach(el=>workspace.append(el));
  if(!browsing&&journey){
    const context=document.createElement('div');context.className='project-lesson-context';
    const title=document.createElement('span');title.className='project-lesson-name';title.textContent=lessonName.trim();
    context.append(title,journey);workspace.prepend(context);
  }
  const toggle=document.createElement('button');toggle.className='project-nav-toggle';toggle.type='button';toggle.setAttribute('aria-controls',sidebar.id);toggle.innerHTML=icon('panel');
  const identity=document.createElement('div');identity.className='project-identity';identity.append(toggle,brand);
  const breadcrumb=document.createElement('nav');breadcrumb.className='project-breadcrumb';breadcrumb.setAttribute('aria-label','Vị trí hiện tại');
  const library=document.createElement('a');library.href='library.html';library.textContent='Listening';
  const current=document.createElement('span');current.setAttribute('aria-current','page');current.textContent=labels[file]||'Listening';
  breadcrumb.append(library);const separator=document.createElement('span');separator.className='project-crumb-separator';separator.textContent='/';separator.setAttribute('aria-hidden','true');breadcrumb.append(separator,current);
  const utilities=document.createElement('div');utilities.className='project-utilities';
  if(wallet){wallet.setAttribute('role','link');wallet.tabIndex=0;wallet.title='Xem Spark & quà';wallet.setAttribute('aria-label','SparkPoint · Xem Spark và quà');const open=()=>{location.href='../key-spark.html';};wallet.addEventListener('click',open);wallet.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();open();}});utilities.append(wallet);}
  const bell=document.createElement('button');bell.type='button';bell.className='project-notification-button';bell.title='Thông báo';bell.setAttribute('aria-label','Thông báo');bell.setAttribute('aria-controls','project-notifications');bell.setAttribute('aria-expanded','false');bell.setAttribute('popovertarget','project-notifications');bell.innerHTML=icon('bell');utilities.append(bell);
  const notifications=document.createElement('section');notifications.id='project-notifications';notifications.className='project-notifications';notifications.setAttribute('popover','auto');notifications.setAttribute('aria-labelledby','project-notifications-title');
  notifications.innerHTML='<h2 id="project-notifications-title">Thông báo</h2><p>Bạn chưa có thông báo nào.</p>';
  document.body.append(notifications);
  bell.addEventListener('click',()=>{const r=bell.getBoundingClientRect();notifications.style.top=`${r.bottom+10}px`;notifications.style.right=`${Math.max(16,innerWidth-r.right)}px`;});
  notifications.addEventListener('toggle',event=>bell.setAttribute('aria-expanded',String(event.newState==='open')));
  const account=document.createElement('button');account.type='button';account.className='project-account';account.setAttribute('aria-label','Tài khoản');account.setAttribute('popovertarget','project-account-menu');account.innerHTML=icon('user');utilities.append(account);
  const menu=document.createElement('div');menu.id='project-account-menu';menu.className='project-account-menu';menu.setAttribute('popover','auto');
  menu.innerHTML='<strong>Tài khoản của bạn</strong><a href="../key-profile.html">Hồ sơ học tập</a><a href="../key-profile-edit.html">Điều chỉnh hồ sơ</a><a href="../key-email-settings.html">Nhắc học qua email</a>';
  document.body.append(menu);
  account.addEventListener('click',()=>{const r=account.getBoundingClientRect();menu.style.top=`${r.bottom+10}px`;menu.style.right=`${innerWidth-r.right}px`;});
  header.replaceChildren(identity,breadcrumb,utilities);header.classList.add('project-header');
  layout.append(sidebar,workspace);app.append(layout);app.classList.add('project-shell');
  const lessonRoute=app.querySelector('.journey');
  function updateRoute(){const session=read();updateLessonJourney(lessonRoute,{stage:document.body.dataset.sparkPage==='pre'?'pre':document.body.dataset.sparkPage==='while'?'while':'post',prepComplete:!!prep()?.finished,whileComplete:!!session.while?.reviewComplete,postComplete:!!session.post?.complete?.length});}
  if(lessonRoute){updateRoute();window.addEventListener('listening-session-change',updateRoute);window.addEventListener('lesson-preparation-change',updateRoute);}
  function setExpanded(expanded){app.dataset.sidebar=expanded?'expanded':'collapsed';toggle.setAttribute('aria-expanded',String(expanded));toggle.setAttribute('aria-label',expanded?'Thu gọn menu':'Mở rộng menu');toggle.title=expanded?'Thu gọn menu':'Mở rộng menu';}
  toggle.addEventListener('click',()=>setExpanded(app.dataset.sidebar!=='expanded'));setExpanded(browsing);
}
if(desktop.matches)mount();
desktop.addEventListener('change',e=>{if(e.matches)mount();});
