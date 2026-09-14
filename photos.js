// Фотографии Wikimedia загружаются с оригинального источника.
const photos={
 ippe:{url:'https://upload.wikimedia.org/wikipedia/commons/3/38/Obninsk-AES.jpg',caption:'Первая Обнинская АЭС на территории ФЭИ, 2008 год. Это здание АЭС, а не главный корпус института.',credit:'А.Савин, Википедия · CC BY-SA 3.0',license:'https://creativecommons.org/licenses/by-sa/3.0/',source:'https://commons.wikimedia.org/wiki/File:Obninsk-AES.jpg'},
 technologiya:{url:'images/technologiya.jpg',caption:'Фасад ОНПП «Технология» им. А. Г. Ромашина. Публикация 2025 года.',credit:'ОНПП «Технология» / Администрация Обнинска',source:'https://admobninsk.ru/news/2025/10/24/news_34090.html'},
 typhoon:{url:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Center_Obninsk_view_at_the_meteorological_twr.jpg',caption:'Обнинская метеомачта: вид через бульвар Окридж, 2021 год. На карте отмечена территория НПО, не сама мачта.',credit:'Philip Alon · CC BY-SA 4.0',license:'https://creativecommons.org/licenses/by-sa/4.0/',source:'https://commons.wikimedia.org/wiki/File:Center_Obninsk_view_at_the_meteorological_twr.jpg'},
 karpov:{url:'images/karpov.jpg',caption:'Здание обнинского филиала НИФХИ им. Л. Я. Карпова. Публикация 2014 года.',credit:'Атомная энергия 2.0 / livepark.pro',source:'https://www.atomic-energy.ru/news/2014/11/14/52921'}
};
window.PLACES.forEach(p=>{p.photo=photos[p.id];});
