const svg=path=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
const paths={headphones:'M4 14v-3a8 8 0 0 1 16 0v3M4 12H2v8h5v-8H4Zm16 0h2v8h-5v-8h3Z',book:'M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z',quiz:'M5 3h14v18H5ZM8 8h8M8 12h8M8 16h4',pen:'m4 20 4-1L20 7l-3-3L5 16l-1 4ZM14 7l3 3',mic:'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 11v1a7 7 0 0 0 14 0v-1M12 19v3',chat:'M3 3h14v11H8l-5 4V3ZM20 8h2v14l-5-4h-6v-2'};
paths.bolt='m14 2-9 12h7l-2 8 9-12h-7l2-8Z';
paths.game='M7 7h10c3 0 4 3 5 9 .5 3-2 4-4 2l-3-3H9l-3 3c-2 2-4.5 1-4-2 1-6 2-9 5-9ZM6 9v5M3.5 11.5h5M16 10h.1M19 13h.1';
const tick=svg('m5 12 4 4 10-10'),play=svg('m9 5 10 7-10 7V5Z');
const cursor=`<span class="demo-cursor">${svg('m4 3 5 17 3-7 7-3L4 3Z')}</span>`;
const wave='<span class="demo-wave">'+Array.from({length:25},(_,i)=>`<i style="--h:${[12,24,18,32,20,14,28][i%7]}px;--d:${-i*71}ms"></i>`).join('')+'</span>';
const player=`<div class="demo-player">${play}${wave}</div>`;
const picture=(src,alt,cls='')=>`<img class="${cls}" src="assets/${src}" alt="${alt}">`;
const options=(values,prediction=false)=>`<div class="demo-options ${prediction?'is-prediction':''}">${values.map((v,i)=>`<div class="demo-option ${i===0?'demo-target':''}"><span class="demo-radio">${!prediction&&i===0?tick:''}</span>${v}${i===0?cursor:''}</div>`).join('')}</div>`;
const activityArt={
 dictation:`<rect x="29" y="18" width="78" height="91" rx="9" fill="#f3df9b" transform="rotate(-8 68 64)"/><rect x="40" y="18" width="76" height="94" rx="8" fill="#fffefa" stroke="#c5ad65"/><path d="M53 39h46M53 51h33M53 63h16M53 91h46" stroke="#b6aa88"/><rect x="75" y="58" width="27" height="14" rx="3" fill="#ffe49a"/><path d="m91 89 25-25 7 7-25 25-11 4 4-11Z" fill="#ffd253" stroke="#8d6c21"/><path d="m112 68 7 7" stroke="#8d6c21"/>`,
 shadowing:`<path d="M27 53v-5a43 43 0 0 1 86 0v5" stroke="#b9a779" stroke-width="5"/><rect x="19" y="44" width="16" height="35" rx="8" fill="#f3df9b"/><rect x="105" y="44" width="16" height="35" rx="8" fill="#f3df9b"/><rect x="56" y="29" width="29" height="49" rx="14" fill="#ffd253" stroke="#9a7627"/><path d="M46 62v5a25 25 0 0 0 50 0v-5M71 92v16M55 109h32M64 42h14M64 50h14" stroke="#8d6c21"/><path d="M31 96v8M39 91v18M103 92v16M111 97v6" stroke="#d4b558"/>`,
 conversation:`<path d="M19 24h77a10 10 0 0 1 10 10v35a10 10 0 0 1-10 10H46L26 94V79h-7a10 10 0 0 1-10-10V34a10 10 0 0 1 10-10Z" fill="#fffefa" stroke="#c5ad65"/><path d="M65 62h56a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10h-2v13l-18-13H65a10 10 0 0 1-10-10V72a10 10 0 0 1 10-10Z" fill="#ffe49a" stroke="#c5ad65"/><path d="M26 43h60M26 55h35" stroke="#b6aa88"/><circle cx="76" cy="84" r="3" fill="#9a7627"/><circle cx="93" cy="84" r="3" fill="#9a7627"/><circle cx="110" cy="84" r="3" fill="#9a7627"/>`
};
const graphic=key=>`<svg class="demo-activity-art" viewBox="0 0 140 130" aria-hidden="true" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${activityArt[key]}</svg>`;
export const DEMO_DURATIONS=[3000,2500,2500,5000,2500,3500,4000,4000,3000];
const scenes=[
 ['pre','Đoán ngữ cảnh',`<div class="demo-context">${picture('lesson-covers/planet-v1.webp','Thói quen nhỏ, ít rác thải hơn','demo-cover')}<div><h3>Bạn nghĩ bài nghe sẽ nói về…</h3>${options(['Thói quen hằng ngày','Công nghệ xanh','Dự án cộng đồng'],true)}</div></div>`],
 ['pre','Học từ và câu',`<div class="demo-vocab">${picture('vocabulary/graphic/throw-away.webp','Minh họa cụm từ throw away','demo-art')}<div><h3>throw away</h3><p>vứt bỏ</p><div class="demo-assess"><span>Cần luyện</span><span class="demo-target">${tick} Đã nhớ${cursor}</span></div></div></div>`],
 ['pre','Quiz hoặc Game',`<div class="demo-choices"><div class="demo-choice demo-target"><div class="demo-quiz-art">${svg(paths.quiz)}<span>${tick}</span></div><strong>Quiz</strong>${cursor}</div><div class="demo-choice"><div class="demo-game-art">${svg(paths.game)}</div><strong>Game</strong></div></div>`],
 ['while','Nghe và hiểu',`<div class="demo-listen">${player}<div class="demo-listen-question"><h3>Nội dung chính của đoạn nghe là gì?</h3>${options(['Những thay đổi nhỏ để giảm rác thải','Chuẩn bị cho một chuyến đi'])}</div><p class="demo-evidence">So I decided to try a few <mark>small changes.</mark></p></div>`],
 ['post','Chọn cách luyện',`<div class="demo-activities">${[['dictation','Nghe chép'],['shadowing','Shadowing'],['conversation','Hội thoại']].map(([asset,label],i)=>`<div class="demo-activity-choice">${graphic(asset)}<strong>${label}</strong><span class="demo-activity-radio" aria-hidden="true"></span></div>`).join('')}</div>`],
 ['post','Nghe chép',`<div class="demo-writing">${player}<p>I wanted to throw <span class="demo-word" aria-label="away">${Array.from('away',(c,i)=>`<span aria-hidden="true" style="--char-delay:${1100+i*250}ms">${c}</span>`).join('')}${tick}</span> less.</p></div>`],
 ['post','Shadowing',`<div class="demo-shadow">${picture('spark-activities/shadowing-v1.webp','Spark luyện nói theo','demo-speaker')}<div><p lang="en">Every evening, our kitchen bin used to be full.</p><div class="demo-voice demo-model">${svg(paths.headphones)}${wave}<span>Nghe mẫu</span></div><div class="demo-voice demo-repeat">${svg(paths.mic)}${wave}<span>Nói lại</span></div></div></div>`],
 ['post','Hội thoại',`<div class="demo-chat"><div class="demo-chat-question">${picture('spark-activities/conversation-v1.webp','Spark trò chuyện')}<p lang="en">What could we change at home to reduce waste?</p></div><div class="demo-chat-record">${svg(paths.mic)}${wave}</div><div class="demo-chat-answer"><p lang="en">We could use reusable bags instead of plastic bags.</p>${svg('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 22v-2a8 8 0 0 1 16 0v2')}</div></div>`],
 ['post','SparkPoint',`<div class="demo-reward"><div class="demo-reward-coin">${svg(paths.bolt)}</div><div class="demo-reward-copy"><strong>+1</strong><span>SparkPoint</span></div><div class="demo-reward-particles" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i style="--angle:${i*45}deg;--delay:${i%3*70}ms"></i>`).join('')}</div></div>`]
];
const stageNames={pre:'Chuẩn bị',while:'Nghe hiểu',post:'Vận dụng'};
const chapterSpecs=[['headphones','Đoán','ngữ cảnh'],['book','Học từ','và câu'],['quiz','Quiz','hoặc Game'],['headphones','Nghe','và hiểu'],['book','Chọn','cách luyện'],['pen','Nghe','chép'],['mic','Shadowing','Nói theo'],['chat','Hội','thoại'],['bolt','Nhận','SparkPoint']];
function chapter(index){const [icon,a,b]=chapterSpecs[index],stage=scenes[index][0];return `<span class="demo-chapter-icon">${svg(paths[icon])}</span><span class="demo-chapter-type"><strong>${a}<br>${b}</strong><span class="demo-chapter-dots" aria-label="${stageNames[stage]}">${['pre','while','post'].map(s=>`<i class="${s===stage?'is-current':''}"></i>`).join('')}</span></span>`;}
const mounted=new WeakMap();
export function mountLibraryDemo(root,{motion=root.ownerDocument.defaultView.matchMedia('(prefers-reduced-motion: reduce)')}={}){
 if(mounted.has(root))return mounted.get(root);
 const doc=root.ownerDocument,w=doc.defaultView,content=root.querySelector('.demo-scene'),toggle=root.querySelector('[data-demo-toggle]'),seek=root.querySelector('[data-demo-seek]');
 let index=0,timer=null,transition=null,paused=false,focused=false,visible=true,remaining=DEMO_DURATIONS[0],started=0,running=false;
 const blocked=()=>paused||focused||!visible||doc.hidden||motion.matches||doc.body.dataset.glassMotion==='false';
 function schedule(){
  if(running){remaining=Math.max(0,remaining-(Date.now()-started));clearTimeout(timer);}
  running=!blocked();root.dataset.running=String(running);if(!running)transition?.pause?.();else transition?.play?.();
  if(running){started=Date.now();timer=setTimeout(()=>{running=false;index=(index+1)%scenes.length;render();},remaining);}
 }
 function render(){
  clearTimeout(timer);running=false;remaining=DEMO_DURATIONS[index];transition?.cancel();transition=null;root.dataset.static=String(blocked());root.dataset.scene=String(index);root.dataset.stage=scenes[index][0];
  content.innerHTML=scenes[index][2];root.querySelector('[data-demo-caption]').innerHTML=chapter(index);root.querySelector('[data-demo-caption]').setAttribute('aria-label',stageNames[scenes[index][0]]+' · '+scenes[index][1]);
  seek.max=String(scenes.length-1);seek.value=String(index);seek.setAttribute('aria-valuetext',scenes[index][1]);root.style.setProperty('--demo-progress',`${(index+1)/scenes.length*100}%`);
  if(!blocked()&&content.animate)transition=content.animate([{opacity:.1,transform:index%2?'translateX(28px) scale(1.04)':'translateY(20px) scale(1.06)'},{opacity:1,transform:'translate(0,0) scale(1)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
  schedule();
 }
 function updateToggle(){root.dataset.reduced=String(motion.matches);toggle.disabled=motion.matches;toggle.setAttribute('aria-label',paused?'Phát tiếp minh họa':'Tạm dừng minh họa');toggle.title=motion.matches?'Đã giảm chuyển động · Kéo thanh tiến trình để xem':toggle.getAttribute('aria-label');toggle.innerHTML=paused?play:svg('M8 5v14M16 5v14');}
 toggle.addEventListener('click',()=>{paused=!paused;updateToggle();schedule();});
 seek.addEventListener('input',()=>{index=Number(seek.value);paused=true;updateToggle();render();});
 root.addEventListener('focusin',e=>{focused=!toggle.contains(e.target);schedule();});root.addEventListener('focusout',e=>{focused=root.contains(e.relatedTarget)&&!toggle.contains(e.relatedTarget);schedule();});doc.addEventListener('visibilitychange',schedule);
 motion.addEventListener('change',()=>{updateToggle();schedule();});new w.MutationObserver(schedule).observe(doc.body,{attributes:true,attributeFilter:['data-glass-motion']});
 if(w.IntersectionObserver)new w.IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);schedule();},{threshold:.15}).observe(root);
 root.querySelector('.demo-bottom').hidden=false;const api={};mounted.set(root,api);updateToggle();render();return api;
}
if(typeof document!=='undefined')document.querySelectorAll('[data-listening-demo]').forEach(root=>mountLibraryDemo(root));
