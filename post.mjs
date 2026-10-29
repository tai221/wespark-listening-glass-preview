import {read,write} from './session.mjs';
const $=s=>document.querySelector(s),state=read();
const names={dictation:'Nghe chép',shadowing:'Luyện nói theo',conversation:'Hội thoại'};
document.querySelectorAll('[data-choice]').forEach(a=>a.addEventListener('click',()=>write({post:{...read().post,choice:a.dataset.choice,skipped:false}})));
if(state.post.complete.length){$('#post-status').hidden=false;$('#post-status').textContent='✓ Bạn đã hoàn thành một hoạt động. Những hoạt động còn lại là tùy chọn.';$('#skip').hidden=true;$('#return-library').hidden=false;}
else if(state.post.skipped){$('#post-status').hidden=false;$('#post-status').textContent='Bạn đã bỏ qua phần Vận dụng. Có thể chọn một hoạt động để luyện thêm.';$('#skip').hidden=true;$('#return-library').hidden=false;}
for(const type of state.post.complete){const e=$('#'+type+'-status');if(e)e.textContent='✓ Đã hoàn thành '+names[type];}
$('#skip').addEventListener('click',()=>$('#skip-dialog').showModal());$('#cancel-skip').addEventListener('click',()=>$('#skip-dialog').close());
$('#confirm-skip').addEventListener('click',()=>{write({post:{...read().post,skipped:true,choice:null}});location.href='library.html';});
