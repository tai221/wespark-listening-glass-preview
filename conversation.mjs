import {read,write} from './session.mjs';
import {acceptVoiceTurn,conversationComplete} from './practice-state.mjs';
const $=s=>document.querySelector(s);
let state={started:false,count:0,phase:'ready',ended:false,viewed:false,reviewOpen:false,...read().conversation};
delete state.preferences;
if(['recording','processing','requesting-mic','saving-recording'].includes(state.phase))state.phase='ready';
let recordings=[],pendingRecording=null,capture=null,captureVersion=0,recordingPlayer=null,playingButton=null;
function stopRecordingPlayback(){
 if(recordingPlayer){recordingPlayer.pause();recordingPlayer=null;}
 if(playingButton){playingButton.setAttribute('aria-pressed','false');playingButton=null;}
}
function abortCapture(){
 captureVersion++;
 if(capture){const current=capture;capture=null;current.recorder.onstop=null;current.recorder.ondataavailable=null;if(current.recorder.state!=='inactive')current.recorder.stop();current.stream.getTracks().forEach(track=>track.stop());}
}
function clearRecordings(){
 abortCapture();stopRecordingPlayback();
 for(const url of new Set([...recordings,pendingRecording].filter(Boolean)))window.URL.revokeObjectURL(url);
 recordings=[];pendingRecording=null;
}
async function beginCapture(){
 const version=++captureVersion;
 state.phase='requesting-mic';render();$('#conversation-state').focus();
 let stream;
 try{
  stream=await window.navigator.mediaDevices.getUserMedia({audio:true});
  if(version!==captureVersion){stream.getTracks().forEach(track=>track.stop());return;}
  const recorder=new window.MediaRecorder(stream),chunks=[];capture={recorder,stream,chunks};
  recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
  recorder.start();state.phase='recording';render();$('#conversation-stop').focus();
 }catch{
  stream?.getTracks().forEach(track=>track.stop());capture=null;
  if(version!==captureVersion)return;state.phase='mic-error';render();$('#conversation-retry').focus();
 }
}
function finishCapture(){
 if(!capture){processAnswer();return;}
 const current=capture,version=captureVersion;capture=null;state.phase='saving-recording';render();
 current.recorder.onstop=()=>{
  current.stream.getTracks().forEach(track=>track.stop());
  if(version!==captureVersion)return;
  const blob=new window.Blob(current.chunks,{type:current.recorder.mimeType||'audio/webm'});
  if(!blob.size){state.phase='silence';render();return;}
  if(pendingRecording)window.URL.revokeObjectURL(pendingRecording);
  pendingRecording=window.URL.createObjectURL(blob);processAnswer();
 };
 current.recorder.stop();
}
const turns=[
 {question:'What could we change at home to reduce waste?',answer:'We can planning our meals before shopping. Then we buy only what we need.'},
 {question:'You suggested planning meals before shopping. How would that help us waste less food?',answer:"We see what we have. We don't buy too much."},
 {question:'How could we make planning meals an easy habit to keep?',answer:'We can check the fridge before we write a shopping list.'}
];
const turnHints=[
 [
  {en:'We could plan our meals before shopping, so we buy only what we need.',vi:'Chúng ta có thể lên kế hoạch bữa ăn trước khi mua sắm để chỉ mua những gì cần.'},
  {en:'We could use reusable bags instead of plastic bags.',vi:'Chúng ta có thể dùng túi dùng lại thay cho túi nhựa.'},
  {en:'We could start by using up the food in our fridge.',vi:'Chúng ta có thể bắt đầu bằng việc dùng hết thực phẩm trong tủ lạnh.'}
 ],
 [
  {en:'This would help because we know what food we already have.',vi:'Cách này hữu ích vì chúng ta biết mình đang có những thực phẩm gì.'},
  {en:"We can check what we have, so we don't buy too much.",vi:'Chúng ta có thể kiểm tra đồ đang có để không mua quá nhiều.'},
  {en:'Planning meals helps us use our food before it goes bad.',vi:'Lên kế hoạch bữa ăn giúp chúng ta dùng thực phẩm trước khi chúng bị hỏng.'}
 ],
 [
  {en:'To make it easier, we can check the fridge before writing a shopping list.',vi:'Để dễ thực hiện hơn, chúng ta có thể kiểm tra tủ lạnh trước khi viết danh sách mua sắm.'},
  {en:'We can plan our meals together every Sunday.',vi:'Chúng ta có thể cùng lên kế hoạch bữa ăn vào mỗi Chủ nhật.'},
  {en:'We can keep a shopping list on the fridge and update it together.',vi:'Chúng ta có thể để danh sách mua sắm trên tủ lạnh và cùng cập nhật.'}
 ]
];
// Scripted review data for the prototype, never computed from microphone input.
const turnFeedback=[
 {rating:'Đúng trọng tâm',content:'Bạn đề xuất lên kế hoạch bữa ăn và giải thích mua vừa đủ. Ý tưởng phù hợp với việc giảm rác thải trong nhà.',expression:'“Plan our meals” và “buy only what we need” diễn đạt rõ việc cần làm.',suggestion:'We can plan our meals before shopping, so we buy only what we need.'},
 {rating:'Có thể diễn đạt rõ hơn',content:'Bạn đã nêu việc kiểm tra đồ đang có và tránh mua thừa. Thêm quan hệ nguyên nhân để người nghe hiểu rõ hai ý liên quan thế nào.',expression:'Hai câu đều dễ hiểu. Dùng “so” để nối hành động với kết quả.',suggestion:"We check what we have, so we don't buy too much."},
 {rating:'Đúng trọng tâm',content:'Bạn chọn đúng thời điểm kiểm tra tủ lạnh: trước khi viết danh sách. Đây là cách cụ thể để duy trì thói quen.',expression:'“Before we write a shopping list” làm rõ thứ tự thực hiện.',suggestion:'Before we write a shopping list, we can check the fridge together.'}
];
const criteria=[
 {id:'pronunciation',label:'Phát âm',icon:'M12 3v12m-4-9v6a4 4 0 0 0 8 0V6M5 11a7 7 0 0 0 14 0m-7 7v3m-4 0h8',intro:'Từ và cụm từ nên luyện trong các câu trả lời của bạn.',notes:[['meals · shopping','Luyện âm cuối /z/ trong “meals” và âm /ʃ/ trong “shopping”.'],['what we have','Đọc liền cụm “what we have”, giữ rõ âm /v/ ở cuối “have”.'],['fridge · list','Giữ rõ âm /dʒ/ ở cuối “fridge” và /st/ ở cuối “list”.']]},
 {id:'vocabulary',label:'Từ vựng',icon:'M3 19 9 5l6 14M5 15h8m4-4h4m-4 4h4m-4 4h4',intro:'Các cách dùng từ gắn với tình huống giảm lãng phí thực phẩm.',notes:[['plan our meals · buy only what we need','Hai cụm từ cụ thể, bám sát giải pháp bạn đề xuất.'],['check what we have','“Check” làm rõ hành động kiểm tra đồ đang có hơn “see”.'],['check the fridge · write a shopping list','Cụm từ đời thường, phù hợp với một kế hoạch có thể thực hiện ngay.']]},
 {id:'grammar',label:'Ngữ pháp',icon:'M4 4h16v13H9l-5 4V4Zm4 5h8m-8 4h5',intro:'Giữ ý của bạn và làm rõ mối liên hệ giữa các câu.',notes:[['We can plan our meals before shopping.','“Can + động từ” phù hợp để đề xuất một thay đổi.'],["We check what we have, so we don't buy too much.",'Thêm “so” để nối hành động kiểm tra với kết quả tránh mua thừa.'],['Before we write a shopping list, we can check the fridge.','Mệnh đề “before” giúp người nghe hiểu thứ tự thực hiện.']]},
 {id:'fluency',label:'Độ trôi chảy',icon:'M3 18a9 9 0 1 1 18 0H3Zm9-3 5-6M6 13l2 1m3-7v2m6 5 2-1',intro:'Thử chia câu thành cụm ý để nói liền mạch, có chỗ nghỉ tự nhiên.',notes:[['We can plan our meals / before shopping. / Then we buy only what we need.','Nghỉ nhẹ giữa đề xuất và ích lợi, giữ liền cụm “plan our meals”.'],["We check what we have / so we don't buy too much.",'Nối hai ý thành một câu; nghỉ nhẹ trước kết quả.'],['We can check the fridge / before we write a shopping list.','Chia thành hành động và thời điểm, tránh ngắt giữa “shopping list”.']]},
 {id:'intonation',label:'Ngữ điệu',icon:'M3 12h3m3-5v10m3-14v18m3-15v12m3-9v6m3-4v2',intro:'Nhấn từ mang ý chính để đề xuất và giải thích dễ theo dõi hơn.',notes:[['PLAN our MEALS · only what we NEED','Nhấn vào thói quen mới và ý mua vừa đủ; hạ giọng khi kết thúc ý.'],["CHECK what we have · DON'T buy TOO MUCH",'Làm nổi bật hành động kiểm tra và kết quả tránh mua thừa.'],['CHECK the FRIDGE · BEFORE · shopping LIST','Nhấn hành động và thời điểm để kế hoạch nghe rõ ràng hơn.']]}
];
function textElement(tag,copy,className){const el=document.createElement(tag);el.textContent=copy;if(className)el.className=className;return el;}
// Deliberate UI fixtures, including speed/word marks; no audio measurement occurs.
const speechReview=[
 {wpm:129,pace:'chậm',words:{meals:'practice',shopping:'practice',need:'clear'},pauses:{6:'good'}},
 {wpm:156,pace:'vừa phải',words:{see:'practice',have:'unclear',much:'clear'},pauses:{4:'good',8:'bad'}},
 {wpm:148,pace:'vừa phải',words:{fridge:'practice',list:'unclear',before:'clear'},pauses:{4:'good'}}
];
let sentenceReviewId=0;
const reviewSvg=path=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
const reviewSpark=reviewSvg('m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z');
function appendTurnFeedback(content,i){
 const feedback=turnFeedback[i],speech=speechReview[i],id=`sentence-review-${sentenceReviewId++}`;
 const review=document.createElement('div');review.className='turn-feedback';
 const card=document.createElement('section');card.className='sentence-review-card';card.id=id;card.hidden=true;card.setAttribute('aria-label',`Nhận xét câu trả lời ${i+1}`);
 const tablist=document.createElement('div');tablist.className='sentence-review-tabs';tablist.setAttribute('role','tablist');tablist.setAttribute('aria-label',`Nhận xét câu ${i+1}`);
 const overview=document.createElement('div');overview.className='sentence-overview';
 const fluency=document.createElement('div');fluency.className='sentence-fluency';fluency.hidden=true;
 const panels=[overview,fluency];
 const tabs=['Tổng quan','Độ trôi chảy'].map((label,index)=>{
  const tab=textElement('button',label);tab.type='button';tab.id=`${id}-tab-${index}`;tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(index===0));tab.tabIndex=index===0?0:-1;
  tab.insertAdjacentHTML('afterbegin',reviewSvg(index===0?'M4 6h16M4 12h16M4 18h16':'M3 18a9 9 0 1 1 18 0H3Zm9-3 5-6M6 13l2 1m3-7v2m6 5 2-1'));
  const panel=panels[index];panel.id=`${id}-panel-${index}`;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.tabIndex=0;tab.setAttribute('aria-controls',panel.id);
  tab.addEventListener('click',()=>select(index));tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:1-index;select(next);tabs[next].focus();});
  tablist.append(tab);return tab;
 });
 function select(index){tabs.forEach((tab,n)=>{tab.setAttribute('aria-selected',String(n===index));tab.tabIndex=n===index?0:-1;panels[n].hidden=n!==index;});}
 overview.append(textElement('p',feedback.content,'sentence-review-comment'));
 const suggestion=textElement('p','Ví dụ: ','sentence-review-suggestion');const example=textElement('span',`“${feedback.suggestion}”`);example.lang='en';suggestion.append(example);overview.append(suggestion);
 const transcript=document.createElement('p');transcript.className='sentence-review-transcript';transcript.lang='en';
 turns[i].answer.split(' ').forEach((word,index)=>{
  if(index)transcript.append(document.createTextNode(' '));
  const key=word.toLowerCase().replace(/[^a-z]/g,''),status=speech.words[key];
  if(status){const span=textElement('span',word,`review-word ${status}`);span.title={clear:'Phát âm rõ',practice:'Cần luyện thêm',unclear:'Chưa rõ âm'}[status];transcript.append(span);}else transcript.append(document.createTextNode(word));
 });
 const legend=document.createElement('div');legend.className='sentence-word-legend';
 for(const [label,status] of [['Phát âm rõ','clear'],['Cần luyện thêm','practice'],['Chưa rõ âm','unclear']])legend.append(textElement('span',label,status));
 overview.append(transcript,legend);
 const pausing=document.createElement('p');pausing.className='sentence-pauses';pausing.lang='en';
 turns[i].answer.split(' ').forEach((word,index)=>{if(index)pausing.append(document.createTextNode(' '));pausing.append(document.createTextNode(word));if(speech.pauses[index]){const marker=textElement('span','',`pause-marker ${speech.pauses[index]}`);marker.setAttribute('role','img');marker.setAttribute('aria-label',speech.pauses[index]==='good'?'Ngắt câu đúng':'Ngắt câu sai');pausing.append(marker);}});
 const pauseLegend=document.createElement('div');pauseLegend.className='sentence-pause-legend';
 for(const [label,type] of [['Từ lặp lại','repeat'],['Từ đệm','filler'],['Ngắt câu sai','bad'],['Ngắt câu đúng','good']])pauseLegend.append(textElement('span',label,type));
 const speed=document.createElement('div');speed.className='speech-speed';speed.append(textElement('p','Tốc độ nói: '));speed.firstChild.append(textElement('strong',`${speech.wpm} wpm, ${speech.pace}`));
 const gauge=document.createElement('div');gauge.className='speech-speed-gauge';gauge.setAttribute('role','img');gauge.setAttribute('aria-label',`Tốc độ nói ${speech.wpm} từ mỗi phút, ${speech.pace}`);
 const marker=document.createElement('span');marker.className='speech-speed-marker';marker.style.left=`${Math.max(0,Math.min(100,(speech.wpm-60)/160*100))}%`;gauge.append(marker);speed.append(gauge);
 fluency.append(pausing,pauseLegend,speed);card.append(tablist,overview,fluency);
 const tools=document.createElement('div');tools.className='sentence-review-tools';
 const toggle=document.createElement('button');toggle.type='button';toggle.className='turn-feedback-toggle';toggle.innerHTML=reviewSpark;toggle.title='Xem nhận xét';toggle.setAttribute('aria-label',`Xem nhận xét câu trả lời ${i+1}`);toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',id);
 toggle.addEventListener('click',()=>{
  const open=card.hidden;card.hidden=!open;toggle.setAttribute('aria-expanded',String(open));review.classList.toggle('is-open',open);
  toggle.innerHTML=reviewSpark;if(open)toggle.append(textElement('span',feedback.rating));
  toggle.title=open?'Đóng nhận xét':'Xem nhận xét';toggle.setAttribute('aria-label',`${open?'Đóng':'Xem'} nhận xét câu trả lời ${i+1}`);
  const original=content.querySelector(':scope > .chat-bubble, :scope > .feedback-answer');if(original)original.hidden=open;
  review.scrollIntoView({block:'nearest'});
 });
 tools.append(toggle);review.append(card,tools);content.append(review);
}
let selectedCriterion=0,showGrammarSuggestions=true,selectedIntonation='sentence';
function reviewMarkedAnswer(i){
 const p=textElement('p','','review-pronunciation');p.lang='en';
 turns[i].answer.split(' ').forEach((word,index)=>{if(index)p.append(document.createTextNode(' '));const key=word.toLowerCase().replace(/[^a-z]/g,''),status=speechReview[i].words[key];if(status){const span=textElement('span',word,`review-word ${status}`);span.title={clear:'Phát âm rõ',practice:'Cần luyện thêm',unclear:'Chưa rõ âm'}[status];p.append(span);}else p.append(document.createTextNode(word));});return p;
}
function reviewFluency(i){
 const box=document.createElement('div');box.className='review-fluency';const speech=speechReview[i];
 const transcript=textElement('p','','sentence-pauses');transcript.lang='en';
 turns[i].answer.split(' ').forEach((word,index)=>{if(index)transcript.append(document.createTextNode(' '));transcript.append(document.createTextNode(word));if(speech.pauses[index]){const marker=textElement('span','',`pause-marker ${speech.pauses[index]}`);marker.setAttribute('role','img');marker.setAttribute('aria-label',speech.pauses[index]==='good'?'Ngắt câu đúng':'Ngắt câu sai');transcript.append(marker);}});
 box.append(transcript);return box;
}
function reviewAverageSpeed(){
 const counts=turns.slice(0,state.count).map(turn=>turn.answer.split(/\s+/).length);
 const words=counts.reduce((sum,count)=>sum+count,0),minutes=counts.reduce((sum,count,index)=>sum+count/speechReview[index].wpm,0);
 const wpm=minutes?Math.round(words/minutes):0,pace=wpm<130?'chậm':wpm>180?'nhanh':'vừa phải';
 const speed=document.createElement('div');speed.className='speech-speed review-average-speed';speed.append(textElement('p','Tốc độ nói trung bình: '));speed.firstChild.append(textElement('strong',`${wpm} wpm, ${pace}`));
 const gauge=document.createElement('div');gauge.className='speech-speed-gauge';gauge.setAttribute('role','img');gauge.setAttribute('aria-label',`Tốc độ nói trung bình ${wpm} từ mỗi phút, ${pace}`);
 const pointer=document.createElement('span');pointer.className='speech-speed-marker';pointer.style.left=`${Math.max(0,Math.min(100,(wpm-60)/160*100))}%`;gauge.append(pointer);speed.append(gauge);return speed;
}
// Prototype CEFR labels for the scripted replies; not a certified lexical assessment.
const vocabularyLevels=[
 {level:'A1',words:['we','can','our','before','then','buy','only','what','need','see','have',"don't",'too','much','the','write','a','list']},
 {level:'A2',words:['planning','meals','shopping','check','fridge']},
 {level:'B1',words:[]},{level:'B2',words:[]},{level:'C1',words:[]},{level:'C2',words:[]}
];
function renderVocabularySummary(panel){
 const used=new Set(turns.slice(0,state.count).flatMap(turn=>turn.answer.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g)||[]));
 const groups=vocabularyLevels.map(group=>({...group,words:group.words.filter(word=>used.has(word))}));
 const total=groups.reduce((sum,group)=>sum+group.words.length,0);
 const percentages=groups.map(group=>total?Math.floor(group.words.length/total*100):0);
 if(total){
  const remainder=100-percentages.reduce((sum,n)=>sum+n,0);
  const ranked=groups.map((group,index)=>({index,fraction:group.words.length/total*100-percentages[index]})).sort((a,b)=>b.fraction-a.fraction);
  for(let n=0;n<remainder;n++)percentages[ranked[n].index]++;
 }
 const section=document.createElement('section');section.className='review-vocabulary';section.setAttribute('aria-label','Thống kê từ vựng cả phiên');
 const summary=document.createElement('div');summary.className='vocabulary-summary';
 const overview=document.createElement('div');overview.className='vocabulary-overview';overview.append(textElement('h4','Phân loại từ vựng sử dụng'));
 const advanced=document.createElement('div');advanced.className='vocabulary-advanced';const advancedCount=groups.slice(3).reduce((sum,g)=>sum+g.words.length,0);advanced.append(textElement('strong',`${total?Math.round(advancedCount/total*100):0}%`),textElement('span','Từ vựng nâng cao'),textElement('small','B2–C2'));overview.append(advanced);
 const chart=document.createElement('div');chart.className='vocabulary-level-chart';chart.setAttribute('role','img');chart.setAttribute('aria-label',groups.map((group,i)=>`${group.level}: ${percentages[i]}%`).join(', '));
 groups.forEach((group,index)=>{
  const bar=document.createElement('div');bar.className=`vocabulary-level-bar cefr-${group.level.toLowerCase()}`;bar.dataset.percentage=String(percentages[index]);
  const track=document.createElement('div');track.className='vocabulary-level-track';const fill=document.createElement('div');fill.className='vocabulary-level-fill';fill.style.height=`${percentages[index]}%`;
  const value=textElement('span',`${percentages[index]}%`,'vocabulary-level-value');value.style.bottom=`${percentages[index]}%`;track.append(fill,value);bar.append(track,textElement('span',group.level,'vocabulary-level-label'));chart.append(bar);
 });summary.append(overview,chart);
 const table=document.createElement('table');table.className='vocabulary-level-table';const caption=textElement('caption','Từ đã sử dụng theo cấp độ CEFR');table.append(caption);
 const body=document.createElement('tbody');groups.forEach(group=>{const row=document.createElement('tr');row.className=`cefr-${group.level.toLowerCase()}`;const label=document.createElement('th');label.scope='row';label.append(textElement('span',group.level,'vocabulary-level-label'));const words=textElement('td',group.words.length?group.words.join(', '):'Chưa sử dụng');words.lang=group.words.length?'en':'vi';if(!group.words.length)words.className='vocabulary-empty';row.append(label,words);body.append(row);});table.append(body);
 section.append(summary,table);panel.append(section);
}
function applyGrammarSuggestions(){
 document.querySelectorAll('.grammar-correction').forEach(el=>{el.hidden=!showGrammarSuggestions;});
 document.querySelectorAll('.grammar-original[data-kind]').forEach(el=>{el.classList.toggle('has-suggestion',showGrammarSuggestions);});
}
function appendGrammarControls(panel){
 const controls=document.createElement('div');controls.className='grammar-controls';const legend=document.createElement('div');legend.className='grammar-legend';
 for(const [label,kind] of [['Ngữ pháp sai','error'],['Có thể cải thiện','improve'],['Câu sửa','corrected']])legend.append(textElement('span',label,kind));
 const label=document.createElement('label');label.className='grammar-suggestions-label';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.id='grammar-suggestions';checkbox.setAttribute('role','switch');checkbox.checked=showGrammarSuggestions;checkbox.addEventListener('change',()=>{showGrammarSuggestions=checkbox.checked;applyGrammarSuggestions();});label.append(checkbox,document.createTextNode('Gợi ý sửa lỗi'));controls.append(legend,label);panel.append(controls);
}
function grammarReview(i){
 const grammar=document.createElement('div');grammar.className='review-grammar';
 const original=textElement('p','','grammar-original');original.lang='en';grammar.append(original);
 if(i===0){
  original.append(document.createTextNode('We can '));const error=textElement('span','planning','grammar-original');error.dataset.kind='error';error.classList.toggle('has-suggestion',showGrammarSuggestions);original.append(error,document.createTextNode(' our meals before shopping. Then we buy only what we need.'));
 }else original.textContent=turns[i].answer;
 if(i<2){
  if(i===1){original.dataset.kind='improve';original.classList.toggle('has-suggestion',showGrammarSuggestions);}
  const correction=document.createElement('details');correction.className='grammar-correction';correction.hidden=!showGrammarSuggestions;
  const summary=document.createElement('summary');summary.append(textElement('span','Ví dụ: ','grammar-example-label'));
  const fixed=i===0?'We can plan our meals before shopping. Then we buy only what we need.':criteria[2].notes[i][0];
  const phrase=textElement('span',`“${fixed}”`,'grammar-replacement');phrase.lang='en';summary.append(phrase);summary.setAttribute('aria-label',`Xem giải thích câu sửa ở lượt ${i+1}`);
  const explanation=document.createElement('div');explanation.className='grammar-correction-detail';
  explanation.append(textElement('strong',i===0?'Sau “can” dùng động từ nguyên mẫu':'Nối ý với “so”'),textElement('p',i===0?'Dùng “can plan”, không dùng “can planning”. Sau động từ khuyết thiếu “can”, động từ chính ở dạng nguyên mẫu.':'Hai câu ban đầu đều đúng ngữ pháp. Dùng “so” để nối hành động kiểm tra với kết quả tránh mua thừa; “check” cũng thể hiện rõ việc kiểm tra hơn “see”.'));
  correction.append(summary,explanation);grammar.append(correction);
 }
 return grammar;
}
const intonationModes=[{id:'sentence',label:'Trọng âm trong câu'},{id:'pitch',label:'Ngữ điệu câu'},{id:'word',label:'Trọng âm của từ'}];
function intonationControls(root){
 const tabs=document.createElement('div');tabs.className='intonation-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Phân tích ngữ điệu');
 intonationModes.forEach((mode,index)=>{
  const tab=textElement('button',mode.label);tab.type='button';tab.id=`intonation-tab-${mode.id}`;tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(selectedIntonation===mode.id));tab.setAttribute('aria-controls','intonation-content');tab.tabIndex=selectedIntonation===mode.id?0:-1;
  const select=next=>{selectedIntonation=intonationModes[next].id;renderFeedback();$(`#intonation-tab-${selectedIntonation}`).focus();};tab.addEventListener('click',()=>select(index));
  tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%3;else if(event.key==='ArrowLeft')next=(index+2)%3;else if(event.key==='Home')next=0;else if(event.key==='End')next=2;else return;event.preventDefault();select(next);});tabs.append(tab);
 });
 const content=document.createElement('section');content.id='intonation-content';content.setAttribute('role','tabpanel');content.setAttribute('aria-labelledby',`intonation-tab-${selectedIntonation}`);content.tabIndex=0;root.append(tabs,content);return content;
}
function intonationResponse(i){
 const box=document.createElement('div');box.className='intonation-response';
 if(selectedIntonation==='pitch')box.append(textElement('p','Chưa có dữ liệu ngữ điệu','intonation-no-data'));
 const sentence=textElement('p','','review-intonation');sentence.lang='en';
 const stress=[{planning:'missing',meals:'missing',buy:'correct',need:'correct',before:'wrong'},{see:'missing',have:'correct',much:'missing'}, {check:'correct',fridge:'missing',before:'correct',list:'correct'}][i];
 const syllables={planning:['plan','ning',0],before:['be','fore',1],shopping:['shop','ping',0],only:['on','ly',0]};
 turns[i].answer.split(' ').forEach((word,index)=>{
  if(index)sentence.append(document.createTextNode(' '));const key=word.toLowerCase().replace(/[.,]/g,''),status=stress[key];
  if(selectedIntonation==='sentence'&&status){const mark=textElement('span',word,`intonation-stress ${status}`);mark.title={wrong:'Nhấn trọng âm sai',correct:'Nhấn trọng âm đúng',missing:'Thiếu nhấn trọng âm'}[status];sentence.append(mark);}
  else if(selectedIntonation==='word'&&syllables[key]){
   const parts=syllables[key],mark=textElement('span','',`intonation-syllable ${status||'correct'}`);mark.title=`Trọng âm ở âm tiết ${parts[2]+1}`;
   for(let n=0;n<2;n++){if(n)mark.append(document.createTextNode('·'));mark.append(textElement(n===parts[2]?'strong':'span',parts[n]));}
   if(/[.,]$/.test(word))mark.append(document.createTextNode(word.slice(-1)));sentence.append(mark);
  }else sentence.append(document.createTextNode(word));
 });box.append(sentence);return box;
}
function renderFeedback(){
 stopRecordingPlayback();
 const criterion=criteria[selectedCriterion];let panel=$('#feedback-panel');
 panel.setAttribute('aria-labelledby',`feedback-tab-${criterion.id}`);panel.dataset.criterion=criterion.id;panel.replaceChildren();
 criteria.forEach((item,index)=>{const tab=$(`#feedback-tab-${item.id}`);tab.setAttribute('aria-selected',String(index===selectedCriterion));tab.tabIndex=index===selectedCriterion?0:-1;});
 if(criterion.id==='vocabulary'){renderVocabularySummary(panel);return;}
 if(criterion.id==='intonation')panel=intonationControls(panel);
 if(criterion.id==='fluency')panel.append(reviewAverageSpeed());
 const heading=textElement('h4',`Dòng thời gian · ${criterion.label}`,'review-timeline-title');heading.id='review-timeline-title';panel.append(heading);
 if(criterion.id==='grammar')appendGrammarControls(panel);
 if(criterion.id==='intonation'&&selectedIntonation!=='pitch'){
  const legend=document.createElement('div');legend.className='intonation-legend';
  for(const [label,status] of [['Nhấn trọng âm sai','wrong'],['Nhấn trọng âm đúng','correct'],['Thiếu nhấn trọng âm','missing']])legend.append(textElement('span',label,status));panel.append(legend);
 }

 if(criterion.id==='pronunciation'||criterion.id==='fluency'){
  const legend=document.createElement('div');legend.className=criterion.id==='pronunciation'?'sentence-word-legend':'sentence-pause-legend';
  const labels=criterion.id==='pronunciation'?[['Phát âm rõ','clear'],['Cần luyện thêm','practice'],['Chưa rõ âm','unclear']]:[['Từ lặp lại','repeat'],['Từ đệm','filler'],['Ngắt câu sai','bad'],['Ngắt câu đúng','good']];labels.forEach(([label,kind])=>legend.append(textElement('span',label,kind)));panel.append(legend);
 }
 const timeline=document.createElement('ol');timeline.className='feedback-timeline';
 turns.forEach((turn,i)=>{
  const item=document.createElement('li');item.className='feedback-turn';
  const questionRow=document.createElement('div');questionRow.className='review-question-row';
  const avatar=document.createElement('img');avatar.src='assets/spark-activities/conversation-v1.webp';avatar.alt='';avatar.width=32;avatar.height=32;
  const question=textElement('p',turn.question,'feedback-question');question.lang='en';questionRow.append(avatar,question);
  const response=document.createElement('div');response.className='review-response';
  const responseHeader=document.createElement('div');responseHeader.className='review-response-header';responseHeader.append(textElement('span',`Bạn · Lượt ${i+1}`,'review-response-label'));
  if(!['vocabulary','grammar'].includes(criterion.id)){
   const listen=document.createElement('button');listen.type='button';listen.className='review-recording-play';listen.innerHTML=reviewSvg('m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14');listen.setAttribute('aria-label',`Nghe lại bản ghi của bạn ở lượt ${i+1}`);listen.setAttribute('aria-pressed','false');listen.disabled=!recordings[i];listen.title=recordings[i]?'Nghe lại bản ghi của bạn':'Chưa có bản ghi cho lượt này';
   listen.addEventListener('click',async()=>{
    const wasPlaying=playingButton===listen;stopRecordingPlayback();if(wasPlaying)return;
    if('speechSynthesis'in window)speechSynthesis.cancel();
    const player=document.createElement('audio');player.src=recordings[i];recordingPlayer=player;playingButton=listen;listen.setAttribute('aria-pressed','true');
    const reset=()=>{if(recordingPlayer===player)stopRecordingPlayback();};player.addEventListener('ended',reset);player.addEventListener('error',reset);
    try{await player.play();}catch{reset();listen.title='Chưa phát được bản ghi. Bấm để thử lại.';}
   });responseHeader.append(listen);
  }
  response.append(responseHeader);
  if(criterion.id==='pronunciation')response.append(reviewMarkedAnswer(i));
  else if(criterion.id==='fluency')response.append(reviewFluency(i));
  else if(criterion.id==='grammar'){response.append(grammarReview(i));
  }else{
   response.append(intonationResponse(i));
  }
  const recordingButton=responseHeader.querySelector('.review-recording-play');
  if(recordingButton)response.querySelector('.review-pronunciation,.sentence-pauses,.review-intonation').prepend(recordingButton);
  item.append(questionRow,response);timeline.append(item);
 });panel.append(timeline);
}
criteria.forEach((criterion,index)=>{
 const tab=textElement('button',criterion.label);tab.type='button';tab.id=`feedback-tab-${criterion.id}`;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','feedback-panel');
 const icon=document.createElement('span');icon.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${criterion.icon}"/></svg>`;tab.prepend(icon);
 tab.addEventListener('click',()=>{selectedCriterion=index;renderFeedback();});
 tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%criteria.length;else if(event.key==='ArrowLeft')next=(index+criteria.length-1)%criteria.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=criteria.length-1;else return;event.preventDefault();selectedCriterion=next;renderFeedback();$(`#feedback-tab-${criteria[next].id}`).focus();});
 $('#feedback-tabs').append(tab);
});
renderFeedback();
let displayedHint=-1;
function renderHint(){
 const visible=state.started&&!state.ended&&state.count<turns.length;
 $('.conversation-support').hidden=!state.started;
 $('#conversation-hints').hidden=!visible;
 if(!visible||displayedHint===state.count)return;
 displayedHint=state.count;const list=$('#conversation-hint-list');list.replaceChildren();
 turnHints[state.count].forEach((hint,index)=>{
  const item=document.createElement('li'),copy=document.createElement('div');copy.className='hint-sentence';
  const sentence=textElement('p',hint.en);sentence.lang='en';
  const translation=textElement('p',hint.vi,'hint-translation');translation.lang='vi';translation.id=`hint-translation-${state.count}-${index}`;translation.hidden=true;copy.append(sentence,translation);
  const tools=document.createElement('div');tools.className='hint-sentence-tools';
  const listen=document.createElement('button');listen.type='button';listen.innerHTML=audioIcon;listen.title='Nghe gợi ý';listen.setAttribute('aria-label',`Nghe gợi ý ${index+1}`);listen.addEventListener('click',()=>speak(hint.en));
  const translate=document.createElement('button');translate.type='button';translate.innerHTML=translateIcon;translate.title='Dịch gợi ý';translate.setAttribute('aria-label',`Dịch gợi ý ${index+1}`);translate.setAttribute('aria-controls',translation.id);translate.setAttribute('aria-expanded','false');translate.addEventListener('click',()=>{translation.hidden=!translation.hidden;translate.setAttribute('aria-expanded',String(!translation.hidden));});
  tools.append(listen,translate);item.append(copy,tools);list.append(item);
 });
}
function save(){write({conversation:state});}
let processingTimer;
function cancelProcessing(){window.clearTimeout(processingTimer);processingTimer=undefined;}
function completeTurn(outcome){
 if(state.phase!=='processing'||state.count>=3||state.ended)return;
 cancelProcessing();
 if(outcome==='valid'&&pendingRecording){recordings[state.count]=pendingRecording;pendingRecording=null;}
 state.count=acceptVoiceTurn(state.count,outcome);state.phase=outcome==='valid'?'ready':outcome;render();
 renderFeedback();
 if(state.count===3){$('#chat-messages').scrollTop=$('#chat-messages').scrollHeight;$('#conversation-ended-title').focus({preventScroll:true});$('#conversation-ended').scrollIntoView({block:'nearest'});}
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
 if(user)appendTurnFeedback(content,i);
 row.append(avatar,content);$('#chat-messages').append(row);
}
function render(){
 renderHint();
 $('#conversation-progress').textContent=`Đã trả lời ${state.count} / 3`;
 $('#conversation-intro').hidden=state.started;
 $('#conversation-chat').hidden=!state.started||state.ended||state.count===3&&state.reviewOpen;
 $('#conversation-voice').hidden=state.count===3;
 $('#conversation-ended').hidden=state.count<3;
 $('#conversation-partial').hidden=!state.ended;
 $('#conversation-final').hidden=state.count<3||state.ended||!state.reviewOpen;
 if(state.ended)$('#partial-count').textContent=`${state.count} / 3 lượt chính đã được trả lời. ${state.count?'Bạn đã nêu được một phần ý tưởng; phần chưa nói chưa đủ bằng chứng để nhận xét.':'Chưa có lời đáp để nhận xét.'}`;
 const thread=$('#chat-messages'),expected=Math.min(state.count*2+1,6);
 while(thread.children.length<expected){const position=thread.children.length;appendMessage(Math.floor(position/2),position%2===1);}
 document.querySelectorAll('[data-conversation-mission]').forEach((item,index)=>{
  const complete=state.count>index;item.dataset.complete=String(complete);
  item.querySelector('.mission-check').textContent=complete?'✓':'';
  item.querySelector('.mission-status').textContent=complete?'Đã thực hiện':state.started&&state.count===index&&!state.ended?'Đang trao đổi':'Chưa thực hiện';
 });
 $('#conversation-task-count').textContent=`${state.count} / 3`;
 const phases={'requesting-mic':['Đang mở micro…','Cho phép truy cập micro để thu câu trả lời của bạn.'],'saving-recording':['Đang lưu bản thu…',''],ready:[`Lượt chính ${state.count+1} · Trả lời bằng giọng nói`,'Hãy nói xong ý trước khi AI tiếp lời.'],recording:['Đang ghi âm…','Hãy nói xong ý rồi bấm Dừng.'],processing:['Đang xử lý câu trả lời…','Lượt này chưa được tính là đã trả lời.'],'mic-error':['Chưa truy cập được micro','Kiểm tra quyền micro rồi thử lại. Chưa tạo bản thu.'],'processing-error':['Chưa xử lý được lượt trả lời','Không thêm lời đáp hay câu hỏi nối tiếp giả. Tiến trình trước đó được giữ nguyên.'],silence:['Chưa có lời nói để đánh giá','Lượt im lặng chưa được tính. Bạn có thể thử lại.']};
 const [title,help]=phases[state.phase]||phases.ready;$('#conversation-state').textContent=title;$('#conversation-help').textContent=help;
 if(state.phase==='ready'){$('#conversation-state').textContent='Đến lượt bạn';$('#conversation-help').textContent='Bấm micro và trả lời bằng tiếng Anh.';}
 if(state.phase==='recording')$('#conversation-help').textContent='Nói trọn ý, rồi bấm Dừng và gửi.';
 $('#conversation-voice').dataset.phase=state.phase;
 $('#conversation-voice').setAttribute('aria-busy',String(['processing','requesting-mic','saving-recording'].includes(state.phase)));
 $('#conversation-voice').classList.toggle('recording',state.phase==='recording');
 $('#conversation-record').hidden=state.phase!=='ready';$('#conversation-stop').hidden=state.phase!=='recording';$('#conversation-retry').hidden=!['mic-error','processing-error','silence'].includes(state.phase);
 save();
}
function speak(text){if(!('speechSynthesis' in window)){$('#conversation-help').textContent='Trình duyệt chưa hỗ trợ giọng đọc. Bạn vẫn có thể xem câu hỏi dạng chữ.';return;}speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.rate=.9;const refresh=()=>window.dispatchEvent(new CustomEvent('listening-session-change'));utterance.onstart=refresh;utterance.onend=refresh;utterance.onerror=()=>{$('#conversation-help').textContent='Chưa phát được giọng đọc mẫu. Bạn vẫn có thể xem câu hỏi.';refresh();};speechSynthesis.speak(utterance);}
$('#conversation-start').addEventListener('click',()=>{state.started=true;state.phase='ready';render();$('#conversation-record').focus();speak(turns[state.count].question);});
$('#conversation-show-review').addEventListener('click',()=>{
 if(state.count!==3||state.ended)return;
 state.reviewOpen=true;state.viewed=true;
 if(conversationComplete(state.count,state.viewed)){const post=read().post;if(!post.complete.includes('conversation'))write({post:{...post,complete:[...post.complete,'conversation']}});}
 render();$('#conversation-final h3').focus({preventScroll:true});$('#conversation-final').scrollIntoView({block:'start'});
});
$('#conversation-back-to-chat').addEventListener('click',()=>{
 stopRecordingPlayback();state.reviewOpen=false;render();$('#conversation-show-review').focus();
});
function replayConversation(){
 if(state.count!==3)return;
 cancelProcessing();clearRecordings();if('speechSynthesis'in window)speechSynthesis.cancel();
 state={started:true,count:0,phase:'ready',ended:false,viewed:false,reviewOpen:false};
 $('#chat-messages').replaceChildren();displayedHint=-1;selectedCriterion=0;selectedIntonation='sentence';renderFeedback();render();
 $('#chat-messages').scrollTop=0;$('#conversation-record').focus();speak(turns[0].question);
}
$('#conversation-replay').addEventListener('click',replayConversation);
$('#conversation-review-replay').addEventListener('click',replayConversation);
$('#conversation-record').addEventListener('click',()=>{
 if(!state.started||state.ended||state.count>=3||state.phase!=='ready')return;
 stopRecordingPlayback();if('speechSynthesis'in window)speechSynthesis.cancel();
 if(window.navigator.mediaDevices?.getUserMedia&&window.MediaRecorder){beginCapture();return;}
 state.phase='recording';render();$('#conversation-stop').focus();
});
$('#conversation-stop').addEventListener('click',()=>{if(state.phase==='recording')finishCapture();});
$('#conversation-retry').addEventListener('click',()=>{
 if(state.phase==='processing-error'){processAnswer();return;}
 if(!['mic-error','silence'].includes(state.phase))return;
 state.phase='ready';render();$('#conversation-record').focus();
});
$('#apply-fixture').addEventListener('click',()=>{
 const outcome=$('#fixture-outcome').value;
 if(['mic-error','processing-error','silence'].includes(outcome)&&state.started&&state.count<3&&!state.ended){cancelProcessing();abortCapture();if(outcome!=='processing-error'&&pendingRecording){window.URL.revokeObjectURL(pendingRecording);pendingRecording=null;}state.phase=outcome;if('speechSynthesis'in window)speechSynthesis.cancel();render();$('#conversation-retry').focus();return;}
 if(state.phase!=='processing'||state.count>=3||state.ended){$('#conversation-help').textContent='Hãy bắt đầu và dừng một lượt trả lời trước khi xem kết quả.';return;}
 completeTurn(outcome);
});

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
 cancelProcessing();abortCapture();stopRecordingPlayback();allowLeave=true;
 state.ended=state.count<3;state.phase='ready';
 if('speechSynthesis'in window)speechSynthesis.cancel();
 render();location.assign(href);
});
window.addEventListener('beforeunload',event=>{
 if(allowLeave||!unfinished())return;
 event.preventDefault();event.returnValue='';
});
window.addEventListener('pagehide',()=>{
 cancelProcessing();abortCapture();stopRecordingPlayback();
 if('speechSynthesis'in window)speechSynthesis.cancel();
 if(['recording','processing','requesting-mic','saving-recording'].includes(state.phase)){state.phase='ready';save();}
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
