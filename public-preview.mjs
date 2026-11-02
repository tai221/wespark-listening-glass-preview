// Keep public navigation inside the published Listening demo.
const outside=link=>link.getAttribute('href')?.startsWith('../')||link.getAttribute('href')==='#preview-unavailable';
function markUnavailable(){
 document.querySelectorAll('a[href]').forEach(link=>{if(outside(link)){link.setAttribute('aria-disabled','true');link.tabIndex=-1;link.title='Ngoài phạm vi bản demo Listening';}});
 const wallet=document.querySelector('.wallet[role="link"]');if(wallet){wallet.setAttribute('aria-disabled','true');wallet.tabIndex=-1;wallet.title='SparkPoint minh họa trong bản demo Listening';}
}
document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(link&&outside(link)||event.target.closest('.wallet[aria-disabled="true"]')){event.preventDefault();event.stopImmediatePropagation();}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',markUnavailable,{once:true});else markUnavailable();
