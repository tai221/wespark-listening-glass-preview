// Keep public navigation inside the published Listening demo.
function markUnavailable(){document.querySelectorAll('a[href]').forEach(link=>{
 const raw=link.getAttribute('href');
 if(raw.startsWith('../')||/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(raw)){
  link.setAttribute('aria-disabled','true');link.tabIndex=-1;link.title='Ngoài phạm vi bản demo Listening';
  link.addEventListener('click',event=>event.preventDefault());
 }
});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',markUnavailable,{once:true});else markUnavailable();
