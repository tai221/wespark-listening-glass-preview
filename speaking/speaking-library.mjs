import {createBackgroundButton} from '../background-toggle.mjs';
import {createSoundButton} from '../ui-sound.mjs';
import {balance} from '../session.mjs';
import {mountSpeakingHeaderDemo} from './speaking-header-demo.mjs';
import {speakingLessons} from './speaking-library-data.mjs';
import {resetTopic} from './speaking-learning-state.mjs';

const paths={all:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',home:'<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/>',leaf:'<path d="M20 3C9 2 3 7 5 14c2 6 13 5 15-11Z M4 21l11-12"/>',level:'<path d="M5 19v-4m7 4V9m7 10V4"/>',idea:'<path d="M9 18h6m-5 3h4M8 13a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z"/>',bolt:'<path d="m14 2-9 12h7l-2 8 9-12h-7l2-8Z"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>'};
Object.assign(paths,{food:'<path d="M4 3v7m4-7v7m-6-4h8m-4 4v11M17 3c-3 3-3 8 1 8h2V3Zm2 8v10"/>',travel:'<path d="m3 10 8 2 2 8 3-6 5-11-11 5-7 2Z"/>',book:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>'});
const topicIcons={hometown:'home','daily-life':'home',environment:'leaf',food:'food',travel:'travel',learning:'book'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const element=(tag,cls)=>Object.assign(document.createElement(tag),{className:cls});

export function syncSpeakingLibrary(main){
 document.body.dataset.speakingLibrary='';
 document.body.dataset.sparkPage='library';
 const review=element('div','speaking-library-review');
 const index=element('a','');index.href='../index.html';index.textContent='← Mục lục dự án';
 const restart=element('button','reset-session-button');restart.id='reset-speaking-topic';restart.type='button';restart.textContent='Bắt đầu lại';restart.title='Đặt lại tiến trình topic My hometown';
 const label=element('span','');label.textContent='Thư viện Speaking';
 const error=element('span','speaking-reset-error');error.hidden=true;error.setAttribute('role','alert');error.textContent='Chưa đặt lại được tiến trình. Thử lại nhé.';
 restart.addEventListener('click',()=>{
  let cleared=false;try{cleared=resetTopic(window.sessionStorage);}catch{}
  if(cleared)window.location.reload();else error.hidden=false;
 });
 review.append(index,restart,label,error);document.querySelector('.browser').before(review);
 main.querySelector('.heading>.pill')?.remove();
 main.querySelector('.heading').classList.add('speaking-library-heading');
 mountSpeakingHeaderDemo(main.querySelector('.heading'));
 main.querySelectorAll('.r1-flow-actions,.question-strip').forEach(el=>el.remove());
 const utilities=document.querySelector('.project-utilities');
 utilities.querySelector('a[href="key-spark.html"]')?.remove();
 const wallet=element('a','wallet');wallet.href='key-spark.html';wallet.setAttribute('aria-label','SparkPoint · Xem Spark và quà');wallet.title='Xem Spark & quà';
 wallet.innerHTML=`<span class="project-point-mark" aria-hidden="true">${icon('bolt')}</span><strong data-balance>${balance()}</strong><small>SparkPoint</small>`;
 utilities.prepend(createBackgroundButton(document),createSoundButton(document),wallet);

 const topics=[...new Set(speakingLessons.map(lesson=>lesson.topic))];
 const grid=main.querySelector('.lessons');grid.replaceChildren();
 const cards=speakingLessons.map(lesson=>{
  const card=element('article','lesson-card card'),title=element('h2','');title.textContent=lesson.title;
  const action=element(lesson.href?'a':'button',lesson.href?'button primary':'button');
  if(lesson.href){action.href=lesson.href;action.replaceChildren(document.createTextNode('Bắt đầu'),Object.assign(element('span','speaking-card-arrow'),{innerHTML:icon('arrow')}));}
  else{action.type='button';action.disabled=true;action.textContent='Sắp có';}
  const art=element('div','lesson-art'),img=element('img','');img.src=`assets/speaking-covers/${lesson.id}-rustic-v2.webp`;img.alt='';img.width=320;img.height=240;art.append(img);
  if(lesson.plan){const plan=element('span','plan-tag');plan.textContent='OKRs';plan.title='Bài thuộc kế hoạch OKRs của bạn';art.append(plan);}
  const body=element('div','lesson-body'),tags=element('div','lesson-tags');
  tags.innerHTML=`<span class="lesson-topic-tag" data-topic="${lesson.theme}">${icon(topicIcons[lesson.theme])}<span>${lesson.topic}</span></span><span class="lesson-level-tag" data-level="${lesson.level}" aria-label="Trình độ bài ${lesson.level}">${icon('level')}<span>${lesson.level}</span></span>`;
  const summary=element('p','lesson-summary');summary.innerHTML=icon('idea');const copy=element('span','');copy.textContent=lesson.description;summary.append(copy);
  const status=element('span','lesson-state lesson-state-icon');status.dataset.state='new';status.title=lesson.href?'Chưa bắt đầu':'Sắp có';status.setAttribute('role','img');status.setAttribute('aria-label',status.title);status.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>';
  body.append(title,tags,summary,status,action);card.append(art,body);grid.append(card);return card;
 });

 const filters=main.querySelector('.filters');filters.className='filters library-filters';filters.setAttribute('role','group');filters.setAttribute('aria-label','Lọc bài Speaking');filters.replaceChildren();
 const selected={topic:'',level:''};
 for(const [key,title,options] of [['topic','Chủ đề',topics],['level','Trình độ',['A1','A2','B1','B2']]]){
  const group=element('fieldset',`filter-group filter-${key}`),legend=element('legend',''),choices=element('div','filter-choices');legend.textContent=title;
  for(const value of ['',...options]){const button=element('button','filter-pill');button.type='button';button.dataset.value=value;button.setAttribute('aria-pressed',String(!value));if(value)button.textContent=value;else{button.innerHTML=icon('all');button.setAttribute('aria-label',`Tất cả ${title.toLocaleLowerCase('vi')}`);button.title=button.getAttribute('aria-label');}button.addEventListener('click',()=>{selected[key]=value;render();});choices.append(button);}
  group.append(legend,choices);filters.append(group);
 }
 const meta=main.querySelector('.catalog-meta');meta.className='results-heading';meta.innerHTML='<span role="status" aria-atomic="true"></span><button type="button" class="text-button" id="clear">Xóa lọc</button>';
 const empty=element('div','speaking-empty');empty.hidden=true;empty.innerHTML='<h2>Chưa có bài phù hợp</h2><p>Thử một chủ đề khác hoặc xóa bớt bộ lọc.</p><button type="button" class="button">Xóa bộ lọc</button>';main.querySelector('.lessons').after(empty);
 function reset(){selected.topic='';selected.level='';render();}
 function render(){let count=0;cards.forEach((card,i)=>{card.hidden=!!((selected.topic&&selected.topic!==speakingLessons[i].topic)||(selected.level&&selected.level!==speakingLessons[i].level));if(!card.hidden)count++;});for(const key of Object.keys(selected))filters.querySelectorAll(`.filter-${key} button`).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.value===selected[key])));meta.firstChild.textContent=`${count} bài học phù hợp`;meta.querySelector('button').disabled=!selected.topic&&!selected.level;empty.hidden=count>0;}
 meta.querySelector('button').addEventListener('click',reset);empty.querySelector('button').addEventListener('click',()=>{reset();filters.querySelector('button').focus();});render();
}
