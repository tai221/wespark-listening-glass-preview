import {createEffectPlayer} from './ui-sound.mjs';
const example='Small changes can help us reduce waste.';
const translation='Những thay đổi nhỏ có thể giúp chúng ta giảm chất thải.';
export const learningItems=[
 {id:'reduce-waste',type:'word',title:'reduce waste',phonetic:'/rɪˈdjuːs weɪst/',part:'cụm động từ',meaning:'giảm chất thải',example,translation,audio:'pre-engine/reduce-waste.wav'},
 {id:'small-changes',type:'word',title:'small changes',phonetic:'/smɔːl ˈtʃeɪndʒɪz/',part:'cụm danh từ',meaning:'những thay đổi nhỏ',example,translation,audio:'pre-engine/small-changes.wav'},
 {id:'reusable-bag',type:'word',title:'reusable bag',phonetic:'/ˌriːˈjuːzəbl bæɡ/',part:'cụm danh từ',meaning:'túi có thể dùng lại',example:'Now, I carry a reusable bag whenever I go shopping.',translation:'Giờ đây, tôi mang theo túi dùng lại mỗi khi đi mua sắm.',audio:'pre-engine/reusable-bag.wav'},
 {id:'throw-away',type:'word',title:'throw away',phonetic:'/θrəʊ əˈweɪ/',part:'cụm động từ',meaning:'vứt bỏ',example:'I wanted to throw away less, but I did not know where to begin.',translation:'Tôi muốn vứt bỏ ít hơn, nhưng không biết bắt đầu từ đâu.',audio:'pre-engine/throw-away.wav'},
 {id:'make-a-difference',type:'word',title:'make a difference',phonetic:'/meɪk ə ˈdɪfrəns/',part:'cụm động từ',meaning:'tạo ra sự khác biệt',example:'Small changes really can make a difference.',translation:'Những thay đổi nhỏ thực sự có thể tạo ra khác biệt.',audio:'pre-engine/make-a-difference.wav'},
 {"id":"recycling-bin","type":"word","title":"recycling bin","phonetic":"/ˌriːˈsaɪklɪŋ bɪn/","part":"cụm danh từ","meaning":"thùng rác tái chế","example":"Put empty bottles in the recycling bin.","translation":"Bỏ chai rỗng vào thùng rác tái chế.","audio":"pre-engine/recycling-bin.wav"},
 {"id":"plastic-bottle","type":"word","title":"plastic bottle","phonetic":"/ˈplæstɪk ˈbɒtl/","part":"cụm danh từ","meaning":"chai nhựa","example":"I try to buy fewer plastic bottles.","translation":"Tôi cố gắng mua ít chai nhựa hơn.","audio":"pre-engine/plastic-bottle.wav"},
 {"id":"cloth-bag","type":"word","title":"cloth bag","phonetic":"/klɒθ bæɡ/","part":"cụm danh từ","meaning":"túi vải","example":"A cloth bag can be used many times.","translation":"Một chiếc túi vải có thể dùng nhiều lần.","audio":"pre-engine/cloth-bag.wav"},
 {"id":"fresh-produce","type":"word","title":"fresh produce","phonetic":"/freʃ ˈprɒdjuːs/","part":"cụm danh từ","meaning":"rau củ quả tươi","example":"We buy fresh produce at the local market.","translation":"Chúng tôi mua rau củ quả tươi ở chợ địa phương.","audio":"pre-engine/fresh-produce.wav"},
 {"id":"plant-a-tree","type":"word","title":"plant a tree","phonetic":"/plɑːnt ə triː/","part":"cụm động từ","meaning":"trồng một cái cây","example":"Our class will plant a tree this weekend.","translation":"Lớp chúng tôi sẽ trồng một cái cây vào cuối tuần này.","audio":"pre-engine/plant-a-tree.wav"},
 {"id":"disposable-cup","type":"word","title":"disposable cup","phonetic":"/dɪˈspəʊzəbl kʌp/","part":"cụm danh từ","meaning":"cốc dùng một lần","example":"Bring your own mug instead of using a disposable cup.","translation":"Mang cốc của bạn thay vì dùng cốc dùng một lần.","audio":"pre-engine/disposable-cup.wav"},
 {"id":"eco-friendly-habits","type":"word","title":"eco-friendly habits","phonetic":"/ˌiːkəʊ ˈfrendli ˈhæbɪts/","part":"cụm danh từ","meaning":"những thói quen thân thiện với môi trường","example":"Eco-friendly habits can start with small changes.","translation":"Những thói quen thân thiện với môi trường có thể bắt đầu từ thay đổi nhỏ.","audio":"pre-engine/eco-friendly-habits.wav"},
 {id:'can',type:'pattern',title:'can + động từ nguyên mẫu',label:'can + V',focus:'can start',meaning:'Diễn đạt khả năng hoặc điều có thể thực hiện. Chú ý động từ ngay sau “can”.',example:'We can start today.',translation:'Chúng ta có thể bắt đầu hôm nay.'},
 {id:'used-to',type:'pattern',title:'used to + động từ nguyên mẫu',label:'used to + V',focus:'used to be',meaning:'Diễn tả thói quen hoặc trạng thái trong quá khứ, hiện tại đã thay đổi.',example:'Every evening, our kitchen bin used to be full.',translation:'Trước đây, mỗi tối thùng rác trong bếp của chúng tôi thường đầy.'}
];
export function mountLearning(document,items=learningItems,{assessments={},onAssess=()=>{}}={}){
 const $=s=>document.querySelector(s),list=$('#learning-list'),audio=$('#vocab-audio');
 const clickSound=createEffectPlayer(document,{click:'assets/ui-audio/option-click.mp3'});document.body.append(...clickSound.sounds);
 let selected,request=0,category='all',activeSlide,initialized=false;
 const detail=$('#learning-detail'),content=document.createElement('div');content.className='learning-detail-content';
 content.append(...detail.childNodes);detail.append(content);
 const summary=document.createElement('section');summary.id='learning-recall-summary';summary.hidden=true;summary.setAttribute('aria-labelledby','recall-summary-title');
 summary.innerHTML='<h2 id="recall-summary-title" tabindex="-1">Cùng ôn lại nhé!</h2><p id="recall-summary-terms" lang="en"></p><div id="recall-summary-actions"></div>';
 detail.append(summary);summary.insertBefore($('#recall-invitation'),$('#recall-summary-actions'));const scope=$('#learning-practice-scope');if(scope)$('#recall-summary-actions').prepend(scope);
 const reduced=document.defaultView.matchMedia('(prefers-reduced-motion: reduce)');
 function stopSlide(){activeSlide?.cancel();activeSlide=undefined;}
 function slide(node,direction=1){
  stopSlide();if(!initialized||reduced.matches||document.body.dataset.glassMotion==='false'||!node.animate)return;
  activeSlide=node.animate([{transform:`translateX(${direction*32}px)`,opacity:.35},{transform:'translateX(0)',opacity:1}],{duration:260,easing:'cubic-bezier(.22,1,.36,1)'});
 }
 reduced.addEventListener('change',event=>{if(event.matches)stopSlide();});
 document.defaultView.addEventListener('glass-motion-change',event=>{if(!event.detail.enabled)stopSlide();});
 function showSummary(){const changed=summary.hidden;detail.setAttribute('aria-labelledby','recall-summary-title');content.hidden=true;summary.hidden=false;audio.pause();if(changed)slide(summary);}
 function icon(value){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${value==='practice'?'M20 7v5h-5M19 12a7 7 0 1 0-2 5M20 12l-3-5':'m5 12 4 4L19 6'}"/></svg>`;}

 const progress=document.querySelector('.learning-library-heading>span');progress.className='learning-progress';progress.setAttribute('role','status');progress.setAttribute('aria-live','polite');progress.setAttribute('aria-atomic','true');
 const progressCopy=document.createElement('span');progressCopy.className='learning-progress-copy';
 const progressCount=document.createElement('strong'),progressTotal=document.createTextNode(''),progressLabel=document.createElement('small');progressLabel.textContent='đã chọn';progressCopy.append(progressCount,progressTotal,progressLabel);
 const progressTrack=document.createElement('span');progressTrack.className='learning-progress-track';progressTrack.setAttribute('aria-hidden','true');
 const rememberedFill=document.createElement('i'),practiceFill=document.createElement('i');rememberedFill.className='progress-remembered';practiceFill.className='progress-practice';progressTrack.append(rememberedFill,practiceFill);
 const legend=document.createElement('span');legend.className='learning-progress-legend';legend.setAttribute('aria-hidden','true');const rememberedLabel=document.createElement('span'),practiceLabel=document.createElement('span');rememberedLabel.className='progress-remembered-label';practiceLabel.className='progress-practice-label';legend.append(rememberedLabel,practiceLabel);progress.replaceChildren(progressCopy,progressTrack,legend);
 function updateProgress(){
  const remembered=items.filter(x=>assessments[x.id]==='remembered').length,practice=items.filter(x=>assessments[x.id]==='practice').length,count=remembered+practice;
  const label=`${count} / ${items.length} đã chọn: ${remembered} đã nhớ, ${practice} cần luyện, ${items.length-count} chưa đánh dấu`;
  if(progress.getAttribute('aria-label')===label)return;progress.setAttribute('aria-label',label);progress.title=label;progressCount.textContent=String(count);progressTotal.textContent=` / ${items.length} `;progress.dataset.complete=String(count===items.length&&items.length>0);
  rememberedFill.style.width=`${items.length?remembered/items.length*100:0}%`;practiceFill.style.width=`${items.length?practice/items.length*100:0}%`;
  rememberedLabel.textContent=`${remembered} đã nhớ`;practiceLabel.textContent=`${practice} cần luyện`;
 }
 const actions=document.createElement('div');actions.className='learning-assessment-actions';
 const position=document.createElement('span');position.id='learning-position';position.setAttribute('role','status');
 function action(value,label,item){const b=document.createElement('button');b.type='button';b.innerHTML=icon(value);if(!item){const text=document.createElement('span');text.textContent=label;b.append(text);}b.title=label;b.dataset.assessment=value;if(item){b.dataset.assessmentItem=item.id;b.setAttribute('aria-label',`${label}: ${item.title}`);}b.addEventListener('click',()=>{clickSound.play('click');assess(item||selected,value,!!item);});return b;}
 actions.append(position,action('practice','Cần luyện'),action('remembered','Đã nhớ'));content.append(actions);
 function updateNavigation(){const status=assessments[selected?.id];position.textContent=status==='practice'?'Cần luyện':status==='remembered'?'Đã nhớ':'Chưa đánh dấu';position.dataset.status=status||'unassessed';updateProgress();
 document.querySelectorAll('[data-assessment]').forEach(b=>b.setAttribute('aria-pressed',String(assessments[b.dataset.assessmentItem||selected?.id]===b.dataset.assessment)));
 list.querySelectorAll('[data-learning-item]').forEach(b=>{b.dataset.assessmentStatus=assessments[b.dataset.learningItem]||'unassessed';});}
 function filterTo(value){category=value;document.querySelectorAll('[data-learning-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.learningFilter===category)));list.querySelectorAll('[data-learning-group]').forEach(g=>g.hidden=category!=='all'&&g.dataset.learningGroup!==category);}
 function assess(item,value,fromCard=false){if(!item)return;const clearing=assessments[item.id]===value;value=clearing?null:value;assessments={...assessments};if(clearing)delete assessments[item.id];else assessments[item.id]=value;
 if(fromCard){updateNavigation();const complete=items.every(x=>assessments[x.id]);if(complete)showSummary();onAssess(item.id,value);if(complete)$('#recall-summary-title').focus();return;}
 request++;audio.pause();error.hidden=true;
 if(clearing){if(category!=='all'&&item.type!==category)filterTo(item.type);choose(item);onAssess(item.id,null);actions.querySelector('[data-assessment="practice"]').focus();return;}
 const next=items.find(x=>!assessments[x.id]&&(category==='all'||x.type===category))||items.find(x=>!assessments[x.id]);
 if(next){if(category!=='all'&&next.type!==category)filterTo(next.type);choose(next);}else{updateNavigation();showSummary();}onAssess(item.id,value);if(next)actions.querySelector(`[data-assessment="${value}"]`).focus();else $('#recall-summary-title').focus();}
 const button=$('#learning-audio'),error=$('#learning-error'),save=$('#learning-save');
 function choose(item){
  const changed=!!selected&&(selected!==item||!summary.hidden),direction=items.indexOf(item)<items.indexOf(selected)?-1:1;
  detail.setAttribute('aria-labelledby','learning-heading');content.hidden=false;summary.hidden=true;selected=item;updateNavigation();request++;audio.pause();error.hidden=true;
  list.querySelectorAll('[data-learning-item]').forEach(b=>{if(b.dataset.learningItem===item.id)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
  const activeCard=list.querySelector('[aria-current="true"]');
  if(activeCard&&list.clientHeight){const area=list.getBoundingClientRect(),card=activeCard.getBoundingClientRect();if(card.top<area.top)list.scrollTop+=card.top-area.top-3;else if(card.bottom>area.bottom)list.scrollTop+=card.bottom-area.bottom+3;}
  const picture=$('#learning-illustration');picture.hidden=item.type!=='word';if(item.type==='word')picture.src=`assets/vocabulary/graphic/${item.id}.webp`;else picture.removeAttribute('src');$('#learning-heading').textContent=item.title;$('#learning-heading').lang=item.type==='word'?'en':'vi';
  $('#learning-meaning').textContent=item.meaning;const meta=$('#learning-word-meta');meta.hidden=item.type!=='word';meta.textContent=[item.phonetic,item.part].filter(Boolean).join('  ·  ');list.querySelectorAll('[data-group-count]').forEach(el=>{const group=items.filter(i=>i.type===el.dataset.groupCount);const position=group.indexOf(item);el.textContent=(position>=0?`${position+1} / `:'')+group.length;el.setAttribute('aria-label',position>=0?`Mục ${position+1} trong ${group.length}`:`${group.length} mục`);});$('#learning-translation').textContent=item.translation;
  const sentence=$('#learning-example'),focus=item.focus||item.title,index=item.example.toLowerCase().indexOf(focus.toLowerCase());
  sentence.replaceChildren();
  if(index<0)sentence.textContent=item.example;
  else{const mark=document.createElement('mark');mark.textContent=item.example.slice(index,index+focus.length);sentence.append(item.example.slice(0,index),mark,item.example.slice(index+focus.length));}
  button.hidden=save.hidden=$('#learning-pronunciation').hidden=item.type!=='word';document.querySelector('#learning-detail').dataset.learningType=item.type;
  save.setAttribute('aria-label',`Lưu từ: ${item.title}`);button.setAttribute('aria-label',`Nghe phát âm: ${item.title}`);button.title=`Nghe ${item.title}`;
  if(item.audio&&audio.getAttribute('src')!==item.audio){audio.setAttribute('src',item.audio);audio.load();}
  if(changed)slide(content,direction);
 }
 list.replaceChildren();
 for(const [type,title] of [['word','Từ/cụm từ'],['pattern','Mẫu câu']]){
  const group=items.filter(item=>item.type===type);if(!group.length)continue;
  const section=document.createElement('section'),heading=document.createElement('h2');
  section.dataset.learningGroup=type;heading.innerHTML=type==='word'?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v18H5zM8 8h8M8 12h5M8 16h8"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v12H9l-5 4V5Z M8 9h8M8 13h5"/></svg>';const label=document.createElement('span');label.textContent=title;const count=document.createElement('small');count.dataset.groupCount=type;heading.append(label,count);section.append(heading);
  for(const item of group){const b=document.createElement('button');b.type='button';b.dataset.learningItem=item.id;const label=document.createElement('span');label.lang='en';label.textContent=item.label||item.title;const art=document.createElement('span');art.className='learning-card-art';art.setAttribute('aria-hidden','true');
   if(type==='word'){const image=document.createElement('img');image.src=`assets/vocabulary/graphic/${item.id}.webp`;image.alt='';image.width=100;image.height=100;art.append(image);}else{const formula=document.createElement('span');formula.textContent=item.label;art.append(formula);}
   if(type==='pattern'){b.setAttribute('aria-label',`Mẫu câu: ${item.label||item.title}`);label.textContent='Mẫu câu';}
   const wrapper=document.createElement('div');wrapper.className='learning-card-wrapper';b.className='learning-card';b.append(art,label);b.setAttribute('aria-controls','learning-detail');b.addEventListener('click',()=>{if(selected!==item||!summary.hidden)clickSound.play('click');choose(item);});const controls=document.createElement('div');controls.className='learning-card-actions';controls.append(action('practice','Cần luyện',item),action('remembered','Đã nhớ',item));wrapper.append(b,controls);section.append(wrapper);}
  list.append(section);
 }
 button.addEventListener('click',async()=>{
  const token=++request;error.hidden=true;
  try{if(audio.error)audio.load();audio.currentTime=0;await audio.play();}catch{if(token===request)error.hidden=false;}
 });
 audio.addEventListener('error',()=>{if(selected?.type==='word'&&document.body.dataset.preStep==='1')error.hidden=false;});
 updateProgress();
 document.querySelectorAll('[data-learning-filter]').forEach(filter=>{
  const filterCategory=filter.dataset.learningFilter;filter.hidden=filterCategory!=='all'&&!items.some(item=>item.type===filterCategory);
  filter.addEventListener('click',()=>{
   category=filterCategory;
   document.querySelectorAll('[data-learning-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button===filter)));
   list.querySelectorAll('[data-learning-group]').forEach(group=>{group.hidden=category!=='all'&&group.dataset.learningGroup!==category;});
   if(selected&&category!=='all'&&selected.type!==category)choose(items.find(item=>item.type===category));
   updateNavigation();
  });
 });
 if(items.length)choose(items.find(item=>!assessments[item.id])||items[0]);
 if(items.length&&items.every(item=>assessments[item.id]))showSummary();
 initialized=true;
 return {getAssessments:()=>assessments,showSummary};
}
