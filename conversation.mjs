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
function render(){
 $('#conversation-progress').textContent=`${state.count} / 3 lượt chính`;
 $('#conversation-intro').hidden=state.started;
 $('#conversation-chat').hidden=!state.started||state.ended||state.count===3;
 $('#conversation-partial').hidden=!state.ended;
 $('#conversation-final').hidden=state.count<3||state.ended;
 $('#conversation-reviewed').hidden=state.viewed;$('#conversation-complete-links').hidden=!state.viewed;
 if(state.ended)$('#partial-count').textContent=`${state.count} / 3 lượt chính đã được trả lời. ${state.count?'Bạn đã nêu được một phần ý tưởng; phần chưa nói chưa đủ bằng chứng để nhận xét.':'Chưa có lời đáp để nhận xét.'}`;
 $('#chat-messages').replaceChildren();
 for(let i=0;i<=Math.min(state.count,2);i++){
  const message=document.createElement('div');message.className='chat-message';
  const speaker=document.createElement('span');speaker.className='speaker';speaker.textContent='AI · Người cùng nhà';
  const text=document.createElement('p');text.lang='en';text.textContent=turns[i].question;
  const listen=document.createElement('button');listen.className='text-button';listen.textContent='▷ Nghe câu hỏi';listen.addEventListener('click',()=>speak(turns[i].question));message.append(speaker,text,listen);$('#chat-messages').append(message);
  if(i<state.count){const user=document.createElement('div');user.className='chat-message user';const label=document.createElement('span');label.className='speaker';label.textContent=`Bạn · Lượt chính ${i+1}`;const copy=document.createElement('p');copy.lang='en';copy.textContent=turns[i].answer;user.append(label,copy);$('#chat-messages').append(user);}
 }
 const phases={ready:[`Lượt chính ${state.count+1} · Trả lời bằng giọng nói`,'Hãy nói xong ý trước khi AI tiếp lời.'],recording:['Đang ghi âm…','Hãy nói xong ý rồi bấm Dừng.'],processing:['Đang xử lý câu trả lời…','Lượt này chưa được tính là đã trả lời.'],'mic-error':['Chưa truy cập được micro','Kiểm tra quyền micro rồi thử lại. Chưa tạo bản thu.'],'processing-error':['Chưa xử lý được lượt trả lời','Không thêm lời đáp hay câu hỏi nối tiếp giả. Tiến trình trước đó được giữ nguyên.'],silence:['Chưa có lời nói để đánh giá','Lượt im lặng chưa được tính. Bạn có thể thử lại.']};
 const [title,help]=phases[state.phase]||phases.ready;$('#conversation-state').textContent=title;$('#conversation-help').textContent=help;
 $('#conversation-voice').classList.toggle('recording',state.phase==='recording');
 $('#conversation-record').hidden=state.phase!=='ready';$('#conversation-stop').hidden=state.phase!=='recording';$('#conversation-retry').hidden=!['mic-error','processing-error','silence'].includes(state.phase);
 $('#conversation-end').disabled=state.phase==='processing';
 save();
}
function speak(text){if(!('speechSynthesis' in window)){$('#conversation-help').textContent='Trình duyệt chưa hỗ trợ giọng đọc. Bạn vẫn có thể xem câu hỏi dạng chữ.';return;}speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.rate=.9;const refresh=()=>window.dispatchEvent(new CustomEvent('listening-session-change'));utterance.onstart=refresh;utterance.onend=refresh;utterance.onerror=()=>{$('#conversation-help').textContent='Chưa phát được giọng đọc mẫu. Bạn vẫn có thể xem câu hỏi.';refresh();};speechSynthesis.speak(utterance);}
$('#conversation-start').addEventListener('click',()=>{state.started=true;state.phase='ready';render();$('#conversation-record').focus();});
$('#conversation-record').addEventListener('click',()=>{if(state.count>=3)return;state.phase='recording';if('speechSynthesis'in window)speechSynthesis.cancel();render();});
$('#conversation-stop').addEventListener('click',()=>{state.phase='processing';render();});
$('#conversation-retry').addEventListener('click',()=>{state.phase=state.phase==='processing-error'?'processing':'ready';render();});
$('#apply-fixture').addEventListener('click',()=>{
 const outcome=$('#fixture-outcome').value;
 if(outcome==='mic-error'&&state.started&&state.count<3&&!state.ended){state.phase='mic-error';render();return;}
 if(state.phase!=='processing'||state.count>=3||state.ended){$('#conversation-help').textContent='Hãy bắt đầu và dừng một lượt trả lời trước khi xem kết quả.';return;}
 const next=acceptVoiceTurn(state.count,outcome);state.count=next;state.phase=outcome==='valid'?'ready':outcome;render();
 if(next===3){$('#conversation-final').scrollIntoView({block:'nearest'});$('#conversation-reviewed').focus();}
 else $('#chat-messages').scrollTop=$('#chat-messages').scrollHeight;
});
$('#conversation-reviewed').addEventListener('click',()=>{if(state.count!==3)return;state.viewed=true;if(conversationComplete(state.count,state.viewed)){const post=read().post;if(!post.complete.includes('conversation'))write({post:{...post,complete:[...post.complete,'conversation']}});}render();});
$('#conversation-end').addEventListener('click',()=>{$('#end-dialog').returnValue='';$('#end-dialog').showModal();});
$('#end-dialog').addEventListener('close',()=>{if($('#end-dialog').returnValue!=='end')return;state.ended=true;state.phase='ready';if('speechSynthesis'in window)speechSynthesis.cancel();render();$('#conversation-resume').focus();});
$('#conversation-resume').addEventListener('click',()=>{state.ended=false;state.phase='ready';render();$('#conversation-record').focus();});
render();
