const KEY='wespark-listening-glass-v1';
const defaults=()=>({while:{answers:[null,null,null,null],submitted:false,reviewed:[]},post:{choice:null,skipped:false,complete:[]},dictation:{},shadowing:{},conversation:{}});
let memory=defaults();
export function read(){try{const saved=JSON.parse(sessionStorage.getItem(KEY));return {...defaults(),...(saved||{})};}catch{return memory;}}
export function write(patch){memory={...read(),...patch};try{sessionStorage.setItem(KEY,JSON.stringify(memory));}catch{}window.dispatchEvent(new CustomEvent('listening-session-change'));return memory;}
export function prep(){try{return JSON.parse(sessionStorage.getItem('wespark-listening-glass-pre-v1'))?.state||null;}catch{return null;}}
export function balance(){return prep()?.balance??120;}
export function reset(){memory=defaults();try{sessionStorage.removeItem(KEY);sessionStorage.removeItem('wespark-listening-glass-pre-v1');}catch{}window.dispatchEvent(new CustomEvent('listening-session-change'));}
export function hydrate(){document.querySelectorAll('[data-balance]').forEach(e=>e.textContent=balance());renderSaveState();}
window.addEventListener('listening-session-change',hydrate);
queueMicrotask(hydrate);

// Explicit reviewer-only fixtures: this prototype has no remote save service.
function renderSaveState(){
 const main=document.querySelector('main'),bar=document.querySelector('.reviewbar');
 if(!main||!bar)return;
 if(!document.querySelector('#reset-session')){
  const restart=document.createElement('button');restart.id='reset-session';restart.type='button';restart.className='reset-session-button';restart.textContent='Bắt đầu lại';
  restart.title='Đặt lại tiến trình bài học và SparkPoint minh họa trong bản Glass';
  restart.addEventListener('click',()=>{reset();window.location.reload();});
  bar.insertBefore(restart,bar.children[1]||null);
 }
 if(!document.querySelector('#review-save')){
  const details=document.createElement('details');details.id='review-save';
  const summary=document.createElement('summary');summary.textContent='Trạng thái lưu';
  const box=document.createElement('div'),copy=document.createElement('p');copy.textContent='Chỉ mô phỏng giao diện lưu/chưa lưu. Không có dịch vụ lưu từ xa trong bản local.';box.append(copy);
  for(const [value,label] of [['pending','Đang lưu'],['error','Lỗi lưu'],['ready','Bình thường']]){const b=document.createElement('button');b.textContent=label;b.type='button';b.dataset.saveFixture=value;b.addEventListener('click',()=>{details.open=false;write({demoSave:value});});box.append(b);}
  details.append(summary,box);bar.append(details);
 }
 let notice=document.querySelector('#save-notice');
 if(!notice){notice=document.createElement('div');notice.id='save-notice';notice.className='notice';notice.setAttribute('role','status');notice.style.marginBottom='22px';main.prepend(notice);}
 const mode=read().demoSave;
 notice.hidden=!['pending','error'].includes(mode);notice.replaceChildren();
 if(mode==='pending')notice.textContent='Đang lưu tiến trình… Bạn có thể tiếp tục phần đang làm.';
 if(mode==='error'){
  const text=document.createElement('span');text.textContent='Chưa lưu được tiến trình. Phần đang làm vẫn được giữ trong phiên này. ';
  const retry=document.createElement('button');retry.className='text-button';retry.textContent='Thử lưu lại';retry.type='button';retry.id='retry-save';retry.addEventListener('click',()=>{write({demoSave:'ready'});const heading=main.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus();}});notice.append(text,retry);
 }
}
