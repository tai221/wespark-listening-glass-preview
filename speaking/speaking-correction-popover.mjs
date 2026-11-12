const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const glyph=(good)=>`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${good?'m5 10 3 3 7-7':'m6 6 8 8M14 6l-8 8'}"/></svg>`;
export function correctionContent(mark,{status}={}){
 const good=status==='good'||['positive','good','kit'].includes(mark.visual||mark.kind);
 const suggestion=mark.kind==='upgrade'||mark.visual==='upgrade'||status==='unclear'&&mark.criterion==='vocabulary';
 const uncertain=status==='unclear'||mark.visual==='unclear';
 const replacement=!uncertain&&mark.replacement&&mark.replacement!==mark.text?mark.replacement:'';
 const reference=mark.reference||mark.instruction||'';
 const note=uncertain&&['fluency','pronunciation','intonation'].includes(mark.criterion)?'Chưa đủ dữ liệu âm thanh để kết luận.':reference||(!replacement?(mark.explanation||'').split(/(?<=[.!?])\s/)[0]:'');
 return `<div class="sc-heading"><span class="sc-status ${good?'sc-good':suggestion?'sc-suggestion':'sc-error'}">${glyph(good||suggestion)}</span><strong>${esc(mark.label)}</strong></div>${replacement?`<div class="sc-row"><span>${good?'Đã dùng:':suggestion?'Có thể dùng:':'Thay bằng:'}</span><span class="sc-replacement" lang="en">${glyph(true)}${esc(replacement)}</span></div>`:note?`<p class="sc-note">${esc(note)}</p>`:''}${suggestion?'<span class="sc-optional">Gợi ý tùy chọn</span>':''}`;
}
export function hideCorrection(box){
 if(!box)return;
 if(box.matches(':popover-open'))box.hidePopover();
 box.hidden=true;
}
export function showCorrection(box,anchor){
 if(!box||!anchor)return;
 document.querySelectorAll('.sc-popover:popover-open').forEach(other=>{if(other!==box)hideCorrection(other);});
 box.classList.add('sc-popover');box.setAttribute('popover','auto');box.setAttribute('role','dialog');box.setAttribute('aria-label','Nhận xét cụm từ');
 box.hidden=false;
 if(!box.matches(':popover-open'))box.showPopover();
 const range=document.createRange();range.selectNodeContents(anchor);
 const fragments=[...range.getClientRects()];
 const rect=fragments.at(-1)||anchor.getBoundingClientRect(),bounds=box.getBoundingClientRect();
 const left=Math.max(16,Math.min(rect.left+rect.width/2-bounds.width/2,innerWidth-bounds.width-16));
 const below=rect.bottom+12+bounds.height<=innerHeight-16;
 box.style.left=`${left}px`;box.style.top=`${below?rect.bottom+12:Math.max(16,rect.top-bounds.height-12)}px`;
 box.dataset.side=below?'below':'above';box.style.setProperty('--sc-tip',`${Math.max(20,Math.min(rect.left+rect.width/2-left,bounds.width-20))}px`);
 if(!box.dataset.scBound){
  box.dataset.scBound='true';
  box.addEventListener('toggle',event=>{if(event.newState==='closed'){box.hidden=true;const root=box.closest('.sf-workspace,.cycle-result');root?.querySelectorAll('[aria-expanded=true][data-mark],.mark.selected').forEach(el=>{el.setAttribute('aria-expanded','false');el.classList.remove('selected');});}});
 }
}
// A floating correction must never remain detached from its word after scrolling.
window.addEventListener('scroll',event=>{document.querySelectorAll('.sc-popover:popover-open').forEach(box=>{if(!box.contains(event.target))hideCorrection(box);});},true);
window.addEventListener('resize',()=>document.querySelectorAll('.sc-popover:popover-open').forEach(hideCorrection));
