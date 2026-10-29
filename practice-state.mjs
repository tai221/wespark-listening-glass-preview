export const UNITS=Object.freeze([
 {text:'Every evening, our kitchen bin used to be full.',word:'full',phrase:'used to be full',translation:'Mỗi tối, thùng rác trong bếp của chúng tôi từng đầy ắp.'},
 {text:'I wanted to throw away less, but I did not know where to begin.',word:'wanted',phrase:'throw away less',translation:'Tôi muốn vứt bỏ ít hơn, nhưng tôi không biết bắt đầu từ đâu.'},
 {text:'Now, I carry a reusable bag whenever I go shopping.',word:'reusable',phrase:'a reusable bag',translation:'Giờ đây, tôi mang theo một chiếc túi dùng nhiều lần mỗi khi đi mua sắm.'}
]);
export function normalize(s){return s.toLowerCase().trim().replace(/[,.]/g,'').replace(/\bdon['’]?t\b/g,'dont').replace(/\s+/g,' ');}
export function target(unit,mode){return mode==='sentence'?unit.text:mode==='phrase'?unit.phrase:unit.word;}
export function answerMatches(value,answer){return normalize(value)===normalize(answer);}
export function dictationResult({input,expected,attempts,helped,compared}){return Boolean(input.trim())&&attempts>0&&(answerMatches(input,expected)||Boolean(helped&&compared));}
export function shadowComplete(scope,done){return scope.length>0&&scope.every(i=>done.includes(i));}
export function acceptVoiceTurn(count,outcome){return outcome==='valid'?Math.min(3,count+1):count;}
export function conversationComplete(count,viewed){return count===3&&Boolean(viewed);}
