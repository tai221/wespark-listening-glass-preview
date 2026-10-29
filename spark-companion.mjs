// Companion observes learning state; it never writes lesson progress or rewards.
const names={dictation:'Nghe chép',shadowing:'Luyện nói theo',conversation:'Hội thoại'};
const feedback=(key,text,kind='guide')=>({key,text,kind,pose:kind==='complete'?'celebrate':'reading'});
export function companionFeedback(stage,session={},ui={}){
 const state=session[stage]||{},post=session.post||{},complete=post.complete||[];
 if(ui.playing||['recording','processing'].includes(state.phase))return feedback('quiet-'+(['recording','processing'].includes(state.phase)?state.phase:'playback'),state.phase==='recording'?'Mình ở đây. Cứ nói trọn ý rồi bấm Dừng nhé.':state.phase==='processing'?'Đợi phản hồi mẫu nhé. Lượt này chưa được tính hoàn tất.':'Mình cùng lắng nghe. Cứ tập trung vào câu chuyện nhé.','quiet');
 if(names[stage]&&complete.includes(stage))return feedback('complete-'+stage,`Bạn đã hoàn thành ${names[stage]} trong phạm vi bản thử. Một bước nhỏ rất đáng ghi nhận!`,'complete');
 if(['mic-error','processing-error','silence'].includes(state.phase))return feedback(state.phase,'Lượt này chưa được tính. Xem hướng dẫn bên dưới và thử lại khi bạn sẵn sàng.','retry');
 if(stage==='library')return feedback('library','Chào bạn! Mình là Spark. Cùng mở một câu chuyện mới và tiến thêm một bước nhỏ hôm nay nhé.');
 if(stage==='pre'){
  if(ui.panel===2&&ui.finished)return feedback('pre-complete','Bạn đã chuẩn bị xong. Mang những cụm từ vừa học vào bài nghe nhé!','complete');
  if(ui.panel===2&&ui.feedback)return feedback('pre-attempt-'+ui.feedback,'Đã thử sức rồi! Xem phản hồi để nhận ra cách dùng trong câu.','attempt');
  return feedback('pre-'+(ui.panel||0),['Tên bài gợi cho bạn điều gì? Cứ chọn dự đoán của bạn, không chấm đúng sai đâu.','Chú ý cụm từ và cách dùng trong câu. Bạn sắp gặp lại chúng khi nghe.','Thử nhận ra điều vừa học qua ba câu ngắn. Mình ở đây cùng bạn.'][ui.panel||0]);
 }
 if(stage==='while'){
  if(state.reviewComplete)return feedback('while-complete','Bạn đã xem lại phần nghe hiểu. Sẵn sàng chọn một cách vận dụng rồi!','complete');
  if(state.submitted)return feedback('while-review','Đã có kết quả. Đọc bằng chứng và giải thích để hiểu điều mình vừa nghe.','review');
  return feedback('while','Đọc nhanh câu hỏi rồi nghe câu chuyện. Bạn có thể tạm dừng và nghe lại theo nhịp của mình.');
 }
 if(stage==='post')return feedback('post-'+complete.join(','),complete.length?`Bạn đã hoàn thành ${complete.map(x=>names[x]).join(', ')}. Có thể chọn cách khác để luyện thêm, hoặc trở về thư viện.`:'Muốn nghe rõ chi tiết, chọn Nghe chép. Muốn luyện nhịp nói, thử Luyện nói theo. Muốn dùng ý tưởng, chọn Hội thoại.');
 if(stage==='dictation'){
  const draft=state.drafts?.[state.index||0];
  if(draft?.compared&&state.done?.[state.index||0])return feedback(`dictation-assisted-${state.index}`, 'Bạn đã đối chiếu đoạn này với hỗ trợ. Tiến độ đã được ghi nhận; hãy chú ý phần khác với đáp án.', 'attempt');
  if(draft?.checked)return feedback(`dictation-${state.index}-${draft.attempts}-${draft.correct}`,draft.correct?'Bạn đã đối chiếu đúng đoạn này. Tiếp tục theo nhịp của bạn nhé.':'Chưa khớp cũng là một manh mối. Thử nghe lại rồi sửa phần bạn nhận ra.','attempt');
  return feedback('dictation-'+(state.index||0),'Nghe một đoạn ngắn, viết điều bạn nghe được rồi kiểm tra. Có thể dùng hỗ trợ khi cần.');
 }
 if(stage==='shadowing')return feedback('shadow-'+state.phase+'-'+state.index,state.phase==='feedback'?'Đã có phản hồi mẫu. Chọn một điểm để luyện thêm, rồi xác nhận đã xem.':'Nghe mẫu rồi luyện từng đoạn. Ghi âm và phản hồi ở đây đều là mô phỏng.',state.phase==='feedback'?'attempt':'guide');
 if(stage==='conversation')return feedback('conversation-'+state.count+'-'+state.started,state.count===3?'Bạn đã trả lời đủ ba lượt mẫu. Xem nhận xét cuối để hoàn thành hoạt động.':'Thử dùng ý tưởng từ bài nghe để cùng thống nhất một thay đổi. Hội thoại và ghi âm ở đây là mô phỏng.',state.count?'attempt':'guide');
 return feedback('guide','Cùng tiến từng bước nhỏ nhé.');
}
export function motionAllowed({enabled,visible,inView,reduced=false,busy=false}){return enabled&&visible&&inView&&!reduced&&!busy;}
export function transitionMotion(previous,next,seen=new Set()){
 if(next.kind==='complete'){
  const alreadySeen=seen.has(next.key);seen.add(next.key);
  return !previous||alreadySeen||previous.key===next.key?null:'celebrate';
 }
 if(!previous)return 'welcome';
 if(previous.key===next.key||next.kind==='quiet')return null;
 return 'acknowledge';
}

async function mount(){
 const slot=document.querySelector('[data-spark-slot]');if(!slot)return;
 const {read}=await import('./session.mjs');
 const stage=document.body.dataset.sparkPage,image=slot.querySelector('img'),copy=slot.querySelector('[data-spark-copy]'),toggle=slot.querySelector('[data-spark-motion]'),replay=slot.querySelector('[data-spark-replay]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let enabled=true,inView=true,previous=null,animations=[],queued=false;const seenCompletions=new Set();
 try{enabled=sessionStorage.getItem('wespark-listening-glass-motion')!=='off';}catch{}
 const media=[...document.querySelectorAll('audio,video')];
 function busy(){return media.some(a=>!a.paused&&!a.ended)||['recording','processing'].includes(read()[stage]?.phase)||!!window.speechSynthesis?.speaking;}
 const legacyAllowed=()=>motionAllowed({enabled,visible:!document.hidden,inView:true,reduced:reduced.matches,busy:busy()});
 function gateLegacy(){
  document.body.dataset.sparkLegacyMotion=String(legacyAllowed());
  if(stage==='pre'&&!legacyAllowed())document.querySelectorAll('#particles,.spark-stage,#wallet').forEach(el=>el.getAnimations({subtree:true}).forEach(a=>a.cancel()));
 }
 const allowed=()=>motionAllowed({enabled,visible:!document.hidden,inView,reduced:reduced.matches,busy:busy()});
 function cancel(){animations.forEach(a=>a.cancel());animations=[];}
 function animate(kind){cancel();if(!allowed()||!image.animate)return;
  const frames=kind==='celebrate'?[{transform:'translateY(0) rotate(0)'},{transform:'translateY(-15px) rotate(-7deg)',offset:.3},{transform:'translateY(0) rotate(5deg)',offset:.6},{transform:'translateY(-6px) rotate(-3deg)',offset:.8},{transform:'translateY(0) rotate(0)'}]:kind==='welcome'?[{transform:'translateY(12px) rotate(-8deg)'},{transform:'translateY(-7px) rotate(5deg)',offset:.55},{transform:'translateY(0) rotate(0)'}]:[{transform:'translateY(0)'},{transform:'translateY(-5px)',offset:.5},{transform:'translateY(0)'}];
  animations=[image.animate(frames,{duration:kind==='celebrate'?1100:kind==='welcome'?1000:420,easing:'ease-out',iterations:1})];
 }
 function update(){queued=false;
  const panel=document.querySelector('[data-panel]:not([hidden])'),quizActive=panel?.dataset.panel==='2';
  const next=companionFeedback(stage,read(),{playing:media.some(a=>!a.paused&&!a.ended)||!!window.speechSynthesis?.speaking,panel:Number(panel?.dataset.panel||0),finished:quizActive&&!!document.querySelector('#completion:not([hidden])'),feedback:quizActive?document.querySelector('#feedback')?.textContent.trim():''});
  const kind=transitionMotion(previous,next,seenCompletions);if(next.key!==previous?.key){copy.textContent=next.text;image.src=`assets/spark-${next.pose}.webp`;slot.dataset.sparkKind=next.kind;}
  // Initial complete state gets readable restored feedback, never another celebration.
  if(kind)animate(kind);
  if(!allowed())cancel();
  gateLegacy();
  slot.dataset.sparkQuiet=String(busy());slot.dataset.sparkMotion=String(allowed());
  toggle.setAttribute('aria-pressed',String(enabled));toggle.textContent=enabled?'Chuyển động: Bật':'Chuyển động: Tắt';
  replay.disabled=!allowed();replay.title=reduced.matches?'Theo tùy chọn giảm chuyển động của thiết bị':busy()?'Tạm nghỉ khi đang nghe hoặc ghi âm':'';
  window.dispatchEvent(new CustomEvent('glass-motion-change',{detail:{enabled}}));
  previous=next;
 }
 function schedule(){if(!queued){queued=true;queueMicrotask(update);}}
 toggle.addEventListener('click',()=>{enabled=!enabled;try{sessionStorage.setItem('wespark-listening-glass-motion',enabled?'on':'off');}catch{}update();});
 replay.addEventListener('click',()=>animate(previous.kind==='complete'?'celebrate':'welcome'));
 window.addEventListener('listening-session-change',schedule);document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);
 media.forEach(a=>['play','pause','ended','error'].forEach(event=>a.addEventListener(event,schedule)));
 // Pre uses shared scripts without session events; observe its panel and feedback only.
 if(stage==='pre'){
  const observer=new MutationObserver(schedule);
  const particles=document.querySelector('#particles');
  if(particles)new MutationObserver(gateLegacy).observe(particles,{childList:true});
  document.querySelectorAll('[data-panel],#feedback,#completion').forEach(e=>observer.observe(e,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true,characterData:true}));
 }
 // Speech synthesis is outside media elements; clicks start it synchronously.
 document.addEventListener('click',()=>{if(window.speechSynthesis?.speaking)schedule();});
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView)cancel();update();},{threshold:.1}).observe(slot);
 update();
}
if(typeof document!=='undefined')mount();
