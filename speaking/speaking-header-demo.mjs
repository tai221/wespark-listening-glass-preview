// A two-second visual sketch; no microphone, audio or scoring is involved.
export function mountSpeakingHeaderDemo(heading){
 const demo=document.createElement('aside');demo.className='speaking-header-demo';demo.setAttribute('aria-label','Minh họa luyện nói');
 demo.innerHTML=`<div class="speaking-demo-stage" role="img" aria-label="Câu hỏi Where are you from? và câu trả lời mẫu I’m from a small town.">
  <div class="speaking-demo-prompt">Where are you from?</div>
  <div class="speaking-demo-voice" aria-hidden="true"><span class="speaking-demo-mic"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="18" y="7" width="12" height="23" rx="6"/><path d="M12 23v2a12 12 0 0 0 24 0v-2M24 37v7m-7 0h14"/></svg></span><span class="speaking-demo-wave">${[18,30,44,26,38,52,34,22,40,28,16].map((h,i)=>`<i style="--bar-height:${h}px;--bar-phase:${i%3}"></i>`).join('')}</span></div>
  <div class="speaking-demo-answer">I’m from a small town.</div>
 </div><button type="button" class="speaking-demo-replay" aria-label="Xem lại minh họa luyện nói" title="Xem lại minh họa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></svg></button>`;
 heading.append(demo);
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),button=demo.querySelector('button');
 function play(){
  demo.removeAttribute('data-playing');
  if(reduced.matches)return;
  // Restart one bounded sequence when explicitly requested.
  void demo.offsetWidth;demo.dataset.playing='true';
 }
 function preference(){button.disabled=reduced.matches;if(reduced.matches)demo.removeAttribute('data-playing');}
 button.addEventListener('click',play);reduced.addEventListener('change',preference);
 demo.querySelector('.speaking-demo-answer').addEventListener('animationend',event=>{if(event.animationName==='speaking-answer')demo.removeAttribute('data-playing');});
 let visible=true;
 function pause(){demo.dataset.paused=String(document.hidden||!visible);}
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;pause();}).observe(demo);
 document.addEventListener('visibilitychange',pause);
 preference();play();
}
