"use strict";
// Raid move pool uses type-matched game presets; it is not a species learnset.
window.RaidRules=(()=>{
  const names={1:"노말",2:"격투",3:"비행",4:"독",5:"땅",6:"바위",7:"벌레",8:"고스트",9:"강철",10:"불꽃",11:"물",12:"풀",13:"전기",14:"에스퍼",15:"얼음",16:"드래곤",17:"악",18:"페어리"};
  const chart={
    1:{weak:[6,9],zero:[8]},2:{strong:[1,6,9,15,17],weak:[3,4,7,14,18],zero:[8]},
    3:{strong:[2,7,12],weak:[6,9,13]},4:{strong:[12,18],weak:[4,5,6,8],zero:[9]},
    5:{strong:[4,6,9,10,13],weak:[7,12],zero:[3]},6:{strong:[3,7,10,15],weak:[2,5,9]},
    7:{strong:[12,14,17],weak:[2,3,4,8,9,10,18]},8:{strong:[8,14],weak:[17],zero:[1]},
    9:{strong:[6,15,18],weak:[9,10,11,13]},10:{strong:[7,9,12,15],weak:[6,10,11,16]},
    11:{strong:[5,6,10],weak:[11,12,16]},12:{strong:[5,6,11],weak:[3,4,7,9,10,12,16]},
    13:{strong:[3,11],weak:[12,13,16],zero:[5]},14:{strong:[2,4],weak:[9,14],zero:[17]},
    15:{strong:[3,5,12,16],weak:[9,10,11,15]},16:{strong:[16],weak:[9],zero:[18]},
    17:{strong:[8,14],weak:[2,17,18]},18:{strong:[2,16,17],weak:[4,9,10]}
  };
  const moves={
    1:[["이판사판태클",120,"physical"],["하이퍼보이스",90,"special"]],
    2:[["인파이트",120,"physical"],["파동탄",80,"special"]],
    3:[["브레이브버드",120,"physical"],["폭풍",110,"special"]],
    4:[["더스트슈트",120,"physical"],["오물웨이브",95,"special"]],
    5:[["지진",100,"physical"],["대지의힘",90,"special"]],
    6:[["스톤에지",100,"physical"],["파워젬",80,"special"]],
    7:[["메가혼",120,"physical"],["벌레의야단법석",90,"special"]],
    8:[["폴터가이스트",110,"physical"],["섀도볼",80,"special"]],
    9:[["아이언헤드",80,"physical"],["러스터캐논",80,"special"]],
    10:[["플레어드라이브",120,"physical"],["오버히트",130,"special"]],
    11:[["아쿠아브레이크",85,"physical"],["하이드로펌프",110,"special"]],
    12:[["파워휩",120,"physical"],["리프스톰",130,"special"]],
    13:[["와일드볼트",90,"physical"],["번개",110,"special"]],
    14:[["사이코팽",85,"physical"],["미래예지",120,"special"]],
    15:[["고드름떨구기",85,"physical"],["눈보라",110,"special"]],
    16:[["역린",120,"physical"],["용성군",130,"special"]],
    17:[["깨물어부수기",80,"physical"],["악의파동",80,"special"]],
    18:[["치근거리기",90,"physical"],["문포스",95,"special"]]
  };
  const biomeType={sea:[11],cave:[5,6],lava:[10],mercury:[9],glacier:[15],meadow:[12,7],dream:[14,18],storm:[13,3],shadow:[8,17],martial:[2,1],dragon:[16,3],venom:[4]};
  const formTypes={palkiaOrigin:[11,16],zygardeComplete:[16,5],groudonPrimal:[5,10],diancieMega:[6,18],zacianCrowned:[18,9],zamazentaCrowned:[2,9],necrozmaDusk:[14,9],necrozmaDawn:[14,8],kyuremBlack:[16,15],kyuremWhite:[16,15],shayminSky:[12,3],hoopaUnbound:[14,17],ultraNecrozma:[14,16]};
  function typesFor(p){return window.POKEMON_TYPES?.[p.id]||biomeType[p.biome]||[1];}
  function profile(p,shiny=false,formKey=null){
    const form=window.SPECIAL_FORMS?.[formKey];
    const types=form?.types||formTypes[formKey]||typesFor(p);
    const base=form?.stats||window.POKEMON_STATS?.[p.id]||[70,70,70,70,70,70];
    // Raid combat uses the canonical base stats (HP/Atk/Def/SpA/SpD/Spe).
    // Rarity, shiny status, and form labels do not add hidden combat bonuses.
    const hp=base[0],attack=base[1],defense=base[2],special=base[3],specialDefense=base[4];
    const moveset=types.flatMap(type=>moves[type].map(([name,power,category])=>({name,power,category,type})));
    return {types,hp,attack,special,defense,specialDefense,interval:Math.max(.6,2.2-base[5]*.009),moves:moveset};
  }
  function effectiveness(type,targetTypes){
    return targetTypes.reduce((n,target)=>{
      const row=chart[type];return n*(row.zero?.includes(target)?0:row.strong?.includes(target)?2:row.weak?.includes(target)?.5:1);
    },1);
  }
  function bestMove(attacker,defender){
    let best=null,score=-1;
    for(const move of attacker.moves){
      const stat=move.category==="physical"?attacker.attack:attacker.special;
      const eff=effectiveness(move.type,defender.types);
      const value=stat*move.power/100*eff;
      if(value>score){score=value;best={...move,effectiveness:eff,score:value};}
    }
    return best;
  }
  function damage(attacker,defender,move,random=1){
    if(move.effectiveness===0)return 0;
    const stat=move.category==="physical"?attacker.attack:attacker.special;
    return Math.max(1,Math.round(stat*move.power/100*.12*1.2*move.effectiveness*random*(100/(75+((move.category==="physical"?defender.defense:defender.specialDefense)||defender.defense)*.2))));
  }
  const typeName=id=>names[id]||"???";
  return {profile,bestMove,damage,effectiveness,typeName,typesFor};
})();






