import {DICTATION_UNITS} from './dictation-lesson.mjs';
import {restoreDictation,totals} from './dictation-state.mjs';
export function resultSummary(saved){
 const state=restoreDictation(saved.dictation),count=totals(state),run=saved.dictationRun;
 const credited=new Set(Array.isArray(saved.dictationRewards)?saved.dictationRewards:[]),earned=new Set(Array.isArray(run?.earnedIds)?run.earnedIds:[]);
 const points=DICTATION_UNITS.filter(u=>earned.has(u.id)&&credited.has(u.id)&&state.done[u.id]&&state.done[u.id].kind!=='assisted').length;
 return {...count,complete:count.done===DICTATION_UNITS.length,points,runId:run?.id||null,shouldCelebrate:points>0&&run?.celebrated!==true};
}
