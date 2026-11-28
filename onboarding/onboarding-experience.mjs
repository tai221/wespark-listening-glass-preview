import {PROMPTS,createOnboardingAudio} from './onboarding-audio.mjs';

// Presentation only: routing, evidence eligibility and intake stay in the existing flow.
export function mountGuidedOnboarding({document,main,page,getState}) {
 if(['proposal','management'].includes(page))return {refresh(){}};
 const audio=createOnboardingAudio(document),win=document.defaultView;
 document.body.classList.add('onboarding-guided');
 const header=document.createElement('header');header.className='guided-header';
 header.innerHTML=`<span class="guided-brand"><img class="wespark-logo" src="${new URL('./onboarding-assets/wespark-logo.svg',import.meta.url)}" alt="WeSpark" width="154" height="37"></span><div class="guided-progress" aria-label="Tiến độ thiết lập">${['Thông tin học','Điểm bắt đầu','Sẵn sàng'].map(t=>`<div role="progressbar" aria-label="${t}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="progress-track"><i></i></span></div>`).join('')}</div><div class="guided-tools"><button type="button" data-spark-mute aria-label="Âm thanh Spark" title="Bật/tắt âm thanh Spark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3Z"/><path class="sound-waves" d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/><path class="sound-off" d="m16 9 6 6m0-6-6 6"/></svg></button></div>`;
 document.body.prepend(header);
 const review=document.querySelector('.review-toolbar');
 if(review)review.hidden=true;
 header.querySelector('[data-spark-mute]').addEventListener('click',()=>audio.toggle());
 let lastHeading,lastKey,caption,avatar;
 function showPrompt(key){lastKey=key;if(caption)caption.textContent=PROMPTS[key]||'';void audio.setPrompt(key);}
 audio.subscribe(({enabled,speaking})=>{header.querySelector('[data-spark-mute]').setAttribute('aria-pressed',String(enabled));header.classList.toggle('sound-muted',!enabled);avatar?.classList.toggle('is-speaking',speaking);});
 document.addEventListener('change',e=>{const target=e.target;if(target.matches('input[type="radio"],input[type="checkbox"]'))void audio.playClick();if(page==='skills'&&target.name==='skill'){const value=target.value;const selected=getState().skills;const actual=selected.length===2?'both':selected[0];if(value===actual)showPrompt('picked-'+value);}});
 win.addEventListener('hashchange',()=>{if(page.startsWith('test-')){void audio.setPrompt(null);const inTest=win.location.hash!=='#intro'&&!!win.location.hash;const guide=main.querySelector('.spark-guide');if(guide)guide.hidden=inTest;if(!inTest)showPrompt(page);}});
 return {refresh(){
  const heading=main.querySelector('h1');if(!heading||heading===lastHeading)return;lastHeading=heading;
  const back=main.querySelector('.flow-back');
  if(back){back.setAttribute('aria-label','Quay lại');back.setAttribute('title','Quay lại');back.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="m15 4-8 8 8 8"/></svg>';}
  const state=getState(),hash=win.location.hash;
  const stage=page==='goals'?(hash==='#availability'?'availability':hash==='#preferences'?'preferences':'goals'):page;
  const questions=page==='start'&&hash==='#questions';
  document.body.classList.toggle('onboarding-questions',questions);
  const key=questions?'questions-'+(state.skills.length===2?'both':state.skills[0]):page==='start'?'test-'+(main.querySelector('[data-test-skill]')?.dataset.testSkill||state.skills[0]):stage;
  const phase=['skills','goals'].includes(page)?0:page==='summary'?2:1;
  const intake={skills:25,goals:50,availability:75,preferences:100};
  header.querySelectorAll('[role="progressbar"]').forEach((el,i)=>{const value=i<phase?100:i>phase?0:phase===0?intake[stage]||25:phase===1?(questions?100:50):100;el.setAttribute('aria-valuenow',value);el.style.setProperty('--progress',value+'%');el.toggleAttribute('data-current',i===phase);if(i===phase)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
  const guide=document.createElement('div');guide.className='spark-guide';guide.innerHTML=`<img class="spark-avatar" src="${new URL('./onboarding-assets/spark-teacher-2d.png',import.meta.url)}" alt="Spark"><p class="spark-caption" lang="en"></p>`;
  heading.before(guide);caption=guide.querySelector('.spark-caption');avatar=guide.querySelector('.spark-avatar');
  if(page==='skills'){
   const descriptions={listening:'Nghe hiểu và nắm ý chính',speaking:'Diễn đạt rõ ràng, tự tin',both:'Luyện nghe và nói cùng nhau'};
   main.querySelectorAll('[name="skill"]').forEach(input=>{const label=input.closest('label');label.classList.add('skill-option');label.dataset.skill=input.value;label.querySelector('small').textContent=descriptions[input.value];});
  }
  main.querySelectorAll('[data-question]').forEach(field=>{
   const skill=field.dataset.question,legend=field.querySelector('legend');
   const icon=skill==='listening'?'<path d="M5 14v-3a7 7 0 0 1 14 0v3"/><rect x="3" y="12" width="5" height="9" rx="2"/><rect x="16" y="12" width="5" height="9" rx="2"/>':'<rect x="8" y="2" width="8" height="14" rx="4"/><path d="M5 11v2a7 7 0 0 0 14 0v-2M12 20v3m-4 0h8"/>';
   legend.innerHTML=`<span class="question-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></span><span>${skill==='listening'?'Listening':'Speaking'}</span><span class="question-multiple">Chọn nhiều</span>`;
   field.querySelector('p')?.remove();
   const options=document.createElement('div');options.className='answer-options';
   field.querySelectorAll('.choice').forEach(label=>{
    options.append(label);
   });field.append(options);
  });
  if(questions)main.querySelector('.lead').textContent='Chọn những mục bạn muốn tập trung.';
  if(page.startsWith('test-')&&hash&&hash!=='#intro'){guide.hidden=true;void audio.setPrompt(null);return;}
  if(PROMPTS[key]){if(key!==lastKey)showPrompt(key);else caption.textContent=PROMPTS[key];}else audio.stop();
 }};
}
