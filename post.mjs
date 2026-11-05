import {read,write} from './session.mjs';
import {createPreviewSound} from './post-preview-sound.mjs';
const $=s=>document.querySelector(s),state=read();
const previewSound=createPreviewSound(document,{onVoice:playing=>$('#preview-scene').dataset.voice=String(playing)});
const methods={
 dictation:{name:'Nghe chép',description:'Nghe từng đoạn, viết lại điều bạn nghe.',steps:['Nghe','Viết','Kiểm tra'],captions:['Nghe câu mẫu','Gõ lại câu vừa nghe','Đối chiếu câu mẫu'],hints:['Tập trung nghe câu mẫu, có thể nghe lại khi cần.','Gõ lại những gì bạn nghe được bằng tiếng Anh.','Đối chiếu câu mẫu để nhận ra phần còn thiếu.'],examples:['Small changes can help.','Small changes can help.','Small changes can help.']},
 shadowing:{name:'Luyện nói theo',description:'Nghe mẫu và luyện nhịp nói cùng Spark.',steps:['Nghe mẫu','Nói theo','Nghe lại'],captions:['Nghe câu mẫu','Nói theo','Nghe lại lượt nói'],hints:['Chú ý cách nhấn từ và nối âm trong câu mẫu.','Nhắc lại câu vừa nghe, bắt chước nhịp và ngữ điệu.','So sánh lượt nói của bạn với mẫu và thử lại.'],examples:['We can make a difference.','We can make a difference.','Lượt nói của bạn']},
 conversation:{name:'Hội thoại',description:'Trò chuyện để dùng ngay điều vừa học.',steps:['Nhận câu hỏi','Trả lời','Phản hồi'],captions:['Nghe câu hỏi','Trả lời bằng ý của bạn','Xem gợi ý'],hints:['Đọc hoặc nghe câu hỏi về chủ đề vừa học.','Dùng từ và ý tưởng trong bài nghe để trả lời.','Xem phản hồi rồi tiếp tục cuộc trò chuyện.'],examples:['How do you help the planet?','I use a reusable bag.','Try: I bring my own bag.']}
};
const flowIcons={
 listen:'<path d="M3 14v-3a9 9 0 0 1 18 0v3M5 12H3v8h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Zm14 0h2v8h-2a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z"/>',
 write:'<path d="M4 20h16M5 15l-1 4 4-1L19 7a2.1 2.1 0 0 0-3-3L5 15Zm9-9 3 3"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 speak:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
 replay:'<path d="M4 10a8 8 0 1 1 0 5M4 4v6h6"/>',
 question:'<path d="M20 11a7 7 0 0 1-7 7H8l-5 3v-7a7 7 0 0 1 7-7h3a7 7 0 0 1 7 4ZM9 3h5a7 7 0 0 1 7 7"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>'
};
const flows={dictation:['listen','write','check'],shadowing:['listen','speak','replay'],conversation:['question','speak','check']};
let choice=Object.hasOwn(methods,state.post.choice)?state.post.choice:'dictation',step=0,timer=null,suspended=false,inView=true,dialogOpen=false,typingFrame=0;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');let motion=true;try{motion=sessionStorage.getItem('wespark-listening-glass-motion')!=='off';}catch{}
const allowed=()=>motion&&!reduced.matches&&!document.hidden&&!suspended&&inView&&!dialogOpen;
function finishTyping(){
 window.cancelAnimationFrame(typingFrame);typingFrame=0;$('#preview-scene').dataset.typing='false';$('#demo-text').textContent=methods.dictation.examples[step];
}
function startTyping(){
 if(choice!=='dictation'||step!==1||!allowed()||!window.requestAnimationFrame)return;
 const text=methods.dictation.examples[step],started=window.performance.now(),target=$('#demo-text'),pen=$('.demo-pen');let last=-1;
 $('#preview-scene').dataset.typing='true';target.textContent='';pen.style.left=(target.offsetLeft+4)+'px';
 function frame(now){
  if(!allowed()){finishTyping();return;}
  const count=Math.min(text.length,Math.floor((now-started)/1250*text.length));
  if(count!==last){last=count;target.textContent=text.slice(0,count);pen.style.left=(target.offsetLeft+target.offsetWidth+4)+'px';}
  if(count<text.length)typingFrame=window.requestAnimationFrame(frame);else{typingFrame=0;$('#preview-scene').dataset.typing='false';}
 }
 typingFrame=window.requestAnimationFrame(frame);
}
function synchronizeLoop(){
 window.clearInterval(timer);timer=null;
 const playing=allowed();$('#preview-scene').dataset.playing=String(playing);if(!playing){previewSound.stop();finishTyping();}
 if(playing)timer=window.setInterval(()=>{step=(step+1)%3;renderStep();},3000);
}
function renderStep(){
 finishTyping();const m=methods[choice];$('#preview-scene').dataset.step=String(step);
 previewSound.stop();if(inView&&!dialogOpen&&!suspended)previewSound.play(choice,step);
 $('#preview-caption').textContent=m.captions[step];$('#preview-description').textContent=m.hints[step];
 $('#demo-text').textContent=methods.dictation.examples[step];$('#demo-record-label').textContent=methods.shadowing.captions[step];
 document.querySelectorAll('[data-preview-step]').forEach((button,i)=>{button.setAttribute('aria-pressed',String(i===step));if(i===step)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
 startTyping();
}
function select(next){
 choice=next;step=0;const m=methods[choice];
 document.querySelectorAll('[data-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.choice===choice)));
 $('#selected-name').textContent=m.name;$('#selected-description').textContent=m.description;$('#preview-title').textContent=m.name;$('#preview-scene').dataset.method=choice;$('#start-activity').href=choice+'.html';
 const done=state.post.complete.includes(choice),resume=!done&&!state.post.skipped&&state.post.choice===choice;
 $('#start-label').textContent=done?'Luyện lại':resume?'Tiếp tục':'Bắt đầu hoạt động';$('#start-activity').setAttribute('aria-label',`${done?'Luyện lại':resume?'Tiếp tục':'Bắt đầu'} ${m.name}`);
 document.querySelectorAll('[data-preview-step]').forEach((button,i)=>{button.querySelector('strong').textContent=m.steps[i];button.querySelector('.flow-symbol svg').innerHTML=flowIcons[flows[choice][i]];});
 synchronizeLoop();renderStep();
}
if(state.post.complete.length||state.post.skipped){$('#post-status').hidden=false;$('#post-status').textContent=state.post.complete.length?'Bạn đã hoàn thành phần Vận dụng. Có thể chọn một hoạt động khác để luyện thêm.':'Bạn đã bỏ qua phần Vận dụng. Có thể chọn một hoạt động để luyện thêm.';if(!state.post.complete.length)$('#post-status').dataset.state='skipped';$('#skip').hidden=true;$('#return-library').hidden=false;}
for(const [type] of Object.entries(methods)){const b=$(`[data-choice="${type}"]`),status=$('#'+type+'-status'),done=state.post.complete.includes(type),resume=!done&&!state.post.skipped&&state.post.choice===type;b.classList.toggle('is-complete',done);if(done||resume){status.hidden=false;status.textContent=done?'Đã hoàn thành':'Đang luyện';}if(done)status.insertAdjacentHTML('afterbegin','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>');b.addEventListener('click',()=>{previewSound.arm();select(type);});}
$('#start-activity').addEventListener('click',()=>{previewSound.stop();write({post:{...read().post,choice,skipped:false}});});
document.querySelectorAll('[data-preview-step]').forEach(button=>button.addEventListener('click',()=>{previewSound.arm();step=Number(button.dataset.previewStep);synchronizeLoop();renderStep();}));
document.addEventListener('visibilitychange',synchronizeLoop);reduced.addEventListener('change',synchronizeLoop);
window.addEventListener('glass-motion-change',event=>{motion=event.detail.enabled;synchronizeLoop();});
window.addEventListener('pagehide',()=>{suspended=true;synchronizeLoop();});window.addEventListener('pageshow',()=>{suspended=false;synchronizeLoop();});
$('#skip').addEventListener('click',()=>{dialogOpen=true;synchronizeLoop();$('#skip-dialog').showModal();});$('#cancel-skip').addEventListener('click',()=>$('#skip-dialog').close());$('#skip-dialog').addEventListener('close',()=>{dialogOpen=false;synchronizeLoop();});$('#confirm-skip').addEventListener('click',()=>{write({post:{...read().post,skipped:true,choice:null}});location.href='library.html';});
if(window.IntersectionObserver){const observer=new window.IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??true;synchronizeLoop();},{threshold:.15});observer.observe($('#activity-preview'));}
select(choice);
