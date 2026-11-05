export function mountCompactHeader(document){
 if(document.body.hasAttribute('data-lesson-shell'))return;
 const header=document.querySelector('.pre-lesson-header'),route=header?.querySelector('.learning-route'),journey=route?.querySelector('.journey'),row=route?.querySelector('.route-preparation');
 if(!journey||!row||header.hasAttribute('data-compact-header'))return;
 const overview=document.createElement('div');overview.id='pre-route-overview';overview.className='pre-route-overview';overview.hidden=true;overview.append(journey);
 const button=document.createElement('button');button.type='button';button.className='pre-route-toggle';button.setAttribute('aria-controls',overview.id);button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Chuẩn bị · Mở lộ trình bài học');
 button.innerHTML='<span class="pre-route-position" aria-hidden="true">1</span><span>Chuẩn bị</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
 button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',`Chuẩn bị · ${open?'Thu gọn':'Mở'} lộ trình bài học`);overview.hidden=!open;});
 row.append(button);route.append(overview);header.dataset.compactHeader='';
}
if(typeof document!=='undefined')mountCompactHeader(document);
