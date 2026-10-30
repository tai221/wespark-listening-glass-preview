const example='Small changes can help us reduce waste.';
const translation='Những thay đổi nhỏ có thể giúp chúng ta giảm chất thải.';
export const learningItems=[
 {id:'reduce-waste',type:'word',title:'reduce waste',phonetic:'/rɪˈdjuːs weɪst/',part:'cụm động từ',meaning:'giảm chất thải',example,translation,audio:'pre-engine/reduce-waste.wav'},
 {id:'small-changes',type:'word',title:'small changes',phonetic:'/smɔːl ˈtʃeɪndʒɪz/',part:'cụm danh từ',meaning:'những thay đổi nhỏ',example,translation,audio:'pre-engine/small-changes.wav'},
 {id:'reusable-bag',type:'word',title:'reusable bag',phonetic:'/ˌriːˈjuːzəbl bæɡ/',part:'cụm danh từ',meaning:'túi có thể dùng lại',example:'Now, I carry a reusable bag whenever I go shopping.',translation:'Giờ đây, tôi mang theo túi dùng lại mỗi khi đi mua sắm.',audio:'pre-engine/reusable-bag.wav'},
 {id:'throw-away',type:'word',title:'throw away',phonetic:'/θrəʊ əˈweɪ/',part:'cụm động từ',meaning:'vứt bỏ',example:'I wanted to throw away less, but I did not know where to begin.',translation:'Tôi muốn vứt bỏ ít hơn, nhưng không biết bắt đầu từ đâu.',audio:'pre-engine/throw-away.wav'},
 {id:'make-a-difference',type:'word',title:'make a difference',phonetic:'/meɪk ə ˈdɪfrəns/',part:'cụm động từ',meaning:'tạo ra sự khác biệt',example:'Small changes really can make a difference.',translation:'Những thay đổi nhỏ thực sự có thể tạo ra khác biệt.',audio:'pre-engine/make-a-difference.wav'},
 {id:'can',type:'pattern',title:'can + động từ nguyên mẫu',label:'can + V',focus:'can start',meaning:'Diễn đạt khả năng hoặc điều có thể thực hiện. Chú ý động từ ngay sau “can”.',example:'We can start today.',translation:'Chúng ta có thể bắt đầu hôm nay.'},
 {id:'used-to',type:'pattern',title:'used to + động từ nguyên mẫu',label:'used to + V',focus:'used to be',meaning:'Diễn tả thói quen hoặc trạng thái trong quá khứ, hiện tại đã thay đổi.',example:'Every evening, our kitchen bin used to be full.',translation:'Trước đây, mỗi tối thùng rác trong bếp của chúng tôi thường đầy.'}
];
export function mountLearning(document,items=learningItems){
 const $=s=>document.querySelector(s),list=$('#learning-list'),audio=$('#vocab-audio');
 let selected,request=0;
 const button=$('#learning-audio'),error=$('#learning-error'),save=$('#learning-save');
 function choose(item){
  selected=item;request++;audio.pause();error.hidden=true;
  list.querySelectorAll('[data-learning-item]').forEach(b=>{if(b.dataset.learningItem===item.id)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
  const picture=$('#learning-illustration');picture.hidden=item.type!=='word';if(item.type==='word')picture.src=`assets/vocabulary/${item.id}.webp`;else picture.removeAttribute('src');$('#learning-heading').textContent=item.title;$('#learning-heading').lang=item.type==='word'?'en':'vi';
  $('#learning-meaning').textContent=item.meaning;const meta=$('#learning-word-meta');meta.hidden=item.type!=='word';meta.textContent=[item.phonetic,item.part].filter(Boolean).join('  ·  ');list.querySelectorAll('[data-group-count]').forEach(el=>{const group=items.filter(i=>i.type===el.dataset.groupCount);const position=group.indexOf(item);el.textContent=(position>=0?`${position+1} / `:'')+group.length;el.setAttribute('aria-label',position>=0?`Mục ${position+1} trong ${group.length}`:`${group.length} mục`);});$('#learning-translation').textContent=item.translation;
  const sentence=$('#learning-example'),focus=item.focus||item.title,index=item.example.toLowerCase().indexOf(focus.toLowerCase());
  sentence.replaceChildren();
  if(index<0)sentence.textContent=item.example;
  else{const mark=document.createElement('mark');mark.textContent=item.example.slice(index,index+focus.length);sentence.append(item.example.slice(0,index),mark,item.example.slice(index+focus.length));}
  button.hidden=save.hidden=$('#learning-pronunciation').hidden=item.type!=='word';document.querySelector('#learning-detail').dataset.learningType=item.type;
  save.setAttribute('aria-label',`Lưu từ: ${item.title}`);button.setAttribute('aria-label',`Nghe phát âm: ${item.title}`);button.title=`Nghe ${item.title}`;
  if(item.audio&&audio.getAttribute('src')!==item.audio){audio.setAttribute('src',item.audio);audio.load();}
 }
 list.replaceChildren();
 for(const [type,title] of [['word','Từ/cụm từ'],['pattern','Mẫu câu']]){
  const group=items.filter(item=>item.type===type);if(!group.length)continue;
  const section=document.createElement('section'),heading=document.createElement('h2');
  section.dataset.learningGroup=type;heading.innerHTML=type==='word'?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v18H5zM8 8h8M8 12h5M8 16h8"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v12H9l-5 4V5Z M8 9h8M8 13h5"/></svg>';const label=document.createElement('span');label.textContent=title;const count=document.createElement('small');count.dataset.groupCount=type;heading.append(label,count);section.append(heading);
  for(const item of group){const b=document.createElement('button');b.type='button';b.dataset.learningItem=item.id;const label=document.createElement('span');label.lang='en';label.textContent=item.label||item.title;b.append(label);b.setAttribute('aria-controls','learning-detail');b.addEventListener('click',()=>choose(item));section.append(b);}
  list.append(section);
 }
 button.addEventListener('click',async()=>{
  const token=++request;error.hidden=true;
  try{if(audio.error)audio.load();audio.currentTime=0;await audio.play();}catch{if(token===request)error.hidden=false;}
 });
 audio.addEventListener('error',()=>{if(selected?.type==='word'&&document.body.dataset.preStep==='1')error.hidden=false;});
 if(items.length)choose(items.find(item=>item.type==='word')||items[0]);
}
