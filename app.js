const STORAGE_KEY = "ashana-campaign-v1";
const UI_STORAGE_KEY = "ashana-ui-v1";
const WIKI_INDEX_ID = "__wiki_index";
const SUPABASE_URL = "https://msthqpeisopneallhkpk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Qp0Z8J0uymysKz7KJRYUdA__74_rnbj";
const SUPABASE_BUCKET = "ashana-media";
let storageWarningShown = false;
let supabaseClient = null;
let supabaseUser = null;
let supabaseProfile = null;
let cloudStatus = "Локальный режим";
let cloudSaveTimer = null;
let rollSubscription = null;

const wikiCategories = [
  { id: "gods", title: "Боги", hint: "Пантеон, культы, догматы и святыни." },
  { id: "places", title: "Места в мире", hint: "Регионы, дороги, города, руины и подземелья." },
  { id: "people", title: "Известные личности", hint: "Правители, герои, исторические фигуры." },
  { id: "npcs", title: "Выделяющиеся NPC", hint: "Союзники, враги, заказчики и странные знакомые." },
  { id: "buildings", title: "Важные постройки", hint: "Храмы, крепости, башни, архивы и таверны." },
  { id: "states", title: "Государства", hint: "Королевства, города-государства, кланы и союзы." },
  { id: "factions", title: "Фракции", hint: "Ордены, культы, гильдии и тайные общества." },
  { id: "artifacts", title: "Артефакты", hint: "Реликвии, проклятые вещи и уникальная магия." },
  { id: "history", title: "История", hint: "Войны, катастрофы, календарь и древние эпохи." },
  { id: "threats", title: "Угрозы", hint: "Монстры, культы, болезни и текущие опасности." },
];

const categoryAliases = {
  Боги: "gods",
  Места: "places",
  Государства: "states",
  Тайны: "history",
};

const characterTabs = [
  ["summary", "Общее"],
  ["stats", "Характеристики"],
  ["combat", "Бой"],
  ["skills", "Навыки"],
  ["features", "Черты"],
  ["magic", "Магия"],
  ["inventory", "Инвентарь"],
  ["notes", "Заметки"],
];

const pathfinderSkills = [
  ["АКРОБАТИКА", "dex"],
  ["БЛЕФ", "cha"],
  ["ВЕРХОВАЯ ЕЗДА", "dex"],
  ["ВНИМАНИЕ", "wis"],
  ["ВЫЖИВАНИЕ", "wis"],
  ["ДИПЛОМАТИЯ", "cha"],
  ["ДРЕССИРОВКА*", "cha"],
  ["ЗАПУГИВАНИЕ", "cha"],
  ["ЗНАНИЕ (ВЫСШИЙ СВЕТ)*", "int"],
  ["ЗНАНИЕ (ГЕОГРАФИЯ)*", "int"],
  ["ЗНАНИЕ (ИНЖЕНЕРНОЕ ДЕЛО)*", "int"],
  ["ЗНАНИЕ (ИСТОРИЯ)*", "int"],
  ["ЗНАНИЕ (КРАЕВЕДЕНИЕ)*", "int"],
  ["ЗНАНИЕ (МАГИЯ)*", "int"],
  ["ЗНАНИЕ (ПЛАНЫ)*", "int"],
  ["ЗНАНИЕ (ПОДЗЕМЕЛЬЯ)*", "int"],
  ["ЗНАНИЕ (ПРИРОДА)*", "int"],
  ["ЗНАНИЕ (РЕЛИГИЯ)*", "int"],
  ["ИЗВОРОТЛИВОСТЬ", "dex"],
  ["ИСПОЛНЕНИЕ", "cha"],
  ["ИСПОЛНЕНИЕ", "cha"],
  ["ИСПОЛЬЗОВАНИЕ МАГИЧЕСКИХ УСТРОЙСТВ*", "cha"],
  ["КОЛДОВСТВО*", "int"],
  ["ЛАЗАНИЕ", "str"],
  ["ЛЕЧЕНИЕ", "wis"],
  ["ЛОВКОСТЬ РУК*", "dex"],
  ["МАСКИРОВКА", "cha"],
  ["МЕХАНИКА*", "dex"],
  ["ОЦЕНКА", "int"],
  ["ПЛАВАНИЕ", "str"],
  ["ПОЛЕТ", "dex"],
  ["ПРОНИЦАТЕЛЬНОСТЬ", "wis"],
  ["ПРОФЕССИЯ*", "wis"],
  ["ПРОФЕССИЯ*", "wis"],
  ["РЕМЕСЛО", "int"],
  ["РЕМЕСЛО", "int"],
  ["РЕМЕСЛО", "int"],
  ["СКРЫТНОСТЬ", "dex"],
  ["ЯЗЫКОЗНАНИЕ*", "int"],
];

const hexTerrains = [
  ["пусто", "Пусто"],
  ["равнина", "Равнина"],
  ["лес", "Лес"],
  ["вода", "Вода"],
  ["вода-берег-1", "Вода: берег 1"],
  ["вода-берег-2", "Вода: берег 2"],
  ["вода-берег-3", "Вода: берег 3"],
  ["вода-берег-4", "Вода: берег 4"],
  ["болото", "Болото"],
  ["горы", "Горы"],
  ["дорога", "Дорога"],
  ["город", "Город"],
  ["деревня", "Деревня"],
  ["малая-деревня", "Малая деревня"],
  ["укрепление", "Укрепление"],
  ["опасность", "Опасность"],
  ["подземелье", "Подземелье"],
];

const terrainTileFiles = {
  равнина: "assets/hex-terrain/grass.png",
  лес: "assets/hex-terrain/forest.png",
  вода: "assets/hex-terrain/water1.png",
  "вода-берег-1": "assets/hex-terrain/water bereg1.png",
  "вода-берег-2": "assets/hex-terrain/water bereg2.png",
  "вода-берег-3": "assets/hex-terrain/water bereg3.png",
  "вода-берег-4": "assets/hex-terrain/water bereg4.png",
  болото: "assets/hex-terrain/boloto.png",
  горы: "assets/hex-terrain/mountain.png",
  дорога: "assets/hex-terrain/grass doroga1.png",
  город: "assets/hex-terrain/village.png",
  деревня: "assets/hex-terrain/village.png",
  "малая-деревня": "assets/hex-terrain/small village.png",
  укрепление: "assets/hex-terrain/castle.png",
  опасность: "assets/hex-terrain/bad place.png",
  подземелье: "assets/hex-terrain/temple destroyed.png",
};

const mapTypes = [
  ["Регион", "Регион"],
  ["Мир", "Мир"],
  ["Поселение", "Поселение"],
  ["Город", "Город"],
  ["Здание", "Здание"],
  ["Подземелье", "Подземелье"],
  ["Боевая карта", "Боевая карта"],
  ["Другое", "Другое"],
];

const npcTypes = [
  ["ally", "Союзник"],
  ["neutral", "Нейтрал"],
  ["enemy", "Враг"],
  ["merchant", "Торговец"],
  ["patron", "Заказчик"],
  ["unknown", "Неизвестно"],
];

const npcStatuses = [
  ["alive", "Жив"],
  ["dead", "Мертв"],
  ["missing", "Пропал"],
  ["hidden", "Скрыт"],
  ["unknown", "Неизвестно"],
];

const factionTypes = [
  ["state", "Государство"],
  ["cult", "Культ"],
  ["guild", "Гильдия"],
  ["order", "Орден"],
  ["family", "Семья"],
  ["army", "Армия"],
  ["other", "Другое"],
];

const influenceLevels = [
  ["low", "Низкое"],
  ["medium", "Среднее"],
  ["high", "Высокое"],
  ["major", "Огромное"],
];

const settlementTypes = [
  ["village", "Деревня"],
  ["town", "Городок"],
  ["city", "Город"],
  ["fort", "Крепость"],
  ["camp", "Лагерь"],
  ["port", "Порт"],
  ["estate", "Поместье"],
  ["other", "Другое"],
];

const buildingStatuses = [
  ["active", "Работает"],
  ["building", "Строится"],
  ["damaged", "Повреждена"],
  ["abandoned", "Заброшена"],
];

const problemSeverities = [
  ["low", "Низкая"],
  ["medium", "Средняя"],
  ["high", "Высокая"],
  ["critical", "Критическая"],
];

const problemStatuses = [
  ["active", "Активна"],
  ["resolved", "Решена"],
  ["hidden", "Скрыта"],
];

const defaultAshanaMonths = [
  "Золотого Пепла",
  "Серебряного Дождя",
  "Медного Листа",
  "Белого Ветра",
  "Алого Солнца",
  "Синей Воды",
  "Черного Камня",
  "Янтарного Поля",
  "Лунной Тени",
  "Последней Зари",
];

const ashanaWeekdays = [
  "Первый день",
  "Второй день",
  "Третий день",
  "Четвертый день",
  "Пятый день",
  "Шестой день",
  "Седьмой день",
  "Восьмой день",
  "Девятый день",
];

const calendarEventTypes = [
  ["session", "Сессия"],
  ["quest", "Задание"],
  ["travel", "Путешествие"],
  ["settlement", "Поселение"],
  ["danger", "Угроза"],
  ["holiday", "Праздник"],
  ["note", "Заметка"],
];

const seedData = {
  meta: {
    campaignName: "Герои Асханы",
    currentRegion: "Северные рубежи Короны Арвейна",
    currentDate: "17 день месяца Золотого Пепла",
    ashanaDate: { year: 1, month: 1, day: 17 },
    monthNames: defaultAshanaMonths,
    version: 2,
  },
  tagMeta: {
    "бог": {
      description: "Бог в Асхане - могущественная сущность, связанная с верой, доменами, клятвами, культами и силами, которые смертные редко понимают до конца.",
      image: "",
      public: true,
    },
    "место": {
      description: "Географическая или сюжетная точка мира: регион, город, дорога, руины, святилище или иная важная локация.",
      image: "",
      public: true,
    },
    "npc": {
      description: "Неигровой персонаж: союзник, враг, заказчик, свидетель, правитель, торговец или иной участник истории.",
      image: "",
      public: true,
    },
    "фракция": {
      description: "Организация, культ, государство, дом, гильдия или группа влияния со своими целями и ресурсами.",
      image: "",
      public: true,
    },
  },
  wiki: [
    {
      id: "solaris",
      title: "Соларис, Бог Непогасимого Завета",
      category: "Боги",
      categoryId: "gods",
      tags: ["свет", "клятвы", "храмы"],
      image: "",
      public: true,
      body:
        "Соларис почитается хранителями границ, судьями и теми, кто связывает свою судьбу клятвой. Его символом считается золотой диск с черной трещиной: свет остается светом даже после раны.\n\nВ Асхане его жрецы часто выступают свидетелями договоров между городами и кланами.",
    },
    {
      id: "arvein",
      title: "Корона Арвейна",
      category: "Государства",
      categoryId: "states",
      tags: ["люди", "север", "политика"],
      image: "",
      public: true,
      body:
        "Северное королевство с сильными пограничными крепостями и старой военной знатью. Корона удерживает торговые дороги к рудникам и спорит с прибрежными городами за пошлины.\n\nНедавние слухи говорят о пропаже караванов у Серого Тракта.",
    },
    {
      id: "grey-road",
      title: "Серый Тракт",
      category: "Места",
      categoryId: "places",
      tags: ["дорога", "караваны", "опасность"],
      image: "",
      public: true,
      body:
        "Старый каменный путь, проходящий через туманные низины. На милевых столбах сохранились руны доимперского периода.\n\nМестные проводники уверяют, что ночью на тракте слышны шаги тех, кто давно не должен ходить.",
    },
    {
      id: "black-archive",
      title: "Черный Архив",
      category: "Тайны",
      categoryId: "history",
      tags: ["мастер", "запретное", "секрет"],
      image: "",
      public: false,
      body:
        "Секретный раздел для мастера. Здесь можно хранить истинные мотивы NPC, скрытые свойства артефактов и будущие последствия решений партии.",
    },
  ],
  quests: [
    {
      id: "missing-caravan",
      title: "Пропавший караван",
      status: "active",
      patron: "Купеческая лига Арвейна",
      reward: "800 зм и право беспошлинного прохода",
      linked: "Серый Тракт",
      notes:
        "Найти караван мастера Лиора. Последний раз его видели у третьего милевого столба.",
      gmNotes: "На караван напали не разбойники, а разведчики из культа Пепельной Луны.",
    },
    {
      id: "oath-temple",
      title: "Печать в храме Солариса",
      status: "active",
      patron: "Сестра Эйрин",
      reward: "Доступ к храмовой библиотеке",
      linked: "Соларис",
      notes:
        "Проверить, почему алтарная печать начала темнеть после последнего затмения.",
      gmNotes: "Печать реагирует на ложную клятву одного из храмовых рыцарей.",
    },
    {
      id: "archive-key",
      title: "Ключ Черного Архива",
      status: "hidden",
      patron: "Неизвестно",
      reward: "Неизвестно",
      linked: "Черный Архив",
      notes: "Запись скрыта от игроков.",
      gmNotes: "Ключ находится у городского писаря, который не знает его назначения.",
    },
  ],
  factions: [
    {
      id: "arvein-crown",
      name: "Корона Арвейна",
      type: "state",
      leader: "Северный двор",
      headquarters: "Арвейн",
      relation: 1,
      influence: "major",
      public: true,
      image: "",
      tags: ["север", "политика", "люди"],
      description: "Северное королевство с сильной пограничной властью, старой знатью и интересом к торговым дорогам Межей.",
      gmNotes: "Внутри двора есть несколько групп, которые по-разному смотрят на самостоятельность пограничных баронств.",
      goals: "Удержать дороги, налоги и военное присутствие на северных рубежах.",
      resources: "Пограничные крепости, законники, рыцарские дома, сборщики пошлин.",
      allies: [],
      enemies: [],
      wikiLinks: ["arvein"],
      questLinks: ["missing-caravan"],
      npcLinks: [],
    },
    {
      id: "ash-moon-cult",
      name: "Культ Пепельной Луны",
      type: "cult",
      leader: "Неизвестно",
      headquarters: "Скрыто",
      relation: -4,
      influence: "medium",
      public: false,
      image: "",
      tags: ["культ", "секрет", "угроза"],
      description: "Слухи о культе, который появляется возле исчезнувших караванов и старых руин.",
      gmNotes: "Разведчики культа проверяют Серый Тракт и ищут ключи к Черному Архиву.",
      goals: "Открыть путь к архиву и собрать запрещенные тексты.",
      resources: "Агенты, тайники, подкупленные писари.",
      allies: [],
      enemies: ["arvein-crown"],
      wikiLinks: ["black-archive"],
      questLinks: ["archive-key"],
      npcLinks: [],
    },
  ],
  npcs: [
    {
      id: "sister-eyrin",
      name: "Сестра Эйрин",
      type: "patron",
      ancestry: "человек",
      role: "жрица Солариса",
      factionId: "arvein-crown",
      location: "Храм Солариса",
      relation: 2,
      status: "alive",
      public: true,
      portrait: "",
      tags: ["свет", "храм", "заказчик"],
      description: "Спокойная жрица, которая попросила партию разобраться с темнеющей алтарной печатью.",
      gmNotes: "Знает больше о ложной клятве храмового рыцаря, но пока не готова говорить прямо.",
      lastSeen: "Храм Солариса",
      wikiLinks: ["solaris"],
      questLinks: ["oath-temple"],
    },
    {
      id: "master-lior",
      name: "Мастер Лиор",
      type: "neutral",
      ancestry: "человек",
      role: "караванный мастер",
      factionId: "arvein-crown",
      location: "Серый Тракт",
      relation: 0,
      status: "missing",
      public: true,
      portrait: "",
      tags: ["караван", "пропал", "торговля"],
      description: "Караванный мастер, чей пропавший обоз стал поводом для расследования на Сером Тракте.",
      gmNotes: "Его караван захватили не разбойники, а разведчики культа.",
      lastSeen: "Третий милевой столб Серого Тракта",
      wikiLinks: ["grey-road"],
      questLinks: ["missing-caravan"],
    },
  ],
  settlements: [
    {
      id: "grey-ford",
      name: "Серый Брод",
      type: "village",
      ruler: "Совет старост",
      factionId: "arvein-crown",
      mapRegionId: "mezhi-canvas",
      population: 420,
      size: "малое поселение",
      loyalty: 1,
      security: 0,
      economy: 1,
      stability: 0,
      threat: 1,
      public: true,
      tags: ["тракт", "деревня", "торговля"],
      description: "Пограничное поселение у переправы на Сером Тракте. Живет торговлей, перевозом и снабжением караванов.",
      gmNotes: "Часть старост покрывает контрабандистов, чтобы удержать поселение от голода.",
      wikiLinks: ["grey-road"],
      questLinks: ["missing-caravan"],
      npcLinks: ["master-lior"],
      buildings: [
        { id: "market", name: "Рынок у переправы", type: "рынок", status: "active", income: 120, upkeep: 20, economy: 1, loyalty: 0, security: 0, stability: 0, threat: 0, notes: "Главный источник пошлин и слухов." },
        { id: "watch-post", name: "Сторожевой пост", type: "стража", status: "active", income: 0, upkeep: 55, economy: 0, loyalty: 0, security: 1, stability: 1, threat: -1, notes: "Держит переправу, но людей не хватает." },
        { id: "sun-shrine", name: "Святилище Солариса", type: "храм", status: "active", income: 20, upkeep: 10, economy: 0, loyalty: 1, security: 0, stability: 1, threat: 0, notes: "Место клятв, лечения и споров." },
      ],
      problems: [
        { id: "smuggling", title: "Контрабанда на переправе", severity: "medium", status: "active", income: -45, loyalty: -1, security: -1, economy: 0, stability: 0, threat: 1, public: true, linkedQuest: "missing-caravan", notes: "Кто-то проводит грузы мимо пошлин и стражи." },
        { id: "cult-signs", title: "Следы Пепельной Луны", severity: "high", status: "hidden", income: 0, loyalty: 0, security: -1, economy: 0, stability: -1, threat: 2, public: false, linkedQuest: "archive-key", notes: "Знаки нашли возле старого склада." },
      ],
      modifiers: [
        { id: "trade-road", title: "Торговый тракт", income: 35, upkeep: 0, loyalty: 0, security: 0, economy: 1, stability: 0, threat: 0, notes: "Поток караванов дает деньги и проблемы." },
        { id: "border-anxiety", title: "Пограничная тревога", income: 0, upkeep: 0, loyalty: -1, security: 0, economy: 0, stability: -1, threat: 1, notes: "Жители привыкли ждать беды с дороги." },
      ],
      log: [
        { date: "17 день Золотого Пепла", text: "Партия прибыла к переправе и услышала о пропавшем караване.", public: true },
      ],
    },
  ],
  calendarEvents: [
    {
      id: "arrival-grey-ford",
      title: "Партия прибывает к Серому Броду",
      type: "travel",
      date: { year: 1, month: 1, day: 17 },
      public: true,
      summary: "Герои выходят к переправе на Сером Тракте и узнают первые подробности о пропавшем караване.",
      gmNotes: "Хороший момент показать первые следы контрабанды и намек на культ Пепельной Луны.",
      wikiLinks: ["grey-road"],
      questLinks: ["missing-caravan"],
      npcLinks: ["master-lior"],
      settlementLinks: ["grey-ford"],
      mapLinks: ["mezhi-canvas"],
    },
    {
      id: "oath-seal-deadline",
      title: "Печать храма темнеет сильнее",
      type: "danger",
      date: { year: 1, month: 1, day: 22 },
      public: false,
      summary: "Если никто не вмешается, алтарная печать Солариса перейдет в опасную фазу.",
      gmNotes: "Можно поднять сложность проверки или добавить осложнение в храме.",
      wikiLinks: ["solaris"],
      questLinks: ["oath-temple"],
      npcLinks: ["sister-eyrin"],
      settlementLinks: [],
      mapLinks: [],
    },
  ],
  sessionLogs: [
    {
      id: "session-1-grey-road",
      title: "След Серого Тракта",
      sessionNumber: 1,
      date: { year: 1, month: 1, day: 17 },
      public: true,
      players: "Ричи Голдманн и отряд",
      summary: "Партия добралась до Серого Тракта, услышала о пропавшем караване мастера Лиора и вышла к поселению Серый Брод.",
      decisions: "Герои решили начать с расспросов у переправы и проверить старые милевые столбы.",
      loot: "Пока без добычи.",
      consequences: "Серый Брод становится важной точкой расследования, а слухи о контрабанде начинают связываться с пропажей каравана.",
      gmNotes: "Следующая сессия может открыть конфликт между старостами, стражей и контрабандистами.",
      wikiLinks: ["grey-road"],
      questLinks: ["missing-caravan"],
      npcLinks: ["master-lior"],
      settlementLinks: ["grey-ford"],
      mapLinks: ["mezhi-canvas"],
    },
  ],
  characters: [
    {
      id: "richie-goldmann",
      name: "Ричи Голдманн",
      player: "Кирилл Голушков",
      ancestry: "человек-богатонец",
      className: "волшебник-инструктор 3 / вивисектор 1",
      homeland: "Богатония",
      deity: "",
      size: "Средний",
      gender: "Муж.",
      alignment: "ЗН",
      level: 4,
      hp: "22 / 22",
      ac: 20,
      touchAc: 14,
      flatFootedAc: 16,
      initiative: 6,
      speed: 30,
      bab: 2,
      cmb: 2,
      cmd: 16,
      portrait: "",
      stats: { str: 10, dex: 18, con: 14, int: 16, wis: 10, cha: 10 },
      saves: { fort: 5, ref: 6, will: 7 },
      skills: [
        { name: "Знание магии", ability: "int", ranks: 4, classSkill: true, misc: 3, armorPenalty: 0, total: 10 },
        { name: "Лечение", ability: "wis", ranks: 1, classSkill: true, misc: 4, armorPenalty: 0, total: 8 },
        { name: "Ремесло: мебельщик", ability: "int", ranks: 4, classSkill: true, misc: 3, armorPenalty: 0, total: 10 },
        { name: "Профессия: торговец", ability: "wis", ranks: 3, classSkill: true, misc: 0, armorPenalty: 0, total: 6 },
      ],
      attacks: [
        { name: "Двуручный топор гноллов", bonus: "+2", damage: "1d12", crit: "x3", range: "", type: "рубящий", notes: "+понимание гнолльского языка" },
        { name: "Луч несмертельного урона", bonus: "+6", damage: "1d6", crit: "x2", range: "30 фт", type: "луч", notes: "действие-реакция" },
      ],
      armor: [
        { name: "Клепаная кожанка", ac: "+3", maxDex: "5", penalty: "0", spellFail: "15%", notes: "" },
      ],
      feats: [
        "Благородный отпрыск",
        "Космополит",
        "Написание свитков",
        "Магия из крови",
        "Зельеварение",
        "Брось хоть что-нибудь",
      ],
      features: [
        "Преданный ученик",
        "Фокусы",
        "Магическая школа: Коммерция",
        "Сигна-шар 7/день",
        "2 экстракта в день",
        "1 мутаген на силу",
        "Скрытая атака +1d6 вместо бомбы",
      ],
      spells: [
        { level: 0, known: "Магическая метка / Престижимитация / Управляемое перо / Луч Мороза / Чтение магии", prepared: "" },
        { level: 1, known: "Удача ремесленника / Длинная рука / Магическая броня / Очаровать человека / Снежок", prepared: "" },
        { level: 2, known: "Сила быка / Ложная жизнь", prepared: "" },
      ],
      inventory: [
        { name: "Рюкзак", qty: "3", weight: "" },
        { name: "Бурдюк", qty: "2", weight: "" },
        { name: "Кремень и огниво", qty: "1", weight: "" },
        { name: "Инструменты мебельщика", qty: "1", weight: "" },
        { name: "Инструменты плотника", qty: "1", weight: "" },
        { name: "Три флакона чернил", qty: "1", weight: "" },
        { name: "Два пустых журнала", qty: "1", weight: "" },
        { name: "20-футовый измерительный шнур", qty: "1", weight: "" },
      ],
      languages: "Всеобщий, Богатонский, Обще-эльфийский, Гоблинский, Дьяволический, Высокий Церковный, диалект дроу",
      notes: "Пример расширенного листа по загруженному PDF. Поля можно полностью менять в админском JSON-редакторе.",
      gmNotes: "",
    },
    {
      id: "kael",
      name: "Каэль Рунный",
      player: "Игрок 1",
      ancestry: "человек",
      className: "маг 5",
      alignment: "НД",
      hp: "31 / 31",
      ac: 16,
      initiative: 3,
      speed: 30,
      stats: { str: 9, dex: 16, con: 12, int: 20, wis: 11, cha: 13 },
      saves: { fort: 2, ref: 4, will: 6 },
      skills: [
        ["Знание магии", 13],
        ["Колдовство", 14],
        ["Внимание", 5],
      ],
      attacks: [
        ["Посох", "+2", "1d6-1"],
        ["Луч холода", "+6", "1d3"],
      ],
      notes: "Ищет фрагменты доимперских рун. Носит перстень с расколотым сапфиром.",
    },
    {
      id: "mira",
      name: "Мира Вольная",
      player: "Игрок 2",
      ancestry: "полуэльф",
      className: "следопыт 5",
      alignment: "ХД",
      hp: "48 / 48",
      ac: 19,
      initiative: 6,
      speed: 30,
      stats: { str: 14, dex: 18, con: 14, int: 10, wis: 15, cha: 8 },
      saves: { fort: 6, ref: 8, will: 3 },
      skills: [
        ["Выживание", 12],
        ["Скрытность", 13],
        ["Внимание", 11],
      ],
      attacks: [
        ["Длинный лук", "+9", "1d8+2"],
        ["Короткий меч", "+7", "1d6+2"],
      ],
      notes: "Знает лесные тропы Арвейна и не доверяет городской страже.",
    },
  ],
  map: {
    zoom: 1,
    activeRegionId: "mezhi-canvas",
    selectedHex: "8,6",
    regions: [
      {
        id: "mezhi-canvas",
        title: "Межи: общая карта",
        type: "Регион",
        description: "Рабочее гекс-полотно Межей для путешествий, разведки и точек интереса.",
        public: true,
        image: "",
        mode: "canvas",
        grid: { cols: 24, rows: 16, hexSize: 96, offsetX: 24, offsetY: 24 },
        hexes: {
          "8,6": { title: "Лагерь партии", terrain: "лес", visible: true, notes: "Стартовая точка для редактирования карты Межей.", gmNotes: "", objects: ["партия", "лагерь"] },
          "9,6": { title: "Лесная дорога", terrain: "дорога", visible: true, notes: "Дорога через чащу.", gmNotes: "", objects: ["дорога"] },
          "10,6": { title: "Старая деревня", terrain: "деревня", visible: true, notes: "Небольшое поселение у дороги.", gmNotes: "", objects: ["поселение", "NPC"] },
          "11,6": { title: "Речной переход", terrain: "вода", visible: true, notes: "Место переправы.", gmNotes: "", objects: ["брод", "река"] },
        },
      },
    ],
  },
  gallery: [
    {
      id: "party-camp",
      title: "Стоянка у менгира",
      type: "Локация",
      linked: "Серый Тракт",
      palette: ["#d4a74f", "#4da9a7", "#111719"],
    },
    {
      id: "solaris-symbol",
      title: "Символ Солариса",
      type: "Религия",
      linked: "Соларис",
      palette: ["#f2d276", "#151515", "#b54b38"],
    },
    {
      id: "arvein-gates",
      title: "Ворота Арвейна",
      type: "Город",
      linked: "Корона Арвейна",
      palette: ["#6f7f83", "#d7ceb9", "#2f4248"],
    },
  ],
  rolls: [],
};

let state = loadState();
let currentView = "dashboard";
let isAdmin = false;
let activeWikiId = WIKI_INDEX_ID;
let activeCharacterId = state.characters[0]?.id ?? null;
let activeCharacterTab = "summary";
let activeWikiTag = "";
let activeWikiCategoryId = "";
let wikiCategorySearchTerm = "";
let wikiDraft = null;
let activeDirectoryTab = "npcs";
let activeSettlementId = state.settlements[0]?.id ?? null;
let activeCalendarDateKey = ashanaDateKey(state.meta.ashanaDate);
let activeSessionId = state.sessionLogs[0]?.id ?? null;
let skillSearchTerm = "";
let activeGalleryTag = "";
let mapZoom = state.map.zoom || 1;
let mapScroll = { left: 0, top: 0 };
let mapBrushTerrain = "лес";
let mapBrushEnabled = false;
let searchTerm = "";
let tagTooltipTimer = null;
let activeTagTooltip = null;
let activeMinigameCleanup = null;
let pendingWikiArticleScroll = false;

const savedUiState = loadUiState();

currentView = savedUiState.currentView || currentView;
if (!isKnownView(currentView)) currentView = "dashboard";
activeWikiId = savedUiState.activeWikiId || activeWikiId;
activeWikiTag = savedUiState.activeWikiTag || activeWikiTag;
activeWikiCategoryId = savedUiState.activeWikiCategoryId || activeWikiCategoryId;
wikiCategorySearchTerm = savedUiState.wikiCategorySearchTerm || wikiCategorySearchTerm;
activeCharacterId = savedUiState.activeCharacterId || activeCharacterId;
activeCharacterTab = savedUiState.activeCharacterTab || activeCharacterTab;
activeDirectoryTab = savedUiState.activeDirectoryTab || activeDirectoryTab;
activeSettlementId = savedUiState.activeSettlementId || activeSettlementId;
activeCalendarDateKey = savedUiState.activeCalendarDateKey || activeCalendarDateKey;
activeSessionId = savedUiState.activeSessionId || activeSessionId;
skillSearchTerm = savedUiState.skillSearchTerm || skillSearchTerm;
activeGalleryTag = savedUiState.activeGalleryTag || activeGalleryTag;
mapBrushTerrain = savedUiState.mapBrushTerrain || mapBrushTerrain;
mapBrushEnabled = Boolean(savedUiState.mapBrushEnabled ?? mapBrushEnabled);
mapZoom = Number(savedUiState.mapZoom || mapZoom);
mapScroll = savedUiState.mapScroll || mapScroll;
if (savedUiState.mapActiveRegionId) state.map.activeRegionId = savedUiState.mapActiveRegionId;
if (savedUiState.mapSelectedHex) state.map.selectedHex = savedUiState.mapSelectedHex;

const viewRoot = document.querySelector("#viewRoot");
const navItems = document.querySelectorAll(".nav-item");
const globalSearch = document.querySelector("#globalSearch");
const activeCharacterSelect = document.querySelector("#activeCharacterSelect");
const adminBadge = document.querySelector("#adminBadge");
const quickLoginButton = document.querySelector("#quickLoginButton");
const loginDialog = document.querySelector("#loginDialog");
const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");
const cancelLogin = document.querySelector("#cancelLogin");
const resetViewButton = document.querySelector("#resetViewButton");

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    } catch {
      // The app can still run in-memory if browser storage is unavailable.
    }
    return normalizeState(structuredClone(seedData));
  }

  try {
    return normalizeState({ ...structuredClone(seedData), ...JSON.parse(saved) });
  } catch {
    return normalizeState(structuredClone(seedData));
  }
}

function loadUiState() {
  try {
    const saved = JSON.parse(localStorage.getItem(UI_STORAGE_KEY) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveUiState() {
  try {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify({
      currentView,
      activeWikiId,
      activeWikiTag,
      activeWikiCategoryId,
      wikiCategorySearchTerm,
      activeCharacterId,
      activeCharacterTab,
      activeDirectoryTab,
      activeSettlementId,
      activeCalendarDateKey,
      activeSessionId,
      skillSearchTerm,
      activeGalleryTag,
      mapActiveRegionId: state.map.activeRegionId,
      mapSelectedHex: state.map.selectedHex,
      mapZoom,
      mapScroll,
      mapBrushTerrain,
      mapBrushEnabled,
    }));
  } catch (error) {
    console.warn("Не удалось сохранить положение интерфейса:", error.message);
  }
}

function isKnownView(view) {
  return ["dashboard", "wiki", "map", "directory", "settlements", "calendar", "sessions", "characters", "gallery", "quests", "roller", "minigame", "admin"].includes(view);
}

function normalizeState(raw) {
  const normalized = {
    ...structuredClone(seedData),
    ...raw,
    meta: { ...seedData.meta, ...(raw.meta ?? {}), version: 2 },
  };
  normalized.meta.ashanaDate = normalizeAshanaDate(normalized.meta.ashanaDate);
  normalized.meta.monthNames = normalizeMonthNames(normalized.meta.monthNames);
  normalized.meta.currentDate = formatAshanaDate(normalized.meta.ashanaDate, true, normalized.meta.monthNames);
  normalized.wiki = (raw.wiki ?? seedData.wiki).map(normalizeWikiArticle);
  normalized.characters = (raw.characters ?? seedData.characters).map(normalizeCharacter);
  if (!normalized.characters.some((character) => character.id === "richie-goldmann")) {
    normalized.characters.unshift(normalizeCharacter(seedData.characters[0]));
  }
  normalized.quests = raw.quests ?? seedData.quests;
  normalized.factions = (raw.factions ?? seedData.factions).map(normalizeFaction);
  normalized.npcs = (raw.npcs ?? seedData.npcs).map(normalizeNpc);
  normalized.settlements = (raw.settlements ?? seedData.settlements).map(normalizeSettlement);
  normalized.calendarEvents = (raw.calendarEvents ?? seedData.calendarEvents).map(normalizeCalendarEvent);
  normalized.sessionLogs = (raw.sessionLogs ?? seedData.sessionLogs).map(normalizeSessionLog);
  normalized.gallery = (raw.gallery ?? seedData.gallery).map(normalizeGalleryItem);
  normalized.tagMeta = normalizeTagMeta(raw.tagMeta ?? seedData.tagMeta, normalized);
  normalized.map = {
    ...seedData.map,
    ...(raw.map ?? {}),
  };
  normalized.map.regions = normalizeMapRegions(raw.map?.regions?.length ? raw.map.regions : seedData.map.regions);
  if (!normalized.map.regions.length) normalized.map.regions = normalizeMapRegions(seedData.map.regions);
  if (!normalized.map.regions.some((region) => region.id === normalized.map.activeRegionId)) {
    normalized.map.activeRegionId = normalized.map.regions[0]?.id ?? "mezhi-canvas";
  }
  normalized.map.selectedHex = raw.map?.selectedHex ?? seedData.map.selectedHex ?? "0,0";
  normalized.rolls = raw.rolls ?? [];
  return normalized;
}

function normalizeAshanaDate(date) {
  const source = date && typeof date === "object" ? date : seedData.meta.ashanaDate;
  return {
    year: Math.max(1, Number(source.year || 1)),
    month: Math.min(10, Math.max(1, Number(source.month || 1))),
    day: Math.min(36, Math.max(1, Number(source.day || 1))),
  };
}

function normalizeMonthNames(names) {
  const list = Array.isArray(names) ? names : [];
  return defaultAshanaMonths.map((fallback, index) => String(list[index] || fallback).trim() || fallback);
}

function campaignMonthNames() {
  return normalizeMonthNames(state?.meta?.monthNames);
}

function monthOptions() {
  return campaignMonthNames().map((name, index) => [String(index + 1), `${index + 1}. ${name}`]);
}

function ashanaDateIndex(date) {
  const normalized = normalizeAshanaDate(date);
  return (normalized.year - 1) * 360 + (normalized.month - 1) * 36 + (normalized.day - 1);
}

function ashanaDateFromIndex(index) {
  const safeIndex = Math.max(0, Number(index || 0));
  return {
    year: Math.floor(safeIndex / 360) + 1,
    month: Math.floor((safeIndex % 360) / 36) + 1,
    day: (safeIndex % 36) + 1,
  };
}

function formatAshanaDate(date, withYear = true, monthNames = null) {
  const normalized = normalizeAshanaDate(date);
  const names = monthNames ? normalizeMonthNames(monthNames) : campaignMonthNames();
  const monthName = names[normalized.month - 1] ?? `Месяц ${normalized.month}`;
  const year = withYear ? `, ${normalized.year} год` : "";
  return `${normalized.day} день месяца ${monthName}${year}`;
}

function ashanaWeekday(date) {
  const normalized = normalizeAshanaDate(date);
  return ashanaWeekdays[(normalized.day - 1) % 9] ?? `${((normalized.day - 1) % 9) + 1} день недели`;
}

function ashanaWeekNumber(date) {
  return Math.floor((normalizeAshanaDate(date).day - 1) / 9) + 1;
}

function ashanaDateKey(date) {
  const normalized = normalizeAshanaDate(date);
  return `${normalized.year}-${normalized.month}-${normalized.day}`;
}

function ashanaDateFromKey(key) {
  const [year, month, day] = String(key || "").split("-").map(Number);
  return normalizeAshanaDate({ year, month, day });
}

function setCurrentAshanaDate(date) {
  state.meta.ashanaDate = normalizeAshanaDate(date);
  state.meta.currentDate = formatAshanaDate(state.meta.ashanaDate);
  activeCalendarDateKey = ashanaDateKey(state.meta.ashanaDate);
}

function normalizeMapRegions(regions) {
  return regions.map((region) => ({
    id: region.id || slug(region.title || "region"),
    title: region.title || "Регион",
    type: region.type || "Регион",
    description: region.description || "",
    public: region.public ?? true,
    image: region.image || "",
    mode: region.mode || "canvas",
    grid: { cols: 24, rows: 14, hexSize: 92, offsetX: 0, offsetY: 0, ...(region.grid ?? {}) },
    hexes: Object.fromEntries(
      Object.entries(region.hexes ?? {}).map(([key, value]) => [
        key,
        {
          title: "",
          terrain: "пусто",
          visible: true,
          notes: "",
          gmNotes: "",
          objects: [],
          wikiLinks: [],
          questLinks: [],
          mapLinks: [],
          tileImage: "",
          tileFit: "cover",
          ...value,
          objects: Array.isArray(value.objects) ? value.objects : csv(value.objects ?? ""),
          wikiLinks: Array.isArray(value.wikiLinks) ? value.wikiLinks : csv(value.wikiLinks ?? ""),
          questLinks: Array.isArray(value.questLinks) ? value.questLinks : csv(value.questLinks ?? ""),
          mapLinks: Array.isArray(value.mapLinks) ? value.mapLinks : csv(value.mapLinks ?? ""),
        },
      ])
    ),
  }));
}

function normalizeWikiArticle(article) {
  const categoryId = article.categoryId || categoryAliases[article.category] || "places";
  return {
    image: "",
    imageStyle: defaultImageStyle(),
    related: [],
    gmBody: "",
    ...article,
    imageStyle: { ...defaultImageStyle(), ...(article.imageStyle ?? {}) },
    categoryId,
    category: article.category || wikiCategoryTitle(categoryId),
    tags: Array.isArray(article.tags) ? article.tags : csv(article.tags ?? ""),
  };
}

function normalizeGalleryItem(item) {
  return {
    image: "",
    imageStyle: defaultImageStyle(),
    tags: [],
    ...item,
    imageStyle: { ...defaultImageStyle(), ...(item.imageStyle ?? {}) },
    tags: Array.isArray(item.tags) ? item.tags : csv(item.tags ?? item.type ?? ""),
    palette: Array.isArray(item.palette) ? item.palette : ["#d4a74f", "#4da9a7", "#111719"],
  };
}

function normalizeTagMeta(meta, sourceState = state) {
  const normalized = {};
  const source = meta && typeof meta === "object" ? meta : {};
  Object.entries(source).forEach(([tagName, value]) => {
    const clean = normalizeTagName(tagName);
    if (!clean) return;
    normalized[clean] = normalizeTagMetaEntry(clean, value);
  });
  collectCampaignTags(sourceState).forEach((tagName) => {
    const clean = normalizeTagName(tagName);
    if (!clean || normalized[clean]) return;
    normalized[clean] = normalizeTagMetaEntry(clean, {});
  });
  return Object.fromEntries(Object.entries(normalized).sort(([a], [b]) => a.localeCompare(b, "ru")));
}

function normalizeTagMetaEntry(tagName, value = {}) {
  const entry = value && typeof value === "object" ? value : {};
  return {
    description: entry.description || defaultTagDescription(tagName),
    image: entry.image || "",
    imageStyle: { ...defaultImageStyle(), ...(entry.imageStyle ?? {}) },
    public: entry.public ?? true,
  };
}

function normalizeTagName(tagName) {
  return String(tagName || "").trim().toLowerCase();
}

function collectCampaignTags(sourceState = state) {
  const result = new Set();
  const add = (items) => (items ?? []).forEach((tagName) => {
    const clean = normalizeTagName(tagName);
    if (clean) result.add(clean);
  });
  (sourceState.wiki ?? []).forEach((item) => add(item.tags));
  (sourceState.gallery ?? []).forEach((item) => add(item.tags));
  (sourceState.npcs ?? []).forEach((item) => add(item.tags));
  (sourceState.factions ?? []).forEach((item) => add(item.tags));
  (sourceState.settlements ?? []).forEach((item) => add(item.tags));
  return [...result].sort((a, b) => a.localeCompare(b, "ru"));
}

function defaultTagDescription(tagName) {
  const value = normalizeTagName(tagName);
  const descriptions = {
    "бог": "Бог в Асхане - могущественная сущность, связанная с верой, доменами, клятвами, культами и силами, которые смертные редко понимают до конца.",
    "боги": "Раздел и теги, связанные с пантеонами, культами, божественными силами и их влиянием на смертных.",
    "место": "Географическая или сюжетная точка мира: регион, город, дорога, руины, святилище или иная важная локация.",
    "места": "Локации Асханы, которые важны для путешествий, заданий, политики или личных историй персонажей.",
    "npc": "Неигровой персонаж: союзник, враг, заказчик, свидетель, правитель, торговец или иной участник истории.",
    "фракция": "Организация, культ, государство, дом, гильдия или группа влияния со своими целями и ресурсами.",
    "поселение": "Населенный пункт, владение или база партии с постройками, доходами, проблемами и управлением.",
    "культ": "Закрытая религиозная или мистическая группа, часто связанная с тайными целями, обрядами и угрозами.",
    "секрет": "Информация, скрытая от игроков или известная не всем персонажам внутри мира.",
    "угроза": "Источник опасности: враг, бедствие, политический кризис, чудовище или надвигающееся событие.",
    "дорога": "Путь между локациями, важный для торговли, путешествий, засад, слухов и случайных встреч.",
    "город": "Крупное поселение с властью, фракциями, торговлей, законами и собственными конфликтами.",
    "деревня": "Малое поселение, обычно тесно связанное с местной экономикой, землей, соседями и слухами.",
    "торговля": "Деньги, рынки, пошлины, караваны, товары, долги и экономическое влияние.",
    "караван": "Группа путников или торговцев, перевозящая людей, товары, слухи и неприятности между землями.",
    "свет": "Темы света, очищения, откровения, защиты и сил, противостоящих тьме.",
    "клятвы": "Обеты, договоры, священные обещания и последствия их нарушения.",
    "храмы": "Священные места, духовные общины, реликвии и жрецы.",
  };
  return descriptions[value] || `Краткая справка по тегу "${tagName}". Мастер может заменить этот текст на точное описание термина Асханы.`;
}

function normalizeNpc(item) {
  return {
    id: item.id || slug(item.name || "npc"),
    name: item.name || "Новый NPC",
    type: item.type || "neutral",
    ancestry: item.ancestry || "",
    role: item.role || "",
    factionId: item.factionId || "",
    location: item.location || "",
    relation: Number(item.relation ?? 0),
    status: item.status || "alive",
    public: item.public ?? true,
    portrait: item.portrait || "",
    tags: Array.isArray(item.tags) ? item.tags : csv(item.tags ?? ""),
    description: item.description || "",
    gmNotes: item.gmNotes || "",
    lastSeen: item.lastSeen || "",
    wikiLinks: Array.isArray(item.wikiLinks) ? item.wikiLinks : csv(item.wikiLinks ?? ""),
    questLinks: Array.isArray(item.questLinks) ? item.questLinks : csv(item.questLinks ?? ""),
  };
}

function normalizeFaction(item) {
  return {
    id: item.id || slug(item.name || "faction"),
    name: item.name || "Новая фракция",
    type: item.type || "other",
    leader: item.leader || "",
    headquarters: item.headquarters || "",
    relation: Number(item.relation ?? 0),
    influence: item.influence || "medium",
    public: item.public ?? true,
    image: item.image || "",
    tags: Array.isArray(item.tags) ? item.tags : csv(item.tags ?? ""),
    description: item.description || "",
    gmNotes: item.gmNotes || "",
    goals: item.goals || "",
    resources: item.resources || "",
    allies: Array.isArray(item.allies) ? item.allies : csv(item.allies ?? ""),
    enemies: Array.isArray(item.enemies) ? item.enemies : csv(item.enemies ?? ""),
    wikiLinks: Array.isArray(item.wikiLinks) ? item.wikiLinks : csv(item.wikiLinks ?? ""),
    questLinks: Array.isArray(item.questLinks) ? item.questLinks : csv(item.questLinks ?? ""),
    npcLinks: Array.isArray(item.npcLinks) ? item.npcLinks : csv(item.npcLinks ?? ""),
  };
}

function normalizeSettlement(item) {
  return {
    id: item.id || slug(item.name || "settlement"),
    name: item.name || "Новое поселение",
    type: item.type || "village",
    ruler: item.ruler || "",
    factionId: item.factionId || "",
    mapRegionId: item.mapRegionId || "",
    population: Number(item.population ?? 0),
    size: item.size || "",
    loyalty: Number(item.loyalty ?? 0),
    security: Number(item.security ?? 0),
    economy: Number(item.economy ?? 0),
    stability: Number(item.stability ?? 0),
    threat: Number(item.threat ?? 0),
    public: item.public ?? true,
    tags: Array.isArray(item.tags) ? item.tags : csv(item.tags ?? ""),
    description: item.description || "",
    gmNotes: item.gmNotes || "",
    wikiLinks: Array.isArray(item.wikiLinks) ? item.wikiLinks : csv(item.wikiLinks ?? ""),
    questLinks: Array.isArray(item.questLinks) ? item.questLinks : csv(item.questLinks ?? ""),
    npcLinks: Array.isArray(item.npcLinks) ? item.npcLinks : csv(item.npcLinks ?? ""),
    buildings: normalizeSettlementRows(item.buildings, normalizeBuilding),
    problems: normalizeSettlementRows(item.problems, normalizeProblem),
    modifiers: normalizeSettlementRows(item.modifiers, normalizeModifier),
    log: normalizeSettlementRows(item.log, normalizeSettlementLog),
  };
}

function normalizeSettlementRows(rows, normalizer) {
  return Array.isArray(rows) ? rows.map(normalizer) : [];
}

function normalizeEffectNumber(value) {
  return Number(value ?? 0) || 0;
}

function normalizeBuilding(item) {
  return {
    id: item.id || slug(item.name || "building"),
    name: item.name || "Постройка",
    type: item.type || "",
    status: item.status || "active",
    income: normalizeEffectNumber(item.income),
    upkeep: normalizeEffectNumber(item.upkeep),
    loyalty: normalizeEffectNumber(item.loyalty),
    security: normalizeEffectNumber(item.security),
    economy: normalizeEffectNumber(item.economy),
    stability: normalizeEffectNumber(item.stability),
    threat: normalizeEffectNumber(item.threat),
    responsibleNpc: item.responsibleNpc || "",
    linkedQuest: item.linkedQuest || "",
    notes: item.notes || "",
  };
}

function normalizeProblem(item) {
  return {
    id: item.id || slug(item.title || "problem"),
    title: item.title || "Проблема",
    severity: item.severity || "medium",
    status: item.status || "active",
    income: normalizeEffectNumber(item.income),
    upkeep: normalizeEffectNumber(item.upkeep),
    loyalty: normalizeEffectNumber(item.loyalty),
    security: normalizeEffectNumber(item.security),
    economy: normalizeEffectNumber(item.economy),
    stability: normalizeEffectNumber(item.stability),
    threat: normalizeEffectNumber(item.threat),
    public: item.public ?? true,
    linkedQuest: item.linkedQuest || "",
    deadline: item.deadline || "",
    notes: item.notes || "",
  };
}

function normalizeModifier(item) {
  return {
    id: item.id || slug(item.title || "modifier"),
    title: item.title || "Модификатор",
    income: normalizeEffectNumber(item.income),
    upkeep: normalizeEffectNumber(item.upkeep),
    loyalty: normalizeEffectNumber(item.loyalty),
    security: normalizeEffectNumber(item.security),
    economy: normalizeEffectNumber(item.economy),
    stability: normalizeEffectNumber(item.stability),
    threat: normalizeEffectNumber(item.threat),
    notes: item.notes || "",
  };
}

function normalizeSettlementLog(item) {
  return {
    date: item.date || "",
    text: item.text || "",
    public: item.public ?? true,
  };
}

function normalizeCalendarEvent(item) {
  return {
    id: item.id || slug(item.title || "event"),
    title: item.title || "Новое событие",
    type: item.type || "note",
    date: normalizeAshanaDate(item.date),
    public: item.public ?? true,
    summary: item.summary || "",
    gmNotes: item.gmNotes || "",
    wikiLinks: Array.isArray(item.wikiLinks) ? item.wikiLinks : csv(item.wikiLinks ?? ""),
    questLinks: Array.isArray(item.questLinks) ? item.questLinks : csv(item.questLinks ?? ""),
    npcLinks: Array.isArray(item.npcLinks) ? item.npcLinks : csv(item.npcLinks ?? ""),
    settlementLinks: Array.isArray(item.settlementLinks) ? item.settlementLinks : csv(item.settlementLinks ?? ""),
    mapLinks: Array.isArray(item.mapLinks) ? item.mapLinks : csv(item.mapLinks ?? ""),
  };
}

function normalizeSessionLog(item) {
  return {
    id: item.id || slug(item.title || "session"),
    title: item.title || "Новая сессия",
    sessionNumber: Number(item.sessionNumber || 1),
    date: normalizeAshanaDate(item.date),
    public: item.public ?? true,
    players: item.players || "",
    summary: item.summary || "",
    decisions: item.decisions || "",
    loot: item.loot || "",
    consequences: item.consequences || "",
    gmNotes: item.gmNotes || "",
    wikiLinks: Array.isArray(item.wikiLinks) ? item.wikiLinks : csv(item.wikiLinks ?? ""),
    questLinks: Array.isArray(item.questLinks) ? item.questLinks : csv(item.questLinks ?? ""),
    npcLinks: Array.isArray(item.npcLinks) ? item.npcLinks : csv(item.npcLinks ?? ""),
    settlementLinks: Array.isArray(item.settlementLinks) ? item.settlementLinks : csv(item.settlementLinks ?? ""),
    mapLinks: Array.isArray(item.mapLinks) ? item.mapLinks : csv(item.mapLinks ?? ""),
  };
}

function normalizeCharacter(character) {
  const base = characterDefaults();
  const normalized = {
    ...base,
    ...character,
    stats: { ...base.stats, ...(character.stats ?? {}) },
    saves: { ...base.saves, ...(character.saves ?? {}) },
  };
  normalized.skills = normalizeRows(character.skills, (row) =>
    Array.isArray(row)
      ? { name: row[0] ?? "Навык", ability: "int", ranks: 0, classSkill: false, misc: Number(row[1] ?? 0), armorPenalty: 0, total: Number(row[1] ?? 0) }
      : { name: "Навык", ability: "int", ranks: 0, classSkill: false, misc: 0, armorPenalty: 0, total: 0, ...row }
  );
  normalized.skills = mergeSkillTemplate(normalized.skills);
  normalized.attacks = normalizeRows(character.attacks, (row) =>
    Array.isArray(row)
      ? { name: row[0] ?? "Оружие", bonus: row[1] ?? "+0", damage: row[2] ?? "1d6", crit: "x2", range: "", type: "", notes: "" }
      : { name: "Оружие", bonus: "+0", damage: "1d6", crit: "x2", range: "", type: "", notes: "", ...row }
  );
  normalized.armor = normalizeRows(character.armor, (row) => ({ name: "Броня", ac: "+0", maxDex: "", penalty: "", spellFail: "", notes: "", ...row }));
  normalized.spells = normalizeRows(character.spells, (row) => ({ level: 0, known: "", prepared: "", ...row }));
  normalized.inventory = normalizeRows(character.inventory, (row) =>
    Array.isArray(row)
      ? { name: row[0] ?? "Предмет", qty: row[1] ?? "1", weight: row[2] ?? "" }
      : { name: "Предмет", qty: "1", weight: "", ...row }
  );
  normalized.feats = Array.isArray(character.feats) ? character.feats : [];
  normalized.features = Array.isArray(character.features) ? character.features : [];
  return normalized;
}

function mergeSkillTemplate(existingSkills) {
  const buckets = new Map();
  existingSkills.forEach((skill) => {
    const key = normalizeSkillName(skill.name);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(skill);
  });

  const usage = new Map();
  return pathfinderSkills.map(([name, ability]) => {
    const key = normalizeSkillName(name);
    const index = usage.get(key) ?? 0;
    usage.set(key, index + 1);
    const existing = buckets.get(key)?.[index] ?? buckets.get(key)?.[0];
    return {
      name,
      ability,
      specialty: "",
      ranks: 0,
      classSkill: false,
      misc: 0,
      armorPenalty: 0,
      total: 0,
      ...existing,
      name,
      ability: existing?.ability || ability,
    };
  });
}

function skillDisplayName(skill) {
  return skill.specialty ? `${skill.name}: ${skill.specialty}` : skill.name;
}

function normalizeSkillName(name) {
  const value = String(name || "")
    .toUpperCase()
    .replaceAll("*", "")
    .trim();
  if (value === "ЗНАНИЕ МАГИИ") return "ЗНАНИЕ (МАГИЯ)";
  if (value.startsWith("РЕМЕСЛО")) return "РЕМЕСЛО";
  if (value.startsWith("ПРОФЕССИЯ")) return "ПРОФЕССИЯ";
  if (value.startsWith("ИСПОЛНЕНИЕ")) return "ИСПОЛНЕНИЕ";
  return value;
}

function defaultImageStyle() {
  return { aspect: "wide", fit: "cover", x: 50, y: 50, zoom: 1 };
}

function normalizeRows(rows, mapper) {
  return Array.isArray(rows) ? rows.map(mapper) : [];
}

function characterDefaults() {
  return {
    id: crypto.randomUUID(),
    name: "Новый герой",
    player: "Игрок",
    ancestry: "раса",
    className: "класс 1",
    homeland: "",
    deity: "",
    size: "Средний",
    gender: "",
    alignment: "Н",
    level: 1,
    hp: "10 / 10",
    ac: 10,
    touchAc: 10,
    flatFootedAc: 10,
    initiative: 0,
    speed: 30,
    bab: 0,
    cmb: 0,
    cmd: 10,
    portrait: "",
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saves: { fort: 0, ref: 0, will: 0 },
    skills: [],
    attacks: [],
    armor: [],
    feats: [],
    features: [],
    spells: [],
    inventory: [],
    languages: "",
    notes: "",
    gmNotes: "",
  };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    queueCloudSave();
    return true;
  } catch (error) {
    const compact = compactStateForStorage(state);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
      queueCloudSave();
      if (!storageWarningShown) {
        storageWarningShown = true;
        alert("Данные сохранены, но браузерное хранилище переполнено картинками. Текст, статьи, персонажи и карта сохранены; слишком тяжелые загруженные картинки могут не пережить перезагрузку. Лучше хранить крупные изображения файлами в assets и выбирать их оттуда.");
      }
      return true;
    } catch {
      alert("Не удалось сохранить данные в браузере: localStorage переполнен или недоступен. Экспортируй кампанию в JSON из админ-панели, чтобы не потерять изменения.");
      return false;
    }
  }
}

function queueCloudSave() {
  if (!supabaseClient || !supabaseUser || !isAdmin) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => {
    saveCloudState();
  }, 450);
}

async function saveCloudState() {
  if (!supabaseClient || !supabaseUser || !isAdmin) return false;
  const payload = compactStateForStorage(state);
  const { error } = await supabaseClient
    .from("campaign_state")
    .upsert({ id: "main", data: payload, updated_at: new Date().toISOString(), updated_by: supabaseUser.id });
  if (error) {
    cloudStatus = `Ошибка сохранения: ${error.message}`;
    renderCloudStatus();
    return false;
  }
  cloudStatus = `Облако сохранено: ${new Date().toLocaleTimeString("ru-RU")}`;
  renderCloudStatus();
  return true;
}

async function loadCloudState() {
  if (!supabaseClient) return false;
  const { data, error } = await supabaseClient.from("campaign_state").select("data").eq("id", "main").single();
  if (error) {
    cloudStatus = `Ошибка загрузки облака: ${error.message}`;
    renderCloudStatus();
    return false;
  }
  if (data?.data && Object.keys(data.data).length) {
    state = normalizeState({ ...structuredClone(seedData), ...data.data });
  } else if (isAdmin) {
    await saveCloudState();
  }
  if (!state.characters.some((character) => character.id === activeCharacterId)) {
    activeCharacterId = state.characters[0]?.id ?? null;
  }
  if (!activeCalendarDateKey) activeCalendarDateKey = ashanaDateKey(state.meta.ashanaDate);
  if (!state.sessionLogs.some((session) => session.id === activeSessionId)) {
    activeSessionId = state.sessionLogs[0]?.id ?? null;
  }
  if (!state.settlements.some((settlement) => settlement.id === activeSettlementId)) {
    activeSettlementId = state.settlements[0]?.id ?? null;
  }
  if (activeWikiId !== WIKI_INDEX_ID && !state.wiki.some((article) => article.id === activeWikiId)) {
    activeWikiId = WIKI_INDEX_ID;
    activeWikiCategoryId = "";
  }
  if (savedUiState.mapActiveRegionId && state.map.regions.some((region) => region.id === savedUiState.mapActiveRegionId)) {
    state.map.activeRegionId = savedUiState.mapActiveRegionId;
  }
  if (savedUiState.mapSelectedHex) state.map.selectedHex = savedUiState.mapSelectedHex;
  mapZoom = Number(savedUiState.mapZoom || state.map.zoom || 1);
  await loadCloudRolls();
  renderCharacterSelect();
  render();
  cloudStatus = "Общая база подключена";
  renderCloudStatus();
  return true;
}

async function loadCloudRolls() {
  if (!supabaseClient) return false;
  const { data, error } = await supabaseClient
    .from("roll_logs")
    .select("id, actor, label, formula, rolls, total, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.warn("Общий журнал бросков пока недоступен:", error.message);
    return false;
  }
  state.rolls = (data ?? []).map(normalizeCloudRoll);
  persistLocalStateOnly();
  return true;
}

function subscribeCloudRolls() {
  if (!supabaseClient || rollSubscription) return;
  rollSubscription = supabaseClient
    .channel("ashana-roll-logs")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "roll_logs" }, (payload) => {
      const entry = normalizeCloudRoll(payload.new);
      mergeRollEntry(entry);
      if (["roller", "dashboard"].includes(currentView)) render();
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "roll_logs" }, () => {
      loadCloudRolls().then(() => {
        if (["roller", "dashboard"].includes(currentView)) render();
      });
    })
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") console.warn("Realtime журнала бросков недоступен");
    });
}

function normalizeCloudRoll(row) {
  const timestamp = row?.created_at || row?.timestamp || new Date().toISOString();
  return {
    id: row?.id || crypto.randomUUID(),
    actor: row?.actor || "Партия",
    label: row?.label || "",
    formula: row?.formula || "1d20",
    rolls: Array.isArray(row?.rolls) ? row.rolls.map(Number) : [],
    total: Number(row?.total ?? 0),
    timestamp,
    createdAt: new Date(timestamp).toLocaleString("ru-RU"),
  };
}

function mergeRollEntry(entry) {
  if (!entry?.id || state.rolls.some((item) => item.id === entry.id)) return false;
  state.rolls.unshift(entry);
  state.rolls = state.rolls
    .slice(0, 240)
    .sort((a, b) => rollTimeValue(b) - rollTimeValue(a))
    .slice(0, 200);
  persistLocalStateOnly();
  return true;
}

function rollTimeValue(entry) {
  const value = Date.parse(entry?.timestamp || entry?.createdAt || "");
  return Number.isFinite(value) ? value : 0;
}

async function saveRollToCloud(entry) {
  if (!supabaseClient || !entry) return false;
  const { error } = await supabaseClient.from("roll_logs").insert({
    id: entry.id,
    actor: entry.actor,
    label: entry.label,
    formula: entry.formula,
    rolls: entry.rolls,
    total: entry.total,
    created_at: entry.timestamp || new Date().toISOString(),
  });
  if (error) {
    console.warn("Бросок не отправлен в общий журнал:", error.message);
    return false;
  }
  return true;
}

async function clearCloudRolls() {
  if (!supabaseClient || !supabaseUser || !isAdmin) return false;
  const { error } = await supabaseClient.from("roll_logs").delete().neq("id", "");
  if (error) {
    alert(`Не удалось очистить общий журнал бросков: ${error.message}`);
    return false;
  }
  return true;
}

function persistLocalStateOnly() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compactStateForStorage(state)));
  } catch (error) {
    console.warn("Локальное сохранение журнала бросков недоступно:", error.message);
  }
}

function compactStateForStorage(source) {
  const compact = structuredClone(source);
  compact.wiki?.forEach((article) => {
    if (isEmbeddedImage(article.image)) article.image = "";
  });
  compact.gallery?.forEach((item) => {
    if (isEmbeddedImage(item.image)) item.image = "";
  });
  compact.npcs?.forEach((item) => {
    if (isEmbeddedImage(item.portrait)) item.portrait = "";
  });
  compact.factions?.forEach((item) => {
    if (isEmbeddedImage(item.image)) item.image = "";
  });
  Object.values(compact.tagMeta ?? {}).forEach((item) => {
    if (isEmbeddedImage(item.image)) item.image = "";
  });
  compact.characters?.forEach((character) => {
    if (isEmbeddedImage(character.portrait)) character.portrait = "";
  });
  compact.map?.regions?.forEach((region) => {
    if (isEmbeddedImage(region.image)) region.image = "";
    Object.values(region.hexes ?? {}).forEach((hex) => {
      if (isEmbeddedImage(hex.tileImage)) hex.tileImage = "";
    });
  });
  compact.rolls = compact.rolls?.slice(0, 80) ?? [];
  return compact;
}

function isEmbeddedImage(value) {
  return typeof value === "string" && value.startsWith("data:image/");
}

function initSupabase() {
  const supabaseFactory = globalThis.supabase;
  if (!supabaseFactory?.createClient) {
    cloudStatus = "Supabase SDK не загружен";
    renderCloudStatus();
    return;
  }
  supabaseClient = supabaseFactory.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  subscribeCloudRolls();
  supabaseClient.auth.getSession().then(async ({ data }) => {
    await applySupabaseSession(data.session);
  });
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    applySupabaseSession(session);
  });
}

async function applySupabaseSession(session) {
  supabaseUser = session?.user ?? null;
  supabaseProfile = null;
  if (!supabaseUser) {
    cloudStatus = "Гость: общая база только для чтения";
    setAdminMode(false, { renderView: false });
    renderCloudStatus();
    await loadCloudState();
    return;
  }
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("role, display_name")
    .eq("user_id", supabaseUser.id)
    .maybeSingle();
  if (error) {
    cloudStatus = `Профиль не загружен: ${error.message}`;
    setAdminMode(false, { renderView: false });
  } else {
    supabaseProfile = data ?? { role: "player", display_name: supabaseUser.email };
    setAdminMode(supabaseProfile.role === "admin", { renderView: false });
    cloudStatus = `Вход: ${supabaseProfile.display_name || supabaseUser.email}`;
  }
  renderCloudStatus();
  await loadCloudState();
}

function renderCloudStatus() {
  if (!adminBadge || !quickLoginButton) return;
  const role = isAdmin ? "мастер" : "гость";
  adminBadge.textContent = `${role} · ${cloudStatus}`;
  quickLoginButton.textContent = supabaseUser ? "Выйти" : "Войти";
}

async function signInSupabase(email, password) {
  if (!supabaseClient) initSupabase();
  if (!supabaseClient) throw new Error("Supabase SDK не загружен");
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

async function signOutSupabase() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  supabaseUser = null;
  supabaseProfile = null;
  setAdminMode(false);
}

async function imageFileToUrl(file, folder) {
  if (supabaseClient && supabaseUser && isAdmin) {
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error } = await supabaseClient.storage.from(SUPABASE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (!error) {
      return supabaseClient.storage.from(SUPABASE_BUCKET).getPublicUrl(path).data.publicUrl;
    }
    alert(`Картинка не загружена в Supabase Storage: ${error.message}. Сохраню локально как запасной вариант.`);
  }
  return readFileAsDataUrl(file);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function visibleWiki() {
  return state.wiki.filter((item) => item.public || isAdmin);
}

function visibleQuests() {
  return state.quests.filter((quest) => quest.status !== "hidden" || isAdmin);
}

function visibleNpcs() {
  return state.npcs.filter((npc) => npc.public || isAdmin);
}

function visibleFactions() {
  return state.factions.filter((faction) => faction.public || isAdmin);
}

function visibleSettlements() {
  return state.settlements.filter((settlement) => settlement.public || isAdmin);
}

function visibleCalendarEvents() {
  return state.calendarEvents.filter((event) => event.public || isAdmin);
}

function visibleSessionLogs() {
  return state.sessionLogs.filter((session) => session.public || isAdmin);
}

function setView(view, options = {}) {
  if (!options.skipWikiGuard && view !== currentView && !confirmWikiEditorLeave()) return false;
  currentView = view;
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  render();
  return true;
}

function hasUnsavedWikiDraft() {
  return Boolean(wikiDraft?.dirty);
}

function clearWikiDraft(articleId = null) {
  if (articleId && wikiDraft?.articleId !== articleId) return;
  wikiDraft = null;
}

function confirmWikiEditorLeave() {
  if (!hasUnsavedWikiDraft()) return true;
  const leave = confirm("Есть несохраненные изменения в Wiki-статье. Если перейти дальше, они пропадут. Перейти без сохранения?");
  if (leave) clearWikiDraft();
  return leave;
}

function guardedWikiNavigation(action) {
  if (!confirmWikiEditorLeave()) return false;
  action();
  render();
  return true;
}

function selectWikiArticle(articleId, options = {}) {
  activeWikiId = articleId;
  activeWikiCategoryId = "";
  if (options.clearTag) activeWikiTag = "";
  if (options.clearCategorySearch !== false) wikiCategorySearchTerm = "";
  pendingWikiArticleScroll = true;
}

function scrollWikiArticleToTop() {
  if (!pendingWikiArticleScroll || currentView !== "wiki") return;
  pendingWikiArticleScroll = false;
  requestAnimationFrame(() => {
    const detail = document.querySelector(".wiki-layout > article.panel");
    const target = detail?.querySelector(".wiki-article-view") || detail;
    target?.scrollIntoView({ block: "start", behavior: "smooth" });
  });
}

function wikiFormSnapshotFromArticle(article) {
  const categoryId = article.categoryId || categoryAliases[article.category] || wikiCategories[0]?.id || "places";
  const style = { ...defaultImageStyle(), ...(article.imageStyle ?? {}) };
  return {
    title: article.title || "",
    categoryId,
    tags: Array.isArray(article.tags) ? article.tags.join(", ") : String(article.tags ?? ""),
    public: Boolean(article.public),
    body: article.body || "",
    gmBody: article.gmBody || "",
    image: article.image || "",
    imageStyle: {
      aspect: style.aspect,
      fit: style.fit,
      x: Number(style.x),
      y: Number(style.y),
      zoom: Number(style.zoom),
    },
  };
}

function wikiFormSnapshotSignature(snapshot) {
  return JSON.stringify({
    title: snapshot.title || "",
    categoryId: snapshot.categoryId || "",
    tags: snapshot.tags || "",
    public: Boolean(snapshot.public),
    body: snapshot.body || "",
    gmBody: snapshot.gmBody || "",
    image: snapshot.image || "",
    imageStyle: {
      aspect: snapshot.imageStyle?.aspect || "wide",
      fit: snapshot.imageStyle?.fit || "cover",
      x: Number(snapshot.imageStyle?.x ?? 50),
      y: Number(snapshot.imageStyle?.y ?? 50),
      zoom: Number(snapshot.imageStyle?.zoom ?? 1),
    },
  });
}

function rememberWikiDraft(articleId, baseSnapshot, snapshot) {
  const baseSignature = wikiFormSnapshotSignature(baseSnapshot);
  const currentSignature = wikiFormSnapshotSignature(snapshot);
  if (baseSignature === currentSignature) {
    clearWikiDraft(articleId);
    return;
  }
  wikiDraft = { articleId, dirty: true, values: snapshot, baseSignature };
}

function wikiDraftValuesFor(articleId) {
  return wikiDraft?.articleId === articleId ? wikiDraft.values : null;
}

function setAdminMode(value, options = {}) {
  isAdmin = value;
  adminBadge.classList.toggle("admin", value);
  if (!visibleWiki().some((item) => item.id === activeWikiId)) {
    activeWikiId = WIKI_INDEX_ID;
  }
  renderCharacterSelect();
  renderCloudStatus();
  if (options.renderView !== false) render();
}

function render() {
  const viewMap = {
    dashboard: renderDashboard,
    wiki: renderWiki,
    map: renderMap,
    directory: renderDirectory,
    settlements: renderSettlements,
    calendar: renderCalendar,
    sessions: renderSessions,
    characters: renderCharacters,
    gallery: renderGallery,
    quests: renderQuests,
    roller: renderRoller,
    minigame: renderMinigame,
    admin: renderAdmin,
  };

  if (!viewMap[currentView]) currentView = "dashboard";
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === currentView));
  if (activeMinigameCleanup) {
    activeMinigameCleanup();
    activeMinigameCleanup = null;
  }
  viewRoot.innerHTML = "";
  viewRoot.append(viewMap[currentView]());
  scrollWikiArticleToTop();
  saveUiState();
}

function header(title, subtitle, action) {
  const wrap = el("div", "view-head");
  const copy = el("div");
  copy.append(el("p", "eyebrow", state.meta.currentDate), el("h2", "", title));
  if (subtitle) copy.append(el("p", "", subtitle));
  wrap.append(copy);
  if (action) wrap.append(action);
  return wrap;
}

function renderDashboard() {
  if (searchTerm.trim()) return renderGlobalSearch();

  const root = el("div");
  root.append(
    header(
      "Асхана",
      "Рабочий портал кампании: события, справочник, персонажи, задания и броски партии."
    )
  );

  const grid = el("div", "dashboard-grid");
  const hero = el("section", "world-panel");
  const heroContent = el("div", "world-panel-content");
  heroContent.append(
    el("p", "eyebrow", state.meta.currentRegion),
    el("h3", "", "Герои идут по следу Серого Тракта"),
    el(
      "p",
      "",
      "Текущая версия уже хранит данные кампании локально и открывает базовый режим мастера для редактирования."
    ),
    actionRow([
      button("Открыть задания", "primary-button", () => setView("quests")),
      button("Кинуть d20", "ghost-button", () => {
        setView("roller");
        setTimeout(() => rollFormula("1d20"), 0);
      }),
    ])
  );
  hero.append(heroContent);

  const side = el("section", "panel");
  side.append(
    el("h3", "", "Сводка"),
    metricGrid([
      ["Wiki", visibleWiki().length],
      ["Задания", visibleQuests().length],
      ["NPC", visibleNpcs().length],
      ["Фракции", visibleFactions().length],
      ["Поселения", visibleSettlements().length],
      ["Сессии", visibleSessionLogs().length],
      ["События", visibleCalendarEvents().length],
      ["Персонажи", state.characters.length],
      ["Броски", state.rolls.length],
    ])
  );

  const recent = el("section", "panel");
  recent.append(el("h3", "", "Последние броски"));
  const logs = state.rolls.slice(0, 4);
  recent.append(logs.length ? rollLogList(logs) : el("div", "empty-state", "Бросков пока нет"));

  const column = el("div", "metric-grid-column");
  column.append(side, recent);
  grid.append(hero, column);

  const cards = el("div", "card-grid");
  visibleWiki()
    .slice(0, 4)
    .forEach((article) => {
      const card = el("article", "card");
      card.append(
        el("p", "eyebrow", article.category),
        el("h3", "", article.title),
        el("p", "", article.body.slice(0, 150) + "...")
      );
      card.addEventListener("click", () => {
        selectWikiArticle(article.id);
        setView("wiki");
      });
      cards.append(card);
    });

  root.append(grid, spacer(), cards);
  return root;
}

function renderGlobalSearch() {
  const query = searchTerm.trim();
  const root = el("div");
  const clear = button("Очистить поиск", "ghost-button", () => {
    clearSearchTerm();
    render();
  });
  root.append(header("Поиск", `Результаты по запросу "${query}" во всех открытых разделах Асханы.`, clear));

  const results = globalSearchResults(query);
  const panel = el("section", "panel global-search-panel");
  panel.append(
    el("p", "eyebrow", "Найдено"),
    el("h3", "", `${results.length} результатов`)
  );
  if (!results.length) {
    panel.append(el("div", "empty-state", "Ничего не найдено. Попробуй другое слово или проверь, не скрыта ли запись от игроков."));
    root.append(panel);
    return root;
  }

  const list = el("div", "global-search-list");
  results.forEach((result) => {
    const card = button("", "global-search-card", () => result.open());
    card.append(
      compactBadges([result.section, result.visibility]),
      el("strong", "", result.title),
      el("span", "", result.subtitle),
      el("p", "", result.excerpt)
    );
    list.append(card);
  });
  panel.append(list);
  root.append(panel);
  return root;
}

function globalSearchResults(query) {
  const needle = normalizeSearchQuery(query);
  if (!needle) return [];
  const results = [];
  const add = (section, title, subtitle, excerpt, haystack, open, visibility = "игрокам") => {
    if (!matchesSearch(haystack, needle)) return;
    results.push({ section, title, subtitle, excerpt: shortText(excerpt || subtitle || title, 230), open, visibility });
  };

  visibleWiki().forEach((article) => {
    add(
      "Wiki",
      article.title,
      article.category,
      article.body,
      [article.title, article.category, article.body, isAdmin ? article.gmBody : "", article.tags.join(" ")],
      () => openWikiArticle(article.id),
      article.public ? "игрокам" : "мастеру"
    );
  });

  visibleQuests().forEach((quest) => {
    add(
      "Задания",
      quest.title,
      `${questStatus(quest.status)} · ${quest.patron || "без заказчика"}`,
      quest.notes,
      [quest.title, quest.status, quest.patron, quest.reward, quest.linked, quest.notes, isAdmin ? quest.gmNotes : ""],
      () => openQuest(quest.id),
      quest.status === "hidden" ? "мастеру" : "игрокам"
    );
  });

  visibleNpcs().forEach((npc) => {
    add(
      "NPC",
      npc.name,
      [npc.role, npc.location].filter(Boolean).join(" · ") || "NPC",
      npc.description,
      [npc.name, npc.role, npc.location, npc.ancestry, npc.description, isAdmin ? npc.gmNotes : "", npc.tags.join(" ")],
      () => openNpc(npc.id),
      npc.public ? "игрокам" : "мастеру"
    );
  });

  visibleFactions().forEach((faction) => {
    add(
      "Фракции",
      faction.name,
      [optionLabel(factionTypes, faction.type), faction.headquarters].filter(Boolean).join(" · ") || "Фракция",
      faction.description,
      [faction.name, faction.leader, faction.headquarters, faction.description, faction.goals, faction.resources, isAdmin ? faction.gmNotes : "", faction.tags.join(" ")],
      () => openFaction(faction.id),
      faction.public ? "игрокам" : "мастеру"
    );
  });

  visibleSettlements().forEach((settlement) => {
    const searchableProblems = settlement.problems.filter((problem) => isAdmin || (problem.public && problem.status !== "hidden"));
    add(
      "Поселения",
      settlement.name,
      [optionLabel(settlementTypes, settlement.type), settlement.ruler].filter(Boolean).join(" · ") || "Поселение",
      settlement.description,
      [settlement.name, settlement.ruler, settlement.size, settlement.description, isAdmin ? settlement.gmNotes : "", settlement.tags.join(" "), settlement.buildings.map((item) => item.name).join(" "), searchableProblems.map((item) => item.title).join(" ")],
      () => {
        clearSearchTerm();
        openSettlement(settlement.id);
      },
      settlement.public ? "игрокам" : "мастеру"
    );
  });

  visibleCalendarEvents().forEach((event) => {
    add(
      "Календарь",
      event.title,
      `${formatAshanaDate(event.date)} · ${optionLabel(calendarEventTypes, event.type)}`,
      event.summary,
      [event.title, optionLabel(calendarEventTypes, event.type), formatAshanaDate(event.date), event.summary, isAdmin ? event.gmNotes : ""],
      () => {
        clearSearchTerm();
        activeCalendarDateKey = ashanaDateKey(event.date);
        setView("calendar");
      },
      event.public ? "игрокам" : "мастеру"
    );
  });

  visibleSessionLogs().forEach((session) => {
    add(
      "Журнал",
      `#${session.sessionNumber} ${session.title}`,
      formatAshanaDate(session.date),
      session.summary,
      [session.title, session.players, session.summary, session.decisions, session.loot, session.consequences, isAdmin ? session.gmNotes : ""],
      () => {
        clearSearchTerm();
        activeSessionId = session.id;
        setView("sessions");
      },
      session.public ? "игрокам" : "мастеру"
    );
  });

  state.characters.forEach((character) => {
    add(
      "Персонажи",
      character.name,
      [character.player, character.className].filter(Boolean).join(" · ") || "Персонаж",
      character.notes,
      [character.name, character.player, character.className, character.ancestry, character.homeland, character.deity, character.languages, character.notes, isAdmin ? character.gmNotes : ""],
      () => {
        clearSearchTerm();
        activeCharacterId = character.id;
        setView("characters");
      }
    );
  });

  state.gallery.forEach((item) => {
    add(
      "Галерея",
      item.title,
      [item.type, item.linked].filter(Boolean).join(" · ") || "Изображение",
      item.linked,
      [item.title, item.type, item.linked, (item.tags ?? []).join(" ")],
      () => {
        clearSearchTerm();
        setView("gallery");
      }
    );
  });

  visibleMapRegions().forEach((region) => {
    add(
      "Карты",
      region.title,
      region.type,
      region.description,
      [region.title, region.type, region.description],
      () => {
        clearSearchTerm();
        if (!setView("map")) return;
        selectMapRegion(region.id);
      },
      region.public ? "игрокам" : "мастеру"
    );
    Object.entries(region.hexes ?? {}).forEach(([key, hex]) => {
      if (!hex.visible && !isAdmin) return;
      add(
        "Гексы",
        hex.title || `Гекс ${key}`,
        `${region.title} · ${key}`,
        hex.notes || hex.objects?.join(", ") || hex.terrain,
        [key, hex.title, hex.terrain, hex.notes, isAdmin ? hex.gmNotes : "", (hex.objects ?? []).join(" ")],
        () => {
          clearSearchTerm();
          state.map.activeRegionId = region.id;
          state.map.selectedHex = key;
          setView("map");
        },
        hex.visible ? "игрокам" : "мастеру"
      );
    });
  });

  return results.sort((a, b) => a.section.localeCompare(b.section, "ru") || a.title.localeCompare(b.title, "ru"));
}

function normalizeSearchQuery(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesSearch(values, needle) {
  return normalizeSearchQuery(Array.isArray(values) ? values.filter(Boolean).join(" ") : values).includes(needle);
}

function shortText(value, limit = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
}

function clearSearchTerm() {
  searchTerm = "";
  if (globalSearch) globalSearch.value = "";
}

function renderWiki() {
  const root = el("div");
  const action = isAdmin ? button("Новая статья", "primary-button", () => createWikiArticle()) : null;
  root.append(header("Wiki", "Мапа знаний Асханы: категории, теги, изображения и скрытые заметки мастера.", action));

  const articles = filterWikiArticles(visibleWiki());
  const active = articles.find((item) => item.id === activeWikiId);

  const layout = el("div", "wiki-layout");
  const list = el("aside", "panel list-panel");
  const indexButton = button("Мапа Wiki", "list-button", () => {
    guardedWikiNavigation(() => {
      activeWikiId = WIKI_INDEX_ID;
      activeWikiTag = "";
      activeWikiCategoryId = "";
    });
  });
  indexButton.classList.toggle("active", activeWikiId === WIKI_INDEX_ID && !activeWikiCategoryId);
  list.append(indexButton);

  list.append(el("p", "eyebrow", "Категории"));
  wikiCategories.forEach((category) => {
    const categoryButton = button(category.title, "list-button", () => {
      guardedWikiNavigation(() => {
        activeWikiCategoryId = category.id;
        activeWikiId = WIKI_INDEX_ID;
        wikiCategorySearchTerm = "";
      });
    });
    categoryButton.classList.toggle("active", activeWikiCategoryId === category.id);
    list.append(categoryButton);
  });

  list.append(el("p", "eyebrow", "Теги"));
  const tagPanel = el("div", "tag-row");
  allWikiTags().forEach((tagName) => {
    const tagButton = button(tagName, `tag tag-button ${activeWikiTag === tagName ? "active" : ""}`, () => {
      guardedWikiNavigation(() => {
        activeWikiTag = activeWikiTag === tagName ? "" : tagName;
        activeWikiId = WIKI_INDEX_ID;
        activeWikiCategoryId = "";
      });
    });
    attachTagTooltip(tagButton, tagName);
    tagPanel.append(tagButton);
  });
  list.append(tagPanel);

  list.append(el("p", "eyebrow", "Статьи"));
  articles.forEach((article) => {
    const item = button(article.title, "list-button", () => {
      guardedWikiNavigation(() => {
        selectWikiArticle(article.id, { clearCategorySearch: false });
      });
    });
    item.classList.toggle("active", article.id === activeWikiId);
    list.append(item);
  });

  const detail = el("article", "panel");
  if (activeWikiCategoryId) {
    detail.append(wikiCategoryPage(activeWikiCategoryId, articles));
  } else if (activeWikiId === WIKI_INDEX_ID) {
    detail.append(wikiIndex(articles));
  } else if (!active) {
    detail.append(el("div", "empty-state", "Нет записей по текущему поиску"));
  } else {
    detail.append(wikiArticleView(active));
    if (isAdmin) {
      detail.append(spacer(), wikiEditor(active));
    }
  }

  layout.append(list, detail);
  root.append(layout);
  return root;
}

function filterWikiArticles(articles) {
  return filterItems(
    activeWikiTag ? articles.filter((item) => item.tags.includes(activeWikiTag)) : articles,
    (item) => [item.title, item.category, item.body, item.gmBody, item.tags.join(" ")].join(" ")
  );
}

function wikiIndex(articles) {
  const root = el("div", "admin-stack");
  root.append(
    el("p", "eyebrow", activeWikiTag ? `тег: ${activeWikiTag}` : "главная"),
    el("h3", "", "Мапа знаний"),
    el("p", "", "Выбери блок, чтобы перейти к статьям. Скрытые записи видны только в режиме мастера.")
  );

  const grid = el("div", "wiki-category-grid");
  wikiCategories.forEach((category) => {
    const categoryArticles = articles.filter((article) => article.categoryId === category.id);
    const card = el("section", "wiki-category-card");
    card.append(
      el("div", "wiki-category-count", categoryArticles.length),
      el("h3", "", category.title),
      el("p", "", category.hint)
    );
    const links = el("div", "wiki-link-list");
    categoryArticles.slice(0, 6).forEach((article) => {
      links.append(button(article.title, "wiki-link", () => {
        guardedWikiNavigation(() => {
          selectWikiArticle(article.id);
        });
      }));
    });
    card.append(links.children.length ? links : el("p", "muted", "Пока нет статей"));
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      guardedWikiNavigation(() => {
        activeWikiCategoryId = category.id;
        activeWikiId = WIKI_INDEX_ID;
        wikiCategorySearchTerm = "";
      });
    });
    grid.append(card);
  });

  root.append(grid);
  return root;
}

function wikiCategoryPage(categoryId, articles) {
  const category = wikiCategories.find((item) => item.id === categoryId);
  const root = el("div", "admin-stack");
  const search = input(wikiCategorySearchTerm);
  search.placeholder = `Поиск в категории "${category?.title ?? ""}"`;
  const searchForm = el("form", "search-form");
  searchForm.append(search, button("Найти", "small-button", null, "submit"));
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    guardedWikiNavigation(() => {
      wikiCategorySearchTerm = search.value;
    });
  });

  const categoryArticles = articles
    .filter((article) => article.categoryId === categoryId)
    .filter((article) => {
      const text = [article.title, article.body, article.gmBody, article.tags.join(" ")].join(" ").toLowerCase();
      return text.includes(wikiCategorySearchTerm.toLowerCase());
    });

  root.append(
    el("p", "eyebrow", "категория"),
    el("h3", "", category?.title ?? "Категория"),
    el("p", "", category?.hint ?? ""),
    searchForm
  );

  const grid = el("div", "category-article-grid");
  categoryArticles.forEach((article) => {
    const card = el("article", "category-article-card");
    card.append(
      el("p", "eyebrow", article.public ? "игрокам" : "мастер"),
      el("h3", "", article.title),
      tags(article.tags),
      el("p", "", article.body.slice(0, 220) + (article.body.length > 220 ? "..." : ""))
    );
    card.addEventListener("click", () => {
      guardedWikiNavigation(() => {
        selectWikiArticle(article.id);
      });
    });
    grid.append(card);
  });
  root.append(categoryArticles.length ? grid : el("div", "empty-state", "В категории пока нет статей"));
  return root;
}

function wikiArticleView(active) {
  const root = el("div", "admin-stack wiki-article-view");
  const articleText = el("div", "wiki-article-text");
  articleText.append(
    el("p", "eyebrow", wikiCategoryTitle(active.categoryId)),
    el("h3", "", active.title),
    tags(active.tags.concat(active.public ? ["игрокам"] : ["мастер"])),
    el("div", "article-body", active.body)
  );
  if (active.image) {
    const articleMain = el("div", "wiki-article-main");
    articleMain.append(wikiImage(active, "wiki-article-image"), articleText);
    root.append(articleMain);
  } else {
    root.append(articleText);
  }
  if (isAdmin && active.gmBody) {
    const gm = el("div", "gm-note");
    gm.append(el("p", "eyebrow", "GM"), el("div", "article-body", active.gmBody));
    root.append(gm);
  }
  if (active.related?.length) root.append(tags(active.related.map((id) => wikiById(id)?.title).filter(Boolean)));
  return root;
}

function wikiImage(article, className) {
  const frame = el("div", className);
  const style = { ...defaultImageStyle(), ...(article.imageStyle ?? {}) };
  frame.classList.add(`image-aspect-${style.aspect}`);
  const img = document.createElement("img");
  img.src = article.image;
  img.alt = article.title;
  img.style.objectFit = style.fit;
  img.style.objectPosition = `${style.x}% ${style.y}%`;
  img.style.transform = `scale(${style.zoom})`;
  frame.append(img);
  return frame;
}

function allWikiTags() {
  return [...new Set(visibleWiki().flatMap((item) => item.tags))].sort((a, b) => a.localeCompare(b));
}

function createWikiArticle() {
  if (!confirmWikiEditorLeave()) return;
  const category = resolveWikiCategoryForNewArticle();
  if (!category) return;
  const article = normalizeWikiArticle({
    id: slug(`новая статья ${category.title}`),
    title: `Новая статья: ${category.title}`,
    category: category.title,
    categoryId: category.id,
    tags: ["новое"],
    image: "",
    public: true,
    body: "Описание для игроков.",
    gmBody: "Скрытые заметки мастера.",
  });
  state.wiki.unshift(article);
  selectWikiArticle(article.id, { clearTag: true });
  activeWikiTag = "";
  wikiCategorySearchTerm = "";
  searchTerm = "";
  if (globalSearch) globalSearch.value = "";
  saveState();
  render();
}

function resolveWikiCategoryForNewArticle() {
  if (activeWikiCategoryId) return wikiCategories.find((item) => item.id === activeWikiCategoryId);
  const activeArticle = state.wiki.find((item) => item.id === activeWikiId);
  if (activeArticle && activeWikiId !== WIKI_INDEX_ID) {
    return wikiCategories.find((item) => item.id === activeArticle.categoryId) ?? wikiCategories[0];
  }
  const list = wikiCategories.map((item, index) => `${index + 1}. ${item.title}`).join("\n");
  const answer = prompt(`В какой категории создать новую статью?\n\n${list}`, "1");
  if (answer === null) return null;
  const trimmed = answer.trim().toLowerCase();
  const byNumber = wikiCategories[Number(trimmed) - 1];
  if (byNumber) return byNumber;
  const byText = wikiCategories.find((item) => item.title.toLowerCase() === trimmed || item.id.toLowerCase() === trimmed);
  if (byText) return byText;
  alert("Категория не найдена. Введи номер из списка или точное название категории.");
  return null;
}

function wikiById(id) {
  return state.wiki.find((article) => article.id === id);
}

function wikiCategoryTitle(id) {
  return wikiCategories.find((category) => category.id === id)?.title ?? "Места";
}

function visibleMapRegions() {
  return state.map.regions.filter((region) => region.public || isAdmin);
}

function ensureActiveMapRegion() {
  const visibleRegions = visibleMapRegions();
  if (!visibleRegions.length) return null;
  if (!visibleRegions.some((region) => region.id === state.map.activeRegionId)) {
    state.map.activeRegionId = visibleRegions[0].id;
    state.map.selectedHex = "0,0";
  }
  return visibleRegions.find((region) => region.id === state.map.activeRegionId) ?? visibleRegions[0];
}

function selectMapRegion(regionId) {
  const region = visibleMapRegions().find((item) => item.id === regionId);
  if (!region) return;
  state.map.activeRegionId = region.id;
  state.map.selectedHex = "0,0";
  mapScroll = { left: 0, top: 0 };
  saveState();
  render();
}

function createMapRegion() {
  if (!isAdmin) return;
  const title = prompt("Название новой карты/слоя атласа", "Новая карта");
  if (title === null) return;
  const region = normalizeMapRegions([
    {
      id: slug(title || "map"),
      title: title.trim() || "Новая карта",
      type: "Регион",
      description: "Новая карта атласа. Заполни описание и гексы в режиме мастера.",
      public: false,
      image: "",
      mode: "canvas",
      grid: { cols: 18, rows: 12, hexSize: 92, offsetX: 24, offsetY: 24 },
      hexes: {},
    },
  ])[0];
  state.map.regions.unshift(region);
  state.map.activeRegionId = region.id;
  state.map.selectedHex = "0,0";
  mapScroll = { left: 0, top: 0 };
  saveState();
  render();
}

function renderMap() {
  const root = el("div");
  const action = isAdmin ? button("Новая карта", "primary-button", () => createMapRegion()) : null;
  root.append(header("Карта", "Атлас кампании: общая карта, поселения, подземелья и скрытые мастерские слои.", action));

  const region = ensureActiveMapRegion();
  if (!region) {
    root.append(el("div", "empty-state", "Публичных карт пока нет."));
    return root;
  }
  const selected = getHex(region, state.map.selectedHex);
  const layout = el("div", "map-layout");
  const atlas = mapAtlasPanel(region);
  const stage = el("section", "hex-map-stage");
  stage.addEventListener("scroll", () => {
    mapScroll = { left: stage.scrollLeft, top: stage.scrollTop };
  });
  const viewport = el("div", "hex-map-viewport");
  const size = mapPixelSize(region);
  viewport.style.width = `${size.width}px`;
  viewport.style.height = `${size.height}px`;
  viewport.style.transform = `scale(${mapZoom})`;
  const image = el("div", "hex-map-image");
  image.style.backgroundImage = region.image ? `url("${region.image}")` : "";
  if (region.image) viewport.append(image);
  viewport.append(hexGrid(region));
  stage.append(mapZoomControls(), viewport);

  const panel = mapInspector(region, selected);

  layout.append(atlas, stage, panel);
  root.append(layout);
  restoreMapScroll(stage);
  return root;
}

function mapAtlasPanel(activeRegion) {
  const panel = el("aside", "panel map-atlas-panel");
  panel.append(
    el("p", "eyebrow", "Атлас"),
    el("h3", "", "Карты кампании"),
    el("p", "muted", isAdmin ? "Мастер видит все карты и может скрывать черновики от игроков." : "Показаны только открытые игрокам карты.")
  );

  const list = el("div", "map-atlas-list");
  visibleMapRegions().forEach((region) => {
    const item = button("", `map-atlas-card ${region.id === activeRegion.id ? "active" : ""}`, () => selectMapRegion(region.id));
    item.append(
      el("span", "map-atlas-type", region.type || "Регион"),
      el("strong", "", region.title),
      el("span", "map-atlas-description", region.description || "Без описания"),
      compactBadges([region.public ? "игрокам" : "скрыто", `${region.grid.cols}x${region.grid.rows}`])
    );
    list.append(item);
  });
  panel.append(list);
  if (isAdmin) {
    panel.append(actionRow([button("Добавить карту", "primary-button", () => createMapRegion())]));
  }
  return panel;
}

function mapInspector(region, selected) {
  const panel = el("aside", "map-inspector");
  const head = el("div", "map-inspector-head");
  head.append(
    el("p", "eyebrow", region.title),
    el("h3", "", selected.title || `Гекс ${state.map.selectedHex}`),
    compactBadges([state.map.selectedHex, selected.terrain, selected.visible ? "игрокам" : "скрыто"])
  );

  const body = el("div", "map-inspector-body");
  if (isAdmin) body.append(mapBrushPanel());
  body.append(
    inspectorSection("Заметки", el("p", "", selected.notes || "Публичных заметок пока нет.")),
    inspectorSection("Объекты", selected.objects?.length ? compactBadges(selected.objects) : el("p", "muted", "Объектов пока нет")),
    inspectorSection("Связи", mapHexLinksPanel(region, selected)),
    inspectorSection("Вид карты", el("p", "muted", `Масштаб ${Math.round(mapZoom * 100)}%`))
  );
  if (isAdmin && selected.gmNotes) body.append(inspectorSection("GM", el("p", "", selected.gmNotes), "danger"));
  if (isAdmin) {
    body.append(inspectorSection("Редактор гекса", hexEditor(region, state.map.selectedHex, selected), "editor"));
    body.append(inspectorSection("Настройки карты", regionEditor(region), "editor"));
  }

  panel.append(head, body);
  return panel;
}

function inspectorSection(title, content, tone = "") {
  const section = el("section", `inspector-section ${tone}`.trim());
  section.append(el("h4", "", title), content);
  return section;
}

function compactBadges(items) {
  const row = el("div", "compact-badges");
  items.filter(Boolean).forEach((item) => row.append(el("span", "compact-badge", item)));
  return row;
}

function tagChip(tagName, className = "tag") {
  const clean = normalizeTagName(tagName);
  const chip = el("span", className, tagName);
  chip.dataset.tagName = clean;
  attachTagTooltip(chip, clean);
  return chip;
}

function attachTagTooltip(target, tagName) {
  target.addEventListener("mouseenter", (event) => scheduleTagTooltip(tagName, event.currentTarget));
  target.addEventListener("mouseleave", hideTagTooltip);
  target.addEventListener("focus", (event) => scheduleTagTooltip(tagName, event.currentTarget));
  target.addEventListener("blur", hideTagTooltip);
}

function scheduleTagTooltip(tagName, anchor) {
  hideTagTooltip();
  tagTooltipTimer = setTimeout(() => showTagTooltip(tagName, anchor), 700);
}

function showTagTooltip(tagName, anchor) {
  const meta = tagMetaByName(tagName);
  if (!meta || (!meta.public && !isAdmin)) return;
  const tooltip = el("div", "tag-tooltip");
  if (meta.image) {
    const style = { ...defaultImageStyle(), ...(meta.imageStyle ?? {}) };
    const frame = el("div", `tag-tooltip-image image-aspect-${style.aspect}`);
    const img = document.createElement("img");
    img.src = meta.image;
    img.alt = tagName;
    img.style.objectFit = style.fit;
    img.style.objectPosition = `${style.x}% ${style.y}%`;
    img.style.transform = `scale(${style.zoom})`;
    frame.append(img);
    tooltip.append(frame);
  }
  tooltip.append(
    el("p", "eyebrow", "Тег"),
    el("h4", "", tagName),
    el("p", "", meta.description || defaultTagDescription(tagName))
  );
  document.body.append(tooltip);
  const rect = anchor.getBoundingClientRect();
  const top = Math.min(window.innerHeight - tooltip.offsetHeight - 12, rect.bottom + 10);
  const left = Math.min(window.innerWidth - tooltip.offsetWidth - 12, Math.max(12, rect.left));
  tooltip.style.top = `${Math.max(12, top)}px`;
  tooltip.style.left = `${left}px`;
  activeTagTooltip = tooltip;
}

function hideTagTooltip() {
  clearTimeout(tagTooltipTimer);
  tagTooltipTimer = null;
  activeTagTooltip?.remove();
  activeTagTooltip = null;
}

function tagMetaByName(tagName) {
  const clean = normalizeTagName(tagName);
  return state.tagMeta?.[clean] ?? normalizeTagMetaEntry(clean, {});
}

function registerTags(tagNames, promptForDetails = false) {
  if (!state.tagMeta) state.tagMeta = {};
  const created = [];
  tagNames.forEach((tagName) => {
    const clean = normalizeTagName(tagName);
    if (!clean || state.tagMeta[clean]) return;
    state.tagMeta[clean] = normalizeTagMetaEntry(clean, {});
    created.push(clean);
  });
  if (promptForDetails && isAdmin) {
    created.forEach((tagName) => {
      if (!confirm(`Новый тег "${tagName}" добавлен в справочник. Заполнить краткое описание сейчас?`)) return;
      const description = prompt(`Описание тега "${tagName}"`, state.tagMeta[tagName].description);
      if (description !== null) state.tagMeta[tagName].description = description.trim() || state.tagMeta[tagName].description;
    });
  }
  state.tagMeta = normalizeTagMeta(state.tagMeta);
  return created;
}

function linkedWikiArticles(hex) {
  const visibleIds = new Set(visibleWiki().map((article) => article.id));
  return (hex.wikiLinks ?? []).map((id) => wikiById(id)).filter((article) => article && visibleIds.has(article.id));
}

function linkedQuests(hex) {
  const visibleIds = new Set(visibleQuests().map((quest) => quest.id));
  return (hex.questLinks ?? []).map((id) => state.quests.find((quest) => quest.id === id)).filter((quest) => quest && visibleIds.has(quest.id));
}

function linkedMapRegions(hex) {
  const visibleIds = new Set(visibleMapRegions().map((region) => region.id));
  return (hex.mapLinks ?? []).map((id) => state.map.regions.find((region) => region.id === id)).filter((region) => region && visibleIds.has(region.id));
}

function mapHexLinksPanel(region, hex) {
  const links = el("div", "map-link-list");
  linkedWikiArticles(hex).forEach((article) => {
    links.append(button(`Wiki: ${article.title}`, "map-link-button", () => openWikiArticle(article.id)));
  });
  linkedQuests(hex).forEach((quest) => {
    links.append(button(`Задание: ${quest.title}`, "map-link-button", () => openQuest(quest.id)));
  });
  linkedMapRegions(hex)
    .filter((linkedRegion) => linkedRegion.id !== region.id)
    .forEach((linkedRegion) => {
      links.append(button(`Карта: ${linkedRegion.title}`, "map-link-button", () => selectMapRegion(linkedRegion.id)));
    });
  return links.children.length ? links : el("p", "muted", "Связей пока нет");
}

function openWikiArticle(articleId) {
  selectWikiArticle(articleId, { clearTag: true });
  activeWikiTag = "";
  wikiCategorySearchTerm = "";
  searchTerm = "";
  if (globalSearch) globalSearch.value = "";
  setView("wiki");
}

function openQuest(questId) {
  const quest = state.quests.find((item) => item.id === questId);
  searchTerm = quest?.title ?? "";
  if (globalSearch) globalSearch.value = searchTerm;
  setView("quests");
}

function restoreMapScroll(stage) {
  const restore = () => {
    stage.scrollLeft = mapScroll.left;
    stage.scrollTop = mapScroll.top;
  };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(restore);
  } else {
    setTimeout(restore, 0);
  }
}

function mapZoomControls() {
  const controls = el("div", "map-zoom-controls");
  controls.append(
    button("−", "icon-button", () => setMapZoom(mapZoom - 0.15)),
    el("span", "zoom-value", `${Math.round(mapZoom * 100)}%`),
    button("+", "icon-button", () => setMapZoom(mapZoom + 0.15)),
    button("1:1", "small-button", () => setMapZoom(1))
  );
  return controls;
}

function setMapZoom(value) {
  mapZoom = Math.max(0.45, Math.min(2.8, value));
  state.map.zoom = mapZoom;
  saveState();
  render();
}

function activeMapRegion() {
  return ensureActiveMapRegion() ?? state.map.regions[0];
}

function getHex(region, key) {
  if (!region.hexes[key]) {
    region.hexes[key] = {
      title: "",
      terrain: "пусто",
      visible: true,
      notes: "",
      gmNotes: "",
      objects: [],
      wikiLinks: [],
      questLinks: [],
      mapLinks: [],
      tileImage: "",
      tileFit: "cover",
    };
  }
  return region.hexes[key];
}

function hexGrid(region) {
  const grid = el("div", "hex-grid");
  const { cols, rows, hexSize, offsetX, offsetY } = region.grid;
  const hexHeight = hexSize * 0.866;
  const { width: gridWidth, height: gridHeight } = mapPixelSize(region);
  grid.style.width = `${gridWidth}px`;
  grid.style.height = `${gridHeight}px`;
  for (let q = 0; q < cols; q += 1) {
    for (let r = 0; r < rows; r += 1) {
      const key = hexKey(q, r);
      const data = region.hexes[key];
      const objectCount = data?.objects?.length ?? 0;
      const linkCount = (data?.wikiLinks?.length ?? 0) + (data?.questLinks?.length ?? 0) + (data?.mapLinks?.length ?? 0);
      const hasContent = Boolean(
        data &&
          (objectCount ||
            linkCount ||
            data.title ||
            data.notes ||
            data.gmNotes ||
            data.tileImage ||
            (data.terrain && data.terrain !== "пусто"))
      );
      const hex = button("", `hex-cell ${hasContent ? "has-data" : ""} ${state.map.selectedHex === key ? "selected" : ""}`, () => {
        if (isAdmin && mapBrushEnabled) {
          const current = getHex(region, key);
          current.terrain = mapBrushTerrain;
        }
        state.map.selectedHex = key;
        saveState();
        render();
      });
      hex.title = data?.title || `Гекс ${key}`;
      hex.style.width = `${hexSize}px`;
      hex.style.height = `${hexHeight}px`;
      hex.style.left = `${offsetX + q * hexSize * 0.75}px`;
      hex.style.top = `${offsetY + r * hexHeight + (q % 2) * (hexHeight / 2)}px`;
      if (data?.terrain) hex.dataset.terrain = data.terrain;
      const terrainImage = terrainTileFiles[data?.terrain];
      const tileSource = data?.tileImage || terrainImage;
      if (terrainImage && !data?.tileImage) hex.classList.add("has-terrain-art");
      if (tileSource) {
        const img = document.createElement("img");
        img.src = tileSource;
        img.alt = data.title || key;
        img.style.objectFit = data?.tileFit || "cover";
        if (terrainImage && !data?.tileImage) img.className = "terrain-tile-art";
        hex.append(img);
      }
      if (objectCount || linkCount) hex.append(el("span", "hex-label", String(objectCount + linkCount)));
      grid.append(hex);
    }
  }
  return grid;
}

function mapPixelSize(region) {
  const { cols, rows, hexSize, offsetX, offsetY } = region.grid;
  const hexHeight = hexSize * 0.866;
  return {
    width: offsetX + cols * hexSize * 0.75 + hexSize + 80,
    height: offsetY + rows * hexHeight + hexHeight + 80,
  };
}

function mapBrushPanel() {
  const panel = el("div", "brush-panel");
  const terrain = selectInput(hexTerrains, mapBrushTerrain);
  terrain.addEventListener("change", () => {
    mapBrushTerrain = terrain.value;
  });
  const toggle = button(mapBrushEnabled ? "Кисть включена" : "Кисть выключена", `small-button ${mapBrushEnabled ? "active" : ""}`, () => {
    mapBrushEnabled = !mapBrushEnabled;
    render();
  });
  panel.append(labelWrap("Кисть местности", terrain), toggle);
  return panel;
}

function hexKey(q, r) {
  return `${q},${r}`;
}

function hexEditor(region, key, data) {
  const form = el("form", "inspector-form");
  const title = input(data.title);
  const terrain = selectInput(hexTerrains, data.terrain);
  const visible = document.createElement("input");
  visible.type = "checkbox";
  visible.checked = data.visible;
  const notes = textarea(data.notes);
  const gmNotes = textarea(data.gmNotes);
  const objects = textarea((data.objects ?? []).join("\n"));
  const wikiLinks = checkboxList(
    visibleWiki().map((article) => [article.id, article.title]),
    data.wikiLinks ?? []
  );
  const questLinks = checkboxList(
    visibleQuests().map((quest) => [quest.id, quest.title]),
    data.questLinks ?? []
  );
  const mapLinks = checkboxList(
    state.map.regions.filter((item) => item.id !== region.id).map((item) => [item.id, item.title]),
    data.mapLinks ?? []
  );
  let tileImage = data.tileImage || "";
  const tileFit = selectInput([
    ["cover", "Обрезать по гексу"],
    ["contain", "Вписать целиком"],
  ], data.tileFit || "cover");
  const tileInput = document.createElement("input");
  tileInput.type = "file";
  tileInput.accept = "image/png,image/jpeg,image/webp,image/gif";
  const tilePreview = el("div", "hex-tile-preview");
  const tilePreviewImg = document.createElement("img");
  tilePreview.append(tilePreviewImg);
  function updateTilePreview() {
    tilePreviewImg.src = tileImage || "";
    tilePreviewImg.style.objectFit = tileFit.value;
  }
  tileFit.addEventListener("change", updateTilePreview);
  tileInput.addEventListener("change", async () => {
    const file = tileInput.files?.[0];
    if (!file) return;
    tileImage = await imageFileToUrl(file, "map-hexes");
    updateTilePreview();
  });
  updateTilePreview();
  form.append(
    labelWrap("Название", title),
    labelWrap("Местность", terrain),
    checkboxWrap("Видно игрокам", visible),
    labelWrap("Картинка гекса", fragment([tileInput, tilePreview])),
    labelWrap("Подгонка картинки", tileFit),
    labelWrap("Объекты, по одному на строку", objects),
    labelWrap("Связанные Wiki-статьи", wikiLinks),
    labelWrap("Связанные задания", questLinks),
    labelWrap("Переходы на карты", mapLinks),
    labelWrap("Заметки игрокам", notes),
    labelWrap("GM-заметки", gmNotes),
    actionRow([
      button("Сохранить гекс", "primary-button", null, "submit"),
      button("Убрать картинку", "ghost-button", () => {
        tileImage = "";
        updateTilePreview();
      }),
      button("Очистить гекс", "ghost-button", () => {
        if (!confirm(`Очистить гекс ${key}?`)) return;
        delete region.hexes[key];
        saveState();
        render();
      }),
    ])
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    region.hexes[key] = {
      title: title.value,
      terrain: terrain.value,
      visible: visible.checked,
      notes: notes.value,
      gmNotes: gmNotes.value,
      objects: objects.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      wikiLinks: checkedValues(wikiLinks),
      questLinks: checkedValues(questLinks),
      mapLinks: checkedValues(mapLinks),
      tileImage,
      tileFit: tileFit.value,
    };
    saveState();
    render();
  });
  return form;
}

function deleteMapRegion(region) {
  if (!isAdmin) return;
  if (state.map.regions.length <= 1) {
    alert("Нельзя удалить последнюю карту атласа.");
    return;
  }
  if (!confirm(`Удалить карту "${region.title}"? Это удалит все гексы и заметки этой карты.`)) return;
  state.map.regions = state.map.regions.filter((item) => item.id !== region.id);
  const nextRegion = visibleMapRegions()[0] ?? state.map.regions[0];
  state.map.activeRegionId = nextRegion?.id ?? "";
  state.map.selectedHex = "0,0";
  mapScroll = { left: 0, top: 0 };
  saveState();
  render();
}

function regionEditor(region) {
  const form = el("form", "inspector-form compact");
  const title = input(region.title);
  const type = selectInput(mapTypes, region.type || "Регион");
  const description = textarea(region.description || "");
  const isPublic = document.createElement("input");
  isPublic.type = "checkbox";
  isPublic.checked = region.public;
  const cols = input(region.grid.cols);
  const rows = input(region.grid.rows);
  const hexSize = input(region.grid.hexSize);
  const offsetX = input(region.grid.offsetX);
  const offsetY = input(region.grid.offsetY);
  const imageInput = document.createElement("input");
  imageInput.type = "file";
  imageInput.accept = "image/png,image/jpeg,image/webp,image/gif";
  imageInput.addEventListener("change", async () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    region.image = await imageFileToUrl(file, "maps");
    saveState();
    render();
  });
  form.append(
    labelWrap("Название карты", title),
    labelWrap("Тип карты", type),
    checkboxWrap("Видно игрокам", isPublic),
    labelWrap("Описание в атласе", description, "span-2"),
    labelWrap("Колонки", cols),
    labelWrap("Ряды", rows),
    labelWrap("Размер гекса", hexSize),
    labelWrap("Сдвиг X", offsetX),
    labelWrap("Сдвиг Y", offsetY),
    labelWrap("Фоновая подложка", imageInput, "span-2"),
    actionRow([
      button("Сохранить карту", "primary-button", null, "submit"),
      button("Очистить фон", "ghost-button", () => {
        region.image = "";
        saveState();
        render();
      }),
      button("Удалить карту", "ghost-button", () => deleteMapRegion(region)),
    ])
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    region.title = title.value;
    region.type = type.value;
    region.description = description.value;
    region.public = isPublic.checked;
    region.grid = {
      cols: Number(cols.value),
      rows: Number(rows.value),
      hexSize: Number(hexSize.value),
      offsetX: Number(offsetX.value),
      offsetY: Number(offsetY.value),
    };
    saveState();
    render();
  });
  return form;
}

function mapSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 680");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  svg.innerHTML = `
    <defs>
      <linearGradient id="land" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#d2ad63"/>
        <stop offset=".45" stop-color="#789b88"/>
        <stop offset="1" stop-color="#2d5860"/>
      </linearGradient>
      <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="4"/><feDisplacementMap in="SourceGraphic" scale="22"/></filter>
    </defs>
    <rect width="1000" height="680" fill="#101719"/>
    <path d="M120 165 C210 62 332 92 419 143 C510 196 579 95 704 139 C855 193 890 310 825 428 C753 560 607 533 490 602 C336 692 178 552 142 448 C103 337 51 244 120 165Z" fill="url(#land)" filter="url(#rough)"/>
    <path d="M170 408 C280 335 360 366 454 323 C559 276 650 297 790 224" stroke="#f3ead1" stroke-width="9" opacity=".52" fill="none"/>
    <path d="M300 548 C346 498 392 478 446 481 C514 485 576 447 642 390" stroke="#284b55" stroke-width="13" opacity=".72" fill="none"/>
    <path d="M468 126 L492 220 L585 234 L508 286 L530 382 L450 329 L368 377 L393 283 L322 218 L418 211Z" fill="#f2dd9e" opacity=".22"/>
    <circle cx="696" cy="405" r="104" fill="#101719" opacity=".26"/>
    <path d="M693 301 C722 355 714 430 665 494" stroke="#f0e7ca" stroke-width="6" opacity=".24" fill="none"/>
    <text x="305" y="300" fill="#f8efd8" opacity=".8" font-size="34" font-family="serif">Корона Арвейна</text>
    <text x="587" y="216" fill="#f8efd8" opacity=".72" font-size="25" font-family="serif">Серый Тракт</text>
    <text x="382" y="118" fill="#f8efd8" opacity=".7" font-size="24" font-family="serif">Храм Солариса</text>
  `;
  return svg;
}

function renderCharacters() {
  const root = el("div");
  const action = isAdmin ? button("Новый персонаж", "primary-button", () => addCharacter()) : null;
  root.append(header("Персонажи", "Цифровые листы Pathfinder 1e для партии.", action));

  const characters = filterItems(state.characters, (item) =>
    [item.name, item.player, item.className, item.notes].join(" ")
  );
  if (!characters.some((item) => item.id === activeCharacterId)) {
    activeCharacterId = characters[0]?.id ?? null;
  }
  const active = characters.find((item) => item.id === activeCharacterId);

  const layout = el("div", "character-layout");
  const list = el("aside", "panel list-panel");
  characters.forEach((character) => {
    const item = button(`${character.name} · ${character.className}`, "list-button", () => {
      activeCharacterId = character.id;
      renderCharacterSelect();
      render();
    });
    item.classList.toggle("active", character.id === activeCharacterId);
    list.append(item);
  });

  const sheet = el("section", "sheet-panel");
  if (!active) {
    sheet.append(el("div", "empty-state", "Персонажи не найдены"));
  } else {
    sheet.append(characterSheet(active));
  }

  layout.append(list, sheet);
  root.append(layout);
  return root;
}

function addCharacter() {
  const character = normalizeCharacter(characterDefaults());
  state.characters.push(character);
  activeCharacterId = character.id;
  saveState();
  renderCharacterSelect();
  render();
}

function characterSheet(character) {
  const root = el("div", "admin-stack");
  const head = el("div", "character-head");
  const portrait = el("div", "character-portrait");
  if (character.portrait) portrait.style.backgroundImage = `url("${character.portrait}")`;
  portrait.textContent = character.portrait ? "" : initials(character.name);
  const copy = el("div");
  copy.append(
    el("p", "eyebrow", character.player),
    el("h3", "", character.name),
    el(
      "p",
      "muted",
      `${character.ancestry} · ${character.className} · ${character.alignment} · уровень ${character.level}`
    ),
    tags([`HP ${character.hp}`, `AC ${character.ac}`, `Init ${signed(character.initiative)}`, `Speed ${character.speed}`])
  );
  head.append(portrait, copy);
  root.append(head, characterTabBar());

  const content = el("div", "character-tab-content");
  if (activeCharacterTab === "summary") content.append(characterSummary(character));
  if (activeCharacterTab === "stats") content.append(characterStats(character));
  if (activeCharacterTab === "combat") content.append(characterCombat(character));
  if (activeCharacterTab === "skills") content.append(characterSkills(character));
  if (activeCharacterTab === "features") content.append(characterFeatures(character));
  if (activeCharacterTab === "magic") content.append(characterMagic(character));
  if (activeCharacterTab === "inventory") content.append(characterInventory(character));
  if (activeCharacterTab === "notes") content.append(characterNotes(character));
  if (isAdmin) content.append(characterTabEditor(character));
  root.append(content);
  return root;
}

function characterTabBar() {
  const tabs = el("div", "tabs");
  characterTabs.forEach(([id, label]) => {
    const tab = button(label, `tab-button ${activeCharacterTab === id ? "active" : ""}`, () => {
      activeCharacterTab = id;
      render();
    });
    tabs.append(tab);
  });
  return tabs;
}

function characterSummary(character) {
  const root = el("div", "sheet-section-grid");
  root.append(
    infoPanel("Паспорт", [
      ["Игрок", character.player],
      ["Класс", character.className],
      ["Раса", character.ancestry],
      ["Родина", character.homeland],
      ["Размер", character.size],
      ["Пол", character.gender],
      ["Мировоззрение", character.alignment],
      ["Божество", character.deity || "не указано"],
    ]),
    infoPanel("Быстрые броски", [], [
      button(`Инициатива ${signed(character.initiative)}`, "small-button", () => rollFormula(`1d20${signed(character.initiative)}`, "Инициатива")),
      button(`Стойкость ${signed(character.saves.fort)}`, "small-button", () => rollFormula(`1d20${signed(character.saves.fort)}`, "Стойкость")),
      button(`Реакция ${signed(character.saves.ref)}`, "small-button", () => rollFormula(`1d20${signed(character.saves.ref)}`, "Реакция")),
      button(`Воля ${signed(character.saves.will)}`, "small-button", () => rollFormula(`1d20${signed(character.saves.will)}`, "Воля")),
    ]),
    infoPanel("Языки", [[character.languages || "не указаны", ""]])
  );
  return root;
}

function characterStats(character) {
  const root = el("div", "admin-stack");
  const stats = el("div", "sheet-grid");
  Object.entries(character.stats).forEach(([key, value]) => {
    const mod = statMod(value);
    const box = el("div", "stat-box stat-roll");
    box.append(el("span", "", key.toUpperCase()), el("strong", "", value), el("button", "small-button", signed(mod)));
    box.querySelector("button").addEventListener("click", () => rollFormula(`1d20${signed(mod)}`, key.toUpperCase()));
    stats.append(box);
  });
  root.append(stats, infoPanel("Спасброски", [
    ["Стойкость", signed(character.saves.fort)],
    ["Реакция", signed(character.saves.ref)],
    ["Воля", signed(character.saves.will)],
  ]));
  return root;
}

function characterCombat(character) {
  const root = el("div", "admin-stack");
  root.append(
    infoPanel("Боевая сводка", [
      ["HP", character.hp],
      ["AC", character.ac],
      ["Касание", character.touchAc],
      ["Врасплох", character.flatFootedAc],
      ["BAB", signed(character.bab)],
      ["CMB", signed(character.cmb)],
      ["CMD", character.cmd],
    ]),
    objectTable("Атаки", character.attacks, ["name", "bonus", "damage", "crit", "range", "type", "notes"], ["Оружие", "Атака", "Урон", "Крит", "Дист.", "Тип", "Заметки"], (attack) => [
      button("атака", "small-button", () => rollFormula(`1d20${attack.bonus}`, attack.name)),
      button("урон", "small-button", () => rollFormula(attack.damage, `${attack.name}: урон`)),
    ]),
    objectTable("Броня", character.armor, ["name", "ac", "maxDex", "penalty", "spellFail", "notes"], ["Название", "AC", "Max Dex", "Штраф", "Провал", "Заметки"])
  );
  return root;
}

function characterSkills(character) {
  const root = el("div", "admin-stack");
  const search = input(skillSearchTerm);
  search.placeholder = "Поиск по навыкам";
  const searchForm = el("form", "search-form");
  searchForm.append(search, button("Найти", "small-button", null, "submit"));
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    skillSearchTerm = search.value;
    render();
  });
  const skills = character.skills.filter((skill) =>
    [skill.name, skill.specialty, skill.ability].join(" ").toLowerCase().includes(skillSearchTerm.toLowerCase())
  );
  const skillRows = skills.map((skill) => ({ ...skill, displayName: skillDisplayName(skill) }));
  root.append(searchForm, objectTable(
    "Навыки",
    skillRows,
    ["displayName", "ability", "ranks", "classSkill", "misc", "armorPenalty", "total"],
    ["Навык", "Хар.", "Ранги", "Класс", "Проч.", "Штраф", "Итог"],
    (skill) => [button("бросок", "small-button", () => rollFormula(`1d20${signed(skill.total)}`, skill.displayName))]
  ));
  return root;
}

function characterFeatures(character) {
  const root = el("div", "sheet-section-grid");
  root.append(listPanel("Черты", character.feats), listPanel("Классовые особенности", character.features));
  return root;
}

function characterMagic(character) {
  return objectTable("Магия", character.spells, ["level", "known", "prepared"], ["Круг", "Известно/книга", "Подготовлено"]);
}

function characterInventory(character) {
  return objectTable("Инвентарь", character.inventory, ["name", "qty", "weight"], ["Предмет", "Кол-во", "Вес"]);
}

function characterNotes(character) {
  const root = el("div", "sheet-section-grid");
  root.append(infoPanel("Заметки игрока", [[character.notes || "нет заметок", ""]]));
  if (isAdmin) root.append(infoPanel("GM-заметки", [[character.gmNotes || "нет скрытых заметок", ""]]));
  return root;
}

function infoPanel(title, rows, actions = []) {
  const panel = el("section", "panel admin-stack");
  panel.append(el("h3", "", title));
  rows.forEach(([label, value]) => {
    const line = el("div", "info-line");
    line.append(el("span", "muted", label), el("strong", "", value));
    panel.append(line);
  });
  if (actions.length) panel.append(actionRow(actions));
  return panel;
}

function listPanel(title, items) {
  const panel = el("section", "panel admin-stack");
  panel.append(el("h3", "", title));
  panel.append(items?.length ? tags(items) : el("p", "muted", "Пока пусто"));
  return panel;
}

function objectTable(title, rows, keys, headings, actionFactory) {
  const wrap = el("div", "panel admin-stack");
  wrap.append(el("h3", "", title));
  const table = el("div", "object-table");
  if (title === "Навыки") table.classList.add("skills-table");
  table.style.setProperty("--cols", `${headings.length + (actionFactory ? 1 : 0)}`);
  if (title === "Навыки") {
    table.style.gridTemplateColumns = actionFactory
      ? "minmax(210px, 2fr) 58px 64px 68px 64px 64px 64px 86px"
      : "minmax(210px, 2fr) 58px 64px 68px 64px 64px 64px";
  }
  headings.forEach((heading) => table.append(el("strong", "table-head", heading)));
  if (actionFactory) table.append(el("strong", "table-head", "Roll"));
  rows.forEach((item) => {
    keys.forEach((key) => table.append(el("span", "", formatCell(item[key]))));
    if (actionFactory) table.append(actionRow(actionFactory(item)));
  });
  wrap.append(rows?.length ? table : el("p", "muted", "Пока пусто"));
  return wrap;
}

function tableBlock(title, rows, headings = ["Название", "Итог", ""]) {
  const wrap = el("div", "panel");
  wrap.append(el("h3", "", title));
  const table = el("div", "table-like");
  table.append(row(headings, "table-row header"));
  rows.forEach((item) => table.append(row([item[0], item[1], item[2] ?? ""], "table-row")));
  wrap.append(table);
  return wrap;
}

function row(items, className) {
  const line = el("div", className);
  items.forEach((item) => line.append(el("span", "", item)));
  return line;
}

function statMod(value) {
  return Math.floor((Number(value) - 10) / 2);
}

function signed(value) {
  const number = Number(String(value).replace("+", ""));
  if (Number.isNaN(number)) return String(value || "+0");
  return number >= 0 ? `+${number}` : String(number);
}

function initials(value) {
  return String(value || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatCell(value) {
  if (value === true) return "да";
  if (value === false) return "нет";
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function renderGallery() {
  const root = el("div");
  const action = isAdmin ? button("Новый арт", "primary-button", () => addGalleryItem()) : null;
  root.append(header("Галерея", "Арты, символы, локации и визуальные материалы кампании.", action));
  const tagBar = el("div", "gallery-filter-bar");
  const allButton = button("Все", `tag tag-button ${activeGalleryTag ? "" : "active"}`, () => {
    activeGalleryTag = "";
    render();
  });
  tagBar.append(allButton);
  allGalleryTags().forEach((tagName) => {
    const tagButton = button(tagName, `tag tag-button ${activeGalleryTag === tagName ? "active" : ""}`, () => {
      activeGalleryTag = activeGalleryTag === tagName ? "" : tagName;
      render();
    });
    attachTagTooltip(tagButton, tagName);
    tagBar.append(tagButton);
  });
  root.append(tagBar);
  const grid = el("div", "gallery-grid");
  const items = activeGalleryTag ? state.gallery.filter((item) => item.tags.includes(activeGalleryTag)) : state.gallery;
  filterItems(items, (item) => [item.title, item.type, item.linked, item.tags.join(" ")].join(" ")).forEach(
    (item) => {
      const card = el("article", "gallery-card");
      const art = galleryArt(item);
      const info = el("div", "gallery-info");
      info.append(el("p", "eyebrow", item.type), el("h3", "", item.title), el("p", "", item.linked), tags(item.tags));
      if (isAdmin) info.append(spacer(), galleryEditor(item));
      card.append(art, info);
      grid.append(card);
    }
  );
  root.append(grid);
  return root;
}

function addGalleryItem() {
  state.gallery.unshift({
    id: crypto.randomUUID(),
    title: "Новый образ Асханы",
    type: "Материал",
    linked: "Связь с wiki",
    tags: ["материал"],
    image: "",
    imageStyle: defaultImageStyle(),
    palette: ["#d4a74f", "#4da9a7", "#111719"],
  });
  saveState();
  render();
}

function galleryArt(item) {
  const frame = el("div", "gallery-art");
  const style = { ...defaultImageStyle(), ...(item.imageStyle ?? {}) };
  frame.classList.add(`image-aspect-${style.aspect}`);
  const img = document.createElement("img");
  img.src = galleryImage(item);
  img.alt = item.title;
  img.style.objectFit = style.fit;
  img.style.objectPosition = `${style.x}% ${style.y}%`;
  img.style.transform = `scale(${style.zoom})`;
  frame.append(img);
  return frame;
}

function galleryImage(item) {
  if (item.image) return item.image;
  const [a, b, c] = item.palette;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
      <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${a}"/><stop offset=".52" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs>
      <rect width="800" height="550" fill="${c}"/>
      <path d="M72 420 C190 168 352 90 504 146 C630 193 710 305 742 474 L72 474Z" fill="url(#g)" opacity=".92"/>
      <circle cx="570" cy="168" r="76" fill="#f6e5bd" opacity=".54"/>
      <path d="M170 366 C290 308 398 316 528 258 C608 222 668 224 734 248" stroke="#fff5d6" stroke-width="15" opacity=".32" fill="none"/>
      <text x="42" y="86" fill="#fff8e8" font-size="42" font-family="serif">${escapeSvg(item.title)}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderDirectory() {
  const root = el("div");
  const actions = isAdmin
    ? actionRow([
        button("Новый NPC", "primary-button", () => addNpc()),
        button("Новая фракция", "ghost-button", () => addFaction()),
      ])
    : null;
  root.append(header("NPC и фракции", "Рабочая база персонажей мира, организаций, отношений и связей с заданиями.", actions));

  const tabs = el("div", "directory-tabs");
  [
    ["npcs", `NPC (${visibleNpcs().length})`],
    ["factions", `Фракции (${visibleFactions().length})`],
  ].forEach(([tab, label]) => {
    tabs.append(button(label, `tab-button ${activeDirectoryTab === tab ? "active" : ""}`, () => {
      activeDirectoryTab = tab;
      render();
    }));
  });
  root.append(tabs);
  root.append(activeDirectoryTab === "factions" ? renderFactionDirectory() : renderNpcDirectory());
  return root;
}

function renderNpcDirectory() {
  const grid = el("div", "directory-grid");
  const items = filterItems(visibleNpcs(), (npc) =>
    [npc.name, npc.role, npc.ancestry, npc.location, npc.tags.join(" "), factionById(npc.factionId)?.name ?? ""].join(" ")
  );
  items.forEach((npc) => grid.append(npcCard(npc)));
  return grid.children.length ? grid : el("div", "empty-state", "NPC не найдены");
}

function renderFactionDirectory() {
  const grid = el("div", "directory-grid");
  const items = filterItems(visibleFactions(), (faction) =>
    [faction.name, faction.type, faction.leader, faction.headquarters, faction.tags.join(" "), faction.description].join(" ")
  );
  items.forEach((faction) => grid.append(factionCard(faction)));
  return grid.children.length ? grid : el("div", "empty-state", "Фракции не найдены");
}

function npcCard(npc) {
  const card = el("article", `directory-card relation-${relationTone(npc.relation)}`);
  const head = el("div", "directory-card-head");
  head.append(directoryPortrait(npc.portrait, npc.name), directoryTitleBlock(
    npc.name,
    [optionLabel(npcTypes, npc.type), npc.role, factionById(npc.factionId)?.name].filter(Boolean),
    [relationText(npc.relation), optionLabel(npcStatuses, npc.status), npc.public ? "игрокам" : "скрыто"]
  ));
  card.append(head);
  card.append(tags(npc.tags));
  card.append(el("p", "directory-description", npc.description || "Описание пока не заполнено."));
  card.append(directoryMeta([
    ["Раса/народ", npc.ancestry],
    ["Локация", npc.location],
    ["Последняя встреча", npc.lastSeen],
  ]));
  card.append(directoryLinks([
    ...linkedWikiByIds(npc.wikiLinks).map((article) => [`Wiki: ${article.title}`, () => openWikiArticle(article.id)]),
    ...linkedQuestsByIds(npc.questLinks).map((quest) => [`Задание: ${quest.title}`, () => openQuest(quest.id)]),
    ...(npc.factionId && factionById(npc.factionId) ? [[`Фракция: ${factionById(npc.factionId).name}`, () => openFaction(npc.factionId)]] : []),
  ]));
  if (isAdmin && npc.gmNotes) card.append(el("p", "gm-inline", `GM: ${npc.gmNotes}`));
  if (isAdmin) card.append(inlineEditor("Редактировать NPC", npcEditor(npc)));
  return card;
}

function factionCard(faction) {
  const card = el("article", `directory-card relation-${relationTone(faction.relation)}`);
  const head = el("div", "directory-card-head");
  head.append(directoryPortrait(faction.image, faction.name), directoryTitleBlock(
    faction.name,
    [optionLabel(factionTypes, faction.type), `Влияние: ${optionLabel(influenceLevels, faction.influence)}`],
    [relationText(faction.relation), faction.public ? "игрокам" : "скрыто"]
  ));
  card.append(head);
  card.append(tags(faction.tags));
  card.append(el("p", "directory-description", faction.description || "Описание пока не заполнено."));
  card.append(directoryMeta([
    ["Лидер", faction.leader],
    ["Штаб/территория", faction.headquarters],
    ["Цели", faction.goals],
    ["Ресурсы", faction.resources],
  ]));
  const memberNpcs = visibleNpcs().filter((npc) => npc.factionId === faction.id || faction.npcLinks.includes(npc.id));
  card.append(directoryLinks([
    ...memberNpcs.map((npc) => [`NPC: ${npc.name}`, () => openNpc(npc.id)]),
    ...linkedWikiByIds(faction.wikiLinks).map((article) => [`Wiki: ${article.title}`, () => openWikiArticle(article.id)]),
    ...linkedQuestsByIds(faction.questLinks).map((quest) => [`Задание: ${quest.title}`, () => openQuest(quest.id)]),
  ]));
  if (isAdmin && faction.gmNotes) card.append(el("p", "gm-inline", `GM: ${faction.gmNotes}`));
  if (isAdmin) card.append(inlineEditor("Редактировать фракцию", factionEditor(faction)));
  return card;
}

function directoryPortrait(src, name) {
  const frame = el("div", "directory-portrait");
  if (src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = name;
    frame.append(img);
  } else {
    frame.append(el("span", "", initials(name)));
  }
  return frame;
}

function directoryTitleBlock(title, subtitles, badges) {
  const block = el("div", "directory-title");
  block.append(el("h3", "", title), el("p", "", subtitles.filter(Boolean).join(" · ") || "Без роли"));
  block.append(compactBadges(badges));
  return block;
}

function directoryMeta(rows) {
  const meta = el("div", "directory-meta");
  rows.filter(([, value]) => value).forEach(([label, value]) => {
    const item = el("div", "directory-meta-item");
    item.append(el("span", "", label), el("strong", "", value));
    meta.append(item);
  });
  return meta;
}

function directoryLinks(entries) {
  const box = el("div", "map-link-list");
  entries.forEach(([label, handler]) => box.append(button(label, "map-link-button", handler)));
  return box.children.length ? box : el("p", "muted", "Связей пока нет");
}

function inlineEditor(title, content) {
  const details = el("details", "inline-editor");
  details.append(el("summary", "", title), content);
  return details;
}

function npcEditor(npc) {
  const form = el("form", "form-grid");
  const fields = {
    name: input(npc.name),
    type: selectInput(npcTypes, npc.type),
    ancestry: input(npc.ancestry),
    role: input(npc.role),
    factionId: selectInput([["", "Без фракции"], ...state.factions.map((faction) => [faction.id, faction.name])], npc.factionId),
    location: input(npc.location),
    relation: input(npc.relation),
    status: selectInput(npcStatuses, npc.status),
    lastSeen: input(npc.lastSeen),
    tags: input(npc.tags.join(", ")),
    description: textarea(npc.description),
    gmNotes: textarea(npc.gmNotes),
    public: document.createElement("input"),
    wikiLinks: checkboxList(visibleWiki().map((article) => [article.id, article.title]), npc.wikiLinks),
    questLinks: checkboxList(visibleQuests().map((quest) => [quest.id, quest.title]), npc.questLinks),
  };
  fields.public.type = "checkbox";
  fields.public.checked = npc.public;
  const portraitInput = document.createElement("input");
  portraitInput.type = "file";
  portraitInput.accept = "image/png,image/jpeg,image/webp,image/gif";
  portraitInput.addEventListener("change", async () => {
    const file = portraitInput.files?.[0];
    if (!file) return;
    npc.portrait = await imageFileToUrl(file, "npcs");
    saveState();
    render();
  });
  form.append(
    labelWrap("Имя", fields.name),
    labelWrap("Тип", fields.type),
    labelWrap("Раса/народ", fields.ancestry),
    labelWrap("Роль", fields.role),
    labelWrap("Фракция", fields.factionId),
    labelWrap("Локация", fields.location),
    labelWrap("Отношение -5..5", fields.relation),
    labelWrap("Статус", fields.status),
    labelWrap("Последняя встреча", fields.lastSeen),
    checkboxWrap("Видно игрокам", fields.public),
    labelWrap("Теги", fields.tags, "span-2"),
    labelWrap("Портрет", portraitInput, "span-2"),
    labelWrap("Описание", fields.description, "span-2"),
    labelWrap("GM-заметки", fields.gmNotes, "span-2"),
    labelWrap("Связанные Wiki", fields.wikiLinks, "span-2"),
    labelWrap("Связанные задания", fields.questLinks, "span-2"),
    actionRow([
      button("Сохранить NPC", "primary-button", null, "submit"),
      button("Удалить NPC", "ghost-button", () => deleteNpc(npc)),
    ], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextTags = csv(fields.tags.value);
    registerTags(nextTags, true);
    Object.assign(npc, normalizeNpc({
      ...npc,
      name: fields.name.value,
      type: fields.type.value,
      ancestry: fields.ancestry.value,
      role: fields.role.value,
      factionId: fields.factionId.value,
      location: fields.location.value,
      relation: Number(fields.relation.value || 0),
      status: fields.status.value,
      lastSeen: fields.lastSeen.value,
      public: fields.public.checked,
      tags: nextTags,
      description: fields.description.value,
      gmNotes: fields.gmNotes.value,
      wikiLinks: checkedValues(fields.wikiLinks),
      questLinks: checkedValues(fields.questLinks),
    }));
    saveState();
    render();
  });
  return form;
}

function factionEditor(faction) {
  const form = el("form", "form-grid");
  const fields = {
    name: input(faction.name),
    type: selectInput(factionTypes, faction.type),
    leader: input(faction.leader),
    headquarters: input(faction.headquarters),
    relation: input(faction.relation),
    influence: selectInput(influenceLevels, faction.influence),
    tags: input(faction.tags.join(", ")),
    description: textarea(faction.description),
    goals: textarea(faction.goals),
    resources: textarea(faction.resources),
    gmNotes: textarea(faction.gmNotes),
    public: document.createElement("input"),
    wikiLinks: checkboxList(visibleWiki().map((article) => [article.id, article.title]), faction.wikiLinks),
    questLinks: checkboxList(visibleQuests().map((quest) => [quest.id, quest.title]), faction.questLinks),
    npcLinks: checkboxList(state.npcs.map((npc) => [npc.id, npc.name]), faction.npcLinks),
    allies: checkboxList(state.factions.filter((item) => item.id !== faction.id).map((item) => [item.id, item.name]), faction.allies),
    enemies: checkboxList(state.factions.filter((item) => item.id !== faction.id).map((item) => [item.id, item.name]), faction.enemies),
  };
  fields.public.type = "checkbox";
  fields.public.checked = faction.public;
  const imageInput = document.createElement("input");
  imageInput.type = "file";
  imageInput.accept = "image/png,image/jpeg,image/webp,image/gif";
  imageInput.addEventListener("change", async () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    faction.image = await imageFileToUrl(file, "factions");
    saveState();
    render();
  });
  form.append(
    labelWrap("Название", fields.name),
    labelWrap("Тип", fields.type),
    labelWrap("Лидер", fields.leader),
    labelWrap("Штаб/территория", fields.headquarters),
    labelWrap("Отношение -5..5", fields.relation),
    labelWrap("Влияние", fields.influence),
    checkboxWrap("Видно игрокам", fields.public),
    labelWrap("Теги", fields.tags),
    labelWrap("Эмблема/картинка", imageInput, "span-2"),
    labelWrap("Описание", fields.description, "span-2"),
    labelWrap("Цели", fields.goals, "span-2"),
    labelWrap("Ресурсы", fields.resources, "span-2"),
    labelWrap("GM-заметки", fields.gmNotes, "span-2"),
    labelWrap("Связанные NPC", fields.npcLinks, "span-2"),
    labelWrap("Союзники", fields.allies, "span-2"),
    labelWrap("Враги", fields.enemies, "span-2"),
    labelWrap("Связанные Wiki", fields.wikiLinks, "span-2"),
    labelWrap("Связанные задания", fields.questLinks, "span-2"),
    actionRow([
      button("Сохранить фракцию", "primary-button", null, "submit"),
      button("Удалить фракцию", "ghost-button", () => deleteFaction(faction)),
    ], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextTags = csv(fields.tags.value);
    registerTags(nextTags, true);
    Object.assign(faction, normalizeFaction({
      ...faction,
      name: fields.name.value,
      type: fields.type.value,
      leader: fields.leader.value,
      headquarters: fields.headquarters.value,
      relation: Number(fields.relation.value || 0),
      influence: fields.influence.value,
      public: fields.public.checked,
      tags: nextTags,
      description: fields.description.value,
      goals: fields.goals.value,
      resources: fields.resources.value,
      gmNotes: fields.gmNotes.value,
      npcLinks: checkedValues(fields.npcLinks),
      allies: checkedValues(fields.allies),
      enemies: checkedValues(fields.enemies),
      wikiLinks: checkedValues(fields.wikiLinks),
      questLinks: checkedValues(fields.questLinks),
    }));
    saveState();
    render();
  });
  return form;
}

function addNpc() {
  if (!isAdmin) return;
  const npc = normalizeNpc({ id: slug("npc"), name: "Новый NPC", public: false, tags: ["новое"] });
  state.npcs.unshift(npc);
  activeDirectoryTab = "npcs";
  saveState();
  render();
}

function addFaction() {
  if (!isAdmin) return;
  const faction = normalizeFaction({ id: slug("faction"), name: "Новая фракция", public: false, tags: ["новое"] });
  state.factions.unshift(faction);
  activeDirectoryTab = "factions";
  saveState();
  render();
}

function deleteNpc(npc) {
  if (!confirm(`Удалить NPC "${npc.name}"?`)) return;
  state.npcs = state.npcs.filter((item) => item.id !== npc.id);
  state.factions.forEach((faction) => {
    faction.npcLinks = faction.npcLinks.filter((id) => id !== npc.id);
  });
  saveState();
  render();
}

function deleteFaction(faction) {
  if (!confirm(`Удалить фракцию "${faction.name}"? NPC останутся, но потеряют привязку к ней.`)) return;
  state.factions = state.factions.filter((item) => item.id !== faction.id);
  state.npcs.forEach((npc) => {
    if (npc.factionId === faction.id) npc.factionId = "";
  });
  saveState();
  render();
}

function factionById(id) {
  return state.factions.find((faction) => faction.id === id);
}

function npcById(id) {
  return state.npcs.find((npc) => npc.id === id);
}

function linkedWikiByIds(ids) {
  const visibleIds = new Set(visibleWiki().map((article) => article.id));
  return (ids ?? []).map((id) => wikiById(id)).filter((article) => article && visibleIds.has(article.id));
}

function linkedQuestsByIds(ids) {
  const visibleIds = new Set(visibleQuests().map((quest) => quest.id));
  return (ids ?? []).map((id) => state.quests.find((quest) => quest.id === id)).filter((quest) => quest && visibleIds.has(quest.id));
}

function openNpc(npcId) {
  const npc = npcById(npcId);
  activeDirectoryTab = "npcs";
  searchTerm = npc?.name ?? "";
  if (globalSearch) globalSearch.value = searchTerm;
  setView("directory");
}

function openFaction(factionId) {
  const faction = factionById(factionId);
  activeDirectoryTab = "factions";
  searchTerm = faction?.name ?? "";
  if (globalSearch) globalSearch.value = searchTerm;
  setView("directory");
}

function optionLabel(options, value) {
  return options.find(([id]) => id === value)?.[1] ?? value ?? "";
}

function relationTone(value) {
  const relation = Number(value || 0);
  if (relation <= -3) return "bad";
  if (relation >= 3) return "good";
  if (relation > 0) return "warm";
  if (relation < 0) return "cold";
  return "neutral";
}

function relationText(value) {
  const relation = Number(value || 0);
  return `отношение ${relation > 0 ? "+" : ""}${relation}`;
}

function renderSettlements() {
  const root = el("div");
  const action = isAdmin ? button("Новое поселение", "primary-button", () => addSettlement()) : null;
  root.append(header("Поселения", "Владения партии: постройки, доходы, проблемы, модификаторы и управление.", action));

  const visible = visibleSettlements();
  if (!visible.some((settlement) => settlement.id === activeSettlementId)) activeSettlementId = visible[0]?.id ?? null;
  if (!visible.length) {
    root.append(el("div", "empty-state", "Публичных поселений пока нет."));
    return root;
  }

  const active = visible.find((settlement) => settlement.id === activeSettlementId) ?? visible[0];
  const layout = el("div", "settlement-layout");
  const list = el("aside", "panel settlement-list");
  list.append(el("p", "eyebrow", "Домены"), el("h3", "", "Поселения"));
  visible.forEach((settlement) => {
    const summary = settlementEconomy(settlement);
    const item = button("", `settlement-list-card ${settlement.id === active.id ? "active" : ""}`, () => {
      activeSettlementId = settlement.id;
      render();
    });
    item.append(
      el("strong", "", settlement.name),
      el("span", "", `${optionLabel(settlementTypes, settlement.type)} · ${formatGold(summary.net)} / месяц`),
      compactBadges([settlement.public ? "игрокам" : "скрыто", `угроза ${summary.threat}`])
    );
    list.append(item);
  });
  if (isAdmin) list.append(actionRow([button("Добавить поселение", "primary-button", () => addSettlement())]));
  layout.append(list, settlementDetail(active));
  root.append(layout);
  return root;
}

function settlementDetail(settlement) {
  const detail = el("section", "panel settlement-detail");
  const economy = settlementEconomy(settlement);
  const faction = factionById(settlement.factionId);
  const linkedMap = state.map.regions.find((region) => region.id === settlement.mapRegionId);
  detail.append(
    el("p", "eyebrow", optionLabel(settlementTypes, settlement.type)),
    el("h3", "", settlement.name),
    compactBadges([settlement.size, `${settlement.population} жителей`, settlement.public ? "игрокам" : "скрыто"]),
    el("p", "settlement-description", settlement.description || "Описание пока не заполнено.")
  );
  detail.append(metricGrid([
    ["Доход", formatGold(economy.income)],
    ["Содержание", formatGold(-economy.upkeep)],
    ["Итог", formatGold(economy.net)],
    ["Лояльность", signed(economy.loyalty)],
    ["Безопасность", signed(economy.security)],
    ["Экономика", signed(economy.economy)],
    ["Стабильность", signed(economy.stability)],
    ["Угроза", signed(economy.threat)],
  ]));
  detail.append(directoryMeta([
    ["Управляющий", settlement.ruler],
    ["Фракция", faction?.name],
    ["Карта", linkedMap?.title],
  ]));
  detail.append(directoryLinks([
    ...(faction ? [[`Фракция: ${faction.name}`, () => openFaction(faction.id)]] : []),
    ...(linkedMap ? [[`Карта: ${linkedMap.title}`, () => selectSettlementMap(linkedMap.id)]] : []),
    ...linkedWikiByIds(settlement.wikiLinks).map((article) => [`Wiki: ${article.title}`, () => openWikiArticle(article.id)]),
    ...linkedQuestsByIds(settlement.questLinks).map((quest) => [`Задание: ${quest.title}`, () => openQuest(quest.id)]),
    ...visibleNpcs().filter((npc) => settlement.npcLinks.includes(npc.id)).map((npc) => [`NPC: ${npc.name}`, () => openNpc(npc.id)]),
  ]));
  detail.append(settlementSection("Постройки", settlementBuildingsView(settlement)));
  detail.append(settlementSection("Проблемы", settlementProblemsView(settlement)));
  detail.append(settlementSection("Модификаторы", settlementModifiersView(settlement)));
  detail.append(settlementSection("Журнал управления", settlementLogView(settlement)));
  if (isAdmin && settlement.gmNotes) detail.append(el("p", "gm-inline", `GM: ${settlement.gmNotes}`));
  if (isAdmin) detail.append(inlineEditor("Редактировать поселение", settlementEditor(settlement)));
  return detail;
}

function settlementSection(title, content) {
  const section = el("section", "settlement-section");
  section.append(el("h4", "", title), content);
  return section;
}

function settlementBuildingsView(settlement) {
  const visibleBuildings = settlement.buildings.filter((building) => isAdmin || building.status !== "abandoned");
  if (!visibleBuildings.length) return el("p", "muted", "Построек пока нет.");
  const grid = el("div", "settlement-item-grid");
  visibleBuildings.forEach((building) => {
    const card = el("article", "settlement-item");
    card.append(
      el("strong", "", building.name),
      compactBadges([building.type, optionLabel(buildingStatuses, building.status), `${formatGold(building.income - building.upkeep)}/мес`]),
      el("p", "", building.notes || "Без заметок."),
      compactBadges(effectBadges(building))
    );
    grid.append(card);
  });
  return grid;
}

function settlementProblemsView(settlement) {
  const visibleProblems = settlement.problems.filter((problem) => problem.status !== "hidden" || isAdmin).filter((problem) => problem.public || isAdmin);
  if (!visibleProblems.length) return el("p", "muted", "Активных проблем пока нет.");
  const grid = el("div", "settlement-item-grid");
  visibleProblems.forEach((problem) => {
    const card = el("article", `settlement-item problem-${problem.severity}`);
    const quest = state.quests.find((item) => item.id === problem.linkedQuest);
    card.append(
      el("strong", "", problem.title),
      compactBadges([optionLabel(problemSeverities, problem.severity), optionLabel(problemStatuses, problem.status), problem.public ? "игрокам" : "скрыто"]),
      el("p", "", problem.notes || "Без заметок."),
      compactBadges(effectBadges(problem))
    );
    if (quest) card.append(button(`Задание: ${quest.title}`, "map-link-button", () => openQuest(quest.id)));
    grid.append(card);
  });
  return grid;
}

function settlementModifiersView(settlement) {
  if (!settlement.modifiers.length) return el("p", "muted", "Модификаторов пока нет.");
  const grid = el("div", "settlement-item-grid");
  settlement.modifiers.forEach((modifier) => {
    const card = el("article", "settlement-item");
    card.append(
      el("strong", "", modifier.title),
      el("p", "", modifier.notes || "Без заметок."),
      compactBadges(effectBadges(modifier))
    );
    grid.append(card);
  });
  return grid;
}

function settlementLogView(settlement) {
  const entries = settlement.log.filter((entry) => entry.public || isAdmin);
  if (!entries.length) return el("p", "muted", "Журнал пока пуст.");
  const list = el("div", "settlement-log");
  entries.forEach((entry) => {
    const item = el("div", "settlement-log-item");
    item.append(el("span", "", entry.date || "без даты"), el("p", "", entry.text));
    list.append(item);
  });
  return list;
}

function settlementEconomy(settlement) {
  const activeBuildings = settlement.buildings.filter((item) => item.status === "active");
  const activeProblems = settlement.problems.filter((item) => item.status === "active");
  const allEffects = [...activeBuildings, ...activeProblems, ...settlement.modifiers];
  const totals = {
    income: sumBy(allEffects, "income"),
    upkeep: sumBy(allEffects, "upkeep"),
    loyalty: settlement.loyalty + sumBy(allEffects, "loyalty"),
    security: settlement.security + sumBy(allEffects, "security"),
    economy: settlement.economy + sumBy(allEffects, "economy"),
    stability: settlement.stability + sumBy(allEffects, "stability"),
    threat: settlement.threat + sumBy(allEffects, "threat"),
  };
  totals.net = totals.income - totals.upkeep;
  return totals;
}

function sumBy(items, key) {
  return items.reduce((sum, item) => sum + normalizeEffectNumber(item[key]), 0);
}

function effectBadges(item) {
  return [
    item.income ? `доход ${formatGold(item.income)}` : "",
    item.upkeep ? `содержание ${formatGold(-item.upkeep)}` : "",
    item.loyalty ? `лояльность ${signed(item.loyalty)}` : "",
    item.security ? `безопасность ${signed(item.security)}` : "",
    item.economy ? `экономика ${signed(item.economy)}` : "",
    item.stability ? `стабильность ${signed(item.stability)}` : "",
    item.threat ? `угроза ${signed(item.threat)}` : "",
  ].filter(Boolean);
}

function formatGold(value) {
  const number = Number(value || 0);
  return `${number > 0 ? "+" : ""}${number} зм`;
}

function selectSettlementMap(regionId) {
  if (!setView("map")) return;
  selectMapRegion(regionId);
}

function settlementEditor(settlement) {
  const form = el("form", "form-grid");
  const fields = {
    name: input(settlement.name),
    type: selectInput(settlementTypes, settlement.type),
    ruler: input(settlement.ruler),
    factionId: selectInput([["", "Без фракции"], ...state.factions.map((faction) => [faction.id, faction.name])], settlement.factionId),
    mapRegionId: selectInput([["", "Без карты"], ...state.map.regions.map((region) => [region.id, region.title])], settlement.mapRegionId),
    population: input(settlement.population),
    size: input(settlement.size),
    loyalty: input(settlement.loyalty),
    security: input(settlement.security),
    economy: input(settlement.economy),
    stability: input(settlement.stability),
    threat: input(settlement.threat),
    tags: input(settlement.tags.join(", ")),
    description: textarea(settlement.description),
    gmNotes: textarea(settlement.gmNotes),
    public: document.createElement("input"),
    wikiLinks: checkboxList(visibleWiki().map((article) => [article.id, article.title]), settlement.wikiLinks),
    questLinks: checkboxList(visibleQuests().map((quest) => [quest.id, quest.title]), settlement.questLinks),
    npcLinks: checkboxList(state.npcs.map((npc) => [npc.id, npc.name]), settlement.npcLinks),
    buildings: textarea(JSON.stringify(settlement.buildings, null, 2)),
    problems: textarea(JSON.stringify(settlement.problems, null, 2)),
    modifiers: textarea(JSON.stringify(settlement.modifiers, null, 2)),
    log: textarea(JSON.stringify(settlement.log, null, 2)),
  };
  fields.public.type = "checkbox";
  fields.public.checked = settlement.public;
  [fields.buildings, fields.problems, fields.modifiers, fields.log].forEach((control) => control.classList.add("json-editor", "compact-json"));
  form.append(
    labelWrap("Название", fields.name),
    labelWrap("Тип", fields.type),
    labelWrap("Управляющий", fields.ruler),
    labelWrap("Фракция", fields.factionId),
    labelWrap("Карта", fields.mapRegionId),
    labelWrap("Население", fields.population),
    labelWrap("Размер", fields.size),
    checkboxWrap("Видно игрокам", fields.public),
    el("h3", "span-2", "Базовые показатели"),
    labelWrap("Лояльность", fields.loyalty),
    labelWrap("Безопасность", fields.security),
    labelWrap("Экономика", fields.economy),
    labelWrap("Стабильность", fields.stability),
    labelWrap("Угроза", fields.threat),
    labelWrap("Теги", fields.tags, "span-2"),
    labelWrap("Описание", fields.description, "span-2"),
    labelWrap("GM-заметки", fields.gmNotes, "span-2"),
    labelWrap("Связанные Wiki", fields.wikiLinks, "span-2"),
    labelWrap("Связанные задания", fields.questLinks, "span-2"),
    labelWrap("Связанные NPC", fields.npcLinks, "span-2"),
    el("h3", "span-2", "Экономика и события"),
    labelWrap("Постройки JSON", fields.buildings, "span-2"),
    labelWrap("Проблемы JSON", fields.problems, "span-2"),
    labelWrap("Модификаторы JSON", fields.modifiers, "span-2"),
    labelWrap("Журнал JSON", fields.log, "span-2"),
    actionRow([
      button("Сохранить поселение", "primary-button", null, "submit"),
      button("Удалить поселение", "ghost-button", () => deleteSettlement(settlement)),
    ], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextTags = csv(fields.tags.value);
    let parsed;
    try {
      parsed = {
        buildings: JSON.parse(fields.buildings.value || "[]"),
        problems: JSON.parse(fields.problems.value || "[]"),
        modifiers: JSON.parse(fields.modifiers.value || "[]"),
        log: JSON.parse(fields.log.value || "[]"),
      };
    } catch {
      alert("JSON поселения не сохранен: проверь скобки, кавычки и запятые в постройках/проблемах/модификаторах/журнале.");
      return;
    }
    registerTags(nextTags, true);
    Object.assign(settlement, normalizeSettlement({
      ...settlement,
      name: fields.name.value,
      type: fields.type.value,
      ruler: fields.ruler.value,
      factionId: fields.factionId.value,
      mapRegionId: fields.mapRegionId.value,
      population: Number(fields.population.value || 0),
      size: fields.size.value,
      loyalty: Number(fields.loyalty.value || 0),
      security: Number(fields.security.value || 0),
      economy: Number(fields.economy.value || 0),
      stability: Number(fields.stability.value || 0),
      threat: Number(fields.threat.value || 0),
      public: fields.public.checked,
      tags: nextTags,
      description: fields.description.value,
      gmNotes: fields.gmNotes.value,
      wikiLinks: checkedValues(fields.wikiLinks),
      questLinks: checkedValues(fields.questLinks),
      npcLinks: checkedValues(fields.npcLinks),
      ...parsed,
    }));
    saveState();
    render();
  });
  return form;
}

function addSettlement() {
  if (!isAdmin) return;
  const settlement = normalizeSettlement({
    id: slug("settlement"),
    name: "Новое поселение",
    type: "village",
    public: false,
    tags: ["новое"],
    description: "Новое владение партии.",
    buildings: [],
    problems: [],
    modifiers: [],
    log: [],
  });
  state.settlements.unshift(settlement);
  activeSettlementId = settlement.id;
  saveState();
  render();
}

function deleteSettlement(settlement) {
  if (!confirm(`Удалить поселение "${settlement.name}"?`)) return;
  state.settlements = state.settlements.filter((item) => item.id !== settlement.id);
  activeSettlementId = visibleSettlements()[0]?.id ?? null;
  saveState();
  render();
}

function openSettlement(settlementId) {
  const settlement = visibleSettlements().find((item) => item.id === settlementId);
  if (!settlement) return;
  activeSettlementId = settlement.id;
  setView("settlements");
}

function renderCalendar() {
  const root = el("div");
  const selectedDate = ashanaDateFromKey(activeCalendarDateKey || ashanaDateKey(state.meta.ashanaDate));
  const monthNames = campaignMonthNames();
  const action = isAdmin
    ? actionRow([
        button("+1 день", "primary-button", () => shiftCurrentDate(1)),
        button("Новое событие", "ghost-button", () => addCalendarEvent(selectedDate)),
      ])
    : null;
  root.append(header("Календарь", "Год Асханы: 360 дней, 10 месяцев по 36 дней, 4 недели по 9 дней.", action));

  const layout = el("div", "calendar-layout");
  const overview = el("section", "panel calendar-current");
  overview.append(
    el("p", "eyebrow", "Текущая дата"),
    el("h3", "", formatAshanaDate(state.meta.ashanaDate)),
    compactBadges([ashanaWeekday(state.meta.ashanaDate), `${ashanaWeekNumber(state.meta.ashanaDate)} неделя`, `${state.meta.ashanaDate.year} год`]),
    metricGrid([
      ["Месяц", `${state.meta.ashanaDate.month}. ${monthNames[state.meta.ashanaDate.month - 1]}`],
      ["День", state.meta.ashanaDate.day],
      ["Неделя", `${ashanaWeekNumber(state.meta.ashanaDate)} / 4`],
      ["День года", (state.meta.ashanaDate.month - 1) * 36 + state.meta.ashanaDate.day],
    ])
  );
  if (isAdmin) {
    overview.append(actionRow([
      button("-1 день", "ghost-button", () => shiftCurrentDate(-1)),
      button("+9 дней", "ghost-button", () => shiftCurrentDate(9)),
    ]));
    overview.append(inlineEditor("Поставить точную дату", calendarDateEditor()));
    overview.append(inlineEditor("Названия месяцев", monthNamesEditor()));
  }

  const monthPanel = el("section", "panel calendar-month");
  monthPanel.append(el("p", "eyebrow", "Месяц"), el("h3", "", `${selectedDate.month}. ${monthNames[selectedDate.month - 1]}`));
  const prevMonth = button("Пред. месяц", "ghost-button", () => shiftCalendarMonth(-1));
  const nextMonth = button("След. месяц", "ghost-button", () => shiftCalendarMonth(1));
  prevMonth.disabled = selectedDate.month <= 1;
  nextMonth.disabled = selectedDate.month >= 10;
  const monthControls = actionRow([
    prevMonth,
    button("Текущий месяц", "ghost-button", () => {
      activeCalendarDateKey = ashanaDateKey(state.meta.ashanaDate);
      render();
    }),
    nextMonth,
  ]);
  monthPanel.append(monthControls, monthTracker(selectedDate));
  const days = el("div", "calendar-days");
  for (let day = 1; day <= 36; day += 1) {
    const date = { year: selectedDate.year, month: selectedDate.month, day };
    const events = eventsForDate(date);
    const classes = [
      "calendar-day",
      ashanaDateKey(date) === ashanaDateKey(state.meta.ashanaDate) ? "current" : "",
      ashanaDateKey(date) === activeCalendarDateKey ? "selected" : "",
      events.length ? "has-events" : "",
    ].filter(Boolean).join(" ");
    const cell = button("", classes, () => {
      activeCalendarDateKey = ashanaDateKey(date);
      render();
    });
    cell.append(el("strong", "", day), el("span", "", ashanaWeekday(date).replace(" день", "")));
    if (events.length) cell.append(el("small", "", events.length));
    days.append(cell);
  }
  monthPanel.append(days);

  const dayPanel = el("section", "panel calendar-day-panel");
  const selectedEvents = eventsForDate(selectedDate);
  dayPanel.append(
    el("p", "eyebrow", "Выбранный день"),
    el("h3", "", formatAshanaDate(selectedDate)),
    compactBadges([ashanaWeekday(selectedDate), `${ashanaWeekNumber(selectedDate)} неделя`, `${selectedEvents.length} событий`])
  );
  if (isAdmin && ashanaDateKey(selectedDate) !== ashanaDateKey(state.meta.ashanaDate)) {
    dayPanel.append(actionRow([button("Сделать текущей датой", "primary-button", () => {
      setCurrentAshanaDate(selectedDate);
      saveState();
      render();
    })]));
  }
  dayPanel.append(calendarEventsList(selectedEvents));
  if (isAdmin) dayPanel.append(inlineEditor("Добавить событие на этот день", calendarEventEditor(normalizeCalendarEvent({ date: selectedDate }), true)));

  layout.append(overview, monthPanel, dayPanel);
  root.append(layout);
  return root;
}

function shiftCurrentDate(delta) {
  setCurrentAshanaDate(ashanaDateFromIndex(ashanaDateIndex(state.meta.ashanaDate) + delta));
  saveState();
  render();
}

function shiftCalendarMonth(delta) {
  const selected = ashanaDateFromKey(activeCalendarDateKey);
  const nextMonth = selected.month + delta;
  if (nextMonth < 1 || nextMonth > 10) return;
  activeCalendarDateKey = ashanaDateKey({ ...selected, month: nextMonth, day: Math.min(selected.day, 36) });
  render();
}

function monthTracker(selectedDate) {
  const track = el("div", "calendar-month-track");
  campaignMonthNames().forEach((name, index) => {
    const monthNumber = index + 1;
    const item = button(String(monthNumber), `month-track-item ${monthNumber === selectedDate.month ? "active" : ""} ${monthNumber === state.meta.ashanaDate.month ? "current" : ""}`, () => {
      activeCalendarDateKey = ashanaDateKey({ ...selectedDate, month: monthNumber });
      render();
    });
    item.title = name;
    track.append(item);
  });
  return track;
}

function eventsForDate(date) {
  const key = ashanaDateKey(date);
  return visibleCalendarEvents()
    .filter((event) => ashanaDateKey(event.date) === key)
    .sort((a, b) => optionLabel(calendarEventTypes, a.type).localeCompare(optionLabel(calendarEventTypes, b.type), "ru"));
}

function calendarEventsList(events) {
  if (!events.length) return el("div", "empty-state compact-empty", "На этот день событий нет.");
  const list = el("div", "calendar-event-list");
  events.forEach((event) => {
    const card = el("article", "calendar-event");
    card.append(
      compactBadges([optionLabel(calendarEventTypes, event.type), event.public ? "игрокам" : "скрыто"]),
      el("h4", "", event.title),
      el("p", "", event.summary || "Описание пока не заполнено."),
      entityLinks(event)
    );
    if (isAdmin && event.gmNotes) card.append(el("p", "gm-inline", `GM: ${event.gmNotes}`));
    if (isAdmin) card.append(inlineEditor("Редактировать событие", calendarEventEditor(event)));
    list.append(card);
  });
  return list;
}

function calendarDateEditor() {
  const form = el("form", "form-grid compact-form");
  const year = input(state.meta.ashanaDate.year);
  const month = selectInput(monthOptions(), String(state.meta.ashanaDate.month));
  const day = input(state.meta.ashanaDate.day);
  day.type = "number";
  day.min = 1;
  day.max = 36;
  year.type = "number";
  year.min = 1;
  form.append(
    labelWrap("Год", year),
    labelWrap("Месяц", month),
    labelWrap("День", day),
    actionRow([button("Сохранить дату", "primary-button", null, "submit")], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setCurrentAshanaDate({ year: Number(year.value), month: Number(month.value), day: Number(day.value) });
    saveState();
    render();
  });
  return form;
}

function monthNamesEditor() {
  const form = el("form", "form-grid month-name-editor");
  const controls = campaignMonthNames().map((name, index) => {
    const control = input(name);
    form.append(labelWrap(`${index + 1} месяц`, control));
    return control;
  });
  form.append(actionRow([button("Сохранить месяцы", "primary-button", null, "submit")], "span-2"));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    state.meta.monthNames = normalizeMonthNames(controls.map((control) => control.value));
    state.meta.currentDate = formatAshanaDate(state.meta.ashanaDate);
    saveState();
    render();
  });
  return form;
}

function calendarEventEditor(event, create = false) {
  const form = el("form", "form-grid");
  const fields = linkedEntityFields(event);
  const title = input(event.title);
  const type = selectInput(calendarEventTypes, event.type);
  const year = input(event.date.year);
  const month = selectInput(monthOptions(), String(event.date.month));
  const day = input(event.date.day);
  const summary = textarea(event.summary);
  const gmNotes = textarea(event.gmNotes);
  const publicInput = document.createElement("input");
  publicInput.type = "checkbox";
  publicInput.checked = event.public;
  [year, day].forEach((item) => {
    item.type = "number";
    item.min = item === day ? 1 : 1;
  });
  day.max = 36;
  form.append(
    labelWrap("Название", title),
    labelWrap("Тип", type),
    labelWrap("Год", year),
    labelWrap("Месяц", month),
    labelWrap("День", day),
    checkboxWrap("Видно игрокам", publicInput),
    labelWrap("Описание", summary, "span-2"),
    labelWrap("GM-заметки", gmNotes, "span-2"),
    linkedEntityControls(fields),
    actionRow([
      button(create ? "Создать событие" : "Сохранить событие", "primary-button", null, "submit"),
      ...(create ? [] : [button("Удалить событие", "ghost-button", () => deleteCalendarEvent(event))]),
    ], "span-2")
  );
  form.addEventListener("submit", (submitEvent) => {
    submitEvent.preventDefault();
    const next = normalizeCalendarEvent({
      ...event,
      title: title.value,
      type: type.value,
      date: { year: Number(year.value), month: Number(month.value), day: Number(day.value) },
      public: publicInput.checked,
      summary: summary.value,
      gmNotes: gmNotes.value,
      ...readLinkedEntityFields(fields),
    });
    if (create) {
      state.calendarEvents.unshift(next);
      activeCalendarDateKey = ashanaDateKey(next.date);
    } else {
      Object.assign(event, next);
    }
    saveState();
    render();
  });
  return form;
}

function addCalendarEvent(date = state.meta.ashanaDate) {
  if (!isAdmin) return;
  const event = normalizeCalendarEvent({
    id: slug("event"),
    title: "Новое событие",
    type: "note",
    date,
    public: false,
    summary: "Описание события.",
  });
  state.calendarEvents.unshift(event);
  activeCalendarDateKey = ashanaDateKey(event.date);
  saveState();
  render();
}

function deleteCalendarEvent(event) {
  if (!confirm(`Удалить событие "${event.title}"?`)) return;
  state.calendarEvents = state.calendarEvents.filter((item) => item.id !== event.id);
  saveState();
  render();
}

function renderSessions() {
  const root = el("div");
  const action = isAdmin ? button("Новая запись", "primary-button", () => addSessionLog()) : null;
  root.append(header("Журнал сессий", "Хроника решений партии, добычи, последствий и зацепок по игровым датам.", action));
  const visible = visibleSessionLogs().sort((a, b) => ashanaDateIndex(b.date) - ashanaDateIndex(a.date) || b.sessionNumber - a.sessionNumber);
  if (!visible.some((session) => session.id === activeSessionId)) activeSessionId = visible[0]?.id ?? null;
  if (!visible.length) {
    root.append(el("div", "empty-state", "Публичных записей журнала пока нет."));
    return root;
  }
  const active = visible.find((session) => session.id === activeSessionId) ?? visible[0];
  const layout = el("div", "session-layout");
  const list = el("aside", "panel session-list");
  list.append(el("p", "eyebrow", "Хроника"), el("h3", "", "Сессии"));
  visible.forEach((session) => {
    const item = button("", `session-list-card ${session.id === active.id ? "active" : ""}`, () => {
      activeSessionId = session.id;
      render();
    });
    item.append(
      el("strong", "", `#${session.sessionNumber} ${session.title}`),
      el("span", "", formatAshanaDate(session.date)),
      compactBadges([session.public ? "игрокам" : "скрыто", session.players || "без состава"])
    );
    list.append(item);
  });
  layout.append(list, sessionDetail(active));
  root.append(layout);
  return root;
}

function sessionDetail(session) {
  const detail = el("section", "panel session-detail");
  detail.append(
    el("p", "eyebrow", `Сессия #${session.sessionNumber}`),
    el("h3", "", session.title),
    compactBadges([formatAshanaDate(session.date), ashanaWeekday(session.date), session.public ? "игрокам" : "скрыто"]),
    directoryMeta([
      ["Состав", session.players],
      ["Добыча", session.loot],
    ])
  );
  detail.append(sessionTextBlock("Итоги", session.summary));
  detail.append(sessionTextBlock("Решения партии", session.decisions));
  detail.append(sessionTextBlock("Последствия", session.consequences));
  detail.append(entityLinks(session));
  if (isAdmin && session.gmNotes) detail.append(el("p", "gm-inline", `GM: ${session.gmNotes}`));
  if (isAdmin) detail.append(inlineEditor("Редактировать запись", sessionEditor(session)));
  return detail;
}

function sessionTextBlock(title, text) {
  const block = el("section", "session-text-block");
  block.append(el("h4", "", title), el("p", "", text || "Пока не заполнено."));
  return block;
}

function sessionEditor(session) {
  const form = el("form", "form-grid");
  const fields = linkedEntityFields(session);
  const title = input(session.title);
  const sessionNumber = input(session.sessionNumber);
  const year = input(session.date.year);
  const month = selectInput(monthOptions(), String(session.date.month));
  const day = input(session.date.day);
  const players = input(session.players);
  const summary = textarea(session.summary);
  const decisions = textarea(session.decisions);
  const loot = textarea(session.loot);
  const consequences = textarea(session.consequences);
  const gmNotes = textarea(session.gmNotes);
  const publicInput = document.createElement("input");
  publicInput.type = "checkbox";
  publicInput.checked = session.public;
  [sessionNumber, year, day].forEach((item) => {
    item.type = "number";
    item.min = 1;
  });
  day.max = 36;
  form.append(
    labelWrap("Название", title),
    labelWrap("Номер сессии", sessionNumber),
    labelWrap("Год", year),
    labelWrap("Месяц", month),
    labelWrap("День", day),
    labelWrap("Игроки/состав", players),
    checkboxWrap("Видно игрокам", publicInput),
    labelWrap("Итоги", summary, "span-2"),
    labelWrap("Решения", decisions, "span-2"),
    labelWrap("Добыча", loot, "span-2"),
    labelWrap("Последствия", consequences, "span-2"),
    labelWrap("GM-заметки", gmNotes, "span-2"),
    linkedEntityControls(fields),
    actionRow([
      button("Сохранить запись", "primary-button", null, "submit"),
      button("Удалить запись", "ghost-button", () => deleteSessionLog(session)),
    ], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    Object.assign(session, normalizeSessionLog({
      ...session,
      title: title.value,
      sessionNumber: Number(sessionNumber.value || 1),
      date: { year: Number(year.value), month: Number(month.value), day: Number(day.value) },
      public: publicInput.checked,
      players: players.value,
      summary: summary.value,
      decisions: decisions.value,
      loot: loot.value,
      consequences: consequences.value,
      gmNotes: gmNotes.value,
      ...readLinkedEntityFields(fields),
    }));
    saveState();
    render();
  });
  return form;
}

function addSessionLog() {
  if (!isAdmin) return;
  const nextNumber = Math.max(0, ...state.sessionLogs.map((session) => Number(session.sessionNumber || 0))) + 1;
  const session = normalizeSessionLog({
    id: slug("session"),
    title: "Новая сессия",
    sessionNumber: nextNumber,
    date: state.meta.ashanaDate,
    public: false,
    summary: "Краткие итоги сессии.",
  });
  state.sessionLogs.unshift(session);
  activeSessionId = session.id;
  saveState();
  render();
}

function deleteSessionLog(session) {
  if (!confirm(`Удалить запись "${session.title}"?`)) return;
  state.sessionLogs = state.sessionLogs.filter((item) => item.id !== session.id);
  activeSessionId = visibleSessionLogs()[0]?.id ?? null;
  saveState();
  render();
}

function linkedEntityFields(source) {
  return {
    wikiLinks: checkboxList(visibleWiki().map((article) => [article.id, article.title]), source.wikiLinks),
    questLinks: checkboxList(visibleQuests().map((quest) => [quest.id, quest.title]), source.questLinks),
    npcLinks: checkboxList(visibleNpcs().map((npc) => [npc.id, npc.name]), source.npcLinks),
    settlementLinks: checkboxList(visibleSettlements().map((settlement) => [settlement.id, settlement.name]), source.settlementLinks),
    mapLinks: checkboxList(visibleMapRegions().map((region) => [region.id, region.title]), source.mapLinks),
  };
}

function linkedEntityControls(fields) {
  return fragment([
    labelWrap("Связанные Wiki", fields.wikiLinks, "span-2"),
    labelWrap("Связанные задания", fields.questLinks, "span-2"),
    labelWrap("Связанные NPC", fields.npcLinks, "span-2"),
    labelWrap("Связанные поселения", fields.settlementLinks, "span-2"),
    labelWrap("Связанные карты", fields.mapLinks, "span-2"),
  ]);
}

function readLinkedEntityFields(fields) {
  return {
    wikiLinks: checkedValues(fields.wikiLinks),
    questLinks: checkedValues(fields.questLinks),
    npcLinks: checkedValues(fields.npcLinks),
    settlementLinks: checkedValues(fields.settlementLinks),
    mapLinks: checkedValues(fields.mapLinks),
  };
}

function entityLinks(source) {
  return directoryLinks([
    ...linkedWikiByIds(source.wikiLinks ?? []).map((article) => [`Wiki: ${article.title}`, () => openWikiArticle(article.id)]),
    ...linkedQuestsByIds(source.questLinks ?? []).map((quest) => [`Задание: ${quest.title}`, () => openQuest(quest.id)]),
    ...visibleNpcs().filter((npc) => (source.npcLinks ?? []).includes(npc.id)).map((npc) => [`NPC: ${npc.name}`, () => openNpc(npc.id)]),
    ...visibleSettlements().filter((settlement) => (source.settlementLinks ?? []).includes(settlement.id)).map((settlement) => [`Поселение: ${settlement.name}`, () => openSettlement(settlement.id)]),
    ...visibleMapRegions().filter((region) => (source.mapLinks ?? []).includes(region.id)).map((region) => [`Карта: ${region.title}`, () => selectSettlementMap(region.id)]),
  ]);
}

function allGalleryTags() {
  return [...new Set(state.gallery.flatMap((item) => item.tags ?? []))].sort((a, b) => a.localeCompare(b));
}

function renderQuests() {
  const root = el("div");
  const action = isAdmin ? button("Новое задание", "primary-button", () => openQuestCreator()) : null;
  root.append(header("Доска заданий", "Активные, завершенные и скрытые задачи кампании.", action));

  const grid = el("div", "quest-grid");
  filterItems(visibleQuests(), (item) =>
    [item.title, item.status, item.patron, item.reward, item.linked, item.notes].join(" ")
  ).forEach((quest) => {
    const card = el("article", "quest-card");
    const meta = el("div", "quest-meta-grid");
    meta.append(
      questMeta("Заказчик", quest.patron),
      questMeta("Награда", quest.reward),
      questMeta("Связь", quest.linked)
    );
    card.append(
      el("span", `quest-status ${quest.status}`, questStatus(quest.status)),
      el("h3", "", quest.title),
      el("p", "quest-description", quest.notes),
      meta
    );
    if (isAdmin) {
      card.append(el("p", "muted", `GM: ${quest.gmNotes}`), questEditor(quest));
    }
    grid.append(card);
  });

  root.append(grid.children.length ? grid : el("div", "empty-state", "Заданий не найдено"));
  return root;
}

function questMeta(label, value) {
  const item = el("div", "quest-meta-item");
  item.append(el("span", "", label), el("strong", "", value || "—"));
  return item;
}

function renderRoller() {
  const root = el("div");
  root.append(header("Roll", "Броски костей с выбором персонажа и журналом результатов."));

  const layout = el("div", "roller-layout");
  const panel = el("section", "panel admin-stack");
  const dice = el("div", "dice-grid");
  [4, 6, 8, 10, 12, 20, 100].forEach((sides) => {
    dice.append(button(`d${sides}`, "dice-button", () => rollFormula(`1d${sides}`)));
  });

  const formula = el("input");
  formula.id = "formulaInput";
  formula.placeholder = "1d20+5";
  const diceCount = input(1);
  const diceSides = selectInput([
    ["4", "d4"],
    ["6", "d6"],
    ["8", "d8"],
    ["10", "d10"],
    ["12", "d12"],
    ["20", "d20"],
    ["100", "d100"],
  ], "20");
  const diceModifier = input(0);
  const builder = el("div", "roll-builder");
  builder.append(
    labelWrap("Кол-во", diceCount),
    labelWrap("Кость", diceSides),
    labelWrap("Модификатор", diceModifier)
  );
  const result = el("div", "roll-result");
  const latest = state.rolls[0];
  result.append(
    latest
      ? fragment([el("span", "muted", latest.formula), el("strong", "", latest.total)])
      : el("span", "muted", "Нет бросков")
  );

  panel.append(
    el("h3", "", "Кости"),
    dice,
    el("h3", "", "Конструктор"),
    builder,
    actionRow([
      button("Бросить выбранные", "primary-button", () => {
        const mod = Number(diceModifier.value || 0);
        rollFormula(`${Number(diceCount.value || 1)}d${diceSides.value}${mod >= 0 ? `+${mod}` : mod}`);
      }),
    ]),
    labelWrap("Формула", formula),
    actionRow([
      button("Бросить", "primary-button", () => rollFormula(formula.value || "1d20")),
      button("d20 + модификатор", "ghost-button", () => {
        formula.value = "1d20+0";
        formula.focus();
      }),
    ]),
    result
  );

  const logPanel = el("aside", "panel admin-stack");
  logPanel.append(el("h3", "", "Журнал"));
  if (isAdmin) {
    logPanel.append(
      actionRow([
        button("Очистить журнал", "small-button", async () => {
          state.rolls = [];
          saveState();
          await clearCloudRolls();
          render();
        }),
      ])
    );
  }
  logPanel.append(state.rolls.length ? rollLogList(state.rolls) : el("div", "empty-state", "Журнал пуст"));

  layout.append(panel, logPanel);
  root.append(layout);
  return root;
}

function rollFormula(formula, label = "") {
  const parsed = parseRoll(formula.trim());
  if (!parsed) {
    alert("Формат: 1d20+5, 2d6, d100");
    return;
  }

  const rolls = Array.from({ length: parsed.count }, () => 1 + Math.floor(Math.random() * parsed.sides));
  const total = rolls.reduce((sum, value) => sum + value, 0) + parsed.modifier;
  const actor = state.characters.find((item) => item.id === activeCharacterId)?.name ?? "Партия";
  const timestamp = new Date().toISOString();
  const entry = {
    id: crypto.randomUUID(),
    actor,
    label,
    formula: normalizeRoll(parsed),
    rolls,
    total,
    timestamp,
    createdAt: new Date(timestamp).toLocaleString("ru-RU"),
  };
  state.rolls.unshift(entry);
  state.rolls = state.rolls.slice(0, 200);
  saveState();
  saveRollToCloud(entry);
  render();
  showRollPopup(entry);
}

function showRollPopup(log) {
  const old = document.querySelector(".roll-popup");
  if (old) {
    old.cleanupRollAnimation?.();
    old.remove();
  }
  const popup = el("div", "roll-popup");
  const parsed = parseRoll(log.formula) ?? { sides: Math.max(...log.rolls, 20), modifier: 0 };
  const animation = createRollAnimation(log, parsed);
  popup.append(
    el("p", "eyebrow", log.actor),
    el("h3", "", log.label || "Бросок"),
    animation.node,
    el("strong", "roll-popup-total", log.total),
    el("p", "muted", `${log.formula} → [${log.rolls.join(", ")}]`)
  );
  const close = button("Закрыть", "small-button", () => {
    animation.cleanup?.();
    popup.remove();
  });
  popup.append(close);
  popup.cleanupRollAnimation = animation.cleanup;
  document.body.append(popup);
  setTimeout(() => {
    animation.cleanup?.();
    popup.remove();
  }, 5600);
}

function createRollAnimation(log, parsed) {
  if (globalThis.THREE?.WebGLRenderer) return createThreeRollStage(log, parsed);
  return createSvgRollStage(log, parsed);
}

function createSvgRollStage(log, parsed) {
  const diceStage = el("div", `roll-animation-stage ${log.rolls.length > 1 ? "multi" : ""}`);
  const visibleRolls = log.rolls.slice(0, 8);
  visibleRolls.forEach((rollValue, index) => {
    const die = createRollDie(parsed.sides);
    diceStage.append(die);
    animateRollDie(die, rollValue, parsed.sides, index * 90);
  });
  if (log.rolls.length > visibleRolls.length) {
    diceStage.append(el("div", "roll-extra-dice", `+${log.rolls.length - visibleRolls.length}`));
  }
  return { node: diceStage, cleanup: () => {} };
}

function createThreeRollStage(log, parsed) {
  const THREE = globalThis.THREE;
  const stage = el("div", "roll-three-stage");
  const resultBadge = el("div", "roll-three-result", "?");
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const visibleRolls = log.rolls.slice(0, 5);
  const diceAmount = visibleRolls.length;
  const rollsSum = log.rolls.reduce((sum, value) => sum + value, 0);
  const totalLabel = parsed.modifier
    ? `Σ ${rollsSum} ${parsed.modifier > 0 ? `+${parsed.modifier}` : parsed.modifier} = ${log.total}`
    : `Σ ${rollsSum}`;
  if (diceAmount > 1) stage.classList.add("multi");
  const valuesLayer = el("div", "roll-three-values");
  const valueBadges = (diceAmount > 1 ? visibleRolls : []).map((_rollValue, index) => {
    const badge = el("span", "roll-three-die-value", "?");
    badge.style.left = `${dieBadgeLeft(index, diceAmount)}%`;
    valuesLayer.append(badge);
    return badge;
  });
  const width = diceAmount > 1 ? 380 : 300;
  const height = diceAmount > 1 ? 212 : 170;
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  stage.append(renderer.domElement, valuesLayer, resultBadge);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0, diceAmount > 1 ? 3.0 : 2.8, diceAmount > 1 ? 7.4 : 6.1);
  camera.lookAt(0, 0.25, 0);
  scene.add(new THREE.HemisphereLight(0xfff1cf, 0x1b2426, 2.1));
  const keyLight = new THREE.DirectionalLight(0xffdf96, 3.4);
  keyLight.position.set(2.2, 4.4, 3.2);
  keyLight.castShadow = true;
  scene.add(keyLight);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(diceAmount > 1 ? 4.4 : 3.2, 64),
    new THREE.ShadowMaterial({ opacity: 0.22 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.08;
  floor.receiveShadow = true;
  scene.add(floor);

  const spacing = diceAmount > 1 ? 1.8 : 0;
  const baseScale = diceAmount >= 4 ? 0.68 : diceAmount === 3 ? 0.78 : diceAmount === 2 ? 0.86 : 1;
  const groups = visibleRolls.map((rollValue, index) => {
    const group = createThreeDieGroup(parsed.sides);
    group.position.x = (index - (visibleRolls.length - 1) / 2) * spacing;
    group.position.y = 1.8 + Math.random() * 0.5;
    group.scale.setScalar(baseScale);
    group.userData = {
      finalValue: rollValue,
      baseScale,
      startRotation: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      spin: new THREE.Vector3(8 + Math.random() * 3, 10 + Math.random() * 4, 7 + Math.random() * 3),
      finalRotation: new THREE.Euler(Math.random() * 0.55, Math.random() * 0.55, Math.random() * 0.55),
      delay: index * 90,
    };
    group.rotation.copy(group.userData.startRotation);
    scene.add(group);
    return group;
  });

  let frameId = 0;
  let stopped = false;
  const duration = 1700;
  const startedAt = performance.now();
  const animate = (now) => {
    if (stopped) return;
    let allDone = true;
    groups.forEach((group) => {
      const t = Math.max(0, Math.min(1, (now - startedAt - group.userData.delay) / duration));
      if (t < 1) allDone = false;
      const eased = 1 - Math.pow(1 - t, 3);
      const bounce = Math.sin(t * Math.PI * 2.8) * (1 - eased) * 0.58;
      group.position.y = -0.2 + (1 - eased) * 2.2 + Math.max(0, bounce);
      group.position.x += Math.sin(now / 180 + group.userData.delay) * 0.0015 * (1 - eased);
      group.rotation.x = group.userData.startRotation.x + group.userData.spin.x * (1 - Math.pow(1 - t, 2)) + group.userData.finalRotation.x * eased;
      group.rotation.y = group.userData.startRotation.y + group.userData.spin.y * (1 - Math.pow(1 - t, 2)) + group.userData.finalRotation.y * eased;
      group.rotation.z = group.userData.startRotation.z + group.userData.spin.z * (1 - Math.pow(1 - t, 2)) + group.userData.finalRotation.z * eased;
      group.scale.setScalar(group.userData.baseScale * (1 + Math.sin(t * Math.PI) * 0.04));
    });
    renderer.render(scene, camera);
    if (allDone) {
      valueBadges.forEach((badge, index) => {
        badge.textContent = visibleRolls[index];
        badge.classList.add("shown");
      });
      resultBadge.textContent = visibleRolls.length === 1 ? visibleRolls[0] : totalLabel;
      resultBadge.classList.add("shown");
    }
    frameId = requestAnimationFrame(animate);
  };
  frameId = requestAnimationFrame(animate);

  return {
    node: stage,
    cleanup: () => {
      stopped = true;
      cancelAnimationFrame(frameId);
      renderer.dispose();
      stage.remove();
    },
  };
}

function dieBadgeLeft(index, count) {
  if (count <= 1) return 50;
  const spread = Math.min(78, 23 * (count - 1));
  return 50 + (index - (count - 1) / 2) * (spread / (count - 1));
}

function createThreeDieGroup(sides) {
  const THREE = globalThis.THREE;
  const group = new THREE.Group();
  const geometry = threeDiceGeometry(sides);
  const material = new THREE.MeshStandardMaterial({
    color: 0xd4a74f,
    roughness: 0.48,
    metalness: 0.18,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x5b3d16, transparent: true, opacity: 0.58 })
  );
  group.add(edges);
  return group;
}

function threeDiceGeometry(sides) {
  const THREE = globalThis.THREE;
  const value = Number(sides);
  if (value === 4) return new THREE.TetrahedronGeometry(1.05, 0);
  if (value === 6) return new THREE.BoxGeometry(1.45, 1.45, 1.45);
  if (value === 8) return new THREE.OctahedronGeometry(1.12, 0);
  if (value === 10) return bipyramidGeometry(10, 1.03, 1.45);
  if (value === 12) return new THREE.DodecahedronGeometry(1.1, 0);
  if (value === 20) return new THREE.IcosahedronGeometry(1.12, 0);
  if (value === 100) return new THREE.SphereGeometry(1.06, 18, 12);
  return new THREE.IcosahedronGeometry(1.08, 0);
}

function bipyramidGeometry(segments = 10, radius = 1, height = 1.35) {
  const THREE = globalThis.THREE;
  const vertices = [[0, height / 2, 0], [0, -height / 2, 0]];
  for (let index = 0; index < segments; index += 1) {
    const angle = (Math.PI * 2 * index) / segments;
    vertices.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
  }
  const indices = [];
  for (let index = 0; index < segments; index += 1) {
    const current = 2 + index;
    const next = 2 + ((index + 1) % segments);
    indices.push(0, current, next, 1, next, current);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices.flat(), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createRollDie(sides) {
  const visual = diceVisualClass(sides);
  const die = el("div", `roll-die ${visual}`);
  die.append(diceShapeSvg(sides), el("span", "roll-die-face", "?"), el("small", "roll-die-type", `d${sides}`));
  return die;
}

function diceVisualClass(sides) {
  if ([4, 6, 8, 10, 12, 20, 100].includes(Number(sides))) return `die-d${sides}`;
  return "die-poly";
}

function diceShapeSvg(sides) {
  const svg = svgEl("svg", { class: "roll-die-shape", viewBox: "0 0 100 100", "aria-hidden": "true", focusable: "false" });
  const body = svgEl("polygon", { class: "die-body", points: diceShapePoints(sides) });
  svg.append(body);
  const facets = diceFacetPath(sides);
  if (facets) svg.append(svgEl("path", { class: "die-facets", d: facets }));
  if (Number(sides) === 6) {
    svg.innerHTML = "";
    svg.append(svgEl("rect", { class: "die-body", x: "7", y: "7", width: "86", height: "86", rx: "15" }));
    svg.append(svgEl("path", { class: "die-facets", d: "M50 8 L50 92 M8 50 L92 50 M20 20 L80 80 M80 20 L20 80" }));
  }
  if (Number(sides) === 100) {
    svg.innerHTML = "";
    svg.append(svgEl("circle", { class: "die-body", cx: "50", cy: "50", r: "43" }));
    svg.append(svgEl("path", { class: "die-facets", d: "M50 7 C34 24 34 76 50 93 M50 7 C66 24 66 76 50 93 M7 50 H93 M18 28 C37 38 63 38 82 28 M18 72 C37 62 63 62 82 72" }));
  }
  return svg;
}

function diceShapePoints(sides) {
  const value = Number(sides);
  if (value === 4) return "50,5 94,91 6,91";
  if (value === 8) return "50,2 96,50 50,98 4,50";
  if (value === 10) return "50,2 92,27 78,94 22,94 8,27";
  if (value === 12) return "50,3 76,10 96,33 91,68 65,94 35,94 9,68 4,33 24,10";
  if (value === 20) return "50,2 76,9 96,30 96,60 78,88 50,98 22,88 4,60 4,30 24,9";
  return "50,2 82,13 98,42 89,76 62,96 38,96 11,76 2,42 18,13";
}

function diceFacetPath(sides) {
  const value = Number(sides);
  if (value === 4) return "M50 5 L50 91 M50 38 L6 91 M50 38 L94 91";
  if (value === 8) return "M50 2 L50 98 M4 50 H96 M50 2 L4 50 M50 2 L96 50 M50 98 L4 50 M50 98 L96 50";
  if (value === 10) return "M50 2 L50 94 M8 27 L92 27 M22 94 L50 45 L78 94 M8 27 L50 45 L92 27";
  if (value === 12) return "M50 3 L65 94 M50 3 L35 94 M4 33 L96 33 M9 68 L91 68 M24 10 L50 50 L76 10 M35 94 L50 50 L65 94";
  if (value === 20) return "M50 2 L50 98 M4 30 L96 60 M96 30 L4 60 M24 9 L78 88 M76 9 L22 88 M4 30 L50 46 L96 30 M4 60 L50 46 L96 60 M22 88 L50 46 L78 88";
  return "M50 2 L50 96 M2 42 L98 42 M11 76 L89 76 M18 13 L50 50 L82 13 M38 96 L50 50 L62 96";
}

function svgEl(tag, attributes = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function animateRollDie(die, finalFace, sides, delay = 0) {
  const face = die.querySelector(".roll-die-face");
  const safeSides = Math.max(2, Number(sides || 20));
  setTimeout(() => {
    die.classList.add("rolling");
    const startedAt = performance.now();
    const duration = 1180;
    let lastFaceChange = 0;
    const step = (now) => {
      if (now - lastFaceChange > 135) {
        face.textContent = 1 + Math.floor(Math.random() * safeSides);
        lastFaceChange = now;
      }
      if (now - startedAt < duration) {
        requestAnimationFrame(step);
        return;
      }
      face.textContent = finalFace;
      die.classList.remove("rolling");
      die.classList.add("landed");
    };
    requestAnimationFrame(step);
  }, delay);
}

function parseRoll(input) {
  const match = input.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!match) return null;
  const count = Math.min(Number(match[1] || 1), 50);
  const sides = Math.min(Number(match[2]), 1000);
  const modifier = Number(match[3] || 0);
  if (count < 1 || sides < 2) return null;
  return { count, sides, modifier };
}

function normalizeRoll(roll) {
  const mod = roll.modifier === 0 ? "" : roll.modifier > 0 ? `+${roll.modifier}` : `${roll.modifier}`;
  return `${roll.count}d${roll.sides}${mod}`;
}

function rollLogList(logs) {
  const list = el("div", "log-list");
  logs.forEach((log) => {
    const item = el("div", "log-item");
    item.append(
      el("strong", "", `${log.actor}${log.label ? ` · ${log.label}` : ""}: ${log.total}`),
      el("div", "muted", `${log.formula} → [${log.rolls.join(", ")}] · ${log.createdAt}`)
    );
    list.append(item);
  });
  return list;
}

function renderAdmin() {
  const root = el("div");
  root.append(header("Админ", "Вход мастера для редактирования общей базы кампании."));

  if (!isAdmin) {
    const panel = el("section", "admin-panel admin-stack");
    panel.append(
      el("h3", "", "Режим гостя"),
      el("p", "", "Игрокам вход не нужен: общая база открывается для чтения автоматически. Вход здесь нужен только мастерам для редактирования."),
      button("Войти", "primary-button", () => loginDialog.showModal())
    );
    root.append(panel);
    return root;
  }

  const stack = el("div", "admin-stack");
  const meta = el("section", "admin-panel");
  meta.append(el("h3", "", "Кампания"), campaignEditor());
  const create = el("section", "admin-panel");
  create.append(el("h3", "", "Новая wiki-запись"), wikiCreator());
  const tagsPanel = tagLibraryPanel();
  const dataPanel = el("section", "admin-panel admin-stack");
  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = "application/json,.json";
  importInput.addEventListener("change", () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        state = normalizeState(JSON.parse(String(reader.result || "{}")));
        saveState();
        renderCharacterSelect();
        render();
      } catch {
        alert("Не удалось импортировать JSON кампании.");
      }
    });
    reader.readAsText(file, "utf-8");
  });
  dataPanel.append(
    el("h3", "", "Данные"),
    el("p", "muted", "Экспортируй базу перед большими изменениями. Импорт полностью заменяет локальные данные. Облачная база Supabase является общей для всех вошедших игроков."),
    actionRow([
      button("Экспорт JSON", "ghost-button", () => exportCampaign()),
      button("Залить локальные данные в облако", "ghost-button", async () => {
        if (!confirm("Заменить общую облачную базу текущими данными из этого браузера?")) return;
        await saveCloudState();
      }),
      button("Обновить из облака", "ghost-button", () => loadCloudState()),
      button("Сбросить к демо", "ghost-button", () => {
        if (confirm("Сбросить локальные данные кампании?")) {
          state = normalizeState(structuredClone(seedData));
          saveState();
          renderCharacterSelect();
          render();
        }
      }),
      button("Выйти из аккаунта", "ghost-button", () => signOutSupabase()),
    ]),
    labelWrap("Импорт JSON", importInput)
  );
  stack.append(meta, create, tagsPanel, dataPanel);
  root.append(stack);
  return root;
}

function tagLibraryPanel() {
  registerTags(collectCampaignTags());
  const panel = el("section", "admin-panel admin-stack");
  const createForm = el("form", "search-form");
  const newTag = input("");
  newTag.placeholder = "Новый тег";
  createForm.append(newTag, button("Добавить тег", "small-button", null, "submit"));
  createForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const clean = normalizeTagName(newTag.value);
    if (!clean) return;
    registerTags([clean], true);
    newTag.value = "";
    saveState();
    render();
  });

  const grid = el("div", "tag-library-grid");
  Object.keys(state.tagMeta ?? {}).forEach((tagName) => {
    grid.append(tagMetaEditor(tagName));
  });

  panel.append(
    el("h3", "", "Справочник тегов"),
    el("p", "muted", "Эти описания показываются игрокам при наведении на тег. Картинку и текст можно менять в любой момент."),
    createForm,
    grid.children.length ? grid : el("div", "empty-state compact-empty", "Тегов пока нет.")
  );
  return panel;
}

function tagMetaEditor(tagName) {
  const meta = tagMetaByName(tagName);
  const card = el("article", "tag-library-card");
  const preview = el("div", "tag-library-preview");
  const form = el("form", "form-grid compact-form");
  const description = textarea(meta.description);
  const publicInput = document.createElement("input");
  const imageInput = document.createElement("input");
  let imageValue = meta.image;
  const imageStyle = { ...defaultImageStyle(), ...(meta.imageStyle ?? {}) };
  const aspect = selectInput([
    ["wide", "Широкий 16:9"],
    ["square", "Квадрат 1:1"],
    ["portrait", "Портрет 3:4"],
    ["banner", "Баннер 21:9"],
  ], imageStyle.aspect);
  const fit = selectInput([
    ["cover", "Обрезать по рамке"],
    ["contain", "Вписать целиком"],
  ], imageStyle.fit);
  const posX = rangeInput(imageStyle.x, 0, 100, 1);
  const posY = rangeInput(imageStyle.y, 0, 100, 1);
  const zoom = rangeInput(imageStyle.zoom, 1, 2.5, 0.05);
  const refreshPreview = () => {
    preview.innerHTML = "";
    preview.className = `tag-library-preview image-aspect-${aspect.value}`;
    if (!imageValue) {
      preview.append(el("span", "", "#"));
      return;
    }
    const img = document.createElement("img");
    img.src = imageValue;
    img.alt = tagName;
    img.style.objectFit = fit.value;
    img.style.objectPosition = `${posX.value}% ${posY.value}%`;
    img.style.transform = `scale(${zoom.value})`;
    preview.append(img);
  };
  [aspect, fit, posX, posY, zoom].forEach((control) => control.addEventListener("input", refreshPreview));
  refreshPreview();
  publicInput.type = "checkbox";
  publicInput.checked = meta.public;
  imageInput.type = "file";
  imageInput.accept = "image/png,image/jpeg,image/webp,image/gif";
  imageInput.addEventListener("change", async () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    imageValue = await imageFileToUrl(file, "tags");
    refreshPreview();
  });
  form.append(
    labelWrap("Описание", description, "span-2"),
    checkboxWrap("Видно игрокам", publicInput),
    labelWrap("Картинка", imageInput, "span-2"),
    labelWrap("Формат картинки", aspect),
    labelWrap("Отображение", fit),
    labelWrap("Позиция X", posX),
    labelWrap("Позиция Y", posY),
    labelWrap("Масштаб обрезки", zoom, "span-2"),
    actionRow([
      button("Сохранить тег", "primary-button", null, "submit"),
      button("Убрать картинку", "ghost-button", () => {
        imageValue = "";
        refreshPreview();
      }),
    ], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    state.tagMeta[tagName] = normalizeTagMetaEntry(tagName, {
      ...state.tagMeta[tagName],
      description: description.value,
      image: imageValue,
      imageStyle: {
        aspect: aspect.value,
        fit: fit.value,
        x: Number(posX.value),
        y: Number(posY.value),
        zoom: Number(zoom.value),
      },
      public: publicInput.checked,
    });
    saveState();
    render();
  });
  card.append(preview, el("h4", "", tagName), tagChip(tagName), form);
  return card;
}

function exportCampaign() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ashana-campaign-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function campaignEditor() {
  const form = el("form", "form-grid");
  const name = input(state.meta.campaignName);
  const region = input(state.meta.currentRegion);
  const year = input(state.meta.ashanaDate.year);
  const month = selectInput(monthOptions(), String(state.meta.ashanaDate.month));
  const day = input(state.meta.ashanaDate.day);
  year.type = "number";
  year.min = 1;
  day.type = "number";
  day.min = 1;
  day.max = 36;
  form.append(
    labelWrap("Название", name, "span-2"),
    labelWrap("Текущий регион", region, "span-2"),
    labelWrap("Год Асханы", year),
    labelWrap("Месяц", month),
    labelWrap("День", day),
    actionRow([button("Сохранить", "primary-button", null, "submit")], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    state.meta.campaignName = name.value;
    state.meta.currentRegion = region.value;
    setCurrentAshanaDate({ year: Number(year.value), month: Number(month.value), day: Number(day.value) });
    saveState();
    render();
  });
  return form;
}

function wikiCreator() {
  const article = { title: "", category: "Места", categoryId: "places", tags: "", body: "", gmBody: "", image: "", imageStyle: defaultImageStyle(), public: true };
  return wikiForm(article, (values) => {
    const nextTags = csv(values.tags);
    registerTags(nextTags, true);
    const article = normalizeWikiArticle({
      id: slug(values.title),
      title: values.title,
      category: values.category,
      categoryId: values.categoryId,
      tags: nextTags,
      body: values.body,
      gmBody: values.gmBody,
      image: values.image,
      imageStyle: values.imageStyle,
      public: values.public,
    });
    state.wiki.unshift(article);
    selectWikiArticle(article.id, { clearTag: true });
    saveState();
    setView("wiki");
  });
}

function wikiEditor(article) {
  const box = el("div", "admin-panel");
  const draftValues = wikiDraftValuesFor(article.id);
  const formArticle = {
    ...article,
    ...(draftValues ?? {}),
    tags: draftValues?.tags ?? article.tags.join(", "),
    category: wikiCategoryTitle(draftValues?.categoryId ?? article.categoryId),
  };
  box.append(el("h3", "", "Редактирование"), wikiForm(
    formArticle,
    (values) => {
      const nextTags = csv(values.tags);
      registerTags(nextTags, true);
      Object.assign(article, {
        title: values.title,
        category: values.category,
        categoryId: values.categoryId,
        tags: nextTags,
        body: values.body,
        gmBody: values.gmBody,
        image: values.image,
        imageStyle: values.imageStyle,
        public: values.public,
      });
      clearWikiDraft(article.id);
      saveState();
      render();
    },
    { draftArticleId: article.id, baseSnapshot: wikiFormSnapshotFromArticle(article) }
  ));
  box.append(actionRow([
    button("Удалить статью", "ghost-button", () => {
      if (!confirm(`Удалить статью "${article.title}"?`)) return;
      clearWikiDraft(article.id);
      state.wiki = state.wiki.filter((item) => item.id !== article.id);
      activeWikiId = WIKI_INDEX_ID;
      saveState();
      render();
    }),
  ]));
  return box;
}

function wikiForm(article, onSubmit, options = {}) {
  const form = el("form", "form-grid");
  const title = input(article.title);
  const category = document.createElement("select");
  wikiCategories.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.title;
    option.selected = (article.categoryId || categoryAliases[article.category]) === item.id;
    category.append(option);
  });
  const tagsInput = input(article.tags);
  const publicInput = document.createElement("input");
  publicInput.type = "checkbox";
  publicInput.checked = article.public;
  const body = textarea(article.body);
  const gmBody = textarea(article.gmBody);
  let imageValue = article.image || "";
  const imageStyle = { ...defaultImageStyle(), ...(article.imageStyle ?? {}) };
  const imageInput = document.createElement("input");
  imageInput.type = "file";
  imageInput.accept = "image/png,image/jpeg,image/webp,image/gif";
  const imagePreview = el("div", "upload-preview");
  const previewImg = document.createElement("img");
  imagePreview.append(previewImg);
  const aspect = selectInput([
    ["wide", "Широкая 16:9"],
    ["square", "Квадрат 1:1"],
    ["portrait", "Портрет 3:4"],
    ["banner", "Баннер 21:9"],
  ], imageStyle.aspect);
  const fit = selectInput([
    ["cover", "Обрезать по рамке"],
    ["contain", "Вписать целиком"],
  ], imageStyle.fit);
  const posX = rangeInput(imageStyle.x, 0, 100, 1);
  const posY = rangeInput(imageStyle.y, 0, 100, 1);
  const zoom = rangeInput(imageStyle.zoom, 1, 2.5, 0.05);
  function updateImagePreview() {
    previewImg.src = imageValue || "";
    imagePreview.className = `upload-preview image-aspect-${aspect.value}`;
    previewImg.style.objectFit = fit.value;
    previewImg.style.objectPosition = `${posX.value}% ${posY.value}%`;
    previewImg.style.transform = `scale(${zoom.value})`;
  }
  [aspect, fit, posX, posY, zoom].forEach((control) => control.addEventListener("input", updateImagePreview));
  updateImagePreview();
  const baseSnapshot = options.baseSnapshot ?? wikiFormSnapshotFromArticle(article);
  function currentWikiFormSnapshot() {
    return {
      title: title.value,
      categoryId: category.value,
      tags: tagsInput.value,
      public: publicInput.checked,
      body: body.value,
      gmBody: gmBody.value,
      image: imageValue,
      imageStyle: {
        aspect: aspect.value,
        fit: fit.value,
        x: Number(posX.value),
        y: Number(posY.value),
        zoom: Number(zoom.value),
      },
    };
  }
  function updateWikiDraft() {
    if (!options.draftArticleId) return;
    rememberWikiDraft(options.draftArticleId, baseSnapshot, currentWikiFormSnapshot());
  }
  form.addEventListener("input", updateWikiDraft);
  form.addEventListener("change", updateWikiDraft);
  imageInput.addEventListener("change", async () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    imageValue = await imageFileToUrl(file, "wiki");
    updateImagePreview();
    updateWikiDraft();
  });

  form.append(
    labelWrap("Заголовок", title),
    labelWrap("Категория", category),
    labelWrap("Теги", tagsInput),
    checkboxWrap("Видно игрокам", publicInput),
    labelWrap("Картинка", fragment([imageInput, imagePreview]), "span-2"),
    labelWrap("Формат картинки", aspect),
    labelWrap("Отображение", fit),
    labelWrap("Позиция X", posX),
    labelWrap("Позиция Y", posY),
    labelWrap("Масштаб обрезки", zoom),
    labelWrap("Текст для игроков", body, "span-2"),
    labelWrap("Скрытый GM-текст", gmBody, "span-2"),
    actionRow([button("Сохранить", "primary-button", null, "submit")], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const categoryId = category.value;
    onSubmit({
      title: title.value.trim() || "Новая запись",
      category: wikiCategoryTitle(categoryId),
      categoryId,
      tags: tagsInput.value,
      body: body.value.trim(),
      gmBody: gmBody.value.trim(),
      image: imageValue,
      imageStyle: {
        aspect: aspect.value,
        fit: fit.value,
        x: Number(posX.value),
        y: Number(posY.value),
        zoom: Number(zoom.value),
      },
      public: publicInput.checked,
    });
  });
  return form;
}

function markerEditor(marker) {
  if (!marker) return "";
  const form = el("form", "form-grid");
  const name = input(marker.name);
  const type = input(marker.type);
  const x = input(marker.x);
  const y = input(marker.y);
  const note = textarea(marker.note);
  form.append(
    labelWrap("Название", name),
    labelWrap("Тип", type),
    labelWrap("X %", x),
    labelWrap("Y %", y),
    labelWrap("Заметка", note, "span-2"),
    actionRow([
      button("Сохранить", "primary-button", null, "submit"),
      button("Удалить", "ghost-button", () => {
        if (!confirm(`Удалить метку "${marker.name}"?`)) return;
        state.map.markers = state.map.markers.filter((item) => item.id !== marker.id);
        state.map.selectedMarker = state.map.markers[0]?.id ?? "";
        saveState();
        render();
      }),
    ], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    Object.assign(marker, {
      name: name.value,
      type: type.value,
      x: Number(x.value),
      y: Number(y.value),
      note: note.value,
    });
    saveState();
    render();
  });
  return form;
}

function characterTabEditor(character) {
  const editors = {
    summary: characterSummaryEditor,
    stats: characterStatsEditor,
    combat: characterCombatEditor,
    skills: characterSkillsEditor,
    features: characterFeaturesEditor,
    magic: characterMagicEditor,
    inventory: characterInventoryEditor,
    notes: characterNotesEditor,
  };
  return editors[activeCharacterTab]?.(character) ?? "";
}

function editorPanel(title, form) {
  const panel = el("section", "panel admin-stack tab-editor-panel");
  panel.append(el("h3", "", title), form);
  return panel;
}

function saveCharacter(character) {
  Object.assign(character, normalizeCharacter(character));
  saveState();
  renderCharacterSelect();
  render();
}

function characterSummaryEditor(character) {
  const form = el("form", "character-edit-form");
  const fields = {
    name: input(character.name),
    player: input(character.player),
    className: input(character.className),
    ancestry: input(character.ancestry),
    homeland: input(character.homeland),
    size: input(character.size),
    gender: input(character.gender),
    alignment: input(character.alignment),
    deity: input(character.deity),
    level: input(character.level),
    languages: textarea(character.languages),
  };
  const portraitInput = document.createElement("input");
  portraitInput.type = "file";
  portraitInput.accept = "image/png,image/jpeg,image/webp,image/gif";
  portraitInput.addEventListener("change", async () => {
    const file = portraitInput.files?.[0];
    if (!file) return;
    character.portrait = await imageFileToUrl(file, "characters");
    saveCharacter(character);
  });
  form.append(
    labelWrap("Имя", fields.name),
    labelWrap("Игрок", fields.player),
    labelWrap("Класс", fields.className),
    labelWrap("Раса", fields.ancestry),
    labelWrap("Родина", fields.homeland),
    labelWrap("Размер", fields.size),
    labelWrap("Пол", fields.gender),
    labelWrap("Мировоззрение", fields.alignment),
    labelWrap("Божество", fields.deity),
    labelWrap("Уровень", fields.level),
    labelWrap("Языки", fields.languages, "span-2"),
    labelWrap("Портрет", portraitInput, "span-2"),
    actionRow([button("Сохранить общее", "primary-button", null, "submit")], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    Object.assign(character, {
      name: fields.name.value,
      player: fields.player.value,
      className: fields.className.value,
      ancestry: fields.ancestry.value,
      homeland: fields.homeland.value,
      size: fields.size.value,
      gender: fields.gender.value,
      alignment: fields.alignment.value,
      deity: fields.deity.value,
      level: Number(fields.level.value || 1),
      languages: fields.languages.value,
    });
    saveCharacter(character);
  });
  return editorPanel("Редактор вкладки: общее", form);
}

function characterStatsEditor(character) {
  const form = el("form", "character-edit-form");
  const statInputs = {};
  Object.entries(character.stats).forEach(([key, value]) => {
    statInputs[key] = input(value);
  });
  const saveInputs = {};
  Object.entries(character.saves).forEach(([key, value]) => {
    saveInputs[key] = input(value);
  });
  const initiative = input(character.initiative);
  form.append(
    el("h3", "span-2", "Характеристики"),
    ...Object.entries(statInputs).map(([key, control]) => labelWrap(key.toUpperCase(), control)),
    el("h3", "span-2", "Спасброски"),
    ...Object.entries(saveInputs).map(([key, control]) => labelWrap(key, control)),
    labelWrap("Инициатива", initiative),
    actionRow([button("Сохранить характеристики", "primary-button", null, "submit")], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    Object.entries(statInputs).forEach(([key, control]) => {
      character.stats[key] = Number(control.value || 0);
    });
    Object.entries(saveInputs).forEach(([key, control]) => {
      character.saves[key] = Number(control.value || 0);
    });
    character.initiative = Number(initiative.value || 0);
    saveCharacter(character);
  });
  return editorPanel("Редактор вкладки: характеристики", form);
}

function characterCombatEditor(character) {
  const form = el("form", "character-edit-form");
  const fields = {
    hp: input(character.hp),
    ac: input(character.ac),
    touchAc: input(character.touchAc),
    flatFootedAc: input(character.flatFootedAc),
    bab: input(character.bab),
    cmb: input(character.cmb),
    cmd: input(character.cmd),
    speed: input(character.speed),
    attacks: textarea(JSON.stringify(character.attacks, null, 2)),
    armor: textarea(JSON.stringify(character.armor, null, 2)),
  };
  fields.attacks.classList.add("json-editor", "compact-json");
  fields.armor.classList.add("json-editor", "compact-json");
  form.append(
    labelWrap("HP", fields.hp),
    labelWrap("AC", fields.ac),
    labelWrap("Касание", fields.touchAc),
    labelWrap("Врасплох", fields.flatFootedAc),
    labelWrap("BAB", fields.bab),
    labelWrap("CMB", fields.cmb),
    labelWrap("CMD", fields.cmd),
    labelWrap("Скорость", fields.speed),
    labelWrap("Атаки JSON", fields.attacks, "span-2"),
    labelWrap("Броня JSON", fields.armor, "span-2"),
    actionRow([button("Сохранить бой", "primary-button", null, "submit")], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let attacks;
    let armor;
    try {
      attacks = JSON.parse(fields.attacks.value || "[]");
      armor = JSON.parse(fields.armor.value || "[]");
      if (!Array.isArray(attacks) || !Array.isArray(armor)) throw new Error();
    } catch {
      alert("Бой не сохранен: атаки и броня должны быть JSON-массивами.");
      return;
    }
    Object.assign(character, {
      hp: fields.hp.value,
      ac: Number(fields.ac.value || 0),
      touchAc: Number(fields.touchAc.value || 0),
      flatFootedAc: Number(fields.flatFootedAc.value || 0),
      bab: Number(fields.bab.value || 0),
      cmb: Number(fields.cmb.value || 0),
      cmd: Number(fields.cmd.value || 0),
      speed: Number(fields.speed.value || 0),
      attacks,
      armor,
    });
    saveCharacter(character);
  });
  return editorPanel("Редактор вкладки: бой", form);
}

function characterSkillsEditor(character) {
  const form = el("form", "character-edit-form");
  const skillEditor = el("div", "skill-edit-table");
  ["Навык", "Уточнение", "Хар.", "Ранги", "Класс", "Проч.", "Штраф", "Итог"].forEach((heading) => {
    skillEditor.append(el("strong", "table-head", heading));
  });
  const skillInputs = character.skills.map((skill) => {
    const row = {
      specialty: input(skill.specialty ?? ""),
      ranks: input(skill.ranks),
      classSkill: document.createElement("input"),
      misc: input(skill.misc),
      armorPenalty: input(skill.armorPenalty),
      total: input(skill.total),
    };
    row.classSkill.type = "checkbox";
    row.classSkill.checked = Boolean(skill.classSkill);
    skillEditor.append(
      el("span", "skill-name-cell", skill.name),
      row.specialty,
      el("span", "", skill.ability),
      row.ranks,
      row.classSkill,
      row.misc,
      row.armorPenalty,
      row.total
    );
    return row;
  });
  form.append(
    labelWrap("Ранги и итоги навыков", skillEditor, "span-2"),
    actionRow([button("Сохранить навыки", "primary-button", null, "submit")], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    character.skills.forEach((skill, index) => {
      const row = skillInputs[index];
      skill.specialty = row.specialty.value.trim();
      skill.ranks = Number(row.ranks.value || 0);
      skill.classSkill = row.classSkill.checked;
      skill.misc = Number(row.misc.value || 0);
      skill.armorPenalty = Number(row.armorPenalty.value || 0);
      skill.total = Number(row.total.value || 0);
    });
    saveCharacter(character);
  });
  return editorPanel("Редактор вкладки: навыки", form);
}

function characterFeaturesEditor(character) {
  const form = el("form", "character-edit-form");
  const feats = textarea(character.feats.join("\n"));
  const features = textarea(character.features.join("\n"));
  form.append(
    labelWrap("Черты, по одной на строку", feats, "span-2"),
    labelWrap("Классовые особенности, по одной на строку", features, "span-2"),
    actionRow([button("Сохранить черты", "primary-button", null, "submit")], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    character.feats = lineItems(feats.value);
    character.features = lineItems(features.value);
    saveCharacter(character);
  });
  return editorPanel("Редактор вкладки: черты", form);
}

function characterMagicEditor(character) {
  return jsonArrayTabEditor(character, "spells", "Редактор вкладки: магия", "Заклинания JSON", "Сохранить магию");
}

function characterInventoryEditor(character) {
  return jsonArrayTabEditor(character, "inventory", "Редактор вкладки: инвентарь", "Инвентарь JSON", "Сохранить инвентарь");
}

function characterNotesEditor(character) {
  const root = el("div", "admin-stack");
  const form = el("form", "character-edit-form");
  const notes = textarea(character.notes);
  const gmNotes = textarea(character.gmNotes);
  form.append(
    labelWrap("Заметки игрока", notes, "span-2"),
    labelWrap("GM-заметки", gmNotes, "span-2"),
    actionRow([button("Сохранить заметки", "primary-button", null, "submit")], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    character.notes = notes.value;
    character.gmNotes = gmNotes.value;
    saveCharacter(character);
  });
  root.append(editorPanel("Редактор вкладки: заметки", form), characterAdvancedEditor(character));
  return root;
}

function jsonArrayTabEditor(character, key, title, label, saveLabel) {
  const form = el("form", "character-edit-form");
  const json = textarea(JSON.stringify(character[key], null, 2));
  json.classList.add("json-editor", "compact-json");
  form.append(labelWrap(label, json, "span-2"), actionRow([button(saveLabel, "primary-button", null, "submit")], "span-2"));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let parsed;
    try {
      parsed = JSON.parse(json.value || "[]");
      if (!Array.isArray(parsed)) throw new Error();
    } catch {
      alert(`${label} не сохранен: нужен JSON-массив.`);
      return;
    }
    character[key] = parsed;
    saveCharacter(character);
  });
  return editorPanel(title, form);
}

function characterAdvancedEditor(character) {
  const jsonPanel = el("details", "json-details");
  const summary = el("summary", "", "Расширенный JSON-редактор персонажа");
  const json = textarea(JSON.stringify(character, null, 2));
  json.classList.add("json-editor");
  const jsonForm = el("form", "admin-stack");
  jsonForm.append(
    el("p", "muted", "Для редких полей и полного контроля мастера. Этот блок специально спрятан в заметках, чтобы не мешать обычному редактированию вкладок."),
    labelWrap("JSON персонажа", json),
    actionRow([
      button("Сохранить JSON", "primary-button", null, "submit"),
      button("Удалить персонажа", "ghost-button", () => {
        if (!confirm(`Удалить персонажа ${character.name}?`)) return;
        state.characters = state.characters.filter((item) => item.id !== character.id);
        activeCharacterId = state.characters[0]?.id ?? null;
        saveState();
        renderCharacterSelect();
        render();
      }),
    ])
  );
  jsonForm.addEventListener("submit", (event) => {
    event.preventDefault();
    let parsed;
    try {
      parsed = normalizeCharacter(JSON.parse(json.value));
    } catch {
      alert("JSON не сохранен: проверь запятые, кавычки и скобки.");
      return;
    }
    Object.assign(character, parsed);
    saveCharacter(character);
  });
  jsonPanel.append(summary, jsonForm);
  return jsonPanel;
}

function lineItems(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function characterEditor(character) {
  const root = el("div", "admin-stack");
  const form = el("form", "character-edit-form");
  const fields = {
    name: input(character.name),
    player: input(character.player),
    className: input(character.className),
    ancestry: input(character.ancestry),
    level: input(character.level),
    hp: input(character.hp),
    ac: input(character.ac),
    touchAc: input(character.touchAc),
    flatFootedAc: input(character.flatFootedAc),
    initiative: input(character.initiative),
    speed: input(character.speed),
    languages: textarea(character.languages),
    notes: textarea(character.notes),
    gmNotes: textarea(character.gmNotes),
  };
  const statInputs = {};
  Object.entries(character.stats).forEach(([key, value]) => {
    statInputs[key] = input(value);
  });
  const saveInputs = {};
  Object.entries(character.saves).forEach(([key, value]) => {
    saveInputs[key] = input(value);
  });

  const skillEditor = el("div", "skill-edit-table");
  ["Навык", "Уточнение", "Хар.", "Ранги", "Класс", "Проч.", "Штраф", "Итог"].forEach((heading) => {
    skillEditor.append(el("strong", "table-head", heading));
  });
  const skillInputs = character.skills.map((skill) => {
    const row = {
      specialty: input(skill.specialty ?? ""),
      ranks: input(skill.ranks),
      classSkill: document.createElement("input"),
      misc: input(skill.misc),
      armorPenalty: input(skill.armorPenalty),
      total: input(skill.total),
    };
    row.classSkill.type = "checkbox";
    row.classSkill.checked = Boolean(skill.classSkill);
    skillEditor.append(
      el("span", "skill-name-cell", skill.name),
      row.specialty,
      el("span", "", skill.ability),
      row.ranks,
      row.classSkill,
      row.misc,
      row.armorPenalty,
      row.total
    );
    return row;
  });

  form.append(
    el("h3", "", "Редактор персонажа"),
    labelWrap("Имя", fields.name),
    labelWrap("Игрок", fields.player),
    labelWrap("Класс", fields.className),
    labelWrap("Раса", fields.ancestry),
    labelWrap("Уровень", fields.level),
    labelWrap("HP", fields.hp),
    labelWrap("AC", fields.ac),
    labelWrap("Касание", fields.touchAc),
    labelWrap("Врасплох", fields.flatFootedAc),
    labelWrap("Инициатива", fields.initiative),
    labelWrap("Скорость", fields.speed),
    el("h3", "span-2", "Характеристики"),
    ...Object.entries(statInputs).map(([key, control]) => labelWrap(key.toUpperCase(), control)),
    el("h3", "span-2", "Спасброски"),
    ...Object.entries(saveInputs).map(([key, control]) => labelWrap(key, control)),
    labelWrap("Языки", fields.languages, "span-2"),
    labelWrap("Заметки", fields.notes, "span-2"),
    labelWrap("GM-заметки", fields.gmNotes, "span-2"),
    el("h3", "span-2", "Навыки"),
    labelWrap("Ранги и итоги навыков", skillEditor, "span-2"),
    actionRow([button("Сохранить персонажа", "primary-button", null, "submit")], "span-2")
  );

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    Object.assign(character, {
      name: fields.name.value,
      player: fields.player.value,
      className: fields.className.value,
      ancestry: fields.ancestry.value,
      level: Number(fields.level.value),
      hp: fields.hp.value,
      ac: Number(fields.ac.value),
      touchAc: Number(fields.touchAc.value),
      flatFootedAc: Number(fields.flatFootedAc.value),
      initiative: Number(fields.initiative.value),
      speed: Number(fields.speed.value),
      languages: fields.languages.value,
      notes: fields.notes.value,
      gmNotes: fields.gmNotes.value,
    });
    Object.entries(statInputs).forEach(([key, control]) => {
      character.stats[key] = Number(control.value);
    });
    Object.entries(saveInputs).forEach(([key, control]) => {
      character.saves[key] = Number(control.value);
    });
    character.skills.forEach((skill, index) => {
      const row = skillInputs[index];
      skill.specialty = row.specialty.value.trim();
      skill.ranks = Number(row.ranks.value || 0);
      skill.classSkill = row.classSkill.checked;
      skill.misc = Number(row.misc.value || 0);
      skill.armorPenalty = Number(row.armorPenalty.value || 0);
      skill.total = Number(row.total.value || 0);
    });
    saveState();
    renderCharacterSelect();
    render();
  });

  const jsonPanel = el("details", "json-details");
  const summary = el("summary", "", "Расширенный JSON-редактор");
  const json = textarea(JSON.stringify(character, null, 2));
  json.classList.add("json-editor");
  const jsonForm = el("form", "admin-stack");
  const portraitInput = document.createElement("input");
  portraitInput.type = "file";
  portraitInput.accept = "image/png,image/jpeg,image/webp,image/gif";
  portraitInput.addEventListener("change", async () => {
    const file = portraitInput.files?.[0];
    if (!file) return;
    character.portrait = await imageFileToUrl(file, "characters");
    json.value = JSON.stringify(character, null, 2);
    saveState();
    render();
  });
  jsonForm.append(
    el("p", "muted", "Для редких полей: атаки, магия, инвентарь, черты, портрет и любые дополнительные данные."),
    labelWrap("Портрет", portraitInput),
    labelWrap("JSON персонажа", json),
    actionRow([
      button("Сохранить JSON", "primary-button", null, "submit"),
      button("Удалить персонажа", "ghost-button", () => {
        if (!confirm(`Удалить персонажа ${character.name}?`)) return;
        state.characters = state.characters.filter((item) => item.id !== character.id);
        activeCharacterId = state.characters[0]?.id ?? null;
        saveState();
        renderCharacterSelect();
        render();
      }),
    ])
  );
  jsonForm.addEventListener("submit", (event) => {
    event.preventDefault();
    let parsed;
    try {
      parsed = normalizeCharacter(JSON.parse(json.value));
    } catch {
      alert("JSON не сохранен: проверь запятые, кавычки и скобки.");
      return;
    }
    Object.assign(character, parsed);
    saveState();
    renderCharacterSelect();
    render();
  });
  jsonPanel.append(summary, jsonForm);
  root.append(form, jsonPanel);
  return root;
}

function questEditor(quest) {
  const form = el("form", "form-grid");
  const title = input(quest.title);
  const patron = input(quest.patron);
  const reward = input(quest.reward);
  const linked = input(quest.linked);
  const notes = textarea(quest.notes);
  const gmNotes = textarea(quest.gmNotes);
  const status = document.createElement("select");
  ["active", "done", "hidden"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = questStatus(value);
    option.selected = quest.status === value;
    status.append(option);
  });

  form.append(
    labelWrap("Название", title),
    labelWrap("Статус", status),
    labelWrap("Заказчик", patron),
    labelWrap("Награда", reward),
    labelWrap("Связь", linked, "span-2"),
    labelWrap("Описание", notes, "span-2"),
    labelWrap("GM", gmNotes, "span-2"),
    actionRow([
      button("Сохранить", "primary-button", null, "submit"),
      button("Удалить", "ghost-button", () => {
        if (!confirm(`Удалить задание "${quest.title}"?`)) return;
        state.quests = state.quests.filter((item) => item.id !== quest.id);
        saveState();
        render();
      }),
    ], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    quest.title = title.value;
    quest.status = status.value;
    quest.patron = patron.value;
    quest.reward = reward.value;
    quest.linked = linked.value;
    quest.notes = notes.value;
    quest.gmNotes = gmNotes.value;
    saveState();
    render();
  });
  return form;
}

function renderMinigame() {
  const root = el("div");
  root.append(header("Еретик бежит", "Мини-аркада на пару минут: собери реликвии, не врежься в костры и не дай инквизитору догнать тебя."));

  const shell = el("section", "panel minigame-panel");
  const top = el("div", "minigame-top");
  const score = el("div", "minigame-stat");
  const status = el("div", "minigame-status", "WASD / стрелки - движение. Пробел - рывок.");
  const restart = button("Начать заново", "primary-button", () => {
    if (activeMinigameCleanup) activeMinigameCleanup();
    activeMinigameCleanup = startHereticRun(canvas, score, status);
  });
  top.append(score, status, restart);

  const canvasWrap = el("div", "minigame-canvas-wrap");
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 520;
  canvas.setAttribute("aria-label", "Мини-игра Еретик бежит");
  canvasWrap.append(canvas);

  const controls = el("div", "minigame-controls");
  [
    ["up", "↑"],
    ["left", "←"],
    ["dash", "рывок"],
    ["right", "→"],
    ["down", "↓"],
  ].forEach(([key, label]) => {
    const control = button(label, `small-button minigame-control ${key === "dash" ? "dash" : ""}`, null);
    control.addEventListener("pointerdown", () => minigameTouchKeys.add(key));
    control.addEventListener("pointerup", () => minigameTouchKeys.delete(key));
    control.addEventListener("pointerleave", () => minigameTouchKeys.delete(key));
    controls.append(control);
  });

  shell.append(top, canvasWrap, controls);
  root.append(shell);
  activeMinigameCleanup = startHereticRun(canvas, score, status);
  return root;
}

const minigameTouchKeys = new Set();

function startHereticRun(canvas, scoreNode, statusNode) {
  const ctx = canvas.getContext("2d");
  const keys = new Set();
  const world = { w: canvas.width, h: canvas.height };
  const game = {
    running: true,
    frameId: 0,
    last: performance.now(),
    score: 0,
    relics: 0,
    dashReady: 0,
    time: 0,
    message: "Беги, пока инквизитор не достал протокол.",
    player: { x: 160, y: 260, r: 16 },
    hunter: { x: 760, y: 260, r: 21, speed: 108 },
    relic: randomRelic(world),
    obstacles: [
      { x: 350, y: 145, r: 32 },
      { x: 520, y: 355, r: 38 },
      { x: 690, y: 170, r: 30 },
      { x: 240, y: 405, r: 28 },
    ],
    embers: Array.from({ length: 34 }, () => ({ x: Math.random() * world.w, y: Math.random() * world.h, s: 0.5 + Math.random() * 1.8, a: Math.random() * Math.PI * 2 })),
  };

  const down = (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar"].includes(event.key)) event.preventDefault();
    keys.add(event.key.toLowerCase());
  };
  const up = (event) => keys.delete(event.key.toLowerCase());
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);

  const loop = (now) => {
    const dt = Math.min(0.033, (now - game.last) / 1000);
    game.last = now;
    updateHereticRun(game, keys, world, dt, scoreNode, statusNode);
    drawHereticRun(ctx, game, world);
    game.frameId = requestAnimationFrame(loop);
  };

  updateMinigameHud(scoreNode, statusNode, game);
  game.frameId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(game.frameId);
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    minigameTouchKeys.clear();
  };
}

function updateHereticRun(game, keys, world, dt, scoreNode, statusNode) {
  if (!game.running) {
    updateMinigameHud(scoreNode, statusNode, game);
    return;
  }
  game.time += dt;
  game.score += dt * 10;
  game.dashReady = Math.max(0, game.dashReady - dt);

  const player = game.player;
  const input = {
    x: Number(keys.has("d") || keys.has("arrowright") || minigameTouchKeys.has("right")) - Number(keys.has("a") || keys.has("arrowleft") || minigameTouchKeys.has("left")),
    y: Number(keys.has("s") || keys.has("arrowdown") || minigameTouchKeys.has("down")) - Number(keys.has("w") || keys.has("arrowup") || minigameTouchKeys.has("up")),
  };
  const length = Math.hypot(input.x, input.y) || 1;
  const dash = (keys.has(" ") || minigameTouchKeys.has("dash")) && game.dashReady <= 0;
  const speed = dash ? 430 : 215;
  if (dash) {
    game.dashReady = 1.4;
    game.message = "Рывок! Бумаги инквизитора разлетелись.";
  }
  player.x += (input.x / length) * speed * dt;
  player.y += (input.y / length) * speed * dt;
  player.x = clamp(player.x, 24, world.w - 24);
  player.y = clamp(player.y, 24, world.h - 24);

  game.obstacles.forEach((obstacle) => {
    const distance = Math.hypot(player.x - obstacle.x, player.y - obstacle.y);
    const minDistance = player.r + obstacle.r;
    if (distance < minDistance) {
      const nx = (player.x - obstacle.x) / (distance || 1);
      const ny = (player.y - obstacle.y) / (distance || 1);
      player.x = obstacle.x + nx * minDistance;
      player.y = obstacle.y + ny * minDistance;
      game.score = Math.max(0, game.score - 18 * dt);
    }
  });

  const hunter = game.hunter;
  const chaseX = player.x - hunter.x;
  const chaseY = player.y - hunter.y;
  const chaseDistance = Math.hypot(chaseX, chaseY) || 1;
  const hunterSpeed = game.hunter.speed + game.time * 2.2 + game.relics * 8;
  hunter.x += (chaseX / chaseDistance) * hunterSpeed * dt;
  hunter.y += (chaseY / chaseDistance) * hunterSpeed * dt;

  if (Math.hypot(player.x - game.relic.x, player.y - game.relic.y) < player.r + game.relic.r) {
    game.relics += 1;
    game.score += 75;
    game.message = "Реликвия спасена. Это точно не улика.";
    game.relic = randomRelic(world, game.obstacles);
  }

  if (Math.hypot(player.x - hunter.x, player.y - hunter.y) < player.r + hunter.r) {
    game.running = false;
    game.message = `Инквизитор догнал еретика. Счет: ${Math.floor(game.score)}.`;
  }
  updateMinigameHud(scoreNode, statusNode, game);
}

function drawHereticRun(ctx, game, world) {
  ctx.clearRect(0, 0, world.w, world.h);
  const gradient = ctx.createLinearGradient(0, 0, world.w, world.h);
  gradient.addColorStop(0, "#101719");
  gradient.addColorStop(0.58, "#1d2524");
  gradient.addColorStop(1, "#2b2118");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, world.w, world.h);

  ctx.strokeStyle = "rgba(212, 167, 79, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < world.w; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 90, world.h);
    ctx.stroke();
  }

  game.embers.forEach((ember) => {
    ember.a += 0.018;
    ctx.fillStyle = `rgba(212, 167, 79, ${0.18 + Math.sin(ember.a) * 0.08})`;
    ctx.beginPath();
    ctx.arc(ember.x, ember.y + Math.sin(ember.a) * 8, ember.s, 0, Math.PI * 2);
    ctx.fill();
  });

  game.obstacles.forEach((obstacle) => drawPyre(ctx, obstacle));
  drawRelic(ctx, game.relic, game.time);
  drawInquisitor(ctx, game.hunter, game.time);
  drawHeretic(ctx, game.player, game.time);

  if (!game.running) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.54)";
    ctx.fillRect(0, 0, world.w, world.h);
    ctx.fillStyle = "#f2e5c9";
    ctx.font = "800 42px Inter, Arial";
    ctx.textAlign = "center";
    ctx.fillText("Ересь пресечена", world.w / 2, world.h / 2 - 12);
    ctx.fillStyle = "#d4a74f";
    ctx.font = "700 22px Inter, Arial";
    ctx.fillText(`Счет: ${Math.floor(game.score)} · Реликвии: ${game.relics}`, world.w / 2, world.h / 2 + 30);
  }
}

function drawHeretic(ctx, hero, time) {
  ctx.save();
  ctx.translate(hero.x, hero.y + Math.sin(time * 10) * 2);
  ctx.fillStyle = "#161b1d";
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.quadraticCurveTo(20, -10, 18, 18);
  ctx.quadraticCurveTo(0, 30, -18, 18);
  ctx.quadraticCurveTo(-20, -10, 0, -24);
  ctx.fill();
  ctx.fillStyle = "#d4a74f";
  ctx.beginPath();
  ctx.arc(0, -8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#4da9a7";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-14, 19);
  ctx.lineTo(-23, 31);
  ctx.moveTo(14, 19);
  ctx.lineTo(23, 31);
  ctx.stroke();
  ctx.restore();
}

function drawInquisitor(ctx, hunter, time) {
  ctx.save();
  ctx.translate(hunter.x, hunter.y + Math.sin(time * 8) * 1.5);
  ctx.fillStyle = "#efe3c7";
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(24, 22);
  ctx.lineTo(-24, 22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#8c2f28";
  ctx.fillRect(-16, 4, 32, 7);
  ctx.strokeStyle = "#d4a74f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-20, -22);
  ctx.lineTo(20, 22);
  ctx.moveTo(20, -22);
  ctx.lineTo(-20, 22);
  ctx.stroke();
  ctx.restore();
}

function drawRelic(ctx, relic, time) {
  ctx.save();
  ctx.translate(relic.x, relic.y);
  ctx.rotate(time * 1.5);
  ctx.fillStyle = "rgba(77, 169, 167, 0.25)";
  ctx.beginPath();
  ctx.arc(0, 0, 28 + Math.sin(time * 5) * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4da9a7";
  ctx.fillRect(-10, -10, 20, 20);
  ctx.fillStyle = "#f2e5c9";
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
}

function drawPyre(ctx, obstacle) {
  ctx.save();
  ctx.translate(obstacle.x, obstacle.y);
  ctx.fillStyle = "rgba(154, 71, 43, 0.26)";
  ctx.beginPath();
  ctx.arc(0, 0, obstacle.r + 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a3424";
  ctx.beginPath();
  ctx.arc(0, 0, obstacle.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d4a74f";
  ctx.beginPath();
  ctx.moveTo(0, -obstacle.r + 7);
  ctx.quadraticCurveTo(15, -4, 0, obstacle.r - 8);
  ctx.quadraticCurveTo(-16, 0, 0, -obstacle.r + 7);
  ctx.fill();
  ctx.restore();
}

function randomRelic(world, obstacles = []) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const relic = { x: 70 + Math.random() * (world.w - 140), y: 70 + Math.random() * (world.h - 140), r: 16 };
    if (obstacles.every((item) => Math.hypot(relic.x - item.x, relic.y - item.y) > relic.r + item.r + 30)) return relic;
  }
  return { x: world.w / 2, y: world.h / 2, r: 16 };
}

function updateMinigameHud(scoreNode, statusNode, game) {
  if (!scoreNode || !statusNode) return;
  scoreNode.innerHTML = "";
  scoreNode.append(
    el("strong", "", Math.floor(game.score)),
    el("span", "", `реликвии: ${game.relics} · рывок: ${game.dashReady <= 0 ? "готов" : game.dashReady.toFixed(1)}`)
  );
  statusNode.textContent = game.message;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function galleryEditor(item) {
  const form = el("form", "form-grid");
  const title = input(item.title);
  const type = input(item.type);
  const linked = input(item.linked);
  const tagsInput = input((item.tags ?? []).join(", "));
  const palette = input(item.palette.join(", "));
  const imageStyle = { ...defaultImageStyle(), ...(item.imageStyle ?? {}) };
  const imageInput = document.createElement("input");
  imageInput.type = "file";
  imageInput.accept = "image/png,image/jpeg,image/webp,image/gif";
  let imageValue = item.image || "";
  const preview = el("div", "upload-preview");
  const previewImage = document.createElement("img");
  const previewText = el("span", "muted", "Картинка не загружена");
  preview.append(previewImage, previewText);
  const aspect = selectInput([
    ["wide", "Широкая 16:9"],
    ["square", "Квадрат 1:1"],
    ["portrait", "Портрет 3:4"],
    ["banner", "Баннер 21:9"],
  ], imageStyle.aspect);
  const fit = selectInput([
    ["cover", "Обрезать по рамке"],
    ["contain", "Вписать целиком"],
  ], imageStyle.fit);
  const posX = rangeInput(imageStyle.x, 0, 100, 1);
  const posY = rangeInput(imageStyle.y, 0, 100, 1);
  const zoom = rangeInput(imageStyle.zoom, 1, 2.5, 0.05);
  const refreshPreview = () => {
    previewImage.src = imageValue;
    previewImage.hidden = !imageValue;
    previewText.hidden = Boolean(imageValue);
    preview.className = `upload-preview image-aspect-${aspect.value}`;
    previewImage.style.objectFit = fit.value;
    previewImage.style.objectPosition = `${posX.value}% ${posY.value}%`;
    previewImage.style.transform = `scale(${zoom.value})`;
  };
  [aspect, fit, posX, posY, zoom].forEach((control) => control.addEventListener("input", refreshPreview));
  refreshPreview();
  imageInput.addEventListener("change", async () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    imageValue = await imageFileToUrl(file, "gallery");
    refreshPreview();
  });
  form.append(
    labelWrap("Название", title),
    labelWrap("Тип", type),
    labelWrap("Связь", linked, "span-2"),
    labelWrap("Теги", tagsInput),
    labelWrap("Палитра", palette),
    labelWrap("Картинка", fragment([imageInput, preview]), "span-2"),
    labelWrap("Формат картинки", aspect),
    labelWrap("Отображение", fit),
    labelWrap("Позиция X", posX),
    labelWrap("Позиция Y", posY),
    labelWrap("Масштаб обрезки", zoom, "span-2"),
    actionRow([
      button("Сохранить", "small-button", null, "submit"),
      button("Убрать картинку", "small-button", () => {
        imageValue = "";
        imageInput.value = "";
        refreshPreview();
      }),
      button("Удалить", "small-button", () => {
        if (!confirm(`Удалить арт "${item.title}"?`)) return;
        state.gallery = state.gallery.filter((entry) => entry.id !== item.id);
        saveState();
        render();
      }),
    ], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextTags = csv(tagsInput.value);
    registerTags(nextTags, true);
    item.title = title.value;
    item.type = type.value;
    item.linked = linked.value;
    item.tags = nextTags;
    item.image = imageValue;
    item.imageStyle = {
      aspect: aspect.value,
      fit: fit.value,
      x: Number(posX.value),
      y: Number(posY.value),
      zoom: Number(zoom.value),
    };
    item.palette = csv(palette.value).slice(0, 3);
    while (item.palette.length < 3) item.palette.push("#111719");
    saveState();
    render();
  });
  return form;
}

function openQuestCreator() {
  state.quests.unshift({
    id: crypto.randomUUID(),
    title: "Новое задание",
    status: "active",
    patron: "Заказчик",
    reward: "Награда",
    linked: "Связь",
    notes: "Описание задания",
    gmNotes: "Заметки мастера",
  });
  saveState();
  render();
}

function renderCharacterSelect() {
  activeCharacterSelect.innerHTML = "";
  state.characters.forEach((character) => {
    const option = document.createElement("option");
    option.value = character.id;
    option.textContent = character.name;
    option.selected = character.id === activeCharacterId;
    activeCharacterSelect.append(option);
  });
}

function filterItems(items, getText) {
  if (!searchTerm) return items;
  const needle = searchTerm.toLowerCase();
  return items.filter((item) => getText(item).toLowerCase().includes(needle));
}

function metricGrid(items) {
  const grid = el("div", "metric-grid");
  items.forEach(([label, value]) => {
    const box = el("div", "metric");
    box.append(el("span", "muted", label), el("strong", "", value));
    grid.append(box);
  });
  return grid;
}

function tags(items) {
  const wrap = el("div", "tag-row");
  items.filter(Boolean).forEach((item) => wrap.append(tagChip(item)));
  return wrap;
}

function questStatus(status) {
  return { active: "активно", hidden: "скрыто", done: "завершено" }[status] ?? status;
}

function actionRow(buttons, extraClass = "") {
  const rowEl = el("div", `button-row ${extraClass}`.trim());
  buttons.forEach((item) => rowEl.append(item));
  return rowEl;
}

function labelWrap(text, control, extraClass = "") {
  const label = el("label", extraClass);
  label.append(document.createTextNode(text), control);
  return label;
}

function checkboxWrap(text, control) {
  const label = el("label");
  label.style.display = "flex";
  label.style.alignItems = "center";
  label.style.gap = "9px";
  control.style.width = "auto";
  label.append(control, document.createTextNode(text));
  return label;
}

function checkboxList(options, selected = []) {
  const selectedSet = new Set(selected);
  const list = el("div", "checkbox-list");
  if (!options.length) {
    list.append(el("p", "muted", "Нет доступных вариантов"));
    return list;
  }
  options.forEach(([value, text]) => {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = value;
    box.checked = selectedSet.has(value);
    list.append(checkboxWrap(text, box));
  });
  return list;
}

function checkedValues(container) {
  return [...container.querySelectorAll("input[type='checkbox']:checked")].map((item) => item.value);
}

function input(value) {
  const item = document.createElement("input");
  item.value = value ?? "";
  return item;
}

function rangeInput(value, min, max, step) {
  const item = document.createElement("input");
  item.type = "range";
  item.min = min;
  item.max = max;
  item.step = step;
  item.value = value ?? min;
  return item;
}

function selectInput(options, value) {
  const item = document.createElement("select");
  options.forEach(([optionValue, label]) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = label;
    option.selected = optionValue === value;
    item.append(option);
  });
  return item;
}

function textarea(value) {
  const item = document.createElement("textarea");
  item.value = value ?? "";
  return item;
}

function button(text, className, onClick, type = "button") {
  const item = document.createElement("button");
  item.type = type;
  item.className = className;
  item.textContent = text;
  if (onClick) item.addEventListener("click", onClick);
  return item;
}

function el(tag, className = "", text = "") {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== "") item.textContent = text;
  return item;
}

function fragment(children) {
  const frag = document.createDocumentFragment();
  children.forEach((child) => frag.append(child));
  return frag;
}

function spacer() {
  const item = el("div");
  item.style.height = "14px";
  return item;
}

function csv(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slug(value) {
  const base = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
  return `${base || "entry"}-${Date.now().toString(36)}`;
}

function escapeSvg(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

navItems.forEach((item) => item.addEventListener("click", () => setView(item.dataset.view)));
globalSearch.addEventListener("input", () => {
  if (currentView === "wiki" && hasUnsavedWikiDraft()) {
    const nextSearchTerm = globalSearch.value;
    globalSearch.value = searchTerm;
    if (!confirmWikiEditorLeave()) return;
    searchTerm = nextSearchTerm;
    globalSearch.value = nextSearchTerm;
    render();
    return;
  }
  searchTerm = globalSearch.value;
  if (searchTerm.trim()) {
    currentView = "dashboard";
    navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === currentView));
  }
  render();
});
activeCharacterSelect.addEventListener("change", () => {
  activeCharacterId = activeCharacterSelect.value;
  render();
});
resetViewButton.addEventListener("click", () => setView("dashboard"));
quickLoginButton.addEventListener("click", () => {
  if (supabaseUser) {
    if (!confirmWikiEditorLeave()) return;
    signOutSupabase();
  } else {
    loginError.hidden = true;
    loginError.textContent = "Не удалось войти";
    loginDialog.showModal();
    document.querySelector("#loginEmail").focus();
  }
});
cancelLogin.addEventListener("click", () => loginDialog.close());
window.addEventListener("beforeunload", (event) => {
  if (!hasUnsavedWikiDraft()) return;
  event.preventDefault();
  event.returnValue = "";
});
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.querySelector("#loginEmail").value.trim();
  const password = document.querySelector("#adminPassword").value;
  try {
    await signInSupabase(email, password);
    document.querySelector("#loginEmail").value = "";
    document.querySelector("#adminPassword").value = "";
    loginDialog.close();
    setView("admin");
  } catch (error) {
    loginError.textContent = error.message || "Не удалось войти";
    loginError.hidden = false;
  }
});

renderCharacterSelect();
setAdminMode(false, { renderView: false });
initSupabase();
render();
