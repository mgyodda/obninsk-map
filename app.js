'use strict';
const places=window.PLACES;
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external=(url,label)=>`<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>`;
const detail=$('detail');
const detailWindow=$('detail-window');
const detailHome=detail.parentElement;
let savedBodyOverflow='';
function expandDetail(){
 if(detail.hidden||detailWindow.open)return;
 clearTimeout(timer);
 const scroll=detail.scrollTop;
 savedBodyOverflow=document.body.style.overflow;
 detailWindow.append(detail);
 document.body.style.overflow='hidden';
 $('expand-detail').textContent='Свернуть ↙';
 detailWindow.showModal();
 detail.scrollTop=scroll;
 $('expand-detail').focus({preventScroll:true});
}
function collapseDetail(){
 if(!detailWindow.open)return;
 const scroll=detail.scrollTop;
 detailWindow.close();
 detailHome.append(detail);
 document.body.style.overflow=savedBodyOverflow;
 $('expand-detail').textContent='Развернуть ↗';
 detail.scrollTop=scroll;
 if(!detail.hidden)$('expand-detail').focus({preventScroll:true});
}
$('expand-detail').addEventListener('click',()=>detailWindow.open?collapseDetail():expandDetail());
detailWindow.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();collapseDetail();});
detailWindow.addEventListener('click',e=>{if(e.target===detailWindow)collapseDetail();});
let selected=null,map,tiles,returnFocus=null,timer;
let activePhotos=[],photoIndex=0;
const markers=new Map();
const mobile=()=>matchMedia('(max-width:700px)').matches;
const finePointer=()=>matchMedia('(hover:hover) and (pointer:fine)').matches;
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
$('count').textContent=places.length;
document.querySelector('.map-label .muted').textContent=`/ организаций: ${places.length}`;
places.forEach((p,i)=>{
 const b=document.createElement('button');b.className='place';b.style.setProperty('--sector',p.group==='Наука'?'#66e4d0':p.group==='Медицина'?'#bca7ff':'#fac277');b.id='place-'+p.id;b.setAttribute('aria-pressed','false');b.setAttribute('aria-controls','detail');
 b.innerHTML=`<span class="place-num">${String(i+1).padStart(2,'0')}</span><span><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.category)}</small></span><span class="place-arrow" aria-hidden="true">↗</span>`;
 b.addEventListener('click',()=>openPlace(p,true,b));$('places').append(b);
});
function openPlace(p,focus=false,trigger=null){
 clearTimeout(timer);
 if($('lightbox').open||detailWindow.open)return;
 if(selected!==p.id||detail.hidden){
  selected=p.id;

  activePhotos=p.photos||[];photoIndex=0;
  const photo=activePhotos[0];
  $('detail-content').innerHTML=`
   ${photo?`<button class="detail-hero" id="open-photo" aria-label="Открыть фотогалерею"><img src="${escapeHTML(photo.url)}" alt="${escapeHTML(photo.caption)}"><span class="photo-expand">${activePhotos.length} фото · Смотреть ↗</span></button>`:''}
   <div class="detail-text"><span class="tag">${escapeHTML(p.category)}</span><h2 id="detail-title" tabindex="-1">${escapeHTML(p.name)}</h2>
   <p class="detail-lead">${escapeHTML(p.lead||'')}</p><div class="full-name">${escapeHTML(p.full)}</div>
   <div class="facts">${p.year?`<div><strong>${escapeHTML(p.year)}</strong><span>год основания${p.id==='karpov'?' площадки':''}</span></div>`:''}<div><strong>${p.examples?.length||0}</strong><span>примера продукции и работ</span></div></div>
   <p class="description">${escapeHTML(p.description)}</p>
   <h3>Что здесь создают</h3><div class="examples">${(p.examples||[]).map((e,i)=>`<article class="example"><span class="example-no">0${i+1}</span><div><h4>${escapeHTML(e[0])}</h4><p>${escapeHTML(e[1])}</p></div></article>`).join('')}</div>
   ${p.history?.length?`<h3>История в датах</h3><ol class="timeline">${p.history.map(h=>`<li><strong>${escapeHTML(h[0])}</strong><span>${escapeHTML(h[1])}</span></li>`).join('')}</ol>`:''}
   <h3>Фотографии <span class="section-count">${activePhotos.length}</span></h3>
   ${activePhotos.length?`<div class="gallery">${activePhotos.map((im,i)=>`<button class="gallery-item" data-photo="${i}" aria-label="Открыть фото ${i+1}: ${escapeHTML(im.caption)}"><img loading="lazy" src="${escapeHTML(im.url)}" alt="${escapeHTML(im.caption)}"><span>${String(i+1).padStart(2,'0')} ↗</span></button>`).join('')}</div><p class="photo-note">Архивные снимки и материалы предприятий. Превью кадрированы; полные изображения открываются по нажатию.</p>`:`<p class="photo-note">Проверенных фотографий пока нет. ${external(p.site,'Официальный сайт предприятия ↗')}</p>`}
   <h3>Направления работы</h3><div class="directions">${p.directions.map(x=>`<span>${escapeHTML(x)}</span>`).join('')}</div>
   <div class="address-card"><h3>Как найти</h3><div class="address">${escapeHTML(p.address)}</div>${external('https://yandex.ru/maps/?text='+encodeURIComponent(p.name+' '+p.address),'Открыть Яндекс Карты ↗')}</div>
   <a class="site-link" href="${escapeHTML(p.site)}" target="_blank" rel="noopener noreferrer">Официальный сайт ↗</a>
   <details class="sources"><summary>Источники и авторы фотографий</summary><p>${external(p.source,'Описание')}${p.geoSource?external(p.geoSource,'Координаты'):''}${p.addressSource?external(p.addressSource,'Адрес'):''}</p>
   <p>${(p.extraSources||[]).map((url,i)=>external(url,'Материал '+(i+1))).join(' ')}</p>
   ${activePhotos.map((im,i)=>`<p>${i+1}. ${escapeHTML(im.caption)}<br>${external(im.source,im.credit)} ${im.license?external(im.license,'Лицензия'):''}</p>`).join('')}
   <p>Проверено 14.09.2026. Метки — ориентиры территорий и адресов, не проверенные проходные. Примеры описывают деятельность предприятия и не являются инструкциями по применению продукции.</p></details></div>`;
  detail.hidden=false;detail.scrollTop=0;
  if(photo)$('open-photo').addEventListener('click',()=>showPhoto(0));
  $('detail-content').querySelectorAll('[data-photo]').forEach(btn=>btn.addEventListener('click',()=>showPhoto(Number(btn.dataset.photo))));
  $('detail-content').querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;const note=document.createElement('span');note.className='photo-failed';note.textContent='Фото недоступно · открыть источник';img.parentElement.append(note);},{once:true}));
  document.querySelectorAll('.place').forEach(b=>b.setAttribute('aria-pressed',String(b.id==='place-'+p.id)));
  markers.forEach((m,id)=>m.getElement()?.classList.toggle('selected',id===p.id));
 }
 if(focus){
  returnFocus=trigger||$('place-'+p.id);
  if(map){const zoom=14;let point=map.project(p.coords,zoom);if(!mobile())point.x+=Math.min(detail.offsetWidth/2,180);map.setView(map.unproject(point,zoom),zoom,{animate:!reduced()});}
  $('detail-title').focus({preventScroll:true});
 }
}

function showPhoto(index){
 if(!activePhotos.length)return;
 photoIndex=(index+activePhotos.length)%activePhotos.length;
 const p=activePhotos[photoIndex],img=$('large-photo');img.hidden=false;img.src=p.url;img.alt=p.caption;
 $('photo-caption').innerHTML=escapeHTML(p.caption)+'<br>'+external(p.source,p.credit)+(p.license?' · '+external(p.license,'Лицензия'):'');
 $('photo-position').textContent=(photoIndex+1)+' / '+activePhotos.length;
 $('prev-photo').disabled=$('next-photo').disabled=activePhotos.length<2;
 if(!$('lightbox').open)$('lightbox').showModal();
}
$('large-photo').addEventListener('error',()=>{$('large-photo').hidden=true;$('photo-caption').insertAdjacentHTML('afterbegin','<p>Изображение не загрузилось. Откройте источник по ссылке ниже.</p>');});
$('prev-photo').addEventListener('click',()=>showPhoto(photoIndex-1));
$('next-photo').addEventListener('click',()=>showPhoto(photoIndex+1));
document.addEventListener('keydown',e=>{if($('lightbox').open&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();showPhoto(photoIndex+(e.key==='ArrowRight'?1:-1));}});
function closeDetail(){collapseDetail();detail.hidden=true;selected=null;clearTimeout(timer);document.querySelectorAll('.place').forEach(b=>b.setAttribute('aria-pressed','false'));markers.forEach(m=>m.getElement()?.classList.remove('selected'));if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;}
$('close-detail').addEventListener('click',closeDetail);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('lightbox').open&&!detailWindow.open)closeDetail();});
$('close-photo').addEventListener('click',()=>$('lightbox').close());
$('lightbox').addEventListener('click',e=>{if(e.target===$('lightbox'))$('lightbox').close();});
function overview(){closeDetail();if(map)map.fitBounds(places.map(p=>p.coords),{padding:[65,65],maxZoom:13,animate:!reduced()});}
$('overview').addEventListener('click',overview);
if(window.L){
 map=L.map('map',{zoomControl:false,scrollWheelZoom:true,minZoom:9,maxZoom:19});
 map.attributionControl.setPrefix('<a href="https://leafletjs.com/" target="_blank" rel="noopener noreferrer">Leaflet</a>');
 L.control.zoom({position:'topright',zoomInTitle:'Приблизить',zoomOutTitle:'Отдалить'}).addTo(map);
 L.control.scale({position:'bottomleft',imperial:false}).addTo(map);
 const streets=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'});
 const satellite=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Imagery &copy; <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank" rel="noopener noreferrer">Esri, Maxar, Earthstar Geographics and the GIS User Community</a>'});
 tiles=satellite;tiles.addTo(map);
 L.control.layers({'Спутник':satellite,'Улицы':streets},null,{position:'bottomleft',collapsed:false}).addTo(map);
 let failed=0,loaded=0;
 map.on('baselayerchange',e=>{tiles=e.layer;failed=0;loaded=0;$('map-error').hidden=true;});
 for(const layer of [streets,satellite]){
  layer.on('loading',()=>{if(layer===tiles){failed=0;loaded=0;}});
  layer.on('tileerror',()=>{
   if(layer!==tiles)return;
   failed++;
   if(failed>2&&!loaded){
    if(layer===satellite){map.removeLayer(satellite);tiles=streets;failed=0;loaded=0;streets.addTo(map);}
    else $('map-error').hidden=false;
   }
  });
  layer.on('tileload',()=>{if(layer===tiles){loaded++;$('map-error').hidden=true;}});
 }
 $('retry').addEventListener('click',()=>{failed=0;$('map-error').hidden=true;tiles.redraw();});
 // Set the view before adding markers: Leaflet creates marker elements only after map load.
 overview();
 places.forEach((p,i)=>{
  const marker=L.marker(p.coords,{title:p.name,alt:p.name,keyboard:true,icon:L.divIcon({className:'pin',html:`<div class="pin-body"><span>${String(i+1).padStart(2,'0')}</span></div>`,iconSize:[44,44],iconAnchor:[22,44]}),riseOnHover:true}).addTo(map);
  marker.bindTooltip(escapeHTML(p.name),{className:'map-tooltip',direction:'bottom',offset:[0,5]});
  marker.on('mouseover',()=>{if(finePointer()&&!$('lightbox').open){clearTimeout(timer);timer=setTimeout(()=>openPlace(p),180);}});
  marker.on('mouseout',()=>clearTimeout(timer));
  marker.on('click',()=>openPlace(p,true,marker.getElement()));
  const bindKeyboard=()=>marker.getElement()?.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();openPlace(p,true,marker.getElement());}});
  marker.on('add',bindKeyboard);bindKeyboard();
  markers.set(p.id,marker);
 });
 new ResizeObserver(()=>map.invalidateSize()).observe($('map'));
}else{$('map-error').hidden=false;$('map-error').textContent='Не удалось загрузить карту. Выберите предприятие из списка.';}

let activeGroup='Все';
const searchText=p=>[p.name,p.full,p.category,p.address,p.lead,...p.directions,...(p.examples||[]).flat()].join(' ').toLocaleLowerCase('ru').replace(/ё/g,'е');
function applyFilters(){
 const q=$('search').value.trim().toLocaleLowerCase('ru').replace(/ё/g,'е');
 const visible=places.filter(p=>(activeGroup==='Все'||p.group===activeGroup)&&searchText(p).includes(q));
 const ids=new Set(visible.map(p=>p.id));
 places.forEach(p=>{$('place-'+p.id).hidden=!ids.has(p.id);const marker=markers.get(p.id);if(map&&marker){if(ids.has(p.id)&&!map.hasLayer(marker))marker.addTo(map);else if(!ids.has(p.id)&&map.hasLayer(marker))map.removeLayer(marker);}});
 if(selected&&!ids.has(selected))closeDetail();
 $('count').textContent=visible.length+' / '+places.length;
 $('empty-results').hidden=visible.length!==0;
}
$('search').addEventListener('input',applyFilters);
document.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{activeGroup=b.dataset.group;document.querySelectorAll('[data-group]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));applyFilters();}));
$('clear-search').addEventListener('click',()=>{$('search').value='';activeGroup='Все';document.querySelectorAll('[data-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group==='Все')));applyFilters();$('search').focus();});
