import {fixture} from './speaking-feedback-model.mjs';
import {legends} from './speaking-feedback-presentation.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={good:'<path d="m4 10 4 4 8-9"/>',bad:'<path d="m5 5 10 10M15 5 5 15"/>',unclear:'<path d="M4 10h12"/>'};
const svg=type=>`<svg viewBox="0 0 20 20" aria-hidden="true">${icons[type]}</svg>`;
const groups=[{id:'fc',abbr:'FC',name:'Trôi chảy & mạch lạc',criteria:[['fluency','Độ trôi chảy'],['coherence','Nội dung & mạch']]},{id:'lr',abbr:'LR',name:'Từ vựng',criteria:[['vocabulary','Từ vựng']]},{id:'gra',abbr:'GRA',name:'Ngữ pháp',criteria:[['grammar','Ngữ pháp']]},{id:'p',abbr:'P',name:'Phát âm & ngữ điệu',criteria:[['pronunciation','Phát âm'],['intonation','Ngữ điệu']]}];
let qid='q1',group='gra',criterion='grammar',scenario='mixed',behavior='repair';
const criterionOf=e=>e.criterion||'grammar';
const retellings={
 q1:{text:'The city has a calm atmosphere, and the coast is only a short drive away. I moved here two years ago. Most evenings, I take a walk along the river with my sister.',tokens:{'subject-verb':'has','past-tense':'moved','mid-phrase-pause':'a short drive','flat-ending':'with my sister','off-topic':'Most evenings, I take a walk along the river with my sister.','take-a-walk':'take a walk','final-ch':'beach'},context:{'subject-verb':'The city has a calm atmosphere.','past-tense':'I moved here two years ago.'}},
 q2:{text:'The town has a friendly feel. I enjoy the quiet streets most because I can cycle home without much traffic. At weekends, I have a chat with the people at the local market.',tokens:{'subject-verb':'has','mid-phrase-pause':'quiet streets','final-t':'most','off-topic':'At weekends, I have a chat with the people at the local market.','have-a-chat':'have a chat','statement-rise':'at the local market'}},
 q3:{text:'More buses would make a real difference to my daily commute. I would also like fewer buildings around the old park. Better public transport could help everyone get to work on time. I hope the council will make a decision this year.',tokens:{'plural':'buildings','final-t':'transport','mid-phrase-pause':'public transport','off-topic':'More buses would make a real difference to my daily commute.','make-a-decision':'make a decision','statement-rise':'this year'}}
};
const freshSamples={
 q1:{text:"I'm originally from Da Nang, in central Vietnam. My parents still lives there, close to the Han River. I visit them every summer because we can spend time together. We often make photos near the old market.",grammar:['lives','live'],vocab:['make photos','take photos'],fluency:'every summer',pronunciation:'parents',intonation:'spend time together',coherence:'because we can spend time together',notes:[['good','Ý phát triển rõ hơn','Có lý do quay về quê và ví dụ về thời gian bên gia đình.'],['bad','Vẫn cần chú ý chia động từ','“My parents still lives” cần sửa thành “live”.']]},
 q2:{text:'The food is the main reason I love this place. There are a small restaurant near my old school that serves fresh noodles. I go there with my cousins whenever I visit. Sharing a meal helps us keep contact even when we live far apart.',grammar:['There are','There is'],vocab:['keep contact','keep in touch'],fluency:'fresh noodles',pronunciation:'restaurant',intonation:'live far apart',coherence:'Sharing a meal helps us',notes:[['good','Trọng tâm rõ hơn','Chọn một điều yêu thích và giải thích bằng trải nghiệm ăn cùng gia đình.'],['bad','Có lỗi mới cần sửa','“There are a small restaurant” cần dùng “There is”.']]},
 q3:{text:'I would start with more green spaces rather than new roads. Children needs a safe place to play after school. A small park near each neighbourhood would also let older people do exercise together. It could bring different generations closer.',grammar:['Children needs','Children need'],vocab:['do exercise','exercise'],fluency:'green spaces',pronunciation:'generations',intonation:'generations closer',coherence:'A small park near each neighbourhood',notes:[['good','Lý do cụ thể hơn','Nối thay đổi mong muốn với nhu cầu của trẻ em và người cao tuổi.'],['bad','Vẫn cần chú ý chia động từ','“Children needs” cần sửa thành “Children need”.']]}
};
const scenarioCatalog={
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
function freshData(q){
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
 return {q,targets,after,fresh:true,notes};
}
function data(){
 const q=fixture.questions.find(q=>q.id===qid);if(behavior==='new')return freshData(q);const events=fixture.events.filter(e=>e.questionId===qid),retelling=retellings[qid];
 const targets=events.map((e,i)=>({...e,status:scenario==='correct'?'good':scenario==='repeat'?'bad':scenario==='missing'?(['fluency','pronunciation','intonation'].includes(e.criterion)?'unclear':'good'):i===1?'bad':i===events.length-1?'unclear':'good',v2Token:retelling.tokens[e.pattern]}));
 let after=behavior==='repair'?q.corrected.replace(' My phone is blue.',''):retelling.text;
 if(behavior==='repair')for(const e of targets)e.v2Token=e.replacement||e.text;
 for(const e of targets){
  if(e.status==='bad'&&!e.instruction&&e.replacement&&e.replacement!==e.text){after=after.replace(e.v2Token,e.text);e.v2Token=e.text;}
  if(e.pattern==='off-topic'&&e.status==='bad'){after+=' My phone is blue.';e.v2Token='My phone is blue.';}
 }
 if(behavior!=='repair'&&qid==='q1'&&targets.some(e=>e.pattern==='final-ch'&&e.status!=='unclear'))after+=' We sometimes visit the beach, too.';

 return {q,targets,after};
}
function annotate(text,events,version){
 let spans=[];
 for(const e of events){if(version===2&&e.status==='unclear'&&behavior!=='new')continue;const token=version===1?e.text:e.v2Token; if(!token)continue;const start=text.indexOf(token);if(start<0)continue;if(spans.some(s=>start<s.end&&start+token.length>s.start))continue;spans.push({start,end:start+token.length,e,token});}
 spans.sort((a,b)=>a.start-b.start);let last=0,result='';
 for(const {start,end,e,token} of spans){result+=esc(text.slice(last,start));const status=version===1?'bad':e.status;result+=`<button title="${esc(e.label)}" class="mark ${status}" data-event="${e.id}" data-version="${version}" aria-label="${esc(e.label)} · ${version===1?'lần 1':e.status==='good'?(behavior==='new'?'điểm làm tốt':'đã sửa'):e.status==='bad'?'còn lỗi':'cần xem thêm'}">${(version===1||behavior==='new'&&e.status==='bad')&&criterion==='grammar'&&e.replacement&&e.replacement!==e.text?`<del>${esc(token)}</del> <ins>${esc(e.replacement)}</ins>`:esc(token)}${version===2?svg(status):''}</button>`;last=end;}
 return result+esc(text.slice(last));
}
function render(){
 const choices=scenarioCatalog[behavior];if(!choices.some(([value])=>value===scenario))scenario=choices[0][0];
 const {q,targets,after,fresh,notes}=data(),selected=targets.filter(e=>criterionOf(e)===criterion),count=status=>targets.filter(e=>e.status===status).length;
 document.querySelector('#scenario').innerHTML=choices.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');document.querySelector('#scenario').value=scenario;
 document.body.dataset.sampleId=`${behavior}-${scenario}-${qid}`;
 document.querySelectorAll('[data-q]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.q===qid)));
 document.querySelector('#overview').innerHTML=[].filter(s=>count(s)).map(s=>`<span class="status ${s}">${svg(s)}${count(s)} ${s==='good'?'đã sửa':s==='bad'?'còn lỗi':'chưa đủ dữ liệu'}</span>`).join('')+`<span class="question-prompt" lang="en">${esc(q.prompt)}</span>`;
 document.querySelector('.groups').innerHTML=groups.map(g=>`<button class="group" data-group="${g.id}" aria-pressed="${g.id===group}"><strong>${g.abbr}</strong>${g.name}</button>`).join('');
 document.querySelector('.subnav').innerHTML=groups.find(g=>g.id===group).criteria.map(([id,label])=>`<button data-criterion="${id}" aria-pressed="${id===criterion}">${label}</button>`).join('');
 document.body.dataset.behavior=behavior;
 document.querySelector('#behavior').value=behavior;
 document.querySelector('#behavior-note').textContent=behavior==='repair'?'Đúng hướng · sửa bài lần 1':'Chưa đúng yêu cầu · đổi nội dung hoặc giảm rõ';
 document.querySelector('#before').innerHTML=behavior==='repair'?annotate(q.text,selected,1):'';
 document.querySelector('#comparison-summary').hidden=false;
 const overall=fresh?(scenario==='repeat'?'Lần 2 phát triển ý ít hơn, còn lặp từ và có chi tiết không liên quan. Hãy quay lại câu trả lời lần 1 và tập trung sửa các chỗ đã được góp ý.':'Bạn đã đổi hướng trả lời thay vì sửa bài lần 1. Lượt này được nhận xét riêng; hãy dùng góp ý trên V1 làm mục tiêu khi luyện lại.'):(scenario==='correct'?'Bạn đã bám câu trả lời lần 1 và sửa được các lỗi mục tiêu.':scenario==='repeat'?'Bạn đã bám bài lần 1, nhưng các lỗi mục tiêu vẫn còn. Phần đánh dấu bên dưới cho thấy chỗ cần luyện thêm.':scenario==='missing'?'Bạn đã bám bài lần 1 và sửa được một số chỗ; vài mục chưa đủ bằng chứng để kết luận.':'Bạn đã bám bài lần 1 và sửa được một phần. Vẫn còn chỗ cần luyện như đánh dấu trên lần 2.');
 document.querySelector('#comparison-summary').innerHTML=`<p class="overall-comment"><span class="${fresh?'bad':'good'}">${svg(fresh?'bad':'good')}</span><span>${esc(overall)}</span></p>`;
 document.querySelector('#missing').innerHTML=targets.filter(e=>e.status==='unclear').map(e=>`<button data-event="${e.id}">${svg('unclear')}${esc(e.text)} · ${esc(e.label)}</button>`).join('');
 document.querySelector('.unassessed').hidden=fresh||!targets.some(e=>e.status==='unclear');
 document.querySelector('#after').innerHTML=annotate(after,selected,2);
 document.querySelector('#detail').hidden=true;
 document.querySelector('#note').textContent=!fresh&&count('bad')?'Lỗi còn lặp sẽ được luyện ở phiên Drill sau.':'';
 document.querySelector('.legend').innerHTML=(legends[criterion]||[]).map(([kind,label])=>`<span class="criterion-key key-${kind}"><i></i>${esc(label)}</span>`).join('')+`<span class="hint">${selected.length?'Bấm phần đánh dấu để xem chi tiết':'Không có lỗi mục tiêu ở tiêu chí này.'}</span>`;
 document.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{group=b.dataset.group;criterion=groups.find(g=>g.id===group).criteria[0][0];render();});
 document.querySelectorAll('[data-criterion]').forEach(b=>b.onclick=()=>{criterion=b.dataset.criterion;render();});
 document.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>detail(b.dataset.event));
}
function detail(id){const {targets,fresh}=data(),e=targets.find(e=>e.id===id),box=document.querySelector('#detail');document.querySelectorAll('[data-event]').forEach(b=>b.classList.toggle('selected',b.dataset.event===id));
 const from=e.observed||e.text,to=e.status==='unclear'?'Chưa đủ dữ liệu để kết luận':(e.reference||e.replacement||'Bỏ ý ngoài chủ đề');
 const oldSentence=e.sentence.includes(e.replacement)&&e.replacement?e.sentence.replace(e.replacement,e.text):e.observed||e.text;
 const oldHTML=esc(oldSentence);
 const current=e.status==='unclear'?(data().after.includes(e.v2Token)?'Có cụm từ này nhưng chưa đủ dữ liệu âm thanh để kết luận.':'Mục tiêu này chưa xuất hiện trong lượt nói mới.'):afterContext(e);
 {box.innerHTML=`<div class="detail-heading"><h2 class="${e.status}">${svg(e.status)} ${esc(e.label)}</h2><button aria-label="Đóng chi tiết"><svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div><p>${e.status==='bad'&&e.replacement?`<del>${esc(e.text)}</del> <ins>${esc(e.replacement)}</ins>`:esc(e.status==='good'?(fresh?e.explanation:'Lần 2 đã thể hiện đúng mục tiêu này.'):e.status==='unclear'?current:e.instruction||e.explanation)}</p>`;box.hidden=false;box.querySelector('button').onclick=closeDetail;return;}
 box.innerHTML=`<div class="detail-heading"><h2 class="${e.status}">${svg(e.status)} ${esc(e.label)}</h2><button aria-label="Đóng chi tiết"><svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div><div class="evidence-pair"><div><span class="compare-label">Lần 1 · lỗi mục tiêu${criterionOf(e)==='grammar'?' & gợi ý sửa':''}</span><p lang="en">${oldHTML}</p></div><div><span class="compare-label">${e.status==='unclear'?'Lần 2 · chưa thể đánh giá':'Lần 2 · '+(e.status==='good'?'đã sửa':'còn lặp lỗi')}</span><p>${e.status==='unclear'?esc(current):esc(current).replace(esc(e.v2Token),`<span class="evidence-${e.status}">${esc(e.v2Token)}</span>`)}</p></div></div>${e.status==='bad'?`<p class="correction-note">Gợi ý sửa: <strong>${esc(e.instruction||e.replacement)}</strong></p>`:''}`;box.hidden=false;box.querySelector('button').onclick=closeDetail;box.scrollIntoView({block:'nearest'});}
function afterContext(e){const {after}=data();if(e.criterion==='fluency'&&e.status==='bad')return `${e.v2Token} · vẫn ngừng giữa cụm`;if(e.criterion==='intonation')return `${e.v2Token} · ${e.status==='good'?'đã kết ý rõ':'giọng chưa kết ý'}`;const sentence=after.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.find(t=>t.includes(e.v2Token));return sentence?.trim()||e.v2Token;}
function closeDetail(){document.querySelector('#detail').hidden=true;const mark=document.querySelector('.mark.selected');document.querySelectorAll('.mark').forEach(b=>b.classList.remove('selected'));mark?.focus();}
function selectQuestion(id){qid=id;render();}
document.querySelector('#behavior').onchange=e=>{if(!scenarioCatalog[e.target.value])return;behavior=e.target.value;if(!scenarioCatalog[behavior].some(([value])=>value===scenario))scenario=scenarioCatalog[behavior][0][0];render();};
document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>selectQuestion(b.dataset.q));document.querySelector('#scenario').onchange=e=>{if(!scenarioCatalog[behavior].some(([value])=>value===e.target.value))return;scenario=e.target.value;document.querySelector('.demo').open=false;render();};
document.querySelector('#next').onclick=()=>selectQuestion('q'+(Number(qid[1])%3+1));document.querySelector('#back').onclick=()=>selectQuestion('q'+((Number(qid[1])+1)%3+1));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('#detail').hidden)closeDetail();});render();

document.addEventListener("click",e=>{if(!e.target.closest(".demo"))document.querySelector(".demo").open=false;});
