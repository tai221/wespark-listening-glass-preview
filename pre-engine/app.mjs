import {whileReward,dictationReward} from '../session.mjs';
import {rewardPoints,create,predict,learn,replay,reward,restore,finish,selectMode,assess,canListen,practiceIds,allAssessed,activeIds,selectedGroups,selectGroups} from './state.mjs';
import {mountLearning,learningItems} from '../pre-learning.mjs';
import {mountBlast} from '../pre-blast.mjs';
import {blastTargets,blastSentences} from '../pre-blast-state.mjs';
import {mountQuiz} from '../pre-quiz.mjs';
import {mountQuizReview} from '../pre-quiz-review.mjs';
import {mountStartTransition} from '../pre-start-transition.mjs';

const $=s=>document.querySelector(s),sessionKey='wespark-listening-glass-pre-v1';
const listeningIcon=document.createElement('span');listeningIcon.className='action-listen';listeningIcon.setAttribute('aria-hidden','true');
listeningIcon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12H3v7h4v-7H4Zm16 0h1v7h-4v-7h3Z"/></svg>';
$('#listening').replaceChildren(listeningIcon,document.createTextNode('Vào bài nghe'));

function primaryCopy(label,game=false){
 const text=document.createElement('span');text.textContent=label;
 const arrow=document.createElement('span');arrow.className='action-arrow';arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
 if(game){arrow.className='action-game';arrow.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 6h9a4 4 0 0 1 3.9 3.1l1.1 7.1a2.4 2.4 0 0 1-4 2.2L14.5 16h-5l-3 2.4a2.4 2.4 0 0 1-4-2.2l1.1-7.1A4 4 0 0 1 7.5 6Z"/><path d="M7.5 9.5v5m-2.5-2.5h5M16 10.5h.01M18 13h.01"/></svg>';$('#primary').replaceChildren(arrow,text);}else $('#primary').replaceChildren(text,arrow);
}

let saved;try{saved=JSON.parse(sessionStorage.getItem(sessionKey));}catch{}
let {state,step}=restore(saved);
const learning=mountLearning(document,learningItems,{assessments:state.assessments,onAssess(id,value){state=assess(state,id,value);quizMode.reset(state.quiz);game.reset(state.blast);clearCelebration();render();}});
let animationTimer,flightTimer,cleanupTimer,savingEnabled=true;
const game=mountBlast(document,{state:state.blast,onChange(value){state={...state,blast:value};save();},onComplete(){const earn=!state.awarded;state=reward(finish(state));render();$('#finish-title').focus();if(earn)celebrate();}});
const quizMode=mountQuiz(document,{state:state.quiz,onChange(value){state={...state,quiz:value};save();},onComplete(){const earn=!state.awarded;state=reward(finish(state,'quiz'));render();$('#finish-title').focus();if(earn)celebrate();}});
const answerReview=mountQuizReview(document,{onClose(){answerReview.close();$('#result-summary').hidden=false;$('#view-answers').setAttribute('aria-expanded','false');positionListening();$('#finish-title').focus();},onReplay:restartChallenge});
function positionListening(){const inside=step===2&&state.challengeMode==='quiz'&&challengeComplete()&&!$('#result-summary').hidden;$(inside?'.result-actions':'main>footer.actions').append($('#listening'));}
function challengeComplete(){return !!activeIds(state).length&&(state.challengeMode==='quiz'?state.quiz.phase==='complete':state.challengeMode==='game'&&state.blast.phase==='complete');}
function challengeFocus(){return challengeComplete()?'#finish-title':state.challengeMode==='quiz'?'#quiz-mode-title':state.challengeMode==='game'?'#quiz-title':'#challenge-mode-title';}
function save(){if(!savingEnabled)return;try{sessionStorage.setItem(sessionKey,JSON.stringify({version:5,state,step}));window.dispatchEvent(new window.Event('lesson-preparation-change'));}catch{}}
function showStep(n){if(n===1&&!state.prediction||n===2&&(!state.learned||!activeIds(state).length))return;step=n;if(n===1&&allAssessed(state))learning.showSummary();render();$(step===0?'#context-title':step===1?'#learn-panel':challengeFocus()).focus();}
function render(){
 game.activate(step===2&&state.challengeMode==='game'&&!challengeComplete());quizMode.activate(step===2&&state.challengeMode==='quiz'&&!challengeComplete());save();document.body.dataset.preStep=String(step);document.body.dataset.challengeMode=state.challengeMode||'choose';if(step!==1)$('#vocab-audio').pause();
 const companion=$('[data-spark-slot]'),panel=$('[data-panel="'+step+'"]');if(companion.nextElementSibling!==panel)panel.before(companion);
 $(step===1?'#recall-summary-actions':'main>footer.actions').append($('#primary'));
 const invitation=$('#recall-invitation');invitation.hidden=step!==1;invitation.textContent=state.finished?'Ôn thêm hoặc vào bài nghe nhé!':practiceIds(state).length?`Còn ${practiceIds(state).length} mục cần luyện — cùng ôn cho nhớ hơn nhé! Hoàn thành Quiz hoặc Game để vào bài nghe.`:'Bạn đã đánh dấu nhớ tất cả. Có thể luyện thêm Quiz / Game hoặc vào bài nghe.';
 const needed=practiceIds(state);
 const selected=selectedGroups(state),count=activeIds(state).length;
 document.querySelectorAll('[data-challenge-group]').forEach(input=>{const group=input.dataset.challengeGroup,total=learningItems.filter(item=>state.assessments[item.id]===group).length;input.checked=selected.includes(group)&&total>0;input.disabled=!total;input.closest('label').querySelector('[data-group-count]').textContent=String(total);input.closest('label').style.setProperty('--scope-share',String(total/learningItems.length));});
 $('#challenge-scope-status').classList.remove('sr-only');
 $('#challenge-scope-status').textContent=count?`Đã chọn ${count} mục`:'Chọn ít nhất một nhóm để bắt đầu';
 $('#challenge-scope-hint').textContent='Có thể chọn cả hai';
 document.querySelectorAll('[data-challenge-choice]').forEach(button=>button.disabled=!count);
 $('#recall-summary-title').textContent=state.finished?'Ôn thêm một lượt nhé!':needed.length?`Còn ${needed.length} mục cần luyện`:'Bạn đã nhớ tất cả!';
 const terms=$('#recall-summary-terms');terms.hidden=!needed.length||state.finished;terms.textContent=learningItems.filter(item=>needed.includes(item.id)).map(item=>item.label||item.title).join(' · ');
 if(!allAssessed(state)){const remaining=learningItems.filter(item=>!state.assessments[item.id]);$('#recall-summary-title').textContent=`Còn ${remaining.length} mục chưa đánh dấu`;invitation.textContent='Chọn trạng thái cho các mục còn lại để tiếp tục.';terms.hidden=false;terms.textContent=remaining.map(item=>item.label||item.title).join(' · ');}
 else invitation.textContent='Chọn một hoặc cả hai nhóm để ôn tập.';
 const targets=blastTargets(state.blast),sentences=blastSentences(state.blast),words=targets.filter(x=>x.kind==='meaning').length,audio=targets.filter(x=>x.kind==='audio').length;
 const phases=[words?`${words} cụm từ`:null,audio?`${audio} lượt nghe`:null,sentences.length?`${sentences.length} mẫu câu`:null].filter(Boolean).join(' · ');
 $('[data-challenge-choice="quiz"] small').textContent=`${state.quiz.ids.length} câu hỏi · Ôn theo nhịp của bạn`;
 $('[data-challenge-choice="game"] small').textContent=phases;
 $('.challenge-selector-heading p').textContent=canListen(state)?'Ôn thêm một lượt hoặc tiếp tục vào bài nghe.':'Chọn một cách ôn để sẵn sàng vào bài nghe.';
 $('.blast-badge').textContent=`${targets.length+sentences.length} mục tiêu`;
 $('#blast-ready-summary').textContent=phases;
 $('#blast-ready h2').innerHTML=words?'Nhớ từ.<br>Gõ đúng.<br><em>Khai hỏa!</em>':'Nhớ mẫu câu.<br><em>Cùng luyện!</em>';
 $('.blast-ready-tip').textContent=words?'Gõ đáp án để Spark tự bắn.':'Điền cụm từ còn thiếu, dùng gợi ý khi cần.';
 $('#blast-reviewed').textContent=sentences.length?`Chặng cuối · ${sentences.length} mẫu câu →`:'Hoàn tất →';
 $('#blast-review-description').textContent=sentences.length?'Nghe và nhớ lại các cụm từ trước khi luyện mẫu câu.':'Nghe và nhớ lại các cụm từ trước khi hoàn tất.';
 const completed=[!!state.prediction,state.learned,canListen(state)],done=completed.filter(Boolean).length;
 $('#stage-fill').style.setProperty('--route-fill',done/3);
 document.querySelectorAll('[data-panel]').forEach(e=>e.hidden=Number(e.dataset.panel)!==step);
 document.querySelectorAll('[data-step]').forEach(b=>{const n=Number(b.dataset.step),label=['Đoán ngữ cảnh','Học từ & câu','Thử sức'][n];b.disabled=n===1&&!state.prediction||n===2&&(!state.learned||!activeIds(state).length);b.toggleAttribute('aria-current',n===step);if(n===step)b.setAttribute('aria-current','step');b.classList.toggle('done',completed[n]);b.setAttribute('aria-label',label+(completed[n]?(n===0?' · Đã dự đoán':' · Đã hoàn tất'):'')+(n===step?' · Đang xem':''));});
 document.querySelectorAll('[name="prediction"]').forEach(r=>r.checked=r.value===state.prediction);
 $('#balance').textContent=walletBalance();$('#back').hidden=step===0;$('#library').hidden=step!==0;
 const playing=step===2&&!!state.challengeMode&&!challengeComplete();
 $('.challenge-mode-options').hidden=playing;
 $('#primary').hidden=step===2||step===1&&!allAssessed(state);$('#primary').classList.add('primary');$('#listening').hidden=step!==2||!canListen(state)||playing;$('#action-note').textContent=step===2&&state.challengeMode?'Không có ngưỡng điểm để vào bài nghe.':'';
 if(step===0){primaryCopy('Nạp từ vựng');$('#primary').disabled=!state.prediction;}
 if(step===1){primaryCopy(state.learned?'Quiz/Game':'Chọn Cần luyện hoặc Đã nhớ cho từng mục',state.learned);$('#primary').disabled=!state.learned||!count;}
 answerReview.close();$('#result-summary').hidden=false;$('#reviews').hidden=true;$('#view-answers').setAttribute('aria-expanded','false');
 $('#challenge-selector').classList.toggle('has-mode',!!state.challengeMode);$('#challenge-mode-title').textContent=state.challengeMode?'Thử sức':'Bạn muốn thử sức theo cách nào?';document.querySelectorAll('[data-challenge-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.challengeChoice===state.challengeMode)));
 $('#challenge').hidden=state.challengeMode!=='game'||challengeComplete();$('#quiz-mode-pane').hidden=state.challengeMode!=='quiz'||challengeComplete();$('#completion').hidden=!challengeComplete();
 if(challengeComplete()){$('#reward-pop').firstChild.textContent=`+${rewardPoints(state)}`;$('#finish-title').textContent=state.challengeMode==='quiz'?'Hoàn thành rồi!':'Sẵn sàng nghe rồi!';$('#view-answers-label').textContent=state.challengeMode==='quiz'?'Xem lại các câu':'Ôn lại từ và câu';$('#replay-label').textContent=state.challengeMode==='quiz'?'Làm lại Quiz':'Chơi lại Spark Vệ Binh';$('#score-summary').textContent=state.challengeMode==='quiz'?`${state.quiz.score} / ${state.quiz.answers.length} câu đúng`:state.blast.legacyComplete?'Đã hoàn tất ở phiên chuẩn bị trước. Bạn có thể chơi lại Spark Vệ Binh; Điểm đã nhận vẫn được giữ.':`${state.blast.score} điểm arcade · ${state.blast.misses.length} mục cần ôn · ${state.blast.assisted.length} mục từ vựng có hỗ trợ · ${state.blast.sentenceAssisted.length} mẫu câu có hỗ trợ. Điểm trò chơi không đánh giá năng lực.`;renderReviews();if(state.awarded)renderRewardStatus();else clearRewardStatus();}
 positionListening();
}
function renderReviews(){
 $('#reviews').replaceChildren();
 for(const item of learningItems.filter(item=>state.blast.ids.includes(item.id))){
  const details=document.createElement('details');details.className='review-row';const summary=document.createElement('summary');summary.textContent=item.title;
  const meaning=document.createElement('p');meaning.textContent=item.meaning;
  const example=document.createElement('p');example.lang='en';example.textContent=item.example;
  const translation=document.createElement('p');translation.textContent=item.translation;
  details.append(summary,meaning,example,translation);$('#reviews').append(details);
 }
}

document.querySelectorAll('[name="prediction"]').forEach(r=>r.addEventListener('change',()=>{state=predict(state,r.value);render();}));
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{showStep(Number(b.dataset.step));}));
$('#back').addEventListener('click',()=>showStep(step-1));
$('#primary').addEventListener('click',()=>{if(step===0)showStep(1);else if(step===1&&allAssessed(state)&&activeIds(state).length){state=learn(state);showStep(2);}});
document.querySelectorAll('[data-challenge-group]').forEach(input=>input.addEventListener('change',()=>{game.pause();state=selectGroups(state,[...document.querySelectorAll('[data-challenge-group]:checked')].map(x=>x.dataset.challengeGroup));quizMode.reset(state.quiz);game.reset(state.blast);clearCelebration();render();}));
const startTransition=mountStartTransition(document);
document.querySelectorAll('[data-challenge-choice]').forEach(b=>b.addEventListener('click',()=>{if(!activeIds(state).length)return;const mode=b.dataset.challengeChoice;const open=()=>{state=selectMode(state,mode);clearCelebration();render();};if(state.challengeMode){open();$(challengeFocus()).focus();}else startTransition(open,()=>$(challengeFocus()).focus());}));
function restartChallenge(){state=replay(state);if(state.challengeMode==='quiz')quizMode.reset(state.quiz);else game.reset(state.blast);clearCelebration();render();$(challengeFocus()).focus();}
$('#replay').addEventListener('click',restartChallenge);
$('#view-answers').addEventListener('click',()=>{if(state.challengeMode==='quiz'){$('#result-summary').hidden=true;positionListening();answerReview.open(state.quiz);$('#view-answers').setAttribute('aria-expanded','true');}else{$('#reviews').hidden=!$('#reviews').hidden;$('#view-answers').setAttribute('aria-expanded',String(!$('#reviews').hidden));}});
window.addEventListener('pagehide',()=>{try{if(sessionStorage.getItem(sessionKey)===null)savingEnabled=false;}catch{}game.pause();save();clearCelebration();});
window.addEventListener('pageshow',()=>{savingEnabled=true;});
function clearRewardStatus(){const status=$('#reward-status');status.replaceChildren();status.removeAttribute('aria-label');}
function renderRewardStatus(){
 const status=$('#reward-status'),points=rewardPoints(state),label=`Đã nhận ${points} SparkPoint`;
 if(status.getAttribute('aria-label')===label&&status.childElementCount)return;
 const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.innerHTML='<path d="m14 2-9 12h7l-2 8 9-12h-7l2-8Z"/>';
 const amount=document.createElement('strong');amount.textContent=`+${points}`;const received=document.createElement('span');received.textContent='Đã nhận';
 status.setAttribute('aria-label',label);status.setAttribute('aria-atomic','true');status.replaceChildren(icon,amount,received);
}
function walletBalance(){return state.balance+whileReward()+dictationReward();}
function clearCelebration(){clearTimeout(animationTimer);clearTimeout(flightTimer);clearTimeout(cleanupTimer);$('#particles').replaceChildren();$('.spark-stage').classList.remove('celebrate');$('#wallet').classList.remove('wallet-pulse');$('#balance').textContent=walletBalance();}
function stopRewardMotion(){
 clearCelebration();
 if(state.finished&&state.awarded)renderRewardStatus();
}
window.addEventListener('glass-motion-change',event=>{
 if(!event.detail.enabled||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.dataset.sparkLegacyMotion==='false')stopRewardMotion();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRewardMotion();});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(event.matches)stopRewardMotion();});
function celebrate(){
 clearCelebration();clearRewardStatus();$('.spark-stage').classList.add('celebrate');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.dataset.glassMotion!=='true';
 if(reduced||rewardPoints(state)===0){$('#balance').textContent=walletBalance();renderRewardStatus();return;}
 $('#balance').textContent=walletBalance()-rewardPoints(state);
 const from=$('#spark').getBoundingClientRect(),to=$('#wallet').getBoundingClientRect();
 for(let i=0;i<9;i++){
  const el=document.createElement('span');el.className='flying-spark';el.textContent='ϟ';el.style.left=`${from.x+from.width/2}px`;el.style.top=`${from.y+from.height/2}px`;$('#particles').append(el);
  const dx=to.x+to.width/2-(from.x+from.width/2),dy=to.y+to.height/2-(from.y+from.height/2);
  const angle=i/9*Math.PI*2;
  el.animate([{transform:'translate(-50%,-50%) scale(.1)',opacity:0},{transform:`translate(${Math.cos(angle)*65}px,${Math.sin(angle)*55}px) scale(1.15)`,opacity:1,offset:.32},{transform:`translate(${dx}px,${dy}px) scale(.35)`,opacity:0}],{duration:950,delay:i*24,easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'});
 }
 flightTimer=setTimeout(()=>{
  $('#wallet').classList.add('wallet-pulse');let n=walletBalance()-rewardPoints(state);
  const count=()=>{n=Math.min(walletBalance(),n+1);$('#balance').textContent=n;if(n<walletBalance())animationTimer=setTimeout(count,23);else renderRewardStatus();};count();
 },850);
 cleanupTimer=setTimeout(()=>{$('#particles').replaceChildren();$('.spark-stage').classList.remove('celebrate');},1450);
}

render();
