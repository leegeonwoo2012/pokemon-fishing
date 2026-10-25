"use strict";

// Keep normal encounters faithful to each biome. Canonical type data loads before this file.
const BIOME_ENCOUNTER_TYPES={sea:[11],cave:[5,6],lava:[10],mercury:[9],glacier:[15],meadow:[12,7],dream:[14,18],storm:[13,3],shadow:[8,17],martial:[2,1],dragon:[16,3],venom:[4]};
// A few species belong to a place by habitat or by a featured form.
const BIOME_HABITAT_EXCEPTIONS={
  sea:new Set([249, 602, 603, 604, 691, 852, 853]),
  lava:new Set([383]),
  mercury:new Set([800, 888, 889]),
  meadow:new Set([716]),
  storm:new Set([492]),
  glacier:new Set([86, 87, 90, 91, 131, 226, 458, 580, 581, 594, 747, 748, 833, 834, 845, 846, 847, 902]),
};
if(!window.POKEMON_TYPES)throw new Error("포켓몬 타입 데이터가 필요합니다.");
const priceFor = (id,tier) => { const t=TIERS[tier]; return t.min+(Math.imul(id,2654435761)>>>0)%t.spread; };
const POKEMON = [];
const BY_ID = new Map();
const POOL = {};
for (const biome of BIOMES) {
  POOL[biome.id] = {};
  for (const tier of Object.keys(TIERS)) {
    POOL[biome.id][tier] = CATALOGS[biome.id][tier].map(([id,name]) => {
      const t = TIERS[tier];
      const p = {id,name,tier,biome:biome.id,price:priceFor(id,tier)};
      if (!BY_ID.has(id)) BY_ID.set(id,p);
      POKEMON.push(p);
      return p;
    });
  }
}
// Keep older cave catches usable in existing saves after its pool became rock/ground themed.
const LEGACY_CAVE = {
  common:[[41,"주뱃"],[200,"무우마"],[293,"소곤룡"],[355,"해골몽"],[562,"데스마스"],[610,"터검니"],[622,"골비람"],[633,"모노두"],[714,"음뱃"]],
  uncommon:[[42,"골뱃"],[294,"노공룡"],[444,"한바이트"],[611,"액슨도"],[634,"디헤드"]],
  rare:[[94,"팬텀"],[295,"폭음룡"],[429,"무우마직"],[563,"데스니칸"],[612,"액스라이즈"],[635,"삼삼드래"],[715,"음번"],[861,"오롱털"]],
  legendary:[[480,"유크시"],[482,"아그놈"]],
  mythic:[[150,"뮤츠"],[487,"기라티나"]]
};
for (const [tier, entries] of Object.entries(LEGACY_CAVE)) for (const [id,name] of entries) {
  if (!BY_ID.has(id)) {
    const t=TIERS[tier];
    BY_ID.set(id,{id,name,tier,biome:"cave",price:priceFor(id,tier)});
  }
}
const SAVE_KEY = "tidebound-pokemon-fishing-v1";
const SHINY_RATE = 1 / 100;
const BIOME_TYPES = {sea:"물",cave:"바위 · 땅",lava:"불꽃",mercury:"강철",glacier:"얼음",meadow:"풀 · 벌레",dream:"에스퍼 · 페어리",storm:"전기 · 비행",shadow:"고스트 · 악",martial:"격투 · 노말",dragon:"드래곤 · 비행",venom:"독"};
const $ = id => document.getElementById(id);
const formatMoney = n => Math.floor(n).toLocaleString("ko-KR");
const biomeById = id => BIOMES.find(b => b.id === id) || BIOMES[0];
const speciesIn = id => POKEMON.filter(p => p.biome === id);
const basePrice = item => BY_ID.get(item.id).price;
const salePrice = item => {
  const form=SPECIAL_FORMS[item.form];
  const price=form?.priceMultiplier ? basePrice(item)*form.priceMultiplier : item.form ? priceFor(item.id,"mythic")*2 : basePrice(item);
  return price*(item.shiny?10:1);
};
const itemName = item => SPECIAL_FORMS[item.form]?.name || BY_ID.get(item.id).name;
const displayTier = item => SPECIAL_FORMS[item.form]?.kind ? BY_ID.get(item.id).tier : item.form ? "mythic" : BY_ID.get(item.id).tier;
const formMarkup = item => SPECIAL_FORMS[item.form]?.kind ? '<span class="form-badge '+SPECIAL_FORMS[item.form].kind+'">'+(SPECIAL_FORMS[item.form].kind==="primal"?"원시회귀":"메가진화")+'</span>' : '';
const FORM_SPRITES = {
  palkiaOrigin:"palkia-origin.png",zygardeComplete:"zygarde-complete.gif",
  groudonPrimal:"groudon-primal.gif",diancieMega:"diancie-mega.gif",
  zacianCrowned:"zacian-crowned.gif",zamazentaCrowned:"zamazenta-crowned.gif",
  necrozmaDusk:"necrozma-duskmane.gif",necrozmaDawn:"necrozma-dawnwings.gif",
  kyuremBlack:"kyurem-black.gif",kyuremWhite:"kyurem-white.gif",
  shayminSky:"shaymin-sky.gif",hoopaUnbound:"hoopa-unbound.gif",
  ultraNecrozma:"necrozma-ultra.gif"
};
const spriteUrl = item => {
  const form=SPECIAL_FORMS[item.form];
  if(form?.spriteNormal)return item.shiny?form.spriteShiny:form.spriteNormal;
  if (item.form && FORM_SPRITES[item.form]) {
    if (item.form === "palkiaOrigin") return "https://play.pokemonshowdown.com/sprites/gen5"+(item.shiny?"-shiny":"")+"/"+FORM_SPRITES[item.form];
    return "https://play.pokemonshowdown.com/sprites/ani"+(item.shiny?"-shiny":"")+"/"+FORM_SPRITES[item.form];
  }
  return "./sprites/" + (item.shiny ? "shiny/" : "") + item.id + ".png";
};
const spriteMarkup = (item, cls) => {
  const p = BY_ID.get(item.id);
  return '<img class="' + cls + (item.form?" special-form":"") + '" data-pokemon-id="' + item.id + '" data-shiny="' + (item.shiny ? "1" : "0") + '" data-form="' + (item.form||"") + '" src="' + spriteUrl(item) + '" alt="' + (item.shiny ? "이로치 " : "") + itemName(item) + '">';
};
const rarityMarkup = tier => '<span class="rarity-label rarity-' + tier + '">' + TIERS[tier].label + '</span>';
const shinyMarkup = shiny => shiny ? '<span class="shiny-badge">✦ 이로치</span>' : '';
const initialState = () => ({
  money:0,totalCatches:0,misses:0,biome:"sea",equipped:{...STARTER_ROD},
  ownedRods:[0],bag:[],reserve:[],discovered:[],shinyDiscovered:[],bossWins:[],lostDex:{},lastRaidAttempt:null,lastCatch:null,sound:true
});
function normalizeItem(value) {
  if (Number.isInteger(value) && BY_ID.has(value)) return {id:value,biome:BY_ID.get(value).biome,shiny:false};
  if (value && Number.isInteger(value.id) && BY_ID.has(value.id)) {
    const biome=BIOMES.some(b=>b.id===value.biome) && speciesIn(value.biome).some(p=>p.id===value.id) ? value.biome : BY_ID.get(value.id).biome;
    return {id:value.id,biome,shiny:value.shiny===true,form:SPECIAL_FORMS[value.form]?.id===value.id?value.form:null};
  }
  return null;
}
function isCompleteWith(discovered,biomeId) {
  const found = new Set(discovered);
  return speciesIn(biomeId).every(p => found.has(p.id));
}
function unlockedIndexFor(discovered) {
  return BIOMES.length - 1; // 테스트용: 모든 바이옴 즉시 개방
}
function loadState() {
  const clean = initialState();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || typeof saved !== "object") return clean;
    clean.money = Number.isFinite(saved.money) ? Math.max(0,Math.floor(saved.money)) : 0;
    clean.totalCatches = Number.isFinite(saved.totalCatches) ? Math.max(0,Math.floor(saved.totalCatches)) : 0;
    clean.misses = Number.isFinite(saved.misses) ? Math.max(0,Math.floor(saved.misses)) : 0;
    clean.discovered = Array.isArray(saved.discovered) ? [...new Set(saved.discovered.filter(id => BY_ID.has(id)))] : [];
    clean.shinyDiscovered = Array.isArray(saved.shinyDiscovered) ? [...new Set(saved.shinyDiscovered.filter(id => BY_ID.has(id)))] : [];
    const oldBag = Array.isArray(saved.bag) ? saved.bag.map(normalizeItem).filter(Boolean) : [];
    clean.bag = oldBag.slice(0,5);
    clean.reserve = [...(Array.isArray(saved.reserve)?saved.reserve.map(normalizeItem).filter(Boolean):[]),...oldBag.slice(5)];
    clean.bossWins = Array.isArray(saved.bossWins) ? [...new Set(saved.bossWins.filter(key=>BIOMES.some(b=>Array.from({length:10},(_,i)=>b.id+":"+(i+1)).includes(key))))] : [];
    if (saved.lastRaidAttempt && typeof saved.lastRaidAttempt.key === "string" && Number.isInteger(saved.lastRaidAttempt.catches))
      clean.lastRaidAttempt={key:saved.lastRaidAttempt.key,catches:Math.max(0,saved.lastRaidAttempt.catches)};
    for(const biome of BIOMES) {
      const valid=new Set(speciesIn(biome.id).map(p=>p.id));
      clean.lostDex[biome.id]=Array.isArray(saved.lostDex?.[biome.id])?[...new Set(saved.lostDex[biome.id].filter(id=>valid.has(id)))]:[];
    }
    clean.lastCatch = normalizeItem(saved.lastCatch);
    clean.sound = saved.sound !== false;
    const maxUnlocked = unlockedIndexFor(clean.discovered);
    clean.biome = BIOMES.some((b,i) => b.id === saved.biome && i <= maxUnlocked) ? saved.biome : "sea";
    clean.ownedRods = Array.isArray(saved.ownedRods) ?
      [...new Set([0,...saved.ownedRods.filter(n => Number.isInteger(n) && n >= 0 && n < RODS.length)])] : [0];
    for (const b of BIOMES) if (!clean.ownedRods.includes(STARTER_ROD[b.id])) clean.ownedRods.push(STARTER_ROD[b.id]);
    const oldSeaRod = Number.isInteger(saved.rod) && saved.rod >= 0 && saved.rod <= 6 ? saved.rod : 0;
    clean.equipped.sea = clean.ownedRods.includes(saved.equipped?.sea) && RODS[saved.equipped.sea].biome === "sea" ? saved.equipped.sea : oldSeaRod;
    for (const id of BIOMES.map(b => b.id).filter(id => id !== "sea")) {
      const selected = saved.equipped?.[id];
      clean.equipped[id] = clean.ownedRods.includes(selected) && RODS[selected].biome === id ? selected : STARTER_ROD[id];
    }
    return clean;
  } catch { return clean; }
}
let state = loadState();
let activeRaid = null;
let raidTimer = null;
const raidScene = window.RaidScene ? window.RaidScene.create($("raidCanvas"),spriteUrl) : null;
let currentTab = "bag";
let pendingCatch = null;
let pendingUnlock = null;
let fishingPhase = "idle";
let castStarted = 0;
let hookStarted = 0;
let hookTravel = 1000;
let toastTimer;
const currentRod = () => RODS[state.equipped[state.biome]];
function persist() { try { localStorage.setItem(SAVE_KEY,JSON.stringify(state)); } catch {} }
function randomUnit() {
  if (window.crypto && window.crypto.getRandomValues) {
    const a = new Uint32Array(1);
    window.crypto.getRandomValues(a);
    return a[0] / 4294967296;
  }
  return Math.random();
}
function rollCatch() {
  const odds = currentRod().odds;
  let roll = randomUnit() * 100;
  let tier = "common";
  for (const key of ["mythic","legendary","rare","uncommon","common"]) {
    if (roll < odds[key]) { tier = key; break; }
    roll -= odds[key];
  }
  const rod=currentRod();
  if(tier==="mythic" && rod.formRate){
    const formRoll=randomUnit()*odds.mythic;
    let form=null;
    if(rod.ultraRate && formRoll<rod.ultraRate)form="ultraNecrozma";
    else if(formRoll<rod.ultraRate+rod.formRate){
      const pool=FORM_POOLS[state.biome];
      form=pool[Math.floor(randomUnit()*pool.length)];
    }
    if(form)return {id:SPECIAL_FORMS[form].id,biome:state.biome,shiny:randomUnit()<(rod.shinyRate||SHINY_RATE),form};
  }
  const all = POOL[state.biome][tier];
  const unseen = all.filter(p => !state.discovered.includes(p.id) || state.lostDex[state.biome]?.includes(p.id));
  const candidates = unseen.length && randomUnit() < .62 ? unseen : all;
  const p = candidates[Math.floor(randomUnit() * candidates.length)];
  const possibleForms=MEGA_FORMS_BY_ID[p.id];
  let form=null;
  if(possibleForms?.length && randomUnit()<rod.megaRate/100)form=possibleForms[Math.floor(randomUnit()*possibleForms.length)];
  return {id:p.id,biome:p.biome,shiny:randomUnit() < (rod.shinyRate||SHINY_RATE),form};
}
function showToast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"),2400);
}
let audioContext;
function playTone(freq,duration,type="square",volume=.035,delay=0) {
  if (!state.sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    const start = audioContext.currentTime + delay;
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(freq,start);
    gain.gain.setValueAtTime(volume,start);
    gain.gain.exponentialRampToValueAtTime(.001,start+duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start); oscillator.stop(start+duration);
  } catch {}
}
function playCatchSound(item) {
  if (item.shiny) [523,659,784,1046,1318].forEach((n,i)=>playTone(n,.17,"triangle",.05,i*.12));
  else if (item.form || BY_ID.get(item.id).tier === "mythic") [392,523,784,1046].forEach((n,i)=>playTone(n,.2,"triangle",.04,i*.13));
  else { playTone(440,.1); playTone(660,.16,"square",.025,.11); }
}
function biomeProgress(id) {
  const found = new Set(state.discovered);
  const all = speciesIn(id), lost=new Set(state.lostDex[id]||[]);
  return {found:all.filter(p=>found.has(p.id)&&!lost.has(p.id)).length,total:all.length};
}
function isUnlocked(id) { return BIOMES.findIndex(b=>b.id===id) <= unlockedIndexFor(state.discovered); }
function updateHeader() {
  $("money").textContent = formatMoney(state.money);
  $("totalCatches").textContent = formatMoney(state.totalCatches);
  $("bagCount").textContent = state.bag.length + "/5";
  $("dexCount").textContent = BIOMES.reduce((count,b)=>count+biomeProgress(b.id).found,0);
  $("soundButton").classList.toggle("muted",!state.sound);
  $("soundButton").textContent = state.sound ? "♪" : "♩";
}
function renderBiomes() {
  const biome=biomeById(state.biome), progress=biomeProgress(state.biome);
  document.body.dataset.biome=state.biome;
  $("regionName").textContent = biome.name + " · " + String(BIOMES.findIndex(b=>b.id===state.biome)+1).padStart(3,"0");
  $("sceneWeather").textContent = biome.weather;
  $("sceneBottomLeft").textContent = "◂ " + biome.name.toUpperCase();
  $("sceneBottomRight").textContent = biome.kicker + " ▸";
  $("sceneFrame").dataset.biome = state.biome;
  $("biomeStrip").innerHTML = BIOMES.map((b,index) => {
    const open=isUnlocked(b.id), active=state.biome===b.id, count=biomeProgress(b.id);
    return '<button class="biome-card' + (active?" active":"") + (open?"":" locked") + '" style="--biome-accent:' + b.accent + '" data-biome="' + b.id + '"' + (open?"":" disabled") + '><span class="biome-icon">' + b.icon + '</span><span class="biome-copy"><strong>' + b.name + '</strong><small>' + (open ? BIOME_TYPES[b.id] + " · " + count.found + "/" + count.total : "도감 완성 후 개방") + '</small></span><span class="biome-lock">' + (open ? active ? "✦" : "↗" : "◈") + '</span></button>';
  }).join("");
  const percent=Math.round(progress.found/progress.total*100);
  const raidWins=state.bossWins.filter(key=>key.startsWith(state.biome+":")).length;
  $("biomeProgress").innerHTML = '<div class="progress-label"><strong>' + biome.icon + ' ' + biome.name + ' 도감</strong><span>' + progress.found + " / " + progress.total + '</span></div><div class="progress-track" style="--biome-accent:' + biome.accent + '"><span style="width:' + percent + '%"></span></div><div class="progress-next">' + ("레이드 승리 "+raidWins+" / 10 · 도감 10%마다 보스 출현") + '</div>';
}
function rodMotifSvg(rod) {
  const c=rod.gem, t=rod.trim;
  const motif={
    shell:'<path d="M48 34Q45 9 70 5q25 4 22 29z" fill="'+c+'" stroke="'+t+'" stroke-width="3"/><path d="M70 6v27 M58 10l5 23 M82 10l-5 23" stroke="'+t+'" stroke-width="2"/><circle cx="70" cy="33" r="5" fill="#fff8e6"/>',
    anchor:'<path d="M70 5v30 M58 22h24 M52 28q0 17 18 12 18 5 18-12 M52 28l6 2 M88 28l-6 2" fill="none" stroke="'+t+'" stroke-width="5"/><circle cx="70" cy="7" r="5" fill="'+c+'"/>',
    fang:'<path d="M57 8l-7 31 21-13 16 13-7-31-10 12z" fill="'+c+'" stroke="'+t+'" stroke-width="4"/><path d="M70 20v19" stroke="#fff5dc" stroke-width="3"/>',
    compass:'<circle cx="70" cy="22" r="18" fill="'+t+'" stroke="'+c+'" stroke-width="4"/><circle cx="70" cy="22" r="11" fill="#2c4d65"/><path d="M70 7l5 15-5 15-5-15z" fill="'+c+'"/><circle cx="70" cy="22" r="3" fill="#fff"/>',
    wing:'<path d="M70 30Q43 34 45 5q12 15 25 13 Q97 0 96 8q-1 26-26 22z" fill="'+c+'" stroke="'+t+'" stroke-width="3"/><path d="M48 12l22 17 M90 13L70 29" stroke="#fff5ef" stroke-width="2"/>',
    bell:'<path d="M54 32Q59 27 59 18Q59 6 70 5Q81 6 81 18Q81 27 86 32z" fill="'+t+'" stroke="'+c+'" stroke-width="4"/><circle cx="70" cy="36" r="5" fill="'+c+'"/><path d="M65 18h10" stroke="#fff" stroke-width="3"/>',
    wood:'<circle cx="72" cy="20" r="4" fill="'+c+'"/><path d="M72 24v10" stroke="'+t+'" stroke-width="2"/>',
    coral:'<path d="M68 32V11 M68 19L57 11 M68 24L79 14 M68 28L56 24" stroke="'+t+'" stroke-width="5" fill="none"/><circle cx="79" cy="14" r="3" fill="'+c+'"/>',
    wave:'<path d="M51 26q10-11 20 0t20 0 M54 34q10-11 20 0" stroke="'+c+'" stroke-width="4" fill="none"/>',
    sun:'<circle cx="70" cy="22" r="11" fill="'+c+'"/><path d="M70 4v7 M70 33v7 M52 22h7 M81 22h7 M58 10l5 5 M77 29l5 5 M82 10l-5 5 M63 29l-5 5" stroke="'+t+'" stroke-width="3"/>',
    star:'<path d="M70 5l5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1z" fill="'+c+'" stroke="'+t+'" stroke-width="2"/>',
    abyss:'<path d="M57 29q-9-7-6-16 M60 35q-15 3-19-7 M82 31q12-7 11-17" stroke="'+t+'" stroke-width="3" fill="none"/><circle cx="70" cy="23" r="11" fill="'+c+'"/><circle cx="70" cy="23" r="5" fill="#173b6b"/>',
    trident:'<path d="M59 28V8 M70 31V4 M81 28V8 M58 8l-4 7 M82 8l4 7 M59 27q11 12 22 0" stroke="'+t+'" stroke-width="5" fill="none"/><circle cx="70" cy="24" r="5" fill="'+c+'"/>',
    quartz:'<path d="M70 4l13 18-13 18-13-18z" fill="'+c+'" stroke="'+t+'" stroke-width="3"/><path d="M70 4v36 M57 22h26" stroke="#fff" stroke-width="2"/>',
    obsidian:'<path d="M69 2l15 18-7 20-21-6-4-17z" fill="#21263e" stroke="'+c+'" stroke-width="3"/><path d="M69 2l-3 22 11 16" stroke="'+t+'" stroke-width="2" fill="none"/>',
    amethyst:'<path d="M52 32l4-21 11 8 4-16 9 17 8-9 1 23-18 8z" fill="'+c+'" stroke="'+t+'" stroke-width="3"/>',
    geode:'<circle cx="70" cy="22" r="18" fill="'+t+'"/><circle cx="70" cy="22" r="12" fill="'+c+'"/><circle cx="70" cy="22" r="5" fill="#2b627b"/>',
    rune:'<circle cx="70" cy="22" r="17" fill="none" stroke="'+t+'" stroke-width="3"/><path d="M61 13h18l-8 8 8 10H61l8-10z" fill="none" stroke="'+c+'" stroke-width="3"/>',
    prism:'<path d="M70 2l19 20-19 20-19-20z" fill="'+c+'" stroke="'+t+'" stroke-width="3"/><path d="M70 2v40 M51 22h38 M59 12l22 20 M81 12L59 32" stroke="#92f7f3" stroke-width="2"/>',
    ember:'<path d="M70 4q-15 15-7 22-1-11 9-14 11 13 1 26-18 0-18-15 0-8 15-19z" fill="'+c+'" stroke="'+t+'" stroke-width="3"/>',
    magma:'<path d="M53 12l16-9 18 11-5 24-27-2z" fill="#713c3d" stroke="'+t+'" stroke-width="3"/><path d="M67 4l3 15 9 4-9 15" stroke="'+c+'" stroke-width="4" fill="none"/>',
    phoenix:'<path d="M70 15q-18-20-23 0l16 19 7-4 7 4 17-20Q89-6 70 15z" fill="'+t+'" stroke="'+c+'" stroke-width="3"/><path d="M70 11v25" stroke="'+c+'" stroke-width="4"/>',
    crown:'<path d="M53 31l-4-20 12 8 9-15 9 15 12-8-4 20z" fill="'+t+'" stroke="'+c+'" stroke-width="3"/><circle cx="70" cy="23" r="5" fill="'+c+'"/>',
    solar:'<circle cx="70" cy="22" r="13" fill="'+c+'"/><circle cx="70" cy="22" r="6" fill="#fff"/><path d="M70 0v9 M70 35v9 M48 22h9 M83 22h9 M54 6l7 7 M79 31l7 7 M86 6l-7 7 M61 31l-7 7" stroke="'+t+'" stroke-width="4"/>',
    core:'<path d="M70 1l19 12-4 24-15 8-15-8-4-24z" fill="#7b2d57" stroke="'+t+'" stroke-width="3"/><path d="M55 21q15-18 30 0-15 17-30 0z" fill="'+c+'"/><circle cx="70" cy="21" r="5" fill="#e24f5d"/>',
    gear:'<circle cx="70" cy="22" r="17" fill="none" stroke="'+t+'" stroke-width="6"/><circle cx="70" cy="22" r="6" fill="'+c+'"/><path d="M70 0v9 M70 35v9 M48 22h9 M83 22h9" stroke="'+c+'" stroke-width="5"/>',
    coil:'<path d="M53 10q34-11 34 6T53 28q34-11 34 5" fill="none" stroke="'+t+'" stroke-width="5"/><circle cx="70" cy="22" r="6" fill="'+c+'"/>',
    snow:'<path d="M70 2v40 M50 11l40 22 M50 33l40-22 M63 9l7 6 7-6 M63 35l7-6 7 6" fill="none" stroke="'+t+'" stroke-width="4"/><circle cx="70" cy="22" r="5" fill="'+c+'"/>',
    leaf:'<path d="M70 39Q43 26 59 6q23-5 24 18Q81 36 70 39z" fill="'+c+'" stroke="'+t+'" stroke-width="3"/><path d="M60 29l19-17" stroke="'+t+'" stroke-width="2"/>',
    flower:'<circle cx="70" cy="22" r="7" fill="'+c+'"/><circle cx="70" cy="7" r="8" fill="'+t+'"/><circle cx="85" cy="22" r="8" fill="'+t+'"/><circle cx="70" cy="37" r="8" fill="'+t+'"/><circle cx="55" cy="22" r="8" fill="'+t+'"/>',
    bubble:'<circle cx="70" cy="25" r="13" fill="none" stroke="'+t+'" stroke-width="4"/><circle cx="54" cy="11" r="6" fill="none" stroke="'+c+'" stroke-width="3"/><circle cx="84" cy="7" r="5" fill="'+c+'"/>',
    ribbon:'<path d="M70 23Q43-2 51 27q5 9 19-4 Q96-2 89 27q-5 9-19-4 M70 23l-11 20 M70 23l13 20" fill="none" stroke="'+t+'" stroke-width="5"/><circle cx="70" cy="23" r="6" fill="'+c+'"/>'
  };
  return motif[rod.motif] || motif.wood;
}
function rodSvg(rod) {
  const transcend=rod.premium===2?
    '<circle cx="68" cy="25" r="29" fill="none" stroke="#b0f5ff" stroke-width="2" stroke-dasharray="4 3" opacity=".9"/>'+ 
    '<circle cx="68" cy="25" r="19" fill="none" stroke="#fff2ac" stroke-width="2" opacity=".85"/>'+ 
    '<path d="M65 15Q42 20 14 5L38 27 6 31 36 38 27 54 59 37M71 15Q92 16 94 2L79 24 95 41 76 39" fill="#9aefff" stroke="#fff6c2" stroke-width="2"/>'+ 
    '<path d="M61 13L68 0 75 13 88 18 75 27 70 42 60 31 48 21Z" fill="#f5c8ff" stroke="#faffcd" stroke-width="2"/>'+ 
    '<path d="M64 13L68 6 72 13 79 20 71 25 68 34 63 25 56 20Z" fill="#fff3a3"/>'+ 
    '<circle cx="68" cy="20" r="5" fill="#ffffff"/>'+ 
    '<path d="M9 68l4 6-4 6-4-6zM89 54l4 6-4 6-4-6zM41 2l3 5-3 5-3-5z" fill="#fff6d0"/>'+ 
    '<path d="M24 71l14-14M34 78l15-17" stroke="#e9b9ff" stroke-width="3"/>':'';
  const halo=rod.premium?
    '<circle cx="63" cy="27" r="23" fill="none" stroke="'+rod.gem+'" stroke-width="2" opacity=".8"/>'+
    '<path d="M30 32L5 14 34 21 18 1 48 17M81 29L95 7 68 19 79 1 48 18" fill="'+rod.trim+'" stroke="'+rod.gem+'" stroke-width="2"/>'+
    '<path d="M62 0L67 11 77 4 74 19 87 24 73 28 68 39 62 29 49 24 61 18Z" fill="'+rod.gem+'" stroke="white" stroke-width="2"/>'+
    '<circle cx="13" cy="45" r="3" fill="white"/><circle cx="90" cy="54" r="3" fill="'+rod.gem+'"/>'+
    '<path d="M8 58L12 66 16 58 12 50Z M84 74L88 82 92 74 88 66Z" fill="'+rod.gem+'"/>':'';
  return '<svg viewBox="0 0 96 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + halo +
    '<path d="M19 88L64 27" stroke="#102432" stroke-width="12" stroke-linecap="square"/>' +
    '<path d="M19 88L64 27" stroke="' + rod.shaft + '" stroke-width="8" stroke-linecap="square"/>' +
    '<path d="M21 85L62 30" stroke="' + rod.trim + '" stroke-width="2" opacity=".9"/>' +
    '<path d="M16 79L27 86 M12 84L24 92" stroke="#342c3b" stroke-width="4"/>' +
    '<circle cx="29" cy="73" r="8" fill="' + rod.trim + '" stroke="#2b3b47" stroke-width="3"/>' +
    '<circle cx="29" cy="73" r="3" fill="' + rod.gem + '"/>' +
    '<path d="M64 27Q78 42 74 60" stroke="' + rod.trim + '" stroke-width="1.5" fill="none"/>' +
    rodMotifSvg(rod) + transcend + '</svg>';
}
function updateRod() {
  const rod=currentRod();
  $("rodName").textContent=rod.name;
  $("rodFlavor").textContent=rod.subtitle;
  $("rodMiniArt").innerHTML=rodSvg(rod);
  $("rodBadge").style.borderColor=rod.gem;
  $("rodBadge").style.setProperty("--rod-glow",rod.gem);
  $("hookTarget").style.width=(rod.target*100)+"%";
  $("oddsList").innerHTML=["common","uncommon","rare","legendary","mythic"].map(tier =>
    '<div class="odds-row"><span>' + TIERS[tier].label + '</span><div class="odds-track"><div class="odds-fill" style="width:' + Math.max(2,rod.odds[tier]) + '%;background:' + TIERS[tier].color + '"></div></div><strong>' + Number(rod.odds[tier].toFixed(2)) + '%</strong></div>'
  ).join("")+'<div class="form-odds">메가진화 · 원시회귀 <strong>'+rod.megaRate+'%</strong> <small>대상 포켓몬 포획 시</small></div>';
}
function updateLastCatch() {
  const item=state.lastCatch;
  const el=$("lastCatch");
  if (!item) return;
  const p=BY_ID.get(item.id);
  el.className="last-content"+(item.shiny?" shiny":"");
  el.innerHTML=spriteMarkup(item,"last-sprite")+'<div class="last-info">'+rarityMarkup(displayTier(item))+formMarkup(item)+shinyMarkup(item.shiny)+'<strong>'+itemName(item)+'</strong><small>'+biomeById(item.biome||p.biome).name+' · 판매가 '+formatMoney(salePrice(item))+' 코인</small></div>';
}
function renderBag() {
  let html='<div class="bag-toolbar"><strong>레이드 파티 · '+state.bag.length+'/5마리</strong><button class="small-action" data-action="sell-all" '+(state.bag.length?"":"disabled")+'>전체 판매</button></div>';
  if (!state.bag.length && !state.reserve.length) return html+'<div class="empty-bag"><span class="empty-art">◁°))))><</span><strong>가방이 텅 비었어요</strong>낚은 포켓몬을 보관하면 이곳에 나타납니다.</div>';
  html+='<div class="item-list">'+state.bag.map((item,index)=>{
    const p=BY_ID.get(item.id);
    return '<div class="pokemon-item'+(item.shiny?" shiny":"")+'">'+spriteMarkup(item,"")+'<div class="pokemon-item-main">'+rarityMarkup(displayTier(item))+formMarkup(item)+shinyMarkup(item.shiny)+'<strong>'+itemName(item)+'</strong><small>'+biomeById(item.biome||p.biome).name+' · No. '+String(p.id).padStart(4,"0")+'</small></div><button class="sell-button" data-action="sell" data-index="'+index+'">'+formatMoney(salePrice(item))+' ✦</button></div>';
  }).join("")+'</div>';
  if(state.reserve.length)html+='<div class="reserve-title">이전 저장 데이터 보관함 · '+state.reserve.length+'마리</div><div class="item-list">'+state.reserve.map((item,index)=>{
    const p=BY_ID.get(item.id);
    return '<div class="pokemon-item">'+spriteMarkup(item,"")+'<div class="pokemon-item-main">'+rarityMarkup(displayTier(item))+formMarkup(item)+shinyMarkup(item.shiny)+'<strong>'+itemName(item)+'</strong></div><div class="reserve-actions"><button data-action="reserve-move" data-index="'+index+'">가방으로</button><button data-action="reserve-sell" data-index="'+index+'">판매 '+formatMoney(salePrice(item))+'</button></div></div>';
  }).join("")+'</div>';
  return html;
}
function renderDex() {
  const biome=biomeById(state.biome);
  const all=speciesIn(state.biome).sort((a,b)=>a.id-b.id);
  const found=new Set(state.discovered), shinies=new Set(state.shinyDiscovered), lost=new Set(state.lostDex[state.biome]||[]);
  const count=all.filter(p=>found.has(p.id)&&!lost.has(p.id)).length, percent=Math.round(count/all.length*100);
  return '<div class="dex-toolbar"><strong>'+biome.icon+' '+biome.name+' · '+count+' / '+all.length+'</strong><span style="color:#9fdcc6;font-size:12px">'+percent+'% 완료</span></div>'+
    '<div class="dex-progress"><span style="width:'+percent+'%;background:'+biome.accent+'"></span></div>'+
    '<div class="dex-biome-note">이로치도 도감 발견으로 인정됩니다. ✦ 표시는 이로치 발견 기록이에요.</div>'+
    '<div class="dex-list">'+all.map(p=>{
      const known=found.has(p.id)&&!lost.has(p.id), shiny=known&&shinies.has(p.id);
      return '<div class="dex-item'+(known?"":" unknown")+(shiny?" shiny-found":"")+'">'+spriteMarkup({id:p.id,shiny:shiny},"")+'<span><small>No. '+String(p.id).padStart(4,"0")+'</small><strong>'+(known?p.name:"???")+'</strong></span>'+(known?rarityMarkup(p.tier):'<em>미발견</em>')+(shiny?'<b class="shiny-mark">✦</b>':'')+'</div>';
    }).join("")+'</div>';
}
function renderShop() {
  const biome=biomeById(state.biome);
  const rods=RODS.map((rod,index)=>({rod,index})).filter(x=>x.rod.biome===state.biome).sort((a,b)=>a.rod.price-b.rod.price);
  return '<div class="shop-note"><span style="font-size:20px">'+biome.icon+'</span><span><strong>'+biome.name+'</strong> 전용 낚싯대. 희귀 확률과 타이밍 판정 폭이 함께 좋아집니다.</span></div><div class="shop-list">'+rods.map(({rod,index})=>{
    const owned=state.ownedRods.includes(index), equipped=state.equipped[state.biome]===index;
    const button=equipped?'<button class="shop-buy" disabled>장착 중</button>':owned?'<button class="shop-buy shop-equip" data-action="equip" data-rod="'+index+'">장착하기</button>':'<button class="shop-buy" data-action="buy" data-rod="'+index+'"'+(state.money<rod.price?" disabled":"")+'>구매하기</button>';
    return '<div class="shop-card'+(equipped?" equipped":"")+(rod.premium?" premium premium-"+rod.premium:"")+'"><div class="shop-card-top"><div class="shop-rod-art" style="--glow:'+rod.gem+'">'+rodSvg(rod)+'</div><div><div class="shop-biome-tag">'+biome.kicker+'</div><h3>'+rod.name+'</h3><p>'+rod.subtitle+'</p><div class="shop-odds-plus">중앙 판정 폭 '+Math.round(rod.target*100)+'%</div></div></div><div class="shop-stats"><span>희귀 '+rod.odds.rare+'%</span><span>준전설 '+rod.odds.legendary+'%</span><span>초전설 '+rod.odds.mythic+'%</span><span>메가·원시 '+rod.megaRate+'%</span>'+(rod.premium?'<span>이로치 1/'+Math.round(1/rod.shinyRate)+'</span><span>특수 폼 '+rod.formRate+'%</span>'+(rod.ultraRate?'<span>울트라네크로즈마 '+rod.ultraRate+'%</span>':''):'')+'</div><div class="shop-footer"><span class="shop-price">'+(rod.price===0?"기본 지급":"✦ "+formatMoney(rod.price))+'</span>'+button+'</div></div>';
  }).join("")+'</div>';
}
function renderTab() {
  document.querySelectorAll(".tab").forEach(el=>{
    const active=el.dataset.tab===currentTab;
    el.classList.toggle("active",active);
    el.setAttribute("aria-selected",String(active));
  });
  $("tabContent").innerHTML=currentTab==="bag"?renderBag():currentTab==="dex"?renderDex():renderShop();
}
const RAID_BOSSES = {
  sea:{legendary:[245,489,788],mythic:382},
  cave:{legendary:[377,639,645],mythic:718},
  lava:{legendary:[244,485,1004],mythic:250},
  mercury:{legendary:[379,638,791],mythic:483},
  glacier:{legendary:[378,144,1002],mythic:646},
  meadow:{legendary:[640,787,492],mythic:716},
  dream:{legendary:[481,488,786],mythic:151},
  storm:{legendary:[145,243,642],mythic:1008},
  shadow:{legendary:[897,802,491],mythic:717},
  martial:{legendary:[891,892,638],mythic:493},
  dragon:{legendary:[380,381,644],mythic:384},
  venom:{legendary:[1014,1015,1016],mythic:890}
};
const RAID_STATS = {
  common:{hp:80,attack:10,interval:1.1,move:"몸통박치기"},
  uncommon:{hp:125,attack:18,interval:1.0,move:"연속 타격"},
  rare:{hp:195,attack:30,interval:.9,move:"강력한 일격"},
  legendary:{hp:340,attack:50,interval:.8,move:"전설의 파동"},
  mythic:{hp:500,attack:75,interval:.7,move:"초월의 힘"}
};
const RAID_ELEMENTS = {sea:"파도",cave:"대지",lava:"화염",mercury:"강철",glacier:"빙결",meadow:"숲",dream:"꿈",storm:"뇌격",shadow:"그림자",martial:"투혼",dragon:"용성",venom:"맹독"};
const RAID_HP=[0,1050,1450,1900,2400,3500,4500,4700,5600,7500,8500];
const RAID_AOE=[0,20,25,31,38,65,70,78,88,98,55];
const raidReward=stage=>stage===10?2000000:stage*10000;
const elementBiome=type=>({5:"cave",6:"cave",9:"mercury",10:"lava",11:"sea",12:"meadow",7:"meadow",14:"dream",18:"dream",15:"glacier",1:"martial",2:"martial",3:"storm",4:"venom",8:"shadow",13:"storm",16:"dragon",17:"shadow"})[type]||"dream";
function nextRaidStage(biomeId) {
  const progress=biomeProgress(biomeId);
  const available=Math.min(10,Math.floor(progress.found/progress.total*10));
  for(let stage=1;stage<=available;stage++) if(!state.bossWins.includes(biomeId+":"+stage)) return stage;
  return null;
}
function raidBoss(biomeId,stage) {
  const list=RAID_BOSSES[biomeId];
  const id=stage===10?list.mythic:list.legendary[(stage-1)%list.legendary.length];
  return {id,name:BY_ID.get(id).name,tier:stage===10?"mythic":"legendary"};
}
function renderRaidGate() {
  const stage=nextRaidStage(state.biome), gate=$("raidGate");
  gate.classList.toggle("hidden",stage===null);
  if(stage!==null) {
    const boss=raidBoss(state.biome,stage);
    $("raidGateText").textContent=biomeById(state.biome).name+" 도감 "+(stage*10)+"% 보스 · "+boss.name+" ("+(stage===10?"초전설":"준전설")+")";
  }
}
function forceRaidIfReady() {
  if (pendingCatch || fishingPhase!=="idle" || !$("raidOverlay").classList.contains("hidden") ||
      !$("catchOverlay").classList.contains("hidden") || !$("unlockOverlay").classList.contains("hidden")) return;
  const stage=nextRaidStage(state.biome);
  if(stage===null)return;
  const key=state.biome+":"+stage;
  if(state.lastRaidAttempt?.key===key && state.lastRaidAttempt.catches===state.totalCatches)return;
  openRaid();
}
function openRaid() {
  if (pendingCatch || fishingPhase!=="idle" || !$("raidOverlay").classList.contains("hidden")) return;
  const stage=nextRaidStage(state.biome);
  if(stage===null)return;
  const boss=raidBoss(state.biome,stage);
  const hp=RAID_HP[stage],rules=window.RaidRules;
  const bossProfile=rules?.profile(BY_ID.get(boss.id),false);
  activeRaid={biome:state.biome,stage,boss,bossHp:hp,bossMaxHp:hp,bossAttack:RAID_AOE[stage],bossProfile,
    party:state.bag.slice(0,5).map((item,index)=>{
      const p=BY_ID.get(item.id),base=RAID_STATS[p.tier],bonus=item.shiny?1.2:1;
      const profile=rules?.profile(p,item.shiny,item.form);
      return {item,slot:index,name:itemName(item),tier:SPECIAL_FORMS[item.form]?.combatTier||(item.form?"mythic":p.tier),profile,
        move:profile?profile.moves[0].name:RAID_ELEMENTS[item.biome||p.biome]+" "+base.move,
        hp:profile?profile.hp:Math.round(base.hp*bonus),maxHp:profile?profile.hp:Math.round(base.hp*bonus),
        attack:profile?Math.max(profile.attack,profile.special):Math.round(base.attack*bonus),
        interval:profile?.interval||base.interval,next:.5+index*.12};
    }),elapsed:0,nextBoss:.75,running:false,result:null};
  state.lastRaidAttempt={key:state.biome+":"+stage,catches:state.totalCatches};
  persist();
  $("raidTitle").textContent=biomeById(state.biome).name+" 레이드방";
  $("raidSubtitle").textContent="도감 "+(stage*10)+"% · "+(stage===10?"초전설":"준전설")+" 보스 · 승리 보상 ✦ "+formatMoney(raidReward(stage))+" · 쓰러진 포켓몬은 가방에서 사라집니다.";
  const sprite=$("raidBossSprite");sprite.src=spriteUrl({id:boss.id,shiny:false});sprite.dataset.pokemonId=boss.id;sprite.dataset.shiny="0";sprite.alt=boss.name;
  $("raidBossName").textContent=boss.name;
  $("raidStartButton").disabled=true;
  $("raidStartButton").textContent="자동 전투 중";
  $("raidExitButton").disabled=true;
  $("raidLog").textContent="레이드 진입! 보스 "+boss.name+"이(가) 나타났습니다.";
  $("raidOverlay").classList.remove("hidden");
  renderRaidRoom();
  raidScene?.show(activeRaid);
  if(activeRaid.party.length) startRaid();
  else {
    activeRaid.running=true;
    finishRaid(false);
    $("raidLog").textContent="가방에 포켓몬이 없어 입장 즉시 패배했습니다. "+$("raidLog").textContent;
  }
}
function renderRaidRoom() {
  if(!activeRaid)return;
  const raid=activeRaid;
  $("raidBossHpBar").style.width=Math.max(0,raid.bossHp/raid.bossMaxHp*100)+"%";
  $("raidBossHpText").textContent=Math.max(0,raid.bossHp)+" / "+raid.bossMaxHp+" HP";
  $("raidParty").innerHTML=raid.party.map((fighter,index)=>'<div class="raid-fighter'+(fighter.hp<=0?' fainted':'')+'">'+spriteMarkup(fighter.item,"")+'<strong>'+fighter.name+'</strong><small>'+fighter.move+'</small><small>ATK '+fighter.attack+' · HP '+Math.max(0,fighter.hp)+'</small><div class="raid-hp"><span style="width:'+Math.max(0,fighter.hp/fighter.maxHp*100)+'%"></span></div></div>').join("");
}
function finishRaid(won) {
  if(!activeRaid || !activeRaid.running)return;
  clearInterval(raidTimer);raidTimer=null;activeRaid.running=false;
  const raid=activeRaid;
  raid.result=won?"won":"lost";
  const fallenSlots=new Set(raid.party.filter(fighter=>fighter.hp<=0).map(fighter=>fighter.slot));
  if(fallenSlots.size) state.bag=state.bag.filter((_,index)=>!fallenSlots.has(index));
  const fallenMessage=fallenSlots.size?" · 쓰러진 포켓몬 "+fallenSlots.size+"마리는 가방에서 사라졌습니다.":"";
  if(won) {
    const key=raid.biome+":"+raid.stage;
    const firstWin=!state.bossWins.includes(key);
    if(firstWin){state.bossWins.push(key);state.money+=raidReward(raid.stage);}
    $("raidLog").textContent="승리! "+raid.boss.name+"을(를) 쓰러뜨렸습니다. 보상 ✦ "+formatMoney(firstWin?raidReward(raid.stage):0)+" 코인 · 생존 "+raid.party.filter(p=>p.hp>0).length+"마리"+fallenMessage;
    [523,659,784,1046].forEach((n,i)=>playTone(n,.16,"triangle",.04,i*.12));
  } else {
    const regional=new Set(speciesIn(raid.biome).map(p=>p.id));
    const alreadyLost=new Set(state.lostDex[raid.biome]||[]);
    const found=state.discovered.filter(id=>regional.has(id)&&!alreadyLost.has(id));
    const removed=[];
    for(let i=0;i<5&&found.length;i++){
      const index=Math.floor(randomUnit()*found.length);
      removed.push(found.splice(index,1)[0]);
    }
    state.lostDex[raid.biome]=[...alreadyLost,...removed];
    $("raidLog").textContent="패배했습니다. "+biomeById(raid.biome).name+" 도감의 발견 기록 "+removed.length+"종이 지워졌습니다. 포켓몬을 보강하고 다시 도전하세요. 생존한 포켓몬은 가방에 남습니다."+fallenMessage;
    playTone(220,.3,"sawtooth",.04);
  }
  $("raidStartButton").disabled=true;
  $("raidStartButton").textContent=won?"레이드 승리":"레이드 패배";
  $("raidExitButton").disabled=false;
  persist();render();renderRaidRoom();
}
function raidTick() {
  if(!activeRaid?.running)return;
  const raid=activeRaid,rules=window.RaidRules;raid.elapsed+=.4;
  let message="";
  for(let index=0;index<raid.party.length;index++) {
    const fighter=raid.party[index];
    if(fighter.hp<=0||raid.elapsed<fighter.next)continue;
    fighter.next+=fighter.interval;
    const move=rules&&fighter.profile&&raid.bossProfile?rules.bestMove(fighter.profile,raid.bossProfile):null;
    let damage=move?rules.damage(fighter.profile,raid.bossProfile,move,.9+randomUnit()*.2):Math.max(1,Math.round(fighter.attack*(.85+randomUnit()*.3)));
    raid.bossHp=Math.max(0,raid.bossHp-damage);
    raidScene?.attack(index,-1,move?elementBiome(move.type):fighter.item.biome,damage);
    const effect=move?.effectiveness===0?" · 효과 없음":move?.effectiveness>=2?" · 효과가 굉장했다!":move?.effectiveness<1?" · 효과가 약했다":"";
    fighter.move=move?.name||fighter.move;
    message=fighter.name+"의 "+fighter.move+"! "+damage+" 피해"+effect;
    if(raid.bossHp<=0)break;
  }
  if(raid.bossHp<=0) {renderRaidRoom();finishRaid(raid.party.some(p=>p.hp>0));return;}
  if(raid.elapsed>=raid.nextBoss) {
    raid.nextBoss+=raid.stage===10?1:raid.stage>=5?.8:1.05;
    const alive=raid.party.map((fighter,index)=>({fighter,index})).filter(x=>x.fighter.hp>0);
    if(alive.length) {
      raidScene?.areaBurst?.(raid.biome);
      const bossMove=rules&&raid.bossProfile?raid.bossProfile.moves.map(m=>({...m,score:(m.category==="physical"?raid.bossProfile.attack:raid.bossProfile.special)*m.power*alive.reduce((n,x)=>n+rules.effectiveness(m.type,x.fighter.profile.types),0)})).sort((a,b)=>b.score-a.score)[0]:null;
      const hits=[];
      for(const target of alive) {
        const eff=bossMove?rules.effectiveness(bossMove.type,target.fighter.profile.types):1;
        const defense=bossMove?.category==="special"?(target.fighter.profile?.specialDefense||target.fighter.profile?.defense||100):(target.fighter.profile?.defense||100);
        const offense=bossMove?(bossMove.category==="physical"?raid.bossProfile.attack:raid.bossProfile.special):160;
        const moveScale=bossMove?Math.max(.8,Math.min(1.3,offense/160))*bossMove.power/100:1;
        const damage=eff===0?0:Math.max(1,Math.round(raid.bossAttack*moveScale*eff*(100/(75+defense*.2))));
        target.fighter.hp=Math.max(0,target.fighter.hp-damage);
        if(damage>0)raidScene?.attack(-1,target.index,bossMove?elementBiome(bossMove.type):raid.biome,damage);
        hits.push(target.fighter.name+(eff===0?" 무효":(damage+" 피해"+(eff>=2?" · 효과가 굉장했다!":eff<1?" · 효과가 약했다":""))));
      }
      message=raid.boss.name+"의 광역 "+(bossMove?.name||RAID_ELEMENTS[raid.biome]+" 폭발")+"! 파티 전원 공격 · "+hits.join(" / ");
    }
  }
  if(message)$("raidLog").textContent=message;
  renderRaidRoom();
  if(raid.party.every(p=>p.hp<=0))finishRaid(false);
}
function startRaid() {
  if(!activeRaid||activeRaid.running||!activeRaid.party.length)return;
  activeRaid.running=true;
  $("raidStartButton").disabled=true;$("raidExitButton").disabled=true;
  $("raidStartButton").textContent="자동 전투 중";
  $("raidLog").textContent="자동 전투 시작! 포켓몬들이 전장에서 기술을 사용합니다.";
  raidTimer=setInterval(raidTick,400);
}
function closeRaid() {
  if(activeRaid?.running)return;
  const won=activeRaid?.result==="won";
  activeRaid=null;
  raidScene?.hide();
  $("raidOverlay").classList.add("hidden");
  $("raidEnterButton").focus();
  if(won) forceRaidIfReady();
}
$("raidEnterButton").addEventListener("click",openRaid);
$("raidStartButton").addEventListener("click",startRaid);
$("raidExitButton").addEventListener("click",closeRaid);

function render() { updateHeader(); renderBiomes(); updateRod(); updateLastCatch(); renderTab(); renderRaidGate(); }

function showCatch(item) {
  pendingCatch=item;
  const p=BY_ID.get(item.id);
  const modal=$("catchOverlay").querySelector(".catch-modal");
  modal.classList.toggle("shiny",item.shiny);
  modal.classList.toggle("special-form",!!item.form);
  modal.classList.toggle("mega-form",SPECIAL_FORMS[item.form]?.kind==="mega");
  modal.classList.toggle("primal-form",SPECIAL_FORMS[item.form]?.kind==="primal");
  $("modalStars").textContent=item.shiny?"✦ ✷ ✦ ✷ ✦":"✦   ✧   ✦";
  $("modalKicker").textContent=SPECIAL_FORMS[item.form]?.kind==="mega"?"MEGA EVOLUTION":SPECIAL_FORMS[item.form]?.kind==="primal"?"PRIMAL REVERSION":item.form?"TRANSCENDENT FORM · MYTHIC":item.shiny?"SHINY ENCOUNTER · 1 / "+Math.round(1/(currentRod().shinyRate||SHINY_RATE)):"A NEW CATCH!";
  $("catchTitle").textContent=SPECIAL_FORMS[item.form]?.kind==="mega"?"메가진화 포켓몬!":SPECIAL_FORMS[item.form]?.kind==="primal"?"원시회귀 포켓몬!":item.form?"특수 폼 등장!":item.shiny?"이로치 포켓몬!":p.tier==="mythic"?"초전설 등장!":p.tier==="legendary"?"전설적인 입질!":"낚시 성공!";
  const sprite=$("catchSprite");
  sprite.style.visibility="visible";
  sprite.src=spriteUrl(item); sprite.classList.toggle("special-form",!!item.form); sprite.dataset.pokemonId=item.id; sprite.dataset.shiny=item.shiny?"1":"0"; sprite.dataset.form=item.form||""; sprite.dataset.fallback="";
  sprite.alt=(item.shiny?"이로치 ":"")+itemName(item);
  $("catchSpriteWrap").style.background='radial-gradient(circle,'+(item.shiny?"#ffdf98":TIERS[displayTier(item)].color)+'99 0,#275a6a 49%,transparent 51%)';
  $("catchInfo").innerHTML=rarityMarkup(displayTier(item))+formMarkup(item)+shinyMarkup(item.shiny)+'<div class="catch-name">'+itemName(item)+'</div><div class="catch-sub">'+biomeById(item.biome||p.biome).name+' · 전국도감 No. '+String(p.id).padStart(4,"0")+'</div><div class="catch-value">'+(item.shiny?"이로치 판매가 10배 · ":"판매가 ")+'<strong>✦ '+formatMoney(salePrice(item))+'</strong> 코인</div>';
  $("sellCatchButton").textContent='바로 판매 · ✦ '+formatMoney(salePrice(item));
  $("keepButton").disabled=false;
  $("keepButton").textContent=state.bag.length>=5?"기존 포켓몬과 교체":"가방에 보관";
  $("swapPanel").classList.add("hidden");
  $("catchChoiceNote").textContent=state.bag.length>=5?"이번 포켓몬을 판매하거나, 교체할 기존 포켓몬을 선택하세요.":"가방에 보관하면 레이드에서 자동 전투합니다.";
  if(state.bag.length>=5)$("swapPanel").innerHTML='<strong>파티 교체 · 기존 포켓몬을 팔고 새 포켓몬을 보관</strong>'+state.bag.map((old,index)=>'<button data-swap="'+index+'"><span>'+itemName(old)+(old.shiny?" ✦":"")+'</span><span>판매 +'+formatMoney(salePrice(old))+' 코인</span></button>').join("");
  $("catchOverlay").classList.remove("hidden");
  $("keepButton").focus();
  playCatchSound(item);
}
function closeCatch() {
  pendingCatch=null;
  $("catchOverlay").classList.add("hidden");
  $("castButton").focus();
}
function showUnlock(index) {
  const biome=BIOMES[index];
  $("unlockIcon").textContent=biome.icon;
  $("unlockTitle").textContent=biome.name+" 개방!";
  $("unlockDescription").textContent=BIOMES[index-1].name+" 도감을 완성했습니다. "+biome.hint+" 새 낚싯대가 지급됩니다.";
  $("unlockOverlay").classList.remove("hidden");
  $("unlockButton").focus();
  [523,659,784,1046].forEach((n,i)=>playTone(n,.2,"triangle",.05,i*.12));
}
function settleCatch(sell) {
  if (!pendingCatch) return;
  const item=pendingCatch, p=BY_ID.get(item.id);
  if (!sell && state.bag.length>=5) { $("swapPanel").classList.remove("hidden"); $("keepButton").textContent="교체할 포켓몬을 아래에서 선택"; return; }
  if (sell) {
    state.money+=salePrice(item);
    showToast((item.shiny?"✦ 이로치 ":"")+itemName(item)+" 판매! ✦ "+formatMoney(salePrice(item)));
    playTone(650,.12); playTone(880,.15,"square",.025,.12);
  } else {
    state.bag.unshift(item);
    showToast((item.shiny?"✦ 이로치 ":"")+itemName(item)+"을(를) 가방에 보관했어요!");
  }
  persist(); closeCatch(); render();
  if (pendingUnlock !== null) showUnlock(pendingUnlock);
  else forceRaidIfReady();
}
function replaceCatch(index) {
  if(!pendingCatch||state.bag.length<5||!Number.isInteger(index)||index<0||index>=state.bag.length)return;
  const outgoing=state.bag.splice(index,1)[0],incoming=pendingCatch;
  state.money+=salePrice(outgoing);
  state.bag.unshift(incoming);
  persist();closeCatch();render();
  showToast(itemName(outgoing)+" 판매 · "+itemName(incoming)+" 파티 합류!");
  if(pendingUnlock!==null)showUnlock(pendingUnlock);
  else forceRaidIfReady();
}
$("swapPanel").addEventListener("click",e=>{
  const button=e.target.closest("button[data-swap]");
  if(button)replaceCatch(Number(button.dataset.swap));
});
function advanceBiome() {
  if (pendingUnlock===null) return;
  const id=BIOMES[pendingUnlock].id;
  pendingUnlock=null;
  $("unlockOverlay").classList.add("hidden");
  switchBiome(id);
}
function switchBiome(id) {
  if (!isUnlocked(id) || fishingPhase!=="idle" || pendingCatch || !$("raidOverlay").classList.contains("hidden")) return;
  state.biome=id;
  if (!state.ownedRods.includes(STARTER_ROD[id])) state.ownedRods.push(STARTER_ROD[id]);
  if (!state.ownedRods.includes(state.equipped[id])) state.equipped[id]=STARTER_ROD[id];
  $("sceneStatus").textContent=biomeById(id).hint;
  $("hookPanel").classList.add("hidden");
  persist(); render();
  showToast(biomeById(id).name+"에 도착했어요!");
  forceRaidIfReady();
}
function positionAt(now) {
  const step=((now-hookStarted)/hookTravel)%2;
  return step<=1?step:2-step;
}
function startHook() {
  if (fishingPhase!=="waiting") return;
  fishingPhase="hook";
  hookStarted=performance.now();
  hookTravel=250+randomUnit()*750;
  $("sceneStatus").textContent="입질이다! 중앙에서 낚아채세요!";
  $("hookPanel").classList.remove("hidden","missed","success");
  $("hookHint").textContent="8초 안에 빨간 중앙에 들어왔을 때 멈추세요";
  $("hookButton").disabled=false;
  $("hookButton").textContent="SPACE / 클릭으로 낚아채기";
  $("hookPanel").scrollIntoView?.({behavior:"smooth",block:"nearest"});
  playTone(880,.12,"square",.035);
}
function setCastButton(active) {
  $("castButton").disabled=!active;
  $("castButton").innerHTML=active?'<span>✦</span> 낚싯대 던지기 <span>↗</span>':'<span>⌁</span> 입질을 기다리는 중... <span>⌁</span>';
}
function cast() {
  if (fishingPhase!=="idle" || pendingCatch || !$("unlockOverlay").classList.contains("hidden") || !$("raidOverlay").classList.contains("hidden")) return;
  fishingPhase="casting";
  castStarted=performance.now();
  $("hookPanel").classList.add("hidden");
  setCastButton(false);
  $("sceneStatus").textContent="낚싯대를 힘껏 던졌어요!";
  playTone(340,.1,"triangle",.03);
  setTimeout(()=>{
    if (fishingPhase!=="casting") return;
    fishingPhase="waiting";
    $("sceneStatus").textContent="수면 아래에서 무언가 움직입니다...";
    playTone(480,.12,"triangle",.025);
  },900);
  setTimeout(startHook,1650);
}
function missHook(reason) {
  if (fishingPhase!=="hook") return;
  fishingPhase="miss";
  state.misses++;
  persist();
  $("hookPanel").classList.add("missed");
  $("hookPanel").querySelector(".hook-alert").textContent="✕ 놓쳤어요!";
  $("hookHint").textContent=reason||"중앙 영역을 벗어났어요. 다시 도전!";
  $("hookButton").disabled=true;
  $("hookButton").textContent="다음 입질을 준비하는 중...";
  $("sceneStatus").textContent="포켓몬이 도망쳤어요!";
  playTone(270,.18,"sawtooth",.02);
  setTimeout(()=>{
    if (fishingPhase!=="miss") return;
    fishingPhase="idle";
    $("hookPanel").classList.add("hidden");
    $("hookPanel").querySelector(".hook-alert").textContent="⚡ 입질이다!";
    setCastButton(true);
    $("sceneStatus").textContent="다시 낚싯대를 던져보세요!";
  },950);
}
function hook() {
  if (fishingPhase!=="hook") return;
  const position=positionAt(performance.now());
  $("hookCursor").style.left=(position*100)+"%";
  if (Math.abs(position-.5)>currentRod().target/2) { missHook("중앙을 놓쳤어요! 다시 도전하세요."); return; }
  fishingPhase="idle";
  $("hookPanel").classList.add("success","hidden");
  $("hookPanel").querySelector(".hook-alert").textContent="⚡ 입질이다!";
  setCastButton(true);
  const unlockedBefore=unlockedIndexFor(state.discovered);
  const item=rollCatch(), p=BY_ID.get(item.id);
  state.totalCatches++;
  state.lastCatch=item;
  if (!state.discovered.includes(item.id)) state.discovered.push(item.id);
  state.lostDex[state.biome]=(state.lostDex[state.biome]||[]).filter(id=>id!==item.id);
  if (item.shiny && !state.shinyDiscovered.includes(item.id)) state.shinyDiscovered.push(item.id);
  const unlockedAfter=unlockedIndexFor(state.discovered);
  if (unlockedAfter>unlockedBefore) {
    pendingUnlock=unlockedAfter;
    state.ownedRods.push(STARTER_ROD[BIOMES[unlockedAfter].id]);
    state.ownedRods=[...new Set(state.ownedRods)];
  }
  $("sceneStatus").textContent=(item.shiny?"이로치 ":"")+itemName(item)+"을(를) 낚았어요!";
  persist(); render(); showCatch(item);
}
document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",()=>{currentTab=tab.dataset.tab;renderTab();}));
$("biomeStrip").addEventListener("click",e=>{
  const button=e.target.closest("button[data-biome]");
  if (button) switchBiome(button.dataset.biome);
});
$("tabContent").addEventListener("click",e=>{
  const btn=e.target.closest("button[data-action]");
  if (!btn) return;
  const action=btn.dataset.action;
  if (action==="reserve-move") {
    const index=Number(btn.dataset.index);
    if(!Number.isInteger(index)||index<0||index>=state.reserve.length)return;
    if(state.bag.length>=5){showToast("가방의 포켓몬 한 마리를 먼저 판매해 주세요.");return;}
    state.bag.unshift(state.reserve.splice(index,1)[0]);persist();render();showToast("보관함에서 파티로 이동했어요!");
  } else if (action==="reserve-sell") {
    const index=Number(btn.dataset.index);
    if(!Number.isInteger(index)||index<0||index>=state.reserve.length)return;
    const item=state.reserve.splice(index,1)[0];state.money+=salePrice(item);persist();render();showToast(itemName(item)+" 판매! ✦ "+formatMoney(salePrice(item)));
  } else if (action==="sell") {
    const index=Number(btn.dataset.index);
    if (!Number.isInteger(index)||index<0||index>=state.bag.length) return;
    const [item]=state.bag.splice(index,1), p=BY_ID.get(item.id);
    state.money+=salePrice(item);
    persist(); render(); showToast((item.shiny?"✦ 이로치 ":"")+itemName(item)+" 판매! ✦ "+formatMoney(salePrice(item))); playTone(650,.1);
  } else if (action==="sell-all") {
    if (!state.bag.length) return;
    const count=state.bag.length, sum=state.bag.reduce((n,item)=>n+salePrice(item),0);
    state.bag=[]; state.money+=sum;
    persist(); render(); showToast(count+"마리 판매! ✦ "+formatMoney(sum)); playTone(790,.2);
  } else if (action==="buy") {
    const index=Number(btn.dataset.rod), rod=RODS[index];
    if (!rod||rod.biome!==state.biome||state.ownedRods.includes(index)||state.money<rod.price) return;
    state.money-=rod.price; state.ownedRods.push(index); state.equipped[state.biome]=index;
    persist(); render(); showToast(rod.name+" 구매 완료!"); playTone(523,.1); playTone(784,.2,"triangle",.04,.12);
  } else if (action==="equip") {
    const index=Number(btn.dataset.rod), rod=RODS[index];
    if (!rod||rod.biome!==state.biome||!state.ownedRods.includes(index)) return;
    state.equipped[state.biome]=index; persist(); render(); showToast(rod.name+" 장착!");
  }
});
$("castButton").addEventListener("click",cast);
$("hookButton").addEventListener("click",hook);
$("hookGauge").addEventListener("click",hook);
$("hookGauge").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();hook();}});
$("keepButton").addEventListener("click",()=>settleCatch(false));
$("sellCatchButton").addEventListener("click",()=>settleCatch(true));
$("unlockButton").addEventListener("click",advanceBiome);
$("soundButton").addEventListener("click",()=>{state.sound=!state.sound;persist();updateHeader();showToast(state.sound?"소리 켜짐":"소리 꺼짐");if(state.sound)playTone(660,.08);});
window.addEventListener("keydown",e=>{
  if (e.key==="Escape") {
    if (!$("raidOverlay").classList.contains("hidden")) { if (!activeRaid?.running) closeRaid(); return; }
    if (pendingCatch) settleCatch(state.bag.length>=5);
    else if (!$("unlockOverlay").classList.contains("hidden")) advanceBiome();
    return;
  }
  if (e.code!=="Space"||e.repeat||["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) return;
  if (!$("catchOverlay").classList.contains("hidden")||!$("unlockOverlay").classList.contains("hidden")||!$("raidOverlay").classList.contains("hidden")) return;
  e.preventDefault();
  if (fishingPhase==="hook") hook();
  else if (fishingPhase==="idle") cast();
});
document.addEventListener("error",e=>{
  const img=e.target;
  if (!(img instanceof HTMLImageElement)||!img.dataset.pokemonId) return;
  const id=img.dataset.pokemonId;
  if (img.dataset.form && !img.dataset.fallback) {
    img.dataset.fallback="form-base";
    img.src="./sprites/"+(img.dataset.shiny==="1"?"shiny/":"")+id+".png";
  } else if (img.dataset.shiny==="1" && !img.dataset.fallback) {
    img.dataset.fallback="normal";
    img.src="./sprites/"+id+".png";
  } else if (!img.dataset.fallback || img.dataset.fallback==="normal" || img.dataset.fallback==="form-base") {
    img.dataset.fallback="remote";
    img.src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+id+".png";
  } else img.style.visibility="hidden";
},true);

// Pixel scenes are drawn locally, without runtime image requests.
const canvas=$("seaCanvas"), ctx=canvas.getContext("2d");
ctx.imageSmoothingEnabled=false;
let frame=0;
const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function cloud(x,y) {
  rect(x+8,y,34,6,"#d9f4df");rect(x,y+6,52,9,"#f2f4d9");rect(x+13,y-5,22,5,"#e5f7dc");rect(x+5,y+15,43,3,"#acd5cf");
}
function drawSea(t) {
  rect(0,0,480,264,"#7dcbd0");
  rect(0,0,480,27,"#7ec3cb");rect(0,27,480,32,"#92d0cb");rect(0,59,480,34,"#acd9c7");rect(0,93,480,31,"#d9d8b4");
  rect(351,29,37,37,"#fae7a3");rect(345,35,49,25,"#fae7a3");rect(354,65,31,4,"#f4dda2");
  cloud(42,41);cloud(216,25);cloud(416,59);
  rect(244,83,13,2,"#597f83");rect(239,85,6,2,"#597f83");rect(257,85,6,2,"#597f83");
  rect(0,112,133,17,"#729994");rect(19,104,75,10,"#729994");rect(43,97,24,8,"#729994");
  rect(317,116,163,13,"#729994");rect(341,109,102,9,"#729994");rect(366,103,55,8,"#729994");
  rect(0,121,480,10,"#66aaa9");
  rect(384,83,6,30,"#f8e3b6");rect(383,81,8,4,"#d06e6d");rect(385,78,4,3,"#3c6475");rect(381,113,12,3,"#486c70");
  rect(375,87,8,2,"#feeaa3");rect(391,87,8,2,"#feeaa3");
  rect(0,130,480,31,"#4d9fa9");rect(0,161,480,27,"#378997");rect(0,188,480,32,"#2c7888");rect(0,220,480,44,"#256a7e");
  for(let i=0;i<12;i++){
    const y=136+i*10,offset=Math.floor(t*(i%3+1)*2)%52;
    for(let x=-55+offset;x<500;x+=52){
      rect(x+(i%2)*20,y,22+(i%3)*7,2,i<4?"#7bc5bd":i<8?"#5caaac":"#3a90a0");
      if(i%3===0)rect(x+14,y+3,10,1,"#b2dbce");
    }
  }
  for(let i=0;i<8;i++)rect(364-(i%2)*12,137+i*13,25+i*2,2,i<3?"#a9d4b0":"#7ab9b0");
  rect(195,117,39,4,"#354f62");rect(201,121,26,3,"#324e5c");rect(213,96,2,21,"#354e5d");
  rect(215,99,13,17,"#f6e5bd");rect(202,105,10,10,"#c9e2cc");
}
function drawCrystal(x,y,size,color) {
  rect(x-size/2,y-size,size,size*1.5,color);
  rect(x-size/2+3,y-size-7,size-6,8,"#e8dcff");
  rect(x,y-size+2,3,size*1.4,"#fff0ff");
  rect(x-size/2-3,y+size*.4,size+6,5,"#394267");
}
function drawCave(t) {
  // Soil strata, roots, pebbles and a dark mining shaft replace the crystal lake.
  rect(0,0,480,264,"#2b211d");
  rect(0,0,480,44,"#35271f");rect(0,44,480,46,"#51382a");rect(0,90,480,48,"#6c4730");
  rect(0,138,480,44,"#855937");rect(0,182,480,46,"#70472d");rect(0,228,480,36,"#4e3528");
  rect(185,28,112,86,"#201b19");rect(197,28,88,86,"#30251e");
  rect(202,27,78,5,"#a2774c");rect(216,30,6,84,"#87613e");rect(260,30,6,84,"#87613e");
  for(let i=0;i<18;i++){
    const x=(i*31+9)%480,y=14+(i*37)%207;
    rect(x,y,13+i%3*3,3,i%2?"#b17c49":"#4c3324");
    rect(x+4,y+4,7,2,"#c0935a");
  }
  for(let i=0;i<9;i++){
    const x=i*59-7;
    rect(x,0,5,18+i%3*8,"#704e32");rect(x+3,17+i%3*8,3,11,"#856041");
    rect(x+15,79+i%4*18,19,7,"#493b2f");rect(x+18,76+i%4*18,13,4,"#8f7b5b");
  }
  for(let i=0;i<8;i++){
    const x=27+i*60,y=150+i%3*18;
    rect(x,y,11,6,"#9f815d");rect(x+2,y-3,6,3,"#b89a71");
    rect(x+23,y+11,5,4,"#d1aa72");
  }
  // Drifting grains keep the scene alive without making the soil look like water.
  for(let i=0;i<7;i++){
    const x=(i*71+Math.floor(t*5))%480,y=52+(i*31)%112;
    rect(x,y,2,2,"#bd8d5a");
  }
}
function drawLava(t) {
  rect(0,0,480,264,"#472d41");
  rect(0,0,480,52,"#39283a");rect(0,52,480,36,"#613543");rect(0,88,480,39,"#a44b44");
  rect(303,14,78,106,"#3d303d");rect(323,4,39,115,"#46323f");
  rect(0,103,127,33,"#392e3a");rect(25,85,72,48,"#3f303b");
  rect(352,101,128,33,"#382b34");rect(381,83,70,53,"#40303b");
  rect(116,112,215,22,"#523038");rect(161,98,130,33,"#65403f");
  rect(0,130,480,34,"#c2573c");rect(0,164,480,38,"#dc743d");rect(0,202,480,62,"#c95535");
  for(let i=0;i<9;i++){
    const y=141+i*14,offset=Math.floor(t*5*(i%3+1))%61;
    for(let x=-60+offset;x<500;x+=60){
      rect(x+(i%2)*11,y,20+(i%3)*8,4,i%2?"#ffa454":"#ffba5c");
      rect(x+9,y+5,11,2,"#e45d38");
    }
  }
  for(let i=0;i<8;i++){
    const x=(i*71+Math.floor(t*11*(i%3+1)))%480,y=55+i*23+(i%2)*4;
    rect(x,y,3,4,i%2?"#ffda76":"#ff8d5c");
    rect(x+1,y-4,1,3,"#fff1a2");
  }
  rect(415,115,43,11,"#3e3035");rect(428,102,18,17,"#46333b");
  rect(441,127,14,3,"#ffcf63");rect(316,160,24,5,"#ffd270");
  for(let i=0;i<4;i++){
    const x=267+i*48,y=186+(i%2)*24;
    rect(x,y+Math.sin(t*3+i)*2,4,4,"#ffe095");
  }
}
function drawMercury(t) {
  rect(0,0,480,264,"#263e50");
  rect(0,0,480,92,"#405f70");rect(0,74,480,55,"#7795a0");
  for(let i=0;i<7;i++){const x=i*83-18;rect(x,23,39,97,"#334b5b");rect(x+8,10,22,17,"#6d8994");rect(x+11,38,17,3,"#a9f5f0");rect(x+8,48,23,2,"#5a7788");}
  rect(0,126,480,138,"#829fa9");rect(0,155,480,109,"#adcbd1");rect(0,204,480,60,"#6d9ca9");
  for(let i=0;i<8;i++){const y=139+i*16,offset=Math.floor(t*13*(i%3+1))%82;for(let x=-82+offset;x<480;x+=82){rect(x,y,42,3,i%2?"#d9f8f5":"#def1e8");rect(x+12,y+5,18,2,"#88b9bf");}}
  for(let i=0;i<6;i++){const x=230+i*44,y=92+(i%3)*11;rect(x,y,28,7,"#ceeae5");rect(x+7,y-5,13,5,"#7aadb4");rect(x+10,y+7,4,5,"#eafbf5");}
  for(let i=0;i<4;i++){const x=290+i*45,y=186+(i%2)*28;rect(x,y+Math.sin(t*2+i)*3,8,3,"#f1fff4");}
}
function drawGlacier(t) {
  rect(0,0,480,264,"#88b9d0");rect(0,0,480,68,"#6d9bbb");rect(0,68,480,53,"#b3d7df");
  for(let i=0;i<7;i++){const x=i*84-20;rect(x,102-(i%3)*18,52,27+(i%3)*18,"#e5f7f7");rect(x+8,84-(i%3)*18,29,21,"#c9e8f0");rect(x+17,74-(i%3)*18,12,12,"#fbffef");}
  rect(0,127,480,137,"#69acc7");rect(0,179,480,85,"#467fae");rect(0,224,480,40,"#376c9a");
  for(let i=0;i<11;i++){const y=137+i*12,offset=Math.floor(t*3*(i%3+1))%58;for(let x=-58+offset;x<500;x+=58)rect(x,y,26,2,i%2?"#a8e6ec":"#daffff");}
  for(let i=0;i<13;i++){const x=(i*47+Math.floor(t*3))%480,y=(i*37)%114;rect(x,y,3,3,"#eefaff");rect(x+1,y-3,1,9,"#d9f5ff");}
  for(let i=0;i<4;i++){const x=275+i*49;rect(x,110,32,9,"#d8f4f4");rect(x+6,102,17,8,"#f4ffff");}
}
function drawMeadow(t) {
  rect(0,0,480,264,"#91d8ba");rect(0,0,480,83,"#a9ead0");rect(0,83,480,45,"#d6ebad");
  cloud(37,30);cloud(287,26);rect(365,22,30,30,"#ffed9d");
  rect(0,110,480,27,"#6eaf79");rect(0,122,480,24,"#4b945f");
  for(let i=0;i<10;i++){const x=i*53;rect(x,106-(i%3)*12,16,30+(i%3)*12,"#477f5c");rect(x-9,93-(i%3)*12,34,14,"#6aba79");rect(x-4,85-(i%3)*12,23,13,"#91d987");}
  rect(0,139,480,125,"#3d947e");rect(0,192,480,72,"#287e78");
  for(let i=0;i<9;i++){const y=146+i*14,offset=Math.floor(t*4*(i%3+1))%66;for(let x=-66+offset;x<500;x+=66){rect(x,y,25,2,"#8acb95");rect(x+12,y+4,10,2,"#c6e9a9");}}
  for(let i=0;i<13;i++){const x=(i*71)%480,y=104+(i%4)*9;rect(x,y,3,6,"#ffdb9f");rect(x-3,y-2,9,3,i%2?"#ffb9c4":"#fff0af");}
  for(let i=0;i<5;i++){const x=245+i*43;rect(x,189,3,13,"#83d889");rect(x-4,186,10,5,i%2?"#f7c6d3":"#fce49c");}
}
function drawDream(t) {
  rect(0,0,480,264,"#b58bbf");rect(0,0,480,76,"#d9a7ce");rect(0,76,480,55,"#f7bfd8");
  for(let i=0;i<5;i++){const x=i*112-15;rect(x,96,57,28,"#b87aaf");rect(x+10,80,38,18,"#ebacd5");rect(x+18,68,21,15,"#ffdbeb");}
  rect(0,129,480,135,"#e69ecb");rect(0,171,480,93,"#c87bb8");rect(0,217,480,47,"#a665ae");
  for(let i=0;i<9;i++){const y=141+i*14,offset=Math.floor(t*6*(i%3+1))%62;for(let x=-62+offset;x<500;x+=62){rect(x,y,27,3,i%2?"#ffe3f1":"#ffc8e6");rect(x+13,y+5,9,2,"#ffeafa");}}
  for(let i=0;i<15;i++){const x=(i*67+Math.sin(t+i)*7+480)%480,y=112+(i*43)%115-Math.sin(t*1.4+i)*9;const r=3+i%4;rect(x-r,y-r,r*2,r*2,i%3?"#ffd8ef":"#fff3fa");rect(x-r+2,y-r+2,2,2,"#fffafa");}
  for(let i=0;i<5;i++){const x=230+i*52;rect(x,111,25,8,"#ffc9e6");rect(x+4,106,12,5,"#ffeaf4");}
}

function drawStorm(t) {
  rect(0,0,480,264,"#7db1cc");rect(0,0,480,78,"#6a94b5");
  for(let i=0;i<7;i++){const x=(i*91+Math.sin(t*.35+i)*12+480)%480,y=26+i%3*27;rect(x,y,75,13,"#bbceda");rect(x+12,y-8,40,9,"#e0e8dc");}
  rect(0,117,480,24,"#556b8b");rect(0,141,480,123,"#537d9e");
  for(let i=0;i<10;i++){const x=i*58,y=115+i%3*13;rect(x,y,48,11,"#5c718f");rect(x+8,y-8,30,8,"#9db3c2");}
  for(let i=0;i<12;i++){const x=(i*57+t*8)%500-20,y=158+i%4*23;rect(x,y,22,3,"#a9d2dd");rect(x+9,y+5,12,2,"#e2f2e7");}
  if(Math.sin(t*2.1)>.66){const x=320+Math.round(Math.sin(t)*64);rect(x,45,4,28,"#fff5b5");rect(x-4,72,8,21,"#ffe280");rect(x+2,89,4,25,"#fff8c2");}
  for(let i=0;i<7;i++){const x=225+i*39;rect(x,135+i%3*17,3,3,"#ffe999");}
}
function drawShadow(t) {
  rect(0,0,480,264,"#292b4b");rect(0,0,480,83,"#3c385b");
  rect(370,19,29,29,"#d7bce9");rect(378,18,25,27,"#3c385b");
  for(let i=0;i<9;i++){const x=i*61;rect(x,78-i%3*19,16,75,"#242b40");rect(x-8,81-i%3*19,32,10,"#4e4a68");}
  rect(0,143,480,121,"#494a65");rect(0,186,480,78,"#353753");
  for(let i=0;i<11;i++){const x=(i*53+Math.sin(t+i)*4+480)%480,y=155+i%4*21;rect(x,y,25,3,"#8c7da8");rect(x+8,y+5,12,2,"#bc9fd2");}
  for(let i=0;i<7;i++){const x=225+i*36,y=136+i%3*15+Math.sin(t*1.3+i)*4;rect(x,y,4,4,"#d7b3fa");rect(x+2,y-4,2,3,"#f4d5ff");}
}
function drawMartial(t) {
  rect(0,0,480,264,"#f3bb92");rect(0,0,480,78,"#f9d7a4");rect(395,17,25,25,"#fff0bf");
  for(let i=0;i<5;i++){const x=i*112-12;rect(x,83+i%2*12,80,58,"#ad7777");rect(x+12,71+i%2*12,44,19,"#d59676");}
  rect(0,139,480,125,"#b57568");rect(0,195,480,69,"#9d625d");
  for(let i=0;i<10;i++){const x=i*49;rect(x,151+i%3*21,35,5,"#d9997a");rect(x+12,158+i%3*21,20,3,"#ebbc8e");}
  for(let i=0;i<6;i++){const x=240+i*39;rect(x,132,3,26,"#734f52");rect(x-7,130,17,4,"#e8bf94");rect(x-5,124,13,6,"#f3d8ae");}
  for(let i=0;i<5;i++){const x=282+i*44,y=176+i%2*19;rect(x,y,5,5,Math.sin(t*2+i)>0?"#ffdc99":"#d59879");}
}
function drawDragon(t) {
  rect(0,0,480,264,"#8d9ccd");rect(0,0,480,80,"#788bc2");
  for(let i=0;i<16;i++){const x=(i*43)%480,y=(i*29)%91;rect(x,y,2,2,"#fff0d4");}
  for(let i=0;i<6;i++){const x=i*95-20;rect(x,88+i%3*15,64,36,"#5c6fa3");rect(x+20,72+i%3*15,25,21,"#8798c6");rect(x+33,64+i%3*15,11,12,"#bdc2dc");}
  rect(0,142,480,122,"#7c92c6");rect(0,197,480,67,"#677db1");
  for(let i=0;i<12;i++){const x=(i*55+t*4)%510-30,y=151+i%4*22;rect(x,y,36,4,"#d3daf0");rect(x+11,y-5,21,5,"#f4e9e0");}
  for(let i=0;i<7;i++){const x=221+i*37,y=111+i%2*14;rect(x,y,3,3,"#ffe2ac");}
}
function drawVenom(t) {
  rect(0,0,480,264,"#738c69");rect(0,0,480,85,"#889b70");
  for(let i=0;i<10;i++){const x=i*55;rect(x,73-i%3*10,12,71,"#395b54");rect(x-8,69-i%3*10,27,12,"#789e70");}
  rect(0,140,480,124,"#56886d");rect(0,190,480,74,"#3c6c5b");
  for(let i=0;i<14;i++){const x=(i*39+t*3)%495-8,y=150+i%5*18;rect(x,y,18,3,"#a4ca83");rect(x+5,y+5,9,2,"#c8ea94");}
  for(let i=0;i<10;i++){const x=227+i*27,y=117+(i*31)%91-Math.sin(t+i)*7;rect(x,y,6,6,"#bcec86");rect(x+2,y-3,2,2,"#e6ffb1");}
  for(let i=0;i<5;i++){const x=248+i*47;rect(x,136,4,21,"#738b5b");rect(x-5,132,14,6,"#c0ed8c");}
}
function drawPlatform() {
  if(state.biome==="sea"){
    rect(0,190,184,25,"#805b4a");rect(0,185,192,8,"#aa7656");rect(0,193,180,5,"#b4855d");
    for(let x=2;x<184;x+=25)rect(x,199,2,15,"#664b42");
    rect(21,211,14,53,"#715347");rect(24,214,7,45,"#8f6750");
    rect(151,207,14,57,"#715347");rect(154,211,7,48,"#8f6750");
    rect(0,215,187,3,"#473e3d");
  } else {
    const colors={cave:["#473124","#8c613b","#d4a66d"],lava:["#3d3034","#655051","#b27261"],mercury:["#374c5c","#91b5bd","#e3f5f1"],glacier:["#4a718c","#c0e4e9","#ecffff"],meadow:["#3a755c","#9aca83","#def2aa"],dream:["#76547d","#e7aacb","#ffe0ed"],storm:["#445b79","#bfd4df","#ffe892"],shadow:["#25253e","#665780","#ba9ce2"],martial:["#654d53","#c58e76","#ffcf9f"],dragon:["#455179","#aebae3","#f9daab"],venom:["#3b5648","#7da477","#d6f79a"]}[state.biome];
    const [dark,top,highlight]=colors;
    rect(0,188,183,24,dark);rect(0,183,193,9,top);rect(0,211,178,17,dark);
    rect(20,225,30,39,dark);rect(139,218,34,46,dark);
    for(let x=12;x<180;x+=28)rect(x,187,15,3,highlight);
    if(state.biome==="cave"){rect(16,176,18,8,"#9b7550");rect(20,173,11,3,"#c6a477");rect(147,175,17,9,"#65503b");rect(151,172,9,3,"#ae8a61");}
    else {rect(14,177,15,5,highlight);rect(151,175,17,4,highlight);}
  }
}
function drawFisher() {
  const outfit={cave:["#8a6547","#d5ad78"],lava:["#bb624f","#f4b371"],mercury:["#8ab8c4","#ddf7f2"],glacier:["#78aed2","#e8fbff"],meadow:["#79af73","#e2f4ac"],dream:["#ce8fbd","#ffe0ed"],storm:["#718eb4","#ffe6a3"],shadow:["#756590","#d9b9f1"],martial:["#bc786a","#ffe0ae"],dragon:["#8999cf","#e9d9ff"],venom:["#839c67","#e7f5ab"]}[state.biome]||["#e29972","#f1aa7f"];
  const [coat,trim]=outfit;
  rect(63,180,11,7,"#293b4a");rect(82,180,12,7,"#293b4a");
  rect(64,168,10,13,"#253f54");rect(81,168,10,13,"#253f54");
  rect(61,145,34,25,coat);rect(66,150,24,18,trim);rect(69,155,16,6,"#386276");
  rect(58,150,9,17,"#e5a184");rect(91,152,8,18,"#e5a184");
  rect(69,129,19,20,"#edb58f");rect(72,139,3,3,"#2c4351");rect(83,139,3,3,"#2c4351");
  rect(65,125,28,7,state.biome==="lava"?"#713b45":state.biome==="cave"?"#55402f":"#2d6272");
  rect(69,117,20,9,state.biome==="lava"?"#9e4e45":state.biome==="cave"?"#8c6240":"#397889");
  rect(77,115,8,3,state.biome==="lava"?"#ef9b60":state.biome==="cave"?"#d9b57c":"#67a69f");
  rect(64,130,5,7,"#66473f");rect(89,130,5,7,"#66473f");
  rect(93,157,8,5,"#edba8e");
}
function drawRodScene(now) {
  const rod=currentRod(), castTime=now-castStarted;
  const casting=fishingPhase==="casting";
  const progress=casting?Math.min(1,Math.max(0,castTime/900)):1;
  const tipX=casting?(progress<.32?167-50*(progress/.32):117+80*((progress-.32)/.68)):fishingPhase==="idle"?167:197;
  const tipY=casting?(progress<.32?103-57*(progress/.32):46+27*((progress-.32)/.68)):fishingPhase==="idle"?103:73;
  ctx.strokeStyle="#102938";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(99,158);ctx.lineTo(tipX,tipY);ctx.stroke();
  ctx.strokeStyle=rod.shaft;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(99,158);ctx.lineTo(tipX,tipY);ctx.stroke();
  ctx.strokeStyle=rod.trim;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(101,155);ctx.lineTo(tipX,tipY);ctx.stroke();
  rect(tipX-4,tipY-5,8,8,rod.gem);rect(tipX-2,tipY-7,4,3,rod.trim);
  if (["coral","quartz","amethyst","geode","prism"].includes(rod.motif)) {
    rect(tipX-8,tipY-8,4,6,rod.trim);rect(tipX+4,tipY-10,4,8,rod.gem);
    rect(tipX-2,tipY-12,4,5,"#f7f0ff");
  } else if (["sun","star","rune","solar"].includes(rod.motif)) {
    rect(tipX-1,tipY-15,3,5,rod.trim);rect(tipX-11,tipY-2,6,3,rod.trim);
    rect(tipX+5,tipY-2,6,3,rod.trim);rect(tipX-1,tipY+4,3,6,rod.trim);
  } else if (["ember","magma","phoenix","crown","core"].includes(rod.motif)) {
    rect(tipX-7,tipY-9,3,7,"#f39059");rect(tipX+5,tipY-11,4,9,"#ffca78");
    rect(tipX-2,tipY-13,4,8,"#fff1a9");
  } else if (["shell","anchor","fang","compass","wing","bell"].includes(rod.motif)) {
    rect(tipX-7,tipY-9,14,8,rod.trim);
    rect(tipX-5,tipY-13,10,5,rod.gem);
    if(rod.motif==="wing") {rect(tipX-13,tipY-8,6,3,rod.trim);rect(tipX+7,tipY-8,6,3,rod.trim);}
    if(rod.motif==="anchor") {rect(tipX-10,tipY-3,5,3,rod.gem);rect(tipX+5,tipY-3,5,3,rod.gem);}
    if(rod.motif==="bell") rect(tipX-2,tipY+4,4,3,"#fff4cf");
  } else if (["lightning","moon","gauntlet","dragon","vial"].includes(rod.motif)) {
    const pulse=Math.sin(now/180)>0?rod.gem:rod.trim;
    rect(tipX-7,tipY-9,14,8,rod.trim);rect(tipX-3,tipY-15,6,8,rod.gem);
    if(rod.motif==="lightning"){rect(tipX+3,tipY-15,5,4,pulse);rect(tipX-5,tipY-4,6,4,pulse);rect(tipX-8,tipY+2,4,4,pulse);}
    if(rod.motif==="moon"){rect(tipX-8,tipY-15,4,12,pulse);rect(tipX-4,tipY-18,7,4,pulse);rect(tipX+1,tipY-15,4,4,pulse);}
    if(rod.motif==="gauntlet"){rect(tipX-9,tipY-13,4,10,pulse);rect(tipX+5,tipY-13,4,10,pulse);rect(tipX-4,tipY-18,8,4,pulse);}
    if(rod.motif==="dragon"){rect(tipX-12,tipY-10,6,3,pulse);rect(tipX+6,tipY-12,6,3,pulse);rect(tipX-1,tipY-19,3,6,pulse);}
    if(rod.motif==="vial"){rect(tipX-6,tipY-16,12,10,pulse);rect(tipX-3,tipY-20,6,5,rod.trim);rect(tipX-4,tipY-11,8,3,"#ecffb1");}
  } else if (rod.motif==="trident") {
    rect(tipX-9,tipY-13,3,12,rod.trim);rect(tipX+6,tipY-13,3,12,rod.trim);
    rect(tipX-2,tipY-16,4,15,rod.gem);
  } else if (rod.motif==="abyss") {
    rect(tipX-10,tipY-7,4,4,rod.gem);rect(tipX+7,tipY-7,4,4,rod.gem);
  }
  const level=RODS.indexOf(rod);
  if(level>1){
    const sparkleCount=level>11?4:level>5?3:2;
    for(let i=0;i<sparkleCount;i++){
      const angle=now/350+i*2.3;
      rect(tipX+Math.cos(angle)*(8+i*3),tipY+Math.sin(angle)*(8+i*2),2+(i%2),2,rod.gem);
    }
  }
  let bobX,bobY;
  if(casting){
    bobX=99+219*progress;
    bobY=143+40*progress-100*Math.sin(Math.PI*progress);
    rect(bobX-7,bobY+5,3,3,rod.trim);
  } else {
    bobX=fishingPhase==="idle"?205:318;
    bobY=(fishingPhase==="idle"?178:183)+Math.round(Math.sin(now/240)*3);
  }
  ctx.strokeStyle=rod.trim;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(tipX,tipY);ctx.lineTo(bobX,bobY);ctx.stroke();
  rect(bobX-4,bobY-3,9,6,rod.gem);rect(bobX-4,bobY-3,9,3,rod.trim);rect(bobX-1,bobY-5,3,2,"#fff6e4");
  if(fishingPhase==="waiting"||fishingPhase==="hook"){
    rect(bobX-17,bobY+6,10,2,state.biome==="lava"?"#ffd079":"#9ad3da");
    rect(bobX+7,bobY+6,10,2,state.biome==="lava"?"#ffd079":"#9ad3da");
    if(Math.sin(now/90)>.2){rect(bobX-4,bobY+13,8,2,state.biome==="lava"?"#f4b561":"#93caca");}
  }
  if(fishingPhase==="waiting"||fishingPhase==="hook"){
    const shadow=state.biome==="lava"?"#a64835":state.biome==="cave"?"#293354":"#235d75";
    rect(307,222,18,5,shadow);rect(300,224,7,2,shadow);rect(325,221,6,6,shadow);
  }
  if(casting && progress>.8){
    rect(303,188,5,2,state.biome==="lava"?"#ffd079":"#c1f0df");
    rect(328,190,7,2,state.biome==="lava"?"#ffd079":"#c1f0df");
  }
}
function drawScene(now) {
  frame++;
  const t=frame/35;
  if(state.biome==="cave") drawCave(t);
  else if(state.biome==="lava") drawLava(t);
  else if(state.biome==="mercury") drawMercury(t);
  else if(state.biome==="glacier") drawGlacier(t);
  else if(state.biome==="meadow") drawMeadow(t);
  else if(state.biome==="dream") drawDream(t);
  else if(state.biome==="storm") drawStorm(t);
  else if(state.biome==="shadow") drawShadow(t);
  else if(state.biome==="martial") drawMartial(t);
  else if(state.biome==="dragon") drawDragon(t);
  else if(state.biome==="venom") drawVenom(t);
  else drawSea(t);
  drawPlatform();
  drawFisher();
  drawRodScene(now);
  if(fishingPhase==="hook"){
    const position=positionAt(now);
    $("hookCursor").style.left=(position*100)+"%";
    if(now-hookStarted>8000) missHook("입질이 사라졌어요! 8초 안에 낚아채세요.");
  }
  requestAnimationFrame(drawScene);
}
render();
forceRaidIfReady();
requestAnimationFrame(drawScene);








