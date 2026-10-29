// Decorative motion shares the companion's preference; never changes learning state.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let enabled=true,entered=false;
try{enabled=sessionStorage.getItem('wespark-listening-glass-motion')!=='off';}catch{}
const media=[...document.querySelectorAll('audio,video')];
const image=document.querySelector('.studio-planet');
const animations=new Set();
function allowed(){return enabled&&!reduced.matches&&!document.hidden;}
function animate(el,frames,options){if(!allowed()||!el?.animate)return;const a=el.animate(frames,options);animations.add(a);a.onfinish=()=>animations.delete(a);return a;}
function synchronize(){
 const on=allowed();document.body.dataset.glassMotion=String(on);
 document.body.dataset.glassPlaying=String(media.some(a=>!a.paused&&!a.ended));
 if(!on){animations.forEach(a=>a.cancel());animations.clear();document.getAnimations().forEach(a=>a.cancel());if(image)image.style.transform='';}
 if(on&&!entered){entered=true;document.querySelectorAll('.studio-greeting,.studio-scene,.section-heading,.studio-stage,.page-heading,.filters').forEach((el,i)=>animate(el,[{transform:'translateY(14px)'},{transform:'translateY(0)'}],{duration:600,delay:Math.min(i,6)*65,easing:'cubic-bezier(.2,.7,.2,1)'}));}
}
window.addEventListener('glass-motion-change',event=>{enabled=event.detail.enabled;synchronize();});
reduced.addEventListener('change',synchronize);document.addEventListener('visibilitychange',synchronize);
media.forEach(a=>['play','pause','ended','error'].forEach(event=>a.addEventListener(event,synchronize)));
// Image depth follows pointer only; text, hit targets and layout stay still.
const scene=document.querySelector('.studio-scene');
scene?.addEventListener('pointermove',event=>{if(document.body.dataset.glassMotion!=='true'||!allowed()||event.pointerType==='touch'||!image)return;const r=scene.getBoundingClientRect();const x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;image.style.transform=`perspective(700px) rotateY(${x*10}deg) rotateX(${-y*8}deg)`;});
scene?.addEventListener('pointerleave',()=>{if(image)image.style.transform='';});
// State announcements already drive the companion's completion celebration.
// Small press feedback is finite and ignores controls when motion is disabled.
document.addEventListener('click',event=>{const b=event.target.closest('.button');if(b&&!b.disabled)animate(b,[{scale:'1'},{scale:'.97',offset:.45},{scale:'1'}],{duration:220,easing:'ease-out'});});
synchronize();
