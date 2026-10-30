import {learningItems} from './pre-learning.mjs';
export const normalize=value=>String(value).trim().toLowerCase().replace(/\s+/g,' ');
export const targets=Object.freeze([
 ...learningItems.filter(x=>x.type==='word').map(x=>({kind:'meaning',answer:x.title,prompt:x.meaning})),
 ...learningItems.filter(x=>['reduce-waste','small-changes'].includes(x.id)).map(x=>({kind:'audio',answer:x.title,prompt:'Nghe rồi gõ cụm từ',audio:x.audio}))
]);
export const sentences=Object.freeze([
 {prompt:'We ___ today.',answer:'can start',meaning:'Chúng ta có thể bắt đầu hôm nay.',explanation:'Sau can dùng động từ nguyên mẫu: can start.'},
 {prompt:'Every evening, our kitchen bin ___ full.',answer:'used to be',meaning:'Trước đây, mỗi tối thùng rác trong bếp thường đầy.',explanation:'used to + động từ nguyên mẫu diễn tả trạng thái trong quá khứ: used to be.'}
]);
export const duration=t=>Math.max(18000,t.answer.length*1400);
export function createBlast(){return {version:1,phase:'ready',paused:false,index:0,elapsed:0,score:0,combo:0,shields:3,misses:[],assisted:[],results:[],sentenceIndex:0,sentenceFeedback:'',sentenceDraft:'',sentenceAssisted:[]};}
const add=(a,v)=>a.includes(v)?a:[...a,v];
function resolve(s,miss=false){
 const helped=s.assisted.includes(s.index),result={index:s.index,kind:miss?'miss':helped?'assisted':'recall'};
 const next={...s,index:s.index+1,elapsed:0,combo:miss||helped?0:s.combo+1,score:s.score+(miss||helped?0:100+Math.min(s.combo,4)*25),shields:s.shields-Number(miss),misses:miss?add(s.misses,s.index):s.misses,results:[...s.results,result]};
 if(next.index===targets.length||next.shields===0){
  for(let i=next.index;i<targets.length;i++){next.misses=add(next.misses,i);next.results.push({index:i,kind:'unreached'});}
  next.phase='review';next.index=Math.min(next.index,targets.length-1);next.paused=false;
 }
 return next;
}
export function blast(s,a){
 if(a.type==='pause')return s.phase==='playing'||s.phase==='sentence'?{...s,paused:true}:s;
 if(a.type==='resume')return {...s,paused:false};
 if(s.paused)return s;
 if(a.type==='start'&&s.phase==='ready')return {...s,phase:'playing'};
 if(a.type==='reviewed'&&s.phase==='review')return {...s,phase:'sentence'};
 if(s.phase==='sentence'){
  if(a.type==='sentenceDraft'&&s.sentenceFeedback!=='correct')return {...s,sentenceDraft:String(a.value).slice(0,2000)};
  if(a.type==='sentenceHint')return {...s,sentenceAssisted:add(s.sentenceAssisted,s.sentenceIndex)};
  if(a.type==='sentence'&&s.sentenceFeedback!=='correct')return {...s,sentenceDraft:String(a.value).slice(0,2000),sentenceFeedback:normalize(a.value)===sentences[s.sentenceIndex].answer?'correct':'retry'};
  if(a.type==='nextSentence'&&s.sentenceFeedback==='correct')return s.sentenceIndex===sentences.length-1?{...s,phase:'complete',sentenceFeedback:'',sentenceDraft:''}:{...s,sentenceIndex:s.sentenceIndex+1,sentenceFeedback:'',sentenceDraft:''};
 }
 if(s.phase!=='playing')return s;
 if(a.type==='type'&&normalize(a.value)===targets[s.index].answer)return resolve(s);
 if(a.type==='hint')return {...s,elapsed:s.assisted.includes(s.index)?s.elapsed:0,assisted:add(s.assisted,s.index),combo:0};
 if(a.type==='miss')return resolve(s,true);
 if(a.type==='tick'&&!a.static&&targets[s.index].kind!=='audio'&&Number.isFinite(a.value)&&a.value>0){const elapsed=s.elapsed+a.value;return elapsed>=duration(targets[s.index])?resolve(s,true):{...s,elapsed};}
 return s;
}
export function restoreBlast(value){
 const validList=(a,max)=>Array.isArray(a)&&a.every(n=>Number.isInteger(n)&&n>=0&&n<max)&&new Set(a).size===a.length;
 if(!value||value.version!==1||!['ready','playing','review','sentence','complete'].includes(value.phase)||!Number.isInteger(value.index)||value.index<0||value.index>=targets.length||!Number.isInteger(value.shields)||value.shields<0||value.shields>3||!Number.isFinite(value.score)||value.score<0||!Number.isInteger(value.combo)||value.combo<0||!Number.isFinite(value.elapsed)||value.elapsed<0||!validList(value.misses,7)||!validList(value.assisted,7)||!validList(value.sentenceAssisted,2)||!Array.isArray(value.results)||value.results.length>7||!value.results.every((r,i)=>r?.index===i&&['miss','recall','assisted','unreached'].includes(r.kind))||!Number.isInteger(value.sentenceIndex)||value.sentenceIndex<0||value.sentenceIndex>1||!['','retry','correct'].includes(value.sentenceFeedback))return createBlast();
 // Recover contradictory or hand-edited active snapshots safely, retaining outer rewards.
 if(value.phase==='playing'&&(value.results.length!==value.index||value.shields===0)||['review','sentence','complete'].includes(value.phase)&&value.results.length!==7)return createBlast();
 return {...createBlast(),...value,sentenceDraft:typeof value.sentenceDraft==='string'?value.sentenceDraft.slice(0,2000):'',paused:['playing','sentence'].includes(value.phase)};
}
