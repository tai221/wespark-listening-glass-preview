import {quizQuestions,restoreQuiz} from './pre-quiz.mjs';

export function mountQuizReview(document,{onClose=()=>{},onReplay=()=>{}}={}){
 const pane=document.querySelector('#quiz-review-pane');
 let snapshot,index=0;
 function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
 function action(text,handler,className='button'){const button=el('button',className,text);button.type='button';button.addEventListener('click',handler);return button;}
 function statusIcon(correct){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx','12');circle.setAttribute('cy','12');circle.setAttribute('r','9');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',correct?'m8 12 3 3 5-6':'m9 9 6 6m0-6-6 6');svg.append(circle,path);return svg;
 }
 function close(){pane.hidden=true;}
 function choose(next){if(!Number.isInteger(next)||next<0||next>=quizQuestions.length)return;index=next;render();pane.querySelector('#quiz-review-question-title').focus();}
 function render(){
  pane.replaceChildren();
  const heading=el('div','quiz-review-heading'),lead=el('div'),title=el('h2',null,'Xem lại Quiz');title.id='quiz-review-title';title.tabIndex=-1;
  const description=el('p',null,'Chọn một câu để xem lại đáp án và giải thích.');lead.append(title,description);
  const tools=el('div','quiz-review-tools'),back=action('Về kết quả',()=>{close();onClose();}),replay=action('Làm lại Quiz',()=>{close();onReplay();});back.id='quiz-review-close';replay.id='quiz-review-replay';tools.append(back,replay);heading.append(lead,tools);
  const layout=el('div','quiz-review-layout'),sidebar=el('aside','quiz-review-sidebar'),nav=el('nav','quiz-review-nav');nav.setAttribute('aria-label','Các câu đã làm');
  const navTitle=el('h3',null,'Các câu đã làm');sidebar.append(navTitle);
  quizQuestions.forEach((question,i)=>{
   const correct=snapshot.answers[i]===question.answer,button=action(String(i+1),()=>choose(i),'quiz-review-number');button.dataset.reviewQuestion=String(i);button.classList.add(correct?'is-correct':'is-wrong');button.setAttribute('aria-label',`Câu ${i+1} · ${correct?'Đúng':'Chưa đúng'}`);if(i===index)button.setAttribute('aria-current','true');button.append(statusIcon(correct));nav.append(button);
  });
  sidebar.append(nav);
  const content=el('article','quiz-review-question'),q=quizQuestions[index],meta=el('p','prep-quiz-meta',`Câu ${index+1} / ${quizQuestions.length}`),questionTitle=el('h3');questionTitle.id='quiz-review-question-title';questionTitle.tabIndex=-1;
  if(q.term){const term=el('span',null,q.term);term.lang='en';questionTitle.append('“',term,'”',q.title);}else questionTitle.textContent=q.title;
  const prompt=el('p','prep-quiz-prompt quiz-review-prompt',q.prompt||'');prompt.lang='en';prompt.hidden=!q.prompt;
  const choices=el('div','prep-quiz-options quiz-review-options');choices.setAttribute('role','group');choices.setAttribute('aria-label','Đáp án đã làm');
  q.options.forEach((text,i)=>{
   const button=action('',()=>{},'prep-quiz-option');button.disabled=true;button.dataset.checked='true';button.dataset.reviewAnswer=String(i);
   const indicator=el('span','prep-quiz-indicator'),copy=el('span','prep-quiz-option-copy',text);indicator.setAttribute('aria-hidden','true');copy.lang=q.kind==='pattern'?'en':'vi';button.append(indicator,copy);
   const correct=i===q.answer,selected=i===snapshot.answers[index];
   if(selected)button.dataset.userAnswer='true';
   if(correct||selected){button.classList.add(correct?'correct':'wrong');indicator.append(statusIcon(correct));button.append(el('span','prep-quiz-option-status sr-only',selected?(correct?'Bạn chọn · Đúng':'Bạn chọn · Chưa đúng'):'Đáp án đúng'));}
   choices.append(button);
  });
  const explanation=el('div','prep-quiz-feedback');explanation.append(el('strong',null,'Giải thích'),el('p',null,q.explanation));
  const pager=el('div','quiz-review-pager'),previous=action('Câu trước',()=>choose(index-1)),next=action('Câu tiếp',()=>choose(index+1));previous.dataset.reviewPrev='';next.dataset.reviewNext='';previous.disabled=index===0;next.disabled=index===quizQuestions.length-1;pager.append(previous,next);
  content.append(meta,questionTitle,prompt,choices,explanation,pager);layout.append(sidebar,content);pane.append(heading,layout);
 }
 return {
  open(quizState){snapshot=restoreQuiz(quizState);if(snapshot.phase!=='complete'){close();return false;}const mistake=quizQuestions.findIndex((q,i)=>snapshot.answers[i]!==q.answer);index=mistake<0?0:mistake;render();pane.hidden=false;pane.querySelector('#quiz-review-title').focus();return true;},
  close
 };
}
