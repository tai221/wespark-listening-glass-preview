import {treeLinks,treeHeight,TREE_WIDTH} from './speaking-mindmap-tree.mjs';
import {fixture} from './speaking-feedback-model.mjs';

const paths={map:'M4 6h6v5H4zM15 4h6v5h-6zM14 16h6v5h-6zM10 8h5m-8 3v7h7',answer:'M21 11a8 8 0 0 1-8 8H8l-5 3V11a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z',expand:'M6 12h12M12 6v12',cause:'M5 6h5v5H5zM14 14h5v5h-5zM10 8h7v6',compare:'M8 4v16m8-16v16M4 8h8m0 8h8',example:'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9z',future:'M4 6h16v15H4zM8 3v6m8-6v6M4 12h16',arrow:'M5 12h14m-6-6 6 6-6 6',chevron:'m9 5 7 7-7 7',book:'M12 5c-4-3-8-2-9-1v15c3-2 6-2 9 0 3-2 6-2 9 0V4c-3-2-6-2-9 1Zm0 0v14',home:'m3 11 9-8 9 8M5 9v12h14V9M10 21v-7h4v7'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
import {techniques,answerSuggestions,DRAFT_KEY,hydrateDrafts,outlineFor} from './speaking-mindmap-model.mjs';
const positions=[{x:70,y:75,w:330},{x:560,y:230,w:260},{x:90,y:450,w:310}];

export function mountSpeakingMindmap(main){
 main.speakingMindmapDispose?.();
 const doc=main.ownerDocument,win=doc.defaultView,reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
 doc.body.dataset.speakingMindmap='';main.classList.add('mindmap-studio');
 const link=doc.createElement('link');link.rel='stylesheet';link.href='speaking-mindmap.css';doc.head.append(link);
 let current=0,technique=0,panel='answer',branch=0,hints=false,typingTimer,focusTimer,intro=true,drafts=hydrateDrafts(null);
 try{drafts=hydrateDrafts(JSON.parse(win.sessionStorage.getItem(DRAFT_KEY)));}catch{}
 main.innerHTML=`<header class="mm-heading"><div class="mm-heading-copy"><span class="mm-mascot-scene"><img class="mm-mascot" src="../assets/spark-mindmap-laptop-v1.webp" width="120" height="80" alt="Spark đeo tai nghe, lên ý tưởng Mind Map trên laptop"></span><div><h1>Xây dựng Mind Map</h1><p>Sắp xếp ý chính, mở rộng ý nhanh.</p></div></div><ol class="mm-steps" aria-label="Các bước luyện nói"><li aria-current="step"><b>1</b><span>Xây mindmap</span></li><li><b>2</b><span>Luyện nói</span></li><li><b>3</b><span>Nhận phản hồi</span></li></ol></header>
 <div class="mm-layout"><section class="mm-map" aria-label="Mind Map My hometown"><div class="mm-map-tools"><button type="button" data-map-overview>${icon('map')}<span>Toàn cảnh</span></button></div><div class="mm-viewport"><div class="mm-world"><svg class="mm-connections" viewBox="0 0 840 620" aria-hidden="true"><path class="mm-line mm-line-0" d="M420 320C420 205 330 265 235 190"/><path class="mm-line mm-line-1" d="M420 320C515 320 490 285 590 285"/><path class="mm-line mm-line-2" d="M420 350C420 450 290 420 245 485"/></svg><div class="mm-root">${icon('home')}<strong>My hometown</strong></div>${fixture.questions.map((q,i)=>`<section class="mm-branch" data-question-card="${i}" style="left:${positions[i].x}px;top:${positions[i].y}px;width:${positions[i].w}px"><div class="mm-tree-wires" data-tree-wires="${i}"></div><span class="mm-number">Q${i+1}</span><button type="button" class="mm-question-control" data-map-question="${i}" aria-label="Câu ${i+1}: ${q.prompt}"><span class="mm-branch-title" lang="en" ${i===0?'data-typed-question':''}>${q.prompt}</span>${icon('chevron')}</button><div class="mm-branch-detail"><button type="button" data-map-answer="${i}">${icon('answer')}Answer<span data-branch-answer="${i}">Ý chính của bạn</span></button><button type="button" data-map-expand="${i}">${icon('expand')}Expand<span data-branch-method="${i}">Mở rộng ý</span></button><div class="mm-outline" data-outline="${i}"></div></div></section>`).join('')}</div></div></section>
 <section class="mm-editor" aria-label="Chuẩn bị câu trả lời"><header class="mm-editor-heading"><span class="mm-number" data-editor-number>Q1</span><h2 data-editor-question lang="en"></h2><div class="mm-question-arrows"><button type="button" data-map-prev aria-label="Câu trước">${icon('chevron')}</button><button type="button" data-map-next aria-label="Câu tiếp theo">${icon('chevron')}</button></div></header><div class="mm-editor-content"><section data-panel="answer"><div class="mm-panel-title"><h3 class="mm-field-label" id="mm-answer-label">${icon('answer')}Answer</h3></div><div class="mm-answer-wrap"><textarea id="mm-answer" maxlength="300" placeholder="Ý chính của bạn" aria-label="Ý chính của bạn" aria-describedby="mm-count"></textarea><span id="mm-count" data-answer-count>0 / 300</span></div><div class="mm-answer-tools"><button type="button" data-answer-hints aria-label="Gợi ý câu trả lời" title="Gợi ý câu trả lời" aria-expanded="false" aria-controls="mm-suggestions">${icon('example')}</button></div><div id="mm-suggestions" class="mm-answer-suggestions" data-answer-suggestions hidden role="group" aria-labelledby="mm-answer-label"></div></section><section data-panel="expand" hidden><h3 class="mm-field-label">${icon('expand')}Expand</h3><p class="mm-panel-help">Chọn cách mở rộng để tạo các nhánh trên bản đồ.</p><div class="mm-techniques" role="group" aria-label="Cách mở rộng ý"></div></section><section data-panel="branch" hidden><h3 class="mm-field-label" data-branch-title></h3><p class="mm-panel-help">Kéo cụm từ vào nhánh, hoặc nhấn để thêm.</p><div class="mm-phrases" data-phrases></div><div class="mm-assignment-status" data-phrase-status role="status"></div></section></div><div class="mm-editor-footer"><p data-save-status role="status"></p><a class="lesson-footer-button lesson-footer-primary mm-continue" href="key-speaking-produce.html">${icon('arrow')}<span>Luyện nói</span></a></div></section></div>`;
 const $=s=>main.querySelector(s),all=s=>[...main.querySelectorAll(s)],world=$('.mm-world'),viewport=$('.mm-viewport'),answer=$('textarea');
 $('.mm-layout').prepend($('.mm-editor'));
 main.dataset.mapView='overview';main.dataset.mapQuestion='0';
 function save(){let status=$('[data-save-status]');if(!status){status=doc.createElement('p');status.dataset.saveStatus='';status.setAttribute('role','status');$('.mm-editor-footer').prepend(status);}try{win.sessionStorage.setItem(DRAFT_KEY,JSON.stringify(drafts));status.textContent='';return true;}catch{status.textContent='Chưa lưu được ý của bạn trong phiên này.';return false;}}
 function camera(){
  const width=viewport.clientWidth||700,height=viewport.clientHeight||520,fit=Math.min(width/880,height/660),focused=main.dataset.mapView==='focused',sceneHeight=treeHeight(methodBranches().map(words=>words.length)),scale=focused?Math.min(width/(TREE_WIDTH+36),height/(sceneHeight+36)):fit;
  const cx=focused?TREE_WIDTH/2:420,cy=focused?sceneHeight/2:310;
  world.style.transform=`translate(${width/2-cx*scale}px,${height/2-cy*scale}px) scale(${scale})`;
 }
 function cancelIntro(){intro=false;clearTimeout(typingTimer);clearTimeout(focusTimer);$('[data-typed-question]').textContent=fixture.questions[0].prompt;main.dataset.typing='false';}
 main.speakingStagePrepare=cancelIntro;
 function methodBranches(){return drafts[current].methodDrafts[technique]||[];}
 function assignPhrase(word,index=branch){
  const target=drafts[current].methodDrafts[technique]||=outlineFor(current,technique).map(()=>[]);
  if(!outlineFor(current,technique)[index]?.words.includes(word)||target[index].includes(word)||target[index].length>=8)return;
  target[index].push(word);drafts[current].prepared=true;renderOutline();renderPhrases();camera();save();
  $('[data-phrase-status]').textContent=`Đã thêm “${word}”.`;
 }
 function renderPhrases(){
  const focused=doc.activeElement?.dataset.phrase;
  const outline=outlineFor(current,technique)[branch];$('[data-branch-title]').textContent=outline.label;
  $('[data-phrases]').replaceChildren(...outline.words.map(word=>{
   const button=doc.createElement('button');button.type='button';button.dataset.phrase=word;button.lang='en';button.draggable=true;button.textContent=word;button.setAttribute('aria-pressed',String(methodBranches()[branch]?.includes(word)||false));
   button.addEventListener('click',()=>assignPhrase(word));button.addEventListener('dragstart',event=>{event.dataTransfer?.setData('application/x-bespark-mindmap',JSON.stringify({question:current,method:technique,branch,word}));if(event.dataTransfer)event.dataTransfer.effectAllowed='copy';});return button;
  }));
  if(focused)all('[data-phrase]').find(button=>button.dataset.phrase===focused)?.focus();
 }
 function renderOutline(){
  const focused=doc.activeElement?.dataset.outlineBranch;
  all('[data-outline]').forEach((container,index)=>{
   container.replaceChildren();$(`[data-tree-wires="${index}"]`).innerHTML=index===current?treeLinks(methodBranches().map(words=>words.length)):'';if(index!==current||!drafts[index].methodDrafts[technique])return;
   outlineFor(current,technique).forEach((item,n)=>{
    const button=doc.createElement('button');button.type='button';button.dataset.outlineBranch=String(n);button.className='mm-outline-node';button.setAttribute('aria-pressed',String(panel==='branch'&&branch===n));
    const title=doc.createElement('strong');title.textContent=item.label;button.append(title);
    const leaves=doc.createElement('div');leaves.className='mm-tree-leaves';leaves.dataset.branchLeaves=String(n);
    for(const phrase of methodBranches()[n]||[]){const text=doc.createElement('span');text.dataset.outlinePhrase='';text.lang='en';text.textContent=phrase;leaves.append(text);}
    button.addEventListener('click',()=>{panel='branch';branch=n;updatePanel();$('[data-phrase]')?.focus();});
    button.addEventListener('dragover',event=>{event.preventDefault();});
    button.addEventListener('drop',event=>{event.preventDefault();try{const data=JSON.parse(event.dataTransfer.getData('application/x-bespark-mindmap'));if(data.question===current&&data.method===technique&&data.branch===n)assignPhrase(data.word,n);}catch{}});container.append(button,leaves);
   });
  });
  if(focused!==undefined)$(`[data-outline-branch="${focused}"]`)?.focus();
 }
 function updatePanel(){
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
  all('[data-technique]').forEach(button=>button.addEventListener('click',()=>{cancelIntro();technique=Number(button.dataset.technique);drafts[current].technique=technique;drafts[current].prepared=true;drafts[current].methodDrafts[technique]||=outlineFor(current,technique).map(()=>[]);renderMethods();syncAnswers();updatePanel();camera();save();}));
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
 function select(index,nextPanel='answer'){cancelIntro();current=index;panel=nextPanel;hints=false;branch=0;main.dataset.cameraReady='true';main.dataset.mapView='focused';update();}
 all('[data-map-question]').forEach((b,i)=>b.addEventListener('click',()=>select(i)));
 $('[data-map-prev]').addEventListener('click',()=>{if(current>0)select(current-1);});$('[data-map-next]').addEventListener('click',()=>{if(current<2)select(current+1);});
 $('[data-map-overview]').addEventListener('click',()=>{cancelIntro();main.dataset.mapView='overview';camera();});
 all('[data-map-answer]').forEach((b,i)=>b.addEventListener('click',()=>{select(i,'answer');answer.focus();}));
 all('[data-map-expand]').forEach((b,i)=>b.addEventListener('click',()=>{select(i,'expand');$('[data-technique]')?.focus();}));
 $('[data-answer-hints]').addEventListener('click',()=>{hints=!hints;updatePanel();});
 answer.addEventListener('focus',cancelIntro);answer.addEventListener('input',()=>{cancelIntro();drafts[current].answer=answer.value;drafts[current].prepared=true;$('[data-answer-count]').textContent=`${answer.value.length} / 300`;syncAnswers();save();});
 $('.mm-continue').addEventListener('click',event=>{if(!save())event.preventDefault();});
 const observer=win.ResizeObserver?new win.ResizeObserver(camera):null;observer?.observe(viewport);
 const onReduced=()=>{cancelIntro();main.dataset.mapView='overview';camera();};
 win.addEventListener('resize',camera);win.addEventListener('pagehide',cancelIntro,{once:true});reduced.addEventListener('change',onReduced);
 update();
 if(!reduced.matches){
  const full=fixture.questions[0].prompt;let count=0;$('[data-typed-question]').textContent='';main.dataset.typing='true';
  function type(){if(!intro||!main.isConnected)return;$('[data-typed-question]').textContent=full.slice(0,++count);if(count<full.length)typingTimer=setTimeout(type,45);else{main.dataset.typing='false';focusTimer=setTimeout(()=>{if(intro&&main.isConnected){main.dataset.cameraReady='true';main.dataset.mapView='focused';camera();}},1500);}}
  typingTimer=setTimeout(type,650);
 }
 return main.speakingMindmapDispose=()=>{cancelIntro();link.remove();observer?.disconnect();win.removeEventListener('resize',camera);win.removeEventListener('pagehide',cancelIntro);reduced.removeEventListener?.('change',onReduced);};
}
