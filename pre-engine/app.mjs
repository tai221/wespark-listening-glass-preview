import {KEYS,POINTS,create,predict,learn,select,check,advance,replay,reward} from './state.mjs';
const $=s=>document.querySelector(s);
const sessionKey='wespark-listening-glass-pre-v1';
let state=create(),step=0,saved;
try{saved=JSON.parse(sessionStorage.getItem(sessionKey));}catch{}
if(saved&&saved.version===1&&saved.state?.answers?.length===3&&saved.state?.checked?.length===3){state=saved.state;step=Math.min(2,Math.max(0,saved.step||0));}
const questions=[
 {title:'“Reduce waste” có nghĩa là gì?',options:['Giảm chất thải','Tăng chi phí','Tiết kiệm thời gian'],explanation:'“Reduce waste” nghĩa là giảm chất thải. Trong câu vừa học, những thay đổi nhỏ giúp chúng ta tạo ra ít chất thải hơn.'},
 {title:'Bạn nghe thấy cụm từ nào?',audio:true,options:['big changes','small changes','small chances'],explanation:'Âm thanh nói “small changes” — những thay đổi nhỏ. Chú ý “small”, không phải “big”; và “changes”, không phải “chances”.'},
 {title:'Chọn cách nói phù hợp.',prompt:'We ___ today.',options:['can start','can starting','can started'],explanation:'Sau “can” dùng động từ nguyên mẫu: “We can start today” — Chúng ta có thể bắt đầu hôm nay.'}
];
let animationTimer,flightTimer,cleanupTimer,audioBlocked=false;
const audio=$('#sample-audio');
function save(){try{sessionStorage.setItem(sessionKey,JSON.stringify({version:1,state,step}));}catch{}}
function showStep(n){if(n===1&&!state.prediction||n===2&&!state.learned)return;step=n;$('#prep-map').open=false;render();document.querySelector(step===2&&state.finished?'#finish-title':`[data-panel="${step}"] h1`).focus();}
function render(){
 save();$('#prep-current').textContent=state.finished&&step===2?'Hoàn tất chuẩn bị':['Đoán ngữ cảnh','Học từ & câu','Thử sức'][step];$('#prep-count').textContent=`Bước ${step+1} / 3`;document.querySelectorAll('[data-panel]').forEach(e=>e.hidden=Number(e.dataset.panel)!==step);
 document.querySelectorAll('[data-step]').forEach(b=>{const n=Number(b.dataset.step);b.disabled=n===1&&!state.prediction||n===2&&!state.learned;b.toggleAttribute('aria-current',n===step);if(n===step)b.setAttribute('aria-current','step');b.classList.toggle('done',n<step||state.finished);});
 document.querySelectorAll('[name="prediction"]').forEach(r=>r.checked=r.value===state.prediction);
 $('#balance').textContent=state.balance;
 $('#back').hidden=step===0;$('#library').hidden=step!==0;
 $('#primary').hidden=step===2&&state.finished;$('#listening').hidden=!(step===2&&state.finished);
 $('#action-note').textContent=step===1?'Từ và mẫu câu trong cùng ngữ cảnh':step===2?'Không có ngưỡng điểm để vào bài nghe.':(!state.prediction?'Chọn một dự đoán để tiếp tục.':'');
 if(step===0){$('#primary').textContent='Học từ & câu →';$('#primary').disabled=!state.prediction;}
 if(step===1){$('#primary').textContent='Thử sức →';$('#primary').disabled=false;}
 if(step===2){
  $('#challenge').hidden=state.finished;$('#completion').hidden=!state.finished;
  if(state.finished)renderResults();else renderQuestion();
 }
}
function renderQuestion(){
 const i=state.index,q=questions[i],checked=state.checked[i];
 $('#question-count').textContent=`Câu ${i+1} / ${questions.length}`;
 const done=state.checked.filter(Boolean).length;$('#track-fill').style.width=`${done/3*100}%`;$('.track').setAttribute('aria-valuenow',done);
 $('#quiz-title').textContent=q.title;$('#audio-area').hidden=!q.audio;
 $('#answers').replaceChildren();
 if(q.prompt){const p=document.createElement('p');p.className='sentence';p.lang='en';p.textContent=q.prompt;$('#answers').append(p);}
 q.options.forEach((text,j)=>{
  const letter='ABC'[j],label=document.createElement('label');label.className='option';
  const input=document.createElement('input');input.type='radio';input.name='answer';input.value=letter;input.checked=state.answers[i]===letter;input.disabled=checked;
  input.addEventListener('change',()=>{state=select(state,letter);save();$('#primary').disabled=!!(q.audio&&(audioBlocked||audio.error));});
  const key=document.createElement('span');key.className='letter';key.textContent=letter;
  const copy=document.createElement('span');copy.textContent=text;if(q.audio||q.prompt)copy.lang='en';
  label.append(input,key,copy);
  if(checked&&(letter===KEYS[i]||letter===state.answers[i])){
   const correct=letter===KEYS[i];label.classList.add(correct?'correct':'wrong');
   const status=document.createElement('span');status.className='status';status.textContent=correct?'✓ '+(state.answers[i]===letter?'Đúng':'Đáp án'):'× Bạn chọn';label.append(status);
  }
  $('#answers').append(label);
 });
 $('#feedback').replaceChildren();
 if(checked){const title=document.createElement('strong');title.textContent=state.answers[i]===KEYS[i]?'Chính xác.':'Nhớ điểm này nhé.';const copy=document.createElement('span');copy.textContent=q.explanation;$('#feedback').append(title,copy);}
 $('#primary').textContent=checked?(i===2?'Hoàn tất →':'Câu tiếp →'):'Kiểm tra';
 $('#primary').disabled=!state.answers[i]||(!checked&&q.audio&&(audioBlocked||!!audio.error));
}
function renderResults(){
 $('#score-summary').textContent=`${state.score} / 3 câu đúng · Không cần làm đúng tất cả.`;
 $('#reviews').replaceChildren();
 questions.map((q,i)=>({q,i,correct:state.answers[i]===KEYS[i]})).sort((a,b)=>Number(a.correct)-Number(b.correct)).forEach(({q,i,correct})=>{
  const details=document.createElement('details');details.className='review-row';const summary=document.createElement('summary');summary.textContent=(correct?'✓ ':'↻ ')+q.title;
  const status=document.createElement('span');status.textContent=correct?'Đã nhớ':'Cần nhớ';summary.append(status);
  const p=document.createElement('p');p.textContent=`${correct?'':'Bạn chọn: '+q.options['ABC'.indexOf(state.answers[i])]+'. '}${q.explanation}`;
  details.append(summary,p);$('#reviews').append(details);
 });
 $('#reward-status').textContent=state.awarded?'SparkPoint đã được cộng cho lượt chuẩn bị này.':'';
}
document.querySelectorAll('[name="prediction"]').forEach(r=>r.addEventListener('change',()=>{state=predict(state,r.value);save();$('#primary').disabled=false;$('#action-note').textContent='';document.querySelector('[data-step="1"]').disabled=false;}));
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>showStep(Number(b.dataset.step))));
$('#back').addEventListener('click',()=>showStep(step-1));
$('#primary').addEventListener('click',()=>{
 if(step===0){showStep(1);return;}
 if(step===1){state=learn(state);showStep(2);return;}
 if(!state.checked[state.index]){if(questions[state.index].audio&&(audioBlocked||audio.error))return;state=check(state);render();return;}
 state=advance(state);
 const earn=state.finished&&!state.awarded;
 if(earn)state=reward(state);
 render();
 if(state.finished){$('#finish-title').focus();if(earn)celebrate();}
 else $('#quiz-title').focus();
});
$('#replay').addEventListener('click',()=>{state=replay(state);clearCelebration();render();$('#quiz-title').focus();});
async function playSample(){try{if(audio.error){audio.load();}audio.currentTime=0;await audio.play();audioBlocked=false;$('#audio-error').hidden=true;}catch{audioBlocked=true;$('#audio-error').hidden=false;}if(step===2&&!state.finished)$('#primary').disabled=!state.answers[state.index]||(!state.checked[state.index]&&(audioBlocked||!!audio.error));}
$('#play-audio').addEventListener('click',playSample);
audio.addEventListener('error',()=>{audioBlocked=true;$('#audio-error').hidden=false;if(step===2&&!state.finished&&questions[state.index].audio&&!state.checked[state.index])$('#primary').disabled=true;});
audio.addEventListener('canplay',()=>{audioBlocked=false;$('#audio-error').hidden=true;if(step===2&&!state.finished&&questions[state.index].audio&&!state.checked[state.index])$('#primary').disabled=!state.answers[state.index];});
$('#word-audio').addEventListener('click',async()=>{const a=$('#vocab-audio');try{if(a.error)a.load();a.currentTime=0;await a.play();$('#word-error').hidden=true;}catch{$('#word-error').hidden=false;}});
function clearCelebration(){clearTimeout(animationTimer);clearTimeout(flightTimer);clearTimeout(cleanupTimer);$('#particles').replaceChildren();$('.spark-stage').classList.remove('celebrate');$('#wallet').classList.remove('wallet-pulse');$('#balance').textContent=state.balance;}
function stopRewardMotion(){
 clearCelebration();
 if(state.finished&&state.awarded){const message=`+${POINTS} SparkPoint · Đã nhận thưởng.`;if($('#reward-status').textContent!==message)$('#reward-status').textContent=message;}
}
window.addEventListener('glass-motion-change',event=>{
 if(!event.detail.enabled||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.dataset.sparkLegacyMotion==='false')stopRewardMotion();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRewardMotion();});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(event.matches)stopRewardMotion();});
function celebrate(){
 clearCelebration();$('#reward-status').textContent='';$('.spark-stage').classList.add('celebrate');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.dataset.glassMotion!=='true';
 if(reduced){$('#balance').textContent=state.balance;$('#reward-status').textContent=`+${POINTS} SparkPoint · Đã nhận thưởng.`;return;}
 $('#balance').textContent=state.balance-POINTS;
 const from=$('#spark').getBoundingClientRect(),to=$('#wallet').getBoundingClientRect();
 for(let i=0;i<9;i++){
  const el=document.createElement('span');el.className='flying-spark';el.textContent='ϟ';el.style.left=`${from.x+from.width/2}px`;el.style.top=`${from.y+from.height/2}px`;$('#particles').append(el);
  const dx=to.x+to.width/2-(from.x+from.width/2),dy=to.y+to.height/2-(from.y+from.height/2);
  const angle=i/9*Math.PI*2;
  el.animate([{transform:'translate(-50%,-50%) scale(.1)',opacity:0},{transform:`translate(${Math.cos(angle)*65}px,${Math.sin(angle)*55}px) scale(1.15)`,opacity:1,offset:.32},{transform:`translate(${dx}px,${dy}px) scale(.35)`,opacity:0}],{duration:950,delay:i*24,easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'});
 }
 flightTimer=setTimeout(()=>{
  $('#wallet').classList.add('wallet-pulse');let n=state.balance-POINTS;
  const count=()=>{n=Math.min(state.balance,n+1);$('#balance').textContent=n;if(n<state.balance)animationTimer=setTimeout(count,23);else $('#reward-status').textContent=`+${POINTS} SparkPoint · Đã nhận thưởng.`;};count();
 },850);
 cleanupTimer=setTimeout(()=>{$('#particles').replaceChildren();$('.spark-stage').classList.remove('celebrate');},1450);
}
render();

document.addEventListener('click',event=>{const map=$('#prep-map');if(map.open&&!map.contains(event.target))map.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#prep-map').open){$('#prep-map').open=false;$('#prep-map>summary').focus();}});
