import {enterSpeaking,seedEntryDrillPreview} from './speaking-entry-drill-state.mjs';
import {createBackgroundButton} from '../background-toggle.mjs';
import {createSoundButton} from '../ui-sound.mjs';
import {balance} from '../session.mjs';
import {mountSpeakingPracticeLibrary} from './speaking-practice-library.mjs';
import {mountSpeakingHeaderDemo} from './speaking-header-demo.mjs';
import {resetTopic} from './speaking-learning-state.mjs';

const icon=()=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 2-9 12h7l-2 8 9-12h-7l2-8Z"/></svg>';
const element=(tag,cls)=>Object.assign(document.createElement(tag),{className:cls});

export function syncSpeakingLibrary(main){
 document.body.dataset.speakingLibrary='';
 document.body.dataset.libraryVersion='rules-v1';
 const referenceStyle=element('link','');referenceStyle.rel='stylesheet';referenceStyle.href=new URL('./speaking-library-reference.css?v=20261123-library-hover',import.meta.url).href;document.head.append(referenceStyle);
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
 main.querySelector('.heading .eyebrow')?.remove();
 const heading=main.querySelector('.heading h1');heading.innerHTML='Luyện tập IELTS <span class="library-title-mark">Speaking</span>';
 main.querySelector('.heading .intro').textContent='Chọn chủ đề, khám phá câu hỏi và luyện nói theo cách của bạn.';
 const header=main.querySelector('.heading');
 const content=element('div','speaking-library-header-content');
 const modes=element('nav','speaking-library-modes');modes.setAttribute('aria-label','Mục tiêu luyện nói');
 const practice=element('button','speaking-library-mode is-current');practice.type='button';practice.setAttribute('aria-pressed','true');
 practice.addEventListener('click',()=>document.getElementById('speaking-practice')?.scrollIntoView({block:'start'}));
 practice.innerHTML='<img src="assets/speaking-modes/practice-listening-v2.svg" width="78" height="72" alt=""><span>Practice ielts</span>';
 const test=element('button','speaking-library-mode mode-test');test.type='button';test.disabled=true;test.title='Sắp có';test.setAttribute('aria-label','Test ielts · Sắp có');
 test.innerHTML='<img src="assets/speaking-modes/test-listening-v2.svg" width="78" height="72" alt=""><span>Test ielts</span>';
 modes.append(practice,test);content.append(modes);header.append(content);
 mountSpeakingHeaderDemo(content);
 main.querySelectorAll('.r1-flow-actions,.question-strip').forEach(el=>el.remove());
 const utilities=document.querySelector('.project-utilities');
 utilities.querySelector('a[href="key-spark.html"]')?.remove();
 const wallet=element('a','wallet');wallet.href='key-spark.html';wallet.setAttribute('aria-label','SparkPoint · Xem Spark và quà');wallet.title='Xem Spark & quà';
 wallet.innerHTML=`<span class="project-point-mark" aria-hidden="true">${icon('bolt')}</span><strong data-balance>${balance()}</strong><small>SparkPoint</small>`;
 utilities.prepend(createBackgroundButton(document),createSoundButton(document),wallet);
 const drillStyle=element('link','');drillStyle.rel='stylesheet';drillStyle.href=new URL('./speaking-entry-drill.css',import.meta.url).href;document.head.append(drillStyle);
 const preview=element('details','entry-drill-demo');preview.innerHTML='<summary>Bản xem thử</summary><div><p>Mẫu một buổi trước đã hoàn thành, có các mục đang chờ luyện. Chưa thu âm hoặc chấm giọng nói thật.</p><button type="button" data-entry-drill-preview>Đặt lại mẫu Drill đang chờ</button></div>';
 preview.querySelector('button').addEventListener('click',()=>{let saved=false;try{saved=seedEntryDrillPreview(window.sessionStorage);}catch{}if(saved)location.href='key-speaking-drill-repeat.html#preview';else{error.hidden=false;error.textContent='Chưa lưu được mẫu luyện. Thử lại nhé.';}});utilities.prepend(preview);
 document.addEventListener('click',event=>{if(preview.open&&!preview.contains(event.target))preview.open=false;});
 preview.addEventListener('keydown',event=>{if(event.key==='Escape'){preview.open=false;preview.querySelector('summary').focus();event.preventDefault();}});

 main.querySelectorAll('.filters,.catalog-meta').forEach(el=>el.remove());
 const library=element('section','speaking-practice-library');library.id='speaking-practice';
 main.querySelector('.lessons').replaceWith(library);
 mountSpeakingPracticeLibrary(library, {onEnter(event){
  if(event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  let entry;try{entry=enterSpeaking(window.sessionStorage);}catch{}
  if(entry?.saved&&entry.href)location.href=entry.href;
  else{error.hidden=false;error.textContent='Chưa lưu được buổi trước. Thử lại trước khi vào bài mới nhé.';}
 }});
}
