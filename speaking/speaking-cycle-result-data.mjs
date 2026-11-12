// Authored submitted sample evidence, extracted from the approved V2 UX draft. No audio or AI assessment.
const freshSamples={
 q1:{text:"I'm originally from Da Nang, in central Vietnam. My parents still lives there, close to the Han River. I visit them every summer because we can spend time together. We often make photos near the old market.",grammar:['lives','live'],vocab:['make photos','take photos'],fluency:'every summer',pronunciation:'parents',intonation:'spend time together',coherence:'because we can spend time together',notes:[['good','Ý phát triển rõ hơn','Có lý do quay về quê và ví dụ về thời gian bên gia đình.'],['bad','Vẫn cần chú ý chia động từ','“My parents still lives” cần sửa thành “live”.']]},
 q2:{text:'The food is the main reason I love this place. There are a small restaurant near my old school that serves fresh noodles. I go there with my cousins whenever I visit. Sharing a meal helps us keep contact even when we live far apart.',grammar:['There are','There is'],vocab:['keep contact','keep in touch'],fluency:'fresh noodles',pronunciation:'restaurant',intonation:'live far apart',coherence:'Sharing a meal helps us',notes:[['good','Trọng tâm rõ hơn','Chọn một điều yêu thích và giải thích bằng trải nghiệm ăn cùng gia đình.'],['bad','Có lỗi mới cần sửa','“There are a small restaurant” cần dùng “There is”.']]},
 q3:{text:'I would start with more green spaces rather than new roads. Children needs a safe place to play after school. A small park near each neighbourhood would also let older people make exercise together. It could bring different generations closer.',grammar:['Children needs','Children need'],vocab:['make exercise','exercise'],fluency:'green spaces',pronunciation:'generations',intonation:'generations closer',coherence:'A small park near each neighbourhood',notes:[['good','Lý do cụ thể hơn','Nối thay đổi mong muốn với nhu cầu của trẻ em và người cao tuổi.'],['bad','Vẫn cần chú ý chia động từ','“Children needs” cần sửa thành “Children need”.']]}
};
export const scenarioCatalog={
 repair:[['mixed','Sửa được một phần · vẫn còn lỗi'],['correct','Đã sửa các lỗi mục tiêu'],['repeat','Vẫn lặp các lỗi mục tiêu'],['missing','Sửa được · vài mục chưa đủ bằng chứng']],

 new:[['mixed','Đổi nội dung · chưa bám bài V1'],['repeat','Chất lượng giảm rõ']]
};
const weakerSamples={
 q1:{text:"I'm from Da Nang. My parents still lives there. I, I go back sometimes. The city is nice. My phone is blue. That's all.",grammar:['lives','live'],vocab:'nice',fluency:'I, I',pronunciation:'parents',intonation:"That's all",coherence:'My phone is blue.'},
 q2:{text:"I like the food. There are a small restaurant. I, I go there sometimes. It is good. My phone is blue. That's all.",grammar:['There are','There is'],vocab:'good',fluency:'I, I',pronunciation:'restaurant',intonation:"That's all",coherence:'My phone is blue.'},
 q3:{text:"More parks, maybe. Children needs them. I, I think it is nice. My phone is blue. That's all.",grammar:['Children needs','Children need'],vocab:'nice',fluency:'I, I',pronunciation:'Children',intonation:"That's all",coherence:'My phone is blue.'}
};
const shortSamples={
 q1:{text:"I'm from Da Nang. It's in central Vietnam.",grammar:"I'm from",vocab:'central Vietnam',fluency:'Da Nang',pronunciation:'Vietnam',intonation:'central Vietnam'},
 q2:{text:'I like the local food. It tastes good.',grammar:'It tastes',vocab:'local food',fluency:'local food',pronunciation:'food',intonation:'tastes good'},
 q3:{text:'I would like more parks. Children need space to play.',grammar:'Children need',vocab:'space to play',fluency:'more parks',pronunciation:'parks',intonation:'space to play'}
};
function freshData(q,qid,scenario){
 const clean=scenario==='correct',short=scenario==='missing',weaker=scenario==='repeat';
 const sample=short?shortSamples[qid]:weaker?weakerSamples[qid]:freshSamples[qid];let after=sample.text;
 if(clean)after=after.replace(...sample.grammar).replace(...sample.vocab);
 const mark=(c,text,status,label,replacement='',explanation='')=>({id:`${qid}-fresh-${c}`,criterion:c,text,v2Token:text,status,label,replacement,sentence:after,explanation:explanation||(status==='good'?'Điểm làm tốt trong câu trả lời lần 2.':'Chỗ cần điều chỉnh trong câu trả lời lần 2.')});
 let targets,notes;
 if(short){
  targets=[mark('grammar',sample.grammar,'good','Cấu trúc dùng đúng'),mark('vocabulary',sample.vocab,'good','Dùng từ phù hợp'),mark('fluency',sample.fluency,'good','Cụm ý liền mạch'),mark('pronunciation',sample.pronunciation,'good','Âm rõ'),mark('intonation',sample.intonation,'good','Kết ý rõ'),mark('coherence',after,'bad','Chưa phát triển ý','','Câu trả lời chỉ có ý chính. Thêm một lý do hoặc ví dụ cá nhân để làm rõ.')];
  notes=[['bad','Phát triển ý ít hơn','Lần 2 chỉ nêu ý chính; ít chi tiết hơn lần 1.'],['unclear','Chưa thấy đủ phạm vi diễn đạt','Câu ngắn chưa cho thấy cách triển khai ý dài hơn; không coi đó là lỗi ngữ pháp hay phát âm.']];
 }else if(weaker){
  targets=[mark('grammar',sample.grammar[0],'bad','Chia động từ',sample.grammar[1]),mark('vocabulary',sample.vocab,'unclear','Từ còn chung','','Từ này không sai, nhưng chưa diễn tả cụ thể điều bạn muốn nói.'),mark('fluency',sample.fluency,'bad','Từ lặp lại','','Lặp lại phần mở đầu làm nhịp nói bị ngắt trong bản ghi mẫu.'),mark('pronunciation',sample.pronunciation,'unclear','Âm cuối chưa rõ','','Âm cuối trong bản ghi mẫu chưa đủ rõ để kết luận; chưa tính là lỗi phát âm.'),mark('intonation',sample.intonation,'bad','Kết ý chưa rõ','','Giọng đều ở cuối câu trong mẫu. Hạ giọng nhẹ để làm rõ điểm kết.'),mark('coherence',sample.coherence,'bad','Ý không liên quan','','Chi tiết về điện thoại không phục vụ câu hỏi về quê hương.')];
  notes=[['bad','Ý phát triển ít hơn','Lần 2 rút bớt chi tiết, chủ yếu nêu ý ngắn và nhận xét chung.'],['bad','Vẫn có chỗ làm đứt mạch','Lặp “I, I” và giữ câu về điện thoại không liên quan.']];
 }else{
  targets=[mark('grammar',sample.grammar[clean?1:0],clean?'good':'bad','Chia động từ',sample.grammar[1]),mark('vocabulary',sample.vocab[clean?1:0],clean?'good':'bad','Cách dùng từ',sample.vocab[1]),mark('fluency',sample.fluency,'good','Nói liền cụm ý'),mark('pronunciation',sample.pronunciation,'good','Âm rõ'),mark('intonation',sample.intonation,'good','Kết ý rõ'),mark('coherence',sample.coherence,'good','Ý được mở rộng')];
  notes=clean?[sample.notes[0],['good','Diễn đạt chính xác hơn','Cấu trúc và kết hợp từ được dùng đúng trong mẫu lần 2.']]:sample.notes;
 }
 const patterns={grammar:'subject-verb',vocabulary:{q1:'make-photos',q2:'keep-contact',q3:'make-exercise'}[qid],fluency:'repeated-start',intonation:'flat-ending',coherence:'off-topic'};
 for(const target of targets)if(target.status==='bad')target.pattern=patterns[target.criterion];
 return {q,targets,after,fresh:true,notes};
}

export function validV2Pair(behavior,outcome,sampleVariant){return Boolean(scenarioCatalog[behavior]?.some(([value])=>value===outcome))&&(!sampleVariant||behavior==='repair'&&sampleVariant==='legacy-repair'||sampleVariant===(behavior==='repair'?'repair':outcome==='repeat'?'weaker':'changed'));}
export function buildV2Sample(q,events,behavior='repair',outcome='correct',overrides){
 if(behavior==='new')return freshData(q,q.id,outcome);
 const statuses={correct:'good',repeat:'bad',missing:'unclear'};
 const targets=events.map((e,i)=>({...e,status:statuses[overrides?.[e.pattern]]||(outcome==='mixed'?(i===1?'bad':i===events.length-1?'unclear':'good'):outcome==='missing'?(['fluency','pronunciation','intonation'].includes(e.criterion)?'unclear':'good'):statuses[outcome]),v2Token:e.replacement||e.text}));
 let after=q.corrected.replace(' My phone is blue.','');
 for(const e of targets){
  if(e.status==='bad'&&!e.instruction&&e.replacement&&e.replacement!==e.text){after=after.replace(e.v2Token,e.text);e.v2Token=e.text;}
  if(e.pattern==='off-topic'){if(e.status==='bad'){after+=' My phone is blue.';e.v2Token=e.text;}else e.v2Token='';}
 }
 // These are authored V2 delivery observations, separate from reference corrections.
 const correctedDelivery={'mid-phrase-pause':'Cụm ý được nói liền trong mẫu V2.','flat-ending':'Giọng hạ nhẹ khi kết ý trong mẫu V2.','statement-rise':'Giọng hạ nhẹ khi kết câu kể trong mẫu V2.','final-ch':'/biːtʃ/','final-t':q.id==='q2'?'/məʊst/':'/ˈtræn.spɔːt/'};
 for(const e of targets)if(['fluency','pronunciation','intonation'].includes(e.criterion))e.v2Evidence={observed:e.status==='good'?correctedDelivery[e.pattern]:e.status==='bad'?(e.observed||e.cue):'Chưa đủ bằng chứng âm thanh để kết luận.',contour:e.criterion==='intonation'?(e.status==='good'?'fall':e.status==='bad'?(e.contour||'flat'):null):null};
 // Unclear delivery marks have authored text but insufficient audio evidence.

 return {q,targets,after,fresh:false};
}
export function overallV2Comment(behavior,outcome){return behavior==='new'?(outcome==='repeat'?'Lần 2 phát triển ý ít hơn, còn lặp từ và có chi tiết không liên quan. Hãy quay lại câu trả lời lần 1 và tập trung sửa các chỗ đã được góp ý.':'Bạn đã đổi hướng trả lời thay vì sửa bài lần 1. Lượt này được nhận xét riêng; hãy dùng góp ý trên V1 làm mục tiêu khi luyện lại.'):(outcome==='correct'?'Bạn đã bám câu trả lời lần 1 và sửa được các lỗi mục tiêu.':outcome==='repeat'?'Bạn đã bám bài lần 1, nhưng các lỗi mục tiêu vẫn còn. Phần đánh dấu bên dưới cho thấy chỗ cần luyện thêm.':outcome==='missing'?'Bạn đã bám bài lần 1; một số mục chưa đủ bằng chứng để kết luận.':'Bạn đã bám bài lần 1 và sửa được một phần. Vẫn còn chỗ cần luyện như đánh dấu trên lần 2.');}
