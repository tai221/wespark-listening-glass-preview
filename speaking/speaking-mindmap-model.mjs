export const techniques=[
 {name:'Nguyên nhân – Kết quả',icon:'cause',structure:'S + V, so + S + V.',words:['coastal city','peaceful atmosphere','feel at home'],examples:['My hometown is a coastal city, so I can go to the beach often.','The people are friendly, so I always feel welcome.','The roads are busy, so I would like better public transport.']},
 {name:'So sánh – Đối chiếu',icon:'compare',structure:'Compared with…, S + V.',words:['quieter','more relaxed','compared with'],examples:['Compared with bigger cities, my hometown is quieter.','Compared with city life, the lifestyle here is more relaxed.','Compared with driving, taking the bus could be more convenient.']},
 {name:'Ví dụ minh họa',icon:'example',structure:'For example, S + V.',words:['for example','local cuisine','neighbourhood'],examples:['My hometown is close to nature. For example, there is a beach near my house.','I love the local cuisine. For example, I often have fresh seafood.','I would like more green spaces. For example, a park would be lovely.']},
 {name:'Kế hoạch tương lai',icon:'future',structure:'I would like to + V.',words:['would like to','in the future','improve'],examples:['I would like to continue living here in the future.','I would like to explore more local cafés.','I would like to see better public transport in the future.']}
];
export const DRAFT_KEY='wespark-speaking-hometown-mindmap-v1';
export const answerSuggestions=[
 ['A coastal city','A small town','A village in the countryside'],
 ['The local cuisine','The friendly people','The relaxed lifestyle'],
 ['Yes — better public transport','Yes — more green spaces','No — I like it as it is']
];
const outlines=[
 [['Where / What','Why / Result'],['My favourite thing','Why it matters'],['The change','Its benefit']],
 [['Compared with…','My hometown…'],['Other places…','What I prefer…'],['Now…','With this change…']],
 [['My main idea','For example…'],['What I enjoy','For example…'],['What could change','For example…']],
 [['In the future…','Why / How'],['I would like to…','Why / How'],['I would like to improve…','The result']]
];
const phrasePools=[
 [
  [['coastal city','in central Vietnam','near the beach'],['peaceful atmosphere','feel at home','spend time outdoors']],
  [['local cuisine','friendly people','relaxed lifestyle'],['feel welcome','enjoy fresh seafood','less stressful']],
  [['better public transport','more green spaces','busy roads'],['less traffic','a cleaner city','more convenient journeys']]
 ],
 [
  [['compared with bigger cities','a smaller town','city life'],['quieter','more relaxed','closer to nature']],
  [['compared with other cities','a faster lifestyle','expensive restaurants'],['friendlier people','fresh local food','a relaxed lifestyle']],
  [['heavy traffic','long bus journeys','few green spaces'],['more convenient transport','less traffic','more parks']]
 ],
 [
  [['close to nature','a coastal city','a lively neighbourhood'],['for example','a beach near my house','walk by the sea']],
  [['local cuisine','friendly neighbours','local traditions'],['for example','fresh seafood','a neighbourhood festival']],
  [['better public transport','more green spaces','safer roads'],['for example','a park near my house','a shorter bus journey']]
 ],
 [
  [['continue living here','in the future','move back to my hometown'],['feel at home','close to my family','a peaceful neighbourhood']],
  [['explore local cafés','try more local dishes','meet my neighbours'],['support local businesses','enjoy the local cuisine','make new friends']],
  [['improve public transport','create more green spaces','in the future'],['less traffic','a cleaner city','more convenient journeys']]
 ]
];
export function outlineFor(question,method){return outlines[method][question].map((label,index)=>({label,words:phrasePools[method][question][index]}));}
export function hydrateDrafts(saved){
 return [0,1,2].map((question)=>{
  const raw=Array.isArray(saved)&&saved[question]&&typeof saved[question]==='object'?saved[question]:{};
  const suggestion=Number.isInteger(raw.suggestion)&&raw.suggestion>=0&&raw.suggestion<3?raw.suggestion:null;
  const answer=(suggestion!==null?answerSuggestions[question][suggestion]:typeof raw.answer==='string'?raw.answer:'').slice(0,300);
  const technique=Number.isInteger(raw.technique)&&raw.technique>=0&&raw.technique<4?raw.technique:0;
  const methodDrafts={};
  for(let method=0;method<4;method++){
   const branches=raw.methodDrafts?.[method];
   if(!Array.isArray(branches))continue;
   methodDrafts[method]=outlineFor(question,method).map((_,branch)=>Array.isArray(branches[branch])?[...new Set(branches[branch].filter(word=>typeof word==='string'&&word.trim()).map(word=>word.slice(0,120)))].slice(0,8):[]);
  }
  return {answer,suggestion:null,technique,methodDrafts,prepared:raw.prepared===true||!!answer||Object.keys(methodDrafts).length>0};
 });
}
