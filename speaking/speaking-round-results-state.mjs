import {fixture,createFeedbackState} from './speaking-feedback-model.mjs';
import {presentationMarks,fluencyText} from './speaking-feedback-presentation.mjs';
import {buildV2Sample} from './speaking-cycle-result-data.mjs';
export const ROUND_RESULTS_KEY='wespark-speaking-hometown-round-results-v1';
const evidence={q1:{vocabulary:{text:'peaceful atmosphere',kind:'upgrade',label:'Gợi ý nâng cấp',replacement:'tranquil atmosphere',explanation:'Cụm gốc đúng. Có thể thử “tranquil atmosphere” nếu phù hợp với ý của bạn.'},kit:{text:'a coastal city',kind:'kit',label:'Vận dụng Speaking Kit',explanation:'Cụm từ được dùng phù hợp để giới thiệu quê hương.'}},q2:{vocabulary:{text:'a lot of',kind:'upgrade',label:'Gợi ý nâng cấp',replacement:'plenty of',explanation:'“Plenty of” là một lựa chọn khác; cách nói gốc vẫn đúng.'},kit:{text:'the laid-back lifestyle',kind:'kit',label:'Vận dụng Speaking Kit',explanation:'Cụm từ phù hợp khi mô tả nhịp sống.'}},q3:{vocabulary:{text:'more comfortable to live in',kind:'upgrade',label:'Gợi ý nâng cấp',replacement:'more liveable',explanation:'Có thể diễn đạt gọn hơn bằng “more liveable”.'},kit:{text:'get around',kind:'kit',label:'Vận dụng Speaking Kit',explanation:'Cụm từ diễn tả việc đi lại trong thành phố.'}}};
export function restoreRoundResults(raw){try{const data=JSON.parse(raw);return {schema:1,attempts:Object.fromEntries(fixture.questions.map(q=>[q.id,Array.isArray(data?.attempts?.[q.id])?data.attempts[q.id].filter(v=>['mixed','correct','repeat'].includes(v)).slice(0,20):[]]))};}catch{return {schema:1,attempts:{q1:[],q2:[],q3:[]}};}}
export function addRoundRetake(state,id,outcome='mixed'){if(!state.attempts[id]||!['mixed','correct','repeat'].includes(outcome)||state.attempts[id].length>=20)return state;return {...state,attempts:{...state.attempts,[id]:[...state.attempts[id],outcome]}};}
export function roundResultSample(state,id,version=0,criterion='grammar'){
 const q=fixture.questions.find(q=>q.id===id);if(!q)return null;
 const attempts=state.attempts[id]||[],selected=Math.max(0,Math.min(version,attempts.length));
 if(!selected){const marks=criterion==='coherence'?fixture.examples[id].coherence.map((m,i)=>({...m,id:m.id||`${id}-coherence-${i}`,visual:m.pattern?'error':m.kind==='positive'?'positive':'upgrade'})):presentationMarks(fixture,createFeedbackState(),id,criterion,evidence[id]);return {id,version:0,text:criterion==='fluency'?fluencyText(q):q.text,marks,scores:[5.5,6,5.5,6],suggested:q.corrected.replace(' My phone is blue.','')};}
 const outcome=attempts[selected-1],sample=buildV2Sample(q,fixture.events.filter(e=>e.questionId===id),'repair',outcome);
 const marks=sample.targets.filter(m=>(m.criterion||'grammar')===criterion&&m.v2Token).map((m,i)=>({...m,id:`${id}-v${selected}-${criterion}-${i}`,text:m.v2Token,visual:m.status==='good'?'positive':m.status==='bad'?'error':'unclear',label:m.status==='good'?'Đã điều chỉnh phù hợp':m.label,explanation:m.status==='good'?'Trong lời đáp minh họa lần này, bạn đã áp dụng cách diễn đạt được góp ý.':m.explanation}));
 if(criterion==='coherence'&&!marks.some(mark=>sample.after.includes(mark.text))){
  const anchors={q1:'I live in Da Nang, a coastal city in central Vietnam.',q2:'What I like most is the laid-back lifestyle.',q3:'With more frequent buses, it would be easier to get around.'};
  marks.push({id:`${id}-v${selected}-coherence-focus`,text:anchors[id],visual:'positive',status:'good',label:'Ý bám sát câu hỏi',explanation:{q1:'Bạn nêu rõ tên thành phố và vị trí để người nghe hình dung quê hương. Bản nói lại đã bỏ câu về điện thoại không liên quan.',q2:'Bạn chỉ ra điều yêu thích trước khi phát triển ví dụ, giúp người nghe theo được trọng tâm. Bản nói lại đã bỏ chi tiết về điện thoại.',q3:'Bạn nối thay đổi mong muốn với lợi ích cụ thể của xe buýt. Bản nói lại đã bỏ chi tiết không liên quan đến quê hương.'}[id]});
 }
 return {id,version:selected,text:sample.after,marks,scores:outcome==='correct'?[6.5,6.5,6.5,6.5]:outcome==='repeat'?[5.5,6,5.5,6]:[6,6,6,6],suggested:q.corrected.replace(' My phone is blue.','')};
}
export function roundReplyText(index){return fixture.questions[index]?.text||'';}

// Only the three first submissions belong to the initial practice round.
export function summarizeRoundScores(samples){
 if(samples.length!==fixture.questions.length||samples.some(sample=>!sample||sample.scores.length!==4||sample.scores.some(score=>!Number.isFinite(score))))return null;
 const scores=Array.from({length:4},(_,i)=>samples.reduce((sum,sample)=>sum+sample.scores[i],0)/samples.length);
 return {scores,band:scores.reduce((sum,score)=>sum+score,0)/scores.length};
}
