/* Lautrec RPG V6 — moteur d'exploration jouable */
(() => {
  "use strict";
  const WORLD_W = 960, WORLD_H = 540;
  const maps = {
    room: {
      name: "Chambre du réveil", art: "assets/story/awakening.webp",
      spawn: {x:180,y:370}, walls:[[0,0,960,38],[0,0,42,540],[918,0,42,540],[0,502,960,38],[625,285,260,88],[60,90,120,155]],
      objects:[
        {x:755,y:345,type:"chest",label:"Fouiller la table",id:"room-key"},
        {x:125,y:165,type:"door",label:"Ouvrir la porte",to:"streets",tx:470,ty:430},
        {x:790,y:130,type:"clue",label:"Observer Veyre",text:"Depuis la fenêtre, Veyre semble attendre ton réveil."}
      ]
    },
    streets: {
      name: "Ruelles de Veyre", art: "assets/veyre-night.svg",
      spawn:{x:480,y:430}, walls:[[0,0,960,38],[0,0,35,540],[925,0,35,540],[0,505,960,35],[180,80,170,155],[610,70,190,150],[390,275,180,82]],
      objects:[
        {x:480,y:120,type:"door",label:"Descendre sous Veyre",to:"tunnels",tx:480,ty:440},
        {x:100,y:390,type:"npc",label:"Parler à Mira",text:"Mira : « Les murs ont des oreilles. Les ombres aussi. »"},
        {x:840,y:390,type:"chest",label:"Ouvrir la cache",id:"street-cache"},
        {x:480,y:330,type:"clue",label:"Lire l'inscription",text:"Une inscription fraîche : « Le quatrième te regarde. »"}
      ]
    },
    tunnels: {
      name:"Les quatre portes", art:"assets/story/tunnels.webp",
      spawn:{x:480,y:440}, walls:[[0,0,960,38],[0,0,35,540],[925,0,35,540],[0,505,960,35],[120,72,120,115],[305,72,120,115],[535,72,120,115],[720,72,120,115]],
      objects:[
        {x:180,y:205,type:"clue",label:"Examiner la porte I",text:"Elle a été éventrée depuis l'intérieur."},
        {x:365,y:205,type:"clue",label:"Examiner la porte II",text:"Des traces de lutte disparaissent dans le mur."},
        {x:595,y:205,type:"clue",label:"Examiner la porte III",text:"Quelqu'un a rayé ton ancien blason."},
        {x:780,y:205,type:"door",label:"Franchir la porte IV",to:"mirror",tx:480,ty:420},
        {x:90,y:425,type:"door",label:"Retourner en ville",to:"streets",tx:480,ty:155}
      ]
    },
    mirror: {
      name:"La chambre du miroir",art:"assets/story/mirror.webp",
      spawn:{x:480,y:420},walls:[[0,0,960,38],[0,0,35,540],[925,0,35,540],[0,505,960,35],[315,65,330,125]],
      objects:[
        {x:480,y:215,type:"boss",label:"Affronter le reflet",text:"Le reflet sourit avant toi."},
        {x:90,y:430,type:"door",label:"Revenir aux portes",to:"tunnels",tx:780,ty:260}
      ]
    }
  };

  const section = document.createElement("section");
  section.id = "explore";
  section.className = "screen";
  section.innerHTML = `
    <div class="explore-shell">
      <header class="explore-hud">
        <div><small>EXPLORATION</small><h2 id="zoneName">Veyre</h2></div>
        <div class="hud-vitals"><span>♥ <b id="exploreHp">28</b></span><span>◆ <b id="exploreGold">35</b></span></div>
        <button id="leaveExplore" aria-label="Quitter l'exploration">×</button>
      </header>
      <div class="canvas-wrap">
        <canvas id="gameCanvas" width="960" height="540" aria-label="Zone d'exploration de Lautrec"></canvas>
        <div class="zone-title" id="zoneTitle"></div>
        <div class="interaction-prompt" id="interactionPrompt"></div>
        <div class="game-dialogue" id="gameDialogue"><button aria-label="Fermer">×</button><small>VEYRE</small><p></p></div>
      </div>
      <div class="touch-controls">
        <div class="dpad">
          <button data-move="up" aria-label="Haut">▲</button>
          <button data-move="left" aria-label="Gauche">◀</button>
          <button data-move="down" aria-label="Bas">▼</button>
          <button data-move="right" aria-label="Droite">▶</button>
        </div>
        <button id="interactBtn" class="interact-btn"><span>✦</span>INTERAGIR</button>
      </div>
    </div>`;
  document.querySelector("main").appendChild(section);

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const dialogue = document.getElementById("gameDialogue");
  const prompt = document.getElementById("interactionPrompt");
  const keys = {up:false,down:false,left:false,right:false};
  const images = {};
  let running = false, last = 0, near = null, titleTimer = 0;

  function ensureExplorationState(){
    state.exploration ||= {map:"room",x:maps.room.spawn.x,y:maps.room.spawn.y,found:[]};
    state.exploration.found ||= [];
  }
  ensureExplorationState();
  const player = {x:state.exploration.x,y:state.exploration.y,r:15,speed:175,step:0,facing:1};

  function imageFor(src) {
    if (!images[src]) { const img = new Image(); img.src = src; images[src] = img; }
    return images[src];
  }
  Object.values(maps).forEach(map => imageFor(map.art));

  function currentMap(){ return maps[state.exploration.map] || maps.room; }
  function collides(x,y){
    return currentMap().walls.some(([wx,wy,ww,wh])=>x+player.r>wx&&x-player.r<wx+ww&&y+player.r>wy&&y-player.r<wy+wh);
  }
  function nearest(){
    let best=null,dist=72;
    currentMap().objects.forEach(o=>{const d=Math.hypot(o.x-player.x,o.y-player.y);if(d<dist){best=o;dist=d}});
    return best;
  }
  function persist(){
    state.exploration={...state.exploration,x:Math.round(player.x),y:Math.round(player.y)};
    save();
  }
  function showZone(){
    document.getElementById("zoneName").textContent=currentMap().name;
    const title=document.getElementById("zoneTitle");title.textContent=currentMap().name;title.classList.add("show");
    clearTimeout(titleTimer);titleTimer=setTimeout(()=>title.classList.remove("show"),2100);
    document.getElementById("exploreHp").textContent=state.hp;
    document.getElementById("exploreGold").textContent=state.gold;
  }
  function travel(to,x,y){
    state.exploration.map=to;player.x=x;player.y=y;near=null;persist();showZone();
    if(to==="tunnels") discover("Souterrains");
    if(to==="mirror") { state.scene="mirror"; journal("Exploration — La chambre du miroir."); }
  }
  function say(text){
    dialogue.querySelector("p").textContent=text;dialogue.classList.add("show");
    if(navigator.vibrate)navigator.vibrate(15);
  }
  function interact(){
    near=nearest();if(!near)return;
    if(near.type==="door")return travel(near.to,near.tx,near.ty);
    if(near.type==="chest"){
      if(state.exploration.found.includes(near.id))return say("Cette cache est vide.");
      state.exploration.found.push(near.id);state.gold+=near.id==="street-cache"?18:8;addXP(10);
      say(near.id==="street-cache"?"Tu trouves 18 pièces d'or et un sceau brisé.":"Sous la table : 8 pièces d'or et une note portant le chiffre IV.");
      journal("Exploration — Une cache secrète a été découverte.");persist();showZone();return;
    }
    if(near.type==="boss"){
      say("Le reflet traverse la surface. Prépare-toi.");
      setTimeout(()=>{dialogue.classList.remove("show");running=false;startCombat("Le reflet de Lautrec",[{name:"Reflet impossible",hp:26+state.level*3,maxHp:26+state.level*3,attack:6+state.level,def:14}], "mirrorTalk");},900);return;
    }
    say(near.text||near.label);
  }
  function update(dt){
    if(dialogue.classList.contains("show"))return;
    let dx=(keys.right?1:0)-(keys.left?1:0),dy=(keys.down?1:0)-(keys.up?1:0);
    if(dx||dy){const len=Math.hypot(dx,dy);dx/=len;dy/=len;const nx=player.x+dx*player.speed*dt,ny=player.y+dy*player.speed*dt;if(!collides(nx,player.y))player.x=nx;if(!collides(player.x,ny))player.y=ny;player.step+=dt*10;if(dx)player.facing=Math.sign(dx)}
    near=nearest();prompt.textContent=near?"✦ "+near.label:"";prompt.classList.toggle("show",!!near);
  }
  function draw(){
    const map=currentMap(),img=imageFor(map.art);
    ctx.clearRect(0,0,WORLD_W,WORLD_H);
    if(img.complete&&img.naturalWidth){ctx.drawImage(img,0,0,WORLD_W,WORLD_H)}else{const g=ctx.createLinearGradient(0,0,0,WORLD_H);g.addColorStop(0,"#172036");g.addColorStop(1,"#0a090e");ctx.fillStyle=g;ctx.fillRect(0,0,WORLD_W,WORLD_H)}
    ctx.fillStyle="rgba(5,6,10,.34)";ctx.fillRect(0,0,WORLD_W,WORLD_H);
    currentMap().objects.forEach(o=>{
      const active=o===near;ctx.save();ctx.translate(o.x,o.y);
      if(o.type==="chest"){ctx.fillStyle=state.exploration.found.includes(o.id)?"#40372d":"#9b6b35";ctx.fillRect(-15,-10,30,20);ctx.strokeStyle="#e6b85e";ctx.strokeRect(-15,-10,30,20)}
      else if(o.type==="npc"){ctx.fillStyle="#6f7284";ctx.beginPath();ctx.arc(0,-10,9,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-14,22);ctx.lineTo(0,-3);ctx.lineTo(14,22);ctx.fill()}
      else{ctx.fillStyle=active?"#ffe6a0":"#c59a51";ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(9,0);ctx.lineTo(0,10);ctx.lineTo(-9,0);ctx.fill()}
      if(active){ctx.strokeStyle="rgba(255,225,145,.8)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,25+Math.sin(performance.now()/180)*3,0,Math.PI*2);ctx.stroke()}ctx.restore();
    });
    const bob=Math.sin(player.step)*2;ctx.save();ctx.translate(player.x,player.y+bob);ctx.scale(player.facing,1);
    ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(0,18,20,7,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#20161e";ctx.beginPath();ctx.moveTo(-18,23);ctx.lineTo(-9,-13);ctx.lineTo(0,-27);ctx.lineTo(12,-12);ctx.lineTo(18,23);ctx.fill();
    ctx.fillStyle="#7e2e3a";ctx.beginPath();ctx.moveTo(-12,-9);ctx.lineTo(11,-14);ctx.lineTo(18,16);ctx.lineTo(-17,8);ctx.fill();
    ctx.fillStyle="#d7b06a";ctx.beginPath();ctx.arc(0,-28,7,0,Math.PI*2);ctx.fill();ctx.restore();
    const vignette=ctx.createRadialGradient(player.x,player.y,80,player.x,player.y,430);vignette.addColorStop(0,"rgba(0,0,0,0)");vignette.addColorStop(1,"rgba(0,0,0,.68)");ctx.fillStyle=vignette;ctx.fillRect(0,0,WORLD_W,WORLD_H);
  }
  function loop(now){if(!running)return;const dt=Math.min(.035,(now-last)/1000||0);last=now;update(dt);draw();requestAnimationFrame(loop)}
  function enterExplore(){
    ensureExplorationState();
    const savedMap=currentMap();
    player.x=Number.isFinite(state.exploration.x)?state.exploration.x:savedMap.spawn.x;
    player.y=Number.isFinite(state.exploration.y)?state.exploration.y:savedMap.spawn.y;
    showScreen("explore");running=true;last=performance.now();showZone();requestAnimationFrame(loop);
  }
  function leaveExplore(){running=false;persist();showScreen("adventure")}

  document.getElementById("leaveExplore").onclick=leaveExplore;
  document.getElementById("interactBtn").onclick=interact;
  dialogue.querySelector("button").onclick=()=>dialogue.classList.remove("show");
  section.querySelectorAll("[data-move]").forEach(button=>{
    const dir=button.dataset.move;
    const on=e=>{e.preventDefault();keys[dir]=true},off=e=>{e.preventDefault();keys[dir]=false};
    button.addEventListener("pointerdown",on);button.addEventListener("pointerup",off);button.addEventListener("pointercancel",off);button.addEventListener("pointerleave",off);
  });
  const keyMap={ArrowUp:"up",w:"up",z:"up",ArrowDown:"down",s:"down",ArrowLeft:"left",a:"left",q:"left",ArrowRight:"right",d:"right"};
  addEventListener("keydown",e=>{if(keyMap[e.key]){keys[keyMap[e.key]]=true;e.preventDefault()}if((e.key===" "||e.key==="Enter")&&running){interact();e.preventDefault()}});
  addEventListener("keyup",e=>{if(keyMap[e.key])keys[keyMap[e.key]]=false});

  const launch=document.createElement("button");launch.id="exploreLaunch";launch.className="explore-launch";launch.innerHTML="<span>⚔</span><b>EXPLORER VEYRE</b><small>Déplace Lautrec librement</small>";
  document.querySelector("#adventure .story-stage")?.appendChild(launch);launch.onclick=enterExplore;
  const homeLaunch=launch.cloneNode(true);homeLaunch.id="homeExploreLaunch";document.querySelector("#home .cta")?.appendChild(homeLaunch);homeLaunch.onclick=enterExplore;
})();
