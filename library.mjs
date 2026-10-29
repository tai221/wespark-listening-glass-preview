import {read,prep} from './session.mjs';
const $=s=>document.querySelector(s);
const lessons=[
 {id:'planet',title:'Small steps for the planet',topic:'Environment',level:'A2',media:'Video',duration:'02:40',description:'Những thay đổi nhỏ để giảm rác thải trong cuộc sống thường ngày.',plan:true},
 {id:'morning',title:'A morning conversation',topic:'Daily life',level:'A2',media:'Audio',duration:'03:10',description:'Lắng nghe một cuộc trò chuyện ngắn về kế hoạch cho ngày mới.'},
 {id:'sport',title:'Finding your next sport',topic:'Sport',level:'A2',media:'Video',duration:'04:05',description:'Khám phá một hoạt động thể thao mới qua câu chuyện của người nói.'}
];
const planetArt=`<svg viewBox="0 0 220 155" aria-hidden="true"><circle cx="166" cy="35" r="35" fill="#f4e9bc"/><path d="M0 130c60-55 140-55 220-15v40H0Z" fill="#d0ddc6"/><path d="M105 145c0-38-12-65-26-88" stroke="#5c7754" stroke-width="3" fill="none"/><path d="M94 97C60 92 44 67 55 48c28 3 46 25 39 49Z" fill="#7a9b6b"/><path d="M100 117c0-35 22-57 49-51-2 25-19 43-49 51Z" fill="#9bb37f"/></svg>`;
const topicArt={
 Environment:planetArt,
 'Daily life':`<svg viewBox="0 0 220 155" aria-hidden="true"><circle cx="166" cy="40" r="29" fill="#eab777"/><path d="M0 130h220v25H0z" fill="#d8bd9c"/><path d="M31 118V39h83v79" fill="#fff5dc" stroke="#ad8562" stroke-width="3"/><path d="M72 40v76M32 78h80" stroke="#d4bb96" stroke-width="3"/><path d="M128 89h43v31a19 19 0 0 1-38 0V89Z" fill="#bf7d59"/><path d="M171 95h9c16 0 15 23-9 21" fill="none" stroke="#bf7d59" stroke-width="6"/><path d="M145 76c-8-12 8-14 0-28m14 28c-8-12 8-14 0-28" stroke="#b5997c" stroke-width="2" fill="none"/><ellipse cx="151" cy="139" rx="38" ry="4" fill="#ac896b"/></svg>`,
 Sport:`<svg viewBox="0 0 220 155" aria-hidden="true"><circle cx="178" cy="30" r="37" fill="#d9e3eb"/><path d="M0 126c68-44 142-50 220-17v46H0Z" fill="#aebfc0"/><path d="M0 148c80-42 150-47 220-25" stroke="#faf7e9" stroke-width="4" fill="none"/><circle cx="101" cy="88" r="43" fill="#d99a59" stroke="#93603c" stroke-width="3"/><path d="M60 77c37 3 67 19 76 36M90 47c13 23 19 49 17 83M65 113c23-8 43-29 58-62M60 83c23 17 57 23 83 6" stroke="#93603c" stroke-width="3" fill="none"/></svg>`
};
let hasRendered=false,filterAnimation=null;
const companion=document.querySelector('[data-spark-slot]');
if(companion)new MutationObserver(()=>{if(companion.dataset.sparkMotion==='false'){filterAnimation?.cancel();filterAnimation=null;}}).observe(companion,{attributes:true,attributeFilter:['data-spark-motion']});
const session=read(),pre=prep();
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
  const image=document.createElement('div');image.className='lesson-art';image.dataset.topic=l.topic;const cover=document.createElement('img');cover.src=l.id==='planet'?'assets/planet-3d.png':'assets/spark-'+(l.id==='morning'?'reading':'celebrate')+'.webp';cover.alt='';cover.width=320;cover.height=240;image.append(cover);
  const body=document.createElement('div');body.className='lesson-body';
  const meta=document.createElement('div');meta.className='lesson-meta';meta.textContent=`${l.topic} · Level bài ${l.level} · ${l.media} ${l.duration}`;
  const title=document.createElement('h2');title.textContent=l.title;
  const description=document.createElement('p');description.textContent=l.description;
  body.append(meta);if(l.plan){const plan=document.createElement('span');plan.className='plan-tag';plan.textContent='Trong OKRs của bạn';body.append(plan);}body.append(title,description);
  const status=document.createElement('div');status.className='lesson-state';status.textContent=l.id==='planet'?state:'Chưa học';body.append(status);
  if(l.id==='planet'){const a=document.createElement('a');a.className='button primary';a.href=stage;a.textContent=state==='Chưa học'?'Bắt đầu học →':session.post.complete.length?'Luyện thêm →':'Tiếp tục →';body.append(a);}
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
