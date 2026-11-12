import {examples,extraAnswers,exampleEvents} from './speaking-feedback-examples.mjs';
import {delivery,deliveryEvents} from './speaking-feedback-delivery.mjs';
// Scripted source evidence for this prototype; no audio or assessment service.
export const fixture = {
 delivery,examples,
 questions: [
  {id:'q1',short:'Nơi bạn sống',prompt:'Where is your hometown?',text:'My hometown have a peaceful atmosphere. I live in Da Nang, a coastal city in central Vietnam. Last year, I move closer to the beach.',corrected:'My hometown has a peaceful atmosphere. I live in Da Nang, a coastal city in central Vietnam. Last year, I moved closer to the beach.'},
  {id:'q2',short:'Điều bạn thích',prompt:'What do you like about your hometown?',text:'The city have a lot of small cafés. What I like most is the laid-back lifestyle. For example, my neighbours often stop for a chat in the evening.',corrected:'The city has a lot of small cafés. What I like most is the laid-back lifestyle. For example, my neighbours often stop for a chat in the evening.'},
  {id:'q3',short:'Điều muốn thay đổi',prompt:'Is there anything you would like to change?',text:'I would like fewer new building near my house and better public transport. With more frequent buses, it would be easier to get around. That would make the city more comfortable to live in.',corrected:'I would like fewer new buildings near my house and better public transport. With more frequent buses, it would be easier to get around. That would make the city more comfortable to live in.'}
 ],
 events: [
  {id:'q1-sva',version:1,questionId:'q1',pattern:'subject-verb',label:'Hòa hợp chủ ngữ – động từ',text:'have',replacement:'has',sentence:'My hometown has a peaceful atmosphere.',explanation:'“My hometown” là chủ ngữ số ít; ở hiện tại đơn dùng “has”.'},
  {id:'q2-sva',version:1,questionId:'q2',pattern:'subject-verb',label:'Hòa hợp chủ ngữ – động từ',text:'have',replacement:'has',sentence:'The city has a lot of small cafés.',explanation:'“The city” là chủ ngữ số ít; dùng “has”. Cùng mẫu lỗi đã xuất hiện ở câu 1.'},
  {id:'q1-tense',version:1,questionId:'q1',pattern:'past-tense',label:'Thì quá khứ đơn',text:'move',replacement:'moved',sentence:'Last year, I moved closer to the beach.',explanation:'“Last year” chỉ thời điểm đã qua; dùng động từ quá khứ “moved”.'},
  {id:'q3-plural',version:1,questionId:'q3',pattern:'plural',label:'Danh từ số nhiều',text:'building',replacement:'buildings',sentence:'I would like fewer new buildings near my house and better public transport.',explanation:'Sau “fewer” dùng danh từ đếm được số nhiều: “buildings”.'}
 ]
};
for(const question of fixture.questions){question.text+=extraAnswers[question.id].text;question.corrected+=extraAnswers[question.id].corrected;}
fixture.events.push(...deliveryEvents,...exampleEvents);
export function classifyEvents(events) {
 const unique=[...new Map(events.map(event=>[event.id,event])).values()];
 const patterns=[...new Set(unique.map(event=>event.pattern))];
 return patterns.map(pattern=>{const sources=unique.filter(event=>event.pattern===pattern);return {pattern,label:sources[0].label,count:sources.length,kind:sources.length>=2?'error':'mistake',sources};});
}
export function createFeedbackState() { return {groups:classifyEvents(fixture.events),v2:{},drill:{}}; }
export function v2Questions(state) {
 return fixture.questions.map(question=>({questionId:question.id,question,targets:state.groups.filter(group=>group.kind==='mistake'&&group.sources.some(source=>source.questionId===question.id))})).filter(question=>question.targets.length);
}
export function applyV2Outcome(state,pattern,outcome) {
 const group=state.groups.find(group=>group.pattern===pattern);
 if(!group||group.kind!=='mistake'||!['correct','repeat','missing'].includes(outcome))return state;
 const next=structuredClone(state);
 if(outcome==='missing'&&next.v2[pattern]==='correct')return state;
 next.v2[pattern]=outcome;
 if(outcome==='repeat') {const target=next.groups.find(group=>group.pattern===pattern),source=target.sources[0];target.sources.push({...source,id:`${source.id}-v2`,version:2});Object.assign(target,classifyEvents(target.sources)[0]);}
 return next;
}
export function drillTargets(state) {
 return state.groups.filter(group=>group.kind==='error').map(group=>({...group,sentence:group.sources[0].sentence,...(state.drill[group.pattern]||{passedRounds:0,streak:0})}));
}
export function applyDrillOutcome(state,pattern,outcome) {
 if(!drillTargets(state).some(target=>target.pattern===pattern)||!['correct','wrong','missing'].includes(outcome)||outcome==='missing')return state;
 const next=structuredClone(state),progress=next.drill[pattern]||{passedRounds:0,streak:0};
 if(progress.passedRounds===2)return state;
 progress.streak=outcome==='correct'?progress.streak+1:0;
 if(progress.streak===3){progress.passedRounds++;progress.streak=0;}
 next.drill[pattern]=progress;return next;
}
