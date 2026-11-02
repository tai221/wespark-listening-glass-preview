import {read,write} from './session.mjs';
import {acceptVoiceTurn,conversationComplete} from './practice-state.mjs';
const $=s=>document.querySelector(s);
let state={started:false,count:0,phase:'ready',ended:false,viewed:false,...read().conversation};
if(['recording','processing'].includes(state.phase))state.phase='ready';
const turns=[
 {question:'What could we change at home to reduce waste?',answer:'We can plan our meals before shopping. Then we buy only what we need.'},
 {question:'You suggested planning meals before shopping. How would that help us waste less food?',answer:"We see what we have. We don't buy too much."},
 {question:'How could we make planning meals an easy habit to keep?',answer:'We can check the fridge before we write a shopping list.'}
];
function save(){write({conversation:state});}
let processingTimer;
function cancelProcessing(){window.clearTimeout(processingTimer);processingTimer=undefined;}
function completeTurn(outcome){
 if(state.phase!=='processing'||state.count>=3||state.ended)return;
 cancelProcessing();
 state.count=acceptVoiceTurn(state.count,outcome);state.phase=outcome==='valid'?'ready':outcome;render();
 if(state.count===3){$('#conversation-final').scrollIntoView({block:'nearest'});$('#conversation-reviewed').focus();}
 else if(outcome==='valid'){$('#chat-messages').scrollTop=$('#chat-messages').scrollHeight;$('#conversation-record').focus();speak(turns[state.count].question);}
 else $('#conversation-retry').focus();
}
function processAnswer(){
 cancelProcessing();state.phase='processing';render();
 $('#conversation-state').focus();
 processingTimer=window.setTimeout(()=>completeTurn('valid'),700);
}
const personIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>';
const audioIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
const translateIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h12M9 3v2m4 0c-1 6-5 9-9 11m1-8c1 3 4 6 7 7m1 6 4-10 4 10m-6-4h4"/></svg>';
const questionTranslations=[
 'Chúng ta có thể thay đổi điều gì ở nhà để giảm rác thải?',
 'Bạn đề xuất lên kế hoạch bữa ăn trước khi mua sắm. Cách đó giúp chúng ta bớt lãng phí thực phẩm như thế nào?',
 'Chúng ta có thể làm gì để việc lên kế hoạch bữa ăn trở thành một thói quen dễ duy trì?'
];
function appendMessage(i,user=false){
 const row=document.createElement('div');row.className='chat-message'+(user?' user':'');
 const avatar=document.createElement('span');avatar.className='chat-avatar';avatar.setAttribute('aria-hidden','true');
 if(user)avatar.innerHTML=personIcon;
 else {const img=document.createElement('img');img.src='assets/spark-activities/conversation-v1.webp';img.alt='';img.width=36;img.height=36;avatar.append(img);}
 const bubble=document.createElement('div');bubble.className='chat-bubble';
 const label=document.createElement('span');label.className='speaker';label.textContent=user?'Bạn':'Người cùng nhà';
 const copy=document.createElement('p');copy.lang='en';copy.textContent=user?turns[i].answer:turns[i].question;bubble.append(label,copy);
 const content=document.createElement('div');content.className='chat-message-content';content.append(bubble);
 if(!user){
  const tools=document.createElement('div');tools.className='chat-message-tools';
  const listen=document.createElement('button');listen.className='chat-listen';listen.innerHTML=audioIcon;listen.type='button';listen.title='Nghe lại';listen.setAttribute('aria-label',`Nghe lại câu hỏi ${i+1}`);listen.addEventListener('click',()=>speak(turns[i].question));
  const translation=document.createElement('p');translation.className='chat-translation';translation.id=`chat-translation-${i}`;translation.lang='vi';translation.hidden=true;translation.textContent=questionTranslations[i];
  const translate=document.createElement('button');translate.className='chat-translate';translate.type='button';translate.innerHTML=translateIcon;translate.title='Dịch câu hỏi';translate.setAttribute('aria-label',`Dịch câu hỏi ${i+1}`);translate.setAttribute('aria-expanded','false');translate.setAttribute('aria-controls',translation.id);
  translate.addEventListener('click',()=>{translation.hidden=!translation.hidden;translate.setAttribute('aria-expanded',String(!translation.hidden));translate.title=translation.hidden?'Dịch câu hỏi':'Ẩn bản dịch';});
  tools.append(listen,translate);bubble.append(translation);content.append(tools);
 }
 row.append(avatar,content);$('#chat-messages').append(row);
}
function render(){
 $('#conversation-progress').textContent=`Đã trả lời ${state.count} / 3`;
 $('#conversation-intro').hidden=state.started;
 $('#conversation-chat').hidden=!state.started||state.ended||state.count===3;
 $('#conversation-partial').hidden=!state.ended;
 $('#conversation-final').hidden=state.count<3||state.ended;
 $('#conversation-reviewed').hidden=state.viewed;$('#conversation-complete-links').hidden=!state.viewed;
 if(state.ended)$('#partial-count').textContent=`${state.count} / 3 lượt chính đã được trả lời. ${state.count?'Bạn đã nêu được một phần ý tưởng; phần chưa nói chưa đủ bằng chứng để nhận xét.':'Chưa có lời đáp để nhận xét.'}`;
 const thread=$('#chat-messages'),expected=Math.min(state.count*2+1,6);
 while(thread.children.length<expected){const position=thread.children.length;appendMessage(Math.floor(position/2),position%2===1);}
 const phases={ready:[`Lượt chính ${state.count+1} · Trả lời bằng giọng nói`,'Hãy nói xong ý trước khi AI tiếp lời.'],recording:['Đang ghi âm…','Hãy nói xong ý rồi bấm Dừng.'],processing:['Đang xử lý câu trả lời…','Lượt này chưa được tính là đã trả lời.'],'mic-error':['Chưa truy cập được micro','Kiểm tra quyền micro rồi thử lại. Chưa tạo bản thu.'],'processing-error':['Chưa xử lý được lượt trả lời','Không thêm lời đáp hay câu hỏi nối tiếp giả. Tiến trình trước đó được giữ nguyên.'],silence:['Chưa có lời nói để đánh giá','Lượt im lặng chưa được tính. Bạn có thể thử lại.']};
 const [title,help]=phases[state.phase]||phases.ready;$('#conversation-state').textContent=title;$('#conversation-help').textContent=help;
 if(state.phase==='ready'){$('#conversation-state').textContent='Đến lượt bạn';$('#conversation-help').textContent='Bấm micro và trả lời bằng tiếng Anh.';}
 if(state.phase==='recording')$('#conversation-help').textContent='Nói trọn ý, rồi bấm Dừng và gửi.';
 $('#conversation-voice').dataset.phase=state.phase;
 $('#conversation-voice').setAttribute('aria-busy',String(state.phase==='processing'));
 $('#conversation-voice').classList.toggle('recording',state.phase==='recording');
 $('#conversation-record').hidden=state.phase!=='ready';$('#conversation-stop').hidden=state.phase!=='recording';$('#conversation-retry').hidden=!['mic-error','processing-error','silence'].includes(state.phase);
 save();
}
function speak(text){if(!('speechSynthesis' in window)){$('#conversation-help').textContent='Trình duyệt chưa hỗ trợ giọng đọc. Bạn vẫn có thể xem câu hỏi dạng chữ.';return;}speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.rate=.9;const refresh=()=>window.dispatchEvent(new CustomEvent('listening-session-change'));utterance.onstart=refresh;utterance.onend=refresh;utterance.onerror=()=>{$('#conversation-help').textContent='Chưa phát được giọng đọc mẫu. Bạn vẫn có thể xem câu hỏi.';refresh();};speechSynthesis.speak(utterance);}
$('#conversation-start').addEventListener('click',()=>{state.started=true;state.phase='ready';render();$('#conversation-record').focus();speak(turns[state.count].question);});
$('#conversation-record').addEventListener('click',()=>{if(!state.started||state.ended||state.count>=3||state.phase!=='ready')return;state.phase='recording';if('speechSynthesis'in window)speechSynthesis.cancel();render();$('#conversation-stop').focus();});
$('#conversation-stop').addEventListener('click',()=>{if(state.phase==='recording')processAnswer();});
$('#conversation-retry').addEventListener('click',()=>{
 if(state.phase==='processing-error'){processAnswer();return;}
 if(!['mic-error','silence'].includes(state.phase))return;
 state.phase='ready';render();$('#conversation-record').focus();
});
$('#apply-fixture').addEventListener('click',()=>{
 const outcome=$('#fixture-outcome').value;
 if(['mic-error','processing-error','silence'].includes(outcome)&&state.started&&state.count<3&&!state.ended){cancelProcessing();state.phase=outcome;if('speechSynthesis'in window)speechSynthesis.cancel();render();$('#conversation-retry').focus();return;}
 if(state.phase!=='processing'||state.count>=3||state.ended){$('#conversation-help').textContent='Hãy bắt đầu và dừng một lượt trả lời trước khi xem kết quả.';return;}
 completeTurn(outcome);
});
$('#conversation-reviewed').addEventListener('click',()=>{if(state.count!==3)return;state.viewed=true;if(conversationComplete(state.count,state.viewed)){const post=read().post;if(!post.complete.includes('conversation'))write({post:{...post,complete:[...post.complete,'conversation']}});}render();});
let leavingHref=null,allowLeave=false,leaveFocus=null;
function unfinished(){return state.started&&!state.ended&&!state.viewed;}
document.addEventListener('click',event=>{
 const link=event.target.closest?.('a[href]');
 if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download')||link.target&&link.target!=='_self'||!unfinished())return;
 const destination=new URL(link.href,window.location.href),current=new URL(window.location.href);
 if(destination.origin===current.origin&&destination.pathname===current.pathname&&destination.search===current.search&&destination.hash)return;
 if(!['http:','https:'].includes(destination.protocol))return;
 event.preventDefault();event.stopImmediatePropagation();
 leavingHref=destination.href;leaveFocus=document.activeElement;
 if(state.phase==='processing')cancelProcessing();
 $('#end-dialog').returnValue='';$('#end-dialog').showModal();
},true);
$('#end-dialog').addEventListener('close',()=>{
 const href=leavingHref;leavingHref=null;
 if($('#end-dialog').returnValue!=='leave'){
  if(state.phase==='processing')processAnswer();
  else leaveFocus?.focus();
  return;
 }
 if(!href)return;
 cancelProcessing();allowLeave=true;
 state.ended=state.count<3;state.phase='ready';
 if('speechSynthesis'in window)speechSynthesis.cancel();
 render();location.assign(href);
});
window.addEventListener('beforeunload',event=>{
 if(allowLeave||!unfinished())return;
 event.preventDefault();event.returnValue='';
});
window.addEventListener('pagehide',()=>{
 cancelProcessing();
 if('speechSynthesis'in window)speechSynthesis.cancel();
 if(['recording','processing'].includes(state.phase)){state.phase='ready';save();}
});
window.addEventListener('pageshow',event=>{allowLeave=false;if(event.persisted)render();});
$('#conversation-resume').addEventListener('click',()=>{state.ended=false;state.phase='ready';render();$('#conversation-record').focus();});
document.addEventListener('keydown',event=>{
 if(event.defaultPrevented||event.repeat||event.isComposing||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||event.key.toLowerCase()!=='r')return;
 if($('#conversation-chat').hidden||document.querySelector('dialog[open]'))return;
 const target=event.target;
 if(target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;
 // Character shortcuts apply only while focus belongs to the conversation.
 if(!$('#conversation-chat').contains(target))return;
 const action=state.phase==='ready'?$('#conversation-record'):state.phase==='recording'?$('#conversation-stop'):null;
 if(!action||action.hidden||action.disabled)return;
 event.preventDefault();action.click();
});
render();
