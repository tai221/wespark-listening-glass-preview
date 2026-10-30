// The local preview server has no byte-range responses. A buffered Blob lets
// native media seeking work reliably without changing the recording.
export async function prepareLocalSource(media,{fetcher,createURL,revokeURL}={}){
 const win=media.ownerDocument.defaultView;
 if(!['127.0.0.1','localhost','[::1]'].includes(win.location.hostname))return;
 const original=media.getAttribute('src');
 try{
  const response=await (fetcher||win.fetch.bind(win))(media.src);
  if(!response.ok)return;
  const url=(createURL||win.URL.createObjectURL.bind(win.URL))(await response.blob());
  const revoke=revokeURL||win.URL.revokeObjectURL.bind(win.URL);
  if(media.getAttribute('src')!==original){revoke(url);return;}
  media.dataset.seekableSource=url;
  const apply=()=>{
   if(media.getAttribute('src')!==original)return;
   const position=media.currentTime,rate=media.playbackRate;
   media.addEventListener('loadedmetadata',()=>{media.currentTime=position;media.playbackRate=rate;},{once:true});
   media.src=url;media.load();
  };
  if(media.paused)apply();else media.addEventListener('pause',apply,{once:true});
  win.addEventListener('pagehide',()=>revoke(url),{once:true});
 }catch{/* Native controls remain available if local buffering fails. */}
}
if(typeof document!=='undefined'){
 const source=document.querySelector('#source-audio');if(source)prepareLocalSource(source);
}
