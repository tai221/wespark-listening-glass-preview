import {correctionContent,showCorrection,hideCorrection} from './speaking-correction-popover.mjs';
import {criterionIcon} from './speaking-criterion-icons.mjs';
import {legends,annotationTone} from './speaking-feedback-presentation.mjs';
import {overallV2Comment} from './speaking-cycle-result-data.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={good:'<path d="m4 10 4 4 8-9"/>',bad:'<path d="m5 5 10 10M15 5 5 15"/>',unclear:'<path d="M4 10h12"/>'};
const svg=type=>type==='unclear'?'<span class="sf-status-dash" aria-hidden="true"></span>':`<svg viewBox="0 0 20 20" aria-hidden="true">${icons[type]}</svg>`;
const groups=[{id:'fc',abbr:'FC',name:'Trôi chảy & mạch lạc',criteria:[['fluency','Độ trôi chảy'],['coherence','Nội dung & mạch']]},{id:'lr',abbr:'LR',name:'Từ vựng',criteria:[['vocabulary','Từ vựng']]},{id:'gra',abbr:'GRA',name:'Ngữ pháp',criteria:[['grammar','Ngữ pháp']]},{id:'p',abbr:'P',name:'Phát âm & ngữ điệu',criteria:[['pronunciation','Phát âm'],['intonation','Ngữ điệu']]}];

export function mountCycleResult(main,{entry,onContinue,continueLabel,historyReview=false}){
 let group='gra',criterion='grammar',selectedId=null,detailOrigin=null;const behavior=entry.v2.behavior||'repair',{q,targets,after,fresh}=entry.v2.sample;
 const criterionOf=e=>e.criterion||'grammar';
 const visualOf=(e,status)=>{
  const c=criterionOf(e);if(c==='fluency')return status==='good'?'good':status==='unclear'?'unclear':e.pattern==='repeated-start'?'repeat':'bad';
  if(c==='coherence')return e.pattern==='off-topic'?(status==='good'?'removed':'offtopic'):'reason';
  if(c==='vocabulary'&&status==='unclear')return 'upgrade';
  return status==='good'?'positive':status==='bad'?'error':'unclear';
 };
 const visualLabel=visual=>({removed:'Đã bỏ ý lạc đề',reason:'Ý cần điều chỉnh',offtopic:'Ý lạc đề',unclear:criterion==='fluency'?'Chưa đủ bằng chứng nhịp nói':criterion==='intonation'?'Chưa đủ bằng chứng ngữ điệu':'Chưa rõ âm',good:'Nói liền cụm ý',error:criterion==='intonation'?'Lên xuống giọng cần điều chỉnh':null,positive:criterion==='intonation'?'Kết ý rõ':null}[visual]||(legends[criterion]||[]).find(([key])=>key===visual)?.[1]||visual);
function annotate(text,events,version){
 let spans=[];
 for(const e of events){if(version===2&&e.status==='unclear'&&behavior!=='new')continue;const token=version===1?e.text:e.v2Token; if(!token)continue;const start=text.indexOf(token);if(start<0)continue;if(spans.some(s=>start<s.end&&start+token.length>s.start))continue;spans.push({start,end:start+token.length,e,token});}
 spans.sort((a,b)=>a.start-b.start);let last=0,result='';
 for(const {start,end,e,token} of spans){result+=esc(text.slice(last,start));const status=version===1?'bad':e.status;result+=`<button title="${esc(e.label)}" class="mark ${status} criterion-${criterion} visual-${visualOf(e,status)}" data-status="${status}" data-visual="${visualOf(e,status)}" data-tone="${annotationTone(visualOf(e,status),status)}" data-event="${e.id}" data-version="${version}" aria-label="${esc(e.label)} · ${version===1?'lần 1':e.status==='good'?(behavior==='new'?'điểm làm tốt':'đã sửa'):e.status==='bad'?'còn lỗi':'cần xem thêm'}">${esc(token)}${version===2?svg(status):''}</button>`;last=end;}
 return result+esc(text.slice(last));
}

 function closeDetail(){const box=main.querySelector('#detail');hideCorrection(box);main.querySelectorAll('.selected').forEach(b=>b.classList.remove('selected'));if(detailOrigin?.isConnected)detailOrigin.focus();selectedId=null;detailOrigin=null;}
 function detail(id,origin){
  const e=targets.find(e=>e.id===id);if(!e)return;selectedId=id;detailOrigin=origin;
  main.querySelectorAll('[data-event]').forEach(b=>b.classList.toggle('selected',b.dataset.event===id));
  const box=main.querySelector('#detail'),original=origin?.dataset.version==='1',status=original?'bad':e.status;
  box.innerHTML=correctionContent({...e,visual:status==='good'?'positive':status==='unclear'?'unclear':'error',label:status==='good'?'Đã sửa đúng':status==='unclear'&&['fluency','pronunciation','intonation'].includes(criterionOf(e))?'Chưa đủ bằng chứng':e.label},{status});
  showCorrection(box,origin);
 }
 function render(){
  const selected=targets.filter(e=>criterionOf(e)===criterion);
  main.innerHTML=`<section class="cycle-result" data-v2-outcome="${entry.v2.outcome}" data-behavior="${behavior}" aria-label="Kết quả V2"><h1 tabindex="-1">Kết quả lần nói 2</h1><section class="comparison-summary"><p class="overall-comment"><span class="${fresh?'bad':'good'}">${svg(fresh?'bad':'good')}</span><span>${esc(overallV2Comment(behavior,entry.v2.outcome))}</span></p></section><div class="overview"><span class="question-prompt" lang="en">${esc(q.prompt)}</span></div><section class="workspace" aria-label="${fresh?'Nhận xét câu trả lời lần 2':'Đối chiếu hai lần nói'}"><nav class="groups" aria-label="Nhóm tiêu chí">${groups.map(g=>`<button class="group" data-group="${g.id}" aria-pressed="${g.id===group}">${criterionIcon(g.id)}<span>${g.name}</span></button>`).join('')}</nav><nav class="subnav" aria-label="Tiêu chí chi tiết">${groups.find(g=>g.id===group).criteria.map(([id,label])=>`<button data-criterion="${id}" aria-pressed="${id===criterion}">${label}</button>`).join('')}</nav><div class="answer-layout">${fresh?'':`<section class="original"><div class="version-title"><strong>Lần 1</strong><span>Bản gốc · kèm gợi ý sửa</span></div><p class="speech" id="before" lang="en">${annotate(q.text,selected,1)}</p></section>`}<section class="retelling"><div class="version-title"><strong>Câu trả lời lần 2</strong></div><p class="speech" id="after" lang="en">${annotate(after,selected,2)}</p>${selected.filter(e=>e.pattern==='off-topic'&&e.status==='good'&&!e.v2Token).map(e=>`<button class="removal-result good visual-removed" data-event="${e.id}" data-status="good" data-visual="removed" data-tone="positive" data-removal="true">${svg('good')}Đã bỏ ý lạc đề · câu về điện thoại</button>`).join('')}</section></div><div class="legend"></div><section class="detail" id="detail" aria-live="polite" hidden></section></section>${!fresh&&targets.some(e=>e.status==='unclear')?`<section class="unassessed"><h2>Chưa thể đánh giá <span>Không tính là đã sửa</span></h2><div>${targets.filter(e=>e.status==='unclear').map(e=>`<button data-event="${e.id}">${svg('unclear')}${esc(e.text)} · ${esc(e.label)}</button>`).join('')}</div></section>`:''}<footer class="footer"><span></span><button class="arrow" data-action="cycle-continue" aria-label="${esc(continueLabel)}" title="${esc(continueLabel)}"><svg viewBox="0 0 24 24"><path d="m14 5 7 7-7 7M21 12H4"/></svg></button></footer></section>`;
  const result=main.querySelector('.cycle-result'),tabs=result.querySelector('.groups');
  tabs.remove();
  const sheet=document.createElement('div');sheet.className='sf-feedback-sheet';
  sheet.append(...result.childNodes);result.append(tabs,sheet);
  const visibleKeys=[...new Set([...main.querySelectorAll('[data-visual]')].map(el=>`${el.dataset.visual}:${el.dataset.tone||annotationTone(el.dataset.visual,el.dataset.status)}`))];
  main.querySelector('.legend').insertAdjacentHTML('afterbegin',visibleKeys.map(key=>{const [visual,tone]=key.split(':');return `<span class="criterion-key key-${visual}" data-legend="${visual}" data-tone="${tone}"><i></i>${esc(visual==='reason'&&tone==='positive'?'Ý liên kết tốt':visualLabel(visual))}</span>`;}).join(''));
  main.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{group=b.dataset.group;criterion=groups.find(g=>g.id===group).criteria[0][0];renderWorkspace(`[data-group="${group}"]`);});
  main.querySelectorAll('[data-criterion]').forEach(b=>b.onclick=()=>{criterion=b.dataset.criterion;renderWorkspace(`[data-criterion="${criterion}"]`);});
  main.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>detail(b.dataset.event,b));
  main.querySelector('[data-action="cycle-continue"]').onclick=onContinue;
 }
 // Replace only the owned result so the controller's progress and simulation controls remain mounted.
 function renderWorkspace(focusSelector){const top=main.querySelector('.cycle-top'),warning=main.querySelector('.cycle-storage-warning');selectedId=null;detailOrigin=null;render();if(top)main.prepend(top);if(warning)main.prepend(warning);main.querySelector(focusSelector)?.focus({preventScroll:true});}
 const keydown=e=>{if(e.key==='Escape'&&selectedId)closeDetail();};main.addEventListener('keydown',keydown);render();return ()=>main.removeEventListener('keydown',keydown);
}
