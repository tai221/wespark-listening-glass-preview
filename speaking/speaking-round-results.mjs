import {fixture} from './speaking-feedback-model.mjs';
import {criterionIcon} from './speaking-criterion-icons.mjs';
import {annotationTone} from './speaking-feedback-presentation.mjs';
import {correctionContent,showCorrection,hideCorrection} from './speaking-correction-popover.mjs';
import {mountSpeakingPractice} from './speaking-practice.mjs';
import {ROUND_RESULTS_KEY,restoreRoundResults,addRoundRetake,roundResultSample,summarizeRoundScores} from './speaking-round-results-state.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups=[{id:'fc',label:'Trôi chảy & mạch lạc',criteria:[['fluency','Trôi chảy'],['coherence','Mạch lạc']]},{id:'lr',label:'Từ vựng',criteria:[['vocabulary','Từ vựng']]},{id:'gra',label:'Ngữ pháp',criteria:[['grammar','Ngữ pháp']]},{id:'p',label:'Phát âm & ngữ điệu',criteria:[['pronunciation','Phát âm'],['intonation','Ngữ điệu']]}];
const scoreLabel=score=>score.toFixed(2).replace(/(\.\d)0$/,'$1');
const arm='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1"/><path d="M15 14a5 5 0 0 0-7.584 2M9.964 6.825C8.019 7.977 9.5 13 8 15"/></svg>';
export function mountRoundResults(main){
 const doc=main.ownerDocument,win=doc.defaultView,lifecycle=new win.AbortController();let state=restoreRoundResults(null),selected=null,group='gra',criterion='grammar',versions={q1:0,q2:0,q3:0},recordDispose=null,recordState='ready',outcome='mixed',destroyed=false;
 try{state=restoreRoundResults(win.sessionStorage.getItem(ROUND_RESULTS_KEY));}catch{}
 main.className='main speaking-round-results';
 const sheet=doc.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./speaking-round-results.css',import.meta.url).href;doc.head.append(sheet);
 main.innerHTML=`<header class="rf-heading"><div class="rf-heading-copy"><span class="mm-mascot-scene"><img class="mm-mascot" src="../assets/spark-mindmap-laptop-v1.webp" width="120" height="80" alt="Spark đeo tai nghe, xem phản hồi trên laptop"></span><div><h1>Nhận phản hồi</h1><p>Xem lại từng câu trả lời và luyện thêm theo góp ý.</p></div></div><ol class="rf-steps" aria-label="Các bước luyện nói"><li><b>✓</b><span>Xây mindmap</span></li><li><b>✓</b><span>Luyện nói</span></li><li aria-current="step"><b>3</b><span>Nhận phản hồi</span></li></ol></header><div class="rf-layout"><section class="rf-transcripts" aria-label="Transcript ba câu trả lời"><h2>Transcript câu trả lời</h2><div class="rf-question-list">${fixture.questions.map((q,i)=>`<article class="rf-question" data-result-question="${q.id}"><button type="button" class="rf-question-toggle" data-select-question="${q.id}" aria-expanded="false" aria-controls="rf-body-${q.id}"><span class="rf-number">Q${i+1}</span><span lang="en">${esc(q.prompt)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><section id="rf-body-${q.id}" class="rf-question-body" hidden></section></article>`).join('')}</div></section><section class="rf-analysis" aria-label="Phân tích theo tiêu chí"></section></div><div class="rf-popover" hidden></div><p class="rf-save-error" role="alert" hidden></p>`;
 const preview=doc.createElement('details');preview.className='rf-preview';preview.innerHTML='<summary>Bản xem thử</summary><div><p>Transcript, band và nhận xét là dữ liệu minh họa, chưa được phân tích từ bản ghi thật.</p><label>Kết quả nói lại<select data-retake-outcome><option value="mixed">Sửa được một phần</option><option value="correct">Đã áp dụng các góp ý</option><option value="repeat">Vẫn còn các lỗi cũ</option></select></label></div>';
 function syncPreview(){if(!destroyed)(doc.querySelector('.lesson-top-tools')||main).prepend(preview);}syncPreview();queueMicrotask(syncPreview);
 preview.querySelector('select').addEventListener('change',event=>outcome=event.target.value);
 const $=s=>main.querySelector(s),popover=$('.rf-popover');
 function pending(){return recordDispose&&['recording','review'].includes(recordState);}
 function maySwitch(){return !pending()||win.confirm('Bạn đang có lượt nói lại chưa nộp. Bỏ lượt này để chuyển bài?');}
 main.speakingStageCanLeave=maySwitch;
 function stopRecorder(){recordDispose?.();recordDispose=null;recordState='ready';doc.body.classList.remove('speaking-practice-page');}
 function save(next){try{win.sessionStorage.setItem(ROUND_RESULTS_KEY,JSON.stringify(next));$('.rf-save-error').hidden=true;return true;}catch{$('.rf-save-error').hidden=false;$('.rf-save-error').textContent='Chưa lưu được lần nói lại. Hãy thử nộp lại.';return false;}}
 const sample=()=>roundResultSample(state,selected,versions[selected],criterion);
 function renderQuestion(){
  hideCorrection(popover);stopRecorder();
  main.querySelectorAll('[data-result-question]').forEach(card=>{const active=card.dataset.resultQuestion===selected;card.dataset.active=String(active);card.querySelector('button').setAttribute('aria-expanded',String(active));const body=card.querySelector('.rf-question-body');body.hidden=!active;if(!active)body.replaceChildren();});
  if(!selected){renderAnalysis();return;}
  const body=$(`#rf-body-${selected}`);body.innerHTML=`<div class="rf-versions" role="group" aria-label="Chọn lần nói">${Array.from({length:state.attempts[selected].length+1},(_,i)=>`<button type="button" data-select-version="${i}" aria-pressed="${versions[selected]===i}">Lần ${i+1}</button>`).join('')}</div><div class="rf-script" lang="en"></div><div class="rf-legend"><span data-tone="error">Cần sửa</span><span data-tone="positive">Làm tốt</span><span data-tone="suggestion">Gợi ý</span><span data-tone="caution">Cần chú ý</span></div><div class="rf-transcript-actions"><button type="button" class="rf-retake" data-start-retake>Nói lại ${arm}</button></div><section class="rf-recorder-host" hidden></section>`;
  renderAnalysis();
 }
 function visibleMarks(data){let end=0;return data.marks.map(m=>({...m,start:data.text.indexOf(m.text)})).filter(m=>m.start>=0).sort((a,b)=>a.start-b.start).filter(m=>{if(m.start<end)return false;end=m.start+m.text.length;return true;});}
 function renderAnalysis(){
  hideCorrection(popover);const panel=$('.rf-analysis');
  if(!selected){
   const summary=summarizeRoundScores(fixture.questions.map(q=>roundResultSample(state,q.id,0)));
   if(!summary){panel.innerHTML='<h2>Kết quả cả lượt luyện nói</h2><p>Chưa đủ điểm để tính kết quả cả lượt.</p>';return;}
   panel.innerHTML=`<header class="rf-analysis-heading"><h2>Kết quả cả lượt luyện nói</h2><span>3 câu · Lần 1</span></header><div class="rf-band"><span>Band tổng</span><strong>${scoreLabel(summary.band)}</strong></div><nav class="rf-criteria" aria-label="Điểm tiêu chí cả lượt">${groups.map((g,i)=>`<button type="button" data-result-group="${g.id}" aria-pressed="${g.id===group}">${criterionIcon(g.id)}<span>${g.label}</span><strong>${scoreLabel(summary.scores[i])}</strong></button>`).join('')}</nav><p class="rf-average-note">Điểm mỗi tiêu chí là trung bình cộng của 3 câu. Band tổng là trung bình cộng của 4 tiêu chí.</p><p class="rf-overview-hint">Mở một câu trả lời bên trái để xem transcript và góp ý chi tiết.</p>`;return;
  }
  const data=sample(),marks=visibleMarks(data);let cursor=0,html='';marks.forEach((mark,index)=>{html+=esc(data.text.slice(cursor,mark.start))+`<button type="button" class="rf-mark" data-result-mark="${index}" data-tone="${annotationTone(mark.visual,mark.status)}" aria-expanded="false">${esc(mark.text)}</button>`;cursor=mark.start+mark.text.length;});html+=esc(data.text.slice(cursor));$('.rf-script').innerHTML=html;
  const currentGroup=groups.find(g=>g.id===group),band=data.scores.reduce((a,b)=>a+b,0)/4;
  panel.innerHTML=`<header class="rf-analysis-heading"><h2>Phân tích & góp ý</h2><span>Câu ${fixture.questions.findIndex(q=>q.id===selected)+1} · Lần ${versions[selected]+1}</span></header><div class="rf-band"><span>Band ước lượng</span><strong>${(Math.round(band*2)/2).toFixed(1)}</strong></div><nav class="rf-criteria" aria-label="Tiêu chí nhận xét">${groups.map((g,i)=>`<button type="button" data-result-group="${g.id}" aria-pressed="${g.id===group}">${criterionIcon(g.id)}<span>${g.label}</span><strong>${data.scores[i].toFixed(1)}</strong></button>`).join('')}</nav>${currentGroup.criteria.length>1?`<div class="rf-subcriteria" role="group" aria-label="Tiêu chí chi tiết">${currentGroup.criteria.map(([id,label])=>`<button type="button" data-result-criterion="${id}" aria-pressed="${id===criterion}">${label}</button>`).join('')}</div>`:''}<section class="rf-feedback-list" aria-label="Nhận xét chi tiết">${marks.length?marks.map((m,i)=>`<article class="rf-feedback-item" data-feedback-item="${i}" data-tone="${annotationTone(m.visual,m.status)}"><button type="button" data-find-mark="${i}"><span class="rf-feedback-dot"></span><strong>${esc(m.label||'Nhận xét')}</strong><span lang="en">${esc(m.text)}</span></button>${m.replacement&&m.replacement!==m.text?`<p class="rf-replacement"><span>Gợi ý:</span> <strong lang="en">${esc(m.replacement)}</strong></p>`:''}<p>${esc(m.explanation||m.instruction||'Xem cụm được đánh dấu trong transcript để đối chiếu.')}</p>${m.sentence?`<p class="rf-example" lang="en">${esc(m.sentence)}</p>`:''}</article>`).join(''):'<p class="rf-no-marks">Trong lần nói này, chưa có nhận xét cụ thể cho tiêu chí đang chọn.</p>'}</section><section class="rf-suggested"><img src="../assets/spark-mindmap-laptop-v1.webp" width="60" height="40" alt="Spark"><div><h3>Câu trả lời gợi ý</h3><p lang="en">${esc(data.suggested)}</p></div></section>`;
 }
 function startRetake(){
  if(recordDispose)return;const host=$('.rf-recorder-host');host.hidden=false;$('[data-start-retake]').hidden=true;
  const question=fixture.questions.findIndex(q=>q.id===selected);recordDispose=mountSpeakingPractice(host,{version:2,questionIndex:question,skipQuestionAudio:true,showSubmitLabel:true,submitLabel:'Chấm lại',canLeave:maySwitch,onStateChange:s=>recordState=s,onSubmit:()=>{
   const next=addRoundRetake(state,selected,outcome);if(next===state||!save(next))return false;state=next;versions[selected]=state.attempts[selected].length;recordState='submitted';renderQuestion();$(`[data-select-version="${versions[selected]}"]`)?.focus({preventScroll:true});return true;
  }});
  const cancel=doc.createElement('button');cancel.type='button';cancel.className='rf-cancel-retake';cancel.textContent='Hủy nói lại';cancel.addEventListener('click',()=>{if(maySwitch())renderQuestion();});host.append(cancel);
 }
 main.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-select-question')){if(!maySwitch())return;selected=selected===button.dataset.selectQuestion?null:button.dataset.selectQuestion;renderQuestion();}
  else if(button.hasAttribute('data-select-version')){if(!maySwitch())return;versions[selected]=Number(button.dataset.selectVersion);renderQuestion();$(`[data-select-version="${versions[selected]}"]`)?.focus({preventScroll:true});}
  else if(button.hasAttribute('data-result-group')){group=button.dataset.resultGroup;criterion=groups.find(g=>g.id===group).criteria[0][0];renderAnalysis();$(`[data-result-group="${group}"]`)?.focus({preventScroll:true});}
  else if(button.hasAttribute('data-result-criterion')){criterion=button.dataset.resultCriterion;renderAnalysis();$(`[data-result-criterion="${criterion}"]`)?.focus({preventScroll:true});}
  else if(button.hasAttribute('data-start-retake'))startRetake();
  else if(button.hasAttribute('data-result-mark')){const index=Number(button.dataset.resultMark),mark=visibleMarks(sample())[index];popover.innerHTML=correctionContent(mark,{status:mark.status});showCorrection(popover,button);main.querySelectorAll('.rf-feedback-item').forEach((item,i)=>item.dataset.active=String(i===index));}
  else if(button.hasAttribute('data-find-mark')){const mark=$(`[data-result-mark="${button.dataset.findMark}"]`);mark?.scrollIntoView({block:'nearest',behavior:win.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});mark?.focus({preventScroll:true});}
 });
 win.addEventListener('beforeunload',event=>{if(pending()){event.preventDefault();event.returnValue='';}},{signal:lifecycle.signal});
 doc.addEventListener('click',event=>{if(event.target.closest?.('a[href]')&&pending()&&!maySwitch()){event.preventDefault();event.stopImmediatePropagation();}},{capture:true,signal:lifecycle.signal});
 renderAnalysis();return ()=>{destroyed=true;stopRecorder();hideCorrection(popover);preview.remove();lifecycle.abort();};
}
