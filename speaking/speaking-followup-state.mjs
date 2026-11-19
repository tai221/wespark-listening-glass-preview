import {roundReplyText} from './speaking-round-results-state.mjs';
export const FOLLOWUP_KEY='wespark-speaking-hometown-followups-v1';
const content=[
 {id:'transport-buses',topic:'transport',match:/transport|bus|traffic|commut/i,question:'You mentioned public transport. How would better buses improve daily life in your hometown?',reply:'More frequent buses would make my journey to the city centre easier. I could leave my motorbike at home and spend less money on fuel.'},
 {id:'transport-journey',after:'transport-buses',topic:'transport',match:/transport|bus|journey|motorbike|city centre/i,question:'For the journey to the city centre you described, what would make you choose a bus instead of your motorbike?',reply:'I would choose a bus if it arrived on time and stopped near my home. A comfortable seat and a clear timetable would also make the journey more convenient.'},
 {id:'food-dish',topic:'food',match:/food|cuisine|noodle|dish|restaurant/i,question:'You mentioned the local food. Which dish would you recommend to a visitor, and why?',reply:'I would recommend a bowl of local noodles. The fresh herbs and rich broth make it special, and sharing it with friends is a lovely way to enjoy the city.'},
 {id:'food-memory',after:'food-dish',topic:'food',match:/food|noodle|dish|herb|broth/i,question:'You described sharing local noodles with friends. Why is eating together important to you?',reply:'Eating together gives us time to catch up after a busy week. We often visit a small noodle shop, share stories and feel more connected to our hometown.'},
 {id:'lifestyle-routine',topic:'lifestyle',match:/lifestyle|relax|laid.back|peaceful|quiet/i,question:'You mentioned a relaxed lifestyle. What do you usually do to unwind in your hometown?',reply:'I like taking a quiet walk in the park after work. The relaxed atmosphere helps me clear my mind, and I sometimes meet a friend there for a chat.'},
 {id:'lifestyle-park',after:'lifestyle-routine',topic:'lifestyle',match:/relax|quiet|park|walk|unwind/i,question:'You described walking in the park after work. How does that routine affect the rest of your evening?',reply:'After a walk in the park, I feel calmer and have more energy to cook dinner. It helps me put work aside and enjoy time with my family.'},
 {id:'beach-visit',topic:'beach',match:/beach|coast|sea|ocean/i,question:'You mentioned living near the coast. What do you enjoy doing at the beach?',reply:'I enjoy walking along the beach early in the morning. The sea breeze is refreshing, and watching the sunrise gives me a peaceful start to the day.'},
 {id:'beach-morning',after:'beach-visit',topic:'beach',match:/beach|sea|sunrise|breeze/i,question:'You described an early morning at the beach. How is it different from visiting later in the day?',reply:'The beach is quieter in the morning, so I can hear the waves clearly. Later in the day it is more lively, with families swimming and people playing games.'},
 {id:'general-place',topic:'general',question:'What is one place in your hometown you would show a visitor, and why?',reply:'I would show a visitor the local market. It is a good place to see everyday life, try a few snacks and talk to friendly people from the neighbourhood.'},
 {id:'general-visit',topic:'general',question:'Thinking about the visit you described, what would make it memorable for your guest?',reply:'I would introduce my guest to people I know at the market. A warm conversation and a shared meal would help them feel welcome and remember the visit.'}
];
export function contextualFollowup(replies,used=[]){
 const source=replies.at(-1)||{reply:'',sourceQuestion:2};
 const item=content.find(c=>!used.includes(c.id)&&(!c.after||used.includes(c.after))&&c.match?.test(source.reply))||content.find(c=>c.topic==='general'&&!used.includes(c.id));
 return item?{id:item.id,topic:item.topic,question:item.question,reply:item.reply,sourceQuestion:source.sourceQuestion}:null;
}
function create(core){
 const valid=core?.finished===true&&core.submissions?.length===3&&core.submissions.every((s,i)=>s.question===i&&Number.isFinite(s.duration)&&s.duration>=1);
 return {schema:1,coreSignature:valid?JSON.stringify(core.submissions):null,pending:null,submissions:[],finished:false};
}
export function startFollowup(state){
 if(!state.coreSignature||state.finished||state.pending||state.submissions.length>=2)return state;
 const replies=state.submissions.length?state.submissions:[0,1,2].map(i=>({reply:roundReplyText(i),sourceQuestion:i}));
 const pending=contextualFollowup(replies,state.submissions.map(s=>s.id));
 return pending?{...state,pending}:state;
}
export function submitFollowup(state,entry){
 if(!state.pending||entry?.id!==state.pending.id||!Number.isFinite(entry.duration)||entry.duration<1)return state;
 const submissions=[...state.submissions,{...state.pending,duration:Math.round(entry.duration)}];
 return {...state,pending:null,submissions,finished:submissions.length===2};
}
export function finishFollowups(state){return !state.coreSignature||state.pending?state:{...state,finished:true};}
export function restoreFollowups(raw,core){
 const initial=create(core);if(!initial.coreSignature)return initial;
 try{
  const data=JSON.parse(raw);if(data?.schema!==1||data.coreSignature!==initial.coreSignature||!Array.isArray(data.submissions)||data.submissions.length>2||typeof data.finished!=='boolean')return initial;
  let state=initial;
  for(const saved of data.submissions){
   state=startFollowup(state);if(!state.pending||JSON.stringify({...state.pending,duration:saved.duration})!==JSON.stringify(saved))return initial;
   const next=submitFollowup(state,saved);if(next===state)return initial;state=next;
  }
  if(data.pending){state=startFollowup(state);if(!state.pending||JSON.stringify(data.pending)!==JSON.stringify(state.pending)||data.finished)return initial;}
  if(data.finished&&!state.finished)state=finishFollowups(state);
  if(state.finished!==data.finished)return initial;
  return state;
 }catch{return initial;}
}
