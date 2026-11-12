// One semantic color mapping for transcript marks and their legends in both versions.
export function annotationTone(visual,status){
 if(visual==='upgrade'||visual==='kit'||visual==='detail')return 'suggestion';
 if(status)return status==='good'?'positive':status==='bad'?'error':'caution';
 if(['positive','good','removed','answer','ending'].includes(visual))return 'positive';
 if(['error','mistake','bad','repeat','offtopic'].includes(visual))return 'error';
 return 'caution';
}
export const legends={
 fluency:[['repeat','Từ lặp lại'],['filler','Từ đệm'],['bad','Ngắt câu sai'],['good','Ngắt câu đúng']],
 coherence:[['answer','Trả lời'],['reason','Lý do'],['detail','Chi tiết / Ví dụ'],['ending','Kết ý'],['offtopic','Lạc đề']],
 vocabulary:[['error','Dùng từ sai'],['positive','Dùng từ tốt'],['upgrade','Gợi ý nâng cấp'],['kit','Đã vận dụng Speaking Kit']],
 grammar:[['error','Lỗi ngữ pháp'],['positive','Cấu trúc dùng tốt'],['upgrade','Gợi ý nâng cấp']],
 pronunciation:[['positive','Phát âm rõ'],['error','Cần luyện thêm'],['unclear','Chưa rõ âm']],
 intonation:[['positive','Nhấn phù hợp'],['missing','Thiếu nhấn'],['error','Nhấn chưa phù hợp']],
};
export const development={
 q1:{structure:'Nêu quê hương và vị trí trước, rồi chọn một đặc điểm để giải thích. Nếu kể lần chuyển nhà, nối rõ việc đó liên quan đến quê hương thế nào.',idea:'Bạn thích điều gì khi sống gần biển? Kể một trải nghiệm của chính bạn để làm rõ.'},
 q2:{structure:'Chọn điều bạn thích nhất, giải thích lý do rồi dùng một ví dụ cá nhân. Bỏ chi tiết không liên quan đến quê hương.',idea:'Nhịp sống thư thái ảnh hưởng đến một buổi tối của bạn như thế nào? Bạn thường làm gì cùng hàng xóm hoặc bạn bè?'},
 q3:{structure:'Chọn một thay đổi chính và nối với lợi ích cụ thể. Nếu giữ cả hai mong muốn, bổ sung lý do cho mong muốn còn lại.',idea:'Bạn muốn xe buýt thường xuyên hơn ở tuyến nào? Điều đó giúp bạn đi học hoặc đi làm ra sao?'},
};
export function fluencyText(question){
 if(question.variant&&question.variant!=='normal')return question.text;
 const anchor={q1:'I live',q2:'What I like',q3:'I would like'}[question.id];
 const repeated={q1:'I, I live',q2:'What, What I like',q3:'I, I would like'}[question.id];
 return question.text.replace(anchor,`um, ${repeated}`);
}
export function presentationMarks(fixture,state,q,criterion,baseEvidence){
 const kind=mark=>({...mark,kind:mark.pattern?state.groups.find(g=>g.pattern===mark.pattern)?.kind:mark.kind});
 const delivery=fixture.delivery[q][criterion]||[];
 const extras=fixture.examples[q][criterion]||[];
 let marks=[];
 if(criterion==='fluency'){
  const wrong=[...delivery,...extras].find(m=>m.pattern);
  const good={text:{q1:'Last year,',q2:'For example,',q3:'With more frequent buses,'}[q],label:'Ngắt câu đúng',explanation:'Trong mẫu, khoảng nghỉ nằm sau cụm mở đầu, không tách đôi cụm mang nghĩa.'};
  const repeated=q==='q2'?'What, What':'I, I';
  marks=[{...wrong,visual:'bad',cue:'Ngắt câu sai'}, {...good,visual:'good',cue:'Ngắt câu đúng'},
   {text:'um',visual:'filler',label:'Từ đệm',explanation:'“Um” là từ đệm trong bản nói mẫu. Một từ đệm riêng lẻ không mặc định là lỗi; cần xem mức độ và ảnh hưởng đến mạch nói.'},
   {text:repeated,visual:'repeat',label:'Từ lặp lại',explanation:'Bản nói mẫu lặp từ trước khi tiếp tục ý. Dấu này chỉ vị trí lặp; không tự tạo thêm mistake/error nếu chưa xác định đó là lỗi cần sửa.'}];
 }else if(criterion==='grammar'){
  marks=[...fixture.events.filter(m=>m.questionId===q&&!m.criterion),...extras.filter(m=>m.kind==='positive')];
  const upgrades={q1:{text:'a coastal city',replacement:'which is a coastal city',explanation:'Có thể dùng mệnh đề quan hệ “which is a coastal city” thay cho cụm đồng vị. Cách nói gốc đã đúng; không bắt buộc đổi.'},q2:{text:'small cafés',replacement:'cafés that feel cosy',explanation:'Có thể dùng mệnh đề quan hệ để miêu tả quán nếu “cosy” đúng với ý bạn. Cụm gốc đúng và vẫn dùng được.'},q3:{text:'it would be easier',replacement:'getting around would be easier',explanation:'Có thể đưa hoạt động “getting around” lên làm chủ ngữ để nhấn việc đi lại. Cấu trúc gốc đúng; không bắt buộc thay.'}};
  marks.push({...upgrades[q],kind:'upgrade',label:'Gợi ý nâng cấp'});
 }else if(criterion==='vocabulary'){
  marks=[baseEvidence.vocabulary,...extras.map(m=>m.kind==='positive'?{...m,text:{q1:'by the sea',q2:'stop for a chat',q3:'more frequent buses'}[q],explanation:{q1:'“By the sea” dùng đúng để diễn tả vị trí bên bờ biển.',q2:'“Stop for a chat” diễn tả tự nhiên việc dừng lại trò chuyện.',q3:'“More frequent buses” diễn tả cụ thể mong muốn tăng tần suất xe buýt.'}[q]}:m.kind==='warning'?{...m,kind:'upgrade',cue:undefined,label:'Gợi ý nâng cấp'}:m),baseEvidence.kit];
 }else if(criterion==='pronunciation'){
  marks=[...delivery,...extras].map(m=>({...m,visual:m.pattern?'error':m.kind==='positive'?'positive':'unclear',stressRange:m.kind==='positive'?({coastal:[0,5],neighbours:[0,5],around:[1,6]}[m.text]):undefined,cue:m.pattern?'Cần luyện thêm':m.kind==='positive'?'Phát âm rõ':'Chưa rõ âm'}));
 }else if(criterion==='intonation'){
  const emphasis={q1:[['My hometown','positive','Nhấn HOMETOWN'],['peaceful','missing','Thiếu nhấn PEACEFUL'],['in central Vietnam','error','Nhấn quá mạnh']],q2:[['What I like most','positive','Nhấn MOST'],['small cafés','missing','Thiếu nhấn CAFÉS'],['The city','error','Nhấn THE quá mạnh']],q3:[['easier to get around','positive','Nhấn EASIER'],['better','missing','Thiếu nhấn BETTER'],['near my house','error','Nhấn chi tiết phụ']]};
  marks=emphasis[q].map(([text,visual,cue])=>({text,visual,cue,label:visual==='positive'?'Nhấn phù hợp':visual==='missing'?'Thiếu nhấn':'Nhấn chưa phù hợp',explanation:visual==='positive'?'Từ mang ý chính được nhấn để người nghe nhận ra điều bạn muốn nói.':visual==='missing'?'Trong mẫu, từ mang thông tin chính chưa nổi bật. Nhấn rõ hơn nếu đây là ý bạn muốn nhấn mạnh.':'Trong mẫu, chi tiết phụ được nhấn mạnh hơn ý chính. Đọc nhẹ phần này để ý chính nổi bật.'}));
  const pitch=[...delivery,...extras].find(m=>m.contour&&m.pattern)||delivery.find(m=>m.contour);
  // q3 has a positive emphasis span overlapping its original positive pitch: use ending pitch instead.
  if(pitch)marks.push({...pitch,visual:pitch.pattern?'error':'positive',cue:pitch.pattern?'Lên xuống giọng: cần điều chỉnh':'Lên xuống giọng: phù hợp',layer:'pitch'});
 }
 const variant=fixture.sampleVariants?.[q];
 if(variant&&variant!=='normal'&&!(variant==='errors-only'&&criterion==='grammar'))marks=marks.filter(m=>m&&!m.pattern&&['positive','good','kit','upgrade'].includes(m.visual||m.kind));
 if(variant==='clean'&&criterion==='intonation'){marks=marks.filter(m=>m.layer!=='pitch');marks.push({text:{q1:'closer to the beach',q2:'in the evening',q3:'more comfortable to live in'}[q],visual:'positive',kind:'positive',layer:'pitch',contour:'fall',cue:'Lên xuống giọng: phù hợp',label:'Hạ giọng rõ khi kết ý',explanation:'Trong bản nói mẫu sạch, giọng hạ nhẹ ở cuối cụm để người nghe nhận ra ý đã kết thúc.'});}
 return marks.filter(m=>m&&m.text).map((m,index)=>({...kind(m),visual:m.visual||(m.pattern?'error':m.kind),id:m.id||`${q}-${criterion}-${index}`}));
}
export function coherenceSegments(question){
 const sentences=question.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[];
 const roles={q1:['detail','answer','detail','detail','offtopic'],q2:['detail','answer','detail','detail','offtopic'],q3:['answer','reason','ending','detail','offtopic']};
 return sentences.map((text,index)=>({text:text.trim(),role:question.variant&&question.variant!=='normal'?(index===0?'answer':index===1?'reason':'detail'):roles[question.id][index]||'detail'}));
}
