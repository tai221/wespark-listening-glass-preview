import {read,write} from './session.mjs';
const $=s=>document.querySelector(s),state=read();
const names={dictation:'Nghe chép',shadowing:'Luyện nói theo',conversation:'Hội thoại'};
document.querySelectorAll('[data-choice]').forEach(a=>a.addEventListener('click',()=>write({post:{...read().post,choice:a.dataset.choice,skipped:false}})));
if(state.post.complete.length){$('#post-status').hidden=false;$('#post-status').textContent='Bạn đã hoàn thành phần Vận dụng. Có thể chọn một hoạt động khác để luyện thêm.';$('#skip').hidden=true;$('#return-library').hidden=false;}
else if(state.post.skipped){$('#post-status').dataset.state='skipped';$('#post-status').hidden=false;$('#post-status').textContent='Bạn đã bỏ qua phần Vận dụng. Có thể chọn một hoạt động để luyện thêm.';$('#skip').hidden=true;$('#return-library').hidden=false;}
for(const [type,name] of Object.entries(names)){
 const card=document.querySelector(`[data-activity="${type}"]`),status=$('#'+type+'-status'),link=card.querySelector('[data-choice]');
 const done=state.post.complete.includes(type),resume=!done&&!state.post.skipped&&state.post.choice===type;
 card.classList.toggle('is-complete',done);card.classList.toggle('is-resuming',resume);
 if(done||resume){status.hidden=false;status.textContent=done?'Đã hoàn thành':'Lựa chọn trước của bạn';}
 if(done){const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.innerHTML='<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>';status.prepend(icon);}
 const label=done?'Luyện lại':resume?'Tiếp tục':'Bắt đầu';link.querySelector('[data-choice-label]').textContent=label;link.setAttribute('aria-label',`${label} ${name}`);
}
$('#skip').addEventListener('click',()=>$('#skip-dialog').showModal());$('#cancel-skip').addEventListener('click',()=>$('#skip-dialog').close());
$('#confirm-skip').addEventListener('click',()=>{write({post:{...read().post,skipped:true,choice:null}});location.href='library.html';});
