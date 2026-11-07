import {mountSparkDialogue} from './speaking-spark-dialogue.mjs';
import {items,quizChoices,readState,saveState,reviewIds,startQuiz,answerQuiz,nextQuiz} from './speaking-learning-state.mjs';
import {learningScaffold} from './speaking-learning-scaffold.mjs';
import {mountLearning} from './speaking-learning-renderer.mjs';
import {createEffectPlayer} from '../ui-sound.mjs';
const art='../assets/';
const paths={mindmap:'M12 3v7m0 4v7M5 10h14M5 10v5m14-5v5M9 3h6v4H9zM2 15h6v5H2zM16 15h6v5h-6z',game:'M7 7h10c4 0 6 12 3 13-2 0-3-4-5-4H9c-2 0-3 4-5 4C1 19 3 7 7 7Zm0 3v5m-2-2h4m7-2h.01m2 3h.01',forward:'M5 12h14m-6-6 6 6-6 6',book:'M12 5c-4-3-8-2-9-1v15c3-2 6-2 9 0 3-2 6-2 9 0V4c-3-2-6-2-9 1Zm0 0v14',retry:'M3 10a9 9 0 1 1 1 8M3 4v6h6'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;}
function button(label,handler,{primary=false,glyph,noArrow=false}={}){const el=node('button',`button${primary?' primary':''}`);el.type='button';if(noArrow)el.dataset.noArrow='';if(glyph)el.innerHTML=icon(glyph);el.append(node('span','',label));el.addEventListener('click',handler);return el;}
function continuation(primary=true){const a=node('a',`button${primary?' primary':''}`);a.href='key-speaking-mindmap.html';a.dataset.noArrow='';a.innerHTML=icon('mindmap')+'<span>Sắp xếp ý</span>';return a;}
export const learningGuideText='Cùng học từ và câu nhé. Chọn cần luyện hoặc đã nhớ cho từng mục, rồi mình cùng ôn lại.';
export async function mountLearningGuide(document,slot){
 try{
  const response=await document.defaultView.fetch('../assets/spark-voice/manifest.json');if(!response.ok||!slot.isConnected)return;
  const {learning}=await response.json();if(!learning)return;
  const reduced=document.defaultView.matchMedia('(prefers-reduced-motion: reduce)');
  let introPresented=false;try{introPresented=document.defaultView.sessionStorage.getItem('wespark-speaking-hometown-learning-intro-v1')==='presented';document.defaultView.sessionStorage.setItem('wespark-speaking-hometown-learning-intro-v1','presented');}catch{}
  const dialogue=mountSparkDialogue(document,{slot,autoPlay:!introPresented,clips:{learning:{...learning,src:'../'+learning.src}},motionAllowed:()=>!reduced.matches&&document.body.dataset.glassMotion!=='false'});
  reduced.addEventListener('change',()=>dialogue.refresh());document.defaultView.addEventListener('glass-motion-change',()=>dialogue.refresh());
  dialogue.activate(true,'learning');return dialogue;
 }catch{/* Text and the static portrait remain readable if the voice manifest is unavailable. */}
}
export function mountSpeakingPreparation(main,file){
 document.title=file.includes('vocabulary')?'WeSpark · Học từ, cụm từ & mẫu câu':'WeSpark · Quiz/Game';
 document.body.dataset.speakingPreparation=file.includes('vocabulary')?'learning':'quiz';
 document.body.dataset.preStep=file.includes('vocabulary')?'1':'2';document.body.dataset.sparkPage='pre';
 const style=node('link');style.rel='stylesheet';style.href='speaking-preparation.css';document.head.append(style);
 // Keep original fixture assets and module hooks; compose only this route's content.
 main.parentElement.querySelector(':scope > .footer')?.remove();
 let state=readState(sessionStorage);const persist=()=>saveState(sessionStorage,state);
 if(file.includes('vocabulary')){
  main.innerHTML=learningScaffold+'<p id="recall-invitation" class="recall-invitation"></p><audio id="vocab-audio" preload="none"></audio>';
  const learningGuide=node('aside','speaking-learning-guide');learningGuide.dataset.sparkSlot='';learningGuide.setAttribute('aria-label','Spark đồng hành');learningGuide.innerHTML=`<div class="spark-portrait"><img src="${art}spark-reading.webp" width="84" height="84" alt="Spark"></div><div class="spark-message"><p data-spark-copy aria-live="polite" aria-atomic="true"></p></div>`;learningGuide.querySelector('p').textContent=learningGuideText;main.prepend(learningGuide);mountLearningGuide(document,learningGuide);
  let initialized=false;
  const mounted=mountLearning(document,items,{assessments:state.assessments,selectedId:state.selected,onChoose:id=>{state.selected=id;persist();},onAssess:(id,value)=>{state.assessments={...mounted.getAssessments()};persist();updateSummary();}});
  const actions=document.querySelector('#recall-summary-actions');
  const row=node('div','speaking-summary-buttons');
  const quiz=button('Quiz/Game',()=>{const ids=reviewIds(state);if(!ids.length)return;state={...state,quiz:null};persist();location.href='key-speaking-game.html';},{glyph:'game',noArrow:true});
  row.append(quiz);actions.append(row);
  function updateSummary(){
   const practice=items.filter(item=>state.assessments[item.id]==='practice').length;
   document.querySelector('#recall-summary-title').textContent=practice?`Còn ${practice} mục cần luyện`:'Bạn đã nhớ tất cả!';
   document.querySelector('#recall-invitation').textContent=practice?'Ôn một lượt cho nhớ hơn nhé!':'Ôn thêm với Quiz nhé.';
   document.querySelectorAll('[data-challenge-group]').forEach(input=>{
    const count=items.filter(item=>state.assessments[item.id]===input.dataset.challengeGroup).length;
    input.disabled=!count;input.checked=count>0&&state.groups.includes(input.dataset.challengeGroup);
    input.closest('label').querySelector('[data-group-count]').textContent=count;
   });
   // Only initialize default groups once: later changes remain learner choices.
   if(!initialized&&state.groups.length>0&&items.every(item=>state.assessments[item.id])&&reviewIds(state).length===0){state.groups=[practice?'practice':'remembered'];initialized=true;updateSummary();persist();return;}if(items.every(item=>state.assessments[item.id]))initialized=true;
   const count=reviewIds(state).length;quiz.disabled=!count;
   document.querySelector('#challenge-scope-status').textContent=count?`${count} mục trong lượt ôn`:'Chọn ít nhất một nhóm để ôn tập.';
   quiz.classList.add('primary');
  }
  document.querySelectorAll('[data-challenge-group]').forEach(input=>input.addEventListener('change',()=>{state.groups=[...document.querySelectorAll('[data-challenge-group]:checked')].map(input=>input.dataset.challengeGroup);persist();updateSummary();}));
  updateSummary();return;
 }
 main.replaceChildren();
 const quizReduced=document.defaultView.matchMedia('(prefers-reduced-motion: reduce)'),quizCanMove=()=>document.body.dataset.glassMotion!=='false'&&!quizReduced.matches;const refreshQuizMotion=()=>{const spark=pane.querySelector('.quiz-spark-guide');if(spark)spark.dataset.dialogueMoving=String(quizCanMove());};quizReduced.addEventListener('change',refreshQuizMotion);document.defaultView.addEventListener('glass-motion-change',refreshQuizMotion);
 const chooser=node('div','challenge-selector');chooser.id='challenge-selector';
 chooser.innerHTML=`<div class="challenge-selector-heading"><h2 id="challenge-mode-title">Bạn muốn thử sức theo cách nào?</h2><p>Ôn từ, cụm từ và mẫu câu trước khi vào bài nói.</p></div><div class="challenge-mode-options" role="group" aria-label="Chọn Quiz hoặc Game"><button type="button" data-challenge-choice="quiz" aria-pressed="false"><img src="${art}spark-journey/prepare-v1.webp" width="80" height="80" alt=""><span><strong>Quiz</strong><small>Ôn theo nhịp của bạn</small></span>${icon('forward')}</button><button type="button" data-challenge-choice="game" disabled><img src="${art}blast-spark-pilot.webp" width="80" height="80" alt=""><span><strong>Game <em>Sắp có</em></strong><small>Trò chơi riêng cho Speaking sẽ ra mắt sau.</small></span></button></div>`;
 const pane=node('section');pane.id='quiz-mode-pane';pane.hidden=true;pane.setAttribute('aria-labelledby','quiz-mode-title');
 const result=node('section','speaking-quiz-result');result.hidden=true;result.setAttribute('aria-labelledby','speaking-result-title');
 const bottom=node('div','speaking-quiz-continuation');bottom.append(continuation());main.append(chooser,pane,result,bottom);
 const sound=createEffectPlayer(document,{correct:art+'quiz-audio/quiz-correct.wav',incorrect:art+'quiz-audio/quiz-incorrect.wav',complete:art+'quiz-audio/quiz-celebrate.wav'});document.body.append(...sound.sounds);
 function newQuizIds(){const ids=reviewIds(state);return ids.length?ids:items.every(item=>state.assessments[item.id])?[]:items.map(item=>item.id);}
 function activate(){if(!state.quiz?.ids.length){const ids=newQuizIds();if(!ids.length)return;state=startQuiz(state,ids);persist();}render();}
 const quizChoice=chooser.querySelector('[data-challenge-choice="quiz"]'),chosenIds=state.quiz?.ids||newQuizIds();quizChoice.querySelector('small').textContent=`${chosenIds.length} mục · Ôn theo nhịp của bạn`;if(!state.quiz&&!chosenIds.length){quizChoice.disabled=true;quizChoice.querySelector('small').textContent='Chọn nhóm ôn ở màn học từ & cụm từ.';}quizChoice.addEventListener('click',activate);
 function render(){
  if(state.quiz.complete){showResult();return;}
  chooser.hidden=false;chooser.classList.add('has-mode');chooser.querySelector('[data-challenge-choice="quiz"]').setAttribute('aria-pressed','true');
  chooser.querySelector('.challenge-selector-heading h2').textContent='Quiz · Ôn từ & mẫu câu';
  pane.hidden=false;result.hidden=true;bottom.hidden=true;
  const q=state.quiz,item=items.find(item=>item.id===q.ids[q.index]),answer=q.answers[q.index],checked=!!answer;
  // Stable rotation supplies every phrase as a plausible meaning distractor over the lesson.
  const choices=quizChoices(item.id);
  pane.replaceChildren();
  const count=node('div','prep-quiz-meta',`Câu ${q.index+1} / ${q.ids.length}`);const track=node('div','prep-quiz-track');track.setAttribute('role','progressbar');track.setAttribute('aria-label','Số câu đã trả lời');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',q.ids.length);track.setAttribute('aria-valuenow',q.answers.length);const fill=node('span');fill.style.width=`${q.answers.length/q.ids.length*100}%`;track.append(fill);
  const title=node('h2');title.id='quiz-mode-title';title.tabIndex=-1;const term=node('span','',item.title);term.lang='en';title.append('“',term,'” có nghĩa là gì?');
  const fieldset=node('fieldset','prep-quiz-fieldset');fieldset.append(node('legend','sr-only','Chọn một đáp án'));const options=node('div','prep-quiz-options');fieldset.append(options);
  choices.forEach(choice=>{const option=node('button','prep-quiz-option');option.type='button';option.dataset.quizAnswer=choice.id;option.disabled=checked;
   const indicator=node('span','prep-quiz-indicator');indicator.setAttribute('aria-hidden','true');if(checked&&(choice.id===item.id||choice.id===answer)){const correct=choice.id===item.id;indicator.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="${correct?'m8 12 3 3 5-6':'m9 9 6 6m0-6-6 6'}"/></svg>`;}option.append(indicator,node('span','prep-quiz-option-copy',choice.meaning));
   if(checked&&choice.id===item.id){option.classList.add('correct');option.setAttribute('aria-label',`${choice.meaning} · Đáp án đúng`);}else if(checked&&choice.id===answer){option.classList.add('wrong');option.setAttribute('aria-label',`${choice.meaning} · Bạn chọn, chưa đúng`);}
   option.addEventListener('click',()=>{state=answerQuiz(state,choice.id);persist();sound.play(choice.id===item.id?'correct':'incorrect');render();pane.querySelector('[data-page-navigation]').focus();});options.append(option);
  });
  const feedback=node('div','prep-quiz-feedback');feedback.setAttribute('role','status');feedback.hidden=!checked;
  if(checked)feedback.append(node('strong','',answer===item.id?'Đúng rồi.':'Nhớ điểm này nhé.'),node('p','',`Đáp án: ${item.meaning}.`),node('p','',item.example));
  const footer=node('div','prep-quiz-actions'),next=button(q.index===q.ids.length-1?'Hoàn tất Quiz':'Câu tiếp',()=>{state=nextQuiz(state);persist();if(state.quiz.complete)sound.play('complete');render();(pane.hidden?result.querySelector('h2'):pane.querySelector('h2')).focus();},{primary:true});next.dataset.pageNavigation='next';next.disabled=!checked;footer.append(next);
  const body=node('div','prep-quiz-body'),question=node('div','prep-quiz-question'),content=node('div','prep-quiz-question-content'),spark=node('aside','quiz-spark-guide');spark.setAttribute('aria-label','Spark đồng hành');spark.dataset.dialogueState='idle';spark.dataset.dialogueMoving=String(quizCanMove());spark.innerHTML=`<div class="spark-message"><p>Chọn nghĩa phù hợp với từ, cụm từ hoặc mẫu câu. Cứ theo nhịp của bạn nhé.</p></div><div class="spark-portrait"><img src="${art}spark-talk-rest-v1.webp" width="96" height="96" alt="Spark"></div>`;content.append(title,fieldset,feedback);question.append(content,footer);body.append(spark,question);pane.append(count,track,body);
 }
 function showResult(){
  chooser.hidden=true;pane.hidden=true;bottom.hidden=true;result.hidden=false;
  const q=state.quiz,score=q.ids.filter((id,index)=>q.answers[index]===id).length;
  result.innerHTML=`<div class="speaking-result-hero"><div><h2 id="speaking-result-title" tabindex="-1">Bạn đã hoàn tất Quiz!</h2><p class="speaking-result-score">${score} / ${q.ids.length} câu đúng</p><p>Mang những từ và cụm từ vừa ôn vào bài nói nhé.</p></div><img src="${art}spark-celebrate.webp" width="170" height="170" alt="Spark ăn mừng"></div>`;
  const review=node('div','speaking-answer-review');review.hidden=true;
  q.ids.forEach((id,index)=>{const item=items.find(item=>item.id===id),answer=items.find(item=>item.id===q.answers[index]),card=node('article');card.append(node('h3','',item.title),node('p','',`Bạn chọn: ${answer.meaning}${answer.id===id?' · Đúng':' · Chưa đúng'}`),node('p','',`Đáp án đúng: ${item.meaning}`));review.append(card);});
  const row=node('div','result-actions');const toggle=button('Xem lại các câu',()=>{review.hidden=!review.hidden;toggle.setAttribute('aria-expanded',String(!review.hidden));},{glyph:'book',noArrow:true});toggle.setAttribute('aria-expanded','false');
  row.append(toggle,button('Làm lại Quiz',()=>{state=startQuiz(state,q.ids);persist();render();pane.querySelector('h2').focus();},{glyph:'retry',noArrow:true}),continuation());result.append(row,review);
 }
 if(state.quiz)activate();
}
