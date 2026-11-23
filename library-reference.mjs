// Share the original lesson behavior; isolate cover changes to this version.
import './library.mjs?v=test-placeholder-20261123';

const heading=document.querySelector('.library-intro h1');
const markedTitle=document.createElement('span');
markedTitle.className='library-title-mark';markedTitle.textContent='Listening';
heading.replaceChildren(document.createTextNode('Thư viện '),markedTitle);

const videos={planet:'_6xlNyWPpB8',sport:'atPNphv-NEI',garden:'X3SP1Fub3bw'};
const grid=document.querySelector('#lessons');
function updateCovers(){
  for(const card of grid.querySelectorAll('.lesson-card')){
    const image=card.querySelector('.lesson-art>img');
    const id=image?.getAttribute('src')?.match(/\/([a-z]+)-v1\.webp$/)?.[1];
    if(!id)continue;
    const art=image.parentElement;
    const title=card.querySelector('h2').textContent;
    const action=card.querySelector('.lesson-body>.button');
    action.setAttribute('aria-label',`${action.textContent.replace(/\s*→\s*$/,'')} · ${title}`);
    if(action.textContent.endsWith('→')&&!action.querySelector('.lesson-action-arrow')){
      const label=action.textContent.replace(/\s*→\s*$/,'');
      const arrow=document.createElement('span');
      arrow.className='lesson-action-arrow';arrow.textContent='→';arrow.setAttribute('aria-hidden','true');
      action.replaceChildren(document.createTextNode(`${label} `),arrow);
    }
    if(videos[id]){
      art.dataset.coverType='video';
      card.dataset.youtubeSource=`https://www.youtube.com/watch?v=${videos[id]}`;
      image.src=`assets/lesson-covers/${id}-youtube-v1.jpg`;
      image.title='Thumbnail từ video YouTube minh họa cùng chủ đề';
    }else{
      art.dataset.coverType='audio';
      image.src=`assets/lesson-covers/${id}-2d-v1.png`;
    }
  }
}
updateCovers();
new MutationObserver(updateCovers).observe(grid,{childList:true});
