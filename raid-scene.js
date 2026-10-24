"use strict";

// Pixel battlefield for automatic biome raids. All scenery and effects are drawn locally.
window.RaidScene = (() => {
  const W=640,H=300;
  const themes={
    sea:{sky:"#86cad0",back:"#a3d9ce",ground:"#295b75",edge:"#e0c38a",accent:"#6de4e4",dark:"#16465d"},
    cave:{sky:"#332820",back:"#64432f",ground:"#765034",edge:"#c49b68",accent:"#dfb779",dark:"#39291f"},
    lava:{sky:"#6c2738",back:"#a04236",ground:"#4a363e",edge:"#ef9250",accent:"#ffba5d",dark:"#331f2d"},
    mercury:{sky:"#253c4e",back:"#456571",ground:"#526675",edge:"#b4d0d5",accent:"#a5e2ee",dark:"#253644"},
    glacier:{sky:"#8ac4cf",back:"#b3dfe1",ground:"#659cac",edge:"#e8f7e6",accent:"#d4faff",dark:"#3d778e"},
    meadow:{sky:"#9bd3ad",back:"#bfe1a5",ground:"#3a715d",edge:"#d1bf87",accent:"#9bef88",dark:"#285442"},
    dream:{sky:"#8e739b",back:"#cda4c9",ground:"#785a8c",edge:"#f0c9e5",accent:"#ffb9ec",dark:"#58446d"},
    storm:{sky:"#5f83a8",back:"#8caac0",ground:"#486b86",edge:"#ffe69b",accent:"#ffef96",dark:"#314968"},
    shadow:{sky:"#302c50",back:"#5b4c79",ground:"#3c405d",edge:"#bda3d7",accent:"#e0a9ef",dark:"#26273e"},
    martial:{sky:"#e9ae87",back:"#c68778",ground:"#9b695f",edge:"#ffe0ad",accent:"#ffbd8f",dark:"#6d4c4c"},
    dragon:{sky:"#7e8bb9",back:"#aab8dc",ground:"#697dac",edge:"#e9dbbd",accent:"#f7d7a5",dark:"#4d5f8d"},
    venom:{sky:"#7d9b70",back:"#a2c587",ground:"#527761",edge:"#d5f3a0",accent:"#c9f18a",dark:"#3b5a4c"}
  };
  const attackColors={sea:"#8af7ff",cave:"#dab88a",lava:"#ffad54",mercury:"#d3f6fa",glacier:"#e2ffff",meadow:"#a8fb8f",dream:"#ffb2ee",storm:"#fff4a4",shadow:"#d8a9ff",martial:"#ffc695",dragon:"#bfc9ff",venom:"#d6ff96"};
  function create(canvas,urlFor){
    if(!canvas || !canvas.getContext)return null;
    const ctx=canvas.getContext("2d");
    if(!ctx)return null;
    ctx.imageSmoothingEnabled=false;
    const images=new Map();
    let raid=null,effects=[],bursts=[],generation=0;
    const box=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
    function imageFor(item){
      const url=urlFor(item);
      if(!images.has(url)){
        const img=new Image();
        const candidates=[url];
        if(item.form)candidates.push("./sprites/"+(item.shiny?"shiny/":"")+item.id+".png");
        if(item.shiny)candidates.push("./sprites/"+item.id+".png");
        candidates.push("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+item.id+".png");
        let fallback=0;
        img.onerror=()=>{if(++fallback<candidates.length)img.src=candidates[fallback];};
        img.src=candidates[0];
        images.set(url,img);
      }
      return images.get(url);
    }
    function sprite(item,x,y,size,flip,flash,alpha=1){
      const img=imageFor(item);
      ctx.save();
      ctx.globalAlpha=alpha;
      if(flash){ctx.shadowColor="#ffffff";ctx.shadowBlur=18;}
      if(flip){ctx.translate(Math.round(x+size/2),0);ctx.scale(-1,1);x=-size/2;}
      if(img.complete&&img.naturalWidth)ctx.drawImage(img,Math.round(x),Math.round(y),size,size);
      else {
        box(x+size*.2,y+size*.14,size*.6,size*.7,"#203c4a");
        box(x+size*.3,y+size*.04,size*.4,size*.12,"#f2d47b");
      }
      ctx.restore();
    }
    function backdrop(t){
      const b=themes[raid.biome]||themes.sea;
      box(0,0,W,H,b.sky);
      box(0,68,W,57,b.back);
      box(0,125,W,84,b.dark);
      for(let i=0;i<14;i++){
        const x=(i*67+33)%W;
        if(raid.biome==="sea"){
          box(x,114,39,5,"#72aeb0");box(x+7,110,25,4,"#72aeb0");
          box((x+t*.018)%W,174+i%3*26,24,3,"#8ce0dd");
          box((x+25+t*.018)%W,181+i%3*26,14,2,"#b8e9d1");
        }else if(raid.biome==="cave"){
          box(x,0,19,20+i%3*9,"#4d3528");box(x+4,20+i%3*9,8,9,"#7d5636");
          box(x+20,161+i%3*9,18,5,"#a37a4e");box(x+24,155+i%3*9,9,5,"#c6a16b");
        }else if(raid.biome==="lava"){
          box(x,111,27,25,"#512b32");box(x+7,99,10,14,"#512b32");
          box((x+t*.006)%W,158+i%3*24,22,4,"#ff9847");
          box((x+21+t*.006)%W,162+i%3*24,8,3,"#ffd16d");
        }else if(raid.biome==="mercury"){
          box(x,64,29,56,"#587380");box(x+3,70,23,4,"#9fc5ca");
          box(x+7,86,5,5,"#c8e5e0");
          box((x+t*.011)%W,174+i%3*23,25,3,"#a8d8df");
        }else if(raid.biome==="glacier"){
          box(x,111,22,26,"#e5f8ef");box(x+5,95,12,18,"#c9edeb");
          box((x+t*.008)%W,(i*43+t*.018)%H,3,3,"#f7fff1");
        }else if(raid.biome==="meadow"){
          box(x,105,13,31,"#326657");box(x-7,92,27,17,"#4f9d67");
          box(x+3,91,12,9,"#79bc70");
          box(x,174+i%3*23,2,8,"#7bd57e");box(x-2,171+i%3*23,6,4,i%2?"#ffdc81":"#f6a5cd");
        }else if(raid.biome==="storm"){
          box(x,90+i%3*10,34,5,"#d5dfe8");box(x+9,85+i%3*10,21,5,"#e7ecdf");
          box((x+t*.018)%W,167+i%3*20,18,3,"#f2e99d");
        }else if(raid.biome==="shadow"){
          box(x,84-i%3*8,13,73,"#292b46");box(x-6,83-i%3*8,25,6,"#7a688e");
          box(x+14,176+i%3*19,5,5,"#bd9fda");
        }else if(raid.biome==="martial"){
          box(x,103-i%3*10,33,41,"#a56b69");box(x+8,95-i%3*10,18,11,"#d7997b");
          box(x+5,184+i%3*17,12,3,"#f0bf91");
        }else if(raid.biome==="dragon"){
          box(x,99-i%3*12,28,31,"#687caa");box(x+7,90-i%3*12,13,11,"#b2bfde");
          box((x+t*.014)%W,177+i%3*19,24,3,"#dbe4f1");
        }else if(raid.biome==="venom"){
          box(x,85-i%3*10,10,66,"#3e6656");box(x-6,84-i%3*10,22,8,"#94bb80");
          box(x+7,169+i%3*21,6,6,"#bdec8d");
        }else{
          const bob=Math.sin(t*.002+i)*7;
          ctx.strokeStyle="#ffd6f2";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,72+i%3*31+bob,4+i%3*3,0,Math.PI*2);ctx.stroke();
          box(x+8,177+i%3*20,5,5,"#e2a7dd");
        }
      }
      box(0,206,W,94,b.ground);
      for(let i=0;i<40;i++){
        const x=i*17,y=215+i%4*18;
        box(x,y,10,2,i%3===0?b.edge:b.dark);
      }
      // Raised pixel platforms keep both sides readable on every terrain.
      box(20,236,245,21,b.dark);box(20,232,245,6,b.edge);box(28,257,229,6,b.dark);
      box(402,217,213,26,b.dark);box(402,213,213,6,b.edge);box(411,243,196,6,b.dark);
      box(0,281,W,19,b.dark);
      box(0,279,W,3,b.edge);
    }
    function positions(){
      const n=raid.party.length;
      return raid.party.map((_,i)=>({x:32+i*(n>3?47:68),y:178+(i%2)*8}));
    }
    function drawCreatures(t){
      const spots=positions();
      for(let i=0;i<raid.party.length;i++){
        const f=raid.party[i],pos=spots[i];
        const bob=Math.sin(t*.006+i*1.7)*3;
        const lunge=Math.max(0,(f.attackUntil||0)-t)/320;
        const hit=Math.max(0,(f.hitUntil||0)-t)/290;
        box(pos.x+8,229,45,5,"#172f3b88");
        sprite(f.item,pos.x+lunge*23-hit*9,pos.y+bob-lunge*12+(f.hp<=0?22:0),58,false,hit>0&&Math.floor(t/75)%2===0,f.hp<=0?.3:1);
        box(pos.x+7,262,Math.max(1,47*f.hp/f.maxHp),4,f.hp>f.maxHp*.3?"#9bf0aa":"#ff8b7c");
        box(pos.x+7,266,47,2,"#0e2838");
      }
      const bob=Math.sin(t*.003)*6;
      const lunge=Math.max(0,(raid.bossAttackUntil||0)-t)/370;
      const hit=Math.max(0,(raid.bossHitUntil||0)-t)/350;
      box(451,210,116,7,"#14283a88");
      sprite({id:raid.boss.id,shiny:false},453-lunge*42+(hit>0?Math.sin(t*.08)*4:0),92+bob+((raid.bossHp<=0)?28:0),112,true,hit>0&&Math.floor(t/65)%2===0,raid.bossHp<=0?.45:1);
    }
    function drawEffects(t){
      bursts=bursts.filter(b=>t-b.start<720);
      for(const b of bursts){
        const progress=Math.min(1,(t-b.start)/720);
        ctx.save();ctx.globalAlpha=(1-progress)*.68;
        for(let ring=0;ring<4;ring++){
          const radius=25+progress*330+ring*19;
          ctx.strokeStyle=ring%2?"#ffffff":b.color;
          ctx.lineWidth=7-ring;
          ctx.beginPath();ctx.arc(500,151,radius,0,Math.PI*2);ctx.stroke();
        }
        for(let stripe=0;stripe<7;stripe++){
          const x=(stripe*97+Math.floor(progress*180))%W;
          box(x,0,11,H,b.color);
          box(x+14,0,4,H,"#ffffff");
        }
        ctx.restore();
      }
      effects=effects.filter(e=>t-e.start<950);
      for(const e of effects){
        const p=Math.min(1,(t-e.start)/580);
        const x=e.fromX+(e.toX-e.fromX)*p;
        const y=e.fromY+(e.toY-e.fromY)*p-Math.sin(Math.PI*p)*36;
        ctx.save();
        ctx.globalAlpha=1-Math.max(0,(t-e.start-700)/250);
        for(let j=0;j<6;j++){
          const trail=Math.max(0,p-j*.035),tx=e.fromX+(e.toX-e.fromX)*trail;
          const ty=e.fromY+(e.toY-e.fromY)*trail-Math.sin(Math.PI*trail)*36;
          box(tx-3,ty-3,7-j*.6,7-j*.6,j%2?e.color:"#ffffff");
        }
        if(e.biome==="sea"){box(x-16,y+7,32,4,e.color);box(x-11,y+11,22,3,"#e6ffff");}
        else if(e.biome==="lava"){box(x-6,y+8,12,12,"#ff6b37");box(x-2,y+1,7,12,"#ffd57c");}
        else if(e.biome==="glacier"){box(x-3,y-14,6,28,"#e8ffff");box(x-13,y-3,26,6,e.color);}
        else if(e.biome==="meadow"){box(x-11,y-5,22,8,e.color);box(x-3,y-12,7,23,"#dcffaf");}
        else if(e.biome==="dream"){ctx.strokeStyle=e.color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.stroke();}
        else if(e.biome==="storm"){box(x-5,y-15,9,8,"#ffef9c");box(x-11,y-2,13,5,"#ffe477");}
        else if(e.biome==="shadow"){box(x-10,y-8,20,17,"#916cb4");box(x-5,y-14,10,7,"#d5a7ee");}
        else if(e.biome==="martial"){box(x-12,y-8,24,16,"#ffb98c");box(x-5,y-13,10,6,"#ffe4a8");}
        else if(e.biome==="dragon"){box(x-11,y-9,22,18,"#abbaff");box(x-4,y-15,8,7,"#f8dbad");}
        else if(e.biome==="venom"){box(x-9,y-9,18,18,"#b7ee88");box(x-3,y-15,6,7,"#e8ffaf");}
        else if(e.biome==="mercury"){box(x-12,y-8,24,16,e.color);box(x-8,y-4,16,8,"#5f8898");}
        else{box(x-12,y-11,24,22,e.color);box(x-7,y-15,14,6,"#fff0cf");}
        if(p>.75){
          const burst=(p-.75)*4;
          for(let j=0;j<9;j++){
            const angle=j*Math.PI*2/9;
            box(e.toX+Math.cos(angle)*burst*23,e.toY+Math.sin(angle)*burst*23,5,5,j%2?"#ffffff":e.color);
          }
        }
        ctx.restore();
      }
    }
    function draw(t){
      if(!raid)return;
      ctx.clearRect(0,0,W,H);
      backdrop(t);
      drawCreatures(t);
      drawEffects(t);
      if(raid.result){
        box(171,19,298,40,raid.result==="won"?"#1d5d54dd":"#6c3047dd");
        box(177,25,286,28,raid.result==="won"?"#4f9d78":"#a95167");
        ctx.fillStyle="#fff5dc";ctx.textAlign="center";ctx.font="bold 18px monospace";
        ctx.fillText(raid.result==="won"?"RAID CLEAR!":"RAID FAILED",320,45);
      }
    }
    function frame(t,token){
      if(token!==generation||!raid)return;
      draw(t);
      requestAnimationFrame(n=>frame(n,token));
    }
    return {
      show(nextRaid){raid=nextRaid;effects=[];bursts=[];const token=++generation;requestAnimationFrame(n=>frame(n,token));},
      hide(){raid=null;effects=[];bursts=[];generation++;},
      areaBurst(biome){if(raid)bursts.push({start:performance.now(),color:attackColors[biome]||"#ffffff"});},
      attack(attackerIndex,targetIndex,biome,damage){
        if(!raid)return;
        const now=performance.now(),spots=positions();
        const fromBoss=attackerIndex<0;
        const from=fromBoss?{x:493,y:158}:{x:spots[attackerIndex].x+40,y:spots[attackerIndex].y+22};
        const to=targetIndex<0?{x:506,y:145}:{x:spots[targetIndex].x+32,y:spots[targetIndex].y+22};
        effects.push({start:now,fromX:from.x,fromY:from.y,toX:to.x,toY:to.y,color:attackColors[biome]||"#fff4ac",biome,damage});
        if(fromBoss){raid.bossAttackUntil=now+370;raid.party[targetIndex].hitUntil=now+580;}
        else{raid.party[attackerIndex].attackUntil=now+320;raid.bossHitUntil=now+630;}
      }
    };
  }
  return {create};
})();
