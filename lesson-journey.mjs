const stages=['pre','while','post'];
const labels=['Chuẩn bị','Nghe hiểu','Vận dụng'];
const artwork=['prepare','listen','practice'];
export function updateLessonJourney(nav,{stage,prepComplete=false,whileComplete=false,postComplete=false}){
 const current=stages.indexOf(stage);if(current<0||!nav)return;
 nav.dataset.lessonRoute='';
 const items=[...nav.children].filter(node=>!node.classList.contains('dash'));
 const done=[prepComplete,whileComplete,postComplete];
 items.forEach((item,i)=>{
  item.dataset.routeStep=i+1;item.classList.toggle('route-current',i===current);item.classList.toggle('route-complete',!!done[i]);
  item.classList.toggle('active',i===current);item.removeAttribute('aria-current');if(i===current)item.setAttribute('aria-current','step');
  item.setAttribute('aria-label',`${labels[i]} · ${done[i]?'Đã hoàn thành':i===current?'Đang học':'Chưa hoàn thành'}${done[i]&&i===current?' · Đang xem':''}`);
  const circle=item.querySelector('.circle');if(circle){circle.textContent=done[i]?'✓':String(i+1);circle.setAttribute('aria-hidden','true');}
  let image=item.querySelector('img');if(!image){image=nav.ownerDocument.createElement('img');item.prepend(image);}
  image.src=`assets/spark-journey/${artwork[i]}-v1.webp`;image.alt='';image.width=48;image.height=46;image.classList.add('route-art');
 });
 [...nav.querySelectorAll(':scope > .dash')].forEach((dash,i)=>{dash.classList.toggle('is-complete',!!done[i]);dash.classList.toggle('is-in-progress',i===current&&!done[i]);});
}
