export const SPEAKING_ROUND_KEY='wespark-speaking-hometown-round-v1';
export function createSpeakingRound(){return {schema:1,current:0,finished:false,submissions:[]};}
export function submitSpeakingRound(state,entry){
 if(state.finished||entry?.question!==state.current||!Number.isFinite(entry.duration)||entry.duration<1)return state;
 const submissions=[...state.submissions,{question:entry.question,duration:Math.round(entry.duration)}];
 return {schema:1,current:Math.min(2,submissions.length),finished:submissions.length===3,submissions};
}
export function restoreSpeakingRound(raw){
 try{const data=JSON.parse(raw);if(data?.schema!==1||!Array.isArray(data.submissions)||data.submissions.length>3)return createSpeakingRound();let state=createSpeakingRound();for(const entry of data.submissions){const next=submitSpeakingRound(state,entry);if(next===state)return createSpeakingRound();state=next;}return state;}catch{return createSpeakingRound();}
}
