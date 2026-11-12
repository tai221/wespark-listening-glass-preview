import {speakingPreparationEntry,speakingPreparationLabel} from './speaking-preparation-visibility.mjs';
import {mountCycleResult} from './speaking-cycle-result.mjs';
import {scenarioCatalog} from './speaking-cycle-result-data.mjs';
import {mountSpeakingPractice} from './speaking-practice.mjs';
import {mountSpeakingFeedback} from './speaking-feedback.mjs';
import {fixture} from './speaking-feedback-model.mjs';
import {CYCLE_STORAGE_KEY,createCycleState,transitionCycle,restoreCycleState,cycleSummary,cycleFeedbackState,cycleSample} from './speaking-cycle-model.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 5 7 7-7 7M17 12H3"/></svg>';
const aliases=/^key-speaking-(produce|feedback|feedback-detail|version2|compare|completion)\.html$/;
const files={v1:'produce',feedback:'feedback',v2:'version2',result:'compare',completion:'completion'};
const stages={v1:'Nói lần đầu · V1',feedback:'Nhận xét V1',v2:'Nói lại · V2',result:'Kết quả V2',completion:'Hoàn tất'};
export function mountSpeakingCycle(main,file){
 if(!main)return ()=>{};
 if(!document.querySelector('link[data-speaking-cycle]')){const link=document.createElement('link');link.rel='stylesheet';link.dataset.speakingCycle='';link.href=new URL('./speaking-cycle.css',import.meta.url).href;document.head.append(link);}
 if(!document.querySelector('link[data-cycle-result]')){const link=document.createElement('link');link.rel='stylesheet';link.dataset.cycleResult='';link.href=new URL('./speaking-cycle-result.css',import.meta.url).href;document.head.append(link);}
 let saved=null;try{saved=sessionStorage.getItem(CYCLE_STORAGE_KEY);}catch{}
 let state=restoreCycleState(saved),reviewId=null,recordState='ready',dispose=null,variant='normal',outcome='correct',behavior='repair',storageFailed=false,destroyed=false;
 const initialHash=location.hash.match(/^#question-([1-3])$/),initialQuestion=initialHash&&state.questions[Number(initialHash[1])-1];if(initialQuestion?.completed&&/key-speaking-(feedback|feedback-detail|compare)\.html$/.test(location.pathname))reviewId=initialQuestion.id;
 const lifecycle=new AbortController();
 document.body.classList.add('speaking-cycle-page');main.classList.add('speaking-cycle');
 const pending=()=>['recording','review'].includes(recordState);
 function mayLeave(){if(!pending())return true;if(!confirm('Bạn đang có lượt ghi âm chưa gửi. Rời màn này và bỏ lượt đang dở?'))return false;recordState='ready';return true;}
 function save(){try{sessionStorage.setItem(CYCLE_STORAGE_KEY,JSON.stringify(state));storageFailed=false;}catch{storageFailed=true;}}
 function canonical(){const path=new URL(location.href);path.pathname=path.pathname.replace(/[^/]+$/,`key-speaking-${reviewId?'feedback-detail':files[state.stage]}.html`);path.hash=reviewId?`question-${fixture.questions.findIndex(q=>q.id===reviewId)+1}`:`question-${state.current+1}`;history.replaceState(null,'',path);}
 function syncShell(){
  if(destroyed)return;
  document.body.dataset.speakingCycleStage=state.stage;
  const finished=!reviewId&&state.stage==='completion',shellStage=finished?null:state.stage==='v1'&&!reviewId?'produce':'feedback';
  const progress=main.querySelector('.cycle-questions'),host=document.querySelector('.lesson-top-identity .lesson-fallback-tags');
  if(progress&&host){host.querySelector('.speaking-question-progress')?.remove();progress.classList.add('speaking-question-progress');host.append(progress);}
  const demo=main.querySelector('.cycle-demo'),tools=document.querySelector('.lesson-top-tools');
  if(demo&&tools){tools.querySelector('.cycle-demo')?.remove();tools.prepend(demo);}
  if(!reviewId&&state.stage==='completion')document.querySelectorAll('.speaking-question-progress [aria-current]').forEach(button=>button.removeAttribute('aria-current'));
  document.querySelectorAll('.lesson-stage-heading strong[data-stage-label]').forEach(label=>{label.textContent=label.dataset.stageLabel;});
  document.querySelectorAll('[data-rail-stage]').forEach(marker=>{const current=marker.dataset.railStage===shellStage;marker.removeAttribute('aria-current');if(current)marker.setAttribute('aria-current','step');const label=marker.getAttribute('aria-label')?.replace(' · Đang học','')||'';marker.setAttribute('aria-label',label+(current?' · Đang học':''));});
  document.querySelectorAll('.lesson-stage-group').forEach(group=>{const current=group.dataset.stage===shellStage;group.dataset.current=String(current);const link=group.querySelector('.lesson-stage-link');link?.removeAttribute('aria-current');group.querySelector('.lesson-stage-status')?.remove();if(current){link?.setAttribute('aria-current','step');const status=document.createElement('span');status.className='lesson-stage-status';status.textContent='Đang học';group.querySelector('.lesson-stage-heading')?.append(status);}});
  const question=state.questions.find(q=>q.id===(reviewId||state.questions[state.current].id));
  const activeSubstep=reviewId?(question.v2?'compare':'feedback'):({feedback:'feedback',v2:'version2',result:'compare'}[state.stage]);
  document.querySelectorAll('[data-speaking-substep]').forEach(a=>{
   const id=a.dataset.speakingSubstep,current=id===activeSubstep;
   a.hidden=id!=='feedback'&&Boolean(question.v1)&&!question.requiredV2.length;
   a.removeAttribute('aria-current');a.removeAttribute('href');a.setAttribute('aria-disabled',String(!current));
   if(current){a.setAttribute('aria-current','page');a.setAttribute('href',`key-speaking-${id}.html`);}
  });
  const feedbackGroup=document.querySelector('.lesson-stage-group[data-stage="feedback"]'),substeps=feedbackGroup?.querySelector('.lesson-substeps');
  if(substeps){
   const visible=[...substeps.querySelectorAll('a')].filter(a=>!a.hidden),single=visible.length===1;
   feedbackGroup.dataset.single=String(single);substeps.hidden=single;
   feedbackGroup.querySelector('strong').textContent=single?visible[0].textContent:'Nhận xét & sửa bài';
   feedbackGroup.querySelector('small').textContent=single?'Xem nhận xét cho câu trả lời.':'Xem nhận xét, nói lại khi cần.';
  }
 }
 function dispatch(action){const next=transitionCycle(state,action);if(next===state)return false;state=next;reviewId=null;save();render(true);return true;}
 function scopedFixture(id){
  const withoutFixedHistory=mark=>({...mark,explanation:mark.explanation?.replace(/(?:Cùng|cùng)[^.]*\./g,'').replace(/[,;]\s*$/,'.').replace('Mẫu lại ','Mẫu ').trim()});
  const sample=cycleSample(state,id),events=state.events.filter(e=>e.questionId===id&&e.version===1).map(withoutFixedHistory),allowed=new Set(events.map(e=>e.id));
  const examples=structuredClone(fixture.examples),delivery=structuredClone(fixture.delivery);
  for(const [name,marks] of Object.entries(examples[id]))examples[id][name]=marks.filter(m=>m.pattern?allowed.has(m.id):sample.variant==='normal'||m.kind==='positive').map(withoutFixedHistory);
  for(const [name,marks] of Object.entries(delivery[id]))delivery[id][name]=marks.filter(m=>m.pattern?allowed.has(m.id):sample.variant==='normal'||m.kind==='positive').map(withoutFixedHistory);
  return {...fixture,questions:fixture.questions.map(q=>q.id===id?sample:q),events,examples,delivery,sampleVariants:{[id]:sample.variant}};
 }
 function header(){
  const el=document.createElement('div');el.className='cycle-top';el.innerHTML=`<nav class="cycle-questions" aria-label="Tiến độ từng câu">${state.questions.map((q,i)=>`<button type="button" data-cycle-question="${q.id}" ${i>state.current?'disabled':''} aria-current="${(reviewId||state.questions[state.current].id)===q.id?'step':'false'}" title="${q.completed?'Xem lại câu đã hoàn thành':i>state.current?'Hoàn thành câu hiện tại để mở':'Câu hiện tại'}" data-question-state="${q.completed?'done':i>state.current?'locked':'current'}" data-focused="${((reviewId||state.questions[state.current].id)===q.id)&&(reviewId||state.stage!=='completion')?'true':'false'}" aria-label="Câu ${i+1} · ${q.completed?'Hoàn thành · Xem lại':i>state.current?'Chưa mở':'Đang học'}">${q.completed?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>':''}Q${i+1}</button>`).join('')}</nav><details class="cycle-demo"><summary title="Dữ liệu minh họa và lựa chọn tình huống">Bản xem thử</summary><div>${state.stage==='v1'&&!reviewId?`<label>V1 câu hiện tại<select data-cycle-variant><option value="normal">Có mistake</option><option value="clean">Không có lỗi cần sửa</option><option value="errors-only">Chỉ có error</option></select></label>`:''}${state.stage==='v2'&&!reviewId?`<label>Hành vi nói lại<select data-cycle-behavior><option value="repair">Hành vi đúng · sửa bài V1</option><option value="new">Hành vi sai · lệch bài hoặc giảm rõ</option></select></label><label>Kết quả bản ghi V2<select data-cycle-outcome>${scenarioCatalog[behavior].map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}<option value="technical-failure">Lỗi kỹ thuật · ghi lại</option></select></label>`:''}<p>Bản xem thử dùng dữ liệu minh họa, chưa thu âm hoặc chấm bài thật.</p><button type="button" data-cycle-reset>Bắt đầu lại toàn bộ</button></div></details>`;
  el.querySelector('[data-cycle-variant]')?.addEventListener('change',e=>variant=e.target.value);const v=el.querySelector('[data-cycle-variant]');if(v)v.value=variant;
  const behaviorControl=el.querySelector('[data-cycle-behavior]');if(behaviorControl){behaviorControl.value=behavior;behaviorControl.addEventListener('change',e=>{if(!scenarioCatalog[e.target.value])return;behavior=e.target.value;if(!scenarioCatalog[behavior].some(([value])=>value===outcome))outcome=scenarioCatalog[behavior][0][0];const control=behaviorControl.closest('.cycle-demo').querySelector('[data-cycle-outcome]');control.innerHTML=scenarioCatalog[behavior].map(([value,label])=>`<option value="${value}">${label}</option>`).join('')+'<option value="technical-failure">Lỗi kỹ thuật · ghi lại</option>';control.value=outcome;});}
  el.querySelector('[data-cycle-outcome]')?.addEventListener('change',e=>outcome=e.target.value);const o=el.querySelector('[data-cycle-outcome]');if(o)o.value=outcome;
  el.querySelector('[data-cycle-reset]').addEventListener('click',()=>{if(!mayLeave())return;state=createCycleState();reviewId=null;variant='normal';outcome='correct';behavior='repair';save();render(true);});
  el.querySelectorAll('[data-cycle-question]').forEach(button=>button.addEventListener('click',()=>{const q=state.questions.find(q=>q.id===button.dataset.cycleQuestion);if(q.id===(reviewId||state.questions[state.current].id)&&!(state.stage==='completion'&&!reviewId))return;if(!q.completed&&q!==state.questions[state.current])return;if(!mayLeave())return;reviewId=q.completed?q.id:null;render(true);}));
  return el;
 }
 function completion(){
  const summary=cycleSummary(state);if(!summary.complete){reviewId=null;return;}
  main.innerHTML=`<section class="cycle-completion"><h1 tabindex="-1">Hoàn thành lượt nói</h1><p>Bạn đã hoàn thành ${summary.v1} câu luyện nói.</p><dl><div><dt>Câu đã nói</dt><dd>${summary.v1} / 3</dd></div><div><dt>Nhận xét đã xem</dt><dd>${summary.feedback} / 3</dd></div><div><dt>Lượt nói lại</dt><dd>${summary.v2}</dd></div></dl><ul>${state.questions.map((q,i)=>`<li><button type="button" data-cycle-history="${q.id}">Câu ${i+1} · ${escape(fixture.questions[i].short)} ${arrow}</button><span>Câu đã nói · đã xem nhận xét${q.v2?' · Lượt nói lại':''}</span></li>`).join('')}</ul><a class="cycle-library" href="key-speaking-library.html">Về thư viện Speaking ${arrow}</a></section>`;
  main.querySelectorAll('[data-cycle-history]').forEach(button=>button.addEventListener('click',()=>{reviewId=button.dataset.cycleHistory;render(true);}));
 }
 function render(focus=false){
  dispose?.();dispose=null;recordState='ready';main.classList.remove('sf-host','speaking-practice');delete main.dataset.recordState;document.body.classList.remove('sf-page','speaking-practice-page');main.replaceChildren();
  main.dataset.cycleStage=reviewId?'history':state.stage;main.dataset.cycleQuestion=reviewId||state.questions[state.current].id;
  const q=state.questions.find(q=>q.id===(reviewId||state.questions[state.current].id));
  if(!reviewId&&['v1','v2'].includes(state.stage)){
   const v2=state.stage==='v2';dispose=mountSpeakingPractice(main,{questionIndex:state.current,version:v2?2:1,submitLabel:v2?'Xem kết quả V2':'Xem nhận xét câu này',onStateChange:next=>recordState=next,canLeave:mayLeave,backLabel:v2?'Về nhận xét câu này':state.current===0?`Về ${speakingPreparationLabel()}`:`Xem lại câu ${state.current}`,onBack:()=>{if(v2){reviewId=q.id;render(true);}else if(state.current>0){reviewId=state.questions[state.current-1].id;render(true);}else location.href=speakingPreparationEntry();},onSubmit:()=>{if(v2&&outcome==='technical-failure')return false;return dispatch(v2?{type:'submit-v2',outcome,behavior}:{type:'submit-v1',variant});}});
   if(v2){const targets=document.createElement('details');targets.className='cycle-targets';targets.open=true;targets.innerHTML=`<summary>${q.requiredV2.length} mục tiêu · nói lại trọn câu trả lời</summary><ul>${q.requiredV2.map(pattern=>{const g=cycleFeedbackState(state).groups.find(g=>g.pattern===pattern),source=g.sources.find(e=>e.questionId===q.id);return `<li><strong>${escape(g.label)}</strong><span>${escape(source.instruction||`${source.text} → ${source.replacement}`)}</span></li>`;}).join('')}</ul>`;main.querySelector('.practice-prompt').after(targets);}
  }else if(!reviewId&&state.stage==='completion')completion();
  else {
   const historical=Boolean(reviewId),result=Boolean(q.v2)&&(historical||state.stage==='result');
   const continueLabel=historical?'Về bước đang học':result?(state.current===2?'Hoàn tất lượt nói':'Sang câu tiếp theo'):q.requiredV2.length?'Nói lại':state.current===2?'Hoàn tất lượt nói':'Sang câu tiếp theo';
   const onContinue=()=>{if(historical){reviewId=null;render(true);}else dispatch({type:result?'continue-result':'continue-feedback'});};
   if(result)dispose=mountCycleResult(main,{entry:q,onContinue,continueLabel,historyReview:historical});
   else dispose=mountSpeakingFeedback(main,file,{questionId:q.id,state:cycleFeedbackState(state),fixture:scopedFixture(q.id),requiredCount:q.requiredV2.length,reviewOnly:historical,historyReview:historical,continueLabel,onContinue});
   if(historical&&!q.v1){reviewId=null;render();return;}
  }
  main.prepend(header());if(storageFailed){const warning=document.createElement('p');warning.className='cycle-storage-warning';warning.role='status';warning.textContent='Không lưu được phiên trong trình duyệt. Tải lại sẽ bắt đầu lại từ câu 1.';main.prepend(warning);}
  canonical();syncShell();queueMicrotask(syncShell);
  if(focus)(main.querySelector(state.stage==='result'||(reviewId&&q.v2)?'.cycle-result h1':'.sf-question-heading h2,#practice-question,.cycle-completion h1'))?.focus({preventScroll:true});
 }
 function onHash(){const match=location.hash.match(/^#question-([1-3])$/),q=match&&state.questions[Number(match[1])-1];if(q?.completed&&q.id!==reviewId){if(!mayLeave()){canonical();return;}reviewId=q.id;render(true);}else canonical();}
 window.addEventListener('hashchange',onHash,{signal:lifecycle.signal});
 document.addEventListener('click',event=>{
  const demo=document.querySelector('.lesson-top-tools .cycle-demo[open]');if(demo&&!demo.contains(event.target))demo.open=false;
  const a=event.target.closest?.('a[href]');if(!a||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return;const url=new URL(a.href,location.href);
  if(url.origin===location.origin&&url.pathname===location.pathname&&url.hash&&!/^#question-/.test(url.hash))return;
  if(url.origin===location.origin&&aliases.test(url.pathname.split('/').pop())){event.preventDefault();event.stopImmediatePropagation();if(!mayLeave())return;reviewId=null;render(true);return;}
  if(pending()&&!mayLeave()){event.preventDefault();event.stopImmediatePropagation();}
 },{capture:true,signal:lifecycle.signal});
 document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const demo=document.querySelector('.lesson-top-tools .cycle-demo[open]');if(demo){demo.open=false;demo.querySelector('summary').focus();event.preventDefault();}},{signal:lifecycle.signal});
 window.addEventListener('beforeunload',event=>{if(pending()){event.preventDefault();event.returnValue='';}},{signal:lifecycle.signal});
 render();
 return ()=>{destroyed=true;dispose?.();lifecycle.abort();};
}
