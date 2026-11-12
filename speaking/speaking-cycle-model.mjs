import {buildV2Sample,validV2Pair} from './speaking-cycle-result-data.mjs';
import {fixture,classifyEvents} from './speaking-feedback-model.mjs';
export const CYCLE_STORAGE_KEY='wespark-speaking-question-cycle-v1';
const ids=fixture.questions.map(q=>q.id);
const variants=['normal','clean','errors-only'];
const clone=value=>structuredClone(value);
const canonicalJSON=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const cleanText=q=>q.corrected.replace(' My phone is blue.','');
export function createCycleState(){return {schema:1,current:0,stage:'v1',events:[],actions:[],questions:ids.map(id=>({id,v1:null,feedbackSeen:false,requiredV2:[],v2:null,completed:false}))};}
const errorsOnlySamples={
 q1:{sentences:['My hometown have a peaceful atmosphere.','My neighbourhood have quiet streets.'],ending:'I live in Da Nang, a coastal city in central Vietnam.'},
 q2:{sentences:['The city have a relaxed lifestyle.','My neighbourhood have friendly people.'],ending:'What I like most is the local cuisine. I enjoy chatting with my neighbours in the evening.'},
 q3:{sentences:['My hometown have crowded streets.','My neighbourhood have too many cars.'],ending:'I would like better public transport and fewer cars, so it would be easier to get around.'}
};
function sampleEvents(questionId,variant){
 if(variant==='clean')return [];
 if(variant==='errors-only'){
  const source=fixture.events.find(e=>e.questionId==='q1'&&e.pattern==='subject-verb');
  return errorsOnlySamples[questionId].sentences.map((sentence,i)=>{const text=sentence.slice(0,sentence.indexOf(' have')+5),replacement=text.replace(' have',' has');return {...source,id:`${questionId}-errors-sva-${i?'b':'a'}`,questionId,text,replacement,sentence:sentence.replace(' have',' has'),explanation:'Chủ ngữ số ít ở hiện tại đơn dùng “has”.'};});
 }
 return fixture.events.filter(e=>e.questionId===questionId).map(clone);
}
export function cycleFeedbackState(state){const v2={};for(const q of state.questions)if(q.v2)Object.assign(v2,q.v2.targets);return {groups:classifyEvents(state.events),v2,drill:{}};}
export function cycleSample(state,id){
 const original=fixture.questions.find(q=>q.id===id),entry=state.questions.find(q=>q.id===id),variant=entry?.v1?.variant||'normal';
 if(variant==='normal')return {...original,variant};
 if(variant==='clean')return {...original,text:cleanText(original),corrected:cleanText(original),variant};
 const authored=errorsOnlySamples[id],text=[...authored.sentences,authored.ending].join(' ');
 return {...original,text,corrected:[...authored.sentences.map(sentence=>sentence.replace(' have',' has')),authored.ending].join(' '),variant};
}
function advance(next){const q=next.questions[next.current];q.completed=true;if(next.current===ids.length-1)next.stage='completion';else {next.current++;next.stage='v1';}}
export function transitionCycle(state,action,legacy=false){
 const q=state.questions[state.current];if(!q||!action)return state;
 const next=clone(state),current=next.questions[next.current];let recorded;
 if(action.type==='submit-v1'&&state.stage==='v1'&&variants.includes(action.variant||'normal')){
  const variant=action.variant||'normal',events=sampleEvents(q.id,variant);next.events.push(...events);current.v1={variant,eventIds:events.map(e=>e.id)};
  current.requiredV2=classifyEvents(next.events).filter(g=>g.kind==='mistake'&&g.sources.some(e=>e.questionId===q.id&&e.version===1)).map(g=>g.pattern);
  next.stage='feedback';recorded={type:action.type,variant};
 }else if(action.type==='continue-feedback'&&state.stage==='feedback'){
  current.feedbackSeen=true;if(current.requiredV2.length)next.stage='v2';else advance(next);recorded={type:action.type};
 }else if(action.type==='submit-v2'&&state.stage==='v2'&&validV2Pair(action.behavior||'repair',action.outcome,action.sampleVariant)){
  const originals=state.events.filter(e=>e.questionId===q.id&&e.version===1),patterns=[...new Set([...current.requiredV2,...originals.map(e=>e.pattern)])];
  const behavior=action.behavior||'repair',sampleVariant=action.sampleVariant||(behavior==='repair'?'repair':action.outcome==='repeat'?'weaker':'changed');
  const legacyTargets=Object.fromEntries(patterns.map((p,i)=>[p,action.outcome==='mixed'?(i===0?'correct':i===1?'repeat':'missing'):action.outcome]));
  const sample=buildV2Sample(cycleSample(state,q.id),originals,behavior,action.outcome,legacy||sampleVariant==='legacy-repair'?legacyTargets:null);
  const targets=behavior==='repair'?Object.fromEntries(sample.targets.map(e=>[e.pattern,e.status==='good'?'correct':e.status==='bad'?'repeat':'missing'])):Object.fromEntries(patterns.map(p=>[p,'missing']));
  current.v2=legacy?{outcome:action.outcome,targets:legacyTargets}:{outcome:action.outcome,behavior,sampleVariant,sample,targets};
  if(behavior==='repair')for(const source of originals)if(targets[source.pattern]==='repeat'&&!next.events.some(e=>e.version===2&&e.sourceEventId===source.id))next.events.push({...source,id:`${source.id}-v2`,sourceEventId:source.id,version:2});
  if(behavior==='new')for(const mark of sample.targets.filter(e=>e.status==='bad')){
   const pattern=mark.pattern;
   next.events.push({...mark,id:`${q.id}-${sampleVariant}-${mark.criterion}-v2`,questionId:q.id,version:2,pattern});
  }
  next.stage='result';recorded=legacy?{type:action.type,outcome:action.outcome}:{type:action.type,outcome:action.outcome,behavior,sampleVariant};
 }else if(action.type==='continue-result'&&state.stage==='result'&&q.v2){advance(next);recorded={type:action.type};}
 else return state;
 next.actions.push(recorded);return next;
}
// Replay the submitted action journal instead of trusting stored gates, counts or evidence.
export function restoreCycleState(raw){
 try{
  const value=typeof raw==='string'?JSON.parse(raw):raw;if(value?.schema!==1||!Array.isArray(value.actions)||value.actions.length>12)return createCycleState();
  const legacy=value.questions?.some(q=>q.v2&&!q.v2.behavior);
  let rebuilt=createCycleState();for(const action of value.actions){const next=transitionCycle(rebuilt,action,legacy);if(next===rebuilt)return createCycleState();rebuilt=next;}
  for(const key of ['current','stage','events','questions','actions'])if(canonicalJSON(value[key])!==canonicalJSON(rebuilt[key]))return createCycleState();
  if(legacy){for(const q of rebuilt.questions)if(q.v2){const originals=rebuilt.events.filter(e=>e.questionId===q.id&&e.version===1);Object.assign(q.v2,{behavior:'repair',sampleVariant:'legacy-repair',sample:buildV2Sample(cycleSample(rebuilt,q.id),originals,'repair',q.v2.outcome,q.v2.targets)});}rebuilt.actions=rebuilt.actions.map(a=>a.type==='submit-v2'?{...a,behavior:'repair',sampleVariant:'legacy-repair'}:a);}
  return rebuilt;
 }catch{return createCycleState();}
}
export function cycleSummary(state){
 const complete=state.questions.every(q=>q.v1&&q.feedbackSeen&&(!q.requiredV2.length||q.v2)&&q.completed);
 const values=state.questions.flatMap(q=>Object.values(q.v2?.targets||{}));
 return {complete,v1:state.questions.filter(q=>q.v1).length,feedback:state.questions.filter(q=>q.feedbackSeen).length,v2:state.questions.filter(q=>q.v2).length,corrected:values.filter(v=>v==='correct').length,missing:values.filter(v=>v==='missing').length,errors:cycleFeedbackState(state).groups.filter(g=>g.kind==='error').length};
}
