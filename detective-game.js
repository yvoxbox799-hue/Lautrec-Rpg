/* Lautrec RPG V7 — aventure d'enquête latérale cinématique */
(() => {
  "use strict";
  const zones = {
    room:{name:"La chambre du réveil",image:"assets/story/awakening.webp",spawn:16,goal:"Trouve ce que cache la chambre.",actors:[
      {id:"note",x:36,icon:"◇",name:"Billet",kind:"clue"},
      {id:"key",x:72,icon:"⚿",name:"Clé noire IV",kind:"clue"},
      {id:"door-room",x:91,icon:"▥",name:"Porte",kind:"exit",to:"street",at:9}
    ]},
    street:{name:"Les ruelles de Veyre",image:"assets/veyre-night.svg",spawn:10,goal:"Interroge Mira et retrouve l'entrée des souterrains.",actors:[
      {id:"mira",x:35,icon:"♟",name:"Mira",kind:"npc"},
      {id:"witness",x:60,icon:"♙",name:"Vieil horloger",kind:"npc"},
      {id:"inscription",x:76,icon:"◇",name:"Inscription",kind:"clue"},
      {id:"gate",x:93,icon:"▥",name:"Passage souterrain",kind:"exit",to:"tunnels",at:8}
    ]},
    tunnels:{name:"Les quatre portes",image:"assets/story/tunnels.webp",spawn:8,goal:"Découvre qui a ouvert la quatrième porte.",actors:[
      {id:"tracks",x:28,icon:"◇",name:"Empreintes",kind:"clue"},
      {id:"mask",x:52,icon:"♟",name:"Inconnu masqué",kind:"npc"},
      {id:"door-four",x:88,icon:"Ⅳ",name:"Quatrième porte",kind:"exit",to:"mirror",at:10},
      {id:"back-street",x:3,icon:"‹",name:"Retourner en ville",kind:"exit",to:"street",at:88}
    ]},
    mirror:{name:"Le miroir impossible",image:"assets/story/mirror.webp",spawn:8,goal:"Obtiens la vérité du quatrième Lautrec.",actors:[
      {id:"reflection",x:68,icon:"♛",name:"Le Reflet",kind:"npc"},
      {id:"back-tunnels",x:3,icon:"‹",name:"Revenir aux portes",kind:"exit",to:"tunnels",at:82}
    ]}
  };
  const clueNames={note:"Le billet impossible",key:"La clé noire IV",inscription:"Le message du mur",tracks:"Les empreintes de Lautrec",clock:"L'heure effacée",mask:"Le sceau de la Guilde"};

  function ensure(){
    state.detective ||= {zone:"room",x:16,clues:[],trust:{Mira:0,Horloger:0,Masque:0,Reflet:0},visited:[],objective:"Trouve ce que cache la chambre."};
    state.detective.clues ||= [];state.detective.trust ||= {Mira:0,Horloger:0,Masque:0,Reflet:0};
  }
  ensure();

  const screen=document.createElement("section");screen.id="detective";screen.className="screen";
  screen.innerHTML=`
    <div class="detective-game">
      <header class="detective-hud">
        <div><small>ENQUÊTE EN COURS</small><h2 id="detectiveZone"></h2></div>
        <div class="detective-score"><span>Indices <b id="clueScore">0</b></span><span>Intuition <b id="insightScore">+${state.skills.intuition}</b></span></div>
        <button id="detectiveLeave" aria-label="Quitter">×</button>
      </header>
      <div class="objective"><span>OBJECTIF</span><p id="detectiveObjective"></p><button id="clueBookBtn">Carnet</button></div>
      <div class="side-stage" id="sideStage">
        <div class="parallax-back"></div><div class="parallax-light"></div><div class="rain-layer"></div>
        <div class="actors" id="actors"></div>
        <div class="lautrec-sprite" id="lautrecSprite"><i></i><b></b><em></em></div>
        <div class="near-prompt" id="nearPrompt"></div>
        <div class="dialogue-scene" id="dialogueScene">
          <div class="speaker-portrait" id="speakerPortrait"></div>
          <div class="dialogue-box"><small id="speakerName"></small><p id="dialogueText"></p><div id="dialogueChoices"></div></div>
        </div>
      </div>
      <div class="cinema-controls">
        <button id="walkLeft" aria-label="Marcher à gauche">◀</button>
        <div class="walk-track"><span>APPROCHE-TOI D'UN INDICE OU D'UN PERSONNAGE</span></div>
        <button id="walkRight" aria-label="Marcher à droite">▶</button>
        <button id="talkButton"><span>✦</span> EXAMINER</button>
      </div>
    </div>
    <div class="clue-book" id="clueBook"><article><header><div><small>CARNET DE LAUTREC</small><h2>Indices recueillis</h2></div><button>×</button></header><div id="cluePages"></div></article></div>`;
  document.querySelector("main").appendChild(screen);

  const stage=document.getElementById("sideStage"),sprite=document.getElementById("lautrecSprite"),actorsEl=document.getElementById("actors");
  const dialogue=document.getElementById("dialogueScene"),prompt=document.getElementById("nearPrompt");
  let held=0,raf=0,last=0,near=null,playing=false;

  function zone(){return zones[state.detective.zone]||zones.room}
  function has(id){return state.detective.clues.includes(id)}
  function addClue(id,text){
    if(has(id))return false;state.detective.clues.push(id);addXP(8);journal("Indice : "+(clueNames[id]||id)+".");
    state.detective.objective=text||zone().goal;save();renderHud();return true;
  }
  function renderHud(){
    document.getElementById("detectiveZone").textContent=zone().name;
    document.getElementById("clueScore").textContent=state.detective.clues.length;
    document.getElementById("insightScore").textContent="+"+state.skills.intuition;
    document.getElementById("detectiveObjective").textContent=state.detective.objective||zone().goal;
  }
  function renderZone(){
    const z=zone();stage.style.setProperty("--scene-image",`url("${z.image}")`);
    actorsEl.innerHTML=z.actors.map(a=>`<button class="world-actor ${a.kind}" data-id="${a.id}" style="left:${a.x}%"><i>${a.icon}</i><b>${a.name}</b>${a.kind==="clue"&&has(a.id)?'<em>✓ TROUVÉ</em>':""}</button>`).join("");
    actorsEl.querySelectorAll(".world-actor").forEach(el=>el.onclick=()=>{const a=z.actors.find(x=>x.id===el.dataset.id);if(Math.abs(a.x-state.detective.x)<13)interact(a)});
    sprite.style.left=state.detective.x+"%";renderHud();updateNear();
  }
  function updateNear(){
    near=zone().actors.reduce((best,a)=>Math.abs(a.x-state.detective.x)<Math.abs((best?.x??999)-state.detective.x)?a:best,null);
    if(near&&Math.abs(near.x-state.detective.x)<12){prompt.textContent="✦ "+(near.kind==="npc"?"PARLER À ":"EXAMINER ")+near.name;prompt.classList.add("show")}
    else{near=null;prompt.classList.remove("show")}
  }
  function frame(t){
    if(!playing)return;const dt=Math.min(.04,(t-last)/1000||0);last=t;
    if(held&&!dialogue.classList.contains("show")){state.detective.x=Math.max(2,Math.min(96,state.detective.x+held*dt*17));sprite.style.left=state.detective.x+"%";sprite.classList.add("walking");sprite.classList.toggle("left",held<0);stage.style.setProperty("--pan",((state.detective.x-50)*-.08)+"%");updateNear()}else sprite.classList.remove("walking");
    raf=requestAnimationFrame(frame);
  }
  function showDialogue(name,text,choices){
    document.getElementById("speakerName").textContent=name.toUpperCase();document.getElementById("dialogueText").textContent=text;
    document.getElementById("speakerPortrait").textContent=({Mira:"♟","Vieil horloger":"♙","Inconnu masqué":"♞","Le Reflet":"♛",Lautrec:"◆"})[name]||"◇";
    const box=document.getElementById("dialogueChoices");box.innerHTML="";
    choices.forEach((c,i)=>{const b=document.createElement("button");b.innerHTML=`<span>${i+1}</span>${c.text}`;if(c.requires&&!has(c.requires)){b.disabled=true;b.innerHTML+=`<small>Indice requis : ${clueNames[c.requires]}</small>`}b.onclick=()=>c.action();box.appendChild(b)});
    dialogue.classList.add("show");if(navigator.vibrate)navigator.vibrate(10);
  }
  function closeDialogue(){dialogue.classList.remove("show");save()}
  function investigate(id,name,text,next){
    const fresh=addClue(id,next);showDialogue("Lautrec",text+(fresh?"\n\nNouvel indice ajouté au carnet.":"\n\nCet indice est déjà dans ton carnet."),[{text:"Continuer l'enquête",action:closeDialogue}]);renderZone();
  }
  const talks={
    mira(){
      showDialogue("Mira","« Tu es en retard de trois vies, Lautrec. Et quelqu'un efface les traces des précédentes. »",[
        {text:"Que sais-tu de la clé noire ?",requires:"key",action(){state.detective.trust.Mira+=2;showDialogue("Mira","« Elle n'ouvre pas une porte. Elle ouvre le souvenir de celui qui la tient. La Guilde la cherche depuis des années. »",[{text:"Lui montrer le billet",requires:"note",action(){addClue("clock","Confronte l'horloger à l'heure effacée.");showDialogue("Mira","Mira pâlit. « Cette écriture est la tienne. Mais ce billet a cent ans. Va voir l'horloger. »",[{text:"Je vais enquêter",action:closeDialogue}])}},{text:"Garder la clé secrète",action:closeDialogue}])}},
        {text:"Pourquoi devrais-je te croire ?",action(){state.detective.trust.Mira++;showDialogue("Mira","« Tu ne devrais pas. Observe-moi, puis décide. C'est ce que le vrai Lautrec ferait. »",[{text:"Lire son comportement",action(){const r=roll("intuition",12);showDialogue("Lautrec",r.ok?"Elle a peur, mais elle ne ment pas.":"Son visage reste impossible à lire.",[{text:"Continuer",action:closeDialogue}])}},{text:"Partir",action:closeDialogue}])}},
        {text:"Mettre fin à la conversation",action:closeDialogue}
      ]);
    },
    witness(){
      showDialogue("Vieil horloger","« Je ne répare plus les horloges. Depuis que la treizième heure a disparu, elles mentent toutes. »",[
        {text:"Parler de l'heure effacée",requires:"clock",action(){addClue("mask","Trouve le porteur du sceau dans les souterrains.");showDialogue("Vieil horloger","« À treize heures, un homme masqué est descendu sous la ville. Il portait le sceau de la Guilde. »",[{text:"Noter son témoignage",action:closeDialogue}])}},
        {text:"L'interroger sur le quatrième Lautrec",requires:"inscription",action(){showDialogue("Vieil horloger","« Je l'ai vu dans une vitre. Il avait ton visage, mais pas ton regard. »",[{text:"Continuer",action:closeDialogue}])}},
        {text:"Le laisser tranquille",action:closeDialogue}
      ]);
    },
    mask(){
      showDialogue("Inconnu masqué","« Sujet IV confirmé. Tu aurais dû oublier cette nuit comme les autres. »",[
        {text:"Lui montrer le sceau décrit par l'horloger",requires:"mask",action(){state.detective.trust.Masque+=2;showDialogue("Inconnu masqué","Il baisse son arme. « Le quatrième n'est pas ton double. C'est le premier Lautrec, celui qui refuse de mourir. »",[{text:"Qui l'a enfermé ?",action(){addClue("origin","Franchis la porte IV et confronte le Reflet.");showDialogue("Inconnu masqué","« Toi. Dans une vie dont tu as demandé l'effacement. »",[{text:"Aller jusqu'au bout",action:closeDialogue}])}},{text:"Je n'en crois rien",action:closeDialogue}])}},
        {text:"Le menacer",action(){closeDialogue();playing=false;startCombat("Gardien masqué",[{name:"Gardien masqué",hp:20,maxHp:20,attack:6,def:13}],"mirror")}},
        {text:"Reculer",action:closeDialogue}
      ]);
    },
    reflection(){
      showDialogue("Le Reflet","« Enfin. Tu as assez changé pour que je ne puisse plus te prévoir. »",[
        {text:"Tu es le premier Lautrec.",requires:"origin",action(){state.detective.trust.Reflet++;showDialogue("Le Reflet","Son sourire disparaît. « Alors ils t'ont tout raconté. Pas encore pourquoi tu m'as créé. »",[{text:"Pour porter mes crimes ?",action(){addClue("truth","Décide du sort du premier Lautrec.");showDialogue("Le Reflet","« Pour porter ta mémoire. Tu voulais rester innocent en me donnant tout ce que tu regrettais. »",[{text:"Affronter la vérité",action(){state.scene="finalChoice";closeDialogue();playing=false;showScreen("adventure");render()}},{text:"Refuser et combattre",action(){closeDialogue();playing=false;startCombat("Le premier Lautrec",[{name:"Premier Lautrec",hp:34,maxHp:34,attack:8,def:15}],"escapeEnding")}}])}},{text:"Pourquoi m'attendre ?",action(){showDialogue("Le Reflet","« Parce qu'un souvenir ne peut pas vivre sans celui qui l'a abandonné. »",[{text:"Continuer",action:closeDialogue}])}}])}},
        {text:"Observer avant de répondre",action(){const r=roll("perception",15);showDialogue("Lautrec",r.ok?"Le reflet évite de regarder la clé. Il la craint.":"Le miroir brouille chaque détail important.",[{text:"Continuer",action:closeDialogue}])}},
        {text:"Quitter le miroir",action:closeDialogue}
      ]);
    }
  };
  function interact(a=near){
    if(!a)return;if(a.kind==="exit"){travel(a);return}if(a.kind==="npc"){talks[a.id]?.();return}
    if(a.id==="note")investigate("note","Billet","Le papier est ancien, mais l'encre est fraîche. La phrase est écrite de ta main.","Trouve la clé noire cachée dans la chambre.");
    else if(a.id==="key")investigate("key","Clé noire IV","La clé est tiède. Quand tu la touches, quatre silhouettes traversent ta mémoire.","Sors de la chambre et retrouve la femme au manteau gris.");
    else if(a.id==="inscription")investigate("inscription","Inscription","Sous la suie : « Lautrec ment lorsqu'il dit qu'il ne se souvient pas. »","Interroge les habitants au sujet du quatrième Lautrec.");
    else if(a.id==="tracks")investigate("tracks","Empreintes","Ces empreintes sont exactement les tiennes, jusque dans l'usure du talon gauche.","Interroge l'inconnu masqué.");
  }
  function travel(a){
    if(a.id==="gate"&&!has("clock"))return showDialogue("Lautrec","Descendre maintenant serait avancer à l'aveugle. Mira ou l'horloger sait quelque chose.",[{text:"Continuer l'enquête",action:closeDialogue}]);
    if(a.id==="door-four"&&!has("origin"))return showDialogue("Lautrec","La porte IV ne réagit pas. L'inconnu masqué connaît probablement son secret.",[{text:"L'interroger",action:closeDialogue}]);
    state.detective.zone=a.to;state.detective.x=a.at;state.detective.objective=zones[a.to].goal;if(!state.detective.visited.includes(a.to)){state.detective.visited.push(a.to);addXP(5)}save();renderZone();
  }
  function openBook(){
    const book=document.getElementById("clueBook"),pages=document.getElementById("cluePages");
    pages.innerHTML=state.detective.clues.map((id,i)=>`<div><span>${String(i+1).padStart(2,"0")}</span><p><b>${clueNames[id]||"Vérité dissimulée"}</b><small>${({note:"Le billet porte ton écriture mais semble âgé de cent ans.",key:"Elle ouvre des souvenirs, pas des serrures.",inscription:"Quelqu'un accuse Lautrec de simuler son amnésie.",tracks:"Un autre Lautrec est passé par les souterrains.",clock:"La treizième heure a été retirée des horloges.",mask:"La Guilde surveille la porte IV.",origin:"Le Reflet serait le premier Lautrec.",truth:"Le Reflet porte les souvenirs que Lautrec a rejetés."})[id]||"Une pièce essentielle de l'enquête."}</small></p></div>`).join("")||"<em>Aucun indice recueilli.</em>";book.classList.add("open");
  }
  function start(){
    ensure();document.getElementById("explore")?.classList.remove("active");showScreen("detective");screen.classList.add("active");playing=true;last=performance.now();renderZone();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
  }
  function leave(){playing=false;save();showScreen("adventure")}
  ["walkLeft","walkRight"].forEach((id,i)=>{const b=document.getElementById(id),dir=i?-1:1;b.addEventListener("pointerdown",e=>{e.preventDefault();held=dir});["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>held=0))});
  addEventListener("keydown",e=>{if(!playing)return;if(e.key==="ArrowLeft")held=-1;if(e.key==="ArrowRight")held=1;if((e.key===" "||e.key==="Enter")&&!dialogue.classList.contains("show"))interact()});
  addEventListener("keyup",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight")held=0});
  document.getElementById("talkButton").onclick=()=>interact();document.getElementById("detectiveLeave").onclick=leave;
  document.getElementById("clueBookBtn").onclick=openBook;document.querySelector("#clueBook header button").onclick=()=>document.getElementById("clueBook").classList.remove("open");
  document.getElementById("clueBook").onclick=e=>{if(e.target.id==="clueBook")e.currentTarget.classList.remove("open")};

  setTimeout(()=>{
    ["exploreLaunch","homeExploreLaunch"].forEach(id=>{const b=document.getElementById(id);if(b){b.innerHTML="<span>◆</span><b>COMMENCER L'ENQUÊTE</b><small>Explore, interroge et rassemble les preuves</small>";b.onclick=start}});
  },0);
})();
