import {createQuiz,restoreQuiz} from '../pre-quiz.mjs';
import {createBlast,restoreBlast} from '../pre-blast-state.mjs';
export const POINTS=10; // Illustrative completion reward, independent of arcade score.
export function create(){return {prediction:null,learned:false,finished:false,awarded:false,balance:120,challengeMode:null,quiz:createQuiz(),blast:createBlast()};}
export function predict(s,v){return ['daily-habits','technology','community'].includes(v)?{...s,prediction:v}:s;}
export function learn(s){return s.prediction?{...s,learned:true}:s;}
export function selectMode(s,mode){return ['quiz','game'].includes(mode)?{...s,challengeMode:mode}:s;}
export function finish(s,mode='game'){return (mode==='quiz'?s.quiz.phase:s.blast.phase)==='complete'?{...s,finished:true}:s;}
export function reward(s){return s.finished&&!s.awarded?{...s,awarded:true,balance:s.balance+POINTS}:s;}
export function replay(s){return s.challengeMode==='quiz'?{...s,finished:s.blast.phase==='complete',quiz:createQuiz()}:{...s,finished:s.quiz.phase==='complete',blast:createBlast()};}
export function restore(saved){
 let state=create(),step=0;
 if(!saved||![1,2,3].includes(saved.version)||!saved.state)return {state,step};
 const old=saved.state;
 state.challengeMode=['quiz','game'].includes(old.challengeMode)?old.challengeMode:saved.version<3&&(old.finished===true||old.blast?.phase&&old.blast.phase!=='ready')?'game':null;
 state.quiz=restoreQuiz(old.quiz);
 state.prediction=['daily-habits','technology','community'].includes(old.prediction)?old.prediction:null;
 state.learned=!!state.prediction&&old.learned===true;
 state.awarded=old.awarded===true;
 state.balance=Number.isFinite(old.balance)&&old.balance>=0?old.balance:state.awarded?130:120;
 if(saved.version===1&&old.finished===true){state.finished=true;state.learned=true;state.prediction||='daily-habits';state.blast={...createBlast(),phase:'complete',legacyComplete:true};}
 else {state.blast=old.blast?.legacyComplete===true&&old.finished===true?{...createBlast(),phase:'complete',legacyComplete:true}:restoreBlast(old.blast);state.finished=state.blast.phase==='complete'||state.quiz.phase==='complete';}
 if(state.finished){state.learned=true;state.prediction||='daily-habits';state=reward(state);}
 step=Number.isInteger(saved.step)?Math.max(0,Math.min(saved.step,state.learned?2:state.prediction?1:0)):0;
 return {state,step};
}
