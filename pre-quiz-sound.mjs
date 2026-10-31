const KEY='wespark-quiz-sound-v1';
export function createQuizSound(document,{id='prep-quiz-sound',label='Âm thanh Quiz',celebration=false}={}){
 let enabled=true;try{enabled=document.defaultView.localStorage.getItem(KEY)!=='off';}catch{}
 const button=document.createElement('button');button.type='button';button.id=id;button.className='prep-quiz-sound';button.title='Bật/tắt âm báo đúng và sai';
 const sounds=['correct','incorrect',...(celebration?['celebrate']:[])].map(kind=>{const audio=document.createElement('audio');audio.src=`assets/quiz-audio/quiz-${kind}.wav`;audio.preload='auto';audio.hidden=true;audio.dataset.quizSfx=kind;audio.volume=.5;return audio;});
 function stop(){for(const audio of sounds){audio.pause();try{audio.currentTime=0;}catch{}}}
 function render(){
  button.setAttribute('aria-pressed',String(enabled));
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  svg.innerHTML='<path d="m11 5-5 4H3v6h3l5 4V5Z"/>'+(enabled?'<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>':'<path d="m16 9 5 6m0-6-5 6"/>');
  button.setAttribute('aria-label',label);button.title=enabled?'Tắt âm báo':'Bật âm báo';button.replaceChildren(svg);
 }
 button.addEventListener('click',()=>{enabled=!enabled;if(!enabled)stop();try{document.defaultView.localStorage.setItem(KEY,enabled?'on':'off');}catch{}render();});
 document.defaultView.addEventListener('pagehide',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});render();
 function playKind(kind){if(!enabled)return Promise.resolve(false);stop();const audio=sounds.find(a=>a.dataset.quizSfx===kind);if(!audio)return Promise.resolve(false);try{return Promise.resolve(audio.play()).then(()=>true,()=>false);}catch{return Promise.resolve(false);}}
 return {button,sounds,stop,celebrate(){return playKind('celebrate');},play(correct){return playKind(correct?'correct':'incorrect');}};
}
