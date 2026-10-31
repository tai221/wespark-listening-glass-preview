import {createQuizSound} from './pre-quiz-sound.mjs';
import {learningItems} from './pre-learning.mjs';

const words=learningItems.filter(item=>item.type==='word');
export const quizQuestions=[
 ...words.map((item,index)=>{
  const answer=index%3,options=[words[(index+1)%words.length].meaning,words[(index+2)%words.length].meaning];options.splice(answer,0,item.meaning);
  return {id:item.id,kind:'word',title:' có nghĩa là gì?',term:item.title,options,answer,explanation:`“${item.title}” nghĩa là ${item.meaning}. ${item.translation}`};
 }),
 {id:'can',kind:'pattern',title:'Chọn cụm từ phù hợp để hoàn thành câu.',prompt:'We ___ today.',options:['can starting','can start','can started'],answer:1,explanation:'Sau “can” dùng động từ nguyên mẫu: “We can start today” — Chúng ta có thể bắt đầu hôm nay.'},
 {id:'used-to',kind:'pattern',title:'Chọn cụm từ phù hợp để hoàn thành câu.',prompt:'Every evening, our kitchen bin ___ full.',options:['used to being','use to be','used to be'],answer:2,explanation:'“Used to + động từ nguyên mẫu” diễn tả trạng thái trong quá khứ đã thay đổi: “Every evening, our kitchen bin used to be full.”'}
];
const count=quizQuestions.length;
const validAnswer=value=>Number.isInteger(value)&&value>=0&&value<3;
const scoreOf=s=>s.checked.reduce((total,checked,index)=>total+Number(checked&&s.answers[index]===quizQuestions[index].answer),0);
export function createQuiz(){return {phase:'playing',index:0,answers:Array(count).fill(null),checked:Array(count).fill(false),score:0};}
export function restoreQuiz(value){
 const s=createQuiz();if(!value||typeof value!=='object')return s;
 let reviewed=0;
 for(let index=0;index<count;index++){
  const answer=value.answers?.[index];if(!validAnswer(answer))break;
  s.answers[index]=answer;
  if(value.checked?.[index]!==true)break;
  s.checked[index]=true;reviewed++;
 }
 s.score=scoreOf(s);
 if(reviewed===count){s.index=count-1;s.phase=value.phase==='complete'?'complete':'playing';}
 else s.index=reviewed>0&&value.index===reviewed-1?reviewed-1:reviewed;
 return s;
}
export function quiz(s,event){
 if(s.phase==='complete')return s;
 const index=s.index;
 if(event.type==='select'&&!s.checked[index]&&validAnswer(event.value)){
  const answers=[...s.answers];answers[index]=event.value;return {...s,answers};
 }
 if(event.type==='check'&&!s.checked[index]&&validAnswer(s.answers[index])){
  const checked=[...s.checked];checked[index]=true;const next={...s,checked};next.score=scoreOf(next);return next;
 }
 if(event.type==='next'&&s.checked[index]){
  if(index===count-1)return s.checked.every(Boolean)?{...s,phase:'complete'}:s;
  return {...s,index:index+1};
 }
 return s;
}

export function mountQuiz(document,{state=createQuiz(),onChange=()=>{},onComplete=()=>{}}={}){
 const pane=document.querySelector('#quiz-mode-pane');
 let s=restoreQuiz(state),active=false;
 const sound=createQuizSound(document);
 function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
 const meta=el('div','prep-quiz-meta'),counter=el('span','prep-quiz-count');meta.append(counter,sound.button,...sound.sounds);
 const track=el('div','prep-quiz-track'),fill=el('span');track.append(fill);track.setAttribute('role','progressbar');track.setAttribute('aria-label','Số câu đã kiểm tra');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(count));
 const title=el('h2');title.id='quiz-mode-title';title.tabIndex=-1;
 const prompt=el('p','prep-quiz-prompt');prompt.lang='en';
 const fieldset=el('fieldset','prep-quiz-fieldset'),legend=el('legend',null,'Bấm đáp án để xem đúng/sai.'),options=el('div','prep-quiz-options');fieldset.append(legend,options);
 const feedback=el('div','prep-quiz-feedback');feedback.id='prep-quiz-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.setAttribute('aria-atomic','true');
 const footer=el('div','prep-quiz-actions'),button=el('button','button primary');button.id='prep-quiz-check';button.type='button';footer.append(button);
 pane.replaceChildren(meta,track,title,prompt,fieldset,feedback,footer);
 function commit(next,{paint=true}={}){
  if(next===s)return;const before=s;s=next;if(paint)render();onChange(s);
  if(before.phase!=='complete'&&s.phase==='complete')onComplete(s);
 }
 function render(){
  const q=quizQuestions[s.index],checked=s.checked[s.index],complete=s.phase==='complete';
  pane.dataset.quizPhase=s.phase;counter.textContent=`Câu ${s.index+1} / ${count}`;
  const reviewed=s.checked.filter(Boolean).length;track.setAttribute('aria-valuenow',String(reviewed));fill.style.width=`${reviewed/count*100}%`;
  title.replaceChildren();if(q.term){const term=el('span',null,q.term);term.lang='en';title.append('“',term,'”',q.title);}else title.textContent=q.title;
  prompt.hidden=!q.prompt;prompt.textContent=q.prompt||'';options.replaceChildren();
  q.options.forEach((text,index)=>{
   const label=el('button','prep-quiz-option');label.type='button';label.dataset.quizAnswer=String(index);label.disabled=checked||complete;
   const indicator=el('span','prep-quiz-indicator');indicator.setAttribute('aria-hidden','true');label.dataset.checked=String(checked);const copy=el('span','prep-quiz-option-copy',text);copy.lang=q.kind==='pattern'?'en':'vi';
   label.append(indicator,copy);
   if(checked&&(index===q.answer||index===s.answers[s.index])){
    const correct=index===q.answer;label.classList.add(correct?'correct':'wrong');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');
    const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx','12');circle.setAttribute('cy','12');circle.setAttribute('r','9');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',correct?'m8 12 3 3 5-6':'m9 9 6 6m0-6-6 6');svg.append(circle,path);indicator.append(svg);
    label.append(el('span','prep-quiz-option-status sr-only',correct?'Đáp án đúng': 'Bạn chọn · Chưa đúng'));
   }
   label.addEventListener('click',()=>{if(!active||s.phase!=='playing'||s.checked[s.index])return;sound.play(index===q.answer);commit(quiz(quiz(s,{type:'select',value:index}),{type:'check'}));button.focus();});
   options.append(label);
  });
  feedback.replaceChildren();feedback.hidden=!checked;
  if(checked){feedback.append(el('strong',null,s.answers[s.index]===q.answer?'Đúng rồi.':'Nhớ điểm này nhé.'),el('p',null,`Đáp án: ${q.options[q.answer]}. ${q.explanation}`));}
  button.hidden=!checked;button.textContent=s.index===count-1?'Hoàn tất Quiz →':'Câu tiếp →';button.disabled=complete||!checked;
 }
 button.addEventListener('click',()=>{
  if(!active||s.phase!=='playing'||!s.checked[s.index])return;
  const checked=s.checked[s.index];commit(quiz(s,{type:'next'}));
  if(checked&&s.phase==='playing')title.focus();
 });
 render();
 return {
  activate(value){active=!!value;if(active)render();else sound.stop();},
  reset(value=createQuiz()){sound.stop();s=restoreQuiz(value);render();onChange(s);},
  getState:()=>s
 };
}
