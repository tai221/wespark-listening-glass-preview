import {mountSparkDialogue} from './spark-dialogue.mjs';
import {quizSparkClips} from './quiz-spark-clips.mjs';
export function mountQuizGuide(document,pane){
 const slot=document.createElement('aside');slot.className='quiz-spark-guide';slot.hidden=true;slot.setAttribute('aria-label','Spark đồng hành');
 slot.innerHTML='<div class="spark-message"><p data-spark-copy></p></div><div class="spark-portrait"><img src="assets/spark-talk-rest-v1.webp" alt="Spark" width="96" height="96"></div>';
 const reduced=document.defaultView.matchMedia('(prefers-reduced-motion: reduce)');
 const narrator=mountSparkDialogue(document,{slot,clips:{welcome:quizSparkClips['reduce-waste-question'],...quizSparkClips},motionAllowed:()=>document.body.dataset.glassMotion==='true'&&!reduced.matches});
 const root=pane.closest('.app');let active=false,key=null;
 function sync(){const visible=active&&!!key;slot.hidden=!visible;narrator.activate(visible&&!root?.inert,key||'welcome');}
 if(root)new document.defaultView.MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['inert']});
 reduced.addEventListener('change',()=>narrator.refresh());document.defaultView.addEventListener('glass-motion-change',()=>narrator.refresh());
 return {slot,update(value,q,checked,correct){active=value;const candidate=q?`${q.id}-${checked?(correct?'correct':'incorrect'):'question'}`:null;key=quizSparkClips[candidate]?candidate:null;sync();},reset(){narrator.reset();}};
}
