import {treeLinks,treeHeight,TREE_WIDTH} from './speaking-mindmap-tree.mjs';
import {hydrateDrafts,outlineFor,DRAFT_KEY,techniques} from './speaking-mindmap-model.mjs';
const esc=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const glyph={map:'M4 5h6v5H4zM15 3h6v5h-6zM14 16h6v5h-6zM10 7h5M7 10v8h7',user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 22v-3a7 7 0 0 1 14 0v3',branch:'M5 12h14M12 5v14',book:'M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15',mic:'M9 4a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0ZM5 11v1a7 7 0 0 0 14 0v-1M12 19v3m-4 0h8'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${glyph[name]}"/></svg>`;
const suggestions=[['A coastal city','A small town','A village in the countryside'],['The local cuisine','The friendly people','The relaxed lifestyle'],['Yes — better public transport','Yes — more green spaces','No — I like it as it is']];
const sampleAnswers=['Da Nang, a coastal city in central Vietnam.','The local cuisine and the relaxed lifestyle.','Yes. I would like better public transport.'];
import {roundReplyText} from './speaking-round-results-state.mjs';
const sampleReplies=[0,1,2].map(roundReplyText);
const expansions=[
 [['Nguyên nhân – Kết quả','Vị trí và ảnh hưởng đến cuộc sống'],['Ví dụ minh họa','Một địa điểm hoặc hoạt động quen thuộc'],['Kế hoạch tương lai','Bạn muốn sống ở đó trong tương lai không?']],
 [['Nguyên nhân – Kết quả','Vì sao điều đó khiến bạn yêu quê hương'],['Ví dụ minh họa','Một món ăn hoặc một kỷ niệm cụ thể'],['Kế hoạch tương lai','Điều bạn muốn tiếp tục trải nghiệm']],
 [['Nguyên nhân – Kết quả','Vì sao bạn muốn thay đổi điều đó'],['Ví dụ minh họa','Một vấn đề bạn gặp trong cuộc sống'],['Kế hoạch tương lai','Điều bạn mong sẽ tốt hơn']]
];
export function mountMappedPractice(main,questions,options={}){
 const doc=main.ownerDocument,win=doc.defaultView,lifecycle=new win.AbortController();
 const sheet=doc.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./speaking-mapped-practice.css',import.meta.url).href;doc.head.append(sheet);
 main.classList.add('speaking-practice-mapped');let current=null,transitionPending=false,resizeObserver,messageObserver;
 let drafts=hydrateDrafts(null);try{drafts=hydrateDrafts(JSON.parse(win.sessionStorage.getItem(DRAFT_KEY)));}catch{}
 const treeStride=Math.max(850,...drafts.map(d=>d.methodDrafts[d.technique]?treeHeight(d.methodDrafts[d.technique].map(words=>words.length))+100:850)),worldHeight=questions.length*treeStride;
 const scene=main.querySelector('.practice-scene'),prompt=scene.querySelector('.practice-prompt'),row=prompt.querySelector('.practice-question-row');
 const heading=doc.createElement('header');heading.className='mapped-heading';heading.innerHTML=`<div class="mapped-title"><span class="mm-mascot-scene"><img class="mm-mascot" src="../assets/spark-mindmap-laptop-v1.webp" width="120" height="80" alt="Spark đeo tai nghe, chuẩn bị luyện nói trên laptop"></span><div><h1>Luyện nói theo Mind Map</h1><p>Dùng những ý đã chuẩn bị để trả lời theo cách của bạn.</p></div></div><ol class="mapped-steps" aria-label="Các bước luyện nói"><li><b>✓</b><span>Xây mindmap</span></li><li aria-current="step"><b>2</b><span>Luyện nói</span></li><li><b>3</b><span>Nhận phản hồi</span></li></ol>`;
 const layout=doc.createElement('div');layout.className='mapped-layout';
 const map=doc.createElement('section');map.className='practice-map';map.setAttribute('aria-label','Mind Map tham khảo khi luyện nói');map.dataset.view='overview';
 map.innerHTML=`<div class="mapped-map-toolbar"><button type="button" data-practice-map-overview>${icon('map')}Toàn cảnh</button></div><div class="mapped-map-viewport"><div class="mapped-map-world" style="height:${worldHeight}px"><div class="mapped-topic" style="top:${worldHeight/2-80}px">${icon('book')}<strong>My hometown</strong></div><svg class="mapped-lines" viewBox="0 0 1500 ${worldHeight}" style="height:${worldHeight}px" aria-hidden="true">${questions.map((q,i)=>{const y=i*treeStride;return `<path class="mapped-topic-link" d="M250 ${worldHeight/2}C340 ${worldHeight/2} 280 ${y+80} 720 ${y+80}"/>${drafts[i].methodDrafts[drafts[i].technique]?'':`<g transform="translate(0 ${y})"><path d="M1000 145V180H540V240M1000 180H1050V240M540 294V340M1050 294V340M860 380H820V590H860M820 485H860"/></g>`}`;}).join('')}</svg>${questions.map((q,i)=>{
 const y=i*treeStride,d=drafts[i],hasOutline=!!d.methodDrafts[d.technique],answer=d.answer||(d.prepared?'Ý chính của bạn':sampleAnswers[i]);
 if(hasOutline){
  const branches=d.methodDrafts[d.technique];
  return `<section class="mapped-tree mapped-spatial-tree" data-map-tree="${i}" style="top:${y}px" aria-label="Câu ${i+1}"><div class="mapped-spatial-world">${treeLinks(branches.map(words=>words.length))}<h2 class="mapped-tree-question" lang="en"><span>Q${i+1}</span>${esc(q.text)}</h2><div class="mapped-branch-label mapped-answer-label">${icon('book')}Answer<div class="mapped-answer-node" lang="en">${esc(answer)}</div></div><div class="mapped-branch-label mapped-expand-label">${icon('branch')}Expand</div><div class="mapped-expand-nodes" aria-label="${esc(techniques[d.technique].name)}">${outlineFor(i,d.technique).map((item,n)=>`<div class="mapped-expand-node" data-outline-branch="${n}" data-selected="true" style="left:${390+n*280}px"><strong>${esc(item.label)}</strong></div><div class="mapped-tree-leaves" data-branch-leaves="${n}" style="left:${390+n*280}px">${branches[n].map(word=>`<span data-tree-leaf lang="en">${esc(word)}</span>`).join('')}</div>`).join('')}</div></div></section>`;
 }
 return `<section class="mapped-tree" data-map-tree="${i}" style="top:${y}px" aria-label="Câu ${i+1}"><h2 class="mapped-tree-question" lang="en"><span>Q${i+1}</span>${esc(q.text)}</h2><div class="mapped-branch-label mapped-answer-label">${icon('book')}Answer</div><div class="mapped-answer-node" lang="en">${esc(answer)}</div><div class="mapped-branch-label mapped-expand-label">${icon('branch')}Expand</div><div class="mapped-expand-nodes" aria-label="${hasOutline?esc(techniques[d.technique].name):'Ý mở rộng minh họa'}">${(hasOutline?outlineFor(i,d.technique).map((item,n)=>[item.label,(d.methodDrafts[d.technique]?.[n]||[]).join(' · ')||'…']):d.technique===1?[...expansions[i].slice(0,2),['So sánh – Đối chiếu','So sánh với nơi khác hoặc trước đây']]:expansions[i]).map(([label,help],n)=>`<div class="mapped-expand-node" data-outline-branch="${n}" data-selected="${hasOutline}">${icon(n===2?'book':'branch')}<div><strong>${esc(label)}</strong><span>${esc(help)}</span></div></div>`).join('')}</div></section>`;
 }).join('')}</div></div>`;
 const panelHeading=doc.createElement('div');panelHeading.className='mapped-panel-heading';panelHeading.innerHTML=`<h2>${icon('mic')}Luyện nói</h2>`;scene.prepend(panelHeading);
 const messages=doc.createElement('div');messages.className='mapped-messages';messages.setAttribute('aria-label','Hội thoại luyện nói');
 function appendSubmitted(index){
  if(!questions[index])return;
  const turn=doc.createElement('div');turn.className='mapped-previous-turn';turn.innerHTML=`<div class="mapped-previous-question"><span class="mapped-speaker">Giám khảo AI · Câu ${index+1}</span><p lang="en">${esc(questions[index].text)}</p></div><div class="mapped-previous-answer"><span class="mapped-speaker">Bạn</span><p lang="en" data-submitted-reply="${index}">${esc(sampleReplies[index])}</p></div>`;messages.append(turn);
 }
 for(const index of options.previousQuestions||[])appendSubmitted(index);
 const ai=doc.createElement('article');ai.className='mapped-message mapped-message-ai';ai.innerHTML=`<span class="mapped-avatar">${icon('book')}</span><div class="mapped-message-content"><span class="mapped-speaker">Giám khảo AI</span></div>`;
 ai.querySelector('.mapped-message-content').append(prompt);row.append(row.querySelector('.question-speaker'));
 const user=doc.createElement('article');user.className='mapped-message mapped-message-user';user.innerHTML=`<span class="mapped-avatar">${icon('user')}</span><div class="mapped-message-content"><span class="mapped-speaker">Bạn</span><div class="mapped-user-bubble" data-user-recording role="status">Nghe câu hỏi rồi bắt đầu nói.</div></div>`;
 user.hidden=true;messages.append(ai,user);panelHeading.after(messages);
 const recording=doc.createElement('div');recording.className='mapped-recorder';recording.append(scene.querySelector('.practice-voice'),scene.querySelector('.practice-status'),scene.querySelector('.practice-controls'));
 messages.after(recording);
 const footer=main.querySelector('.practice-footer');if(footer)scene.append(footer);
 // The mapped conversation uses its prepared map instead of the optional Kit control.
 scene.querySelector('.practice-bottom').hidden=true;
 layout.append(map,scene);main.prepend(heading);heading.after(layout);
 const viewport=map.querySelector('.mapped-map-viewport'),world=map.querySelector('.mapped-map-world');
 function camera(){const width=viewport.clientWidth||620,height=viewport.clientHeight||530,overview=map.dataset.view==='overview',d=drafts[current],spatial=!!d?.methodDrafts[d.technique],sceneHeight=spatial?treeHeight(d.methodDrafts[d.technique].map(words=>words.length)):620,scale=overview?Math.min(width/1560,height/(worldHeight+80)):Math.min(width/(spatial?TREE_WIDTH+60:1100),height/(sceneHeight+40)),cx=overview?750:spatial?400+TREE_WIDTH/2:900,cy=overview?worldHeight/2:current*treeStride+(spatial?sceneHeight/2:340);world.style.transform=`translate(${width/2-cx*scale}px,${height/2-cy*scale}px) scale(${scale})`;}
 function scrollCurrent(){if(!user.hidden){messages.scrollTop=messages.scrollHeight;return;}messages.scrollTop=Math.max(0,messages.scrollTop+ai.getBoundingClientRect().top-messages.getBoundingClientRect().top-6);}
 function focusQuestion(index){current=index;map.dataset.focusedQuestion=String(index);map.dataset.view='focused';map.querySelectorAll('[data-map-tree]').forEach((tree,i)=>{if(i===index)tree.setAttribute('aria-current','true');else tree.removeAttribute('aria-current');});camera();scrollCurrent();}
 function updateQuestion(index){transitionPending=current!==null&&current!==index;if(transitionPending){current=index;map.dataset.focusedQuestion=String(index);map.dataset.view='overview';camera();scrollCurrent();}else focusQuestion(index);user.querySelector('[data-user-recording]').textContent='Nghe câu hỏi rồi bắt đầu nói.';}
 function updateState(state){user.hidden=state!=='review';const bubble=user.querySelector('[data-user-recording]');bubble.textContent=state==='review'?sampleReplies[current]:'';if(state==='review'){bubble.lang='en';scrollCurrent();}else bubble.removeAttribute('lang');}
 map.querySelector('[data-practice-map-overview]').addEventListener('click',()=>{map.dataset.view='overview';camera();});
 win.addEventListener('resize',camera,{signal:lifecycle.signal});if(win.ResizeObserver){resizeObserver=new win.ResizeObserver(camera);resizeObserver.observe(viewport);messageObserver=new win.ResizeObserver(scrollCurrent);messageObserver.observe(messages);}
 return {updateQuestion,focusQuestion,updateState,prepareAudio(){const delay=transitionPending&&!win.matchMedia('(prefers-reduced-motion: reduce)').matches?1400:0;transitionPending=false;return delay;},commitQuestion(index){appendSubmitted(index);messages.insertBefore(messages.lastElementChild,ai);},complete(){ai.hidden=true;user.hidden=true;messages.scrollTop=messages.scrollHeight;messageObserver?.disconnect();},dispose(){lifecycle.abort();resizeObserver?.disconnect();messageObserver?.disconnect();main.classList.remove('speaking-practice-mapped');}};
}
