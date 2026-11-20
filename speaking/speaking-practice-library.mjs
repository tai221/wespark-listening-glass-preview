import {speakingLessons} from './speaking-library-data.mjs';
import {speakingParts} from './speaking-library-parts-data.mjs';

const paths={
 arrow:'<path d="m9 5 7 7-7 7"/>',
 forward:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 questions:'<path d="M4 4h16v12H9l-5 4V4Z"/><path d="M9 8h6m-6 4h4"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.questions}</svg>`;
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;}
const topicImages={hometown:'home','daily-life':'routine',environment:'nature',food:'food',travel:'travel',learning:'learning',trip:'travel',friend:'people',teamwork:'people',decision:'decision',language:'learning',news:'news',business:'business'};
function topicArtwork(lesson,cls){
 const art=node('span',cls),img=node('img');
 img.src=`assets/speaking-topics/${topicImages[lesson.id.replace(/^part[23]-/,'')]}-v3.webp`;img.alt='';img.width=64;img.height=64;
 art.append(img);return art;
}

export function mountSpeakingPracticeLibrary(root,{onEnter}={}){
 root.setAttribute('aria-label','Chủ đề và câu hỏi IELTS Speaking');
 const lessonsByPart={1:speakingLessons,...speakingParts};
 const selectedByPart=Object.fromEntries(Object.entries(lessonsByPart).map(([key,lessons])=>[key,lessons[0]?.id]));
 let part=1,topicButtons=[];
 const tablist=node('div','practice-part-tabs');tablist.setAttribute('role','tablist');tablist.setAttribute('aria-label','Phần thi Speaking');
 const panel=node('div','practice-part-panel');panel.id='speaking-practice-panel';panel.setAttribute('role','tabpanel');
 const tabs=[1,2,3].map(value=>{
  const tab=node('button','practice-part-tab',`Part ${value}`);tab.type='button';tab.id=`speaking-part-${value}`;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panel.id);
  tab.addEventListener('click',()=>{part=value;renderPart();});
  tab.addEventListener('keydown',event=>{
   const current=tabs.indexOf(tab);let next;
   if(event.key==='ArrowRight')next=(current+1)%tabs.length;
   else if(event.key==='ArrowLeft')next=(current+tabs.length-1)%tabs.length;
   else if(event.key==='Home')next=0;
   else if(event.key==='End')next=tabs.length-1;
   else return;
   event.preventDefault();tabs[next].focus();tabs[next].click();
  });
  tablist.append(tab);return tab;
 });
 const topics=node('section','practice-topic-pane');topics.setAttribute('aria-labelledby','practice-topics-title');
 const topicHeader=node('div','practice-topic-heading');
 const topicTitle=node('h2','','Chủ đề');topicTitle.id='practice-topics-title';
 const count=node('span','practice-topic-count');topicHeader.append(topicTitle,count);
 const topicList=node('ul','practice-topic-list');topicList.setAttribute('aria-label','Chọn chủ đề');
 const topicEmpty=node('p','practice-topic-empty','Chưa có chủ đề cho phần này.');
 topics.append(topicHeader,topicList,topicEmpty);
 const detail=node('section','practice-detail');detail.setAttribute('aria-labelledby','practice-detail-title');
 panel.append(topics,detail);root.append(tablist,panel);
 function renderTopics(){
  topicList.replaceChildren();
  topicButtons=lessonsByPart[part].map(lesson=>{
   const li=node('li');const button=node('button','practice-topic');button.type='button';button.dataset.topicId=lesson.id;
   const art=topicArtwork(lesson,'practice-topic-icon');
   const copy=node('span','practice-topic-copy');copy.append(node('strong','',lesson.title),node('span','',lesson.topic));
   const arrow=node('span','practice-topic-arrow');arrow.innerHTML=icon('arrow');
   button.append(art,copy,arrow);button.addEventListener('click',()=>{selectedByPart[part]=lesson.id;renderTopic();});li.append(button);topicList.append(li);return button;
  });
 }
 function renderTopic(){
  topicButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.topicId===selectedByPart[part])));
  const lesson=lessonsByPart[part].find(item=>item.id===selectedByPart[part]);
  detail.replaceChildren();
  if(!lesson){
   const empty=node('div','practice-part-empty');const art=node('span','practice-detail-icon');art.innerHTML=icon('questions');
   const title=node('h2','',`Part ${part} chưa có nội dung`);title.id='practice-detail-title';
   empty.append(art,title,node('p','',`Các chủ đề và câu hỏi Part ${part} chưa có trong bản xem này. Bạn có thể quay lại Part 1 để khám phá và luyện tập.`));detail.append(empty);
  }else{
   const header=node('div','practice-detail-heading');const art=topicArtwork(lesson,'practice-detail-icon');
   const copy=node('div','practice-detail-copy');const title=node('h2','',lesson.title);title.id='practice-detail-title';
   const meta=node('p','practice-detail-meta',lesson.topic);
   copy.append(title,meta);header.append(art,copy,node('span','practice-part-badge',`Part ${part}`));
   const description=node('p','practice-topic-description',lesson.description);
   detail.append(header,description);
   if(lesson.cues){
    const questionHeader=node('div','practice-question-heading');questionHeader.append(node('h3','','Câu hỏi luyện tập'),node('span','',`${lesson.cues.length} câu hỏi`));
    const list=node('div','practice-cue-list');
    lesson.cues.forEach((task,index)=>{
     const item=node('details','practice-cue-item');item.name='speaking-cue-cards';
     const summary=node('summary','practice-cue-summary');
     const number=node('span','practice-question-number',String(index+1));number.setAttribute('aria-hidden','true');
     const prompt=node('span','practice-cue-prompt',task.prompt);prompt.lang='en';
     const arrow=node('span','practice-cue-chevron');arrow.innerHTML=icon('arrow');summary.append(number,prompt,arrow);
     const cue=node('article','practice-cue-card');cue.lang='en';
     const cueHeader=node('div','practice-cue-heading');cueHeader.append(node('p','practice-cue-instruction','You should say:'));
     const bullets=node('ul','practice-cue-bullets');task.bullets.forEach(text=>bullets.append(node('li','',text)));
     cue.append(cueHeader,bullets,node('p','practice-cue-explain',task.explain));
     const timing=node('p','practice-cue-timing','1 phút chuẩn bị · Nói 1–2 phút');timing.lang='vi';cue.append(timing);item.append(summary,cue);list.append(item);
    });
    detail.append(questionHeader,list);
   }else{
    const questionHeader=node('div','practice-question-heading');questionHeader.append(node('h3','',part===3?'Câu hỏi thảo luận':'Câu hỏi luyện tập'),node('span','',`${lesson.questions.length} câu hỏi`));
    const list=node('ol','practice-question-list');
    lesson.questions.forEach((question,index)=>{
     const row=node('li','practice-question-row');
     const number=node('span','practice-question-number',String(index+1));number.setAttribute('aria-hidden','true');
     const text=node('p','',question);text.lang='en';
     row.append(number,text);list.append(row);
    });
    detail.append(questionHeader,list);
   }
  }
  const footer=node('div','practice-detail-footer');
  const action=node(lesson?.href?'a':'button','practice-start-button');
  action.append(document.createTextNode('Bắt đầu'));action.insertAdjacentHTML('beforeend',icon('forward'));
  if(lesson?.href){action.href=lesson.href==='key-speaking-vocabulary.html'?'key-speaking-drill-repeat.html':lesson.href;if(onEnter)action.addEventListener('click',onEnter);}
  else{action.type='button';action.disabled=true;}
  footer.append(action);
  detail.append(footer);
 }
 function renderPart(){
  tabs.forEach((tab,index)=>{const active=index+1===part;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
  panel.setAttribute('aria-labelledby',`speaking-part-${part}`);
  root.dataset.part=String(part);
  count.textContent=`${lessonsByPart[part].length} chủ đề`;topicList.hidden=!lessonsByPart[part].length;topicEmpty.hidden=!!lessonsByPart[part].length;
  renderTopics();renderTopic();
  const active=topicButtons.find(button=>button.dataset.topicId===selectedByPart[part]);
  if(active)topicList.scrollTop=Math.max(0,active.offsetTop-topicList.offsetTop-3);
 }
 renderPart();
}
