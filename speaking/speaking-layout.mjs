import {mountSpeakingPreparation} from './speaking-preparation.mjs';
import {syncSpeakingLibrary} from './speaking-library.mjs';
// Family-specific desktop compositions. The existing radio/hash lesson fixtures remain local.
const assets='../assets/';
const routeFiles=['key-speaking-vocabulary.html','key-speaking-produce.html','key-speaking-feedback.html','key-error-bank.html'];
const routeLabels=['Chuẩn bị','Tự nói','Góp ý','Luyện & ôn'];
const routeArt=['spark-journey/prepare-v1.webp','spark-activities/conversation-v1.webp','spark-reading.webp','spark-journey/practice-v1.webp'];
const glyphs={mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v1a7 7 0 0 0 14 0v-1m-7 8v3m-4 0h8"/>',stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',play:'<path d="m9 5 11 7-11 7Z"/>',replay:'<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',check:'<path d="m5 12 4 4L20 5"/>',warning:'<path d="M12 8v5m0 4h.01"/><path d="M10 3 2 18a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 3a2 2 0 0 0-4 0Z"/>',audio:'<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'};
const svg=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[name]}</svg>`;
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;}
function companion(text,art='spark-reading.webp'){const wrap=node('div','speaking-companion');const img=node('img');img.src=assets+art;img.alt='';img.width=60;img.height=64;wrap.append(img,node('p','',text));return wrap;}
function lessonHeader(workspace){
 const context=workspace.querySelector('.project-lesson-context');if(!context)return;
 const title=context.querySelector('.project-lesson-name');
 if(title){const row=node('div','speaking-lesson-top');row.append(title);const tags=node('div','speaking-lesson-tags');tags.append(node('span','speaking-topic','Quê hương'),node('span','speaking-level','B1'));row.append(tags);context.prepend(row);}
 const journey=context.querySelector('.journey');
 if(journey){[...journey.children].filter(el=>el.tagName!=='B').forEach((item,index)=>{const link=node('a',item.className);link.href=routeFiles[index];if(item.classList.contains('on'))link.setAttribute('aria-current','step');const img=node('img');img.src=assets+routeArt[index];img.alt='';img.width=38;img.height=38;link.append(img,node('i','',String(index+1)),document.createTextNode(routeLabels[index]));item.replaceWith(link);});}
}
function pageHeading(main,file){
 const labels={'key-speaking-vocabulary.html':'Học từ & cụm từ','key-speaking-game.html':'Thử sức','key-speaking-mindmap.html':'Sắp xếp ý','key-speaking-kit.html':'Speaking Kit','key-speaking-produce.html':'Luyện nói','key-speaking-feedback.html':'Phản hồi bài nói','key-speaking-feedback-detail.html':'Hiểu và sửa lỗi','key-speaking-version2.html':'Nói lại lần 2','key-speaking-compare.html':'So sánh hai lần nói','key-speaking-drill-repeat.html':'Ôn câu đã sửa'};
 const h1=main.querySelector(':scope > h1,:scope > .heading h1');if(!h1)return;
 if(labels[file])h1.textContent=labels[file];
 let heading=h1.closest('.heading');if(!heading){heading=node('div','speaking-page-heading');const text=node('div');h1.before(heading);heading.append(text);text.append(h1);const intro=main.querySelector(':scope > .intro');if(intro)text.append(intro);}
 else heading.classList.add('speaking-page-heading');
 const steps=main.querySelector(':scope > .steps');if(steps)heading.append(steps);
 const input=main.parentElement.querySelector(':scope > .inputnav');
 if(input){const outline=node('details','speaking-pre-outline');const current=input.querySelector('[aria-current]');const summary=node('summary','',`Chuẩn bị · ${current?.textContent.replace(/^\d+\s*/,'').trim()||h1.textContent}`);outline.append(summary,input);heading.after(outline);const skip=input.querySelector('.skip');if(skip){skip.className='speaking-skip-prep';heading.append(skip);}}
 const prompts={'key-speaking-produce.html':'Mỗi lần một câu hỏi. Ghi âm, nghe lại rồi tiếp tục theo nhịp của bạn.','key-speaking-version2.html':'Giữ ý của bạn, thử áp dụng góp ý vào lần nói này.','key-speaking-drill-repeat.html':'Luyện lại câu đã sửa. Mỗi lượt đúng là một bước tiến nhỏ.'};
 if(prompts[file]){heading.querySelector('.intro')?.remove();heading.after(companion(prompts[file],'spark-activities/conversation-v1.webp'));}
}
function demoNotes(main){
 const notes=[...main.querySelectorAll(':scope > .notice,:scope > .game-wrap > .game-note,:scope > .produce-preview')];
 if(!notes.length)return;
 const details=node('details','speaking-demo-details');details.append(node('summary','','Về bản thử này'));const content=node('div');notes.forEach(item=>content.append(item));details.append(content);main.append(details);
}
function library(main){
 const heading=main.querySelector('.heading');if(!heading)return;
 heading.querySelector('.pill')?.remove();const welcome=node('div','speaking-library-welcome');heading.before(welcome);welcome.append(heading,companion('Cùng Spark chuẩn bị ý, tự tin nói và hiểu điều mình có thể cải thiện.','spark-talking-v1.webp'));
 const route=node('ol','speaking-library-route');const hints=['Học từ và sắp xếp ý.','Kể bằng cách của bạn.','Hiểu lỗi qua bằng chứng.','Luyện lại khi bạn cần.'];routeLabels.forEach((label,i)=>{const li=node('li'),img=node('img');img.src=assets+routeArt[i];img.alt='';img.width=72;img.height=66;li.append(img,node('h2','',label),node('p','',hints[i]));route.append(li);});welcome.after(route);
 const cards=[...main.querySelectorAll('.lesson-card')];const photos=['lesson-covers/morning-v1.webp','lesson-covers/walk-v1.webp','lesson-covers/garden-v1.webp'];const topics=['Quê hương','Đời sống','Môi trường'];const levels=['B1','A2','B2'];
 cards.forEach((card,i)=>{const cover=node('div','speaking-cover'),img=node('img');img.src=assets+photos[i];img.alt='';img.width=360;img.height=154;cover.append(img);const badge=card.querySelector('.r1-okr-tag');if(badge)cover.append(badge);card.prepend(cover);const body=card.querySelector('.lessonbody'),tags=node('div','speaking-card-tags');tags.append(node('span','',topics[i]),node('span','',levels[i]));body.prepend(tags);const questions=body.querySelector('.questions');if(questions){const details=node('details','speaking-lesson-questions');details.append(node('summary','','Xem 3 câu hỏi'),questions);body.append(details);}});
 const filters=main.querySelector('.filters');if(!filters)return;filters.setAttribute('aria-label','Tìm và lọc bài Speaking');const input=filters.querySelector('input'),selects=[...filters.querySelectorAll('select')];input.setAttribute('aria-label','Tìm bài Speaking');input.placeholder='Tên bài hoặc chủ đề…';
 const searchLabel=filters.querySelector('.search');searchLabel.prepend(node('span','','Tìm bài nói'));
 filters.querySelectorAll('select').forEach(el=>el.setAttribute('aria-label',el.previousSibling?.textContent?.trim()||'Bộ lọc'));
 const meta=main.querySelector('.catalog-meta');meta.innerHTML='<span data-speaking-count>3 bài học</span><button type="button" class="speaking-reset-filters">Xóa lọc</button>';
 const empty=node('div','speaking-empty');empty.hidden=true;empty.innerHTML='<h2>Chưa tìm thấy bài phù hợp</h2><p>Thử từ khóa khác hoặc xóa bộ lọc để xem các bài trong thư viện.</p>';main.querySelector('.lessons').append(empty);
 function filter(){let count=0;cards.forEach((card,i)=>{const query=input.value.trim().toLocaleLowerCase('vi');const topic=selects[0]?.selectedIndex||0,level=selects[1]?.value;const matches=(!query||card.textContent.toLocaleLowerCase('vi').includes(query))&&(!topic||i===topic-1)&&(!level||level.startsWith('Tất cả')||levels[i]===level);card.hidden=!matches;if(matches)count++;});empty.hidden=count>0;meta.querySelector('[data-speaking-count]').textContent=`${count} bài học phù hợp`;}
 filters.addEventListener('input',filter);filters.addEventListener('change',filter);meta.querySelector('button').addEventListener('click',()=>{input.value='';selects.forEach(el=>el.selectedIndex=0);filter();input.focus();});
 main.querySelector('.question-strip')?.remove();
}
function recorder(main){
 const first=main.querySelector('.produce-first');if(!first)return;
 const states=[...first.querySelectorAll('.practice > .state')];
 [...main.querySelectorAll('.produce-alt')].forEach((section,index)=>{const old=section.querySelector('.r1-record');const count=index+2;states.forEach(source=>{const copy=source.cloneNode(true);if(copy.classList.contains('submitted')){copy.querySelector('h3').textContent=`Bản ghi câu ${count} đã nộp · Mẫu`;copy.querySelector('p').textContent=count===2?'Tiếp tục câu hỏi cuối trước khi xem góp ý cho bộ câu hỏi.':'Bạn đã đi qua bộ câu hỏi trong bản thử. Tiếp tục để xem phản hồi mẫu.';copy.querySelector('.quiet').textContent='Bản thử không lưu âm thanh hoặc kết quả. Phản hồi là ví dụ để xem giao diện.';const next=copy.querySelector('a.button.primary');next.href=count===2?'#question-3':'key-speaking-feedback.html';next.textContent=count===2?'Câu tiếp theo →':'Xem phản hồi mẫu →';}old.before(copy);});old.remove();});
 const container=node('div','speaking-record-grid'),rail=node('aside','speaking-question-rail'),stage=node('div','speaking-record-stage');rail.setAttribute('aria-label','Danh sách câu hỏi');rail.append(node('h2','','Câu hỏi trong bài'));
 const submitted=new Set();let previousQuestion=location.hash||'#question-1';
 const questions=[...main.querySelectorAll('.practice > h2')].slice(0,3);questions.forEach((question,index)=>{const link=node('a');link.href=`#question-${index+1}`;const label=node('span','',question.textContent);label.append(node('small','speaking-question-status','Chưa nộp'));link.append(node('i','',String(index+1).padStart(2,'0')),label);rail.append(link);});rail.append(node('p','','Góp ý xuất hiện sau bộ câu hỏi. Bạn có thể nghe lại và ghi lại trước khi nộp.'));
 first.before(container);container.append(rail,stage);stage.append(first,...main.querySelectorAll('.produce-alt'));
 main.querySelectorAll('.workspace').forEach(workspace=>{const practice=workspace.querySelector('.practice');let kit=workspace.querySelector('.kit');if(!kit)return;if(kit.tagName!=='DETAILS'){const details=node('details','kit');details.append(node('summary','','Speaking Kit'));const body=node('div','kit-body');while(kit.firstChild)body.append(kit.firstChild);details.append(body);kit.replaceWith(details);kit=details;}kit.removeAttribute('open');practice.append(kit);const help=practice.querySelector('.question-help');if(help)help.innerHTML=help.innerHTML.replace('Speaking Kit ở bên cạnh nếu bạn cần gợi ý.','Mở Speaking Kit bên dưới nếu cần gợi ý.');});
 function updateRail(){const hash=location.hash||'#question-1';rail.querySelectorAll('a').forEach(a=>{if(a.hash===hash)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');const status=a.querySelector('.speaking-question-status');status.textContent=submitted.has(a.hash)?'Đã nộp':a.dataset.visited?'Chưa nộp · Có thể quay lại':'Chưa nộp';});}
 document.querySelector('#state-submitted')?.addEventListener('change',()=>{submitted.add(location.hash||'#question-1');updateRail();});
 function current(){const hash=location.hash||'#question-1';const previous=[...rail.querySelectorAll('a')].find(a=>a.hash===previousQuestion);if(previous&&hash!==previousQuestion)previous.dataset.visited='true';previousQuestion=hash;updateRail();document.querySelector('#state-ready')?.click();}
 window.addEventListener('hashchange',current);current();
}
function drill(main){
 main.querySelectorAll('.target br').forEach(br=>br.replaceWith(document.createTextNode(' ')));
 const layout=main.querySelector('.layout'),practice=layout?.querySelector('.practice'),aside=layout?.querySelector('aside');if(!layout||!practice||!aside)return;
 layout.classList.add('speaking-drill-layout');const source=node('section','card speaking-drill-source');
 for(const el of [...practice.children]){if(el.matches('.goal,.instruction,.target,.meaning,.sample-audio'))source.append(el);}
 aside.prepend(source);layout.prepend(aside);const rule=main.querySelector('.ruleline');if(rule)practice.prepend(rule);
}
function functionalMindmap(main){
 const bank=main.querySelector('.wordbank');if(!bank)return;
 const words=[...bank.querySelectorAll('.bankword')];const slots=[...main.querySelectorAll('.slot')];const phrases=words.map(el=>el.firstChild.textContent.trim());const keys=[0,3,1,4,2,5];let selected=1;const assigned=new Map([[0,0]]);const feedback=main.querySelector('.nearfeedback');feedback?.setAttribute('role','status');
 function update(){words.forEach((word,i)=>{word.classList.toggle('selected',selected===i);word.classList.toggle('used',[...assigned.values()].includes(i));word.setAttribute('aria-pressed',String(selected===i));});main.querySelector('.map-toolbar span').textContent=`${assigned.size} / 6 cụm đã gắn`;}
 words.forEach((old,i)=>{const button=node('button','bankword',phrases[i]);button.type='button';old.replaceWith(button);words[i]=button;button.addEventListener('click',()=>{selected=i;if(feedback)feedback.textContent=`Đang chọn “${phrases[i]}”. Chọn ô phù hợp trong sơ đồ.`;update();});});
 slots.forEach((old,i)=>{const button=node('button','slot',i===0?phrases[0]:old.textContent);button.type='button';if(i===0)button.classList.add('filled');old.replaceWith(button);slots[i]=button;button.addEventListener('click',()=>{if(feedback)button.after(feedback);if(selected===keys[i]){assigned.set(i,selected);button.textContent=phrases[selected];button.classList.add('filled');button.classList.remove('selected');if(feedback)feedback.textContent='Phù hợp với nhánh ý này. Bạn có thể tiếp tục hoặc thử một cụm khác.';}else if(feedback)feedback.textContent='Thử lại: chọn cụm từ diễn tả đúng ý gợi trong ô này. Không bị trừ điểm.';update();});});
 const note=bank.querySelector('.demohelp');if(note)note.textContent='Chọn một cụm, rồi chọn ô phù hợp.';if(feedback)feedback.textContent=`Đang chọn “${phrases[selected]}”. Chọn ô phù hợp trong sơ đồ.`;update();
}
function completion(main){const complete=main.querySelector('#complete');if(!complete)return;const h1=complete.querySelector('h1'),lead=complete.querySelector('.lead');const hero=node('div','speaking-completion-hero'),img=node('img');img.src=assets+'spark-celebrate.webp';img.alt='';img.width=130;img.height=140;const content=node('div');h1.before(hero);content.append(h1);if(lead)content.append(lead);hero.append(img,content);}
function accessibleControls(root){
 root.querySelectorAll('label.button[for]').forEach(label=>{const button=node('button',label.className);button.type='button';button.innerHTML=label.innerHTML;button.addEventListener('click',()=>{document.getElementById(label.htmlFor)?.click();const scope=button.closest('.practice,.record-panel,.panel')||root;requestAnimationFrame(()=>{const state=[...scope.querySelectorAll('.state')].find(el=>el.checkVisibility());if(state){const control=[...state.querySelectorAll('button,a[href]')].find(el=>el.checkVisibility()&&!el.disabled);if(control)control.focus({preventScroll:true});else {state.tabIndex=-1;state.focus({preventScroll:true});}}});});label.replaceWith(button);});
 root.querySelectorAll('.button,.pronunciation,.audio button,.audio-review button,.sample-audio button').forEach(button=>{const text=button.textContent.trim();const first=button.firstChild;if(first?.nodeType===Node.TEXT_NODE)first.textContent=first.textContent.replace(/^[●■↻▶◖✓]\s*/,'');if(!button.querySelector('svg')){let glyph;if(/Dừng/.test(text))glyph='stop';else if(/Bắt đầu ghi|Ghi âm|Ghi lượt/.test(text))glyph='mic';else if(/Ghi lại/.test(text))glyph='replay';else if(/Nghe/.test(text))glyph='audio';if(glyph)button.insertAdjacentHTML('afterbegin',svg(glyph));}});
 root.querySelectorAll('.mic,.status-icon').forEach(el=>{if(el.querySelector('svg'))return;el.innerHTML=svg(el.closest('.recording')?'stop':el.closest('.error,.insufficient')?'warning':el.closest('.positive,.submitted,.review')?'check':'mic');});
}
export function enhanceSpeaking(workspace,file){
 lessonHeader(workspace);const main=workspace.querySelector('main');if(!main)return;
 main.querySelectorAll('.eyebrow').forEach(el=>el.remove());
 pageHeading(main,file);
 if(file==='key-speaking-library.html')syncSpeakingLibrary(main);
 if(file==='key-speaking-vocabulary.html'||file==='key-speaking-game.html')mountSpeakingPreparation(main,file);
 if(file==='key-speaking-produce.html')recorder(main);
 if(file==='key-speaking-mindmap.html')functionalMindmap(main);
 if(file==='key-speaking-drill-repeat.html')drill(main);
 if(file==='key-speaking-completion.html')completion(main);
 main.querySelectorAll('.steps a').forEach(a=>a.textContent=a.textContent.replace(/^\d+\s*·\s*/,''));
 const previews=[...document.querySelectorAll('body > .previewbar')],extra=main.querySelector('.r1-drill-links');
 if(previews.length||extra){const tools=node('details','speaking-preview-tools');tools.append(node('summary','','Trạng thái mẫu · Dành cho xem thử'));const content=node('div');content.append(...previews);if(extra)content.append(extra);tools.append(content);const review=document.querySelector('.review-inner');if(review)review.insertBefore(tools,review.querySelector(':scope > .review-menu'));else document.querySelector('.browser').before(tools);}
 demoNotes(main);accessibleControls(workspace);cleanSpeakingCopy(workspace);main.tabIndex=-1;document.body.dataset.speakingReady=file;
}

// Product-facing copy only; review fixtures remain in the DOM for local QA.
function cleanSpeakingCopy(workspace){
 // Remove redundant peripheral copy, including the specific items flagged by the user.
 workspace.querySelectorAll('.speaking-skip-prep,.speaking-page-heading>.pill,.heading>.pill,.vocab-layout .demohelp,.footer>span,.question-strip,.produce-preview').forEach(el=>el.remove());

 document.title=document.title.replace(/ · Local mockup/g,'').replace('Produce','Luyện nói').replace('Guided Mindmap','Sắp xếp ý');
 document.querySelector('.review-toolbar')?.setAttribute('hidden','');
 document.querySelectorAll('.speaking-preview-tools').forEach(el=>el.hidden=true);
 workspace.querySelectorAll('.speaking-demo-details,.sampleline,.artifact-foot,.prototype-note,.browserbar,.r1-question-links,.question-progress,.produce-preview,.state .quiet,.state .sample').forEach(el=>el.remove());
 const replacements=new Map([
 ['Bài Speaking đã hoàn thành · Mẫu','Bài Speaking đã hoàn thành'],
 ['Xem phản hồi mẫu','Xem phản hồi'],
 ['Dừng bản xem ghi âm','Dừng ghi âm'],
 ['Dừng chỉ trở về giao diện sẵn sàng, không tạo bản ghi hoặc kết quả đúng/sai.',''],
 ['Ví dụ phản hồi độc lập; không đánh giá từ thao tác thu âm trong prototype.',''],
 ['Chưa có bản ghi hoặc transcript thật ở bản xem này.','Chưa có bản ghi để nghe lại.'],
 ['Chọn “Phản hồi mẫu” phía trên để xem thiết kế, không phải nộp bài.',''],
 ['Xem trạng thái nghe lại','Nghe lại'],
 ['Xem trạng thái thử lại','Thử lại'],
 ['Xem lỗi kỹ thuật','Trợ giúp khi gặp lỗi'],
 ['Kết quả không tự trở thành KR nếu chưa đủ điều kiện bằng chứng.',''],
 ['Input','phần chuẩn bị'],

 ['My hometown · Ba bản nộp hợp lệ và feedback đã xem. Không phải xác nhận từ tương tác trong prototype.','My hometown · Bạn đã nộp đủ ba câu và xem phản hồi.'],
 ['Ba bản nói đã nộp trong tình huống mẫu, nhưng feedback chưa sẵn sàng. Chưa coi feedback hoặc bài là hoàn thành.','Đã nhận ba bản nói. Phản hồi đang được xử lý.'],
 ['Không có kết quả AI hợp lệ. Không gán điểm thấp hoặc coi người học đã xem feedback.','Chưa thể tạo phản hồi cho bản nói. Hãy thử lại.'],
 ['Lịch/giới hạn/số lượt chưa chốt. Không bịa ngày nhắc cụ thể.',''],
 ['Hiện tại hoàn thành + since · Dữ liệu minh họa','Hiện tại hoàn thành + since'],
 ['Nguồn: My hometown · nhận xét câu nói · dữ liệu minh họa','Nguồn: My hometown · Nhận xét bài nói'],
 ['Bằng chứng mẫu từ My hometown · Version 2 trong Compare. Không phải nhận xét từ audio thật.','Nguồn: My hometown · Lần nói thứ hai'],
 ['Nhận xét về nội dung dựa trên transcript mẫu.','Nhận xét dựa trên nội dung lời nói.'],
 ['Chưa đánh giá phát âm, độ trôi chảy hoặc nhịp nói: bản xem không có audio để đối chiếu. Không có band IELTS hay điểm tổng giả định.','Chưa có bản ghi để đánh giá phát âm, độ trôi chảy và nhịp nói.'],
 ['Không có audio để xác minh phát âm, độ trôi chảy hoặc thời lượng. Không suy ra V2 tốt hơn về các mặt này từ transcript. Nội dung câu 2–3 chưa được đánh giá.','So sánh dựa trên lời nói. Chưa có bản ghi để đối chiếu phát âm và độ trôi chảy.'],
 ['Không gắn timestamp vì chưa có dữ liệu audio để căn chỉnh.',''],
 ['Ba câu là dữ liệu minh họa để duyệt UX; không phải kết quả từ các lần bấm thu trong prototype.',''],
 ['Hai câu còn lại · Phản hồi mẫu','Phản hồi hai câu còn lại'],
 ['Transcript mẫu:','Lời nói:'],
 ['2 mục tiêu mẫu · Không phải hạn mức','2 điểm cần cải thiện'],
 ['6 cụm · Học liệu minh họa','6 cụm từ'],
 ['Một câu mẫu · Không tính điểm','Luyện tập không tính điểm'],
 ['Chọn một đáp án để xem phản hồi mẫu','Chọn một đáp án'],
 ['Kit mẫu · Không phải kết quả tự làm','Sơ đồ tham khảo'],
 ['Reference mode · Không chấm tiếp','Tài liệu tham khảo'],
 ['Learning mode','Luyện sắp xếp ý'],
 ['Chưa bắt đầu · mẫu','Chưa bắt đầu'],
 ['Thẻ nội dung minh họa','Sắp có'],
 ['Chưa có bản xem','Sắp có'],
 ['Một lỗi đang luyện · Dữ liệu mẫu','Một lỗi đang luyện'],
 ['Không có câu sửa/mẫu trả lời ở bước nói. Không tự ghi âm.','Tự diễn đạt theo tình huống, không đọc lại câu đã sửa.'],
 ['Quan sát minh họa','Nhận xét'],
 ['Đủ 2/2 vòng, mỗi vòng 3 lượt đúng liên tiếp. Chỉ xác nhận lỗi mẫu này, không phải toàn bộ bài Speaking.','Bạn đã hoàn thành hai vòng luyện cho lỗi này.'],
 ['Không minh họa xóa chuỗi hay mất vòng đã Pass. Lượt sai reset chuỗi vòng hiện tại; lượt không đánh giá được không tăng hoặc reset. Xem trạng thái bổ sung.','Lượt sai bắt đầu lại chuỗi của vòng hiện tại. Lỗi kỹ thuật giữ nguyên tiến độ.'],
 ['Pass lỗi mẫu không có nghĩa hết lỗi lâu dài. Không có kết quả thật được lưu.','Tiếp tục ôn để áp dụng cấu trúc trong những lần nói sau.'],
 ['Không phải lượt nói Version 2 trong bài cũ.',''],
 ['Review và Error Bank chưa dựng',''],
 ['Không phải kết quả đánh giá thật',''],
 ['Bản xem: câu 1 / 3',''],
 ['Không có audio','Chưa có bản ghi'],
 ['Chưa có audio','Chưa có bản ghi'],
 ['Nghe mẫu · chưa có audio','Nghe phát âm'],
 ['Nghe câu mẫu · Chưa có audio','Nghe câu mẫu'],
 ['Bỏ qua chuẩn bị → Produce','Bỏ qua chuẩn bị → Luyện nói'],
 ['← Quay lại Produce','← Luyện nói'],
 ['Xem bố cục phản hồi mẫu','Xem phản hồi'],
 ['Xem trạng thái bài hoàn thành mẫu','Xem kết quả bài học'],
 ['Để sau Version 2 · Xem hoàn thành mẫu','Để sau · Xem kết quả bài học'],
 ['Để sau · Xem bài hoàn thành mẫu','Để sau · Xem kết quả bài học'],
 ['Xem mockup so sánh · Dữ liệu mẫu →','So sánh hai lần nói →'],
 ['Xem mẫu báo lỗi Version 1','Báo lỗi nhận xét lần nói đầu'],
 ['Nộp V2 · Chưa hoạt động','Nộp bản nói'],
 ['Gửi để nhận góp ý · Chưa hoạt động','Gửi để nhận góp ý'],
 ['Chưa gửi dữ liệu và chưa có kết quả so sánh thật.','Nghe lại hoặc ghi lại trước khi gửi.'],
 ['Bản nói tình huống mới · Mẫu','Bản nói của bạn'],
 ['Trạng thái này dùng khi bản ghi còn dùng quá khứ đơn cho việc vẫn tiếp diễn. Góp ý thật cần trích đúng lời nói, giải thích điểm chưa phù hợp và gợi cách thử lại.','Dùng hiện tại hoàn thành cho việc bắt đầu trong quá khứ và còn tiếp diễn.'],
 ]);
 const removePattern=/^(?:Bộ bài có 3 câu hỏi · Feedback mẫu|Trạng thái mẫu độc lập|Ví dụ độc lập;|Thời gian (?:00:18 là )?mẫu|Bản xem chỉ đổi giao diện|Ví dụ phản hồi độc lập|Liên kết này chỉ mở bản trình bày|Drill diễn ra ở đầu buổi sau,|Error Bank \/ Review chưa có bản xem|Chưa có bản ghi để dẫn chứng)/;
 workspace.querySelectorAll('p,small,.fine,.quiet,.kit-note,.aside-note,.demohelp,.footer>span').forEach(el=>{const text=el.textContent.trim();if(removePattern.test(text))el.remove();});
 const walker=document.createTreeWalker(workspace,NodeFilter.SHOW_TEXT);const texts=[];while(walker.nextNode())texts.push(walker.currentNode);
 for(const text of texts){if(text.parentElement.closest('script,style'))continue;let value=text.textContent;for(const [from,to] of replacements)value=value.replaceAll(from,to);value=value.replace(/ · (?:Mẫu|mẫu|Trạng thái mẫu|Kết quả mẫu|Dữ liệu mẫu|Bản xem tĩnh|Bản xem|Minh họa|minh họa|Ví dụ|ví dụ)/g,'').replace(/Nguồn mẫu:/g,'Nguồn:').replace(/Cụm (\d+) \/ Học liệu mẫu/g,'Cụm $1').replace(/Transcript/g,'Lời nói').replace(/Version 1/g,'Lần nói 1').replace(/Version 2/g,'Lần nói 2').replace(/\bInput tùy chọn/g,'Chuẩn bị tùy chọn');text.textContent=value;}
 workspace.querySelectorAll('p,small,.fine,.quiet,.footer>span').forEach(el=>{if(!el.textContent.trim()&&!el.closest('#learn-panel'))el.remove();});
}
