const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const paths={
 heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
 plane:'m22 2-7 20-4-9-9-4 20-7ZM11 13l5-5M7 16l-3 4',
 laptop:'M5 3h14v14H5zM2 20h20l-3-3H5l-3 3Z',
 music:'M9 18V5l12-3v13M9 8l12-3M9 18c0 2-6 4-6 0s6-4 6 0Zm12-3c0 2-6 4-6 0s6-4 6 0Z',
 film:'M3 4h18v17H3zM3 9h18M6 4l2 5m4-5 2 5m4-5 2 5',
 chart:'M3 21V12h4v9m3 0V7h4v14m3 0V2h4v19M2 21h20',
 health:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8ZM3 12h5l2-4 4 8 2-4h5',
 brush:'m14 13 8-9-2-2-9 8 3 3ZM11 10l3 3M9 13c-5-1-3 5-6 7 8 2 10-5 6-7Z',
 leaf:'M12 21V10m0 5C3 17 2 11 3 8c5-1 9 1 9 7Zm0-4c0-7 4-9 10-9 0 7-3 11-10 9Z',
 briefcase:'M3 7h18v14H3zM8 7V3h8v4M3 12h18M10 12v4h4v-4',
 megaphone:'M3 9h5l12-5v14L8 13H3V9Zm5 4 2 8H6l-2-8M23 8v6',
 code:'m8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18',
 coins:'M19 5c0 4-14 4-14 0s14-4 14 0ZM5 5v5c0 4 14 4 14 0V5M5 10v5c0 4 14 4 14 0v-5M9 18v2c0 4 13 4 13 0v-8',
 school:'m1 8 11-6 11 6-11 6L1 8Zm5 3v7c4 3 8 3 12 0v-7m5-3v9',
 users:'M16 21v-3c0-6-14-6-14 0v3M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 1c5 0 5 7 0 7m1 3c3 0 4 2 4 5v2',
 user:'M20 21v-3c0-6-16-6-16 0v3M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
 medical:'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 4v10m-5-5h10',
 plus:'M12 5v14M5 12h14'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.plus}"/></svg>`;
const groups=[{id:'interests',title:'Chủ đề yêu thích',hint:'Chọn nhiều',icon:'heart',rows:[[['Du lịch','plane'],['Công nghệ','laptop'],['Âm nhạc','music'],['Phim ảnh','film']],[['Kinh doanh','chart'],['Sức khỏe','health'],['Thiết kế','brush'],['Đời sống','leaf']]]},{id:'profession',title:'Lĩnh vực chuyên môn',hint:'Nếu có',icon:'briefcase',rows:[[['Marketing','megaphone'],['IT','code'],['Tài chính','coins'],['Giáo dục','school']],[['Sales','users'],['HR','user'],['Y tế','medical'],['Sinh viên','school']]]}];
const values=value=>value.split(/[,;\n]/).map(v=>v.trim()).filter(Boolean);
const chip=(label,ico,selected)=>`<button type="button" class="preference-chip" data-value="${esc(label)}" aria-pressed="${selected}">${icon(ico)}<span>${esc(label)}</span><span class="preference-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="m6 12 4 4 8-8"/></svg></span></button>`;
export function preferencesMarkup(intake){return `<p class="preferences-optional">Tùy chọn</p><div class="preference-groups">${groups.map(g=>{const selected=values(intake[g.id]||''),known=g.rows.flat().map(([label])=>label),custom=selected.filter(v=>!known.includes(v));return `<section class="preference-group" data-preference="${g.id}" aria-labelledby="${g.id}-heading"><h2 id="${g.id}-heading"><span class="preference-heading-icon">${icon(g.icon)}</span>${g.title}<span class="preference-hint">${g.hint}</span></h2><input type="hidden" id="${g.id}" value="${esc(intake[g.id])}">${g.rows.map((row,index)=>`<div class="preference-row">${row.map(([label,ico])=>chip(label,ico,selected.includes(label))).join('')}${index===1?`<button type="button" class="preference-add" aria-label="Thêm ${g.title.toLowerCase()}" aria-expanded="false">${icon('plus')}Thêm</button>`:''}</div>`).join('')}<div class="preference-custom">${custom.map(label=>chip(label,'plus',true)).join('')}</div><div class="preference-editor" hidden><label for="custom-${g.id}">Thêm ${g.title.toLowerCase()}</label><div><input id="custom-${g.id}" type="text" maxlength="60" placeholder="Nhập nội dung" autocomplete="off"><button type="button" class="preference-save">Thêm</button><button type="button" class="preference-cancel">Hủy</button></div></div></section>`;}).join('')}</div>`;}
export function wirePreferencesUI(form){
 form.querySelectorAll('[data-preference]').forEach(group=>{
  const hidden=group.querySelector('input[type=hidden]'),editor=group.querySelector('.preference-editor'),input=editor.querySelector('input'),add=group.querySelector('.preference-add');
  const sync=()=>{hidden.value=[...group.querySelectorAll('.preference-chip[aria-pressed=true]')].map(b=>b.dataset.value).join(', ');hidden.dispatchEvent(new Event('input',{bubbles:true}));};
  const close=()=>{editor.hidden=true;add.setAttribute('aria-expanded','false');input.value='';add.focus();};
  const save=()=>{const label=input.value.trim().replace(/[,;\n]+/g,' ');if(!label){input.focus();return;}const existing=[...group.querySelectorAll('.preference-chip')].find(b=>b.dataset.value.toLocaleLowerCase()===label.toLocaleLowerCase());if(existing)existing.setAttribute('aria-pressed','true');else group.querySelector('.preference-custom').insertAdjacentHTML('beforeend',chip(label,'plus',true));sync();close();};
  group.addEventListener('click',e=>{const button=e.target.closest('.preference-chip');if(button){button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));sync();}});
  add.addEventListener('click',()=>{editor.hidden=!editor.hidden;add.setAttribute('aria-expanded',String(!editor.hidden));if(!editor.hidden)input.focus();});
  editor.querySelector('.preference-save').addEventListener('click',save);editor.querySelector('.preference-cancel').addEventListener('click',close);
  input.addEventListener('input',e=>e.stopPropagation());
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();save();}if(e.key==='Escape'){e.preventDefault();close();}});
 });
}
