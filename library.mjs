import {read,prep} from './session.mjs';
const $=s=>document.querySelector(s);
const lessons=[
 {id:'planet',title:'Small steps for the planet',topic:'Environment',level:'A2',media:'Video',duration:'02:40',description:'Những thay đổi nhỏ để giảm rác thải trong cuộc sống thường ngày.',plan:true},
 {id:'morning',title:'A morning conversation',topic:'Daily life',level:'A1',media:'Audio',duration:'03:10',description:'Lắng nghe một cuộc trò chuyện ngắn về kế hoạch cho ngày mới.'},
 {id:'sport',title:'Finding your next sport',topic:'Sport',level:'B1',media:'Video',duration:'04:05',description:'Khám phá một hoạt động thể thao mới qua câu chuyện của người nói.'},
 {id:'market',title:'A Saturday at the market',topic:'Daily life',level:'A2',media:'Audio',duration:'03:25',description:'Theo chân một buổi đi chợ, hỏi giá và lựa chọn thực phẩm cho cả tuần.'},
 {id:'garden',title:'A little garden at home',topic:'Environment',level:'B2',media:'Video',duration:'03:50',description:'Bắt đầu một góc vườn nhỏ và khám phá cách chăm sóc cây mỗi ngày.'},
 {id:'walk',title:'One walk, a better day',topic:'Sport',level:'A2',media:'Audio',duration:'02:55',description:'Một thói quen đi bộ đơn giản giúp ngày mới năng động và dễ chịu hơn.'}
];
const cardSummaries={planet:'Thói quen nhỏ, ít rác thải hơn.',morning:'Lên kế hoạch cho ngày mới.',sport:'Tìm môn thể thao hợp với bạn.',market:'Đi chợ và chọn thực phẩm.',garden:'Chăm một góc vườn nhỏ.',walk:'Bắt đầu thói quen đi bộ.'};
const topicLabels={'Environment':'Môi trường','Daily life':'Đời sống','Sport':'Thể thao'};
const topicStyles={Environment:{id:'environment',path:'<path d="M20 3C9 2 3 7 5 14c2 6 13 5 15-11Z M4 21l11-12"/>'},'Daily life':{id:'daily-life',path:'<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/>'},Sport:{id:'sport',path:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18"/>'}};

const cardIcon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',video:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/>',audio:'<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',level:'<path d="M5 19v-4m7 4V9m7 10V4"/>',idea:'<path d="M9 18h6m-5 3h4M8 13a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z"/>'})[name]}</svg>`;
let hasRendered=false,filterAnimation=null;
const companion=document.querySelector('[data-spark-slot]');
if(companion)new MutationObserver(()=>{if(companion.dataset.sparkMotion==='false'){filterAnimation?.cancel();filterAnimation=null;}}).observe(companion,{attributes:true,attributeFilter:['data-spark-motion']});
// Explicit visual fixture selected by the reviewer; does not alter saved progress.
const completedPreview=new URLSearchParams(location.search).get('preview')==='completed';
const session=read(),pre=prep();
if(completedPreview)session.post={...session.post,complete:['dictation']};
let stage='pre.html?review=restored-20261029',state='Chưa học',resume='';
if(pre?.finished){state='Đang học · Nghe hiểu';stage='while.html';resume='Tiếp tục phần Nghe hiểu.';}
else if(pre?.prediction){state='Đang học · Chuẩn bị';resume='Tiếp tục phần Chuẩn bị.';}
if(session.while?.submitted){state='Đang học · Xem lại';stage='while.html';resume='Xem lại kết quả nghe hiểu.';}
if(session.while?.reviewComplete){state='Đang học · Vận dụng';stage='post.html';resume='Chọn hoạt động để vận dụng điều vừa nghe.';}
if(session.post.choice){state='Đang học · Vận dụng';stage=`${session.post.choice}.html`;resume='Tiếp tục hoạt động Vận dụng.';}
if(session.post.skipped){state='Đã bỏ qua phần Vận dụng';stage='post.html';resume='Bạn có thể quay lại chọn một hoạt động.';}
if(session.post.complete.length){state='Đã hoàn thành luyện tập';stage='post.html';resume='Bạn đã hoàn thành một hoạt động. Có thể luyện thêm nếu muốn.';}
if(resume){$('#resume').hidden=false;$('#resume-copy').textContent=resume;$('#resume-link').href=stage;$('#resume-link').textContent=session.post.complete.length?'Luyện thêm →':'Tiếp tục →';}
function render(){
 const query=$('#search').value.trim().toLocaleLowerCase('vi');
 const filtered=lessons.filter(l=>(!query||l.title.toLocaleLowerCase('vi').includes(query))&&(!$('#topic').value||l.topic===$('#topic').value)&&(!$('#level').value||l.level===$('#level').value)&&(!$('#media').value||l.media===$('#media').value));
 $('#lessons').replaceChildren();$('#empty').hidden=!!filtered.length;$('#result-count').textContent=`${filtered.length} bài học phù hợp`;
 for(const l of filtered){
  const article=document.createElement('article');article.className='lesson-card card';
  const image=document.createElement('div');image.className='lesson-art';image.dataset.topic=l.topic;const cover=document.createElement('img');cover.src=`assets/lesson-covers/${l.id}-v1.webp`;cover.alt='';cover.width=320;cover.height=240;image.append(cover);const format=document.createElement('span');format.className='lesson-format';format.innerHTML=cardIcon(l.media==='Video'?'video':'audio')+`<span>${l.media}</span><span class="lesson-format-separator" aria-hidden="true">·</span>`+cardIcon('clock')+`<span>${l.duration}</span>`;image.append(format);
  const body=document.createElement('div');body.className='lesson-body';
  const meta=document.createElement('div');meta.className='lesson-meta';meta.className='lesson-tags';const topic=document.createElement('span');topic.className='lesson-topic-tag';const theme=topicStyles[l.topic];topic.dataset.topic=theme?.id||'default';if(theme)topic.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${theme.path}</svg>`;const topicCopy=document.createElement('span');topicCopy.textContent=topicLabels[l.topic]||l.topic;topic.append(topicCopy);const level=document.createElement('span');level.className='lesson-level-tag';level.dataset.level=l.level;level.setAttribute('aria-label',`Trình độ bài ${l.level}`);level.innerHTML=cardIcon('level')+`<span>${l.level}</span>`;meta.append(topic,level);
  const title=document.createElement('h2');title.textContent=l.title;
  const description=document.createElement('p');description.className='lesson-summary';description.innerHTML=cardIcon('idea');const summary=document.createElement('span');summary.textContent=cardSummaries[l.id];description.append(summary);
  body.append(title,meta,description);if(l.plan){const plan=document.createElement('span');plan.className='plan-tag';plan.textContent='OKRs';plan.title='Bài thuộc kế hoạch OKRs của bạn';image.append(plan);}
  const status=document.createElement('span');status.className='lesson-state lesson-state-icon';const label=l.id==='planet'?(state==='Chưa học'?'Đã hoàn thành luyện tập':state):l.id==='morning'?'Đang học · Nghe hiểu':'Chưa học';status.title=label;status.setAttribute('role','img');status.setAttribute('aria-label',label);
  const completed=label==='Đã hoàn thành luyện tập',started=label!=='Chưa học';status.dataset.state=completed?'complete':started?'progress':'new';
  const statusPath=completed?'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>':started?'<circle class="status-track" cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 9 9"/><path class="status-play" d="m10 8 6 4-6 4Z"/>':'<circle cx="12" cy="12" r="9"/>';
  status.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${statusPath}</svg>`;body.append(status);
  if(l.id==='planet'){const a=document.createElement('a');a.className='button primary';a.href=stage;a.textContent=completed?'Luyện thêm →':state==='Chưa học'?'Bắt đầu học →':'Tiếp tục →';body.append(a);}
  else {const b=document.createElement('button');b.className='button secondary';b.textContent='Thông tin bài';b.addEventListener('click',()=>{$('#detail-title').textContent=l.title;$('#detail-description').textContent=l.description;$('#detail-meta').textContent=`${l.topic} · ${l.level} · ${l.media} ${l.duration}`;$('#lesson-detail').showModal();});body.append(b);}
  article.append(image,body);$('#lessons').append(article);
 }
 if(hasRendered&&companion?.dataset.sparkMotion==='true'&&$('#lessons').animate){
  filterAnimation?.cancel();
  const animation=$('#lessons').animate([{transform:'translateY(6px)'},{transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
  filterAnimation=animation;
  animation.onfinish=()=>{if(filterAnimation===animation)filterAnimation=null;};
 }
 hasRendered=true;
}
function clear(){['search','topic','level','media'].forEach(id=>$('#'+id).value='');render();}
['search','topic','level','media'].forEach(id=>$('#'+id).addEventListener('input',render));
$('#clear').addEventListener('click',clear);$('#reset-empty').addEventListener('click',clear);$('#close-detail').addEventListener('click',()=>$('#lesson-detail').close());render();
