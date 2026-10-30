import {POINTS,create,predict,learn,replay,reward,restore,finish,selectMode} from './state.mjs';
import {mountLearning,learningItems} from '../pre-learning.mjs';
import {mountBlast} from '../pre-blast.mjs';
import {mountQuiz} from '../pre-quiz.mjs';
import {mountQuizReview} from '../pre-quiz-review.mjs';
mountLearning(document);
const $=s=>document.querySelector(s),sessionKey='wespark-listening-glass-pre-v1';
let saved;try{saved=JSON.parse(sessionStorage.getItem(sessionKey));}catch{}
let {state,step}=restore(saved);
let animationTimer,flightTimer,cleanupTimer,savingEnabled=true;
const game=mountBlast(document,{state:state.blast,onChange(value){state={...state,blast:value};save();},onComplete(){const earn=!state.awarded;state=reward(finish(state));render();$('#finish-title').focus();if(earn)celebrate();}});
const quizMode=mountQuiz(document,{state:state.quiz,onChange(value){state={...state,quiz:value};save();},onComplete(){const earn=!state.awarded;state=reward(finish(state,'quiz'));render();$('#finish-title').focus();if(earn)celebrate();}});
const answerReview=mountQuizReview(document,{onClose(){answerReview.close();$('#result-summary').hidden=false;$('#view-answers').setAttribute('aria-expanded','false');positionListening();$('#finish-title').focus();},onReplay:restartChallenge});
function positionListening(){const inside=state.challengeMode==='quiz'&&challengeComplete()&&!$('#result-summary').hidden;$(inside?'.result-actions':'main>footer.actions').append($('#listening'));}
function challengeComplete(){return state.challengeMode==='quiz'?state.quiz.phase==='complete':state.challengeMode==='game'&&state.blast.phase==='complete';}
function challengeFocus(){return challengeComplete()?'#finish-title':state.challengeMode==='quiz'?'#quiz-mode-title':state.challengeMode==='game'?'#quiz-title':'#challenge-mode-title';}
function save(){if(!savingEnabled)return;try{sessionStorage.setItem(sessionKey,JSON.stringify({version:3,state,step}));window.dispatchEvent(new window.Event('lesson-preparation-change'));}catch{}}
function showStep(n){if(n===1&&!state.prediction||n===2&&!state.learned)return;step=n;if(n===1)state=learn(state);render();$(step===0?'#context-title':step===1?'#learn-panel':challengeFocus()).focus();}
function render(){
 game.activate(step===2&&state.challengeMode==='game'&&!challengeComplete());quizMode.activate(step===2&&state.challengeMode==='quiz'&&!challengeComplete());save();document.body.dataset.preStep=String(step);document.body.dataset.challengeMode=state.challengeMode||'choose';if(step!==1)$('#vocab-audio').pause();
 const companion=$('[data-spark-slot]'),panel=$('[data-panel="'+step+'"]');if(companion.nextElementSibling!==panel)panel.before(companion);
 const completed=[!!state.prediction,state.learned,state.finished],done=completed.filter(Boolean).length;
 $('#stage-fill').style.setProperty('--route-fill',done/3);
 document.querySelectorAll('[data-panel]').forEach(e=>e.hidden=Number(e.dataset.panel)!==step);
 document.querySelectorAll('[data-step]').forEach(b=>{const n=Number(b.dataset.step),label=['Đoán ngữ cảnh','Học từ & câu','Thử sức'][n];b.disabled=n===1&&!state.prediction||n===2&&!state.learned;b.toggleAttribute('aria-current',n===step);if(n===step)b.setAttribute('aria-current','step');b.classList.toggle('done',completed[n]);b.setAttribute('aria-label',label+(completed[n]?(n===0?' · Đã dự đoán':' · Đã hoàn tất'):'')+(n===step?' · Đang xem':''));});
 document.querySelectorAll('[name="prediction"]').forEach(r=>r.checked=r.value===state.prediction);
 $('#balance').textContent=state.balance;$('#back').hidden=step===0;$('#library').hidden=step!==0;
 $('#primary').hidden=step===2;$('#listening').hidden=!(step===2&&state.finished);$('#action-note').textContent=step===2&&state.challengeMode?'Không có ngưỡng điểm để vào bài nghe.':'';
 if(step===0){$('#primary').textContent='Nạp từ vựng →';$('#primary').disabled=!state.prediction;}
 if(step===1){$('#primary').textContent='Sang Thử sức →';$('#primary').disabled=false;}
 answerReview.close();$('#result-summary').hidden=false;$('#reviews').hidden=true;$('#view-answers').setAttribute('aria-expanded','false');
 $('#challenge-selector').classList.toggle('has-mode',!!state.challengeMode);$('#challenge-mode-title').textContent=state.challengeMode?'Thử sức':'Bạn muốn thử sức theo cách nào?';document.querySelectorAll('[data-challenge-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.challengeChoice===state.challengeMode)));
 $('#challenge').hidden=state.challengeMode!=='game'||challengeComplete();$('#quiz-mode-pane').hidden=state.challengeMode!=='quiz'||challengeComplete();$('#completion').hidden=!challengeComplete();
 if(challengeComplete()){$('#finish-title').textContent=state.challengeMode==='quiz'?'Hoàn thành rồi!':'Sẵn sàng nghe rồi!';$('#view-answers-label').textContent=state.challengeMode==='quiz'?'Xem lại các câu':'Ôn lại từ và câu';$('#replay-label').textContent=state.challengeMode==='quiz'?'Làm lại Quiz':'Chơi lại Spark Vệ Binh';$('#score-summary').textContent=state.challengeMode==='quiz'?`${state.quiz.score} / 7 câu đúng`:state.blast.legacyComplete?'Đã hoàn tất ở phiên chuẩn bị trước. Bạn có thể chơi lại Spark Vệ Binh; SparkPoint đã nhận vẫn được giữ.':`${state.blast.score} điểm arcade · ${state.blast.misses.length} mục cần ôn · ${state.blast.assisted.length} mục từ vựng có hỗ trợ · ${state.blast.sentenceAssisted.length} mẫu câu có hỗ trợ. Điểm trò chơi không đánh giá năng lực.`;renderReviews();$('#reward-status').textContent=state.awarded?(state.challengeMode==='quiz'?`+${POINTS} SparkPoint · Đã nhận`:'SparkPoint đã được cộng cho lượt chuẩn bị này.'):'';}
 positionListening();
}
function renderReviews(){
 $('#reviews').replaceChildren();
 for(const item of learningItems){
  const details=document.createElement('details');details.className='review-row';const summary=document.createElement('summary');summary.textContent=item.title;
  const meaning=document.createElement('p');meaning.textContent=item.meaning;
  const example=document.createElement('p');example.lang='en';example.textContent=item.example;
  const translation=document.createElement('p');translation.textContent=item.translation;
  details.append(summary,meaning,example,translation);$('#reviews').append(details);
 }
}

document.querySelectorAll('[name="prediction"]').forEach(r=>r.addEventListener('change',()=>{state=predict(state,r.value);render();}));
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{if(Number(b.dataset.step)===2&&state.prediction&&!state.learned)state=learn(state);showStep(Number(b.dataset.step));}));
$('#back').addEventListener('click',()=>showStep(step-1));
$('#primary').addEventListener('click',()=>{if(step===0)showStep(1);else if(step===1){state=learn(state);showStep(2);}});
document.querySelectorAll('[data-challenge-choice]').forEach(b=>b.addEventListener('click',()=>{state=selectMode(state,b.dataset.challengeChoice);clearCelebration();render();$(challengeFocus()).focus();}));
function restartChallenge(){state=replay(state);if(state.challengeMode==='quiz')quizMode.reset(state.quiz);else game.reset(state.blast);clearCelebration();render();$(challengeFocus()).focus();}
$('#replay').addEventListener('click',restartChallenge);
$('#view-answers').addEventListener('click',()=>{if(state.challengeMode==='quiz'){$('#result-summary').hidden=true;positionListening();answerReview.open(state.quiz);$('#view-answers').setAttribute('aria-expanded','true');}else{$('#reviews').hidden=!$('#reviews').hidden;$('#view-answers').setAttribute('aria-expanded',String(!$('#reviews').hidden));}});
window.addEventListener('pagehide',()=>{try{if(sessionStorage.getItem(sessionKey)===null)savingEnabled=false;}catch{}game.pause();save();clearCelebration();});
window.addEventListener('pageshow',()=>{savingEnabled=true;});
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
