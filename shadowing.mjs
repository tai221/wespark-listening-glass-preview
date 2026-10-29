import {read,write} from './session.mjs';
import {UNITS,shadowComplete} from './practice-state.mjs';
const $=s=>document.querySelector(s);
let state={scope:[0,1,2],index:0,done:[],mode:'repeat',phase:'ready',scopeLocked:false,speed:1,loop:false,...read().shadowing};
if(state.phase==='recording'||state.phase==='processing')state.phase='ready';
const audio=$('#unit-audio');let reviewingWorkspace=false;let lookupWord=null;
const meanings={i:'tôi',wanted:'đã muốn',to:'đánh dấu động từ nguyên mẫu',throw:'vứt; ném',away:'đi; ra xa',less:'ít hơn',but:'nhưng',did:'trợ động từ quá khứ',not:'không',know:'biết',where:'ở đâu',begin:'bắt đầu'};
const ipa=['/ˈevri ˈiːvnɪŋ aʊə ˈkɪtʃɪn bɪn juːst tə bi fʊl/','/aɪ ˈwɒntɪd tə θrəʊ əˈweɪ les bət aɪ dɪd nɒt nəʊ weə tə bɪˈɡɪn/','/naʊ aɪ ˈkæri ə ˌriːˈjuːzəbl bæɡ wenˈevə aɪ ɡəʊ ˈʃɒpɪŋ/'];
function save(){write({shadowing:state});}
function source(){audio.pause();audio.src=`practice-0${state.index+1}.wav`;audio.playbackRate=state.speed;audio.loop=state.loop;$('#play-unit').textContent='▶ Nghe mẫu';$('#audio-status').textContent='';}
function render(){
 const unit=UNITS[state.index],selectedDone=state.scope.filter(i=>state.done.includes(i)).length;
 $('#shadow-unit').textContent=`Đoạn 0${state.index+1}`;$('#shadow-progress').textContent=`Đã luyện ${selectedDone} / ${state.scope.length}`;$('#scope-label').textContent=`Phạm vi · ${state.scope.length} đoạn`;
 renderWords(unit.text);$('#shadow-speed').value=state.speed;$('#shadow-loop').checked=state.loop;$('#shadow-translation').textContent=unit.translation;$('#shadow-ipa').textContent=ipa[state.index];
 $('#shadow-text').hidden=$('#hide-source').checked;$('#shadow-translation').hidden=!$('#show-translation').checked;$('#shadow-ipa').hidden=!$('#show-ipa').checked;
 document.querySelectorAll('[data-shadow-mode]').forEach(b=>{b.setAttribute('aria-pressed',state.mode===b.dataset.shadowMode);b.disabled=state.phase==='recording'||state.phase==='processing';});
 $('#shadow-instruction').textContent=state.mode==='repeat'?'Nghe xong đoạn mẫu, rồi ghi âm phần bạn nhắc lại.':'Nói theo trong lúc audio mẫu đang phát.';
 const phases={ready:['Sẵn sàng luyện','Nghe mẫu rồi bắt đầu khi bạn sẵn sàng.'],recording:['Đang ghi âm…','Nói trọn đoạn theo cách luyện đang chọn, rồi bấm Dừng.'],processing:['Đang xử lý lượt luyện…','Đoạn này chưa được ghi nhận hoàn tất.'],feedback:['Đã có phản hồi','Xem một điểm cần luyện thêm, rồi tiếp tục.'],'mic-error':['Chưa truy cập được micro','Kiểm tra quyền micro rồi thử lại. Lượt này chưa được ghi nhận.'],'processing-error':['Chưa xử lý được lượt luyện','Tiến độ cũ được giữ nguyên. Lỗi xử lý không quy thành điểm thấp.'],silence:['Chưa có lời nói để đánh giá','Lượt này chưa được tính đã luyện. Có thể thử lại.']};
 const [title,help]=phases[state.phase]||phases.ready;$('#shadow-state').textContent=title;$('#shadow-state-help').textContent=help;
 $('#voice-workspace').classList.toggle('recording',state.phase==='recording');
 $('#shadow-record').hidden=!['ready','feedback'].includes(state.phase);$('#shadow-stop').hidden=state.phase!=='recording';$('#shadow-retry').hidden=!['mic-error','processing-error','silence'].includes(state.phase);
 $('#shadow-feedback').hidden=state.phase!=='feedback';
 const notes=[['Giữ nhịp cụm “used to be”','Bản thu có nhịp dừng giữa “used” và “to”. Thử nói liền cụm rồi ghép lại cả câu.','our kitchen bin | used to be full'],['Giữ nhịp liền hơn ở “wanted to”','Bản thu có một nhịp dừng giữa “wanted” và “to”. Nghe mẫu rồi nói liền cụm trước khi ghép cả đoạn.','I wanted to | throw away less'],['Nối cụm “a reusable bag”','Ví dụ bản thu giả định ngắt nhỏ trong cụm danh từ. Thử nói cả cụm theo một nhịp trước khi nối phần còn lại.','I carry | a reusable bag']];
 $('#shadow-feedback-title').textContent=notes[state.index][0];$('#shadow-feedback-copy').textContent=notes[state.index][1];$('#shadow-evidence').textContent=notes[state.index][2];
 $('#shadow-prev').disabled=state.scope.indexOf(state.index)<=0;$('#shadow-next').disabled=state.scope.indexOf(state.index)>=state.scope.length-1;
 const busy=state.phase==='recording'||state.phase==='processing';$('#shadow-prev').disabled||=busy;$('#shadow-next').disabled||=busy;
 const policy=read().policies?.shadowScope||'pending';$('#scope-policy').value=policy;const scopeLocked=(state.scopeLocked||state.done.length>0)&&policy!=='retain';
 document.querySelectorAll('#scope-options input').forEach(c=>{c.checked=state.scope.includes(Number(c.value));c.disabled=busy||scopeLocked;});
 $('#apply-scope').disabled=busy||scopeLocked;
 $('#scope-note').textContent=policy==='retain'?'Kết quả các đoạn đã luyện được giữ lại khi đổi phạm vi.':'Tiếp tục luyện các đoạn trong phạm vi hiện tại.';
 const complete=shadowComplete(state.scope,state.done);$('#shadow-completion').hidden=!complete;$('.shadow-grid').hidden=complete&&!reviewingWorkspace;$('#shadow-review-workspace').setAttribute('aria-expanded',reviewingWorkspace);$('#shadow-review-workspace').textContent=reviewingWorkspace?'Thu gọn phần đã luyện':'Xem lại phần đã luyện';
 if(complete){const post=read().post;if(!post.complete.includes('shadowing'))write({post:{...post,complete:[...post.complete,'shadowing']}});}
 save();
}
async function play(){try{if(audio.paused){await audio.play();$('#play-unit').textContent='Ⅱ Tạm dừng';}else{audio.pause();$('#play-unit').textContent='▶ Nghe mẫu';}$('#audio-status').textContent='';}catch{$('#audio-status').textContent='Chưa phát được đoạn mẫu. Hãy thử lại.';}}
$('#play-unit').addEventListener('click',play);audio.addEventListener('ended',()=>$('#play-unit').textContent='▶ Nghe mẫu');
for(const id of ['hide-source','show-translation','show-ipa'])$('#'+id).addEventListener('change',render);
document.querySelectorAll('[data-shadow-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.shadowMode;render();}));
$('#shadow-record').addEventListener('click',async()=>{state.phase='recording';state.scopeLocked=true;if(state.mode==='simultaneous'){audio.currentTime=0;try{await audio.play();}catch{$('#audio-status').textContent='Chưa phát được đoạn mẫu.';}}render();});
$('#shadow-stop').addEventListener('click',()=>{audio.pause();state.phase='processing';render();});
$('#shadow-retry').addEventListener('click',()=>{state.phase=state.phase==='processing-error'?'processing':'ready';render();});
$('#apply-fixture').addEventListener('click',()=>{const outcome=$('#fixture-outcome').value;if(outcome==='mic-error'){state.phase='mic-error';audio.pause();render();return;}if(state.phase!=='processing'){$('#shadow-state-help').textContent='Bắt đầu và dừng một lượt luyện trước khi xem phản hồi.';return;}state.phase=outcome==='valid'?'feedback':outcome;render();});
$('#shadow-reviewed').addEventListener('click',()=>{if(state.phase!=='feedback')return;if(!state.done.includes(state.index))state.done.push(state.index);const next=state.scope.find(i=>!state.done.includes(i));if(next!==undefined){state.index=next;state.phase='ready';source();}render();if(next===undefined)$('#shadow-completion').scrollIntoView({block:'nearest'});});
$('#shadow-again').addEventListener('click',()=>{state.phase='ready';render();$('#shadow-record').focus();});
function move(dir){const pos=state.scope.indexOf(state.index)+dir;if(pos<0||pos>=state.scope.length)return;state.index=state.scope[pos];state.phase='ready';source();render();$('#shadow-text').focus?.();}
$('#shadow-prev').addEventListener('click',()=>move(-1));$('#shadow-next').addEventListener('click',()=>move(1));
$('#apply-scope').addEventListener('click',()=>{const policy=read().policies?.shadowScope||'pending';if((state.scopeLocked||state.done.length>0)&&policy!=='retain')return;const scope=[...document.querySelectorAll('#scope-options input:checked')].map(c=>Number(c.value));if(!scope.length){$('#scope-note').textContent='Chọn ít nhất một đoạn để luyện.';return;}state.scope=scope;if(!scope.includes(state.index))state.index=scope[0];state.phase='ready';$('#scope-details').open=false;source();render();});
source();render();

$('#scope-policy').addEventListener('change',e=>{write({policies:{...(read().policies||{}),shadowScope:e.target.value}});render();});
let leavingHref=null;
document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(!a||!['recording','processing'].includes(state.phase))return;event.preventDefault();leavingHref=a.href;$('#shadow-leave-dialog').returnValue='';$('#shadow-leave-dialog').showModal();});
$('#shadow-leave-dialog').addEventListener('close',()=>{if($('#shadow-leave-dialog').returnValue!=='leave'){leavingHref=null;return;}state.phase='ready';audio.pause();save();const href=leavingHref;leavingHref=null;if(href)location.href=href;});

$('#shadow-review-workspace').addEventListener('click',()=>{reviewingWorkspace=!reviewingWorkspace;render();if(reviewingWorkspace)$('#shadow-record').focus();});

function renderWords(text){
 $('#shadow-text').replaceChildren();$('#word-lookup').hidden=true;lookupWord=null;
 for(const token of text.split(/(\s+)/)){
  const key=token.toLowerCase().replace(/[^a-z]/g,'');
  if(!meanings[key]){$('#shadow-text').append(document.createTextNode(token));continue;}
  const button=document.createElement('button');button.type='button';button.className='lookup-token';button.dataset.word=key;button.textContent=token;button.setAttribute('aria-controls','word-lookup');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',`Tra nghĩa ${token.replace(/[,\.]/g,'')}`);
  button.addEventListener('click',()=>{document.querySelectorAll('.lookup-token').forEach(b=>b.setAttribute('aria-expanded','false'));lookupWord=button;button.setAttribute('aria-expanded','true');$('#lookup-word').textContent=token.replace(/[,\.]/g,'');$('#lookup-meaning').textContent=meanings[key];$('#word-lookup').hidden=false;});$('#shadow-text').append(button);
 }
}
$('#close-lookup').addEventListener('click',()=>{$('#word-lookup').hidden=true;document.querySelectorAll('.lookup-token').forEach(b=>b.setAttribute('aria-expanded','false'));lookupWord?.focus();});
$('#shadow-speed').addEventListener('change',e=>{state.speed=Number(e.target.value);audio.playbackRate=state.speed;save();});
$('#shadow-loop').addEventListener('change',e=>{state.loop=e.target.checked;audio.loop=state.loop;save();});
$('#vocab-store-link').addEventListener('click',event=>{event.preventDefault();const note=document.querySelector('.review-notes');note.open=true;note.querySelector('summary').focus();note.scrollIntoView({block:'start'});});
