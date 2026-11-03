"use strict";

const CORE = window.TideboundBattleCore;
const ARENA_CHAMPIONS = [
  { id:"red", gen:1, name:"레드", title:"관동의 최강 트레이너", team:["pikachu","espeon","snorlax","venusaur","charizard","blastoise"] },
  { id:"lance", gen:2, name:"목호", title:"드래곤 마스터", team:["gyarados","dragonite","dragonite","dragonite","aerodactyl","charizard"] },
  { id:"steven", gen:3, name:"성호", title:"호연의 챔피언", team:["metagross","skarmory","claydol","aggron","cradily","armaldo"] },
  { id:"cynthia", gen:4, name:"난천", title:"신오의 챔피언", team:["spiritomb","roserade","gastrodon","lucario","milotic","garchomp"] },
  { id:"alder", gen:5, name:"노간주", title:"하나의 챔피언", team:["accelgor","bouffalant","druddigon","eelektross","escavalier","volcarona"] },
  { id:"diantha", gen:6, name:"카르네", title:"칼로스의 챔피언", team:["hawlucha","tyrantrum","aurorus","gourgeist","goodra","gardevoir"] },
  { id:"kukui", gen:7, name:"쿠쿠이박사", title:"알로라의 첫 챔피언", team:["lycanroc","ninetalesalola","braviary","snorlax","magnezone","decidueye"] },
  { id:"leon", gen:8, name:"단델", title:"무패의 챔피언", team:["aegislash","haxorus","dragapult","mrrime","seismitoad","charizard"] },
  { id:"geeta", gen:9, name:"테사 (Geeta)", title:"팔데아의 챔피언", team:["glimmora","veluza","espathra","gogoat","avalugg","kingambit"] }
];
const TYPE_NAMES = {1:"normal",2:"fighting",3:"flying",4:"poison",5:"ground",6:"rock",7:"bug",8:"ghost",9:"steel",10:"fire",11:"water",12:"grass",13:"electric",14:"psychic",15:"ice",16:"dragon",17:"dark",18:"fairy"};
const TYPE_LABELS = {normal:"노말",fighting:"격투",flying:"비행",poison:"독",ground:"땅",rock:"바위",bug:"벌레",ghost:"고스트",steel:"강철",fire:"불꽃",water:"물",grass:"풀",electric:"전기",psychic:"에스퍼",ice:"얼음",dragon:"드래곤",dark:"악",fairy:"페어리"};
const PREFERRED_ABILITIES = {
  pikachu:"lightningrod",espeon:"magicbounce",snorlax:"thickfat",venusaur:"chlorophyll",charizard:"blaze",blastoise:"torrent",ditto:"imposter",
  gyarados:"intimidate",dragonite:"multiscale",aerodactyl:"pressure",metagross:"clearBody",skarmory:"sturdy",claydol:"levitate",aggron:"sturdy",cradily:"stormdrain",armaldo:"battlearmor",
  spiritomb:"infiltrator",roserade:"naturalcure",gastrodon:"stormdrain",lucario:"innerFocus",milotic:"competitive",garchomp:"roughskin",
  accelgor:"unburden",bouffalant:"reckless",druddigon:"moldbreaker",eelektross:"levitate",escavalier:"overcoat",volcarona:"flamebody",
  hawlucha:"unburden",tyrantrum:"strongjaw",aurorus:"refrigerate",gourgeist:"frisk",goodra:"sapsipper",gardevoir:"pixilate",
  lycanroc:"sandrush",ninetalesalola:"snowwarning",braviary:"defiant",magnezone:"analytic",decidueye:"longreach",aegislash:"stancechange",haxorus:"moldbreaker",dragapult:"infiltrator",mrrime:"icebody",seismitoad:"waterabsorb",
  glimmora:"toxicdebris",veluza:"sharpness",espathra:"speedboost",gogoat:"grasspelt",avalugg:"sturdy",kingambit:"supremeoverlord"
};
const KNOWN_DEX = {
  claydol:344,cradily:346,armaldo:348,accelgor:617,bouffalant:626,seismitoad:537,veluza:976
};
const PREFERRED_ITEMS = ["choiceScarf","choiceBand","choiceSpecs","focusSash","leftovers"];
let arenaSelected = [];
let arenaBattle = null;
let arenaMeta = null;
let arenaFinalized = false;

function arenaOwned() { return [...state.bag,...state.reserve]; }
function dexForSpecies(id) { return CORE.species[id]?.nationalDex ?? KNOWN_DEX[id] ?? 0; }
function isAttackMove(move) { return move && move.category !== "status" && Number(move.power) > 0 && (move.accuracy == null || move.accuracy >= 70); }
function rankedMoves(entry, preferredTypes=entry.types) {
  const stats=entry.baseStats;
  return entry.learnset.map(id=>CORE.moves[id]).filter(isAttackMove).map(move=>({move,score:move.power*(move.accuracy==null?1:move.accuracy/100)*(preferredTypes.includes(move.type)?1.5:1)*(move.category==="physical"?stats.atk:stats.spa)})).sort((a,b)=>b.score-a.score).map(x=>x.move);
}
function inferredMoves(dex,types,stats) {
  const all=Object.values(CORE.moves).filter(isAttackMove).map(move=>({move,score:move.power*(move.accuracy==null?1:move.accuracy/100)*(types.includes(move.type)?1.5:1)*(move.category==="physical"?stats.atk:stats.spa)})).sort((a,b)=>b.score-a.score);
  const chosen=[], usedTypes=new Set();
  for(const {move} of all) if(types.includes(move.type)&&!usedTypes.has(move.type)){chosen.push(move.id);usedTypes.add(move.type);if(chosen.length===2)break;}
  for(const {move} of all) if(!chosen.includes(move.id)&&!usedTypes.has(move.type)){chosen.push(move.id);usedTypes.add(move.type);if(chosen.length===4)break;}
  for(const {move} of all)if(chosen.length<4&&!chosen.includes(move.id))chosen.push(move.id);
  if(chosen.length<4) for(const id of ["tackle","protect","rest","struggle"])if(CORE.moves[id]&&!chosen.includes(id))chosen.push(id);
  return chosen.slice(0,4);
}
function ensureArenaSpecies(id,dex,nameHint) {
  if(CORE.species[id])return CORE.species[id];
  const nationalDex=dex||KNOWN_DEX[id]||0;
  const raw=window.POKEMON_STATS?.[nationalDex];
  const typeIds=window.POKEMON_TYPES?.[nationalDex]||[];
  if(!nationalDex||!raw||!typeIds.length)throw new Error("아레나 데이터에서 포켓몬 정보를 찾을 수 없습니다: "+(nameHint||id));
  const baseStats={hp:raw[0],atk:raw[1],def:raw[2],spa:raw[3],spd:raw[4],spe:raw[5]};
  const types=typeIds.map(typeId=>TYPE_NAMES[typeId]).filter(Boolean);
  const learnset=inferredMoves(nationalDex,types,baseStats);
  const preferred=PREFERRED_ABILITIES[id];
  const fallbackAbility=preferred&&CORE.abilities[preferred]?preferred:CORE.abilities.pressure?"pressure":Object.keys(CORE.abilities)[0];
  const entry={id,nationalDex,spriteId:nationalDex,name:nameHint||("도감 No."+nationalDex),englishName:id,representativeType:types[0],types,baseStats,abilities:[fallbackAbility],learnset};
  CORE.species[id]=entry;
  return entry;
}
function findCaughtSpecies(item) {
  const label=itemName(item), candidates=Object.entries(CORE.species).filter(([,entry])=>entry.nationalDex===item.id);
  const exact=candidates.find(([,entry])=>entry.name===label);
  const base=candidates.find(([id,entry])=>id===String(id).toLowerCase()&&!/[0-9]$/.test(id)&&entry.name===BY_ID.get(item.id)?.name);
  const found=exact||base||candidates.find(([id])=>!id.includes("-"))||candidates[0];
  if(found)return found[1];
  const dexName=BY_ID.get(item.id)?.name||label;
  return ensureArenaSpecies("tidebound-dex-"+item.id,item.id,dexName);
}
function selectedAbility(entry) {
  const preferred=PREFERRED_ABILITIES[entry.id];
  if(preferred&&entry.abilities.includes(preferred)&&CORE.abilities[preferred])return preferred;
  return entry.abilities.find(id=>CORE.abilities[id])||"pressure";
}
function chooseItem(entry,slot=0) {
  const stats=entry.baseStats, physical=stats.atk>=stats.spa, offense=Math.max(stats.atk,stats.spa),speed=stats.spe;
  let wished;
  if(offense<90&&stats.hp+stats.def+stats.spd>280)wished="leftovers";
  else if(speed>=105)wished=physical?"choiceBand":"choiceSpecs";
  else if(speed>=75)wished=physical?"choiceScarf":"choiceSpecs";
  else wished="leftovers";
  if(slot===0&&speed<65&&offense>=100)wished=physical?"choiceBand":"choiceSpecs";
  const choices=[wished,...PREFERRED_ITEMS];
  return choices.find(id=>CORE.items[id]&&CORE.items[id].supported!==false)||"none";
}
function tuneCompetitiveSet(entry,set,slot=0) {
  const stats=entry.baseStats, physical=stats.atk>=stats.spa, offense=physical?stats.atk:stats.spa;
  const bulky=stats.hp>=100&&stats.def+stats.spd>=185&&offense<125;
  const defaultMoves=[...set.moves];
  set.moves=entry.id==="ditto"?["transform"]:rankedMoves(entry).filter((move,index,list)=>list.findIndex(other=>other.type===move.type)===index).slice(0,4).map(move=>move.id);
  if(entry.id!=="ditto") {
    const available=new Set(entry.learnset);
    for(const id of ["protect","earthquake","surf","flamethrower","thunderbolt","icebeam","shadowball","moonblast","closecombat","dragonclaw","psychic","stoneedge","leafblade","flashcannon","bugbuzz","sludgebomb"]) {
      if(set.moves.length>=4)break;
      if(available.has(id)&&CORE.moves[id]&&!set.moves.includes(id))set.moves.push(id);
    }
    while(set.moves.length<4) {
      const fill=rankedMoves(entry).find(move=>!set.moves.includes(move.id));
      if(!fill)break;
      set.moves.push(fill.id);
    }
    for(const id of defaultMoves)if(set.moves.length<4&&CORE.moves[id]&&!set.moves.includes(id))set.moves.push(id);
    for(const id of entry.learnset)if(set.moves.length<4&&CORE.moves[id]&&!set.moves.includes(id))set.moves.push(id);
  }
  set.abilityId=selectedAbility(entry);
  set.itemId=chooseItem(entry,slot);
  if(bulky) {
    set.natureId=stats.def>=stats.spd?"bold":"calm";
    set.evs={hp:252,def:stats.def>=stats.spd?252:4,spd:stats.def>=stats.spd?4:252};
  } else {
    set.natureId=physical?(stats.spe>=90?"jolly":"adamant"):(stats.spe>=90?"timid":"modest");
    set.evs=physical?{atk:252,spe:252,hp:4}:{spa:252,spe:252,hp:4};
  }
  set.ivs={hp:31,atk:31,def:31,spa:31,spd:31,spe:31};
  set.teraType=entry.types[0];
  return set;
}
function setForCaught(item,slot=0) {
  const entry=findCaughtSpecies(item);
  const set=CORE.createSet(entry.id);
  return tuneCompetitiveSet(entry,set,slot);
}
function setForChampion(id,slot=0) {
  const dex=dexForSpecies(id);
  const entry=ensureArenaSpecies(id,dex,CORE.species[id]?.name||BY_ID.get(dex)?.name||id);
  const set=CORE.createSet(id);
  return tuneCompetitiveSet(entry,set,slot);
}
function itemSetSummary(item,slot) {
  const set=setForCaught(item,slot), entry=findCaughtSpecies(item);
  const moveNames=set.moves.map(id=>CORE.moves[id]?.name||id).join(" · ");
  return '<small class="arena-set-summary">'+(CORE.abilities[set.abilityId]?.name||set.abilityId)+' · '+(CORE.items[set.itemId]?.name||"도구 없음")+'<br>'+moveNames+'<br>레벨 50 · 노력치 '+Object.entries(set.evs).filter(([,value])=>value).map(([stat,value])=>stat.toUpperCase()+" "+value).join(" / ")+'</small>';
}
function renderArenaTab() {
  const index=state.arenaChampionIndex||0, progress=Math.min(index,ARENA_CHAMPIONS.length), champ=ARENA_CHAMPIONS[Math.min(index,ARENA_CHAMPIONS.length-1)];
  const owned=arenaOwned().length;
  return '<div class="arena-tab-card"><div class="arena-emblem">♜</div><small>CHAMPION CIRCUIT · GEN 1—9</small><h3>배틀 아레나</h3><p>잡은 포켓몬 세 마리로 레드부터 테사까지 챔피언 9명에게 도전하세요. 이전 배틀 웹의 전투 코어와 기술 데이터를 사용합니다.</p><div class="arena-tab-stats"><span>보유 포켓몬 <b>'+owned+'</b></span><span>연속전 승리 <b>'+progress+' / 9</b></span><span>누적 전적 <b>'+state.arenaWins+'승 '+state.arenaLosses+'패</b></span></div><div class="arena-tab-next">'+(index>=9?'챔피언 연속전 완주! · 다시 도전할 수 있어요.':'다음 상대 · '+champ.name+' <small>GEN '+champ.gen+'</small>')+'</div><button class="primary-button arena-enter-button" data-arena-action="open">'+(index>=9?'챔피언 연속전 다시 시작':'아레나 입장하기 ↗')+'</button><small class="arena-tab-rule">승리 +200,000 코인 · 패배 −500,000 코인 (잔액은 음수가 될 수 있음)</small></div>';
}
function currentChampion() { return ARENA_CHAMPIONS[Math.min(state.arenaChampionIndex||0,ARENA_CHAMPIONS.length-1)]; }
function openArena() {
  arenaSelected=[];arenaBattle=null;arenaMeta=null;arenaFinalized=false;
  if(state.arenaChampionIndex>=9) {
    state.arenaChampionIndex=0;
    persist();
  }
  $("arenaOverlay").classList.remove("hidden");
  $("arenaSelectView").classList.remove("hidden");
  $("arenaFightView").classList.add("hidden");
  renderArenaSelect();
}
function closeArena() {
  if(arenaBattle&&!arenaBattle.winner&&!arenaFinalized) {
    if(!window.confirm("배틀을 포기하고 아레나를 나갈까요? 포기하면 패배 처리되어 500,000 코인이 차감됩니다."))return;
    finishArena(false);
  }
  $("arenaOverlay").classList.add("hidden");
  render();
}
function enemySprite(id,cls="") {
  const dex=dexForSpecies(id),entry=CORE.species[id];
  return '<img class="'+cls+'" src="./sprites/'+dex+'.png" data-pokemon-id="'+dex+'" alt="'+(entry?.name||id)+'">';
}
function championTeamMarkup(champ) {
  return champ.team.map((id,index)=>'<div class="arena-champ-mon">'+enemySprite(id,'arena-champ-sprite')+'<span>'+(CORE.species[id]?.name||id)+'</span></div>').join("");
}
function renderArenaSelect() {
  const champ=currentChampion(), owned=arenaOwned();
  $("arenaSubtitle").textContent="가방과 보관함에서 보유 포켓몬 세 마리를 고르세요. 상대는 6마리 팀으로 맞섭니다.";
  $("arenaProgress").innerHTML=ARENA_CHAMPIONS.map((c,i)=>'<span class="arena-progress-step '+(i<(state.arenaChampionIndex||0)?'cleared':'')+' '+(i===(state.arenaChampionIndex||0)?'current':'')+'">'+(i+1)+'</span>').join("");
  $("arenaChampionCard").innerHTML='<div class="arena-champion-copy"><small>GEN '+champ.gen+' · NEXT CHAMPION</small><strong>'+champ.name+'</strong><span>'+champ.title+'</span></div><div class="arena-champion-team">'+championTeamMarkup(champ)+'</div>';
  $("arenaPickCount").textContent=arenaSelected.length+" / 3 선택";
  $("arenaStartButton").disabled=arenaSelected.length!==3;
  $("arenaTeamPicker").innerHTML=owned.length?owned.map((item,index)=>{
    const selected=arenaSelected.includes(index),slot=Math.max(0,arenaSelected.indexOf(index));
    let summary='';
    try{summary=itemSetSummary(item,slot);}catch(error){summary='<small class="arena-set-summary">배틀 세팅 구성 오류 · '+String(error.message||error)+'</small>';}
    return '<button class="arena-owned-card '+(selected?'selected':'')+'" data-arena-pick="'+index+'" aria-pressed="'+selected+'">'+spriteMarkup(item,'arena-owned-sprite')+'<span class="arena-owned-name">'+(item.shiny?'✦ ':'')+itemName(item)+'</span>'+summary+(selected?'<b class="arena-slot-mark">선발 '+(slot+1)+'</b>':'')+'</button>';
  }).join(""):'<div class="arena-empty">아레나에 데려갈 포켓몬이 없어요. 낚은 포켓몬을 먼저 가방에 보관해 주세요.</div>';
}
function hpMarkup(mon,side,index) {
  const ratio=Math.max(0,Math.min(1,mon.hp/mon.maxHp));
  return '<div class="arena-hp-track '+(ratio<.25?'critical':'')+'"><span style="width:'+(ratio*100)+'%"></span></div><small>'+Math.max(0,Math.ceil(mon.hp))+' / '+mon.maxHp+' HP</small>';
}
function combatName(mon) { return CORE.species[mon.set.speciesId]?.name||mon.speciesName; }
function arenaPlayerSprite(item,cls="") { return spriteMarkup(item,cls); }
function renderArenaBattle() {
  if(!arenaBattle||!arenaMeta)return;
  const pSide=arenaBattle.sides.player,cSide=arenaBattle.sides.cpu,pIndex=pSide.active[0]??0,cIndex=cSide.active[0]??0,pMon=pSide.team[pIndex],cMon=cSide.team[cIndex];
  const pItem=arenaMeta.playerItems[pIndex],champ=arenaMeta.champion;
  const pRatio=pMon?Math.max(0,Math.min(1,pMon.hp/pMon.maxHp)):0,cRatio=cMon?Math.max(0,Math.min(1,cMon.hp/cMon.maxHp)):0;
  $("arenaActionLabel").textContent=arenaBattle.winner?(arenaBattle.winner==="player"?"챔피언을 쓰러뜨렸어요!":"포켓몬을 모두 잃었어요."):(pMon?combatName(pMon)+"의 행동을 선택하세요.":"대기 중");
  $("arenaBattlefield").innerHTML='<div class="arena-battle-side enemy"><div class="arena-battle-card"><small>'+champ.name+' · '+(cIndex+1)+' / 6</small><strong>'+combatName(cMon)+'</strong>'+hpMarkup(cMon,'cpu',cIndex)+'</div>'+enemySprite(cMon.set.speciesId,'arena-active-sprite enemy-sprite')+'</div><div class="arena-vs-mark">VS</div><div class="arena-battle-side player">'+arenaPlayerSprite(pItem,'arena-active-sprite player-sprite')+'<div class="arena-battle-card"><small>내 파티 · '+(pIndex+1)+' / 3</small><strong>'+(pMon?combatName(pMon):'')+'</strong>'+hpMarkup(pMon,'player',pIndex)+'</div></div>';
  $("arenaTeams").innerHTML='<div class="arena-team-row"><small>CHAMPION</small>'+cSide.team.map((mon,index)=>'<div class="arena-team-chip '+(index===cIndex?'active':'')+(mon.fainted?' fainted':'')+'">'+enemySprite(mon.set.speciesId,'arena-team-icon')+'<span>'+combatName(mon)+'</span></div>').join("")+'</div><div class="arena-team-row"><small>MY TEAM</small>'+pSide.team.map((mon,index)=>'<div class="arena-team-chip '+(index===pIndex?'active':'')+(mon.fainted?' fainted':'')+'">'+arenaPlayerSprite(arenaMeta.playerItems[index],'arena-team-icon')+'<span>'+combatName(mon)+'</span><i style="width:'+(Math.max(0,mon.hp/mon.maxHp)*100)+'%"></i></div>').join("")+'</div>';
  $("arenaBattleLog").innerHTML=arenaBattle.log.slice(-8).map(log=>'<div class="arena-log-line '+log.kind+'">'+log.text+'</div>').join("");
  $("arenaBattleLog").scrollTop=$("arenaBattleLog").scrollHeight;
  const done=!!arenaBattle.winner;
  $("arenaMoveButtons").innerHTML=done||!pMon||pMon.fainted?'':pMon.set.moves.map(id=>'<button class="arena-move-button type-'+(CORE.moves[id]?.type||'normal')+'" data-arena-move="'+id+'"><span>'+(CORE.moves[id]?.name||id)+'</span><small>'+(TYPE_LABELS[CORE.moves[id]?.type]||'')+' · '+(CORE.moves[id]?.power||'변화')+' 위력</small></button>').join("");
  $("arenaSwitchButtons").innerHTML=done?'':pSide.team.map((mon,index)=>index===pIndex||mon.fainted?'':'<button class="arena-switch-button" data-arena-switch="'+index+'">교체 · '+combatName(mon)+' ('+Math.max(0,Math.ceil(mon.hp))+' HP)</button>').join("");
  $("arenaMoveButtons").classList.toggle("hidden",done||!pMon||pMon.fainted);
  $("arenaResultActions").classList.toggle("hidden",!done);
  if(done) {
    $("arenaResultButton").textContent=arenaBattle.winner==="player"?(state.arenaChampionIndex>=9?"연속전 완주 · 다시 도전":"다음 챔피언에게 도전") : "패배 · 다시 도전";
    $("arenaActionLabel").textContent=arenaBattle.winner==="player"?"승리 보상 +200,000 코인! 다음 챔피언이 기다립니다.":"패배 · 500,000 코인이 차감되었습니다.";
  }
  $("arenaBattlefield").classList.toggle("arena-turn-flash",pRatio<1||cRatio<1);
}
function startArenaBattle() {
  if(arenaSelected.length!==3)return;
  const owned=arenaOwned(), selectedItems=arenaSelected.map(index=>owned[index]).filter(Boolean);
  if(selectedItems.length!==3)return;
  const champ=currentChampion();
  try {
    const playerTeam=selectedItems.map((item,index)=>setForCaught(item,index));
    const cpuTeam=champ.team.map((id,index)=>setForChampion(id,index));
    arenaBattle=CORE.createBattle({format:"singles",playerTeam,cpuTeam,seed:(Date.now()^state.totalCatches^state.arenaWins)>>>0});
    arenaMeta={playerItems:selectedItems,champion:champ};
    arenaFinalized=false;
    $("arenaSelectView").classList.add("hidden");
    $("arenaFightView").classList.remove("hidden");
    $("arenaSubtitle").textContent="이전 배틀 웹의 싱글 전투 코어 · 3마리로 6마리 챔피언 팀에 도전";
    renderArenaBattle();
  } catch(error) {
    alert("아레나 배틀을 시작하지 못했어요. "+String(error.message||error));
  }
}
function finishArena(won) {
  if(arenaFinalized)return;
  arenaFinalized=true;
  if(won) {
    state.money+=200000;
    state.arenaWins=(state.arenaWins||0)+1;
    state.arenaChampionIndex=Math.min(9,(state.arenaChampionIndex||0)+1);
  } else {
    state.money-=500000;
    state.arenaLosses=(state.arenaLosses||0)+1;
  }
  persist();render();
}
function submitArenaAction(action) {
  if(!arenaBattle||arenaBattle.winner||arenaFinalized)return;
  try {
    const cpuActions=CORE.chooseCpuActions(arenaBattle);
    arenaBattle=CORE.runTurn(arenaBattle,[action],cpuActions);
    renderArenaBattle();
    if(arenaBattle.winner)finishArena(arenaBattle.winner==="player");
  } catch(error) {
    alert("행동 처리 중 문제가 생겼어요. "+String(error.message||error));
  }
}
$("tabContent").addEventListener("click",event=>{
  const open=event.target.closest("[data-arena-action='open']");
  if(open){openArena();return;}
});
$("arenaTeamPicker").addEventListener("click",event=>{
  const card=event.target.closest("[data-arena-pick]");
  if(!card)return;
  const index=Number(card.dataset.arenaPick),at=arenaSelected.indexOf(index);
  if(at>=0)arenaSelected.splice(at,1);else if(arenaSelected.length<3)arenaSelected.push(index);
  renderArenaSelect();
});
$("arenaStartButton").addEventListener("click",startArenaBattle);
$("arenaCloseButton").addEventListener("click",closeArena);
$("arenaExitButton").addEventListener("click",closeArena);
$("arenaMoveButtons").addEventListener("click",event=>{
  const button=event.target.closest("[data-arena-move]");
  if(button)submitArenaAction({kind:"move",slot:0,moveId:button.dataset.arenaMove});
});
$("arenaSwitchButtons").addEventListener("click",event=>{
  const button=event.target.closest("[data-arena-switch]");
  if(button)submitArenaAction({kind:"switch",slot:0,to:Number(button.dataset.arenaSwitch)});
});
$("arenaResultButton").addEventListener("click",()=>{
  if(state.arenaChampionIndex>=9){state.arenaChampionIndex=0;persist();}
  arenaBattle=null;arenaMeta=null;arenaFinalized=false;
  $("arenaFightView").classList.add("hidden");$("arenaSelectView").classList.remove("hidden");
  renderArenaSelect();render();
});
window.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!$("arenaOverlay").classList.contains("hidden"))closeArena();
});
CORE.species.ditto&&(CORE.species.ditto.learnset.includes("transform")||(CORE.species.ditto.learnset.push("transform")));
for(const champ of ARENA_CHAMPIONS)for(const id of champ.team)if(!CORE.species[id])ensureArenaSpecies(id,dexForSpecies(id),BY_ID.get(dexForSpecies(id))?.name||id);
renderTab();
