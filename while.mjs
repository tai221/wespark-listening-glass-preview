import {mountListeningPlayer} from './while-player.mjs';
import {read,write} from './session.mjs';
const TRANSCRIPT=[
  [
    "00:00",
    "Every evening, our kitchen bin used to be full. There were paper cups, plastic bags, and food we had forgotten to eat. I wanted to throw away less, but I did not know where to begin. So I decided to try a few small changes."
  ],
  [
    "00:19",
    "First, I looked at what we threw away most often. Shopping bags were near the top of the list. We brought a new one home almost every day. I realised that changing one shopping habit might be easier than changing everything at once."
  ],
  [
    "00:40",
    "Now, I carry a reusable bag whenever I go shopping. I keep it beside the front door so I remember to take it. It is a simple habit, but it means I do not need another plastic bag each time I visit a shop."
  ],
  [
    "01:03",
    "Next, I started planning our meals before buying food. I check the fridge, make a short list, and buy only what we need. If there are vegetables left at the end of the week, I use them in a soup instead of throwing them away."
  ],
  [
    "01:27",
    "My family did not change every habit immediately. Sometimes we forgot the bag, and sometimes we still bought too much food. We talked about what went wrong and tried again the next day. Keeping things simple helped us continue without feeling that we had failed."
  ],
  [
    "01:49",
    "After a few weeks, our bin was not as full. We also spent less money on food. The changes were small enough to fit into an ordinary day, so they became easier to remember. We did not need special equipment or a completely new way of living."
  ],
  [
    "02:09",
    "Small changes really can make a difference. One bag or one meal may not seem important, but these choices add up over time. I feel encouraged when I see less waste in our home, and I want to keep going."
  ],
  [
    "02:29",
    "You do not have to do everything today. Choose one small habit, try it this week, and notice what changes. It is a practical place to start."
  ]
];
const $=selector=>document.querySelector(selector);
const KEYS=['A','A','A','B'];
const QUESTIONS=[
 {type:'Gist',title:'Nội dung chính của đoạn nghe là gì?',options:['Những thay đổi nhỏ để giảm rác thải','Chuẩn bị cho một chuyến đi'],segments:[0,7],quote:'So I decided to try a few small changes.',reason:'Người nói mở đầu bằng vấn đề rác thải trong gia đình rồi kể những thay đổi nhỏ để giảm rác. Đây là ý xuyên suốt, không phải câu chuyện chuẩn bị cho một chuyến đi.',contrast:'Các thói quen mang túi dùng nhiều lần và lập kế hoạch bữa ăn đều hỗ trợ chủ đề giảm rác thải.'},
 {type:'Detail',title:'Vật dụng nào được người nói nhắc đến?',options:['Một chiếc túi dùng nhiều lần','Một chiếc đồng hồ mới'],segments:[2],quote:'Now, I carry a reusable bag whenever I go shopping.',reason:'“a reusable bag” là “một chiếc túi dùng nhiều lần”. Động từ “carry” và ngữ cảnh “go shopping” cho thấy đây là vật dụng Lena mang theo khi mua sắm.',contrast:'Nguồn không nhắc đến một chiếc đồng hồ mới. Một món đồ có thể liên quan đến mua sắm vẫn chưa đủ làm bằng chứng.'},
 {type:'Organization',title:'Nội dung được trình bày theo cách nào?',options:['Nêu vấn đề rồi đưa ra gợi ý','Kể lại một chuyến đi theo thời gian'],segments:[0,1,3],quote:'Every evening, our kitchen bin used to be full. … First, I looked at what we threw away most often. … Next, I started planning our meals before buying food.',reason:'Đầu tiên người nói nêu vấn đề thùng rác đầy, sau đó đưa ra các thay đổi cụ thể với “First” và “Next”.',contrast:'“First” và “Next” sắp xếp các gợi ý thay đổi thói quen, không kể một chuyến đi.'},
 {type:'Opinion',title:'Người nói thể hiện thái độ nào với những thay đổi nhỏ?',options:['Cho rằng chúng không tạo khác biệt','Tin rằng chúng có ích'],segments:[6],quote:'Small changes really can make a difference. … I feel encouraged when I see less waste in our home, and I want to keep going.',reason:'“can make a difference” cho thấy người nói tin hành động nhỏ có tác động. “I feel encouraged” và “want to keep going” củng cố thái độ tích cực.',contrast:'Ý “không tạo khác biệt” trái với “really can make a difference”. “may not seem important” chỉ nói về cảm giác ban đầu; phần sau khẳng định tác dụng tích lũy.'}
];
let stored=read().while||{};
let state={answers:Array.isArray(stored.answers)&&stored.answers.length===4?stored.answers:[null,null,null,null],submitted:!!stored.submitted,reviewComplete:!!stored.reviewComplete,reviewed:Array.isArray(stored.reviewed)?stored.reviewed:[]};
const policies={blank:'pending',review:'pending'};
let activeQuestion=null;
const audio=$('#source-audio'),questionAudio=$('#question-audio');
let playingQuestion=null,playRequest=0;
function icon(kind){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 const paths={right:'M8 12l3 3 5-6',wrong:'M9 9l6 6m0-6-6 6',blank:'M8 12h8',play:'M9 6l9 6-9 6Z',stop:'M8 8h8v8H8Z'};
 if(['right','wrong','blank','neutral'].includes(kind)){const circle=document.createElementNS(svg.namespaceURI,'circle');circle.setAttribute('cx','12');circle.setAttribute('cy','12');circle.setAttribute('r','9');svg.append(circle);}
 if(paths[kind]){const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[kind]);svg.append(path);}return svg;
}
function statusIcon(kind,label){const node=el('span','answer-status');node.setAttribute('role','img');node.setAttribute('aria-label',label);node.append(icon(kind));return node;}
function updateQuestionPlayback(){document.querySelectorAll('[data-play-question]').forEach(button=>{const i=Number(button.dataset.playQuestion),playing=i===playingQuestion;button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',`${playing?'Dừng':'Nghe đoạn liên quan đến'} câu ${i+1}`);button.title=button.getAttribute('aria-label');button.replaceChildren(icon(playing?'stop':'play'));});}
function stopQuestion(){playRequest++;playingQuestion=null;questionAudio.pause();updateQuestionPlayback();}
async function playQuestion(i){
 if(playingQuestion===i){stopQuestion();return;}
 stopQuestion();audio.pause();const request=++playRequest;playingQuestion=i;
 document.querySelectorAll('.question-audio-error').forEach(node=>node.hidden=true);
 questionAudio.src=`assets/while-audio/question-${i+1}.wav`;questionAudio.playbackRate=audio.playbackRate;questionAudio.volume=audio.volume;questionAudio.muted=audio.muted;updateQuestionPlayback();
 try{await questionAudio.play();}catch{if(request!==playRequest)return;questionPlaybackError(i);}
}
function questionPlaybackError(i=playingQuestion){stopQuestion();if(i!==null){const error=$(`#question-${i+1} .question-audio-error`);if(error)error.hidden=false;}}
questionAudio.addEventListener('ended',stopQuestion);
questionAudio.addEventListener('error',()=>{if(playingQuestion!==null)questionPlaybackError();});
questionAudio.addEventListener('pause',()=>{if(playingQuestion!==null){playRequest++;playingQuestion=null;updateQuestionPlayback();}});
audio.addEventListener('play',stopQuestion);
audio.addEventListener('volumechange',()=>{questionAudio.volume=audio.volume;questionAudio.muted=audio.muted;});
audio.addEventListener('ratechange',()=>{questionAudio.playbackRate=audio.playbackRate;});
window.addEventListener('pagehide',stopQuestion);
function persist(){write({while:{...state,answers:[...state.answers],reviewed:[...state.reviewed]}});}
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function wrongIndices(){return KEYS.map((key,i)=>state.answers[i]!==key?i:null).filter(i=>i!==null);}
function reviewedAll(){return wrongIndices().every(i=>state.reviewed.includes(i));}
function render(){
 stopQuestion();
 document.body.classList.toggle('review-mode',state.submitted);
 $('#phase-caption').textContent=state.submitted?'Nghe lại & đối chiếu':'Lắng nghe & nắm bắt nội dung';
 $('#question-section-heading').hidden=state.submitted;$('#result-summary').hidden=!state.submitted;$('#transcript-panel').hidden=!state.submitted;
 $('#submit').hidden=state.submitted;$('#post-link').hidden=!state.submitted;$('#next-wrong').hidden=!state.submitted||wrongIndices().length===0;
 $('#question-list').replaceChildren();
 QUESTIONS.forEach((q,i)=>renderQuestion(q,i));updateQuestionPlayback();
 if(state.submitted){$('#score-count').textContent=`${state.answers.filter((a,i)=>a===KEYS[i]).length} / 4`;renderTranscript();}
 updateProgress();
}
function renderQuestion(q,i){
 const correct=state.answers[i]===KEYS[i],blank=state.answers[i]===null;
 const article=el('article','question-card card');article.id=`question-${i+1}`;
 if(state.submitted)article.classList.add(correct?'correct':blank?'blank':'wrong');
 const meta=el('div','q-meta');meta.append(el('span','q-index',i+1),el('span','q-type',q.type));
 if(state.submitted){const result=statusIcon(correct?'right':blank?'blank':'wrong',correct?'Trả lời đúng':blank?'Chưa trả lời':'Trả lời sai');result.classList.add('q-result');meta.append(result);}
 const play=el('button','question-play');play.type='button';play.dataset.playQuestion=i;play.addEventListener('click',()=>playQuestion(i));meta.append(play);
 article.append(meta,el('h3','',q.title));
 const playbackError=el('p','question-audio-error','Chưa phát được đoạn nghe. Bấm nút phát để thử lại.');playbackError.hidden=true;playbackError.setAttribute('role','alert');article.append(playbackError);
 if(!state.submitted){
  const fieldset=el('fieldset','answer-set');fieldset.append(el('legend','sr-only',`Câu ${i+1}: ${q.title}`));
  q.options.forEach((text,j)=>{const letter='AB'[j],label=el('label','while-answer'),input=document.createElement('input');input.type='radio';input.name=`q${i+1}`;input.value=letter;input.checked=state.answers[i]===letter;input.addEventListener('change',()=>{state.answers[i]=letter;persist();updateProgress();});label.append(input,el('span','',`${letter}. ${text}`));fieldset.append(label);});article.append(fieldset);
 }else{
  const answers=el('div','answer-review');
  q.options.forEach((text,j)=>{
   const letter='AB'[j],right=letter===KEYS[i],selected=letter===state.answers[i];
   const row=el('div',`answer-line${right?' right':selected?' wrong':' neutral'}${selected?' selected':''}`);
   row.append(statusIcon(right?'right':selected?'wrong':'neutral',right?(selected?'Bạn chọn · Đáp án đúng':'Đáp án đúng'):selected?'Bạn chọn · Đáp án sai':'Không được chọn'),el('span','answer-copy',`${letter}. ${text}`));answers.append(row);
  });
  if(blank)answers.append(el('p','sr-only','Bạn chưa chọn đáp án cho câu này.'));
  article.append(answers);
  const details=el('details','explanation');details.id=`explain-${i+1}`;
  const summary=el('summary','',correct?'Vì sao đúng?':'Giải thích & bằng chứng');if(state.reviewed.includes(i))summary.append(el('span','reviewed-flag','✓ Đã xem'));
  const copy=el('div','explanation-copy');copy.append(el('strong','','Bằng chứng trong bài nghe'));
  const quote=el('blockquote','evidence-quote',q.quote);quote.lang='en';copy.append(quote);
  const evidence=el('button','evidence-button',`Đối chiếu transcript · ${q.segments.map(s=>TRANSCRIPT[s][0]).join(', ')}`);evidence.type='button';evidence.addEventListener('click',()=>showEvidence(i));copy.append(evidence,el('p','',q.reason));
  if(!correct)copy.append(el('strong','','Điểm cần phân biệt'),el('p','',q.contrast));
  if(policies.review==='ack'&&!correct){const ack=el('button','button secondary ack-button',state.reviewed.includes(i)?'✓ Đã xem':'Đã xem giải thích');ack.type='button';ack.disabled=state.reviewed.includes(i);ack.addEventListener('click',()=>markReviewed(i,details));copy.append(ack);}
  details.append(summary,copy);
  details.addEventListener('toggle',()=>{if(details.open){activeQuestion=i;highlightQuestion(i);if(policies.review!=='ack'&&!correct)markReviewed(i,details);}});
  article.append(details);
 }
 $('#question-list').append(article);
}
function markReviewed(i,details){if(!state.reviewed.includes(i)){state.reviewed.push(i);persist();const summary=details.querySelector('summary');summary.append(el('span','reviewed-flag','✓ Đã xem'));const ack=details.querySelector('.ack-button');if(ack){ack.textContent='✓ Đã xem';ack.disabled=true;}}updateProgress();}
function renderTranscript(){
 $('#transcript').replaceChildren();
 TRANSCRIPT.forEach(([timestamp,text],i)=>{const segment=el('div','transcript-segment');segment.id=`segment-${i+1}`;segment.tabIndex=-1;const copy=el('p','',text);copy.lang='en';segment.append(el('span','timestamp',timestamp),copy);$('#transcript').append(segment);});
 if(activeQuestion!==null)highlightQuestion(activeQuestion);
}
function highlightQuestion(i){document.querySelectorAll('.question-card').forEach((e,j)=>e.classList.toggle('active-question',j===i));document.querySelectorAll('.transcript-segment').forEach((e,j)=>e.classList.toggle('active',QUESTIONS[i].segments.includes(j)));$('#evidence-context').textContent=`Đối chiếu câu ${i+1}`;}
function showEvidence(i){activeQuestion=i;highlightQuestion(i);const target=$(`#segment-${QUESTIONS[i].segments[0]+1}`);target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});target.focus({preventScroll:true});}
function updateProgress(){
 const answered=state.answers.filter(Boolean).length;
 if(!state.submitted){$('#progress-copy').textContent=`Đã trả lời ${answered} / 4 câu`;$('#submit').disabled=policies.blank==='require'&&answered<4;$('#action-reason').textContent=policies.blank==='require'&&answered<4?'Trả lời đủ các câu để nộp bài.':'';return;}
 const wrong=wrongIndices(),seen=wrong.filter(i=>state.reviewed.includes(i)).length;
 $('#progress-copy').textContent=wrong.length?`Đã xem ${seen} / ${wrong.length} câu cần đối chiếu`:'Bạn đã trả lời đúng tất cả. Có thể nghe lại hoặc tiếp tục.';
 const available=reviewedAll();$('#post-link').setAttribute('aria-disabled',String(!available));$('#post-link').classList.toggle('unavailable',!available);$('#post-link').tabIndex=available?0:-1;
 $('#next-wrong').disabled=available;
 $('#action-reason').textContent=available?'Không cần đạt điểm tối thiểu để tiếp tục.':policies.review==='ack'?'Mở giải thích và bấm “Đã xem” ở các câu chưa đúng.':'Mở giải thích các câu chưa đúng trước khi tiếp tục.';
}
$('#submit').addEventListener('click',()=>{
 const blank=state.answers.filter(a=>a===null).length;
 if(blank){if(policies.blank==='require')return;$('#submit-dialog-copy').textContent=`Còn ${blank} / 4 câu chưa trả lời. Bạn có thể quay lại làm tiếp hoặc nộp với các câu này để trống.`;$('#submit-dialog').showModal();}else submit();
});
$('#submit-dialog').addEventListener('close',()=>{if($('#submit-dialog').returnValue==='confirm')submit();});
function submit(){state.submitted=true;state.reviewComplete=false;state.reviewed=[];activeQuestion=null;audio.pause();persist();render();$('#score-count').tabIndex=-1;$('#score-count').focus();}
$('#post-link').addEventListener('click',event=>{if(!reviewedAll()){event.preventDefault();return;}state.reviewComplete=true;persist();});
$('#next-wrong').addEventListener('click',()=>{const i=wrongIndices().find(i=>!state.reviewed.includes(i));if(i===undefined)return;const details=$(`#explain-${i+1}`);details.open=true;showEvidence(i);details.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});details.querySelector('summary').focus({preventScroll:true});});
$('#blank-policy').addEventListener('change',e=>{policies.blank=e.target.value;updateProgress();});
$('#review-policy').addEventListener('change',e=>{policies.review=e.target.value;state.reviewed=[];persist();render();});
function fixture(answers,submitted){state={answers,submitted,reviewComplete:false,reviewed:[]};activeQuestion=null;persist();render();}
$('#demo-wrong').addEventListener('click',()=>fixture(['A','B','A','A'],true));
$('#demo-perfect').addEventListener('click',()=>fixture(['A','A','A','B'],true));
$('#demo-empty').addEventListener('click',()=>fixture([null,null,null,null],false));
function audioError(){ $('#audio-problem').hidden=false;$('#play-state').textContent='Âm thanh chưa sẵn sàng';}
function restoreAudio(){audio.src=audio.dataset.seekableSource||'source-listening.wav';audio.load();$('#audio-problem').hidden=true;$('#play-state').textContent='Sẵn sàng nghe';}
$('#demo-audio-error').addEventListener('click',()=>{audio.src='data:audio/wav;base64,aW52YWxpZA==';audio.load();});
$('#demo-audio-restore').addEventListener('click',restoreAudio);$('#retry-audio').addEventListener('click',restoreAudio);
for(const name of ['play','pause','ended'])audio.addEventListener(name,()=>{$('#play-state').textContent=audio.ended?'Đã nghe hết':audio.paused?'Đã tạm dừng':'Đang phát';});
audio.addEventListener('error',audioError);audio.addEventListener('canplay',()=>{$('#audio-problem').hidden=true;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('.tips').open){$('.tips').open=false;$('.tips>summary').focus();}});
document.addEventListener('click',e=>{const tips=$('.tips');if(tips.open&&!tips.contains(e.target))tips.open=false;});
render();

mountListeningPlayer(audio,{onError:audioError,isSubmitted:()=>state.submitted});
