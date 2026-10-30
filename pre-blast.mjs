import {blast,createBlast,targets,sentences,duration} from './pre-blast-state.mjs';
export function mountBlast(document,{state=createBlast(),onChange=()=>{},onComplete=()=>{},autoTick=true}={}){
 const win=document.defaultView,$=s=>document.querySelector(s),audio=$('#sample-audio');
 let s=state,active=false,composing=false,playing=false,request=0,lastTime=0,frame,dead=false,shotAnimations=[];
 const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
 const isStatic=()=>reduced.matches||document.body.dataset.glassMotion==='false'||document.body.dataset.sparkLegacyMotion==='false';
 function cancelShot(){shotAnimations.forEach(a=>a.cancel());shotAnimations=[];}
 function stopAudio(){cancelShot();request++;playing=false;audio.pause();audio.currentTime=0;$('#blast-play').textContent='▶ Nghe / nghe lại';}
 function commit(next,{paint=true,persist=true}={}){if(next===s)return;const old=s;s=next;if(persist)onChange(s);if(old.index!==s.index||old.phase!==s.phase){stopAudio();$('#blast-input').value='';$('#blast-audio-error').hidden=true;}
  if(paint)render();if(old.phase!==s.phase&&s.phase==='complete')onComplete(s);
 }
 function act(type,value){commit(blast(s,{type,value}));}
 function focus(selector){if(active&&!document.hidden)$(selector)?.focus();}
 function render(){
  for(const [id,phase] of [['blast-ready','ready'],['blast-play-area','playing'],['blast-review','review'],['blast-sentences','sentence']])$('#'+id).hidden=s.phase!==phase||s.paused;
  $('#blast-paused').hidden=!s.paused;
  $('#blast-score').textContent=s.score;$('#blast-combo').textContent=s.combo;$('#blast-shields').textContent=s.shields;$('#blast-count').textContent=`${s.results.length} / 7`;
  $('#challenge').dataset.blastPhase=s.paused?'paused':s.phase;
  $('#blast-input').disabled=s.paused||s.phase!=='playing';
  if(s.phase==='playing'){
   const target=targets[s.index],helped=s.assisted.includes(s.index),text=helped?target.answer:target.prompt;
   $('#blast-target').textContent=text;$('#blast-target').lang=helped?'en':'vi';$('#blast-target').style.transform='translateY(0)';
   $('#blast-audio-controls').hidden=target.kind!=='audio';$('#blast-feedback').textContent=helped?'Có hỗ trợ · Gõ lại cụm từ để tiếp tục.':'Gõ đúng cả cụm từ để tự bắn.';
   $('#blast-mode').textContent=target.kind==='audio'?'Mục nghe không giới hạn thời gian. Bấm nghe hoặc dùng hỗ trợ.':isStatic()?'Chế độ tĩnh · Không giới hạn thời gian.':'Gõ trước khi chạm vạch vàng. Có thể tạm dừng bất cứ lúc nào.';
  }
  if(s.phase==='review'){
   $('#blast-review-list').replaceChildren();
   [...s.results].sort((a,b)=>Number(a.kind==='recall')-Number(b.kind==='recall')).forEach(r=>{
    const row=document.createElement('div');row.className='blast-review-item';const word=document.createElement('strong');word.lang='en';word.textContent=targets[r.index].answer;
    const label=document.createElement('span');label.textContent={recall:'Đã tự nhớ',assisted:'Có hỗ trợ',miss:'Cần ôn',unreached:'Chưa tới · Cần ôn'}[r.kind];
    const meaning=document.createElement('p');meaning.textContent=targets.find(t=>t.kind==='meaning'&&t.answer===targets[r.index].answer).prompt;
    const button=document.createElement('button');button.type='button';button.dataset.blastReviewAudio=String(r.index);button.textContent='▶ Nghe phát âm';button.setAttribute('aria-label',`Nghe phát âm: ${targets[r.index].answer}`);
    row.append(word,label,meaning,button);$('#blast-review-list').append(row);
   });
  }
  if(s.phase==='sentence'){
   const q=sentences[s.sentenceIndex],correct=s.sentenceFeedback==='correct';
   $('#blast-sentence-count').textContent=`Mẫu câu ${s.sentenceIndex+1} / 2`;
   if($('#blast-sentence-prompt').textContent!==q.prompt)$('#blast-sentence-prompt').textContent=q.prompt;
   $('#blast-sentence-input').value=s.sentenceDraft||'';
   $('#blast-sentence-meaning').textContent=q.meaning;
   $('#blast-sentence-input').disabled=correct||s.paused;$('#blast-check').hidden=correct;$('#blast-next').hidden=!correct;$('#blast-next').textContent=s.sentenceIndex===1?'Hoàn tất →':'Câu tiếp →';
   $('#blast-sentence-hint').hidden=correct;
   $('#blast-sentence-feedback').textContent=correct?`Đúng rồi. ${q.explanation}${s.sentenceAssisted.includes(s.sentenceIndex)?' · Có hỗ trợ.':''}`:s.sentenceAssisted.includes(s.sentenceIndex)?`Gợi ý: ${q.answer}. ${q.explanation}`:s.sentenceFeedback==='retry'?'Chưa khớp. Bạn có thể sửa và kiểm tra lại không giới hạn.':'';
  }
 }
 function changedTarget(old){if(s.phase!==old.phase)focus(s.phase==='review'?'#blast-review-heading':s.phase==='sentence'?'#blast-sentence-prompt':'#blast-input');}
 function input(){if(composing||!active||s.paused)return;const old=s;
  const target=$('#blast-target').getBoundingClientRect(),spark=$('.blast-spark').getBoundingClientRect(),arena=$('#blast-arena').getBoundingClientRect();
  act('type',$('#blast-input').value);
  if(s.results.length>old.results.length)$('#blast-hit').textContent=`Đã bắn trúng: ${targets[old.index].answer}${old.assisted.includes(old.index)?' · Có hỗ trợ':''}.`;
  if(s.results.length>old.results.length&&!isStatic()&&$('#blast-shot').animate){
   document.body.append($('#blast-shot'));$('#blast-shot').style.position='fixed';const fromX=spark.x+spark.width*.7,fromY=spark.y+spark.height*.3,toX=target.x+target.width*.5,toY=target.y+target.height*.5;
   shotAnimations=[$('#blast-shot').animate([{transform:`translate(${fromX}px,${fromY}px) rotate(15deg) scale(.6)`,opacity:0},{transform:`translate(${fromX}px,${fromY}px) rotate(15deg) scale(1)`,opacity:1,offset:.12},{transform:`translate(${toX}px,${toY}px) rotate(15deg) scale(1.2)`,opacity:1,offset:.8},{transform:`translate(${toX}px,${toY}px) rotate(15deg) scale(2)`,opacity:0}],{duration:330,easing:'ease-out'}),$('#blast-arena').animate([{boxShadow:'inset 0 0 0 0 #f3c83d00'},{boxShadow:'inset 0 0 40px 5px #f3c83d99',offset:.8},{boxShadow:'inset 0 0 0 0 #f3c83d00'}],{duration:400})];
  }
  changedTarget(old);
 }
 async function reviewPlay(index){
  if(!active||s.phase!=='review'||!Number.isInteger(index)||!targets[index])return;
  stopAudio();const token=request;const word=targets[index].answer,source=targets.find(t=>t.kind==='audio'&&t.answer===word)?.audio||`pre-engine/${word.replace(/ /g,'-')}.wav`;
  $('#blast-review-audio-status').textContent='';audio.setAttribute('src',source);audio.load();playing=true;
  try{await audio.play();}catch{if(token===request&&!dead){playing=false;$('#blast-review-audio-status').textContent='Chưa phát được. Bấm Nghe phát âm để thử lại.';}}
 }
 async function play(){
  if(!active||s.paused||s.phase!=='playing'||targets[s.index].kind!=='audio')return;
  stopAudio();const token=request;const source=targets[s.index].audio;$('#blast-audio-error').hidden=true;
  if(audio.error||audio.getAttribute('src')!==source){audio.setAttribute('src',source);audio.load();}
  playing=true;$('#blast-play').textContent='↻ Phát lại từ đầu';
  try{await audio.play();if(token!==request){return;}}catch{if(token!==request||dead)return;playing=false;$('#blast-audio-error').hidden=false;$('#blast-play').textContent='▶ Thử nghe lại';}
 }
 const listeners=[];
 function listen(el,event,fn){el.addEventListener(event,fn);listeners.push(()=>el.removeEventListener(event,fn));}
 listen($('#blast-start'),'click',()=>{if(!active)return;act('start');focus('#blast-input');});
 listen($('#blast-input'),'input',input);
 listen($('#blast-input'),'compositionstart',()=>{composing=true;});listen($('#blast-input'),'compositionend',()=>{composing=false;input();});
 listen($('#blast-play'),'click',play);
 listen($('#blast-review-list'),'click',e=>{const button=e.target.closest('[data-blast-review-audio]');if(button)reviewPlay(Number(button.dataset.blastReviewAudio));});
 listen(audio,'ended',()=>{playing=false;$('#blast-play').textContent='▶ Nghe / nghe lại';});
 listen(audio,'error',()=>{if(active&&s.phase==='review')$('#blast-review-audio-status').textContent='Chưa phát được. Bấm Nghe phát âm để thử lại.';if(active&&!s.paused&&s.phase==='playing'&&targets[s.index].kind==='audio'){playing=false;$('#blast-audio-error').hidden=false;}});
 listen($('#blast-hint'),'click',()=>{if(!active||s.paused)return;stopAudio();act('hint');focus('#blast-input');});
 listen($('#blast-skip'),'click',()=>{if(!active||s.paused)return;const old=s;act('miss');changedTarget(old);if(s.phase==='playing')focus('#blast-input');});
 function pause(){if(!active)return;stopAudio();act('pause');lastTime=0;}
 listen($('#blast-pause'),'click',()=>{pause();focus('#blast-resume');});listen($('#blast-sentence-pause'),'click',()=>{pause();focus('#blast-resume');});
 listen($('#blast-resume'),'click',()=>{if(!active||document.hidden)return;act('resume');lastTime=0;focus(s.phase==='sentence'?(s.sentenceFeedback==='correct'?'#blast-next':'#blast-sentence-input'):'#blast-input');});
 listen(document,'keydown',e=>{if(e.key==='Escape'&&active&&!s.paused&&['playing','sentence'].includes(s.phase)){e.preventDefault();pause();focus('#blast-resume');}});
 listen(document,'visibilitychange',()=>{if(document.hidden)pause();});
 listen($('#blast-reviewed'),'click',()=>{if(!active)return;act('reviewed');focus('#blast-sentence-input');});
 const check=()=>{if(active&&!s.paused){act('sentence',$('#blast-sentence-input').value);if(s.sentenceFeedback==='correct')focus('#blast-next');}};
 listen($('#blast-sentence-input'),'input',()=>{if(active&&!s.paused)commit(blast(s,{type:'sentenceDraft',value:$('#blast-sentence-input').value}),{paint:false});});
 listen($('#blast-check'),'click',check);listen($('#blast-sentence-input'),'keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();check();}});
 listen($('#blast-sentence-hint'),'click',()=>{if(active&&!s.paused){act('sentenceHint');focus('#blast-sentence-input');}});
 listen($('#blast-next'),'click',()=>{if(!active||s.paused)return;act('nextSentence');if(s.phase==='sentence')focus('#blast-sentence-input');});
 let previousStatic=isStatic();
 function motion(){const value=isStatic();if(value)cancelShot();if(value===previousStatic)return;previousStatic=value;lastTime=0;if(s.phase==='playing')render();}
 listen(win,'glass-motion-change',motion);listen(reduced,'change',motion);
 function travelDistance(){const arena=$('#blast-arena').getBoundingClientRect(),floor=$('.blast-floor').getBoundingClientRect(),target=$('#blast-target').getBoundingClientRect();return Math.max(0,floor.top-arena.top-$('#blast-target').offsetTop-target.height);}
 function tick(now){if(dead)return;if(active&&!s.paused&&s.phase==='playing'&&!document.hidden&&!playing){const delta=lastTime?Math.min(now-lastTime,250):0;const old=s;const next=blast(s,{type:'tick',value:delta,static:isStatic()});if(next!==s){const transition=next.index!==s.index||next.phase!==s.phase;commit(next,{paint:transition,persist:transition});if(s.phase!==old.phase)changedTarget(old);}if(s.phase==='playing')$('#blast-target').style.transform=`translateY(${isStatic()||targets[s.index].kind==='audio'?0:s.elapsed/duration(targets[s.index])*travelDistance()}px)`;lastTime=now;}else lastTime=0;if(autoTick)frame=win.requestAnimationFrame(tick);}
 render();if(autoTick)frame=win.requestAnimationFrame(tick);
 return {activate(value){if(active&&!value)pause();active=value;lastTime=0;if(value)render();},pause,reset(value=createBlast()){stopAudio();s=value;$('#blast-input').value='';$('#blast-sentence-input').value='';$('#blast-hit').textContent='';render();onChange(s);},getState:()=>s,destroy(){dead=true;stopAudio();win.cancelAnimationFrame(frame);listeners.forEach(off=>off());}};
}
