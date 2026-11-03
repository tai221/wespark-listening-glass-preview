import {effectSettings} from './ui-sound.mjs';
export function mountSparkDialogue(document,{clips,motionAllowed=()=>true}={}){
 const view=document.defaultView,slot=document.querySelector('[data-spark-slot]'),portrait=slot.querySelector('.spark-portrait'),image=portrait.querySelector('img'),copy=slot.querySelector('[data-spark-copy]'),settings=effectSettings(document);
 const audio=document.createElement('audio');audio.preload='auto';audio.hidden=true;audio.dataset.sparkVoice='';audio.dataset.uiSfx='spark-voice';audio.volume=.85;document.body.append(audio);
 const button=document.createElement('button');button.type='button';button.dataset.sparkSpeak='';button.className='spark-speak';button.title='Nghe Spark nói';button.setAttribute('aria-label','Nghe Spark nói');portrait.replaceWith(button);button.append(portrait);
 const original={src:image.getAttribute('src'),width:image.getAttribute('width'),height:image.getAttribute('height')};image.width=160;image.height=160;
 let active=false,speaking=false,inView=true,current='welcome',request=0,raf=0,blink=0,frame='',words=[];
 const started=new Set();
 const available=()=>active&&!document.hidden&&inView,canMove=()=>available()&&motionAllowed();
 function showFrame(name){if(frame===name)return;frame=name;image.src=`assets/spark-talk-${name}-v1.webp`;}
 function paint(){
  if(!active)return;
  const time=audio.currentTime||0,cue=clips[current];
  words.forEach((word,i)=>{const visibility=speaking&&motionAllowed()&&time<cue.words[i].start?'hidden':'visible';if(word.style.visibility!==visibility)word.style.visibility=visibility;});
  const word=cue.words.find(w=>time>=w.start&&time<w.end),mouth=speaking&&word&&canMove();
  showFrame(mouth?`frame-${[1,2,1,0][Math.floor(time*9)%4]}`:'rest');
  slot.dataset.dialogueMoving=String(canMove());
 }
 function loop(){paint();if(speaking)raf=view.requestAnimationFrame(loop);}
 function stop(){request++;speaking=false;view.cancelAnimationFrame(raf);audio.pause();slot.dataset.dialogueState='idle';button.setAttribute('aria-label','Nghe Spark nói');button.title=settings.enabled?'Nghe Spark nói':'Bật âm thanh hiệu ứng để nghe Spark';paint();if(active)refresh();}
 function text(key){current=clips[key]?key:'welcome';const cue=clips[current];
  const accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent=cue.text;
  const visual=document.createElement('span');visual.setAttribute('aria-hidden','true');visual.className='spark-spoken-copy';words=cue.words.map(w=>{const span=document.createElement('span');span.dataset.spokenWord='';span.textContent=w.text;visual.append(span,document.createTextNode(' '));return span;});copy.replaceChildren(accessible,visual);
 }
 async function speak(key=current){
  stop();text(key);paint();if(!available()||!settings.enabled)return;
  if([...document.querySelectorAll('audio:not([data-ui-sfx]),video')].some(a=>!a.paused&&!a.ended))return;
  audio.src=clips[current].src;audio.currentTime=0;const token=++request;slot.dataset.dialogueState='loading';
  try{await audio.play();}catch{if(token===request){stop();}}
 }
 audio.addEventListener('playing',()=>{if(!available()||!settings.enabled){stop();return;}speaking=true;slot.dataset.dialogueState='speaking';button.setAttribute('aria-label','Dừng lời Spark');button.title='Dừng lời Spark';view.cancelAnimationFrame(raf);loop();});
 audio.addEventListener('waiting',()=>{speaking=false;view.cancelAnimationFrame(raf);slot.dataset.dialogueState='loading';paint();});
 for(const event of ['ended','error'])audio.addEventListener(event,stop);
 audio.addEventListener('timeupdate',paint);
 button.addEventListener('click',()=>{if(speaking)stop();else speak();});
 document.addEventListener('play',event=>{if(event.target!==audio&&event.target.matches('audio:not([data-ui-sfx]),video'))stop();},true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();refresh();});view.addEventListener('pagehide',stop);
 settings.subscribe(enabled=>{if(!enabled)stop();});
 if('IntersectionObserver'in view)new view.IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView)stop();refresh();},{threshold:.15}).observe(slot);
 function idleBlink(){blink=0;if(!canMove()||speaking)return;showFrame('frame-3');blink=view.setTimeout(()=>{blink=0;if(active){showFrame('rest');refresh();}},150);}
 function refresh(){if(active){paint();slot.dataset.dialogueMoving=String(canMove());if(canMove()&&!speaking&&!blink)blink=view.setTimeout(idleBlink,4800);if(!canMove()){view.clearTimeout(blink);blink=0;}}}
 function activate(value,key='welcome'){key=clips[key]?key:'welcome';button.disabled=!value;if(active===value&&(!value||current===key)){refresh();return;}if(active)stop();active=value;slot.toggleAttribute('data-dialogue-active',active);
  if(active){image.width=160;image.height=160;frame='';text(key);refresh();if(!started.has(key)){started.add(key);speak(key);}}
  else{stop();view.clearTimeout(blink);blink=0;image.setAttribute('src',original.src);if(original.width)image.setAttribute('width',original.width);if(original.height)image.setAttribute('height',original.height);}
 }
 return {activate,refresh};
}
