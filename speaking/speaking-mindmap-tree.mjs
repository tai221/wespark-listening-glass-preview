// Shared geometry for separate question, branch and leaf nodes in both Speaking stages.
export const TREE_WIDTH=940;
export const treeHeight=counts=>Math.max(650,440+Math.max(0,...counts)*88);
export function treeLinks(counts=[]){
 const paths=[['question-answer','M460 110C460 135 185 120 185 150'],['question-expand','M460 110C460 135 725 130 725 160']];
 counts.forEach((count,branch)=>{
  const x=390+branch*280,cx=x+115;
  paths.push([`expand-branch-${branch}`,`M725 250C725 285 ${cx} 280 ${cx} 325`]);
  for(let leaf=0;leaf<count;leaf++){
   const y=440+leaf*88+36;
   paths.push([`branch-${branch}-leaf-${leaf}`,`M${cx} 397C${cx} 415 ${x-22} 405 ${x-22} 425V${y-12}Q${x-22} ${y} ${x} ${y}`]);
  }
 });
 return `<svg class="mm-tree-links" viewBox="0 0 ${TREE_WIDTH} ${treeHeight(counts)}" width="${TREE_WIDTH}" height="${treeHeight(counts)}" aria-hidden="true">${paths.map(([id,d])=>`<path data-tree-link="${id}" d="${d}"/>`).join('')}</svg>`;
}
