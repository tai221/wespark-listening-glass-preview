import {CYCLE_STORAGE_KEY,createCycleState,restoreCycleState,cycleSummary,cycleFeedbackState,transitionCycle} from './speaking-cycle-model.mjs';
import {drillTargets,applyDrillOutcome} from './speaking-feedback-model.mjs';
import {speakingPreparationEntry} from './speaking-preparation-visibility.mjs';
export const ENTRY_DRILL_STORAGE_KEY='wespark-speaking-entry-drill-v1';
const empty=()=>({schema:1,sources:[],outcomes:[],handoff:null,deferred:false});
const fingerprint=cycle=>JSON.stringify(cycle.actions);
export function entryDrillTargets(state){
 return state.sources.flatMap(source=>{
  let feedback=cycleFeedbackState(source.cycle);
  for(const action of state.outcomes.filter(a=>a.sourceId===source.id))feedback=applyDrillOutcome(feedback,action.pattern,action.outcome);
  return drillTargets(feedback).map(target=>({...target,id:`${source.id}:${target.pattern}`,sourceId:source.id,sample:source.sample,sourceCycle:source.cycle}));
 });
}
export function restoreEntryDrill(raw){
 try{
  const value=typeof raw==='string'?JSON.parse(raw):raw;if(value?.schema!==1||!Array.isArray(value.sources)||!Array.isArray(value.outcomes))return empty();
  const state=empty(),seen=new Set();
  for(const source of value.sources){if(!source||typeof source!=='object')continue;const cycle=restoreCycleState(source.cycle);if(typeof source.id!=='string'||seen.has(source.id)||!cycleSummary(cycle).complete)continue;seen.add(source.id);state.sources.push({id:source.id,cycle,sample:source.sample===true});}
  for(const action of value.outcomes){if(!action||typeof action!=='object')continue;if(!['correct','wrong'].includes(action.outcome))continue;const target=entryDrillTargets(state).find(t=>t.sourceId===action.sourceId&&t.pattern===action.pattern);if(target&&target.passedRounds<2)state.outcomes.push({sourceId:target.sourceId,pattern:target.pattern,outcome:action.outcome});}
  state.handoff=typeof value.handoff==='string'&&state.sources.some(s=>!s.sample&&fingerprint(s.cycle)===value.handoff)?value.handoff:null;state.deferred=value.deferred===true;return state;
 }catch{return empty();}
}
export function loadEntryDrill(storage){try{return restoreEntryDrill(storage.getItem(ENTRY_DRILL_STORAGE_KEY));}catch{return empty();}}
export function saveEntryDrill(storage,state){try{storage.setItem(ENTRY_DRILL_STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function recordEntryDrillOutcome(state,id,outcome){
 const target=entryDrillTargets(state).find(t=>t.id===id);
 if(!target||target.passedRounds===2||!['correct','wrong'].includes(outcome))return state;
 return {...state,outcomes:[...state.outcomes,{sourceId:target.sourceId,pattern:target.pattern,outcome}]};
}
function readCycle(storage){try{return restoreCycleState(storage.getItem(CYCLE_STORAGE_KEY));}catch{return createCycleState();}}
export function retainCompletedSource(storage,cycle=readCycle(storage)){
 let state=loadEntryDrill(storage);if(!cycleSummary(cycle).complete)return {state,saved:true};
 const key=fingerprint(cycle);if(state.handoff!==key){state={...state,sources:[...state.sources,{id:`lesson-${state.sources.length+1}`,cycle:structuredClone(cycle),sample:false}],handoff:key};}
 return {state,saved:saveEntryDrill(storage,state)};
}
// The evidence write precedes any fresh-cycle write. Failed writes keep the entry in place.
export function continueSpeaking(storage,deferred=false){
 const retained=retainCompletedSource(storage);if(!retained.saved)return false;
 const state={...retained.state,deferred,handoff:null};
 try{const cycle=readCycle(storage);if(cycleSummary(cycle).complete)storage.setItem(CYCLE_STORAGE_KEY,JSON.stringify(createCycleState()));return saveEntryDrill(storage,state);}catch{return false;}
}
export function enterSpeaking(storage){
 const cycle=readCycle(storage);
 if(cycle.actions.length&&!cycleSummary(cycle).complete)return {href:speakingPreparationEntry(),saved:true};
 const retained=retainCompletedSource(storage,cycle);if(!retained.saved)return {href:null,saved:false};
 const state=retained.state;
 if(!cycle.actions.length&&state.handoff){state.handoff=null;if(!saveEntryDrill(storage,state))return {href:null,saved:false};}
 if(entryDrillTargets(state).some(t=>t.passedRounds<2))return {href:'key-speaking-drill-repeat.html',saved:true};
 return {href:speakingPreparationEntry(),saved:continueSpeaking(storage)};
}
// Explicit preview source: authored chronological cycle, never the global fixture as history.
export function seedEntryDrillPreview(storage){
 let cycle=createCycleState();while(cycle.stage!=='completion')cycle=transitionCycle(cycle,cycle.stage==='v1'?{type:'submit-v1',variant:'normal'}:cycle.stage==='feedback'?{type:'continue-feedback'}:cycle.stage==='v2'?{type:'submit-v2',behavior:'repair',outcome:'repeat'}:{type:'continue-result'});
 const state=loadEntryDrill(storage);if(!state.sources.some(s=>s.sample))state.sources.push({id:'preview-pending',cycle,sample:true});
 const previewIds=new Set(state.sources.filter(s=>s.sample).map(s=>s.id));state.outcomes=state.outcomes.filter(action=>!previewIds.has(action.sourceId));
 return saveEntryDrill(storage,state);
}
