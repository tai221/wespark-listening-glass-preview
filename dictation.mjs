import {read,write} from './session.mjs';
import {UNITS,target,answerMatches,normalize,dictationResult} from './practice-state.mjs';
const $=s=>document.querySelector(s);
const emptyDraft=(mode='word')=>({mode,input:'',attempts:0,helped:false,revealed:0,full:false,checked:false,correct:false,compared:false});
let state={index:0,mode:'word',speed:1,loop:false,drafts:UNITS.map(()=>emptyDraft()),done:{},history:[],...read().dictation};
if(!state.drafts?.length)state.drafts=UNITS.map(()=>emptyDraft());
const audio=$('#unit-audio');let reviewingWorkspace=false;
function persist(){write({dictation:state});}
function completeUnit(kind){const i=state.index;const result={kind,mode:state.mode,attempts:state.drafts[i].attempts};if(!state.done[i])state.done[i]=result;if(!state.drafts[i].recorded){state.history.push({unit:i,...result});state.drafts[i].recorded=true;}persist();}
function current(){return state.drafts[state.index];}
function source(){audio.pause();audio.src=`practice-0${state.index+1}.wav`;audio.playbackRate=state.speed;audio.loop=state.loop;$('#play-unit').textContent='▶ Phát đoạn';$('#audio-status').textContent='';}
function render(){
 const unit=UNITS[state.index];if(current().mode!==state.mode)state.drafts[state.index]=emptyDraft(state.mode);const d=current(),expected=target(unit,state.mode),done=Object.keys(state.done).length;
 $('#unit-count').textContent=`Đoạn ${state.index+1} / ${UNITS.length}`;$('#unit-progress').textContent=`Đã luyện ${done} / ${UNITS.length}`;
 $('#unit-heading').textContent=state.mode==='sentence'?'Nghe và chép lại cả câu':state.mode==='phrase'?'Nghe và điền cụm còn thiếu':'Nghe và điền từ còn thiếu';
 $('#answer-label').textContent=state.mode==='sentence'?'Câu bạn nghe được':state.mode==='phrase'?'Cụm từ bạn nghe được':'Từ bạn nghe được';
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===state.mode));
 $('#sentence-context').replaceChildren();
 if(state.mode==='sentence')$('#sentence-context').textContent='Nghe đoạn trước khi bắt đầu chép.';
 else{const chunks=unit.text.split(expected);$('#sentence-context').append(document.createTextNode(chunks[0]));const blank=document.createElement('span');blank.className='blank';blank.textContent=state.mode==='word'?'······':'······ ······';$('#sentence-context').append(blank,document.createTextNode(chunks[1]||''));}
 $('#dictation-input').value=d.input;$('#dictation-input').className=d.checked?(d.correct?'correct':'needs-work'):'';
 $('#check').disabled=!d.input.trim();$('#dictation-feedback').replaceChildren();
 if(d.checked){const box=document.createElement('p');box.className='inline-feedback'+(d.correct?' correct':'');box.textContent=d.correct?(d.helped?'✓ Đã đối chiếu đúng · có dùng hỗ trợ.':d.attempts===1?'✓ Đúng ngay lần đầu.':'✓ Bạn đã tự sửa đúng.'):'Chưa khớp. '+mismatchHint(d.input,expected);$('#dictation-feedback').append(box);}
 const words=expected.split(' ');$('#revealed').textContent=d.full?expected:words.slice(0,d.revealed).join(' ');$('#revealed').hidden=!d.full&&!d.revealed;
 $('#compare').hidden=!(d.full&&d.attempts>0&&!d.correct&&!d.compared);
 $('#reveal-word').disabled=d.revealed>=words.length;$('#next-unit').textContent=state.index===2?'Xem tiến độ →':'Đoạn tiếp →';
 $('#unit-buttons').replaceChildren();
 UNITS.forEach((u,i)=>{const li=document.createElement('li'),b=document.createElement('button'),title=document.createElement('strong'),mask=document.createElement('span');b.type='button';if(i===state.index)b.setAttribute('aria-current','step');title.textContent=`Đoạn 0${i+1}`;mask.textContent=u.text.split(' ').map(w=>'•'.repeat(Math.min(5,w.length))).join(' ');b.append(title,mask);if(state.done[i]){const result=document.createElement('span');result.className='unit-result';result.textContent=state.done[i].kind+' · '+({word:'Điền từ',phrase:'Điền cụm',sentence:'Chép câu'}[state.done[i].mode]);b.append(result);}b.addEventListener('click',()=>go(i));li.append(b);$('#unit-buttons').append(li);});
 const all=done===3;$('#dictation-completion').hidden=!all;$('.dictation-grid').hidden=all&&!reviewingWorkspace;$('#toggle-list').hidden=all&&!reviewingWorkspace;$('#dictation-review-workspace').setAttribute('aria-expanded',reviewingWorkspace);$('#dictation-review-workspace').textContent=reviewingWorkspace?'Thu gọn phần đã luyện':'Xem lại phần đã luyện';
 if(all){const assisted=Object.values(state.done).filter(r=>r.kind==='Có hỗ trợ').length;$('#dictation-summary').textContent=`${3-assisted} đoạn tự làm · ${assisted} đoạn có hỗ trợ. Đã luyện 3 / 3 đoạn.`;markPost();}
 persist();
}
function mismatchHint(input,expected){const a=normalize(input).split(' '),b=normalize(expected).split(' ');let i=0;while(a[i]&&a[i]===b[i])i++;return a.length<b.length?`Thiếu hoặc khác lời ở vị trí ${i+1}. Nghe lại rồi sửa; nội dung nhập vẫn được giữ.`:a.length>b.length?`Có từ thừa hoặc khác lời từ vị trí ${i+1}. Nghe lại rồi sửa.`:`Kiểm tra từ ở vị trí ${i+1}, có thể khác chính tả hoặc dạng từ.`;}
function markPost(){const post=read().post;if(!post.complete.includes('dictation'))write({post:{...post,complete:[...post.complete,'dictation']}});}
function go(i){state.index=i;source();render();$('#unit-heading').focus();}
$('#dictation-input').addEventListener('input',e=>{const d=current();d.input=e.target.value;d.checked=false;d.correct=false;d.compared=false;$('#check').disabled=!d.input.trim();$('#dictation-input').className='';$('#dictation-feedback').replaceChildren();persist();});
$('#check').addEventListener('click',()=>{const d=current();if(!d.input.trim())return;d.attempts++;d.checked=true;d.correct=answerMatches(d.input,target(UNITS[state.index],state.mode));if(dictationResult({input:d.input,expected:target(UNITS[state.index],state.mode),...d}))completeUnit(d.helped?'Có hỗ trợ':d.attempts===1?'Đúng lần đầu':'Tự sửa đúng');render();});
$('#reveal-word').addEventListener('click',()=>{const d=current();d.helped=true;d.revealed++;if(d.revealed>=target(UNITS[state.index],state.mode).split(' ').length)d.full=true;render();});
$('#reveal-all').addEventListener('click',()=>{current().helped=true;current().full=true;render();});
$('#compare').addEventListener('click',()=>{const d=current();if(d.attempts<1||!d.input.trim()||!d.full)return;d.compared=true;completeUnit('Có hỗ trợ');render();$('#dictation-feedback').textContent='✓ Đã đối chiếu đáp án · hoàn tất có hỗ trợ.';});
$('#next-unit').addEventListener('click',()=>{if(state.index<2)go(state.index+1);else{const missing=UNITS.findIndex((_,i)=>!state.done[i]);if(missing>=0){go(missing);$('#dictation-feedback').textContent='Đoạn này chưa được tính đã luyện. Hãy thử nhập và kiểm tra, rồi tự sửa hoặc đối chiếu đáp án.';}else $('#dictation-completion').scrollIntoView({block:'nearest'});}});
let pendingMode=null;
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mode===state.mode)return;pendingMode=b.dataset.mode;if(current().input.trim()||current().checked){$('#mode-dialog').returnValue='';$('#mode-dialog').showModal();}else changeMode();}));
function changeMode(){state.mode=pendingMode;state.drafts[state.index]=emptyDraft(state.mode);pendingMode=null;render();$('#dictation-input').focus();}
$('#mode-dialog').addEventListener('close',()=>{if($('#mode-dialog').returnValue==='confirm')changeMode();else pendingMode=null;});
$('#toggle-list').addEventListener('click',()=>{const hide=!$('#unit-list').hidden;$('#unit-list').hidden=hide;$('.dictation-grid').classList.toggle('list-hidden',hide);$('#toggle-list').setAttribute('aria-expanded',!hide);$('#toggle-list').textContent=hide?'Hiện danh sách':'Ẩn danh sách';});
async function play(restart=false){try{if(restart)audio.currentTime=0;if(audio.paused||restart){await audio.play();$('#play-unit').textContent='Ⅱ Tạm dừng';}else{audio.pause();$('#play-unit').textContent='▶ Phát đoạn';}$('#audio-status').textContent='';}catch{$('#audio-status').textContent='Chưa phát được âm thanh. Thử nghe lại.';}}
$('#play-unit').addEventListener('click',()=>play());$('#replay-unit').addEventListener('click',()=>play(true));audio.addEventListener('ended',()=>$('#play-unit').textContent='▶ Phát đoạn');
$('#speed').value=state.speed;$('#loop').checked=state.loop;
$('#speed').addEventListener('change',e=>{state.speed=Number(e.target.value);audio.playbackRate=state.speed;persist();});$('#loop').addEventListener('change',e=>{state.loop=e.target.checked;audio.loop=state.loop;persist();});
source();render();

$('#dictation-review-workspace').addEventListener('click',()=>{reviewingWorkspace=!reviewingWorkspace;render();if(reviewingWorkspace)$('#unit-heading').focus();});
