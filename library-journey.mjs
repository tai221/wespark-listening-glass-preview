// Decorative learning flow; connectors follow the actual mascot layout.
const journey=document.querySelector('.library-journey');
if(journey){
  const svg=journey.querySelector('.journey-route');
  const segments=svg.querySelector('.journey-route-segments');
  const light=svg.querySelector('.journey-route-light');
  const comet=svg.querySelector('.journey-comet');
  const ns='http://www.w3.org/2000/svg';
  function drawRoute(){
    const origin=svg.getBoundingClientRect();
    if(!origin.width)return;
    svg.setAttribute('viewBox',`0 0 ${origin.width} ${origin.height}`);
    const nodes=[...journey.querySelectorAll('.journey-art')].map(art=>{
      const r=art.getBoundingClientRect();
      return {x:r.left+r.width/2-origin.left,y:r.top+r.height/2-origin.top,pad:art.querySelector('.journey-symbol').offsetWidth/2+4};
    });
    const paths=[];
    for(let i=0;i<nodes.length-1;i++){
      const a=nodes[i],b=nodes[i+1],start=a.x+a.pad,end=b.x-b.pad,width=end-start;
      if(width<=0)continue;
      const y=(a.y+b.y)/2,mid=(start+end)/2,lift=Math.min(12,width*.04);
      // Two smooth cubic halves create a real midpoint for the arrow marker.
      paths.push(`M${start} ${y} C${start+width/6} ${y-lift/2} ${start+width/3} ${y-lift*.75} ${mid} ${y-lift*.75} C${start+width*2/3} ${y-lift*.75} ${end-width/6} ${y-lift/2} ${end} ${y}`);
    }
    segments.replaceChildren(...paths.map(d=>{
      const path=document.createElementNS(ns,'path');path.setAttribute('class','journey-route-base');path.setAttribute('d',d);path.setAttribute('marker-end','url(#journey-arrow-head)');return path;
    }));
    // A single continuous path avoids one dash restarting on each subpath.
    const route=paths.map((d,i)=>i?d.replace(/^M/,'L'):d).join(' ');
    light.setAttribute('d',route);
    comet.style.offsetPath=`path("${route}")`;
  }
  drawRoute();
  document.fonts?.ready.then(drawRoute);
  if('ResizeObserver' in window)new ResizeObserver(drawRoute).observe(journey);
  else window.addEventListener('resize',drawRoute);
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.some(entry=>entry.isIntersecting);
      journey.dataset.journeyVisible=String(visible);
      if(visible)journey.dataset.journeyReady='true';
    },{threshold:.3});
    observer.observe(journey);
  }else{journey.dataset.journeyReady='true';journey.dataset.journeyVisible='true';}
}
