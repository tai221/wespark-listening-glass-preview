const KEY='wespark-listening-background-v1';

export function createBackgroundButton(document){
 const view=document.defaultView,button=document.createElement('button');
 const read=()=>{try{return view.localStorage.getItem(KEY)!=='off';}catch{return true;}};
 let enabled=read();
 button.type='button';button.className='project-sound-button listening-background-button';
 button.setAttribute('aria-label','Nền phong cảnh');
 function render(){
  document.body.dataset.listeningBackground=enabled?'on':'off';
  button.setAttribute('aria-pressed',String(enabled));
  button.title=enabled?'Ẩn nền phong cảnh · Dùng nền trắng':'Bật nền phong cảnh';
  button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>'+(enabled?'':'<path d="m3 3 18 18"/>')+'</svg>';
 }
 button.addEventListener('click',()=>{
  enabled=!enabled;render();try{view.localStorage.setItem(KEY,enabled?'on':'off');}catch{}
 });
 view.addEventListener('storage',event=>{if(event.key===KEY||event.key===null){enabled=read();render();}});
 render();return button;
}
