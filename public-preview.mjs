// Allow navigation only to runtime pages published in this preview.
const base=new URL('.',import.meta.url);
const pages=new Set(["conversation.html", "coverage.html", "dictation-complete.html", "dictation.html", "index.html", "library.html", "post.html", "pre.html", "shadowing.html", "speaking/key-speaking-compare.html", "speaking/key-speaking-completion.html", "speaking/key-speaking-drill-repeat.html", "speaking/key-speaking-feedback-detail.html", "speaking/key-speaking-feedback.html", "speaking/key-speaking-game.html", "speaking/key-speaking-kit.html", "speaking/key-speaking-library.html", "speaking/key-speaking-mindmap.html", "speaking/key-speaking-produce.html", "speaking/key-speaking-version2.html", "speaking/key-speaking-vocabulary.html", "while.html"].map(path=>new URL(path,base).pathname));
function outside(link){
 const raw=link.getAttribute('href');if(!raw||raw==='#preview-unavailable')return true;
 const url=new URL(raw,document.baseURI);return url.origin!==base.origin||!pages.has(url.pathname);
}
function markUnavailable(){
 document.querySelectorAll('a[href]').forEach(link=>{if(outside(link)){link.setAttribute('aria-disabled','true');link.tabIndex=-1;link.title='Ngoài phạm vi bản preview';}});
 const wallet=document.querySelector('.wallet[role="link"]');if(wallet){wallet.setAttribute('aria-disabled','true');wallet.tabIndex=-1;wallet.title='SparkPoint minh họa trong bản preview';}
}
document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if((link&&outside(link))||event.target.closest('.wallet[aria-disabled="true"]')){event.preventDefault();event.stopImmediatePropagation();}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',markUnavailable,{once:true});else markUnavailable();
