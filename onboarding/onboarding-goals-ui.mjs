const icons={
 listening:'<path d="M5 14v-3a7 7 0 0 1 14 0v3"/><rect x="3" y="12" width="4" height="9" rx="2"/><rect x="17" y="12" width="4" height="9" rx="2"/>',
 speaking:'<rect x="8" y="2" width="8" height="14" rx="4"/><path d="M5 11a7 7 0 0 0 14 0m-7 7v4m-4 0h8"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6m10-6v6M3 11h18m-9 4h4v3h-4Z"/>'
};
const icon=key=>`<span class="goal-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key]}</svg></span>`;
const BASE_STOPS=['A1','A2',...Array.from({length:9},(_,n)=>(5+n*.5).toFixed(1))];
const numeric=value=>value!==''&&Number.isFinite(Number(value));
const stopsFor=()=>BASE_STOPS;
// CEFR is a declared target, never evidence of a learner's current proficiency.
const cefrFor=value=>['A1','A2'].includes(value)?value:!numeric(value)?'':Number(value)>=8.5?'C2':Number(value)>=7?'C1':Number(value)>=5.5?'B2':Number(value)>=4?'B1':'';
const escapeAttr=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export function goalsMarkup(state,field){
 return `<div class="goal-panels">${state.skills.map(k=>{const value=state.intake.goals[k],name=k==='listening'?'Listening':'Speaking',stops=stopsFor(value),index=value===''?stops.indexOf('6.0'):stops.findIndex(v=>v===value||numeric(v)&&numeric(value)&&Number(v)===Number(value));return `<section class="goal-panel" data-goal-panel="${k}"><h2>${icon(k)}${name}</h2><div class="goal-slider-control"><input type="hidden" id="goal-${k}" value="${escapeAttr(value)}"><div class="goal-rail"><input id="goal-slider-${k}" class="goal-slider" type="range" min="0" max="${stops.length-1}" step="1" value="${index<0?2:index}" aria-label="Mục tiêu CEFR và IELTS ${name}"><div class="goal-ticks" aria-hidden="true">${stops.map((v,n)=>{const anchor={A1:'A1',A2:'A2','5.0':'B1','6.0':'B2','7.5':'C1','9.0':'C2'}[v]||'';return `<span data-tick="${n}" data-tick-value="${escapeAttr(v)}" data-cefr-anchor="${anchor}" class="${anchor?'major':'minor'}" style="--tick-position:${n/(stops.length-1)}"><em>${anchor}</em><i></i><b>${numeric(v)?Number(v).toFixed(1):''}</b></span>`;}).join('')}</div></div></div><div class="goal-readout"><strong class="goal-cefr-value"></strong><output class="goal-band-value" for="goal-slider-${k}"></output></div></section>`;}).join('')}</div><section class="exam-panel"><h2>${icon('calendar')}Ngày thi dự kiến</h2><div class="exam-options"><label class="exam-option exam-unknown"><input type="radio" name="exam-choice" value="unknown" ${state.intake.exam?'':'checked'}><span>Chưa xác định</span></label><div class="exam-picker"><div class="exam-option exam-input-option"><input type="radio" name="exam-choice" value="date" aria-label="Chọn ngày thi" ${state.intake.exam?'checked':''}>${field('exam','Ngày thi dự kiến',state.intake.exam,'date')}<svg class="exam-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${icons.calendar}</svg></div><div class="exam-calendar" role="dialog" aria-label="Chọn ngày thi dự kiến" hidden></div></div></div></section>`;
}
export function wireGoalsUI(form){
 const win=form.ownerDocument.defaultView;
 for(const panel of form.querySelectorAll('[data-goal-panel]')){
  const input=panel.querySelector('input[type=hidden]'),range=panel.querySelector('[type=range]'),output=panel.querySelector('output'),cefr=panel.querySelector('.goal-cefr-value'),stops=stopsFor(input.value);
  function sync(){const unset=input.value==='',level=cefrFor(input.value);panel.classList.toggle('is-unset',unset);cefr.textContent=unset?'—':level||'IELTS';output.textContent=numeric(input.value)?Number(input.value).toFixed(1):'';range.setAttribute('aria-valuetext',unset?'Chưa xác định':level+(numeric(input.value)?' · IELTS '+Number(input.value).toFixed(1):''));panel.style.setProperty('--band-position',Number(range.value)/(stops.length-1));panel.querySelectorAll('[data-tick]').forEach(tick=>{tick.classList.toggle('is-filled',!unset&&Number(tick.dataset.tick)<=Number(range.value));tick.classList.toggle('is-selected',!unset&&(tick.dataset.tickValue===input.value||numeric(tick.dataset.tickValue)&&numeric(input.value)&&Number(tick.dataset.tickValue)===Number(input.value)));tick.classList.toggle('is-level',!unset&&tick.dataset.cefrAnchor===level);});}
  function commit(){const next=stops[Number(range.value)];if(input.value!==next){input.value=next;input.dispatchEvent(new win.Event('input',{bubbles:true}));}sync();}
  range.addEventListener('input',e=>{e.stopPropagation();commit();});range.addEventListener('change',commit);range.addEventListener('pointerup',commit);
  range.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key))commit();});
  sync();
 }

 const dateInput=form.querySelector('#exam'),calendar=form.querySelector('.exam-calendar'),picker=form.querySelector('.exam-picker'),unknown=form.querySelector('[name="exam-choice"][value="unknown"]'),dated=form.querySelector('[name="exam-choice"][value="date"]'),today=new Date();
 const controller=new win.AbortController(),signal=controller.signal;win.addEventListener('hashchange',()=>controller.abort(),{once:true,signal});
 function closeCalendar(){calendar.hidden=true;dateInput.setAttribute('aria-expanded','false');}
 function openCalendar(){dated.checked=true;calendar.hidden=false;dateInput.setAttribute('aria-expanded','true');}
 dateInput.setAttribute('aria-haspopup','dialog');dateInput.setAttribute('aria-expanded','false');
 const fromISO=iso=>{const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d);};
 let month=dateInput.value?fromISO(dateInput.value):new Date(today.getFullYear(),today.getMonth(),1);
 const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 function renderCalendar(){
  const y=month.getFullYear(),m=month.getMonth(),start=new Date(y,m,1),offset=(start.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),cells=Math.ceil((offset+days)/7)*7;
  calendar.innerHTML=`<div class="calendar-heading"><button type="button" data-calendar-prev aria-label="Tháng trước"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><strong>${new Intl.DateTimeFormat('vi-VN',{month:'long',year:'numeric'}).format(start)}</strong><button type="button" data-calendar-next aria-label="Tháng sau"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></div><div class="calendar-grid">${['T2','T3','T4','T5','T6','T7','CN'].map(t=>`<span class="weekday">${t}</span>`).join('')}${Array.from({length:cells},(_,i)=>{const d=new Date(y,m,i-offset+1),value=iso(d),inMonth=d.getMonth()===m;return `<button type="button" data-date="${value}" aria-label="${new Intl.DateTimeFormat('vi-VN',{day:'numeric',month:'long',year:'numeric'}).format(d)}" aria-pressed="${value===dateInput.value}" ${value===iso(today)?'aria-current="date"':''} ${inMonth?'':'disabled'}>${d.getDate()}</button>`;}).join('')}</div>`;
  calendar.querySelector('[data-calendar-prev]').onclick=()=>{month=new Date(y,m-1,1);renderCalendar();calendar.querySelector('[data-calendar-prev]').focus();};
  calendar.querySelector('[data-calendar-next]').onclick=()=>{month=new Date(y,m+1,1);renderCalendar();calendar.querySelector('[data-calendar-next]').focus();};
  calendar.querySelectorAll('[data-date]:not(:disabled)').forEach(b=>b.onclick=()=>{dateInput.value=b.dataset.date;dateInput.dispatchEvent(new win.Event('input',{bubbles:true}));renderCalendar();closeCalendar();dateInput.focus();});

 }
 dateInput.addEventListener('click',e=>{e.preventDefault();openCalendar();});
 picker.querySelector('.exam-input-option').addEventListener('click',()=>{dateInput.focus();openCalendar();});
 dateInput.addEventListener('keydown',e=>{if(['Enter','ArrowDown'].includes(e.key)){e.preventDefault();openCalendar();calendar.querySelector('[data-date]:not(:disabled)')?.focus();}});
 dated.addEventListener('change',()=>{dateInput.focus();openCalendar();});
 unknown.addEventListener('change',()=>{if(unknown.checked){dateInput.value='';dateInput.dispatchEvent(new win.Event('input',{bubbles:true}));closeCalendar();}});
 form.ownerDocument.addEventListener('pointerdown',e=>{if(!picker.contains(e.target))closeCalendar();},{signal});
 form.ownerDocument.addEventListener('keydown',e=>{if(e.key==='Escape'&&!calendar.hidden){e.preventDefault();closeCalendar();dateInput.focus();}},{signal});
 dateInput.addEventListener('input',()=>{if(dateInput.value){dated.checked=true;month=fromISO(dateInput.value);}renderCalendar();});renderCalendar();
}
