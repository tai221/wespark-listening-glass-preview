import {navigateSpeakingStage} from './speaking-stage-transition.mjs';
import {mountSpeakingPractice} from './speaking-practice.mjs';
import {FOLLOWUP_KEY,restoreFollowups,startFollowup,submitFollowup,finishFollowups} from './speaking-followup-state.mjs';
import {SPEAKING_ROUND_KEY,createSpeakingRound,restoreSpeakingRound,submitSpeakingRound} from './speaking-round-state.mjs';
export function mountSpeakingRound(main,options={}){
 const doc=main.ownerDocument,win=doc.defaultView,lifecycle=new win.AbortController();let state=createSpeakingRound(),recording='ready',dispose,storage=options.storage;
 try{storage ||= win.sessionStorage;}catch{}
 try{state=restoreSpeakingRound(storage.getItem(SPEAKING_ROUND_KEY));}catch{}
 let followups=restoreFollowups(null,state);try{followups=restoreFollowups(storage.getItem(FOLLOWUP_KEY),state);}catch{}
 const progressNav=doc.createElement('nav');progressNav.className='speaking-question-progress';progressNav.setAttribute('aria-label','Tiến độ nộp bản ghi');
 const preview=doc.createElement('details');preview.className='round-preview';preview.innerHTML='<summary>Bản xem thử</summary><p>Lời đáp là dữ liệu minh họa, chưa được phiên âm từ bản ghi. Câu hỏi nói thêm được chọn từ ý trong lời đáp mẫu, tối đa 2 câu. Câu nói thêm đã nộp được chấm như Q4/Q5; điểm cả lượt là trung bình tất cả câu lần 1 đã nộp (3–5 câu), không gồm nói lại. Transcript, điểm và nhận xét vẫn là dữ liệu mẫu. Giọng đọc nói thêm dùng trình duyệt; chưa kết nối phiên âm hay AI trực tiếp.</p>';
 function pending(){return ['recording','review'].includes(recording);}
 function mayLeave(){return !pending()||win.confirm('Bạn đang có lượt ghi âm chưa gửi. Rời màn này và bỏ lượt đang dở?');}
 main.speakingStageCanLeave=mayLeave;
 function save(next,key=SPEAKING_ROUND_KEY){try{storage.setItem(key,JSON.stringify(next));main.querySelector('.round-storage-warning')?.remove();return true;}catch{let warning=main.querySelector('.round-storage-warning');if(!warning){warning=doc.createElement('p');warning.className='round-storage-warning';warning.setAttribute('role','alert');main.prepend(warning);}warning.textContent='Chưa lưu được lượt nói. Hãy thử lại trước khi rời trang.';return false;}}
 function sync(){
  main.dataset.speakingRound=state.finished?'submitted':'speaking';main.dataset.cycleStage='v1';main.dataset.cycleQuestion=`q${state.current+1}`;
  const host=doc.querySelector('.lesson-top-identity .lesson-fallback-tags')||main;
  (doc.querySelector('.lesson-top-tools')||main).prepend(preview);
  const old=host.querySelector('.speaking-question-progress');if(old&&old!==progressNav)old.remove();host.append(progressNav);const nav=progressNav;nav.replaceChildren();
  for(let i=0;i<3;i++){const done=i<state.submissions.length,active=!state.finished&&i===state.current,b=doc.createElement('button');b.type='button';b.textContent=`${done?'✓ ':''}Q${i+1}`;b.dataset.questionState=done?'done':active?'current':'locked';b.dataset.focused=String(active);b.disabled=!done&&!active;if(!active)b.setAttribute('aria-disabled','true');if(active)b.setAttribute('aria-current','step');b.setAttribute('aria-label',`Câu ${i+1} · ${done?'Đã nộp':active?'Đang nói':'Chưa mở'}`);nav.append(b);}
  const url=new URL(win.location.href);url.hash=state.finished?(followups.pending?`followup-${followups.submissions.length+1}`:'submitted'):`question-${state.current+1}`;win.history.replaceState(null,'',url);
 }
 function offer(){
  const done=main.querySelector('.round-submitted');if(!done)return;
  done.classList.add('round-followup-offer');done.removeAttribute('role');done.replaceChildren();
  const label=doc.createElement('p');label.setAttribute('role','status');label.setAttribute('aria-live','polite');label.textContent=followups.submissions.length?'Bạn muốn nói thêm một câu nữa?':'Đã nộp đủ 3 câu. Bạn muốn nói thêm?';
  const actions=doc.createElement('div');actions.className='round-followup-actions';
  const more=doc.createElement('button');more.type='button';more.className='practice-secondary';more.dataset.followupStart='';more.textContent=followups.submissions.length?'Nói thêm 1 câu':'Nói thêm';
  const feedback=doc.createElement('button');feedback.type='button';feedback.className='practice-start';feedback.dataset.followupFeedback='';feedback.textContent='Nhận phản hồi';
  more.addEventListener('click',()=>{const next=startFollowup(followups);if(next===followups||!save(next,FOLLOWUP_KEY))return;followups=next;dispose.askFollowup(next.pending);sync();});
  feedback.addEventListener('click',()=>{const next=finishFollowups(followups);if(next===followups||!save(next,FOLLOWUP_KEY))return;followups=next;void navigateSpeakingStage('key-speaking-feedback.html');});
  actions.append(more,feedback);done.append(label,actions);more.focus({preventScroll:true});
 }
 function mount(){
  dispose?.();recording='ready';main.classList.add('speaking-cycle');
  dispose=mountSpeakingPractice(main,{version:1,questionIndex:state.current,finished:state.finished,contextualQuestion:followups.pending,optionalHistory:followups.submissions,stageReady:options.stageReady,previousQuestions:state.submissions.filter(s=>state.finished||s.question<state.current).map(s=>s.question),canLeave:mayLeave,onStateChange:value=>recording=value,backLabel:'Về Mind Map',onBack:()=>{win.location.href='key-speaking-mindmap.html';},onSubmit:entry=>{
   if(followups.pending){
    const next=submitFollowup(followups,{id:followups.pending.id,duration:entry.duration});if(next===followups||!save(next,FOLLOWUP_KEY))return false;
    followups=next;dispose.finishRound();sync();if(next.finished)void navigateSpeakingStage('key-speaking-feedback.html');else offer();return true;
   }
   const next=submitSpeakingRound(state,{question:state.current,duration:entry.duration});if(next===state||!save(next))return false;
   state=next;recording='ready';if(state.finished){followups=restoreFollowups(null,state);dispose.finishRound();sync();offer();}else{dispose.advanceQuestion(state.current);sync();}return true;
  }});
  if(state.finished&&!followups.pending){dispose.finishRound();if(!followups.finished)offer();}
  sync();queueMicrotask(sync);if(followups.finished)win.location.replace('key-speaking-feedback.html');
 }
 doc.addEventListener('click',event=>{const a=event.target.closest?.('a[href]');if(a&&pending()&&!mayLeave()){event.preventDefault();event.stopImmediatePropagation();}},{capture:true,signal:lifecycle.signal});
 win.addEventListener('beforeunload',event=>{if(pending()){event.preventDefault();event.returnValue='';}},{signal:lifecycle.signal});
 mount();return ()=>{dispose?.();preview.remove();lifecycle.abort();};
}
