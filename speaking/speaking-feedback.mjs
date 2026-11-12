import {correctionContent,showCorrection,hideCorrection} from './speaking-correction-popover.mjs';
import {criterionIcon} from './speaking-criterion-icons.mjs';
import {legends,presentationMarks,fluencyText,annotationTone} from './speaking-feedback-presentation.mjs';
import { fixture as defaultFixture, createFeedbackState, v2Questions, applyV2Outcome, drillTargets, applyDrillOutcome } from './speaking-feedback-model.mjs';

const groups=[{id:'fc',abbr:'FC',label:'Trôi chảy & mạch lạc',criteria:[['fluency','Trôi chảy'],['coherence','Mạch lạc']]},{id:'lr',abbr:'LR',label:'Từ vựng',criteria:[['vocabulary','Từ vựng']]},{id:'gra',abbr:'GRA',label:'Ngữ pháp',criteria:[['grammar','Ngữ pháp']]},{id:'p',abbr:'P',label:'Phát âm & ngữ điệu',criteria:[['pronunciation','Phát âm'],['intonation','Ngữ điệu']]}];
const evidence={
 q1:{coherence:{text:'I live in Da Nang, a coastal city in central Vietnam.',kind:'positive',label:'Làm rõ địa điểm',explanation:'Tên thành phố và vị trí giúp người nghe hình dung rõ quê hương của bạn.'},vocabulary:{text:'peaceful atmosphere',kind:'upgrade',label:'Nâng cấp tùy chọn',explanation:'Cụm này dùng đúng. Có thể thử “tranquil atmosphere” để mở rộng cách diễn đạt; đây không phải lỗi.',replacement:'tranquil atmosphere'},kit:{text:'a coastal city',kind:'kit',label:'Đã dùng Speaking Kit',explanation:'Bạn đã đưa cụm “a coastal city” trong Kit vào đúng ngữ cảnh.'}},
 q2:{coherence:{text:'For example',kind:'positive',label:'Ví dụ nối với ý chính',explanation:'Ví dụ về hàng xóm làm rõ ý “laid-back lifestyle”.'},vocabulary:{text:'a lot of',kind:'upgrade',label:'Nâng cấp tùy chọn',explanation:'“A lot of” dùng đúng. “Plenty of” là một lựa chọn khác trong ngữ cảnh này, không phải yêu cầu sửa lỗi.',replacement:'plenty of'},kit:{text:'the laid-back lifestyle',kind:'kit',label:'Đã dùng Speaking Kit',explanation:'Cụm từ từ Kit được dùng để diễn tả nhịp sống thư thái.'}},
 q3:{coherence:{text:'With more frequent buses',kind:'positive',label:'Giải thích thay đổi mong muốn',explanation:'Bạn nối mong muốn cải thiện xe buýt với lợi ích đi lại dễ dàng hơn.'},vocabulary:{text:'more comfortable to live in',kind:'upgrade',label:'Nâng cấp tùy chọn',explanation:'Cụm này dùng đúng. Có thể thử “more liveable” để diễn đạt ngắn gọn; đây không phải lỗi.',replacement:'more liveable'},kit:{text:'get around',kind:'kit',label:'Đã dùng Speaking Kit',explanation:'Bạn dùng “get around” để nói về việc đi lại trong thành phố.'}}
};
const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7M4 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/* Retake pictogram: Lucide biceps-flexed.
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
const retakeIcon='<svg class="sf-retake-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1"/><path d="M15 14a5 5 0 0 0-7.584 2M9.964 6.825C8.019 7.977 9.5 13 8 15"/></svg>';
const btn=(text,action,primary=false,extra='')=>`<button type="button" class="sf-button${primary?' sf-primary':''}" data-action="${action}" ${extra}>${text}</button>`;
export function mountSpeakingFeedback(main,file,options={}) {
 const controlled=Boolean(options.onContinue),fixture=options.fixture||defaultFixture;
 if(!main||main.querySelector('.sf-workspace'))return;
 if(!document.querySelector('link[data-sf-styles]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./speaking-feedback.css',import.meta.url).href;link.dataset.sfStyles='';document.head.append(link);}
 document.body.classList.add('sf-page');main.classList.add('sf-host');
 main.replaceChildren();const root=document.createElement('section');root.className='sf-workspace';root.setAttribute('aria-label','Nhận xét câu trả lời');main.append(root);
 let state=options.state||createFeedbackState(),selectedQuestion=options.questionId||'q1',selectedGroup='gra',criterion='grammar',mode='annotations',activeMark=null;
 const counts=()=>({mistakes:state.groups.filter(group=>group.kind==='mistake'&&state.v2[group.pattern]!=='correct').length,errors:drillTargets(state).filter(target=>target.passedRounds<2&&(!controlled||target.sources.some(source=>source.questionId===selectedQuestion))).length});
 function question(){return fixture.questions.find(question=>question.id===selectedQuestion);}
 function markData(){
  if(criterion==='kit')return [{...evidence[selectedQuestion].kit,id:`${selectedQuestion}-kit`,visual:'kit'}];
  if(criterion==='coherence')return fixture.examples[selectedQuestion].coherence.map((m,i)=>({...m,id:m.id||`${selectedQuestion}-coherence-${i}`,visual:m.pattern?'error':m.kind==='positive'?'positive':'upgrade',kind:m.pattern?state.groups.find(g=>g.pattern===m.pattern)?.kind:m.kind}));
  return presentationMarks(fixture,state,selectedQuestion,criterion,evidence[selectedQuestion]);
 }
 function legendHTML(items){return items.map(([visual,label])=>`<span class="sf-key sf-key-${visual}" data-tone="${annotationTone(visual)}">${label}</span>`).join('');}

 function stressText(mark){const [start,end]=mark.stressRange;return escapeHTML(mark.text.slice(0,start))+`<strong class="sf-word-stress">${escapeHTML(mark.text.slice(start,end))}</strong>`+escapeHTML(mark.text.slice(end));}
 function pauseText(mark){
  const stroke='<span class="sf-pause-stroke" aria-hidden="true"></span>';
  if(mark.visual==='good')return escapeHTML(mark.text)+stroke;
  const words=mark.text.split(' '),last=words.pop();return escapeHTML(words.join(' '))+stroke+' '+escapeHTML(last);
 }
 function transcript(){
  const text=criterion==='fluency'?fluencyText(question()):question().text,marks=markData();let cursor=0,html='';
  const spans=marks.map(mark=>({...mark,start:text.indexOf(mark.text)})).filter(mark=>mark.start>=0).sort((a,b)=>a.start-b.start);
  for(const mark of spans){
   if(mark.start<cursor)continue;
   html+=escapeHTML(text.slice(cursor,mark.start));
   const correction=criterion==='grammar'&&mark.pattern;

   html+=`<button type="button" class="sf-mark sf-${mark.visual}" data-visual="${mark.visual}" data-tone="${annotationTone(mark.visual)}" data-layer="${mark.layer||criterion}" data-mark="${mark.id}" aria-expanded="false" aria-controls="sf-evidence" aria-label="${escapeHTML(mark.text)} · ${escapeHTML(mark.label)}${correction?' · sửa thành '+escapeHTML(mark.replacement):''}">${criterion==='fluency'&&['bad','good'].includes(mark.visual)?pauseText(mark):mark.stressRange?stressText(mark):escapeHTML(mark.text)}</button>`;
   cursor=mark.start+mark.text.length;
  }
  return html+escapeHTML(text.slice(cursor));
 }

 function annotationView(){
  const group=groups.find(group=>group.id===selectedGroup);
  const legend=legendHTML(criterion==='kit'?[['kit','Đã vận dụng Speaking Kit']]:criterion==='coherence'?[['error','Ý chưa phù hợp'],['positive','Ý rõ ràng'],['upgrade','Gợi ý phát triển ý']]:legends[criterion]);

  return `<nav class="sf-groups" aria-label="Nhóm nhận xét">${groups.map(item=>`<button class="sf-group" type="button" data-group="${item.id}" aria-pressed="${item.id===selectedGroup}">${criterionIcon(item.id)}<span>${item.label}</span></button>`).join('')}</nav>
  <div class="sf-layerbar"><div class="sf-criteria" aria-label="Tiêu chí chi tiết">${group.criteria.map(([id,label])=>`<button type="button" data-criterion="${id}" aria-pressed="${id===criterion}">${label}</button>`).join('')}</div></div>
  <div class="sf-reading"><div class="sf-question-heading"><span>Câu ${fixture.questions.findIndex(q=>q.id===selectedQuestion)+1}</span><h2 lang="en" tabindex="-1">${question().prompt}</h2></div>
  <p class="sf-transcript" lang="en">${transcript()}</p>
  <div class="sf-legend">${legend}${criterion==='intonation'?'<span class="sf-key sf-key-pitch">Lên xuống giọng · dấu đường giọng tại cụm câu</span>':''}</div>
  <div id="sf-evidence" class="sf-evidence" hidden></div>
  </div>`;
 }
 const outcomes=(pattern,scope,disabled=false)=>`<div class="sf-outcome-controls" aria-label="Kết quả mẫu cho ${escapeHTML(state.groups.find(group=>group.pattern===pattern).label)}">${(scope==='v2'?[['correct','Đúng mục tiêu'],['repeat','Lặp lại lỗi'],['missing','Chưa có bằng chứng']]:[['correct','Đúng mục tiêu'],['wrong','Sai mục tiêu'],['missing','Chưa có bằng chứng']]).map(([outcome,label])=>btn(label,`${scope}-outcome`,false,`data-pattern="${pattern}" data-outcome="${outcome}" ${disabled?'disabled':''}`)).join('')}</div>`;
 function v2View(){
  return `<div class="sf-mode-heading"><h2 tabindex="-1">Nói lại · Version 2</h2><p>Chỉ nói lại các câu có mistake. Sửa đúng mục tiêu được ghi nhận riêng; lặp lại cùng lỗi sẽ chuyển sang Drill.</p></div><div class="sf-simulation-note">Điều khiển kết quả mẫu · không thu âm hoặc chấm bài thật</div><div class="sf-practice-list">${v2Questions(state).map(({question,targets})=>`<section class="sf-practice-question"><h3>Câu ${fixture.questions.indexOf(question)+1} · ${escapeHTML(question.prompt)}</h3><p class="sf-source" lang="en">${escapeHTML(question.text)}</p>${targets.map(target=>`<div class="sf-target"><div class="sf-target-title"><strong tabindex="-1" data-target-heading="${target.pattern}">${escapeHTML(target.label)}</strong><span class="sf-target-state">${{correct:'Đã sửa đúng · mẫu',missing:'Chưa có bằng chứng'}[state.v2[target.pattern]]||'Chưa thử lại'}</span></div>${target.sources[0].instruction?`<p class="sf-delivery-instruction">${escapeHTML(target.sources[0].instruction)}</p>`:`<p lang="en"><span class="sf-before">${escapeHTML(target.sources[0].text)}</span> <span class="sf-after">${escapeHTML(target.sources[0].replacement)}</span></p>`}${outcomes(target.pattern,'v2')}</div>`).join('')}</section>`).join('')||'<p class="sf-empty">Các mục tiêu còn lại đã chuyển sang Drill.</p>'}</div>`;
 }
 function drillView(){
  return `<div class="sf-mode-heading"><h2 tabindex="-1">Luyện lỗi · Drill</h2><p>Mỗi error dùng một câu nguồn đã sửa, giữ nguyên trong cả hai vòng. Mỗi vòng cần 3 lần đúng liên tiếp cho chính mục tiêu này.</p></div><div class="sf-simulation-note">Điều khiển kết quả mẫu · không thu âm hoặc chấm bài thật</div><div class="sf-practice-list">${drillTargets(state).map(target=>`<section class="sf-drill-target"><div class="sf-target-title"><h3 tabindex="-1" data-target-heading="${target.pattern}">${escapeHTML(target.label)}</h3><span>${target.passedRounds===2?'Đã qua 2 vòng · mẫu':`Vòng ${target.passedRounds+1}/2 · ${target.streak}/3 liên tiếp`}</span></div><p class="sf-drill-sentence" lang="en">${escapeHTML(target.sentence)}</p>${target.sources[0].instruction?`<p class="sf-delivery-instruction">${escapeHTML(target.sources[0].instruction)}</p>`:''}<p class="sf-round-state">${target.passedRounds?'Vòng 1 đã qua. ':''}${target.passedRounds===2?'Hoàn tất tình huống luyện mẫu.':'Sai mục tiêu: về 0 ở vòng hiện tại. Thiếu bằng chứng: giữ nguyên.'}</p>${outcomes(target.pattern,'drill',target.passedRounds===2)}</section>`).join('')||'<p class="sf-empty">Chưa có error cần luyện.</p>'}</div>`;
 }
 function render(focusKey){
  const originalOpen=root.querySelector('.cycle-original')?.open||false;
  activeMark=null;const count=counts();
  root.innerHTML=`${options.collapseOriginal?'<header class="sf-heading"><h1 tabindex="-1">Kết quả lần nói 2</h1></header>':''}
  ${mode==='annotations'&&!controlled?`<nav class="sf-questions" aria-label="Chọn câu trả lời">${fixture.questions.map((q,index)=>`<button type="button" data-question="${q.id}" aria-pressed="${q.id===selectedQuestion}"><span>Câu ${index+1}</span> ${q.short}</button>`).join('')}</nav>`:controlled?'':`<div class="sf-backbar">${btn('Về phần đánh dấu','back')}<span>Hometown · bài nói mẫu</span></div>`}
  ${options.introHTML||''}${options.collapseOriginal?`<details class="cycle-original" ${originalOpen?'open':''}><summary>Xem lại nhận xét lần 1</summary><p class="cycle-original-note">Lần 1: ${options.requiredCount||0} mistake · ${count.errors} error. Phân loại lỗi cập nhật đến hiện tại.</p>`:''}<div class="sf-content">${mode==='annotations'?annotationView():mode==='v2'?v2View():drillView()}</div>${options.collapseOriginal?'</details>':''}
  <div class="sf-bottom"><p class="sf-live" role="status" aria-live="polite"></p><div class="sf-actions">${controlled?btn(options.continueLabel==='Nói lại'?`<span>Nói lại</span>${retakeIcon}`:`${escapeHTML(options.continueLabel||'Tiếp tục')} ${arrow}`,'cycle-continue',true,options.continueLabel==='Nói lại'?'data-no-arrow':''):`<a class="sf-continue" href="key-speaking-completion.html" title="Màn hoàn tất dùng dữ liệu mẫu độc lập; kết quả mô phỏng ở đây không được lưu sang màn đó.">Xem màn hoàn tất mẫu</a>${mode!=='annotations'?btn('Để sau','defer'):''}${btn(`Drill · ${count.errors} error`,'drill')}${btn(`Nói lại V2 · ${count.mistakes} mistake ${arrow}`,'v2',true)}`}</div></div>`;
  const tabs=root.querySelector('.sf-groups');
  tabs?.remove();
  const sheet=document.createElement('div');sheet.className='sf-feedback-sheet';
  sheet.append(...root.childNodes);root.append(sheet);
  if(tabs)root.prepend(tabs);
  if(focusKey){const requested=root.querySelector(focusKey);(requested&&!requested.disabled?requested:root.querySelector('.sf-mode-heading h2, .sf-question-heading h2'))?.focus();}
 }
 function closeMark(returnFocus=false){
  const trigger=root.querySelector(`[data-mark="${activeMark}"]`);root.querySelectorAll('[data-mark]').forEach(button=>button.setAttribute('aria-expanded','false'));
  const box=root.querySelector('#sf-evidence');hideCorrection(box);activeMark=null;if(returnFocus)trigger?.focus({preventScroll:true});
 }
 function openMark(id){
  const mark=markData().find(mark=>mark.id===id),box=root.querySelector('#sf-evidence');if(!mark||!box)return;
  activeMark=id;root.querySelectorAll('[data-mark]').forEach(button=>button.setAttribute('aria-expanded',String(button.dataset.mark===id)));
  box.innerHTML=correctionContent({...mark,criterion});
  showCorrection(box,root.querySelector(`[data-mark="${id}"]`));
 }
 root.addEventListener('focusin',event=>{if(event.target.dataset.mark)openMark(event.target.dataset.mark);});
 root.addEventListener('keydown',event=>{if(event.key==='Escape'&&activeMark){event.preventDefault();const id=activeMark;closeMark();root.querySelector(`[data-mark="${id}"]`)?.blur();root.querySelector(`[data-mark="${id}"]`)?.focus({preventScroll:true});closeMark();}});

 root.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.dataset.mark){openMark(target.dataset.mark);return;}
  if(target.dataset.group){selectedGroup=target.dataset.group;criterion=groups.find(group=>group.id===selectedGroup).criteria[0][0];render(`[data-group="${selectedGroup}"]`);return;}
  if(target.hasAttribute('data-kit')){criterion=criterion==='kit'?'vocabulary':'kit';render('[data-kit]');return;}
  if(target.dataset.criterion){criterion=target.dataset.criterion;render(`[data-criterion="${criterion}"]`);return;}
  if(target.dataset.question){selectedQuestion=target.dataset.question;render(`[data-question="${selectedQuestion}"]`);return;}
  const action=target.dataset.action;
  if(action==='cycle-continue'){options.onContinue();return;}
  if(action==='development'){const panel=root.querySelector('.sf-development');panel.hidden=!panel.hidden;target.setAttribute('aria-expanded',String(!panel.hidden));return;}
  if(action==='close'){closeMark(true);closeMark();return;}
  if(['v2','drill','back','defer'].includes(action)){mode=['back','defer'].includes(action)?'annotations':action;render(target.dataset.pattern?`[data-target-heading="${target.dataset.pattern}"]`:'.sf-mode-heading h2, .sf-question-heading h2');if(action==='defer')root.querySelector('.sf-live').textContent='Đã trở về nhận xét. Bạn có thể luyện tiếp sau.';return;}
  if(action==='v2-outcome'||action==='drill-outcome'){
   const {pattern,outcome}=target.dataset;state=action==='v2-outcome'?applyV2Outcome(state,pattern,outcome):applyDrillOutcome(state,pattern,outcome);
   render(`[data-action="${action}"][data-pattern="${pattern}"][data-outcome="${outcome}"]`);
   const status=outcome==='missing'?'Chưa có bằng chứng; không tăng số lần gặp lỗi hoặc chuỗi đúng.':outcome==='repeat'?'Cùng lỗi xuất hiện lại trong V2: đã chuyển sang Drill.':outcome==='wrong'?'Sai mục tiêu: chuỗi ở vòng hiện tại về 0. Vòng đã qua được giữ.':'Đã ghi nhận kết quả đúng cho mục tiêu trong tình huống mẫu.';
   root.querySelector('.sf-live').textContent=status;
  }
 });
 render();
 return ()=>root.remove();
}
