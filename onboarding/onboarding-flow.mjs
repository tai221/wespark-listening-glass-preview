import {eligibleSkills} from './onboarding-state.mjs';
export function testDecisions(state){return state.onboarding?.testDecisions||{};}
export function chooseTest(state,skill,decision){if(!state.skills.includes(skill))return state;const next=structuredClone(state);next.onboarding={...next.onboarding,testDecisions:{...testDecisions(next),[skill]:decision}};return next;}
export function pendingTestSkill(state){const ready=eligibleSkills(state),choices=testDecisions(state);return state.skills.find(k=>!ready.includes(k)&&!choices[k]);}
export function afterTestUrl(state){const skill=pendingTestSkill(state);return skill?`key-onboarding-start.html?skill=${skill}`:'key-onboarding-start.html#questions';}
export function invitationSkill(state,requested){return state.skills.includes(requested)?requested:pendingTestSkill(state)||state.skills.at(-1);}
