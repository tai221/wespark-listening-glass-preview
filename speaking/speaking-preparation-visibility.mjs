// UI visibility only. Hidden screens, fixtures, state and learning logic are retained.
export const speakingPreparationSteps=[
 {id:'vocabulary',label:'Học từ & cụm từ',uiHidden:true},
 {id:'game',label:'Quiz/Game',uiHidden:true},
 {id:'mindmap',label:'Mindmap',uiHidden:false},
 {id:'kit',label:'Speaking Kit',uiHidden:true}
];
export const visibleSpeakingPreparationSteps=()=>speakingPreparationSteps.filter(step=>!step.uiHidden);
export const speakingPreparationEntry=()=>`key-speaking-${visibleSpeakingPreparationSteps()[0].id}.html`;
export const speakingPreparationLabel=()=>visibleSpeakingPreparationSteps()[0].label;
