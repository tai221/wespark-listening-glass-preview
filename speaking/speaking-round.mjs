import {navigateSpeakingStage} from './speaking-stage-transition.mjs';
import {mountSpeakingPractice} from './speaking-practice.mjs';
import {SPEAKING_ROUND_KEY,createSpeakingRound,restoreSpeakingRound,submitSpeakingRound} from './speaking-round-state.mjs';
export function mountSpeakingRound(main,options={}){
 const doc=main.ownerDocument,win=doc.defaultView,lifecycle=new win.AbortController();let state=createSpeakingRound(),recording='ready',dispose;
 try{state=restoreSpeakingRound(win.sessionStorage.getItem(SPEAKING_ROUND_KEY));}catch{}
 const progressNav=doc.createElement('nav');progressNav.className='speaking-question-progress';progressNav.setAttribute('aria-label','Tiến độ nộp bản ghi');
 const preview=doc.createElement('details');preview.className='round-preview';preview.innerHTML='<summary>Bản xem thử</summary><p>Lời đáp trong hội thoại là dữ liệu minh họa cho giao diện, chưa được phiên âm từ bản ghi. Bản thử giữ các trạng thái ghi âm hiện có.</p>';
 function pending(){return ['recording','review'].includes(recording);}
 function mayLeave(){return !pending()||win.confirm('Bạn đang có lượt ghi âm chưa gửi. Rời màn này và bỏ lượt đang dở?');}
 main.speakingStageCanLeave=mayLeave;
 function save(next){try{win.sessionStorage.setItem(SPEAKING_ROUND_KEY,JSON.stringify(next));return true;}catch{let warning=main.querySelector('.round-storage-warning');if(!warning){warning=doc.createElement('p');warning.className='round-storage-warning';warning.setAttribute('role','alert');main.prepend(warning);}warning.textContent='Chưa lưu được lượt nói. Hãy thử lại trước khi rời trang.';return false;}}
 function sync(){
  main.dataset.speakingRound=state.finished?'submitted':'speaking';main.dataset.cycleStage='v1';main.dataset.cycleQuestion=`q${state.current+1}`;
  const host=doc.querySelector('.lesson-top-identity .lesson-fallback-tags')||main;
  (doc.querySelector('.lesson-top-tools')||main).prepend(preview);
  const old=host.querySelector('.speaking-question-progress');if(old&&old!==progressNav)old.remove();host.append(progressNav);const nav=progressNav;nav.replaceChildren();
  for(let i=0;i<3;i++){const done=i<state.submissions.length,active=!state.finished&&i===state.current,b=doc.createElement('button');b.type='button';b.textContent=`${done?'✓ ':''}Q${i+1}`;b.dataset.questionState=done?'done':active?'current':'locked';b.dataset.focused=String(active);b.disabled=!done&&!active;if(!active)b.setAttribute('aria-disabled','true');if(active)b.setAttribute('aria-current','step');b.setAttribute('aria-label',`Câu ${i+1} · ${done?'Đã nộp':active?'Đang nói':'Chưa mở'}`);nav.append(b);}
  const url=new URL(win.location.href);url.hash=state.finished?'submitted':`question-${state.current+1}`;win.history.replaceState(null,'',url);
 }
 function mount(){
  dispose?.();recording='ready';main.classList.add('speaking-cycle');
  dispose=mountSpeakingPractice(main,{version:1,questionIndex:state.current,finished:state.finished,stageReady:options.stageReady,previousQuestions:state.submissions.filter(s=>s.question<state.current).map(s=>s.question),canLeave:mayLeave,onStateChange:value=>recording=value,backLabel:'Về Mind Map',onBack:()=>{win.location.href='key-speaking-mindmap.html';},onSubmit:entry=>{
   const next=submitSpeakingRound(state,{question:state.current,duration:entry.duration});if(next===state||!save(next))return false;
   state=next;recording='ready';if(state.finished){dispose.finishRound();sync();void navigateSpeakingStage('key-speaking-feedback.html');}else{dispose.advanceQuestion(state.current);sync();}return true;
  }});
  if(state.finished)dispose.finishRound();sync();queueMicrotask(sync);if(state.finished)win.location.replace('key-speaking-feedback.html');
 }
 doc.addEventListener('click',event=>{const a=event.target.closest?.('a[href]');if(a&&pending()&&!mayLeave()){event.preventDefault();event.stopImmediatePropagation();}},{capture:true,signal:lifecycle.signal});
 win.addEventListener('beforeunload',event=>{if(pending()){event.preventDefault();event.returnValue='';}},{signal:lifecycle.signal});
 mount();return ()=>{dispose?.();preview.remove();lifecycle.abort();};
}
