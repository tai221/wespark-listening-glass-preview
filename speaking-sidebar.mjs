// Compatibility for older preview shells: Speaking is one top-level destination.
export function mountSpeakingSidebar(sidebar,{practiceHref,current=false}){
 sidebar.querySelectorAll('.project-speaking-subnav').forEach(node=>node.remove());
 const parent=sidebar.querySelector('.project-nav-item[href="'+practiceHref+'"]');
 if(!parent)return;
 parent.classList.remove('project-speaking-parent');
 if(current)parent.setAttribute('aria-current','page');
}
