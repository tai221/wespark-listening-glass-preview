import {createEffectPlayer} from './ui-sound.mjs';
export function createQuizSound(document,{celebration=false}={}){
 const kinds=['correct','incorrect',...(celebration?['celebrate']:[])];
 const sound=createEffectPlayer(document,Object.fromEntries(kinds.map(kind=>[kind,`assets/quiz-audio/quiz-${kind}.wav`])));
 sound.sounds.forEach((audio,i)=>audio.dataset.quizSfx=kinds[i]);
 return {sounds:sound.sounds,stop:sound.stop,get enabled(){return sound.enabled;},celebrate(){return sound.play('celebrate');},play(correct){return sound.play(correct?'correct':'incorrect');}};
}
