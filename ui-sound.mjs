const KEY='wespark-ui-sound-v1',LEGACY='wespark-quiz-sound-v1',settings=new WeakMap();
export function effectSettings(document){
 const view=document.defaultView;if(settings.has(view))return settings.get(view);
 const read=()=>{try{return (view.localStorage.getItem(KEY)??view.localStorage.getItem(LEGACY))!=='off';}catch{return true;}};
 let enabled=read();const listeners=new Set();
 function update(value){enabled=value;for(const listener of listeners)listener(enabled);}
 const state={get enabled(){return enabled;},subscribe(listener){listeners.add(listener);},set(value){
  update(!!value);try{view.localStorage.setItem(KEY,enabled?'on':'off');}catch{}
 }};
 view.addEventListener('storage',event=>{if(event.key===KEY||event.key===LEGACY||event.key===null)update(read());});
 settings.set(view,state);return state;
}
export function createSoundButton(document){
 const state=effectSettings(document),button=document.createElement('button');button.type='button';button.className='project-sound-button';
 button.setAttribute('aria-label','Âm thanh hiệu ứng');
 function render(){
  button.setAttribute('aria-pressed',String(state.enabled));button.title=(state.enabled?'Tắt':'Bật')+' âm thanh hiệu ứng · Âm bài học có điều khiển riêng';
  button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5Z"/>'+(state.enabled?'<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>':'<path d="m16 9 5 6m0-6-5 6"/>')+'</svg>';
 }
 button.addEventListener('click',()=>state.set(!state.enabled));state.subscribe(render);render();return button;
}
export function createEffectPlayer(document,sources){
 const state=effectSettings(document),sounds=Object.entries(sources).map(([kind,src])=>{
  const audio=document.createElement('audio');audio.src=src;audio.preload='auto';audio.hidden=true;audio.dataset.uiSfx=kind;audio.volume=.5;return audio;
 });
 function stop(){for(const audio of sounds){audio.pause();try{audio.currentTime=0;}catch{}}}
 state.subscribe(enabled=>{if(!enabled)stop();});document.defaultView.addEventListener('pagehide',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 return {sounds,stop,get enabled(){return state.enabled;},play(kind){
  if(!state.enabled)return Promise.resolve(false);stop();const audio=sounds.find(a=>a.dataset.uiSfx===kind);
  if(!audio)return Promise.resolve(false);try{return Promise.resolve(audio.play()).then(()=>true,()=>false);}catch{return Promise.resolve(false);}
 }};
}
export function mountContextSound(document){
 if(!document.querySelector('[name="prediction"]'))return;
 const sound=createEffectPlayer(document,{click:'assets/ui-audio/option-click.mp3'});document.body.append(...sound.sounds);
 document.addEventListener('change',event=>{if(event.target.matches('input[type="radio"][name="prediction"]')&&event.target.checked)sound.play('click');});
 return sound;
}
