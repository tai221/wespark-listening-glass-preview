import {read,write,shadowingReward} from './session.mjs';
import {UNITS,shadowComplete} from './practice-state.mjs';
const $=s=>document.querySelector(s);
const unitIndices=UNITS.map((_,index)=>index);
const saved={...(read().shadowing||{})};delete saved.scope;delete saved.scopeLocked;
let state={index:0,done:[],mode:'repeat',phase:'ready',speed:1,loop:false,...saved};
state.loop=false;
state.done=[...new Set(Array.isArray(state.done)?state.done.filter(index=>unitIndices.includes(index)):[])];
if(!unitIndices.includes(state.index))state.index=0;
if(state.phase==='recording'||state.phase==='processing')state.phase='ready';
const replayAudio=document.createElement('audio');replayAudio.preload='none';let replayRequest=0;
const audio=$('#unit-audio');let reviewingWorkspace=false;let lookupWord=null;
const meanings={every:'mỗi',evening:'buổi tối',our:'của chúng tôi',kitchen:'nhà bếp',bin:'thùng rác',used:'đã từng (used to)',be:'là; ở trạng thái',full:'đầy',now:'bây giờ',carry:'mang theo',a:'một',reusable:'có thể tái sử dụng',bag:'túi',whenever:'bất cứ khi nào',go:'đi',shopping:'mua sắm',i:'tôi',wanted:'đã muốn',to:'đánh dấu động từ nguyên mẫu',throw:'vứt; ném',away:'đi; ra xa',less:'ít hơn',but:'nhưng',did:'trợ động từ quá khứ',not:'không',know:'biết',where:'ở đâu',begin:'bắt đầu'};
const ipa=['/ˈevri ˈiːvnɪŋ aʊə ˈkɪtʃɪn bɪn juːst tə bi fʊl/','/aɪ ˈwɒntɪd tə θrəʊ əˈweɪ les bət aɪ dɪd nɒt nəʊ weə tə bɪˈɡɪn/','/naʊ aɪ ˈkæri ə ˌriːˈjuːzəbl bæɡ wenˈevə aɪ ɡəʊ ˈʃɒpɪŋ/'];
const wordIPA=[['ˈevri','ˈiːvnɪŋ','aʊə','ˈkɪtʃɪn','bɪn','juːst','tə','bi','fʊl'],['aɪ','ˈwɒntɪd','tə','θrəʊ','əˈweɪ','les','bət','aɪ','dɪd','nɒt','nəʊ','weə','tə','bɪˈɡɪn'],['naʊ','aɪ','ˈkæri','ə','ˌriːˈjuːzəbl','bæɡ','wenˈevə','aɪ','ɡəʊ','ˈʃɒpɪŋ']];
function save(){write({shadowing:state});}
function focusPractice(){($('#shadow-text').hidden?$('.shadow-workspace'):$('#shadow-text')).focus();}
const isBusy=()=>['recording','processing'].includes(state.phase);
const playIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>';
function playback(playing){const label=playing?'Tạm dừng':'Nghe mẫu';$('#play-unit').innerHTML=(playing?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>':playIcon)+`<span class="sr-only">${label}</span>`;$('#play-unit').setAttribute('aria-label',label);$('#play-unit').setAttribute('aria-pressed',String(playing));}
let playRequest=0,processingTimer=null;let pointAnimations=[];
function stopPointMotion(){pointAnimations.forEach(animation=>animation.cancel());pointAnimations=[];document.querySelectorAll('.shadow-point-flight').forEach(el=>el.remove());}
function animatePoint(){
 if(document.body.dataset.glassMotion!=='true'||document.hidden||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const from=$('.shadow-result-score').getBoundingClientRect(),to=$('#shadow-point-counter').getBoundingClientRect();if(from.bottom<0||from.top>window.innerHeight)return;
 const flight=document.createElement('span');flight.className='dictation-point-flight shadow-point-flight';flight.setAttribute('aria-hidden','true');flight.innerHTML=$('#shadow-point-counter svg').outerHTML+'<b>+1</b>';flight.style.left=`${from.x+from.width/2}px`;flight.style.top=`${from.y}px`;document.body.append(flight);
 if(!flight.animate){flight.remove();return;}
 const animation=flight.animate([{transform:'translate(-50%,0) scale(.8)',opacity:0},{transform:'translate(-50%,-28px) scale(1.1)',opacity:1,offset:.25},{transform:`translate(${to.x+to.width/2-from.x-from.width/2}px,${to.y+to.height/2-from.y}px) scale(.6)`,opacity:0}],{duration:850,easing:'cubic-bezier(.22,.7,.3,1)'});pointAnimations.push(animation);animation.onfinish=()=>{flight.remove();pointAnimations=pointAnimations.filter(a=>a!==animation);};
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPointMotion();});window.addEventListener('pagehide',stopPointMotion);window.addEventListener('glass-motion-change',event=>{if(!event.detail.enabled)stopPointMotion();});window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(event.matches)stopPointMotion();});
function cancelProcessing(){window.clearTimeout(processingTimer);processingTimer=null;}
function processTurn(){
 cancelProcessing();state.phase='processing';render();$('#shadow-state').focus();
 processingTimer=window.setTimeout(()=>{processingTimer=null;if(state.phase!=='processing')return;state.phase='feedback';const rewardIds=Array.isArray(read().shadowingRewards)?read().shadowingRewards:[];const earnedPoint=!state.done.includes(state.index)&&!rewardIds.includes(state.index);if(earnedPoint)write({shadowingRewards:[...rewardIds,state.index]});if(!state.done.includes(state.index))state.done.push(state.index);if(shadowComplete(unitIndices,state.done))reviewingWorkspace=true;render();if(earnedPoint)animatePoint();if(!document.querySelector('dialog[open]'))$('#shadow-feedback').focus();},700);
}
function stopAudio(){playRequest++;audio.pause();playback(false);}
async function startAudio(){const request=++playRequest,src=audio.src;try{await audio.play();if(request!==playRequest||src!==audio.src)return;playback(!audio.paused);$('#audio-status').textContent='';}catch{if(request===playRequest&&src===audio.src)audioError();}}
function audioError(){stopAudio();$('#audio-status').textContent='Chưa phát được đoạn mẫu. Hãy thử lại.';}
function source(){stopPointMotion();stopRecordingReplay();cancelProcessing();stopAudio();audio.src=`practice-0${state.index+1}.wav`;audio.playbackRate=state.speed;audio.loop=state.loop;playback(false);$('#audio-status').textContent='';}
function render(){
 $(".shadow-workspace").dataset.phase=state.phase;
 const unit=UNITS[state.index],trainedCount=state.done.length;
 $('#source-unit-label').textContent=`Đoạn 0${state.index+1}`;
 $('#shadow-list-count').textContent=`${trainedCount} / ${UNITS.length}`;
 $('#course-progress').max=UNITS.length;$('#course-progress').value=trainedCount;
 renderList();
 $('#shadow-unit').textContent=`Đoạn 0${state.index+1}`;$('#shadow-progress').textContent=`Đã luyện ${trainedCount} / ${UNITS.length}`;
 renderWords(unit.text);$('#shadow-speed').value=state.speed;$('#shadow-translation').textContent=unit.translation;$('#shadow-ipa').textContent=ipa[state.index];
 $('#shadow-text').hidden=$('#hide-source').checked;$('#shadow-translation').hidden=!$('#show-translation').checked;$('#shadow-ipa').hidden=!$('#show-ipa').checked||!$('#hide-source').checked;
 document.querySelector('.shadow-lookup-hint').hidden=$('#hide-source').checked;
 for(const id of ['hide-source','show-ipa','show-translation']){const input=$('#'+id),visible=id==='hide-source'?!input.checked:input.checked;input.closest('label').classList.toggle('is-visible',visible);input.setAttribute('aria-label',`${visible?'Ẩn':'Hiện'} ${id==='hide-source'?'câu mẫu':id==='show-ipa'?'IPA':'dịch nghĩa'}`);}
 document.querySelectorAll('[data-shadow-mode]').forEach(b=>{b.setAttribute('aria-pressed',state.mode===b.dataset.shadowMode);b.disabled=state.phase==='recording'||state.phase==='processing';});
 $('#shadow-instruction').textContent=state.mode==='repeat'?'Nghe xong đoạn mẫu, rồi ghi âm phần bạn nhắc lại.':'Nói theo trong lúc audio mẫu đang phát.';
 const phases={ready:['Sẵn sàng luyện','Nghe mẫu rồi bắt đầu khi bạn sẵn sàng.'],recording:['Đang ghi âm…','Nói trọn đoạn theo cách luyện đang chọn, rồi bấm Dừng.'],processing:['Đang xử lý lượt luyện…','Đoạn này chưa được ghi nhận hoàn tất.'],feedback:['',''],'mic-error':['Chưa truy cập được micro','Kiểm tra quyền micro rồi thử lại. Lượt này chưa được ghi nhận.'],'processing-error':['Chưa xử lý được lượt luyện','Tiến độ cũ được giữ nguyên. Lỗi xử lý không quy thành điểm thấp.'],silence:['Chưa có lời nói để đánh giá','Lượt này chưa được tính đã luyện. Có thể thử lại.']};
 const [title,help]=phases[state.phase]||phases.ready;$('#shadow-state').textContent=title;$('#shadow-state-help').textContent=help;
 $('#voice-workspace').classList.toggle('recording',state.phase==='recording');
 $('#shadow-record').hidden=!['ready','feedback'].includes(state.phase);$('#shadow-stop').hidden=state.phase!=='recording';$('#shadow-retry').hidden=!['mic-error','processing-error','silence'].includes(state.phase);
 $('#shadow-point-counter strong').textContent=`+${shadowingReward()}`;$('#shadow-point-counter').setAttribute('aria-label',`${shadowingReward()} SparkPoint từ luyện nói theo`);
 $('#shadow-feedback').hidden=state.phase!=='feedback';renderWordFeedback();$('#shadow-ai-advice').hidden=state.phase!=='feedback';
 const notes=[['Giữ nhịp cụm “used to be”','Bản thu có nhịp dừng giữa “used” và “to”. Thử nói liền cụm rồi ghép lại cả câu.','our kitchen bin | used to be full'],['Giữ nhịp liền hơn ở “wanted to”','Bản thu có một nhịp dừng giữa “wanted” và “to”. Nghe mẫu rồi nói liền cụm trước khi ghép cả đoạn.','I wanted to | throw away less'],['Nối cụm “a reusable bag”','Bạn đang ngắt nhỏ trong cụm danh từ. Thử nói cả cụm theo một nhịp trước khi nối phần còn lại.','I carry | a reusable bag']];
 $('#shadow-feedback-title').textContent=notes[state.index][0];$('#shadow-feedback-copy').textContent=notes[state.index][1];$('#shadow-evidence').textContent=notes[state.index][2];
 $('#shadow-prev').disabled=state.index<=0;$('#shadow-next').disabled=state.index>=UNITS.length-1;
 const busy=isBusy();audio.controls=!busy;$('#play-unit').disabled=busy;$('#shadow-replay').disabled=busy;$('#shadow-speed').disabled=busy;$('#shadow-prev').disabled||=busy;$('#shadow-next').disabled||=busy;
 const complete=shadowComplete(unitIndices,state.done);$('#shadow-completion').hidden=!complete;$('#shadow-bottom-nav').hidden=complete&&!reviewingWorkspace;$('.shadow-grid').hidden=complete&&!reviewingWorkspace;$('#shadow-review-workspace').setAttribute('aria-expanded',reviewingWorkspace);$('#shadow-review-workspace').textContent=reviewingWorkspace?'Thu gọn phần đã luyện':'Xem lại phần đã luyện';
 const post=read().post,marked=post.complete.includes('shadowing');
 if(complete&&!marked)write({post:{...post,complete:[...post.complete,'shadowing']}});
 if(!complete&&marked)write({post:{...post,complete:post.complete.filter(activity=>activity!=='shadowing')}});
 save();
}
async function play(){if(isBusy())return;stopRecordingReplay();if(audio.paused)await startAudio();else{stopAudio();$('#audio-status').textContent='';}}
$('#play-unit').addEventListener('click',play);audio.addEventListener('ended',()=>playback(false));audio.addEventListener('pause',()=>playback(false));audio.addEventListener('play',()=>playback(true));audio.addEventListener('error',audioError);
$('#shadow-replay').addEventListener('click',async()=>{if(isBusy())return;stopRecordingReplay();stopAudio();audio.currentTime=0;await startAudio();});
$('#unit-filter').addEventListener('change',renderList);
for(const id of ['hide-source','show-translation','show-ipa'])$('#'+id).addEventListener('change',render);
document.querySelectorAll('[data-shadow-mode]').forEach(b=>b.addEventListener('click',()=>{if(isBusy())return;state.mode=b.dataset.shadowMode;render();focusPractice();}));
$('#shadow-record').addEventListener('click',async()=>{if(isBusy())return;stopRecordingReplay();cancelProcessing();stopAudio();state.phase='recording';render();$('#shadow-stop').focus();if(state.mode==='simultaneous'){audio.currentTime=0;await startAudio();}});
$('#shadow-stop').addEventListener('click',()=>{if(state.phase!=='recording')return;stopAudio();processTurn();});
$('#shadow-retry').addEventListener('click',()=>{if(state.phase==='processing-error'){processTurn();return;}cancelProcessing();state.phase='ready';render();$('#shadow-record').focus();});
$('#apply-fixture').addEventListener('click',()=>{
 const outcome=$('#fixture-outcome').value;
 if(!['silence','mic-error','processing-error'].includes(outcome))return;
 if(outcome!=='mic-error'&&!['recording','processing','feedback'].includes(state.phase)){$('#shadow-state-help').textContent='Bắt đầu một lượt luyện trước khi mô phỏng lỗi này.';return;}
 cancelProcessing();stopAudio();state.phase=outcome;render();$('#shadow-retry').focus();
});
function stopRecordingReplay(){replayRequest++;replayAudio.pause();$('#shadow-replay-recording').setAttribute('aria-pressed','false');$('#shadow-replay-recording').setAttribute('aria-label','Nghe lại lượt nói');}
$('#shadow-replay-recording').addEventListener('click',async()=>{
 if(state.phase!=='feedback')return;
 if(!replayAudio.paused){stopRecordingReplay();return;}
 stopAudio();const request=++replayRequest;replayAudio.src=`practice-0${state.index+1}.wav`;replayAudio.currentTime=0;
 try{await replayAudio.play();if(request!==replayRequest)return;$('#shadow-replay-recording').setAttribute('aria-pressed','true');$('#shadow-replay-recording').setAttribute('aria-label','Dừng nghe lại');}catch{if(request===replayRequest){stopRecordingReplay();$('#audio-status').textContent='Chưa phát được audio mẫu. Hãy thử lại.';}}
});
replayAudio.addEventListener('ended',stopRecordingReplay);
function renderWordFeedback(){
 const tokens=UNITS[state.index].text.split(/\s+/),practiceIndex=[5,1,4][state.index];
 $('#shadow-word-score').textContent=`${tokens.length-1} / ${tokens.length} từ đúng`;
 $('#shadow-spoken-text').textContent=`“${UNITS[state.index].text}”`;
 $('#shadow-word-results').replaceChildren(...tokens.map((token,index)=>{
  const item=document.createElement('li'),practice=index===practiceIndex;item.className='shadow-word-result';item.dataset.result=practice?'practice':'correct';
  const word=document.createElement('span');word.lang='en';word.textContent=token.replace(/[,.]/g,'');
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.innerHTML=practice?'<path d="m12 3 10 18H2L12 3Zm0 6v5m0 3v1"></path>':'<path d="m5 12 4 4L19 6"></path>';
  const status=document.createElement('span');status.className='sr-only';status.textContent=practice?'Cần luyện thêm':'Đúng';item.append(word,icon,status);return item;
 }));
}
function move(dir){if(isBusy())return;const pos=state.index+dir;if(pos<0||pos>=UNITS.length)return;selectUnit(pos);}
$('#shadow-prev').addEventListener('click',()=>move(-1));$('#shadow-next').addEventListener('click',()=>move(1));
source();render();

let leavingHref=null;
document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(!a||!['recording','processing'].includes(state.phase))return;event.preventDefault();leavingHref=a.href;$('#shadow-leave-dialog').returnValue='';$('#shadow-leave-dialog').showModal();});
$('#shadow-leave-dialog').addEventListener('close',()=>{if($('#shadow-leave-dialog').returnValue!=='leave'){leavingHref=null;return;}cancelProcessing();state.phase='ready';stopAudio();save();const href=leavingHref;leavingHref=null;if(href)location.href=href;});

$('#shadow-review-workspace').addEventListener('click',()=>{reviewingWorkspace=!reviewingWorkspace;render();if(reviewingWorkspace)$('#shadow-record').focus();});

function renderWords(text){
 closeLookup(false);$('#shadow-text').replaceChildren();lookupWord=null;
 text.split(/\s+/).forEach((token,index)=>{
  const key=token.toLowerCase().replace(/[^a-z]/g,'');
  const pair=document.createElement('span');pair.className='shadow-word';
  const button=document.createElement('button');button.type='button';button.className='lookup-token';button.dataset.word=key;button.textContent=token;button.setAttribute('aria-controls','word-lookup');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',`Tra nghĩa ${token.replace(/[,\.]/g,'')}`);
  button.addEventListener('click',()=>openLookup(button,key,index));
  const phonetic=document.createElement('span');phonetic.className='shadow-word-ipa';phonetic.textContent=wordIPA[state.index][index];phonetic.hidden=!$('#show-ipa').checked;
  pair.append(button,phonetic);$('#shadow-text').append(pair,document.createTextNode(' '));
 });
}
const wordParts={every:'determiner',evening:'noun',our:'determiner',kitchen:'noun',bin:'noun',used:'verb',to:'particle',be:'verb',full:'adjective',i:'pronoun',wanted:'verb',throw:'verb',away:'adverb',less:'adverb',but:'conjunction',did:'verb',not:'adverb',know:'verb',where:'adverb',begin:'verb',now:'adverb',carry:'verb',a:'article',reusable:'adjective',bag:'noun',whenever:'conjunction',go:'verb',shopping:'noun'};
const partLabels={determiner:'TỪ HẠN ĐỊNH',noun:'DANH TỪ',verb:'ĐỘNG TỪ',particle:'TIỂU TỪ',adjective:'TÍNH TỪ',pronoun:'ĐẠI TỪ',adverb:'TRẠNG TỪ',conjunction:'LIÊN TỪ',article:'MẠO TỪ'};
// Illustrative dictionary entries for the prototype's three sample segments.
const wordLevels={reusable:'B2',whenever:'B1',carry:'A2',throw:'A2',less:'A2',begin:'A1'};
const americanIPA={our:'aʊr',wanted:'ˈwɑːntɪd',not:'nɑːt',know:'noʊ',where:'wer',throw:'θroʊ',go:'ɡoʊ',but:'bʌt',shopping:'ˈʃɑːpɪŋ'};
function updateWordCollection(){
 const saved=Array.isArray(read().savedWords)?read().savedWords:[],added=saved.includes(lookupWord?.dataset.word);
 $('#lookup-add').setAttribute('aria-pressed',String(added));$('#lookup-add span').textContent=added?'Đã thêm':'Thêm';
 $('#lookup-add svg').innerHTML=added?'<path d="m5 12 4 4L19 6"></path>':'<path d="M12 5v14M5 12h14"></path>';
}
function updatePronunciation(){
 const voices=window.speechSynthesis?.getVoices()||[];
 document.querySelectorAll('[data-lookup-accent]').forEach(button=>{button.disabled=!voices.some(voice=>voice.lang.toLowerCase()===button.dataset.lookupAccent.toLowerCase());button.title=button.disabled?'Trình duyệt chưa có giọng đọc này':`Nghe phát âm ${button.textContent.trim()}`;});
}
function positionLookup(){
 const popup=$('#word-lookup');if(popup.hidden||!lookupWord?.isConnected)return;
 const anchor=lookupWord.getBoundingClientRect(),box=popup.getBoundingClientRect(),gap=10,edge=16;
 const left=Math.max(edge,Math.min(anchor.left,window.innerWidth-box.width-edge));
 const below=anchor.bottom+gap,above=anchor.top-box.height-gap;
 const top=below+box.height<=window.innerHeight-edge?below:above>=edge?above:Math.max(edge,window.innerHeight-box.height-edge);
 popup.style.left=`${left}px`;popup.style.top=`${top}px`;
}
function closeLookup(restoreFocus=true){
 window.speechSynthesis?.cancel();
 const popup=$('#word-lookup');if(typeof popup.hidePopover==='function'&&popup.matches(':popover-open'))popup.hidePopover();popup.hidden=true;
 document.querySelectorAll('.lookup-token').forEach(b=>b.setAttribute('aria-expanded','false'));
 if(restoreFocus&&lookupWord?.isConnected)lookupWord.focus();
}
function openLookup(button,key,index){
 closeLookup(false);lookupWord=button;button.setAttribute('aria-expanded','true');
 $('#lookup-word').textContent=button.textContent.replace(/[,\.]/g,'');$('#lookup-meaning').textContent=meanings[key];
 $('#lookup-ipa').textContent=`/${wordIPA[state.index][index]}/`;$('#lookup-ipa-us').textContent=`/${americanIPA[key]||wordIPA[state.index][index]}/`;
 $('#lookup-part').textContent=partLabels[wordParts[key]]||'';$('#lookup-level').textContent=wordLevels[key]||'A1';updateWordCollection();updatePronunciation();
 $('#lookup-context').textContent=UNITS[state.index].text;$('#lookup-context-translation').textContent=UNITS[state.index].translation;
 const popup=$('#word-lookup');popup.hidden=false;if(typeof popup.showPopover==='function')popup.showPopover();positionLookup();$('#close-lookup').focus({preventScroll:true});
}
$('#lookup-add').addEventListener('click',()=>{
 const key=lookupWord?.dataset.word;if(!key)return;
 const saved=Array.isArray(read().savedWords)?read().savedWords:[];
 write({savedWords:saved.includes(key)?saved.filter(word=>word!==key):[...saved,key]});updateWordCollection();
});
document.querySelectorAll('[data-lookup-accent]').forEach(button=>button.addEventListener('click',()=>{
 const voice=window.speechSynthesis?.getVoices().find(voice=>voice.lang.toLowerCase()===button.dataset.lookupAccent.toLowerCase());if(!voice||!lookupWord)return;
 stopAudio();window.speechSynthesis.cancel();const speech=new window.SpeechSynthesisUtterance($('#lookup-word').textContent);speech.voice=voice;speech.lang=button.dataset.lookupAccent;speech.rate=.85;
 speech.onerror=()=>{$('#lookup-audio-status').textContent='Chưa phát được từ. Hãy thử lại.';};$('#lookup-audio-status').textContent='';window.speechSynthesis.speak(speech);
}));
window.speechSynthesis?.addEventListener('voiceschanged',updatePronunciation);
$('#close-lookup').addEventListener('click',()=>closeLookup());
$('#word-lookup').addEventListener('toggle',event=>{if(event.newState==='closed'&&!$('#word-lookup').matches(':popover-open'))closeLookup(false);});
document.addEventListener('pointerdown',event=>{if(!$('#word-lookup').hidden&&!$('#word-lookup').contains(event.target)&&!event.target.closest('.lookup-token'))closeLookup(false);});
document.addEventListener('keydown',event=>{if($('#word-lookup').hidden)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeLookup();}});
window.addEventListener('resize',positionLookup);window.addEventListener('scroll',positionLookup,true);
$('#shadow-speed').addEventListener('change',e=>{state.speed=Number(e.target.value);audio.playbackRate=state.speed;save();});

function selectUnit(index){
 if(isBusy()||index===state.index||!unitIndices.includes(index))return;
 state.index=index;state.phase='ready';source();render();focusPractice();
}
function renderList(){
 const list=$('#shadow-segment-list');
 // Keep the same buttons across renders so keyboard focus stays on the selected row.
 if(!list.children.length)UNITS.forEach((unit,index)=>{
  const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.dataset.shadowIndex=index;
  const number=document.createElement('span');number.className='segment-number unit-number';number.textContent=String(index+1).padStart(2,'0');
  const copy=document.createElement('span');copy.className='segment-copy unit-list-copy';const text=document.createElement('strong');text.className='segment-preview';text.lang='en';text.textContent=unit.text;const status=document.createElement('small');status.className='segment-status unit-status-copy';const mark=document.createElement('span');mark.className='unit-mark';mark.setAttribute('aria-hidden','true');copy.append(text,status);button.append(number,copy,mark);button.addEventListener('click',()=>selectUnit(index));li.append(button);list.append(li);
 });
 list.querySelectorAll('button').forEach((button,index)=>{
  const hidden=$('#hide-source').checked;
  const status=state.done.includes(index)?'Đã luyện':index===state.index?'Đang chọn':'Chưa luyện';
  button.disabled=isBusy();
  const done=state.done.includes(index),filter=$('#unit-filter').value;
  button.closest('li').hidden=filter==='pending'?done:filter==='done'?!done:false;
  button.classList.toggle('unit-complete',done);button.title=UNITS[index].text;
  button.querySelector('.unit-mark').innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${done?'<path d="m5 12 4 4L19 6"/>':'<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>'}</svg>`;
  button.querySelector('.segment-preview').hidden=hidden;
  button.setAttribute('aria-label',`Đoạn ${index+1} · ${status}${hidden?'':`: ${UNITS[index].text}`}`);
  if(index===state.index)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
  button.querySelector('.segment-status').textContent=status;
  button.querySelector('.segment-status').classList.toggle('sr-only',!done);
 });
 $('#shadow-list-empty').hidden=[...list.children].some(li=>!li.hidden);
}
document.addEventListener('keydown',event=>{
 if(event.defaultPrevented||event.isComposing||event.repeat||document.querySelector('dialog[open]')||$('#shadow-active-workspace').hidden)return;
 if(!$('#word-lookup').hidden||[...document.querySelectorAll('[popover]')].some(el=>el.matches(':popover-open')))return;
 const key=event.key.toLowerCase(),field=event.target;
 if((event.ctrlKey||event.metaKey)&&!event.altKey&&!event.shiftKey&&['arrowleft','arrowright'].includes(key)){
  event.preventDefault();move(key==='arrowleft'?-1:1);return;
 }
 if(event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
 if(key==='`'||event.code==='Backquote'){event.preventDefault();$('#shadow-replay').click();return;}
 const practicing=field.matches?.('#shadow-text,.shadow-workspace');
 if(key==='tab'&&practicing){event.preventDefault();$('#play-unit').click();return;}
 if(key==='escape'&&practicing){event.preventDefault();$('#play-unit').focus();return;}
 if(key==='enter'&&(practicing||field.matches?.('#shadow-feedback'))&&state.phase==='feedback'){event.preventDefault();move(1);return;}
 if(field.closest?.('input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'))return;
 if(key==='r'&&field.closest?.('.shadow-workspace')){
  event.preventDefault();if(state.phase==='recording')$('#shadow-stop').click();else if(!isBusy()&&!$('#shadow-record').hidden)$('#shadow-record').click();
 }
});
