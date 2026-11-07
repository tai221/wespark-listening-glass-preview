// Preserve the existing controls/listeners while applying the approved lesson button system.
export function polishSpeakingLessonControls(content){
 const decorate=()=>{
  observer.disconnect();
  content.querySelectorAll('.button,.footer>a').forEach(control=>{
   control.classList.add('lesson-footer-button');
   control.classList.toggle('lesson-footer-primary',control.classList.contains('primary'));
   const anchor=control.matches('a[href]'),wordNavigation=!!control.closest('.speaking-word-actions');
   const label=control.textContent.trim(),back=/^(?:←|Trước|Quay lại|Trở lại|Thư viện|Xem lại)/.test(label);
   const walker=document.createTreeWalker(control,NodeFilter.SHOW_TEXT);let text;
   while(text=walker.nextNode()){const clean=text.textContent.replace(/[←→]/g,'');if(clean!==text.textContent)text.textContent=clean;}
   if(control.hasAttribute('data-no-arrow')||(!anchor&&!wordNavigation&&!control.hasAttribute('data-page-navigation'))){control.querySelector('.action-arrow')?.remove();return;}
   const direction=back?'left':'right';control.dataset.arrowDirection=direction;
   let arrow=control.querySelector('.action-arrow');
   if(!arrow){arrow=document.createElement('span');arrow.className='action-arrow';arrow.setAttribute('aria-hidden','true');control[back?'prepend':'append'](arrow);}
   const path=back?'M19 12H5m6-6-6 6 6 6':'M5 12h14m-6-6 6 6-6 6';
   arrow.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  });
  observer.observe(content,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href']});
 };
 const observer=new MutationObserver(decorate);decorate();
}
