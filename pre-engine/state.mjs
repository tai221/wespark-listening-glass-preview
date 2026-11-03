import {learningItems} from '../pre-learning.mjs';
import {createQuiz,restoreQuiz,quizPoints} from '../pre-quiz.mjs';
import {createBlast,restoreBlast} from '../pre-blast-state.mjs';
export const POINTS=10; // Game completion reward; Quiz uses its correct-answer total.
export function create(){return {prediction:null,assessments:{},learned:false,finished:false,awarded:false,awardedPoints:0,balance:120,challengeMode:null,quiz:createQuiz(),blast:createBlast()};}
export function predict(s,v){return ['daily-habits','technology','community'].includes(v)?{...s,prediction:v}:s;}
export const practiceIds=s=>learningItems.filter(x=>s.assessments?.[x.id]==='practice').map(x=>x.id);
export const allAssessed=s=>learningItems.every(x=>['practice','remembered'].includes(s.assessments?.[x.id]));
export const activeIds=s=>practiceIds(s).length?practiceIds(s):learningItems.map(x=>x.id);
export const canListen=s=>s.finished===true||allAssessed(s)&&practiceIds(s).length===0;
export function learn(s){return {...s,learned:!!s.prediction&&allAssessed(s)};}
export function assess(s,id,value){
 if(!learningItems.some(x=>x.id===id)||![null,'practice','remembered'].includes(value)||s.assessments[id]===value)return s;
 const assessments={...s.assessments};if(value===null)delete assessments[id];else assessments[id]=value;
 const next=learn({...s,assessments}),ids=activeIds(next);
 return {...next,finished:false,legacyPreparation:false,challengeMode:null,quiz:createQuiz(ids),blast:createBlast(ids)};
}
export function selectMode(s,mode){return ['quiz','game'].includes(mode)?{...s,challengeMode:mode}:s;}
export function finish(s,mode='game'){return (mode==='quiz'?s.quiz.phase:s.blast.phase)==='complete'?{...s,finished:true}:s;}
export function rewardPoints(s){
 if(s.awarded)return s.awardedPoints??POINTS;
 return s.challengeMode==='quiz'||(s.blast.phase!=='complete'&&s.quiz.phase==='complete')?quizPoints(s.quiz):POINTS;
}
export function reward(s){if(!s.finished||s.awarded)return s;const points=rewardPoints(s);return {...s,awarded:true,awardedPoints:points,balance:s.balance+points};}
export function replay(s){return s.challengeMode==='quiz'?{...s,finished:s.blast.phase==='complete',quiz:createQuiz(activeIds(s))}:{...s,finished:s.quiz.phase==='complete',blast:createBlast(activeIds(s))};}
export function restore(saved){
 let state=create(),step=0;
 if(!saved||![1,2,3,4].includes(saved.version)||!saved.state)return {state,step};
 const old=saved.state;
 state.challengeMode=['quiz','game'].includes(old.challengeMode)?old.challengeMode:saved.version<3&&(old.finished===true||old.blast?.phase&&old.blast.phase!=='ready')?'game':null;
 state.assessments=Object.fromEntries(learningItems.filter(x=>['practice','remembered'].includes(old.assessments?.[x.id])).map(x=>[x.id,old.assessments[x.id]]));
 const ids=saved.version===4?activeIds(state):undefined;
 state.quiz=restoreQuiz(old.quiz,ids);
 state.prediction=['daily-habits','technology','community'].includes(old.prediction)?old.prediction:null;
 state.learned=!!state.prediction&&allAssessed(state);
 state.awarded=old.awarded===true;
 state.awardedPoints=state.awarded?(Number.isInteger(old.awardedPoints)&&old.awardedPoints>=0&&old.awardedPoints<=Math.max(POINTS,learningItems.length)?old.awardedPoints:POINTS):0;
 state.balance=Number.isFinite(old.balance)&&old.balance>=0?old.balance:state.awarded?120+state.awardedPoints:120;
 if(saved.version===1&&old.finished===true){state.finished=true;state.learned=true;state.prediction||='daily-habits';state.blast={...createBlast(),phase:'complete',legacyComplete:true};}
 else {state.blast=old.blast?.legacyComplete===true&&old.finished===true?{...createBlast(),phase:'complete',legacyComplete:true}:restoreBlast(old.blast,ids);state.finished=state.blast.phase==='complete'||state.quiz.phase==='complete';}
 if(saved.version===4){state.learned=!!state.prediction&&allAssessed(state);if(!state.learned&&!old.legacyPreparation)state.finished=false;}
 if(state.finished){state.legacyPreparation=old.legacyPreparation===true||saved.version<4;state.learned=true;state.prediction||='daily-habits';state=reward(state);}
 step=Number.isInteger(saved.step)?Math.max(0,Math.min(saved.step,state.learned?2:state.prediction?1:0)):0;
 return {state,step};
}
