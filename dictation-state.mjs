import {DICTATION_UNITS as UNITS} from './dictation-lesson.mjs';
export const MODES=['word','phrase','sentence'];
export const modeLabels={word:'Điền từ',phrase:'Điền cụm',sentence:'Chép cả câu'};
export const kindLabels={first:'Đúng lần đầu',corrected:'Tự sửa đúng',assisted:'Có hỗ trợ'};
export function normalizeDictation(value){return String(value??'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[.,!?;:"“”()\[\]—–-]/g,' ').replace(/'/g,'').trim().replace(/\s+/g,' ');}
export const matches=(a,b)=>normalizeDictation(a)===normalizeDictation(b);
export function parts(unit,mode){
 if(mode==='sentence')return [];
 const words=mode==='word'?unit.words:[unit.phrase];
 const spans=words.map((word,i)=>({start:unit.text.indexOf(word),end:unit.text.indexOf(word)+word.length,expected:word,gap:i})).sort((a,b)=>a.start-b.start);
 const result=[];let end=0;for(const span of spans){if(span.start>end)result.push({text:unit.text.slice(end,span.start)});result.push(span);end=span.end;}if(end<unit.text.length)result.push({text:unit.text.slice(end)});return result;
}
export function expected(unit,mode){return mode==='sentence'?[unit.text]:mode==='word'?unit.words:[unit.phrase];}
const fresh=mode=>({input:'',values:[],attempts:0,helped:false,shown:[],revealed:0,letterHints:[],full:false,checked:false,correct:false,compared:false,hadError:false});
export function draft(state){const id=UNITS[state.index].id;state.currentId=id;state.records[id]||={};return state.records[id][state.mode]||=(fresh(state.mode));}
export function setInput(state,values){const d=draft(state);d.values=values.map(String);d.input=d.values.join(' ');d.checked=false;d.correct=false;d.compared=false;return d;}
export function hasInput(d){return !!d.input.trim();}
function record(state,kind){const id=UNITS[state.index].id;if(!state.done[id])state.done[id]={kind,mode:state.mode,attempts:draft(state).attempts};}
export function check(state){const d=draft(state);if(!hasInput(d)||d.checked)return d;d.attempts++;d.checked=true;d.correct=expected(UNITS[state.index],state.mode).every((word,i)=>matches(d.values[i]||'',word));if(d.correct)record(state,d.helped?'assisted':d.attempts===1?'first':'corrected');return d;}
export function compare(state){const d=draft(state);if(d.full&&d.attempts>0&&hasInput(d)){d.compared=true;d.helped=true;record(state,'assisted');return true;}return false;}
export function totals(state){const values=Object.values(state.done);return {done:values.length,first:values.filter(x=>x.kind==='first').length,corrected:values.filter(x=>x.kind==='corrected').length,assisted:values.filter(x=>x.kind==='assisted').length};}
export function createDictation(){return {version:2,total:UNITS.length,index:0,currentId:UNITS[0].id,mode:'word',speed:1,loop:false,listOpen:true,records:{},done:{}};}
const bounded=n=>Number.isInteger(n)&&n>=0&&n<10000?n:0;
export function restoreDictation(saved){
 const state=createDictation();if(!saved||typeof saved!=='object')return state;
 state.mode=MODES.includes(saved.mode)?saved.mode:'word';state.speed=[.5,.75,1,1.25,1.5].includes(saved.speed)?saved.speed:1;state.loop=saved.loop===true;state.listOpen=saved.listOpen!==false;
 state.index=Number.isInteger(saved.index)?Math.max(0,Math.min(UNITS.length-1,saved.index)):0;
 if(saved.version===2){
  for(const unit of UNITS){for(const mode of MODES){const old=saved.records?.[unit.id]?.[mode];if(!old||typeof old!=='object')continue;const d=fresh(mode),answers=expected(unit,mode);d.values=answers.map((_,i)=>typeof old.values?.[i]==='string'?old.values[i].slice(0,3000):'');d.input=d.values.join(' ');d.attempts=bounded(old.attempts);d.hadError=old.hadError===true||d.attempts>1;d.checked=old.checked===true&&d.attempts>0;d.correct=d.checked&&answers.every((word,i)=>matches(d.values[i],word));d.helped=old.helped===true;d.revealed=Math.min(bounded(old.revealed),unit.text.split(/\s+/).length);d.full=old.full===true;d.shown=Array.isArray(old.shown)?old.shown.filter(i=>Number.isInteger(i)&&i>=0&&i<answers.length):[];d.letterHints=Array.isArray(old.letterHints)?old.letterHints.filter(i=>Number.isInteger(i)&&i>=0&&i<answers.length):[];d.helped||=d.full||d.shown.length>0||d.letterHints.length>0;d.compared=old.compared===true&&d.full&&d.attempts>0&&hasInput(d);state.records[unit.id]||={};state.records[unit.id][mode]=d;}
   const old=saved.done?.[unit.id];if(old&&Object.hasOwn(kindLabels,old.kind)&&MODES.includes(old.mode)&&bounded(old.attempts)>0)state.done[unit.id]={kind:old.kind,mode:old.mode,attempts:bounded(old.attempts)};
  }
 }else{
  const map=[0,2,8],kinds={'Đúng lần đầu':'first','Tự sửa đúng':'corrected','Có hỗ trợ':'assisted'};state.index=map[saved.index]??0;
  for(const [i,newIndex] of map.entries()){const unit=UNITS[newIndex],old=saved.drafts?.[i];if(old&&typeof old.input==='string'){const mode=MODES.includes(old.mode)?old.mode:state.mode,d=fresh(mode);d.values=expected(unit,mode).map(()=> '');if(mode==='word'){const legacy=['full','wanted','reusable'][i],slot=unit.words.indexOf(legacy);if(slot>=0)d.values[slot]=old.input;}else d.values[0]=old.input;d.input=d.values.join(' ');d.attempts=bounded(old.attempts);d.helped=old.helped===true;d.revealed=Math.min(bounded(old.revealed),unit.text.split(/\s+/).length);d.full=old.full===true;state.records[unit.id]={[mode]:d};}
   const done=saved.done?.[i];if(done&&kinds[done.kind])state.done[unit.id]={kind:kinds[done.kind],mode:MODES.includes(done.mode)?done.mode:state.mode,attempts:Math.max(1,bounded(done.attempts))};
  }
 }
 state.currentId=UNITS[state.index].id;return state;
}
export function align(input,answer){
 const left=(input.match(/\S+/g)||[]).filter(w=>normalizeDictation(w)),right=(answer.match(/\S+/g)||[]).filter(w=>normalizeDictation(w));
 const dp=Array.from({length:left.length+1},()=>Array(right.length+1).fill(0));for(let i=0;i<=left.length;i++)dp[i][0]=i;for(let j=0;j<=right.length;j++)dp[0][j]=j;
 for(let i=1;i<=left.length;i++)for(let j=1;j<=right.length;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(matches(left[i-1],right[j-1])?0:1));
 let i=left.length,j=right.length;const result=[];
 while(i||j){if(i&&j&&dp[i][j]===dp[i-1][j-1]+(matches(left[i-1],right[j-1])?0:1)){result.unshift({kind:matches(left[i-1],right[j-1])?'right':'wrong',text:left[i-1]});i--;j--;}else if(j&&dp[i][j]===dp[i][j-1]+1){result.unshift({kind:'missing',text:'…'});j--;}else{result.unshift({kind:'extra',text:left[i-1]});i--;}}
 return result;
}

// Prefixes stay green while a learner is still spelling the expected text.
export function liveStatus(input,answer){const value=normalizeDictation(input),target=normalizeDictation(answer);return !value?'empty':target.startsWith(value)?'right':'wrong';}
export function liveTokens(input,answer){const expectedWords=normalizeDictation(answer).split(' ');let index=0;return (input.match(/\s+|\S+/g)||[]).map(text=>{if(/^\s+$/.test(text))return {text,status:'space'};const value=normalizeDictation(text);if(!value)return {text,status:'right'};const status=(expectedWords[index]||'').startsWith(value)?'right':'wrong';index++;return {text,status};});}
export function assessLive(state){const d=draft(state),answers=expected(UNITS[state.index],state.mode);if(!hasInput(d)){d.checked=false;d.correct=false;return d;}d.checked=true;d.correct=answers.every((word,i)=>matches(d.values[i]||'',word));const error=answers.some((word,i)=>state.mode==='word'?liveStatus(d.values[i]||'',word)==='wrong':liveTokens(d.values[i]||'',word).some(x=>x.status==='wrong'));d.hadError||=error;d.attempts=d.hadError?2:1;if(d.correct)record(state,d.helped?'assisted':d.hadError?'corrected':'first');return d;}
