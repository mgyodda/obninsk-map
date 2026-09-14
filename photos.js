const galleries = {
  "ippe": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/3/38/Obninsk-AES.jpg",
      "caption": "Первая Обнинская АЭС на территории ФЭИ, 2008 год. Это здание АЭС, а не главный корпус института.",
      "credit": "А.Савин, Википедия · CC BY-SA 3.0",
      "license": "https://creativecommons.org/licenses/by-sa/3.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Obninsk-AES.jpg"
    }
  ],
  "technologiya": [
    {
      "url": "images/technologiya.jpg",
      "caption": "Фасад ОНПП «Технология» им. А. Г. Ромашина. Публикация 2025 года.",
      "credit": "ОНПП «Технология» / Администрация Обнинска",
      "source": "https://admobninsk.ru/news/2025/10/24/news_34090.html"
    }
  ],
  "typhoon": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Center_Obninsk_view_at_the_meteorological_twr.jpg",
      "caption": "Обнинская метеомачта: вид через бульвар Окридж, 2021 год. На карте отмечена территория НПО, не сама мачта.",
      "credit": "Philip Alon · CC BY-SA 4.0",
      "license": "https://creativecommons.org/licenses/by-sa/4.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Center_Obninsk_view_at_the_meteorological_twr.jpg"
    }
  ],
  "karpov": [
    {
      "url": "images/karpov.jpg",
      "caption": "Здание обнинского филиала НИФХИ им. Л. Я. Карпова. Публикация 2014 года.",
      "credit": "Атомная энергия 2.0 / livepark.pro",
      "source": "https://www.atomic-energy.ru/news/2014/11/14/52921"
    }
  ],
  "signal": [
    {
      "url": "https://pz-signal.ru/themes/signal/assets/images/history/obninsk1968.png",
      "caption": "Строительство завода «Сигнал». Архивный снимок, на сайте датирован 1969 годом.",
      "source": "https://pz-signal.ru/history",
      "credit": "Архив ПЗ «Сигнал»"
    },
    {
      "url": "https://pz-signal.ru/themes/signal/assets/images/history/ceh.png",
      "caption": "Сборочно-монтажный цех: исторический снимок из архива предприятия.",
      "source": "https://pz-signal.ru/history",
      "credit": "Архив ПЗ «Сигнал»"
    },
    {
      "url": "https://pz-signal.ru/storage/app/uploads/public/620/13d/35c/62013d35c600d259166701.png",
      "caption": "Микроцентрифуга-встряхиватель «Сигмед МЦ-01». Изображение продукции.",
      "source": "https://pz-signal.ru/products/detail/mikrocentrifuga-sigmed-mc-01",
      "credit": "ПЗ «Сигнал»"
    }
  ],
  "orgsintez": [
    {
      "url": "https://sintecgroup.ru/production/prod-2.jpg",
      "caption": "Иллюстрация ассортимента из официального раздела продукции SINTEC Group.",
      "source": "https://sintecgroup.ru/production/",
      "credit": "SINTEC Group"
    },
    {
      "url": "https://sintecgroup.ru/production/prod-3.jpg",
      "caption": "Иллюстрация продукции SINTEC Group. Это материал группы, не фотография фасада предприятия.",
      "source": "https://sintecgroup.ru/production/",
      "credit": "SINTEC Group"
    }
  ],
  "hemofarm": [
    {
      "url": "https://nizhpharm.ru/css/images/redesign/factory-ob.jpg",
      "caption": "Производственная площадка в Обнинске.",
      "source": "https://nizhpharm.ru/",
      "credit": "Группа «НИЖФАРМ»"
    },
    {
      "url": "https://nizhpharm.ru/resize/w640/upload/iblock/b1c/gz9l9nsujil7czzbx23pwjxjaa566u7r/004_0587.jpg?636bf045=&nowebp=",
      "caption": "Фотография из медиабиблиотеки обнинской производственной площадки.",
      "source": "https://nizhpharm.ru/company/proizvodstnennie-ploschadki/obninsk/",
      "credit": "Группа «НИЖФАРМ»"
    },
    {
      "url": "https://nizhpharm.ru/resize/w640/upload/iblock/506/070_3138.jpg?a4d8410c=&nowebp=",
      "caption": "Обнинская площадка: официальная медиабиблиотека предприятия.",
      "source": "https://nizhpharm.ru/company/proizvodstnennie-ploschadki/obninsk/",
      "credit": "Группа «НИЖФАРМ»"
    }
  ],
  "metra": []
};
window.PLACES.forEach(p=>{p.photos=galleries[p.id]||[];p.photo=p.photos[0];});
