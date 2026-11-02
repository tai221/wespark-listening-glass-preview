import {read,write,balance,hydrate} from './session.mjs';
import {DICTATION_UNITS} from './dictation-lesson.mjs';
import {restoreDictation,createDictation,kindLabels} from './dictation-state.mjs';
import {resultSummary} from './dictation-result-state.mjs';
const $=s=>document.querySelector(s);
const initial=read();if(!initial.dictationRun?.id&&resultSummary(initial).complete){const restored=restoreDictation(initial.dictation),ids=new Set(Array.isArray(initial.dictationRewards)?initial.dictationRewards:[]);write({dictationRun:{id:`dictation-migrated-${Date.now()}`,earnedIds:DICTATION_UNITS.filter(u=>ids.has(u.id)&&restored.done[u.id]?.kind!=='assisted').map(u=>u.id),celebrated:false}});}
const saved=read(),summary=resultSummary(saved),state=restoreDictation(saved.dictation);
const audio=document.createElement('audio');let playingId=null,playRequest=0,animation=null,frame=null,finished=false;
const bolt='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 2-9 12h7l-2 8 9-12h-7l2-8Z"/></svg>';
if(!summary.complete){location.replace('dictation.html');}else{
 $('#content').hidden=false;$('#completion-count').textContent=`${summary.done} / ${DICTATION_UNITS.length}`;
 for(const key of ['first','corrected','assisted'])$('#stat-'+key).textContent=String(summary[key]);
 $('#completion-points').textContent=`+${summary.points}`;$('#completion-reward-copy').textContent=summary.points?'SparkPoint nhận được':'Một lượt luyện đã hoàn thành';
 $('#completion-reward-status').textContent=summary.points?'Đã cộng vào tổng SparkPoint':'Tiếp tục luyện theo nhịp của bạn';
 $('#review-results').textContent=`Xem lại ${DICTATION_UNITS.length} câu`;
 $('#completion-heading').focus({preventScroll:true});
 buildReview();
 // Points were credited while practising. This is a presentation-only transfer.
 if(summary.shouldCelebrate){write({dictationRun:{...read().dictationRun,celebrated:true}});requestAnimationFrame(()=>requestAnimationFrame(celebrateReward));}
}
function buildReview(){
 const list=$('#completion-review-list');
 for(const [index,unit] of DICTATION_UNITS.entries()){
  const row=document.createElement('article');row.className='completion-review-row';
  const number=document.createElement('span');number.className='completion-review-number';number.textContent=String(index+1).padStart(2,'0');
  const copy=document.createElement('div'),label=document.createElement('span'),text=document.createElement('p'),translation=document.createElement('p');label.className='completion-review-kind';label.textContent=kindLabels[state.done[unit.id].kind];text.lang='en';text.className='completion-review-sentence';text.textContent=unit.text;translation.className='completion-review-translation';translation.textContent=unit.translation;copy.append(label,text,translation);
  const actions=document.createElement('div');actions.className='completion-review-actions';const play=document.createElement('button');play.type='button';play.dataset.reviewPlay=unit.id;play.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>';play.setAttribute('aria-label',`Nghe lại câu ${index+1}`);play.setAttribute('aria-pressed','false');play.addEventListener('click',()=>playReview(unit));
  const edit=document.createElement('a');edit.href=`dictation.html?review=${unit.id}`;edit.textContent='Luyện câu này';actions.append(play,edit);row.append(number,copy,actions);list.append(row);
 }
}
function syncAudio(){document.querySelectorAll('[data-review-play]').forEach(button=>{const playing=button.dataset.reviewPlay===playingId&&!audio.paused;button.setAttribute('aria-pressed',String(playing));});}
async function playReview(unit){
 const request=++playRequest;if(playingId===unit.id&&!audio.paused){audio.pause();syncAudio();return;}
 audio.pause();audio.src=unit.audio;playingId=unit.id;$('#review-audio-status').textContent='';
 try{await audio.play();if(request===playRequest)syncAudio();}catch{if(request===playRequest){playingId=null;syncAudio();$('#review-audio-status').textContent='Chưa phát được câu này. Hãy thử lại.';}}
}
audio.addEventListener('ended',()=>{playingId=null;syncAudio();});
$('#review-results').addEventListener('click',()=>{const open=$('#completion-review').hidden;$('#completion-review').hidden=!open;$('#review-results').setAttribute('aria-expanded',String(open));$('#review-results').textContent=open?'Thu gọn phần xem lại':`Xem lại ${DICTATION_UNITS.length} câu`;if(!open){playRequest++;audio.pause();syncAudio();}else $('#completion-review').scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
$('#completion-replay').addEventListener('click',()=>$('#completion-replay-dialog').showModal());
$('#completion-replay-dialog').addEventListener('close',()=>{if($('#completion-replay-dialog').returnValue!=='confirm')return;finishReward();audio.pause();const fresh=createDictation();fresh.mode=state.mode;fresh.speed=state.speed;fresh.loop=state.loop;write({dictation:fresh,dictationRun:{id:`dictation-${Date.now()}-${Math.random().toString(36).slice(2)}`,earnedIds:[],celebrated:false},post:{...read().post,complete:read().post.complete.filter(activity=>activity!=='dictation')}});location.href='dictation.html';});
function motionEnabled(){return document.body.dataset.glassMotion==='true'&&!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
function finishReward(){if(finished)return;finished=true;if(frame)cancelAnimationFrame(frame);animation?.cancel();document.querySelectorAll('.completion-point-flight').forEach(el=>el.remove());hydrate();if(summary.points){$('#completion-reward-status').textContent='Đã cộng vào tổng SparkPoint';$('#completion-announcement').textContent=`Đã nhận ${summary.points} SparkPoint. Tổng ${balance()} SparkPoint.`;}}
function celebrateReward(){
 if(!motionEnabled()){finishReward();return;}
 const wallet=$('.header [data-balance]'),from=$('#completion-reward').getBoundingClientRect(),to=wallet?.getBoundingClientRect();if(!wallet||!to||from.top>innerHeight||from.bottom<0){finishReward();return;}
 const finalBalance=balance(),startBalance=finalBalance-summary.points;wallet.textContent=String(startBalance);$('#completion-reward-status').textContent='Đang cộng vào tổng SparkPoint';
 const flight=document.createElement('span');flight.className='completion-point-flight';flight.setAttribute('aria-hidden','true');flight.innerHTML=bolt+`<strong>+${summary.points}</strong>`;flight.style.left=`${from.x+from.width/2}px`;flight.style.top=`${from.y+from.height/2}px`;document.body.append(flight);
 if(!flight.animate){finishReward();return;}
 animation=flight.animate([{transform:'translate(-50%,-50%) scale(.8)',opacity:0},{transform:'translate(-50%,-85%) scale(1.1)',opacity:1,offset:.2},{transform:`translate(${to.x+to.width/2-from.x-from.width/2}px,${to.y+to.height/2-from.y-from.height/2}px) scale(.5)`,opacity:0}],{duration:1050,easing:'cubic-bezier(.22,.7,.3,1)'});
 const start=performance.now();const tick=now=>{if(finished)return;const progress=Math.min(1,(now-start)/1050);wallet.textContent=String(startBalance+Math.round(summary.points*progress));if(progress<1)frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);animation.onfinish=finishReward;
}
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(event.matches)finishReward();});window.addEventListener('glass-motion-change',event=>{if(!event.detail.enabled)finishReward();});document.addEventListener('visibilitychange',()=>{if(document.hidden){finishReward();audio.pause();syncAudio();}});window.addEventListener('pagehide',()=>{finishReward();audio.pause();});
