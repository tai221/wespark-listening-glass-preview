const roots='.post-launch-action,.challenge-launch,main>.actions,.while-actions,.dictation-bottom-nav,.completion-links,.completion-actions,.result-actions,#recall-summary-actions,.post-end,.activity,.completion-card,.practice-completion,.conversation-ended-actions,#conversation-intro';
export function mountFooterButtons(document){
 const main=document.querySelector('main');if(!main)return;
 const observer=new document.defaultView.MutationObserver(decorate);
 function decorate(){
  observer.disconnect();
  const buttons=new Set([...document.querySelectorAll(roots)].flatMap(root=>[...root.querySelectorAll('a,button')]));
  for(const button of buttons){
   if(!button.textContent.trim())continue;button.classList.add('lesson-footer-button');
   const primary=button.classList.contains('primary');button.classList.toggle('lesson-footer-primary',primary);
   const href=button.getAttribute('href');
   const navigation=!button.hasAttribute('data-no-arrow')&&(button.hasAttribute('data-page-navigation')||(button.tagName==='A'&&href&&!href.startsWith('#')));
   const label=button.textContent.trim(),left=button.dataset.pageNavigation==='back'||/^←|Quay lại|Trở lại|Thư viện|thư viện|Chọn hoạt động khác/.test(label);
   const walker=document.createTreeWalker(button,document.defaultView.NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){const clean=node.textContent.replace(/[←→]/g,'').trim();if(clean!==node.textContent)node.textContent=clean;}
   if(!navigation||button.querySelector('.action-game,.action-listen')){button.querySelector('.action-arrow')?.remove();delete button.dataset.arrowDirection;continue;}
   button.dataset.arrowDirection=left?'left':'right';
   if(button.querySelector('.action-arrow'))continue;
   const existing=button.querySelector(':scope>svg');
   const arrow=document.createElement('span');arrow.className='action-arrow';arrow.setAttribute('aria-hidden','true');
   if(existing)arrow.append(existing);else arrow.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${left?'M19 12H5m6-6-6 6 6 6':'M5 12h14m-6-6 6 6-6 6'}"/></svg>`;
   if(left)button.prepend(arrow);else button.append(arrow);
  }
  observer.observe(main,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href','data-page-navigation','data-no-arrow']});
 }
 decorate();
}
