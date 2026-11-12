// Authored demo evidence. Durations, sounds and contours illustrate the UI;
// they are not measurements from a learner recording.
export const delivery = {
 q1:{
  fluency:[{id:'q1-pause',pattern:'mid-phrase-pause',text:'a coastal city',replacement:'a coastal city',cue:'Ngừng 1,2s',label:'Ngừng giữa cụm từ',explanation:'Trong tình huống mẫu, bạn ngừng giữa “coastal” và “city”. Giữ cụm này liền mạch và nghỉ nhẹ sau “Da Nang”.',instruction:'Nói liền “a coastal city”; nghỉ nhẹ sau “Da Nang”.',sentence:'I live in Da Nang, a coastal city in central Vietnam.',observed:'a coastal [ngừng 1,2s] city',reference:'Da Nang / a coastal city'}],
  pronunciation:[{text:'coastal',kind:'positive',cue:'/ˈkəʊ.stəl/',label:'Giữ rõ phụ âm cuối',explanation:'Mẫu phát âm giữ được /l/ cuối từ “coastal”, giúp từ rõ và dễ nhận ra.',observed:'/ˈkəʊ.stəl/',reference:'/ˈkəʊ.stəl/'}],
  intonation:[{id:'q1-flat',pattern:'flat-ending',text:'closer to the beach',replacement:'closer to the beach',cue:'Giọng đều',contour:'flat',label:'Chưa hạ giọng khi kết ý',explanation:'Trong mẫu này, giọng giữ đều đến hết câu. Nhấn “beach” và hạ giọng nhẹ để người nghe nhận ra ý đã kết thúc.',instruction:'Nhấn “beach”, hạ giọng nhẹ khi kết thúc câu.',sentence:'Last year, I moved closer to the beach.',observed:'Giữ giọng đều',reference:'Nhấn BEACH · hạ giọng cuối câu'}]
 },
 q2:{
  fluency:[{id:'q2-pause',pattern:'mid-phrase-pause',text:'laid-back lifestyle',replacement:'laid-back lifestyle',cue:'Ngừng 1,5s',label:'Ngừng giữa cụm từ',explanation:'Khoảng ngừng giữa “laid-back” và “lifestyle” tách đôi cụm mang ý chính. Cùng kiểu ngừng giữa cụm đã xuất hiện ở câu 1.',instruction:'Nói liền cụm “laid-back lifestyle”; nghỉ ở cuối ý.',sentence:'What I like most is the laid-back lifestyle.',observed:'laid-back [ngừng 1,5s] lifestyle',reference:'laid-back lifestyle /'}],
  pronunciation:[{id:'q2-final-t',pattern:'final-t',text:'most',replacement:'most',cue:'Thiếu /t/',label:'Bỏ âm /t/ cuối từ',explanation:'Âm mẫu bỏ /t/ ở cuối “most”. Giữ đủ cụm /st/ cuối từ, không thêm một âm tiết mới.',instruction:'Giữ /t/ trong cụm /st/ cuối “most”.',sentence:'What I like most is the laid-back lifestyle.',observed:'/məʊs/',reference:'/məʊst/'}],
  intonation:[{text:'What I like most',kind:'positive',cue:'Nhấn MOST',contour:'rise',label:'Nhấn đúng ý muốn nói',explanation:'Nhấn “most” làm rõ đây là điều bạn thích nhất. Phần sau được đọc nhẹ hơn để ý chính nổi bật.',observed:'What I like MOST',reference:'Nhấn từ mang ý chính'}]
 },
 q3:{
  fluency:[{text:'With more frequent buses,',kind:'positive',cue:'Nghỉ đúng cụm',label:'Ngắt theo cụm ý',explanation:'Khoảng nghỉ ngắn sau “buses” tách điều kiện khỏi kết quả. Câu vẫn liền mạch và người nghe dễ theo dõi.',observed:'With more frequent buses /',reference:'Nghỉ ngắn sau cụm mở đầu'}],
  pronunciation:[{id:'q3-final-t',pattern:'final-t',text:'transport',replacement:'transport',cue:'Thiếu /t/',label:'Bỏ âm /t/ cuối từ',explanation:'Trong mẫu, “transport” thiếu /t/ cuối từ. Cùng kiểu bỏ âm /t/ đã xuất hiện ở “most” trong câu 2.',instruction:'Khép rõ /t/ cuối “transport”, không thêm âm tiết.',sentence:'I would like fewer new buildings near my house and better public transport.',observed:'/ˈtræn.spɔː/',reference:'/ˈtræn.spɔːt/'}],
  intonation:[{text:'easier to get around',kind:'positive',cue:'Nhấn EASIER',contour:'fall',label:'Nhấn lợi ích và hạ giọng',explanation:'“Easier” được nhấn để làm rõ lợi ích. Giọng hạ cuối ý giúp câu giải thích có điểm kết rõ.',observed:'EASIER to get around',reference:'Nhấn ý chính · hạ giọng cuối cụm'}]
 }
};
export const deliveryEvents = Object.entries(delivery).flatMap(([questionId,criteria])=>
 Object.entries(criteria).flatMap(([criterion,marks])=>marks.filter(mark=>mark.pattern).map(mark=>({...mark,questionId,criterion,version:1})))
);
