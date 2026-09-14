'use strict';
const places=window.PLACES;
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external=(url,label)=>`<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>`;
const detail=$('detail');
let selected=null,map,tiles,returnFocus=null,timer;
const markers=new Map();
const mobile=()=>matchMedia('(max-width:700px)').matches;
const finePointer=()=>matchMedia('(hover:hover) and (pointer:fine)').matches;
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
$('count').textContent=places.length;
document.querySelector('.map-label .muted').textContent=`/ ${places.length} места`;
places.forEach((p,i)=>{
 const b=document.createElement('button');b.className='place';b.id='place-'+p.id;b.setAttribute('aria-pressed','false');b.setAttribute('aria-controls','detail');
 b.innerHTML=`<span class="place-num">${String(i+1).padStart(2,'0')}</span><span><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.category)}</small></span><span class="place-arrow" aria-hidden="true">↗</span>`;
 b.addEventListener('click',()=>openPlace(p,true,b));$('places').append(b);
});
function openPlace(p,focus=false,trigger=null){
 clearTimeout(timer);
 if(selected!==p.id||detail.hidden){
  selected=p.id;
  const photo=p.photo;
  $('detail-content').innerHTML=`${photo?`<button class="detail-hero" id="open-photo" aria-label="Увеличить фотографию"><img src="${escapeHTML(photo.url)}" alt="${escapeHTML(photo.caption)}"><span class="photo-expand">Фото ↗</span></button>`:''}<div class="detail-text"><span class="tag">${escapeHTML(p.category)}</span><h2 id="detail-title" tabindex="-1">${escapeHTML(p.name)}</h2><div class="full-name">${escapeHTML(p.full)}</div><div class="facts"><div><strong>${escapeHTML(p.year)}</strong><span>год основания${p.id==='karpov'?' площадки':''}</span></div><div><strong>Обнинск</strong><span>Калужская область</span></div></div><p class="description">${escapeHTML(p.description)}</p><h3>Направления работы</h3><div class="directions">${p.directions.map(x=>`<span>${escapeHTML(x)}</span>`).join('')}</div><h3>Адрес</h3><div class="address">${escapeHTML(p.address)}</div><a class="site-link" href="${escapeHTML(p.site)}" target="_blank" rel="noopener noreferrer">Официальный сайт ↗</a><div class="sources">Источники: ${external(p.source,'описание')}${p.geoSource?external(p.geoSource,'координаты'):''}${p.addressSource?external(p.addressSource,'адрес'):''}${photo?`<br>Фото: ${external(photo.source,photo.credit)}${photo.license?' · '+external(photo.license,'Лицензия'):''}<br>${escapeHTML(photo.caption)}<br>Превью кадрировано; полное фото — по нажатию.`:''}<br>Сведения проверены 14.09.2026. Метка — ориентир территории.</div></div>`;
  detail.hidden=false;detail.scrollTop=0;
  if(photo){
   $('open-photo').addEventListener('click',()=>{ $('large-photo').src=photo.url;$('large-photo').alt=photo.caption;$('photo-caption').innerHTML=escapeHTML(photo.caption)+' · '+external(photo.source,photo.credit);$('lightbox').showModal();});
   const img=$('open-photo').querySelector('img');img.addEventListener('error',()=>{const n=document.createElement('div');n.className='photo-failed';n.innerHTML=`Фото не загрузилось. ${external(photo.source,'Открыть источник ↗')}`;img.parentElement.replaceWith(n);},{once:true});
  }
  document.querySelectorAll('.place').forEach(b=>b.setAttribute('aria-pressed',String(b.id==='place-'+p.id)));
  markers.forEach((m,id)=>m.getElement()?.classList.toggle('selected',id===p.id));
 }
 if(focus){
  returnFocus=trigger||$('place-'+p.id);
  if(map){const zoom=14;let point=map.project(p.coords,zoom);if(!mobile())point.x+=Math.min(detail.offsetWidth/2,180);map.setView(map.unproject(point,zoom),zoom,{animate:!reduced()});}
  $('detail-title').focus({preventScroll:true});
 }
}
function closeDetail(){detail.hidden=true;selected=null;clearTimeout(timer);document.querySelectorAll('.place').forEach(b=>b.setAttribute('aria-pressed','false'));markers.forEach(m=>m.getElement()?.classList.remove('selected'));if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;}
$('close-detail').addEventListener('click',closeDetail);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('lightbox').open)closeDetail();});
$('close-photo').addEventListener('click',()=>$('lightbox').close());
$('lightbox').addEventListener('click',e=>{if(e.target===$('lightbox'))$('lightbox').close();});
function overview(){closeDetail();if(map)map.fitBounds(places.map(p=>p.coords),{padding:[65,65],maxZoom:13,animate:!reduced()});}
$('overview').addEventListener('click',overview);
if(window.L){
 map=L.map('map',{zoomControl:false,scrollWheelZoom:true,minZoom:9,maxZoom:19});
 L.control.zoom({position:'topright',zoomInTitle:'Приблизить',zoomOutTitle:'Отдалить'}).addTo(map);
 L.control.scale({position:'bottomleft',imperial:false}).addTo(map);
 tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'}).addTo(map);
 let failed=0,loaded=0;
 tiles.on('loading',()=>{failed=0;loaded=0;});
 tiles.on('tileerror',()=>{failed++;if(failed>2&&!loaded)$('map-error').hidden=false;});
 tiles.on('tileload',()=>{loaded++;$('map-error').hidden=true;});
 $('retry').addEventListener('click',()=>{failed=0;$('map-error').hidden=true;tiles.redraw();});
 places.forEach((p,i)=>{
  const marker=L.marker(p.coords,{title:p.name,alt:p.name,keyboard:true,icon:L.divIcon({className:'pin',html:`<div class="pin-body"><span>${String(i+1).padStart(2,'0')}</span></div>`,iconSize:[44,44],iconAnchor:[22,44]}),riseOnHover:true}).addTo(map);
  marker.bindTooltip(escapeHTML(p.name),{className:'map-tooltip',direction:'bottom',offset:[0,5]});
  marker.on('mouseover',()=>{if(finePointer()){clearTimeout(timer);timer=setTimeout(()=>openPlace(p),180);}});
  marker.on('mouseout',()=>clearTimeout(timer));
  marker.on('click',()=>openPlace(p,true,marker.getElement()));
  marker.getElement().addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();openPlace(p,true,marker.getElement());}});
  markers.set(p.id,marker);
 });
 overview();
 new ResizeObserver(()=>map.invalidateSize()).observe($('map'));
}else{$('map-error').hidden=false;$('map-error').textContent='Не удалось загрузить карту. Выберите предприятие из списка.';}
