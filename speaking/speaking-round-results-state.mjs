import {fixture,createFeedbackState} from './speaking-feedback-model.mjs';
import {presentationMarks,fluencyText} from './speaking-feedback-presentation.mjs';
import {buildV2Sample} from './speaking-cycle-result-data.mjs';
export const ROUND_RESULTS_KEY='wespark-speaking-hometown-round-results-v1';
const evidence={q1:{vocabulary:{text:'peaceful atmosphere',kind:'upgrade',label:'Gợi ý nâng cấp',replacement:'tranquil atmosphere',explanation:'Cụm gốc đúng. Có thể thử “tranquil atmosphere” nếu phù hợp với ý của bạn.'},kit:{text:'a coastal city',kind:'kit',label:'Vận dụng Speaking Kit',explanation:'Cụm từ được dùng phù hợp để giới thiệu quê hương.'}},q2:{vocabulary:{text:'a lot of',kind:'upgrade',label:'Gợi ý nâng cấp',replacement:'plenty of',explanation:'“Plenty of” là một lựa chọn khác; cách nói gốc vẫn đúng.'},kit:{text:'the laid-back lifestyle',kind:'kit',label:'Vận dụng Speaking Kit',explanation:'Cụm từ phù hợp khi mô tả nhịp sống.'}},q3:{vocabulary:{text:'more comfortable to live in',kind:'upgrade',label:'Gợi ý nâng cấp',replacement:'more liveable',explanation:'Có thể diễn đạt gọn hơn bằng “more liveable”.'},kit:{text:'get around',kind:'kit',label:'Vận dụng Speaking Kit',explanation:'Cụm từ diễn tả việc đi lại trong thành phố.'}}};
// Optional submissions are validated by restoreFollowups before entering results.
export function roundResultQuestions(state){return [...fixture.questions,...(state.optionalQuestions||[])];}
export function restoreRoundResults(raw,optional=[],roundIdentity=null){
 let data;try{data=JSON.parse(raw);}catch{}
 const optionalQuestions=optional.slice(0,2).filter(turn=>turn&&typeof turn.id==='string'&&typeof turn.question==='string'&&typeof turn.reply==='string'&&turn.reply.trim()&&Number.isFinite(turn.duration)&&turn.duration>=1).map((turn,i)=>({id:`q${i+4}`,prompt:turn.question,text:turn.reply,contextualQuestion:turn,identity:JSON.stringify([roundIdentity,turn])}));
 const questions=[...fixture.questions,...optionalQuestions];
 const attempts=Object.fromEntries(questions.map(q=>{
  const sameQuestion=!q.identity||(Array.isArray(data?.optionalQuestions)?data.optionalQuestions:[]).find(saved=>saved?.id===q.id)?.identity===q.identity;
  return [q.id,sameQuestion&&Array.isArray(data?.attempts?.[q.id])?data.attempts[q.id].filter(v=>['mixed','correct','repeat'].includes(v)).slice(0,20):[]];
 }));
 return {schema:1,attempts,...(optionalQuestions.length?{optionalQuestions}:{})};
}
const optionalPhrases={
 'transport-buses':'More frequent buses','transport-journey':'arrived on time',
 'food-dish':'fresh herbs and rich broth','food-memory':'catch up',
 'lifestyle-routine':'clear my mind','lifestyle-park':'put work aside',
 'beach-visit':'sea breeze','beach-morning':'hear the waves clearly',
 'general-place':'everyday life','general-visit':'feel welcome'
};
function optionalSample(state,q,version,criterion){
 const attempts=state.attempts[q.id]||[],selected=Math.max(0,Math.min(version,attempts.length)),outcome=attempts[selected-1];
 const suggested=q.text+(q.contextualQuestion.topic==='transport'?' That would make a real difference to my daily life.':' That is one reason my hometown feels special to me.');
 const text=selected&&outcome!=='repeat'?suggested:q.text,sentences=q.text.match(/[^.!?]+[.!?]+/g)||[q.text],first=sentences[0].trim(),detail=(sentences[1]||sentences[0]).trim();
 const phrase=optionalPhrases[q.contextualQuestion.id],vocabulary=phrase&&text.includes(phrase)?phrase:first;
 const feedback={
  fluency:{text:first,visual:'upgrade',label:'Luyện nhịp nói theo cụm',explanation:'Trong bản minh họa, hãy thử đọc trọn ý này rồi ngắt nhẹ trước câu tiếp theo. Đây là gợi ý luyện tập, chưa phải phân tích bản ghi.'},
  coherence:{text:detail,visual:'positive',label:'Phát triển ý liên quan',explanation:'Chi tiết này phát triển lời đáp trước đó, giúp câu trả lời bám sát câu hỏi nói thêm.'},
  vocabulary:{text:vocabulary,visual:'positive',label:'Cụm từ phù hợp ngữ cảnh',explanation:'Cụm từ này diễn đạt ý cụ thể trong lời đáp. Có thể giữ cách dùng này khi luyện nói lại.'},
  grammar:{text:first,visual:'positive',label:'Cấu trúc câu phù hợp',explanation:'Câu minh họa có cấu trúc ngữ pháp phù hợp với ý đang nói; không cần sửa. Khi luyện lại, giữ cách kết hợp chủ ngữ và động từ này.'},
  pronunciation:{text:vocabulary,visual:'upgrade',label:'Luyện phát âm cụm từ',explanation:'Thử đọc rõ từng từ trong cụm rồi nối lại ở tốc độ tự nhiên. Đây là gợi ý luyện phát âm từ lời đáp mẫu, chưa đánh giá âm thanh thật.'},
  intonation:{text:detail,visual:'upgrade',label:'Luyện ngữ điệu cuối ý',explanation:'Có thể hạ giọng nhẹ cuối câu để báo hiệu kết thúc ý và nhấn từ mang thông tin chính. Đây là gợi ý luyện tập trên bản mẫu.'}
 };
 const mark=feedback[criterion];
 return {id:q.id,version:selected,text,marks:mark?[{...mark,id:`${q.id}-v${selected}-${criterion}`,kind:mark.visual==='positive'?'positive':'upgrade'}]:[],scores:selected?(outcome==='correct'?[7,7,7,7]:outcome==='repeat'?[6,6.5,6,6.5]:[6.5,6.5,6.5,6.5]):[6,6.5,6,6.5],suggested};
}
export function addRoundRetake(state,id,outcome='mixed'){if(!state.attempts[id]||!['mixed','correct','repeat'].includes(outcome)||state.attempts[id].length>=20)return state;return {...state,attempts:{...state.attempts,[id]:[...state.attempts[id],outcome]}};}
export function roundResultSample(state,id,version=0,criterion='grammar'){
 const q=roundResultQuestions(state).find(q=>q.id===id);if(!q)return null;
 if(q.contextualQuestion)return optionalSample(state,q,version,criterion);
 const attempts=state.attempts[id]||[],selected=Math.max(0,Math.min(version,attempts.length));
 if(!selected){const marks=criterion==='coherence'?fixture.examples[id].coherence.map((m,i)=>({...m,id:m.id||`${id}-coherence-${i}`,visual:m.pattern?'error':m.kind==='positive'?'positive':'upgrade'})):presentationMarks(fixture,createFeedbackState(),id,criterion,evidence[id]);return {id,version:0,text:criterion==='fluency'?fluencyText(q):q.text,marks,scores:[5.5,6,5.5,6],suggested:q.corrected.replace(' My phone is blue.','')};}
 // Retake observations come from a complete authored assessment of the current reply,
 // rather than checking whether the original error targets were repaired.
 const outcome=attempts[selected-1],sample=buildV2Sample(q,[],'new',outcome);
 const marks=sample.targets.filter(m=>m.criterion===criterion&&m.text&&sample.after.includes(m.text)).map((m,i)=>({
  id:`${id}-v${selected}-${criterion}-${i}`,text:m.text,criterion,visual:m.status==='good'?'positive':m.status==='bad'?'error':'unclear',
  label:m.label,replacement:m.status==='bad'?m.replacement:'',sentence:m.status==='bad'&&m.replacement?sample.after.split(/(?<=[.!?])\s+/).find(sentence=>sentence.includes(m.text))?.replace(m.text,m.replacement):'',explanation:m.explanation?.replace('câu trả lời lần 2','câu trả lời này'),
  ...(m.pattern?{pattern:m.pattern}:{})
 }));
 return {id,version:selected,text:sample.after,marks,scores:outcome==='correct'?[6.5,6.5,6.5,6.5]:outcome==='repeat'?[5,5.5,5,5.5]:[6,6,6,6],suggested:q.corrected.replace(' My phone is blue.','')};
}
export function roundReplyText(index){return fixture.questions[index]?.text||'';}

// Retakes remain separate; summarize only the submitted first attempts.
export function summarizeRoundScores(samples){
 if((samples.length<3||samples.length>5)||samples.some(sample=>!sample||sample.scores.length!==4||sample.scores.some(score=>!Number.isFinite(score))))return null;
 const scores=Array.from({length:4},(_,i)=>samples.reduce((sum,sample)=>sum+sample.scores[i],0)/samples.length);
 return {scores,band:scores.reduce((sum,score)=>sum+score,0)/scores.length};
}

// Compare only criterion scores; detailed feedback belongs solely to the selected reply.
export function roundCriterionProgress(state,id,version){
 const current=roundResultSample(state,id,version);
 if(!current||!current.version)return null;
 const previousVersion=current.version-1,previous=roundResultSample(state,id,previousVersion);
 return {version:current.version,previousVersion,criteria:['fc','lr','gra','p'].map((id,i)=>({id,score:current.scores[i],previous:previous.scores[i],delta:Math.round((current.scores[i]-previous.scores[i])*100)/100}))};
}
