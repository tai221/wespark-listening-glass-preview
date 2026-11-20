// Shared Speaking destinations in both library shells.
export function mountSpeakingSidebar(sidebar,{practiceHref,current=false}){
 const parent=sidebar.querySelector('.project-nav-item[href="'+practiceHref+'"]');
 if(!parent)return;
 parent.classList.add('project-speaking-parent');
 if(current)parent.setAttribute('aria-current','location');
 const list=document.createElement('ul');list.className='project-speaking-subnav';list.setAttribute('aria-label','Speaking');
 const practice=document.createElement('a');practice.href=practiceHref;practice.textContent='Practice ielts';
 if(current)practice.setAttribute('aria-current','page');
 const mock=document.createElement('button');mock.type='button';mock.disabled=true;mock.textContent='Test ielts';mock.title='Sắp có';mock.setAttribute('aria-label','Test ielts · Sắp có');
 for(const control of [practice,mock]){const item=document.createElement('li');item.append(control);list.append(item);}
 parent.after(list);
}
