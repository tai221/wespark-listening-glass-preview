export const KEYS=Object.freeze(['A','B','A']);
export const POINTS=10; // Review amount only, not a production reward policy.
export function create(){return {prediction:null,learned:false,index:0,answers:[null,null,null],checked:[false,false,false],finished:false,score:0,awarded:false,balance:120};}
export function predict(s,v){return ['daily-habits','technology','community'].includes(v)?{...s,prediction:v}:s;}
export function learn(s){return s.prediction?{...s,learned:true}:s;}
export function select(s,v){if(!s.learned||s.finished||s.checked[s.index]||!['A','B','C'].includes(v))return s;return {...s,answers:s.answers.map((a,i)=>i===s.index?v:a)};}
export function check(s){if(!s.learned||s.finished||!s.answers[s.index])return s;return {...s,checked:s.checked.map((v,i)=>i===s.index?true:v)};}
export function advance(s){if(s.finished||!s.checked[s.index])return s;if(s.index<KEYS.length-1)return {...s,index:s.index+1};return {...s,finished:true,score:s.answers.reduce((n,a,i)=>n+Number(a===KEYS[i]),0)};}
export function reward(s){return s.finished&&!s.awarded?{...s,awarded:true,balance:s.balance+POINTS}:s;}
export function replay(s){return {...s,index:0,answers:[null,null,null],checked:[false,false,false],finished:false,score:0};}
