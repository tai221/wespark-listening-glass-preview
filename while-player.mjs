// Desktop source-player controls. Modifier shortcuts fire only when pressed alone.
export function mountListeningPlayer(media,{onError=()=>{},isSubmitted=()=>false}={}){
 const root=media.ownerDocument,win=root.defaultView,speed=root.querySelector('#listen-speed');
 let activeCard=null,modifier=null;
 const editing=target=>target?.closest?.('textarea,select,[contenteditable="true"],input:not([type=radio]):not([type=checkbox])');
 const blocked=event=>event.defaultPrevented||editing(event.target)||root.querySelector('dialog[open]');
 const seek=seconds=>{try{media.currentTime=Math.max(0,(Number.isFinite(media.currentTime)?media.currentTime:0)-seconds);}catch{onError();}};
 const play=async()=>{try{await media.play();}catch{onError();}};
 root.querySelectorAll('[data-rewind]').forEach(button=>button.addEventListener('click',()=>seek(Number(button.dataset.rewind))));
 root.querySelector('#listen-restart').addEventListener('click',()=>{try{media.currentTime=0;}catch{onError();return;}play();});
 speed.addEventListener('change',()=>{media.playbackRate=Number(speed.value);});
 media.addEventListener('ratechange',()=>{const value=String(media.playbackRate);if([...speed.options].some(option=>option.value===value))speed.value=value;});
 for(const name of ['focusin','click'])root.addEventListener(name,event=>{const card=event.target.closest?.('.question-card');if(card)activeCard=card;});
 root.addEventListener('keydown',event=>{
  if(event.repeat){modifier=null;return;}
  if(['Control','Shift'].includes(event.key)){
   modifier=!blocked(event)&&!event.metaKey&&!event.altKey&&!(event.key==='Control'?event.shiftKey:event.ctrlKey)?event.key:null;return;
  }
  modifier=null;
  if(blocked(event)||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||isSubmitted()||! /^[1-4]$/.test(event.key))return;
  const card=activeCard?.isConnected?activeCard:[...root.querySelectorAll('.question-card')].find(node=>!node.querySelector('input:checked'));
  const answer=card?.querySelectorAll('input[type=radio]')[Number(event.key)-1];
  if(answer&&!answer.disabled){event.preventDefault();answer.click();answer.focus();}
 });
 root.addEventListener('keyup',event=>{
  const alone=modifier===event.key;modifier=null;
  if(!alone||blocked(event)||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
  if(event.key==='Control'){if(media.paused||media.ended)play();else media.pause();}
  if(event.key==='Shift')seek(3);
 });
 root.addEventListener('pointerdown',()=>{modifier=null;});
 win.addEventListener('blur',()=>{modifier=null;});
}
