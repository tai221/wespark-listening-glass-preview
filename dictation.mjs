import {read,write,dictationReward} from './session.mjs';
import {DICTATION_UNITS as UNITS} from './dictation-lesson.mjs';
import {MODES,modeLabels,kindLabels,restoreDictation,createDictation,draft,parts,expected,matches,setInput,hasInput,check,compare,totals,assessLive,liveStatus,liveTokens} from './dictation-state.mjs';
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
let state=restoreDictation(read().dictation),view='practice',reviewOpen=false,filter='all',reviewPlaying=null,playRequest=0;
const reviewId=new URLSearchParams(location.search).get('review');
if(reviewId){const index=UNITS.findIndex(u=>u.id===reviewId);if(index>=0){state.index=index;if(state.done[reviewId])state.mode=state.done[reviewId].mode;}}
if(!read().dictationRun?.id)write({dictationRun:{id:`dictation-${Date.now()}-${Math.random().toString(36).slice(2)}`,earnedIds:UNITS.filter(u=>state.done[u.id]&&state.done[u.id].kind!=='assisted'&&(read().dictationRewards||[]).includes(u.id)).map(u=>u.id),celebrated:false}});
function openResults(){audio.pause();persist();location.href='dictation-complete.html';}
const audio=$('#unit-audio');
const paths={play:'m9 5 11 7-11 7V5Z',pause:'M8 5v14m8-14v14',check:'M8 12l3 3 5-6',cross:'m9 9 6 6m0-6-6 6',bulb:'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z',headphones:'M4 14v-3a8 8 0 0 1 16 0v3M3 12h4v8H3Zm14 0h4v8h-4Z',arrow:'m9 6 6 6-6 6'};
function icon(kind){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');if(['check','cross'].includes(kind)){const c=document.createElementNS(svg.namespaceURI,'circle');for(const [k,v] of Object.entries({cx:12,cy:12,r:9}))c.setAttribute(k,v);svg.append(c);}const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[kind]||paths.bulb);svg.append(path);return svg;}
function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=String(text);return n;}
const unit=()=>UNITS[state.index];
const mask=text=>text.replace(/[\p{L}\p{N}]/gu,'*');
function persist(){state.currentId=unit().id;const old=read().post,complete=Array.isArray(old.complete)?old.complete:[];const finished=totals(state).done===UNITS.length;const next=finished?[...new Set([...complete,'dictation'])]:complete.filter(x=>x!=='dictation');write({dictation:state,...(next.join('|')!==complete.join('|')?{post:{...old,complete:next}}:{})});}
function source(){playRequest++;reviewPlaying=null;audio.pause();audio.src=unit().audio;audio.load();audio.playbackRate=state.speed;audio.loop=state.loop;audio.setAttribute('aria-label',`Nghe câu ${state.index+1}`);clearAudioError();updatePlayback();}
function clearAudioError(){for(const id of ['#audio-status']){$(id).hidden=true;$(id).textContent='';}}
function audioError(){const target=$('#audio-status');target.hidden=false;target.textContent='Chưa phát được câu này. Bấm nghe lại để thử; nội dung bạn nhập vẫn được giữ.';updatePlayback();}
function updatePlayback(){const playing=!audio.paused&&!audio.ended;$('#play-unit').replaceChildren(icon(playing&&reviewPlaying===null?'pause':'play'));$('#play-unit').setAttribute('aria-label',playing&&reviewPlaying===null?'Tạm dừng câu đang nghe':'Phát câu đang luyện');$('#play-unit').dataset.action=playing&&reviewPlaying===null?'Tạm dừng':'Phát';all('[data-review-play]').forEach(b=>{const on=playing&&reviewPlaying===Number(b.dataset.reviewPlay);b.replaceChildren(icon(on?'pause':'play'));b.setAttribute('aria-label',`${on?'Dừng':'Nghe lại'} câu ${Number(b.dataset.reviewPlay)+1}`);b.setAttribute('aria-pressed',String(on));});}
async function play(restart=false){const request=++playRequest;try{if(reviewPlaying!==null){reviewPlaying=null;audio.pause();audio.src=unit().audio;audio.load();}audio.playbackRate=state.speed;audio.loop=state.loop;if(audio.error)audio.load();if(restart)audio.currentTime=0;if(audio.paused||restart)await audio.play();else audio.pause();if(request!==playRequest)return;clearAudioError();updatePlayback();}catch{if(request===playRequest)audioError();}}
async function playReview(index){const request=++playRequest;try{if(reviewPlaying===index&&!audio.paused){audio.pause();reviewPlaying=null;updatePlayback();return;}audio.pause();reviewPlaying=index;audio.src=UNITS[index].audio;audio.load();audio.loop=false;audio.playbackRate=state.speed;await audio.play();if(request!==playRequest)return;clearAudioError();updatePlayback();}catch{if(request===playRequest)audioError();}}
function updateNextControl(){const label=totals(state).done===UNITS.length?'Xem kết quả':state.index===UNITS.length-1?'Về câu chưa hoàn tất':'Câu tiếp';$('#next-unit').setAttribute('aria-label',label);const ready=draft(state).correct||draft(state).compared;$('#next-unit').title=label+(ready?' · Enter / Ctrl / Command + →':' · Ctrl / Command + →');$('#next-unit').dataset.action=label;$('#next-unit').dataset.shortcut=ready?'Enter':'Ctrl/⌘ →';$('#next-unit').dataset.ready=String(ready);$('#reveal-all').hidden=ready;$('#reveal-all').disabled=ready;}
function render(){
 const d=draft(state),count=totals(state),complete=count.done===UNITS.length;
 document.body.dataset.dictationMode=state.mode;$('#dictation-workspace').hidden=view==='result'&&complete;$('#dictation-bottom-nav').hidden=view==='result'&&complete;
 $('#unit-count').textContent=`Câu ${String(state.index+1).padStart(2,'0')} / ${UNITS.length}`;$('#unit-progress').textContent=`Đã luyện ${count.done} / ${UNITS.length}`;$('#source-unit-caption').textContent=`Câu ${String(state.index+1).padStart(2,'0')}`;
 $('#unit-heading').textContent=state.mode==='sentence'?'Nghe và chép lại cả câu':state.mode==='phrase'?'Nghe và điền cụm còn thiếu':'Nghe và điền từ còn thiếu';
 all('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
 $('#dictation-live-editor').hidden=state.mode!=='sentence';$('#dictation-input').hidden=state.mode!=='sentence';$('#answer-label').hidden=state.mode!=='sentence';$('#sentence-context').hidden=state.mode==='sentence';$('#dictation-input').value=state.mode==='sentence'?d.values[0]||'':'';$('#dictation-input').placeholder=mask(unit().text);
 $('#dictation-input').className=d.checked?(d.correct?'correct':'needs-work'):'';$('#dictation-input').setAttribute('aria-invalid',String(d.checked&&!d.correct));
 $('#input-help span').textContent=state.mode==='word'?'Space chuyển ô · Enter tiếp khi đã đúng':'Enter tiếp khi đã đúng';
 renderCloze();paintLive();renderFeedback();renderAnswer();renderList();
 $('#previous-unit').disabled=state.index===0;updateNextControl();
 $('#unit-list').hidden=false;$('#back-to-results').hidden=!complete;

 $('#reveal-all').disabled=d.correct||d.compared;
 persist();
}
function renderCloze(){
 const d=draft(state),context=$('#sentence-context');context.replaceChildren();if(state.mode==='sentence')return;
 for(const part of parts(unit(),state.mode)){
  if(part.text!==undefined){context.append(document.createTextNode(part.text));continue;}
  const wrap=el('span','dictation-gap'),input=document.createElement('input');input.type='text';input.dataset.dictationGap=part.gap;input.value=d.values[part.gap]||'';input.autocomplete='off';input.maxLength=state.mode==='word'?80:180;input.spellcheck=false;input.lang='en';input.placeholder=mask(part.expected);input.style.width=`${Math.max(76,part.expected.length*12+28)}px`;
  input.setAttribute('aria-label',`${state.mode==='word'?'Từ':'Cụm'} còn thiếu ${part.gap+1}`);input.setAttribute('aria-describedby','input-help dictation-feedback');
  const correct=matches(input.value,part.expected);input.setAttribute('aria-invalid',String(d.checked&&!correct));if(d.checked)wrap.classList.add(correct?'gap-correct':'gap-wrong');
  const status=el('span','gap-status');if(d.checked&&!correct){status.append(icon('cross'));status.setAttribute('role','img');status.setAttribute('aria-label','Cần sửa');}
  const help=el('button','gap-help');help.type='button';help.dataset.gapHelp=part.gap;help.append(icon('bulb'));help.setAttribute('aria-label',`Hiện ${state.mode==='phrase'?'cụm từ':'từ'} chỗ trống ${part.gap+1}`);help.title=help.getAttribute('aria-label');help.disabled=d.shown.includes(part.gap)||d.correct;
  help.addEventListener('click',()=>{revealAnswers(part.gap);const next=all('[data-dictation-gap]').find(n=>!matches(n.value,expected(unit(),state.mode)[Number(n.dataset.dictationGap)]));(next||$(`[data-dictation-gap="${part.gap}"]`))?.focus();});
  input.addEventListener('input',readInputs);input.addEventListener('compositionend',readInputs);const mirror=el('span','gap-highlight');mirror.setAttribute('aria-hidden','true');input.addEventListener('scroll',()=>mirror.scrollLeft=input.scrollLeft);wrap.append(input,mirror,status,help);
  context.append(wrap);
 }
}
function paintLive(){
 const d=draft(state),answers=expected(unit(),state.mode);
 all('[data-dictation-gap]').forEach((input,i)=>{const status=state.mode==='word'?liveStatus(input.value,answers[i]):!input.value.trim()?'empty':liveTokens(input.value,answers[i]).some(x=>x.status==='wrong')?'wrong':'right';const correct=matches(input.value,answers[i]);const mirror=input.closest('.dictation-gap').querySelector('.gap-highlight');mirror.replaceChildren();for(const token of liveTokens(input.value,answers[i]))mirror.append(el('span',`live-${token.status}`,token.text));mirror.scrollLeft=input.scrollLeft;input.dataset.liveStatus=status;input.setAttribute('aria-invalid',String(status==='wrong'));const wrap=input.closest('.dictation-gap');wrap.classList.toggle('gap-correct',correct);wrap.classList.toggle('gap-wrong',status==='wrong');const mark=wrap.querySelector('.gap-status');mark.replaceChildren();mark.removeAttribute('role');mark.removeAttribute('aria-label');if(status==='wrong'){mark.append(icon('cross'));mark.setAttribute('role','img');mark.setAttribute('aria-label','Cần sửa');}});
 const highlight=$('#dictation-input-highlight');highlight.replaceChildren();for(const token of liveTokens(d.values[0]||'',unit().text)){const span=el('span',`live-${token.status}`,token.text);highlight.append(span);}if((d.values[0]||'').endsWith('\n'))highlight.append(document.createTextNode(' '));
 $('#dictation-input').setAttribute('aria-invalid',String(state.mode==='sentence'&&liveTokens(d.values[0]||'',unit().text).some(x=>x.status==='wrong')));syncHighlight();
}
function syncHighlight(){const input=$('#dictation-input'),mirror=$('#dictation-input-highlight');mirror.scrollTop=input.scrollTop;mirror.scrollLeft=input.scrollLeft;}
function readInputs(event){
 const values=state.mode==='sentence'?[$('#dictation-input').value]:all('[data-dictation-gap]').sort((a,b)=>Number(a.dataset.dictationGap)-Number(b.dataset.dictationGap)).map(n=>n.value);setInput(state,values);
 if(event?.isComposing){persist();return;}
 const before=totals(state).done,wasDone=!!state.done[unit().id],d=assessLive(state);if(!wasDone&&d.correct&&!d.helped)awardDictationPoint();paintLive();renderFeedback();renderAnswer();renderList();
 updateNextControl();const count=totals(state);$('#unit-progress').textContent=`Đã luyện ${count.done} / ${UNITS.length}`;
 $('#dictation-input').className=d.correct?'correct':'';$('#back-to-results').hidden=count.done!==UNITS.length;persist();
 // Keep the caret in place, including after the last correct sentence.
 if(before<UNITS.length&&count.done===UNITS.length){updateNextControl();$('#navigation-notice').hidden=false;$('#navigation-notice').textContent=`Đã hoàn thành ${UNITS.length} / ${UNITS.length} câu.`;}
}
function renderFeedback(){
 const d=draft(state),root=$('#dictation-feedback');root.replaceChildren();if(!d.correct&&!d.compared)return;
 const box=el('div','dictation-feedback-box is-correct');const title=d.compared?'Đã đối chiếu':d.helped?'Hoàn tất · Có hỗ trợ':d.hadError||d.attempts>1?'Bạn đã tự sửa đúng!':'Đúng ngay lần đầu!';box.append(icon('check'),el('strong','',title));root.append(box);
}
function renderAnswer(){const d=draft(state),complete=d.correct||d.compared;$('#dictation-answer').hidden=!complete;$('#revealed').hidden=true;$('#revealed').textContent='';const translationLabel=el('strong','dictation-translation-label','Bản dịch: ');$('#dictation-translation').replaceChildren(translationLabel,document.createTextNode(unit().translation));$('#dictation-translation').hidden=!complete;}
function renderList(){
 const list=$('#unit-buttons'),scroll=list.scrollTop;
 const count=totals(state);$('#list-count').textContent=`${count.done} / ${UNITS.length}`;$('#course-progress').value=count.done;$('#course-progress').setAttribute('aria-valuetext',`Đã luyện ${count.done} trong ${UNITS.length} câu`);$('#unit-filter').value=filter;$('#unit-buttons').replaceChildren();
 UNITS.forEach((u,i)=>{const result=state.done[u.id];if(filter==='pending'&&result||filter==='assisted'&&result?.kind!=='assisted')return;const li=el('li'),button=el('button');button.type='button';button.dataset.unitIndex=i;button.classList.toggle('unit-complete',!!result);button.title=result?u.text:`Câu ${i+1} chưa hoàn tất`;button.setAttribute('aria-label',`Câu ${i+1} · ${result?kindLabels[result.kind]:'Chưa hoàn tất'}`);if(i===state.index)button.setAttribute('aria-current','step');const number=el('span','unit-number',String(i+1).padStart(2,'0')),copy=el('span','unit-list-copy');const preview=el('strong',result?'':'unit-preview-blurred',u.text);if(!result)preview.setAttribute('aria-hidden','true');copy.append(preview);if(result&&result.kind!=='assisted')copy.append(el('span','unit-status-copy',kindLabels[result.kind]));const mark=el('span','unit-mark');if(result?.kind==='assisted'){const help=el('span','unit-help-mark');help.append(icon('bulb'));help.setAttribute('role','img');help.setAttribute('aria-label','Có hỗ trợ');help.title='Có hỗ trợ';button.append(number,copy,help);}else button.append(number,copy);mark.append(icon(result?'check':'headphones'));button.append(mark);button.addEventListener('click',()=>go(i));li.append(button);$('#unit-buttons').append(li);});$('#unit-list-empty').hidden=list.children.length>0;list.scrollTop=scroll;
}
function go(index){if(index<0||index>=UNITS.length)return;state.index=index;view='practice';$('#navigation-notice').hidden=true;source();render();focusAnswer();scrollCurrentUnit();}
$('#dictation-input').addEventListener('input',readInputs);$('#dictation-input').addEventListener('compositionend',readInputs);$('#dictation-input').addEventListener('scroll',syncHighlight);
all('[data-mode]').forEach(button=>button.addEventListener('click',()=>{if(state.mode===button.dataset.mode)return;state.mode=button.dataset.mode;$('#navigation-notice').hidden=true;render();(state.mode==='sentence'?$('#dictation-input'):$('[data-dictation-gap]')).focus();}));
$('#previous-unit').addEventListener('click',()=>go(state.index-1));
$('#next-unit').addEventListener('click',()=>{if(totals(state).done===UNITS.length){openResults();return;}if(state.index<UNITS.length-1){const skipped=!state.done[unit().id];go(state.index+1);if(skipped){$('#navigation-notice').hidden=false;$('#navigation-notice').textContent='Câu trước chưa hoàn tất.';}}else{const missing=UNITS.findIndex(u=>!state.done[u.id]);if(missing>=0){go(missing);$('#navigation-notice').hidden=false;$('#navigation-notice').textContent='Câu chưa hoàn tất.';}else{openResults();}}});
function revealAnswers(gap=null){
 const d=draft(state),answers=expected(unit(),state.mode);d.helped=true;
 const values=answers.map((answer,i)=>gap===null||i===gap?answer:d.values[i]||'');
 if(gap===null){d.full=true;d.shown=answers.map((_,i)=>i);if(state.mode==='sentence')d.revealed=unit().text.split(/\s+/).length;}
 else if(!d.shown.includes(gap))d.shown.push(gap);
 setInput(state,values);assessLive(state);render();
}
$('#reveal-all').addEventListener('click',()=>{revealAnswers();focusAnswer();});
$('#unit-filter').addEventListener('change',e=>{filter=e.target.value;renderList();});
$('#play-unit').addEventListener('click',()=>play());$('#replay-unit').addEventListener('click',()=>play(true));
$('#speed').value=String(state.speed);$('#loop').checked=state.loop;$('#speed').addEventListener('change',e=>{state.speed=Number(e.target.value);audio.playbackRate=state.speed;persist();});$('#loop').addEventListener('change',e=>{state.loop=e.target.checked;audio.loop=reviewPlaying===null&&state.loop;persist();});
for(const event of ['play','pause','ended'])audio.addEventListener(event,updatePlayback);audio.addEventListener('error',audioError);audio.addEventListener('canplay',clearAudioError);window.addEventListener('pagehide',()=>{playRequest++;audio.pause();});
function focusAnswer(){const inputs=all('[data-dictation-gap]'),answers=expected(unit(),state.mode);(state.mode==='sentence'?$('#dictation-input'):inputs.find(n=>!matches(n.value,answers[Number(n.dataset.dictationGap)]))||inputs[0])?.focus();}
function scrollCurrentUnit(){const list=$('#unit-buttons'),active=list.querySelector('[aria-current]');if(!active)return;const visible=Math.min(list.clientHeight,Math.max(80,window.innerHeight-list.getBoundingClientRect().top-24)),top=active.offsetTop,bottom=top+active.offsetHeight;if(top<list.scrollTop)list.scrollTop=top;else if(bottom>list.scrollTop+visible)list.scrollTop=bottom-visible;}
function shortcutNavigate(previous=false){const button=$(previous?'#previous-unit':'#next-unit');if(button.disabled)return;button.click();if(view==='practice')focusAnswer();}
const shortcutLabels=[
 ['#previous-unit','Câu trước','Ctrl/⌘ ←','Control+ArrowLeft Meta+ArrowLeft'],['#replay-unit','Nghe lại','`','`'],['#play-unit','Phát','Tab','Tab'],['#next-unit','Câu tiếp','Ctrl/⌘ →','Control+ArrowRight Meta+ArrowRight']
];
for(const [selector,label,badge,keys] of shortcutLabels){const target=$(selector);target.setAttribute('aria-keyshortcuts',keys);target.title=`${label} · ${badge}`;target.dataset.action=label;target.dataset.shortcut=badge;}
document.addEventListener('keydown',e=>{
 if(e.defaultPrevented||e.isComposing||e.repeat||$('dialog[open]')||view!=='practice')return;
 const field=e.target,editing=field.matches?.('[data-dictation-gap],#dictation-input');
 if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();shortcutNavigate(e.key==='ArrowLeft');return;}
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if((e.code==='Backquote'||e.key==='`')&&!e.shiftKey){e.preventDefault();play(true);return;}
 if(e.key==='Tab'&&!e.shiftKey&&editing){e.preventDefault();play();return;}
 if(e.key==='Escape'){
  if(editing){e.preventDefault();$('#play-unit').focus();}return;
 }
 if(e.key==='Enter'&&!e.shiftKey&&editing&&(draft(state).correct||draft(state).compared)){e.preventDefault();shortcutNavigate();return;}
 if(field.matches?.('[data-dictation-gap]')&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();const fields=all('[data-dictation-gap]'),index=fields.indexOf(field);if(fields[index+1])fields[index+1].focus();}
 if(field.matches?.('[data-dictation-gap]')&&state.mode==='word'){const fields=all('[data-dictation-gap]'),index=fields.indexOf(field);if(e.key===' '&&field.value.trim()&&fields[index+1]){e.preventDefault();fields[index+1].focus();}if(e.key==='Backspace'&&!field.value&&fields[index-1]){e.preventDefault();fields[index-1].focus();}}
});
$('#back-to-results').addEventListener('click',openResults);
source();render();syncDictationPoints();if(totals(state).done===UNITS.length&&!reviewId)location.replace('dictation-complete.html');

function syncDictationPoints(){const n=dictationReward(),counter=$('#dictation-point-counter');counter.querySelector('strong').textContent=`+${n}`;counter.setAttribute('aria-label',`${n} SparkPoint từ nghe chép`);}
let pointAnimations=[];
function stopPointMotion(){pointAnimations.forEach(a=>a.cancel());pointAnimations=[];all('.dictation-point-flight').forEach(n=>n.remove());}
function awardDictationPoint(){
 const ids=Array.isArray(read().dictationRewards)?read().dictationRewards:[];if(ids.includes(unit().id))return;
 const run=read().dictationRun;write({dictationRewards:[...ids,unit().id],dictationRun:{...run,earnedIds:[...new Set([...(run?.earnedIds||[]),unit().id])]}});syncDictationPoints();
 const motion=()=>document.body.dataset.glassMotion==='true'&&!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!motion())return;
 const from=(document.activeElement?.matches?.('[data-dictation-gap],#dictation-input')?document.activeElement:$('#sentence-context')).getBoundingClientRect(),to=$('#dictation-point-counter').getBoundingClientRect();
 if(from.bottom<0||from.top>window.innerHeight)return;
 const flight=el('span','dictation-point-flight');flight.setAttribute('aria-hidden','true');flight.innerHTML=$('#dictation-point-counter svg').outerHTML+'<b>+1</b>';flight.style.left=`${from.x+from.width/2}px`;flight.style.top=`${from.y}px`;document.body.append(flight);
 if(!flight.animate){flight.remove();return;}
 const animation=flight.animate([{transform:'translate(-50%,0) scale(.8)',opacity:0},{transform:'translate(-50%,-28px) scale(1.1)',opacity:1,offset:.25},{transform:`translate(${to.x+to.width/2-from.x-from.width/2}px,${to.y+to.height/2-from.y}px) scale(.6)`,opacity:0}],{duration:850,easing:'cubic-bezier(.22,.7,.3,1)'});pointAnimations.push(animation);animation.onfinish=()=>{flight.remove();pointAnimations=pointAnimations.filter(a=>a!==animation);};
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPointMotion();});window.addEventListener('pagehide',stopPointMotion);window.addEventListener('glass-motion-change',e=>{if(!e.detail.enabled)stopPointMotion();});window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)stopPointMotion();});
