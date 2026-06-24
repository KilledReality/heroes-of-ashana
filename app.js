const STORAGE_KEY = "ashana-campaign-v1";
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

const seedData = {
  meta: {
    campaignName: "Герои Асханы",
    currentRegion: "Северные рубежи Короны Арвейна",
    currentDate: "17 день месяца Золотого Пепла",
    version: 2,
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
let skillSearchTerm = "";
let activeGalleryTag = "";
let mapZoom = state.map.zoom || 1;
let mapScroll = { left: 0, top: 0 };
let mapBrushTerrain = "лес";
let mapBrushEnabled = false;
let searchTerm = "";

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

function normalizeState(raw) {
  const normalized = {
    ...structuredClone(seedData),
    ...raw,
    meta: { ...seedData.meta, ...(raw.meta ?? {}), version: 2 },
  };
  normalized.wiki = (raw.wiki ?? seedData.wiki).map(normalizeWikiArticle);
  normalized.characters = (raw.characters ?? seedData.characters).map(normalizeCharacter);
  if (!normalized.characters.some((character) => character.id === "richie-goldmann")) {
    normalized.characters.unshift(normalizeCharacter(seedData.characters[0]));
  }
  normalized.quests = raw.quests ?? seedData.quests;
  normalized.gallery = (raw.gallery ?? seedData.gallery).map(normalizeGalleryItem);
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
  activeCharacterId = state.characters[0]?.id ?? null;
  mapZoom = state.map.zoom || 1;
  renderCharacterSelect();
  render();
  cloudStatus = "Общая база подключена";
  renderCloudStatus();
  return true;
}

function compactStateForStorage(source) {
  const compact = structuredClone(source);
  compact.wiki?.forEach((article) => {
    if (isEmbeddedImage(article.image)) article.image = "";
  });
  compact.gallery?.forEach((item) => {
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
    characters: renderCharacters,
    gallery: renderGallery,
    quests: renderQuests,
    roller: renderRoller,
    admin: renderAdmin,
  };

  viewRoot.innerHTML = "";
  viewRoot.append(viewMap[currentView]());
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
        activeWikiId = article.id;
        setView("wiki");
      });
      cards.append(card);
    });

  root.append(grid, spacer(), cards);
  return root;
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
    tagPanel.append(tagButton);
  });
  list.append(tagPanel);

  list.append(el("p", "eyebrow", "Статьи"));
  articles.forEach((article) => {
    const item = button(article.title, "list-button", () => {
      guardedWikiNavigation(() => {
        activeWikiId = article.id;
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
          activeWikiId = article.id;
          activeWikiCategoryId = "";
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
        activeWikiId = article.id;
        activeWikiCategoryId = "";
      });
    });
    grid.append(card);
  });
  root.append(categoryArticles.length ? grid : el("div", "empty-state", "В категории пока нет статей"));
  return root;
}

function wikiArticleView(active) {
  const root = el("div", "admin-stack");
  if (active.image) {
    root.append(wikiImage(active, "wiki-hero-image"));
  }
  root.append(
    el("p", "eyebrow", wikiCategoryTitle(active.categoryId)),
    el("h3", "", active.title),
    tags(active.tags.concat(active.public ? ["игрокам"] : ["мастер"])),
    el("div", "article-body", active.body)
  );
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
  activeWikiId = article.id;
  activeWikiCategoryId = "";
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
  activeWikiId = articleId;
  activeWikiCategoryId = "";
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
    tagBar.append(button(tagName, `tag tag-button ${activeGalleryTag === tagName ? "active" : ""}`, () => {
      activeGalleryTag = activeGalleryTag === tagName ? "" : tagName;
      render();
    }));
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
        button("Очистить журнал", "small-button", () => {
          state.rolls = [];
          saveState();
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
  const entry = {
    id: crypto.randomUUID(),
    actor,
    label,
    formula: normalizeRoll(parsed),
    rolls,
    total,
    createdAt: new Date().toLocaleString("ru-RU"),
  };
  state.rolls.unshift(entry);
  state.rolls = state.rolls.slice(0, 200);
  saveState();
  render();
  showRollPopup(entry);
}

function showRollPopup(log) {
  const old = document.querySelector(".roll-popup");
  if (old) old.remove();
  const popup = el("div", "roll-popup");
  popup.append(
    el("p", "eyebrow", log.actor),
    el("h3", "", log.label || "Бросок"),
    el("strong", "roll-popup-total", log.total),
    el("p", "muted", `${log.formula} → [${log.rolls.join(", ")}]`)
  );
  const close = button("Закрыть", "small-button", () => popup.remove());
  popup.append(close);
  document.body.append(popup);
  setTimeout(() => popup.remove(), 5200);
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
  stack.append(meta, create, dataPanel);
  root.append(stack);
  return root;
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
  const date = input(state.meta.currentDate);
  form.append(
    labelWrap("Название", name),
    labelWrap("Текущий регион", region),
    labelWrap("Дата", date),
    actionRow([button("Сохранить", "primary-button", null, "submit")], "span-2")
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    state.meta.campaignName = name.value;
    state.meta.currentRegion = region.value;
    state.meta.currentDate = date.value;
    saveState();
    render();
  });
  return form;
}

function wikiCreator() {
  const article = { title: "", category: "Места", categoryId: "places", tags: "", body: "", gmBody: "", image: "", imageStyle: defaultImageStyle(), public: true };
  return wikiForm(article, (values) => {
    const article = normalizeWikiArticle({
      id: slug(values.title),
      title: values.title,
      category: values.category,
      categoryId: values.categoryId,
      tags: csv(values.tags),
      body: values.body,
      gmBody: values.gmBody,
      image: values.image,
      imageStyle: values.imageStyle,
      public: values.public,
    });
    state.wiki.unshift(article);
    activeWikiId = article.id;
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
      Object.assign(article, {
        title: values.title,
        category: values.category,
        categoryId: values.categoryId,
        tags: csv(values.tags),
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
    item.title = title.value;
    item.type = type.value;
    item.linked = linked.value;
    item.tags = csv(tagsInput.value);
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
  items.filter(Boolean).forEach((item) => wrap.append(el("span", "tag", item)));
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
