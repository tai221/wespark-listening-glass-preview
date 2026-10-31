import {balance} from './session.mjs';
const KEYS=['A','A','A','B'];
const score=state=>state.submitted?state.answers.filter((a,i)=>a===KEYS[i]).length:0;
const bolt='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 2-9 12h7l-2 8 9-12h-7l2-8Z"/></svg>';
export function mountWhileFeedback(document){
 const view=document.defaultView,$=s=>document.querySelector(s);
 const tools=document.createElement('div');tools.className='while-feedback-tools';
 const counter=document.createElement('span');counter.className='while-point-counter';counter.id='while-point-counter';counter.setAttribute('role','status');counter.setAttribute('aria-live','polite');counter.setAttribute('aria-atomic','true');counter.title='Mỗi câu đúng +1; nhận vào tổng điểm sau khi đối chiếu xong.';counter.innerHTML=bolt+'<strong id="while-points">0</strong>';
 tools.append(counter);$('.tips').before(tools);
 const completion=document.createElement('div');completion.id='while-completion';completion.className='while-completion';completion.hidden=true;completion.setAttribute('role','status');
 completion.innerHTML='<img src="assets/spark-journey/listen-v1.webp" alt="Spark đeo tai nghe ăn mừng" width="76" height="76"><div><strong>Bạn đã nghe và hiểu thêm rồi!</strong><p>Đã hoàn thành phần nghe hiểu.</p></div><span class="while-earned">'+bolt+'<b></b></span>';
 $('#result-summary').after(completion);
 let current=null,timers=[],animations=[],flights=[];
 const motion=()=>!view.matchMedia('(prefers-reduced-motion: reduce)').matches&&document.body.dataset.glassMotion==='true'&&document.body.dataset.sparkLegacyMotion!=='false'&&!document.hidden;
 function count(n){$('#while-points').textContent=String(n);counter.setAttribute('aria-label',`${n} SparkPoint trong phần nghe hiểu`);}
 function later(fn,ms){timers.push(view.setTimeout(fn,ms));}
 function animate(node,frames,options){if(!node?.animate||!motion())return;const animation=node.animate(frames,options);animations.push(animation);}
 function stop(){timers.forEach(id=>view.clearTimeout(id));timers=[];animations.forEach(a=>a.cancel());animations=[];flights.forEach(n=>n.remove());flights=[];if(current)count(score(current));document.querySelectorAll('[data-balance]').forEach(n=>n.textContent=String(balance()));}
 function fly(from,to,text,done){
  if(!motion()||!from||!to){done?.();return;}
  const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();
  if(!a.width||!b.width||a.bottom<0||a.top>view.innerHeight){done?.();return;}
  const node=document.createElement('span');node.className='while-point-flight';node.setAttribute('aria-hidden','true');node.innerHTML=bolt+`<b>${text}</b>`;node.style.left=`${a.x+a.width/2}px`;node.style.top=`${a.y+a.height/2}px`;document.body.append(node);flights.push(node);
  animate(node,[{transform:'translate(-50%,-50%) scale(.8)',opacity:0},{transform:'translate(-50%,-80%) scale(1.05)',opacity:1,offset:.18},{transform:`translate(${b.x+b.width/2-a.x-a.width/2}px,${b.y+b.height/2-a.y-a.height/2}px) scale(.55)`,opacity:0}],{duration:600,easing:'cubic-bezier(.22,.7,.3,1)',fill:'forwards'});
  later(()=>{node.remove();done?.();animate(to,[{transform:'scale(1)'},{transform:'scale(1.13)'},{transform:'scale(1)'}],{duration:240});},600);
 }
 function complete(state,fresh=false){
  completion.hidden=!state.reviewComplete;if(completion.hidden)return;
  const n=state.awardedPoints||0;completion.querySelector('b').textContent=`+${n}`;completion.querySelector('.while-earned').setAttribute('aria-label',`Đã nhận ${n} SparkPoint`);
  completion.querySelector('p').textContent=n?'Điểm của bạn đã được cộng vào tổng.':'Mỗi lần đối chiếu là một lần tiến bộ.';
  if(fresh&&motion()){
   animate(completion.querySelector('img'),[{transform:'translateY(0) rotate(0)'},{transform:'translateY(-8px) rotate(-5deg)'},{transform:'translateY(0) rotate(4deg)'},{transform:'translateY(0) rotate(0)'}],{duration:760});
   if(n)later(()=>{const wallet=$('.wallet');fly(completion.querySelector('.while-earned'),wallet,`+${n}`);},1000);
  }
 }
 function sync(state){current=state;count(score(state));complete(state);}
 function grade(state){
  current=state;const n=score(state);
  if(!motion()){count(n);return;}
  count(0);let earned=0;
  document.querySelectorAll('.question-card').forEach((card,i)=>{
   later(()=>{const selected=card.querySelector('.answer-line.selected'),right=card.classList.contains('correct');
    animate(selected,[{boxShadow:'0 0 0 0 transparent'},{boxShadow:`0 0 0 3px ${right?'#87ab7c55':'#c6948255'}`},{boxShadow:'0 0 0 0 transparent'}],{duration:500});
    if(right)fly(card.querySelector('.while-question-point'),counter,'+1',()=>count(++earned));
   },i*130);
  });
 }
 $('#source-audio').addEventListener('play',stop);$('#question-audio').addEventListener('play',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});view.addEventListener('pagehide',stop);
 view.addEventListener('glass-motion-change',event=>{if(!event.detail.enabled)stop();});view.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)stop();});
 return {sync,grade,complete,stop};
}
