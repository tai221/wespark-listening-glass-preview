// Shared geometry: extra outline branches wrap into additional rows.
export const TREE_WIDTH=940;
export const branchLeft=index=>390+index*280;
export const branchTop=()=>325;
export const treeWidth=counts=>Math.max(TREE_WIDTH,390+counts.length*280);
export const treeHeight=counts=>Math.max(650,...counts.map((count,index)=>branchTop(counts,index)+115+count*88+30));
export function treeLinks(counts=[]){
 const paths=[['question-answer','M390 141C335 148 185 105 185 150'],['question-expand','M530 141C590 154 725 115 725 160']];
 counts.forEach((count,branch)=>{
  const x=branchLeft(branch),cx=x+115,top=branchTop(counts,branch);
  paths.push([`expand-branch-${branch}`,`M${685+Math.min(branch,4)*20} 250C${685+Math.min(branch,4)*20} 286 ${cx} 275 ${cx} ${top}`]);
  if(count){
   const trunk=x-34,lastY=top+151+(count-1)*88;
   paths.push([`branch-${branch}-trunk`,`M${x+58} ${top+72}C${x+48} ${top+96} ${trunk} ${top+88} ${trunk} ${top+126}L${trunk} ${lastY-22}Q${trunk} ${lastY} ${x} ${lastY}`]);
   for(let leaf=0;leaf<count;leaf++){
    const y=top+151+leaf*88;
    paths.push([`branch-${branch}-leaf-${leaf}`,leaf===count-1?`M${x-1} ${y}H${x}`:`M${trunk} ${y-22}C${trunk} ${y-8} ${x-18} ${y} ${x} ${y}`]);
   }
  }
 });
 return `<svg class="mm-tree-links" viewBox="0 0 ${treeWidth(counts)} ${treeHeight(counts)}" width="${treeWidth(counts)}" height="${treeHeight(counts)}" aria-hidden="true">${paths.map(([id,d])=>`<path data-tree-link="${id}" d="${d}"/>`).join('')}</svg>`;
}
