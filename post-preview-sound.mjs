import {createEffectPlayer,effectSettings} from './ui-sound.mjs';
const root='assets/post-preview-audio/';
const cues={dictation:['dictation-sample','typing','confirm'],shadowing:['shadowing-sample','record','shadowing-sample'],conversation:['conversation-question','conversation-answer','confirm']};
const spoken=new Set(['dictation-sample','shadowing-sample','conversation-question','conversation-answer']);
export function createPreviewSound(document,{onVoice=()=>{}}={}){
 const state=effectSettings(document),sources=Object.fromEntries([...new Set(Object.values(cues).flat())].map(key=>[key,root+key+'.wav']));
 const player=createEffectPlayer(document,sources);let armed=false,active=true;
 const available=()=>armed&&active&&!document.hidden&&state.enabled;
 function stop(){player.stop();onVoice(false);}
 for(const audio of player.sounds){
  audio.dataset.postPreviewAudio='';audio.volume=spoken.has(audio.dataset.uiSfx)?.6:.2;
  audio.addEventListener('play',()=>{if(!available()){audio.pause();return;}onVoice(spoken.has(audio.dataset.uiSfx));});
  for(const event of ['pause','ended','error'])audio.addEventListener(event,()=>onVoice(false));
 }
 document.body.append(...player.sounds);
 state.subscribe(enabled=>{if(!enabled)stop();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 document.defaultView.addEventListener('pagehide',()=>{active=false;stop();});
 document.defaultView.addEventListener('pageshow',()=>{active=true;});
 return {sounds:player.sounds,arm(){armed=true;},stop,play(method,step){
  const cue=cues[method]?.[step];if(!available()||!cue)return Promise.resolve(false);
  return player.play(cue);
 }};
}
