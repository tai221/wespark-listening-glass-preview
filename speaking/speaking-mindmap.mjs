import {fitCamera,sceneGeometry,createPreziCamera} from './speaking-mindmap-camera.mjs?v=prezi-radial-20261119';
import {treeLinks,treeHeight,TREE_WIDTH,branchLeft,branchTop,treeWidth} from './speaking-mindmap-tree.mjs?v=horizontal-ideas-20261119';
import {phraseMeanings,phraseAudio} from './speaking-mindmap-vocabulary.mjs?v=phrase-audio-20261119';
import {fixture} from './speaking-feedback-model.mjs';

const paths={minus:'M5 12h14',search:'m21 21-4.5-4.5M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z',speaker:'M11 5 6 9H3v6h3l5 4V5ZM15 9a5 5 0 0 1 0 6',speakerPlaying:'M11 5 6 9H3v6h3l5 4V5ZM15 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12',play:'m9 5 11 7-11 7V5Z',stop:'M7 7h10v10H7z',remove:'m6 6 12 12M18 6 6 18',check:'m5 12 4 4L19 6',map:'M4 6h6v5H4zM15 4h6v5h-6zM14 16h6v5h-6zM10 8h5m-8 3v7h7',answer:'M21 11a8 8 0 0 1-8 8H8l-5 3V11a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z',expand:'M6 12h12M12 6v12',cause:'M5 6h5v5H5zM14 14h5v5h-5zM10 8h7v6',compare:'M8 4v16m8-16v16M4 8h8m0 8h8',example:'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9z',future:'M4 6h16v15H4zM8 3v6m8-6v6M4 12h16',arrow:'M5 12h14m-6-6 6 6-6 6',chevron:'m9 5 7 7-7 7',book:'M12 5c-4-3-8-2-9-1v15c3-2 6-2 9 0 3-2 6-2 9 0V4c-3-2-6-2-9 1Zm0 0v14',home:'m3 11 9-8 9 8M5 9v12h14V9M10 21v-7h4v7'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
import {techniques,answerSuggestions,DRAFT_KEY,hydrateDrafts,outlineFor} from './speaking-mindmap-model.mjs?v=map-edit-20261118';
const positions=[{x:1200,y:360,w:940},{x:0,y:1320,w:940},{x:2400,y:1320,w:940}];

export function mountSpeakingMindmap(main){
 main.speakingMindmapDispose?.();
 const doc=main.ownerDocument,win=doc.defaultView,reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
 doc.body.dataset.speakingMindmap='';main.classList.add('mindmap-studio');
 const link=doc.createElement('link');link.rel='stylesheet';link.href='speaking-mindmap.css?v=keep-topic-link-20261119';doc.head.append(link);
 let findContext='',findDemoShown=false,playback=null,speech=null,spokenWord=null,mapInput=null,current=0,technique=0,panel='answer',branch=0,hints=false,typingTimer,focusTimer,intro=true,drafts=hydrateDrafts(null);
 try{drafts=hydrateDrafts(JSON.parse(win.sessionStorage.getItem(DRAFT_KEY)));}catch{}
 main.innerHTML=`<header class="mm-heading"><div class="mm-heading-copy"><span class="mm-mascot-scene"><img class="mm-mascot" src="../assets/spark-mindmap-laptop-v1.webp" width="120" height="80" alt="Spark đeo tai nghe, lên ý tưởng Mind Map trên laptop"></span><div><h1>Xây dựng Mind Map</h1><p>Sắp xếp ý chính, mở rộng ý nhanh.</p></div></div><ol class="mm-steps" aria-label="Các bước luyện nói"><li aria-current="step"><b>1</b><span>Xây mindmap</span></li><li><b>2</b><span>Luyện nói</span></li><li><b>3</b><span>Nhận phản hồi</span></li></ol></header>
 <div class="mm-layout"><section class="mm-map" aria-label="Mind Map My hometown"><div class="mm-map-tools"><button type="button" data-map-overview>${icon('map')}<span>Toàn cảnh</span></button></div><div class="mm-viewport"><div class="mm-world"><svg class="mm-connections" viewBox="0 0 840 620" aria-hidden="true"><path class="mm-line mm-line-0" d="M420 320C420 205 330 265 235 190"/><path class="mm-line mm-line-1" d="M420 320C515 320 490 285 590 285"/><path class="mm-line mm-line-2" d="M420 350C420 450 290 420 245 485"/></svg><div class="mm-root">${icon('home')}<strong>My hometown</strong></div>${fixture.questions.map((q,i)=>`<section class="mm-branch" data-question-card="${i}" style="left:${positions[i].x}px;top:${positions[i].y}px;width:${positions[i].w}px"><div class="mm-tree-wires" data-tree-wires="${i}"></div><span class="mm-number">Q${i+1}</span><button type="button" class="mm-question-control" data-map-question="${i}" aria-label="Câu ${i+1}: ${q.prompt}"><span class="mm-branch-title" lang="en" ${i===0?'data-typed-question':''}>${q.prompt}</span>${icon('chevron')}</button><div class="mm-branch-detail"><button type="button" data-map-answer="${i}">${icon('answer')}Answer<span data-branch-answer="${i}">Ý chính của bạn</span></button><button type="button" data-map-expand="${i}">${icon('expand')}Expand<span data-branch-method="${i}">Mở rộng ý</span></button><div class="mm-outline" data-outline="${i}"></div></div></section>`).join('')}</div></div></section>
 <section class="mm-editor" aria-label="Chuẩn bị câu trả lời"><header class="mm-editor-heading"><span class="mm-number" data-editor-number>Q1</span><h2 data-editor-question lang="en"></h2><div class="mm-question-arrows"><button type="button" data-map-prev aria-label="Câu trước">${icon('chevron')}</button><button type="button" data-map-next aria-label="Câu tiếp theo">${icon('chevron')}</button></div></header><div class="mm-editor-content"><section data-panel="answer"><div class="mm-panel-title"><h3 class="mm-field-label" id="mm-answer-label">${icon('answer')}Answer</h3></div><div class="mm-answer-wrap"><textarea id="mm-answer" maxlength="300" placeholder="Ý chính của bạn" aria-label="Ý chính của bạn" aria-describedby="mm-count"></textarea><span id="mm-count" data-answer-count>0 / 300</span></div><div class="mm-answer-tools"><button type="button" data-answer-hints aria-label="Gợi ý câu trả lời" title="Gợi ý câu trả lời" aria-expanded="false" aria-controls="mm-suggestions">${icon('example')}</button></div><div id="mm-suggestions" class="mm-answer-suggestions" data-answer-suggestions hidden role="group" aria-labelledby="mm-answer-label"></div></section><section data-panel="expand" hidden><h3 class="mm-field-label">${icon('expand')}Expand</h3><p class="mm-panel-help">Chọn cách mở rộng để tạo các nhánh trên bản đồ.</p><div class="mm-techniques" role="group" aria-label="Cách mở rộng ý"></div></section><section data-panel="branch" hidden><h3 class="mm-field-label" data-branch-title></h3><div class="mm-phrases" data-phrases></div><p class="mm-phrase-help"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M3 12h18m-12-6 3-3 3 3m-6 12 3 3 3-3M6 9l-3 3 3 3m12-6 3 3-3 3"/></svg><span>Kéo cụm từ vào nhánh, hoặc nhấn để thêm.</span></p></section></div><div class="mm-editor-footer"><p data-save-status role="status"></p><a class="lesson-footer-button lesson-footer-primary mm-continue" href="key-speaking-produce.html">${icon('arrow')}<span>Luyện nói</span></a></div></section></div>`;
 const $=s=>main.querySelector(s),all=s=>[...main.querySelectorAll(s)],world=$('.mm-world'),viewport=$('.mm-viewport'),answer=$('textarea');
 $('[data-panel="branch"]').insertAdjacentHTML('beforeend',`<section class="mm-find-words" aria-labelledby="mm-find-title"><h3 id="mm-find-title">Tìm từ theo ý</h3><form class="mm-find-form" data-find-form><label class="mm-sr-only" for="mm-find-query">Mô tả ý muốn nói bằng tiếng Việt hoặc tiếng Anh</label><input id="mm-find-query" data-find-query type="text" maxlength="300" placeholder="Mô tả bằng tiếng Việt hoặc tiếng Anh…" autocomplete="off"><button type="submit" data-find-submit aria-label="Tìm từ" title="Tìm từ" disabled>${icon('search')}</button></form><div data-find-output hidden><div class="mm-phrases mm-find-results" data-find-results></div></div></section>`);
 $('[data-find-query]').addEventListener('input',()=>{findDemoShown=false;$('[data-find-submit]').disabled=!$('[data-find-query]').value.trim();renderFindResults();});
 $('[data-find-form]').addEventListener('submit',event=>{event.preventDefault();if(!$('[data-find-query]').value.trim())return;cancelIntro();findDemoShown=true;renderFindResults();});
 $('.mm-layout').prepend($('.mm-editor'));
 const canvas=doc.createElement('div');canvas.className='mm-map-canvas';world.before(canvas);canvas.append(world);
 const $tree=selector=>$(`[data-question-card="${current}"]`)?.querySelector(selector),mapLifecycle=new win.AbortController();
 all('[data-question-card]').forEach(card=>card.querySelector('.mm-question-control').prepend(card.querySelector(':scope>.mm-number')));
 $('.mm-map-tools').insertAdjacentHTML('afterbegin',`<div class="mm-zoom-controls" role="group" aria-label="Thu phóng bản đồ"><button type="button" data-map-zoom="out" aria-label="Thu nhỏ bản đồ" title="Thu nhỏ">${icon('minus')}</button><button type="button" data-map-zoom="in" aria-label="Phóng to bản đồ" title="Phóng to">${icon('expand')}</button></div>`);
 let scene=null,cameraScope='overview',drag=null,internalMapFocus=false;
 const driver=createPreziCamera({win,element:world,viewport,onState:moving=>{main.dataset.cameraMoving=String(moving);}});
 function focusMap(node){internalMapFocus=true;try{node?.focus({preventScroll:true});}finally{internalMapFocus=false;}}
 function sceneCounts(index){return (drafts[index].methodDrafts[drafts[index].technique]||[]).map(words=>words.length+1);}
 function syncScene(){
  const heights=drafts.map((_,index)=>treeHeight(sceneCounts(index)));scene=sceneGeometry(heights);
  const maxWidth=Math.max(...drafts.map((_,index)=>treeWidth(sceneCounts(index))));
  scene.trees[2].x=Math.max(2400,maxWidth+400);scene.bounds.width=Math.max(3740,scene.trees[2].x+maxWidth+440);
  all('[data-question-card]').forEach((card,index)=>{card.style.setProperty('--mm-scene-x',`${scene.trees[index].x}px`);card.style.setProperty('--mm-scene-y',`${scene.trees[index].y}px`);card.style.height=`${heights[index]}px`;});
  const root=$('.mm-root');root.style.left=`${scene.root.x}px`;root.style.top=`${scene.root.y}px`;
  const wires=$('.mm-connections'),bounds=scene.bounds;wires.setAttribute('viewBox',`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
  for(const [name,value] of Object.entries({left:bounds.x,top:bounds.y,width:bounds.width,height:bounds.height}))wires.style.setProperty(`--mm-scene-${name}`,`${value}px`);
  wires.innerHTML=scene.trees.map((tree,index)=>{
   const rx=scene.root.x,ry=scene.root.y,tx=tree.x+460;
   // Separate ports on the topic and outer edges of question nodes.
   const d=index===0
    ?`M${rx+104} ${ry}C${rx+40} ${ry-200} ${tx+100} ${tree.y+330} ${tx} ${tree.y+141}`
    :index===1
     ?`M${rx+22} ${ry+128}C${rx-250} ${ry+220} ${tx-180} ${tree.y-210} ${tx} ${tree.y+15}`
     :`M${rx+186} ${ry+128}C${rx+460} ${ry+220} ${tx+180} ${tree.y-210} ${tx} ${tree.y+15}`;
   return `<path class="mm-line mm-line-${index}" d="${d}"/>`;
  }).join('');
  world.style.width=`${bounds.width}px`;world.style.height=`${bounds.height}px`;
 }
 function cameraBounds(scope){
  if(scope==='overview')return scene.bounds;
  const origin=scene.trees[current],counts=editorCounts();
  if(scope==='answer')return {x:origin.x-50,y:origin.y+90,width:540,height:390};
  if(scope==='expand')return {x:origin.x+365,y:origin.y+105,width:Math.max(590,treeWidth(counts)-340),height:540};
  if(scope==='entry')return {x:origin.x+branchLeft(branch)-80,y:origin.y+branchTop(counts,branch)+115+(methodBranches()[branch]?.length||0)*88-120,width:450,height:310};
  if(scope==='branch')return {x:origin.x+branchLeft(branch)-100,y:origin.y+branchTop(counts,branch)-90,width:460,height:220+((methodBranches()[branch]?.length||0)+1)*88};
  const bottom=Math.max(300,...counts.map((count,index)=>branchTop(counts,index)+115+count*88-16));
  return {x:origin.x-25,y:origin.y-20,width:treeWidth(counts)+50,height:bottom+60};
 }
 function syncMapInteraction(){
  all('[data-question-card]').forEach((card,index)=>{card.querySelector('.mm-branch-detail').inert=index!==current||main.dataset.mapView==='overview';card.querySelector('[data-map-question]').setAttribute('aria-expanded',String(index===current&&main.dataset.mapView!=='overview'));});
 }
 function flyTo(scope,{animate=true}={}){
  cameraScope=scope;main.dataset.cameraTarget=scope;main.dataset.mapView=scope==='overview'?'overview':'focused';syncScene();syncMapInteraction();
  if(scope==='manual'){driver.refresh();return;}
  const view=fitCamera(cameraBounds(scope),{width:viewport.clientWidth||700,height:viewport.clientHeight||520},{padding:24,maxScale:['answer','branch','entry'].includes(scope)?1.08:.95});
  driver.moveTo(view,{animate:animate&&!reduced.matches,duration:['branch','answer','entry'].includes(scope)?850:1150});
 }
 function showOverview(){cancelIntro();stopPronunciation();flyTo('overview');}
 const root=$('.mm-root');root.tabIndex=0;root.setAttribute('role','button');root.setAttribute('aria-label','Về toàn cảnh Mind Map');root.addEventListener('click',showOverview);root.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();showOverview();}});
 // Keyboard focus must move the camera instead of disappearing outside the crop.
 world.addEventListener('focusin',event=>{
  if(internalMapFocus||!driver.current)return;viewport.scrollTop=0;viewport.scrollLeft=0;
  const rect=event.target.getBoundingClientRect(),frame=viewport.getBoundingClientRect();if(!rect.width||!frame.width)return;
  if(rect.left>=frame.left+10&&rect.right<=frame.right-10&&rect.top>=frame.top+10&&rect.bottom<=frame.bottom-10)return;
  cancelIntro();const view=driver.current,rx=viewport.clientWidth/frame.width,ry=viewport.clientHeight/frame.height;
  const cx=view.cx+((rect.left+rect.width/2-frame.left)*rx-viewport.clientWidth/2)/view.scale,cy=view.cy+((rect.top+rect.height/2-frame.top)*ry-viewport.clientHeight/2)/view.scale;
  const scale=Math.min(view.scale,(viewport.clientWidth-48)/(rect.width*rx/view.scale),(viewport.clientHeight-48)/(rect.height*ry/view.scale));
  cameraScope='manual';main.dataset.cameraTarget='manual';driver.moveTo({cx,cy,scale},{animate:!reduced.matches,duration:750});
 },{signal:mapLifecycle.signal});
 const eventPoint=event=>{const rect=viewport.getBoundingClientRect();return {x:(event.clientX-rect.left)*(viewport.clientWidth/rect.width),y:(event.clientY-rect.top)*(viewport.clientHeight/rect.height)};};
 viewport.addEventListener('wheel',event=>{event.preventDefault();cancelIntro();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?viewport.clientHeight:1);driver.zoomAt(Math.exp(-Math.max(-200,Math.min(200,delta))*.0025),eventPoint(event));cameraScope='manual';main.dataset.cameraTarget='manual';main.dataset.mapView='focused';syncMapInteraction();},{passive:false,signal:mapLifecycle.signal});
 viewport.addEventListener('pointerdown',event=>{if(event.button!==0||event.target.closest('button,input,textarea,a,[role="button"]'))return;cancelIntro();driver.cancel();drag={id:event.pointerId,point:eventPoint(event)};viewport.setPointerCapture(event.pointerId);main.dataset.mapDragging='true';},{signal:mapLifecycle.signal});
 viewport.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;const point=eventPoint(event);driver.panBy(point.x-drag.point.x,point.y-drag.point.y);drag.point=point;cameraScope='manual';main.dataset.cameraTarget='manual';},{signal:mapLifecycle.signal});
 const endDrag=()=>{drag=null;delete main.dataset.mapDragging;};viewport.addEventListener('pointerup',endDrag,{signal:mapLifecycle.signal});viewport.addEventListener('pointercancel',endDrag,{signal:mapLifecycle.signal});
 all('[data-map-zoom]').forEach(button=>button.addEventListener('click',()=>{cancelIntro();driver.zoomAt(button.dataset.mapZoom==='in'?1.3:1/1.3);cameraScope='manual';main.dataset.cameraTarget='manual';main.dataset.mapView='focused';syncMapInteraction();}));

 main.dataset.mapView='overview';main.dataset.mapQuestion='0';
 function save(){let status=$('[data-save-status]');if(!status){status=doc.createElement('p');status.dataset.saveStatus='';status.setAttribute('role','status');$('.mm-editor-footer').prepend(status);}try{win.sessionStorage.setItem(DRAFT_KEY,JSON.stringify(drafts));status.textContent='';return true;}catch{status.textContent='Chưa lưu được ý của bạn trong phiên này.';return false;}}
 function camera({reframe=false}={}){
  syncScene();if(!driver.current||reframe&&cameraScope!=='manual')flyTo(cameraScope,{animate:false});else driver.refresh();
 }
 function cancelIntro(){intro=false;clearTimeout(typingTimer);clearTimeout(focusTimer);$('[data-typed-question]').textContent=fixture.questions[0].prompt;main.dataset.typing='false';}
 main.speakingStagePrepare=()=>{cancelIntro();stopPronunciation();driver.cancel();};
 function methodBranches(){return drafts[current].methodDrafts[technique]||[];}
 function currentOutline(){return outlineFor(current,technique,drafts[current]);}
 function editorCounts(){return methodBranches().map(words=>words.length+1);}
 function ensureMethod(){return drafts[current].methodDrafts[technique]||=currentOutline().map(()=>[]);}
 function assignPhrase(word,index=branch,custom=false){
  word=word.trim().slice(0,120);if(!word||!currentOutline()[index])return false;
  const target=ensureMethod();
  if(!custom&&!currentOutline()[index].words.includes(word))return false;
  if(custom&&!currentOutline()[index].words.includes(word)){
   const pools=drafts[current].customPhrases[technique]||=[];(pools[index]||=[]).push(word);
  }
  if(target[index].includes(word))return false;
  target[index].push(word);drafts[current].prepared=true;renderOutline();if(panel==='branch')renderPhrases();camera();save();
  return true;
 }
 function removePhrase(word,index=branch){
  const target=methodBranches()[index],position=target?.indexOf(word);if(position===undefined||position<0)return;
  const fromMap=doc.activeElement?.hasAttribute('data-outline-phrase');
  target.splice(position,1);mapInput=null;panel='branch';branch=index;updatePanel();camera();save();
  if(fromMap){const leaves=$tree(`[data-branch-leaves="${index}"]`);focusMap((leaves.querySelectorAll('[data-outline-phrase]')[position]||leaves.querySelectorAll('[data-outline-phrase]')[position-1]||leaves.querySelector('[data-add-phrase]')));}
 }
 function syncPronunciation(){
  all('[data-phrase-audio]').forEach(button=>{
   const playing=button.dataset.phraseAudio===spokenWord;button.setAttribute('aria-pressed',String(playing));button.innerHTML=icon(playing?'speakerPlaying':'speaker');
   button.setAttribute('aria-label',`${playing?'Dừng phát âm':'Nghe phát âm'}: ${button.dataset.phraseAudio}`);button.title=button.getAttribute('aria-label');
  });
 }
 function stopPronunciation(){
  const active=speech,media=playback;speech=null;playback=null;spokenWord=null;if(active)win.speechSynthesis?.cancel();if(media){media.pause();media.removeAttribute('src');media.load();}syncPronunciation();
 }
 function playPhrase(word){
  cancelIntro();if(spokenWord===word){stopPronunciation();return;}stopPronunciation();
  if(phraseAudio[word]){
   const media=doc.createElement('audio');media.preload='none';media.src=phraseAudio[word];playback=media;spokenWord=word;syncPronunciation();
   const finish=()=>{if(playback!==media)return;playback=null;spokenWord=null;syncPronunciation();};
   media.addEventListener('ended',finish,{once:true});media.addEventListener('error',finish,{once:true});
   media.play().catch(finish);return;
  }
  if(!win.speechSynthesis||!win.SpeechSynthesisUtterance)return;
  const utterance=new win.SpeechSynthesisUtterance(word),voices=win.speechSynthesis.getVoices();
  const voice=voices.find(v=>v.lang.toLowerCase().startsWith('en-gb'))||voices.find(v=>v.lang.toLowerCase().startsWith('en'));
  utterance.lang=voice?.lang||'en-GB';if(voice)utterance.voice=voice;utterance.rate=.9;
  speech=utterance;spokenWord=word;syncPronunciation();
  const finish=()=>{if(speech!==utterance)return;speech=null;spokenWord=null;syncPronunciation();};
  utterance.onend=finish;utterance.onerror=finish;
  try{win.speechSynthesis.cancel();win.speechSynthesis.speak(utterance);}catch{finish();}
 }
 function renderFindResults(){
  $('[data-find-output]').hidden=!findDemoShown;
  const focused=doc.activeElement?.dataset.findWord;
  const container=$('[data-find-results]');container.replaceChildren();if(!findDemoShown)return;
  // UI fixture only: arbitrary input reveals this fixed sample; no matching or API call.
  for(const word of ['feel at home','feel welcome','relaxed lifestyle']){
   const chosen=methodBranches()[branch]?.includes(word)||false,option=doc.createElement('div');option.className='mm-phrase-option';option.dataset.selected=String(chosen);
   const audio=doc.createElement('button');audio.type='button';audio.className='mm-phrase-audio';audio.dataset.phraseAudio=word;audio.addEventListener('click',()=>playPhrase(word));
   const button=doc.createElement('button');button.type='button';button.dataset.findWord=word;button.className='mm-find-choice';button.setAttribute('aria-pressed',String(chosen));button.setAttribute('aria-label',`${chosen?'Bỏ chọn':'Thêm vào nhánh'}: ${word}`);
   const english=doc.createElement('strong');english.lang='en';english.textContent=word;
   const meaning=doc.createElement('span');meaning.className='mm-phrase-meaning';meaning.lang='vi';meaning.textContent=phraseMeanings[word];
   const action=doc.createElement('span');action.className='mm-find-action';action.innerHTML=chosen?icon('check'):'';action.hidden=!chosen;action.setAttribute('aria-hidden','true');button.append(english,meaning,action);
   button.addEventListener('click',()=>{if(methodBranches()[branch]?.includes(word))removePhrase(word);else assignPhrase(word,branch,true);});option.append(audio,button);container.append(option);
  }
  syncPronunciation();if(focused)[...container.querySelectorAll('[data-find-word]')].find(button=>button.dataset.findWord===focused)?.focus();
 }
 function renderPhrases(){
  const context=`${current}:${technique}:${branch}`;
  if(findContext!==context){findContext=context;findDemoShown=false;$('[data-find-query]').value='';$('[data-find-submit]').disabled=true;}
  const active=doc.activeElement,focused=active?.dataset.phrase,focusedAudio=active?.dataset.phraseAudio;
  const outline=currentOutline()[branch];$('[data-branch-title]').textContent=outline.label;
  $('.mm-phrase-help>span').textContent=outline.words.length?'Kéo cụm từ vào nhánh, hoặc nhấn để thêm.':'Dùng dấu + trên nhánh để thêm từ / cụm từ của bạn.';
  $('[data-phrases]').replaceChildren(...outline.words.map(word=>{
   const option=doc.createElement('div');option.className='mm-phrase-option';option.dataset.selected=String(methodBranches()[branch]?.includes(word)||false);
   const audio=doc.createElement('button');audio.type='button';audio.className='mm-phrase-audio';audio.dataset.phraseAudio=word;audio.setAttribute('aria-pressed','false');
   audio.disabled=!phraseAudio[word]&&(!win.speechSynthesis||!win.SpeechSynthesisUtterance);audio.addEventListener('click',()=>playPhrase(word));
   const button=doc.createElement('button');button.type='button';button.dataset.phrase=word;button.draggable=true;button.setAttribute('aria-label',word);button.setAttribute('aria-pressed',option.dataset.selected);
   const english=doc.createElement('strong');english.lang='en';english.textContent=word;button.append(english);
   if(phraseMeanings[word]){const meaning=doc.createElement('span');meaning.className='mm-phrase-meaning';meaning.lang='vi';meaning.textContent=phraseMeanings[word];button.append(meaning);}
   const selected=doc.createElement('span');selected.className='mm-phrase-selected';selected.innerHTML=icon('check');selected.setAttribute('aria-hidden','true');button.append(selected);
   button.addEventListener('click',()=>methodBranches()[branch]?.includes(word)?removePhrase(word):assignPhrase(word));
   button.addEventListener('dragstart',event=>{event.dataTransfer?.setData('application/x-bespark-mindmap',JSON.stringify({question:current,method:technique,branch,word}));if(event.dataTransfer)event.dataTransfer.effectAllowed='copy';});
   option.append(audio,button);return option;
  }));
  renderFindResults();syncPronunciation();
  if(focused)all('[data-phrase]').find(button=>button.dataset.phrase===focused)?.focus();
  else if(focusedAudio)all('[data-phrase-audio]').find(button=>button.dataset.phraseAudio===focusedAudio)?.focus();
 }
 function openMapInput(type,index=branch){
  cancelIntro();mapInput={type,index,value:''};if(type==='phrase'){panel='branch';branch=index;}updatePanel();camera();flyTo(type==='phrase'?'entry':'expand');focusMap($tree('[data-map-input]'));
 }
 function closeMapInput(){
  const previous=mapInput;mapInput=null;renderOutline();camera();
  focusMap(previous?.type==='branch'?$tree('[data-add-branch]'):$tree(`[data-add-phrase="${previous?.index}"]`));
 }
 function mapEntry(){
  const entry=mapInput,form=doc.createElement('form');form.className='mm-map-entry';form.dataset.mapForm=entry.type;
  const input=doc.createElement('input');input.type='text';input.dataset.mapInput=entry.type;input.maxLength=entry.type==='branch'?80:120;input.placeholder=entry.type==='branch'?'Tên nhánh dàn ý':'Từ / cụm từ';input.setAttribute('aria-label',input.placeholder);input.value=entry.value;input.required=true;
  input.addEventListener('input',()=>{entry.value=input.value;input.setCustomValidity('');});
  const submit=doc.createElement('button');submit.type='submit';submit.innerHTML=icon('check');submit.setAttribute('aria-label',entry.type==='branch'?'Thêm nhánh':'Thêm cụm từ');submit.title=submit.getAttribute('aria-label');
  const cancel=doc.createElement('button');cancel.type='button';cancel.innerHTML=icon('remove');cancel.setAttribute('aria-label','Hủy nhập');cancel.title='Hủy nhập';cancel.addEventListener('click',closeMapInput);
  form.append(input,submit,cancel);form.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeMapInput();}});
  form.addEventListener('submit',event=>{
   event.preventDefault();const value=input.value.trim();if(!value){input.focus();return;}
   if(entry.type==='branch'){
    if(currentOutline().some(item=>item.label.toLocaleLowerCase()===value.toLocaleLowerCase())){input.setCustomValidity('Nhánh này đã có trên bản đồ.');input.reportValidity();return;}
    const target=ensureMethod();(drafts[current].customOutlines[technique]||=[]).push(value);target.push([]);drafts[current].prepared=true;
    branch=target.length-1;panel='branch';mapInput=null;updatePanel();camera();syncAnswers();save();flyTo('branch');focusMap($tree(`[data-outline-branch="${branch}"]`));
   }else{
    mapInput=null;assignPhrase(value,entry.index,true);renderOutline();renderPhrases();camera();
    const leaves=$tree(`[data-branch-leaves="${entry.index}"]`);focusMap([...leaves.querySelectorAll('[data-outline-phrase]')].find(leaf=>leaf.dataset.outlinePhrase===value));
   }
  });return form;
 }
 function renderOutline(){
  const focused=doc.activeElement?.dataset.outlineBranch,focusedQuestion=doc.activeElement?.dataset.outlineQuestion;
  all('[data-outline]').forEach((container,index)=>{
   const draft=drafts[index],method=draft.technique,branches=draft.methodDrafts[method],counts=(branches||[]).map(words=>words.length+1);
   container.replaceChildren();$(`[data-tree-wires="${index}"]`).innerHTML=treeLinks(counts);$(`[data-tree-wires="${index}"] svg`).style.setProperty('width',`${treeWidth(counts)}px`,'important');if(!branches)return;
   const addBranch=doc.createElement('button');addBranch.type='button';addBranch.className='mm-map-add mm-add-outline';addBranch.dataset.addBranch='';addBranch.innerHTML=icon('expand')+'<span>Thêm nhánh</span>';addBranch.addEventListener('click',()=>{if(index!==current)select(index,'expand','expand');openMapInput('branch');});
   const branchEntry=index===current&&mapInput?.type==='branch'?mapEntry():addBranch;branchEntry.classList.add('mm-add-outline');container.append(branchEntry);
   outlineFor(index,method,draft).forEach((item,n)=>{
    const left=branchLeft(n),top=branchTop(counts,n),button=doc.createElement('button');button.type='button';button.dataset.outlineBranch=String(n);button.dataset.outlineQuestion=String(index);button.className='mm-outline-node';button.style.left=`${left}px`;button.style.top=`${top}px`;button.setAttribute('aria-pressed',String(index===current&&panel==='branch'&&branch===n));
    const title=doc.createElement('strong');title.textContent=item.label;button.append(title);
    const leaves=doc.createElement('div');leaves.className='mm-tree-leaves';leaves.dataset.branchLeaves=String(n);leaves.style.left=`${left}px`;leaves.style.top=`${top+115}px`;
    for(const phrase of branches[n]||[]){const leaf=doc.createElement('button');leaf.type='button';leaf.dataset.outlinePhrase=phrase;leaf.lang='en';leaf.textContent=phrase;leaf.setAttribute('aria-label',`Bỏ chọn ${phrase}`);leaf.title=`Bỏ chọn ${phrase}`;leaf.insertAdjacentHTML('beforeend',icon('remove'));leaf.addEventListener('click',()=>{if(index!==current)select(index,'branch','branch',n);removePhrase(phrase,n);});leaves.append(leaf);}
    const addPhrase=doc.createElement('button');addPhrase.type='button';addPhrase.className='mm-map-add';addPhrase.dataset.addPhrase=String(n);addPhrase.innerHTML=icon('expand')+'<span>Thêm cụm từ</span>';addPhrase.addEventListener('click',()=>{if(index!==current)select(index,'branch','branch',n);openMapInput('phrase',n);});
    leaves.append(index===current&&mapInput?.type==='phrase'&&mapInput.index===n?mapEntry():addPhrase);
    button.addEventListener('click',()=>{select(index,'branch','branch',n);$('[data-phrase]')?.focus();});
    button.addEventListener('dragover',event=>{event.preventDefault();});
    button.addEventListener('drop',event=>{event.preventDefault();try{const data=JSON.parse(event.dataTransfer.getData('application/x-bespark-mindmap'));if(data.question===index&&data.method===method&&data.branch===n){if(index!==current)select(index,'branch','branch',n);assignPhrase(data.word,n);}}catch{}});container.append(button,leaves);
   });
  });
  syncScene();syncMapInteraction();
  if(focused!==undefined&&Number(focusedQuestion)===current)focusMap($tree(`[data-outline-branch="${focused}"]`));
 }
 function updatePanel(){
  stopPronunciation();
  all('[data-panel]').forEach(el=>el.hidden=el.dataset.panel!==panel);
  $('[data-answer-suggestions]').hidden=!hints;$('[data-answer-hints]').setAttribute('aria-expanded',String(hints));
  all('[data-map-answer]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===current&&panel==='answer')));
  all('[data-map-expand]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===current&&panel==='expand')));
  if(panel==='branch')renderPhrases();renderOutline();
 }
 function renderMethods(){
  const focused=doc.activeElement?.dataset.technique;
  const recommended=current===2?3:0,order=[recommended,...[0,1,2,3].filter(i=>i!==recommended)];
  $('.mm-techniques').innerHTML=order.map(i=>`<button type="button" data-technique="${i}" aria-pressed="${i===technique&&!!drafts[current].methodDrafts[technique]}">${icon(techniques[i].icon)}<span>${techniques[i].name}</span>${i===recommended?'<small data-recommend>Recommend</small>':''}</button>`).join('');
  all('[data-technique]').forEach(button=>button.addEventListener('click',()=>{cancelIntro();mapInput=null;viewport.scrollTop=0;technique=Number(button.dataset.technique);drafts[current].technique=technique;drafts[current].prepared=true;drafts[current].methodDrafts[technique]||=currentOutline().map(()=>[]);renderMethods();syncAnswers();updatePanel();camera();flyTo('question');save();}));
  if(focused!==undefined)$(`[data-technique="${focused}"]`)?.focus();
 }
 function renderAnswers(){
  $('[data-answer-suggestions]').replaceChildren(...answerSuggestions[current].map((text,index)=>{
   const button=doc.createElement('button');button.type='button';button.dataset.answerSuggestion=String(index);button.lang='en';button.textContent=text;
   button.addEventListener('click',()=>{cancelIntro();drafts[current].answer=text;drafts[current].prepared=true;answer.value=text;$('[data-answer-count]').textContent=`${text.length} / 300`;syncAnswers();save();answer.focus();});return button;
  }));syncAnswers();
 }
 function syncAnswers(){
  all('[data-answer-suggestion]').forEach((b,i)=>b.setAttribute('aria-pressed',String(answerSuggestions[current][i]===drafts[current].answer)));
  all('[data-branch-answer]').forEach((b,i)=>b.textContent=drafts[i].answer||'Ý chính của bạn');
  all('[data-branch-method]').forEach((b,i)=>b.textContent=drafts[i].methodDrafts[drafts[i].technique]?techniques[drafts[i].technique].name:'Mở rộng ý');
 }
 function update(){
  main.dataset.mapQuestion=String(current);technique=drafts[current].technique;
  $('[data-editor-number]').textContent=`Q${current+1}`;$('[data-editor-question]').textContent=fixture.questions[current].prompt;answer.value=drafts[current].answer;
  $('[data-answer-count]').textContent=`${answer.value.length} / 300`;
  all('[data-map-question]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===current)));all('[data-question-card]').forEach((b,i)=>b.setAttribute('aria-current',String(i===current)));
  renderAnswers();
  $('[data-map-prev]').disabled=current===0;$('[data-map-next]').disabled=current===2;
  const header=doc.querySelector('.speaking-question-progress');if(header)[...header.children].forEach((b,i)=>{b.dataset.focused=String(i===current);b.dataset.questionState=i===current?'current':'available';if(i===current)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  renderMethods();updatePanel();camera();
 }
 function select(index,nextPanel='answer',scope='question',nextBranch=0){cancelIntro();mapInput=null;viewport.scrollTop=0;viewport.scrollLeft=0;current=index;panel=nextPanel;hints=false;branch=nextBranch;main.dataset.cameraReady='true';main.dataset.mapView='focused';update();flyTo(scope);}
 all('[data-map-question]').forEach((b,i)=>b.addEventListener('click',()=>select(i)));
 $('[data-map-prev]').addEventListener('click',()=>{if(current>0)select(current-1);});$('[data-map-next]').addEventListener('click',()=>{if(current<2)select(current+1);});
 $('[data-map-overview]').addEventListener('click',showOverview);
 all('[data-map-answer]').forEach((b,i)=>b.addEventListener('click',()=>{select(i,'answer','answer');answer.focus();}));
 all('[data-map-expand]').forEach((b,i)=>b.addEventListener('click',()=>{select(i,'expand','expand');$('[data-technique]')?.focus();}));
 $('[data-answer-hints]').addEventListener('click',()=>{hints=!hints;updatePanel();});
 answer.addEventListener('focus',cancelIntro);answer.addEventListener('input',()=>{cancelIntro();drafts[current].answer=answer.value;drafts[current].prepared=true;$('[data-answer-count]').textContent=`${answer.value.length} / 300`;syncAnswers();save();});
 $('.mm-continue').addEventListener('click',event=>{if(!save())event.preventDefault();});
 const onResize=()=>camera({reframe:true});
 const observer=win.ResizeObserver?new win.ResizeObserver(onResize):null;observer?.observe(viewport);
 const onReduced=()=>{cancelIntro();driver.cancel();flyTo(cameraScope,{animate:false});};
 const onPageHide=()=>{cancelIntro();stopPronunciation();driver.cancel();},onVisibility=()=>{if(doc.hidden){stopPronunciation();driver.cancel();}};
 win.addEventListener('resize',onResize);win.addEventListener('pagehide',onPageHide,{once:true});doc.addEventListener('visibilitychange',onVisibility);reduced.addEventListener('change',onReduced);
 update();
 if(!reduced.matches){
  const full=fixture.questions[0].prompt;let count=0;$('[data-typed-question]').textContent='';main.dataset.typing='true';
  function type(){if(!intro||!main.isConnected)return;$('[data-typed-question]').textContent=full.slice(0,++count);if(count<full.length)typingTimer=setTimeout(type,45);else{main.dataset.typing='false';focusTimer=setTimeout(()=>{if(intro&&main.isConnected){main.dataset.cameraReady='true';flyTo('question');}},1500);}}
  typingTimer=setTimeout(type,650);
 }
 return main.speakingMindmapDispose=()=>{cancelIntro();stopPronunciation();driver.dispose();mapLifecycle.abort();link.remove();observer?.disconnect();win.removeEventListener('resize',onResize);win.removeEventListener('pagehide',onPageHide);doc.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener?.('change',onReduced);};
}
