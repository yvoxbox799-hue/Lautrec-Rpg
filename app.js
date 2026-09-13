
const SAVE_KEY="lautrec_rpg_v3";
const baseItems=[
{id:"dagger",name:"Dague d’ombre",type:"weapon",rarity:"uncommon",power:2,price:22},
{id:"cloak",name:"Cape des ruelles",type:"armor",rarity:"uncommon",power:1,price:28},
{id:"lockpick",name:"Rossignols fins",type:"tool",rarity:"rare",power:2,price:35},
{id:"ring",name:"Anneau du quatrième",type:"trinket",rarity:"epic",power:3,price:80},
{id:"tonic",name:"Tonique rouge",type:"consumable",rarity:"common",power:8,price:12},
{id:"smoke",name:"Bombe fumigène",type:"consumable",rarity:"uncommon",power:1,price:18}
];
const companionsDB={
Mira:{name:"Mira",role:"Espionne",hp:20,maxHp:20,attack:5,skill:"intuition",loyalty:15,recruited:false,desc:"Observe les gens mieux qu’elle ne leur fait confiance."},
Elias:{name:"Elias",role:"Assassin repenti",hp:26,maxHp:26,attack:6,skill:"discretion",loyalty:5,recruited:false,desc:"Connaît la Guilde et beaucoup trop de secrets."},
Valeria:{name:"Valeria",role:"Archère",hp:24,maxHp:24,attack:7,skill:"perception",loyalty:0,recruited:false,desc:"Une tireuse calme qui semble avoir déjà entendu parler de Lautrec."}
};
const initialState=()=>({
version:3,scene:"awakening",level:1,xp:0,hp:28,maxHp:28,gold:35,rep:0,morality:0,
stats:{dexterite:18,intelligence:14,sagesse:13,charisme:12},
skills:{perception:6,rue:7,discretion:9,vol:9,escamotage:8,intuition:5,bluff:5,athletisme:4},
inventory:[{...baseItems[0]}],equipment:{weapon:"Dague d’ombre",armor:null,trinket:null},
talents:["Œil du voleur — +2 narratif pour repérer pièges et passages","Pas silencieux — avantage narratif en infiltration"],
injuries:[],relations:{Mira:0,Elias:0,Valeria:0},factions:{"Guilde des assassins":-10,"Archives royales":0,"Habitants de Veyre":0},
companions:JSON.parse(JSON.stringify(companionsDB)),
quests:[
{id:"q1",title:"Le quatrième Lautrec",desc:"Découvrir ce que veut la quatrième version de toi-même.",done:false,main:true},
{id:"q2",title:"La Maison sans porte",desc:"Trouver un moyen d’entrer dans la demeure impossible.",done:false,main:true}
],
secrets:[],journal:[],log:[],discovered:["Quartier Bas"],worldEvents:[],flags:{keyIV:false,mirrorSeen:false,miraMet:false,archives:false,moon:false},
lastRoll:null,lastText:"",chapter:1,combat:null,shopSeed:1,ending:null,turns:0
});
let state=load()||initialState();

const scenes={
awakening:{chapter:"Chapitre I — La ville qui se souvient",title:"Le réveil",text:`Lautrec ouvre les yeux dans une chambre qu’il ne reconnaît pas.

Veyre dort sous la brume. Sur la table, un billet :
« Tu as déjà vécu cette nuit. Cette fois, ne fais pas le même choix. »

Quelqu’un monte l’escalier.`,choices:[
["Observer la pièce sans bouger","room","perception",12],["Se cacher près de la porte","visitor","discretion",13],["Ouvrir avant qu’on frappe","visitor",null,null]]},
room:{chapter:"Chapitre I — La ville qui se souvient",title:"La clé noire",text:`Derrière le miroir, une cavité contient une clé noire marquée IV.

Elle est tiède.

Les pas s’arrêtent devant la porte.`,enter:s=>{if(!s.flags.keyIV){s.flags.keyIV=true;s.inventory.push({id:"keyIV",name:"Clé noire IV",type:"quest",rarity:"rare",power:0,price:0});addXP(20);secret("La clé IV semble ouvrir un souvenir plutôt qu’une serrure.");}},choices:[
["Prendre la clé et se cacher","visitor","escamotage",10],["Examiner la clé","key","intuition",11],["Attendre","visitor",null,null]]},
key:{chapter:"Chapitre I — La ville qui se souvient",title:"Mémoire étrangère",text:`Quatre silhouettes identiques apparaissent dans ton esprit devant un miroir.

Une voix murmure :
« Tu l’as donc retrouvée. »`,choices:[["Se retourner","mira",null,null],["Attaquer","mira","discretion",14],["Mentir","mira","bluff",13]]},
visitor:{chapter:"Chapitre I — La ville qui se souvient",title:"L’intruse",text:`Une femme au manteau gris entre. Son insigne : un œil barré d’une lame.

« Tu es en retard de trois vies. »`,choices:[["Sortir de l’ombre","mira",null,null],["La suivre","tunnels","discretion",13],["Tenter de la voler","mira","vol",15]]},
mira:{chapter:"Chapitre I — La ville qui se souvient",title:"Mira",enter:s=>{if(!s.flags.miraMet){s.flags.miraMet=true;s.relations.Mira+=10;discover("Vieille Ville");addXP(15)}},text:`« Je m’appelle Mira. Nous nous sommes déjà rencontrés. Plusieurs fois. »

Elle affirme qu’un autre Lautrec manipule les événements de la ville.`,choices:[["La croire et la suivre","tunnels",null,null],["Lire son comportement","miraRead","intuition",12],["Lui proposer de venir avec moi","recruitMira","bluff",11]]},
recruitMira:{chapter:"Chapitre I — La ville qui se souvient",title:"Une alliance fragile",enter:s=>{recruit("Mira");s.relations.Mira+=5},text:`Mira hésite longuement.

« Très bien. Mais si tu recommences à devenir comme l’autre Lautrec, je partirai. »

Elle rejoint le groupe.`,choices:[["Descendre sous la ville","tunnels",null,null],["Aller aux Archives","archives",null,null]]},
miraRead:{chapter:"Chapitre I — La ville qui se souvient",title:"Une peur dissimulée",text:`Mira ne ment pas sur le danger.

Mais elle a peur de toi.

Une cloche sonne trois fois.
« Il sait que tu es réveillé. »`,choices:[["Suivre Mira","tunnels",null,null],["Partir aux Archives","archives","rue",12]]},
tunnels:{chapter:"Chapitre II — Sous Veyre",title:"Les quatre portes",enter:s=>discover("Souterrains"),text:`Quatre portes numérotées. Les trois premières ont été forcées de l’intérieur.

La quatrième a été ouverte de l’extérieur.

Tes propres empreintes couvrent le sol.`,choices:[["Entrer par IV","ambush","perception",13],["Suivre les empreintes","mirror","perception",14],["Revenir vers la Guilde","guild","rue",13]]},
ambush:{chapter:"Chapitre II — Sous Veyre",title:"L’embuscade",text:`Trois silhouettes masquées surgissent des alcôves.

L’une d’elles dit :
« Sujet IV confirmé. »`,enter:s=>startCombat("Assassins des souterrains",[
{name:"Éclaireur masqué",hp:14,maxHp:14,attack:4,def:11},
{name:"Lame grise",hp:18,maxHp:18,attack:5,def:12}
],"mirror"),choices:[]},
archives:{chapter:"Chapitre II — Les noms effacés",title:"Archives royales",enter:s=>{if(!s.flags.archives){s.flags.archives=true;discover("Archives");addXP(25);secret("Quatre signatures de Lautrec existent au même jour.");}},text:`Quatre signatures identiques. Même date. Même écriture.

À côté de la quatrième :
« Sujet IV — ne jamais lui montrer le miroir. »

Une page a été arrachée.`,choices:[["Voler le registre","guild","vol",14],["Chercher la page","mansion","rue",14],["Interroger l’archiviste","archivist","bluff",13]]},
archivist:{chapter:"Chapitre II — Les noms effacés",title:"L’archiviste",moral:"L’archiviste pourrait perdre son poste si tu le forces à parler.",text:`L’homme tremble.

« Je peux vous dire qui a pris la page. Mais si on apprend que j’ai parlé, je suis mort. »`,choices:[["Le rassurer et payer 10 or","mansion",null,null,"kind"],["Le menacer","mansion","bluff",12,"cruel"],["Le laisser tranquille","guild",null,null,"kind"]]},
guild:{chapter:"Chapitre II — Les noms effacés",title:"La Guilde qui n’existe pas",enter:s=>discover("Guilde des assassins"),text:`Dans une taverne, un homme borgne joue seul aux dés.

« Lautrec. Assieds-toi. Essaie de ne tuer personne avant la fin de la conversation. »`,choices:[["S’asseoir","elias",null,null],["Le provoquer","elias","bluff",13],["Observer la salle","elias","perception",12]]},
elias:{chapter:"Chapitre II — Les noms effacés",title:"Elias",enter:s=>{s.relations.Elias=Math.max(s.relations.Elias,10)},text:`Elias affirme avoir connu trois Lautrec.

Le premier voulait sauver Veyre.
Le deuxième la contrôler.
Le troisième disparaître.

« Et toi ? »`,choices:[["Lui demander de rejoindre le groupe","recruitElias","bluff",12],["Demander où est le quatrième","mansion",null,null],["Répondre : je ne sais pas encore","mansion",null,null]]},
recruitElias:{chapter:"Chapitre II — Les noms effacés",title:"L’assassin repenti",enter:s=>{recruit("Elias");s.relations.Elias+=5},text:`Elias range ses dés.

« D’accord. Mais si on croise mon ancienne Guilde, je ne promets rien. »

Il rejoint le groupe.`,choices:[["Aller à la Maison sans porte","mansion",null,null],["Chercher des renforts au Port noir","port",null,null]]},
port:{chapter:"Chapitre III — Le Port noir",title:"La flèche dans la pluie",enter:s=>discover("Port noir"),text:`Une flèche se plante dans le mur à deux centimètres de ton visage.

Sur un toit, une archère te fait signe.

« Lautrec ? J’espérais que les rumeurs étaient fausses. »`,choices:[["Monter la voir","valeria",null,null],["Lui voler sa prochaine flèche","valeria","escamotage",14],["L’ignorer","mansion",null,null]]},
valeria:{chapter:"Chapitre III — Le Port noir",title:"Valeria",text:`Valeria connaît ton nom, ton ancien titre de noblesse et une histoire que tu n’as jamais racontée à personne.

« J’ai connu un autre toi. Il m’a sauvé la vie. »`,choices:[["Lui demander de venir","recruitValeria","bluff",12],["Lui demander ce qu’elle sait","mansion",null,null]]},
recruitValeria:{chapter:"Chapitre III — Le Port noir",title:"L’archère",enter:s=>{recruit("Valeria");s.relations.Valeria+=8},text:`Valeria accepte.

« Je viens jusqu’à ce que je sache si tu es meilleur ou pire que l’autre. »`,choices:[["Marcher vers la Maison sans porte","mansion",null,null]]},
mansion:{chapter:"Chapitre IV — La Maison sans porte",title:"La demeure impossible",enter:s=>discover("Maison sans porte"),text:`La Maison sans porte apparaît dans une rue absente de toutes les cartes.

Une voix vient de l’intérieur :
« Tu as enfin appris à ne pas suivre le scénario. »`,choices:[["Trouver un passage","mansionInside","perception",15],["Utiliser la clé IV","mansionInside",null,null],["Escalader","mansionInside","athletisme",14]]},
mansionInside:{chapter:"Chapitre IV — La Maison sans porte",title:"La pièce des choix oubliés",text:`Des centaines de fiches racontent des décisions prises par Lautrec.

Certaines sont les tiennes.
D’autres décrivent des vies impossibles.

Au centre : un miroir recouvert d’un drap noir.`,choices:[["Retirer le drap","mirror",null,null],["Brûler les fiches","burn","null",null,"cruel"],["Lire les vies possibles","echoes","intuition",14]]},
burn:{chapter:"Chapitre IV — La Maison sans porte",title:"Feu dans la mémoire",enter:s=>{s.morality-=2;addXP(35);s.factions["Archives royales"]-=5},text:`Les fiches brûlent.

Des souvenirs étrangers disparaissent.

Quelqu’un hurle quelque part dans la maison.

Pas de douleur.

De colère.`,choices:[["Suivre le cri","mirror",null,null],["Fuir vers la rue","streets",null,null]]},
echoes:{chapter:"Chapitre IV — La Maison sans porte",title:"Les vies possibles",enter:s=>{secret("La Maison archive des chronologies possibles.");addXP(40)},text:`Dans une vie, tu deviens maître de la Guilde.
Dans une autre, tu détruis Veyre.
Dans une autre encore, tu épouses Mira.

Une fiche est encore blanche.

Ton nom est déjà dessus.`,choices:[["Écrire soi-même la prochaine décision","mirror","bluff",13],["Déchirer la fiche","mirror",null,null]]},
mirror:{chapter:"Chapitre V — Le quatrième",title:"Le miroir",enter:s=>s.flags.mirrorSeen=true,text:`Ton reflet ne reproduit pas tes mouvements.

Il sourit.

« Enfin. Tu as assez changé pour que je ne puisse plus te prévoir. »`,choices:[["Lui parler","fourthTalk",null,null],["Observer","fourthObserve","perception",15],["Briser le miroir","boss","athletisme",15]]},
fourthObserve:{chapter:"Chapitre V — Le quatrième",title:"La faille",text:`L’autre Lautrec possède tes cicatrices.

Mais pas ton médaillon.

Le métal chauffe :
« Un seul peut choisir ce qu’il devient. »`,choices:[["Ouvrir le médaillon","inherit",null,null],["Faire semblant de ne rien comprendre","fourthTalk","bluff",15]]},
fourthTalk:{chapter:"Chapitre V — Le quatrième",title:"Le marché",moral:"Fusionner pourrait donner tout son savoir à Lautrec… mais effacer quelque chose de lui.",text:`« Je ne veux pas te tuer. Je veux fusionner avec toi. »

Mira murmure :
« Il ne te dit pas ce que tu vas perdre. »`,choices:[["Refuser et combattre","boss",null,null,"kind"],["Accepter le risque","inherit",null,null,"neutral"],["Demander à mes compagnons de décider","council",null,null,"kind"]]},
council:{chapter:"Chapitre V — Le quatrième",title:"Le conseil",text:`Pour la première fois, Lautrec ne décide pas seul.

Les voix de ses compagnons comptent.

Mira veut détruire le miroir.
Elias veut voler les souvenirs.
Valeria veut partir avant qu’il ne soit trop tard.`,choices:[["Écouter Mira","boss",null,null],["Écouter Elias","inherit",null,null],["Écouter Valeria","escapeEnding",null,null]]},
boss:{chapter:"Chapitre V — Le quatrième",title:"Le duel des possibles",enter:s=>startCombat("Le quatrième Lautrec",[
{name:"Le quatrième Lautrec",hp:42,maxHp:42,attack:7,def:14,boss:true}
],"inherit"),choices:[]},
inherit:{chapter:"Chapitre VI — Héritage",title:"La mémoire des échos",enter:s=>{if(!s.talents.some(x=>x.startsWith("Mémoire des échos"))){s.talents.push("Mémoire des échos — certains souvenirs alternatifs révèlent des indices");addXP(120);complete("q1");}},text:`Les souvenirs traversent ton esprit.

Tu ne deviens pas les autres Lautrec.

Tu gardes seulement ce qu’ils ont appris.

Quand tu relèves les yeux, le miroir est vide.

Mais dans le ciel de Veyre, la lune a disparu.`,choices:[["Sortir dans Veyre","streets",null,null]]},
streets:{chapter:"Acte II — Monde ouvert",title:"Veyre après minuit",enter:s=>{if(!s.flags.moon){s.flags.moon=true;discover("Port noir");secret("La disparition de la lune suit la chute du quatrième.");generateQuest();}},text:`La ville est ouverte.

La Guilde, les Archives, le Port noir et la Maison sans porte poursuivent leurs propres objectifs.

Tes compagnons peuvent te quitter. Tes ennemis peuvent revenir. Les factions réagiront à ta réputation.

Et quelque chose a volé la lune.`,choices:[["Enquêter sur la lune","moon",null,null],["Visiter le marchand","shopScene",null,null],["Chercher une mission","procQuest",null,null],["Partir au hasard","random",null,null]]},
moon:{chapter:"Acte II — La lune absente",title:"Une nuit sans ciel",text:`Les astronomes refusent de parler.

Un enfant du Port noir affirme :
« La lune est toujours là. Quelqu’un l’a mise derrière la ville. »`,choices:[["Croire l’enfant","random",null,null],["Questionner les astronomes","random","bluff",14],["Observer le ciel","random","perception",15]]},
shopScene:{chapter:"Acte II — Monde ouvert",title:"Le Marchand sans enseigne",text:`Une boutique minuscule apparaît entre deux bâtiments.

Le marchand te reconnaît immédiatement.

« Je vends seulement aux gens qui ont déjà existé plus d’une fois. »`,choices:[["Voir le marchand","streets",null,null]]},
procQuest:{chapter:"Acte II — Contrat",title:"Un contrat inattendu",dynamic:true,choices:[["Accepter et partir","random",null,null],["Refuser","streets",null,null]]},
random:{chapter:"Acte II — Veyre vivante",title:"Un détour inattendu",dynamic:true,choices:[["Continuer","streets",null,null]]},
escapeEnding:{chapter:"Fin possible",title:"Celui qui partit",enter:s=>{s.ending="Celui qui partit";addXP(80)},text:`Lautrec choisit de quitter la Maison.

Le quatrième reste derrière le miroir.

Veyre continue d’exister.

Mais certaines nuits, dans n’importe quel reflet, Lautrec aperçoit quelqu’un qui attend encore.`,choices:[["Continuer en monde ouvert","streets",null,null]]}
};

const randomEvents=[
"Un messager masqué te remet une pièce frappée de ton propre visage, puis disparaît.",
"Une jeune voleuse tente de te détrousser. Elle porte exactement la même lame rétractable que toi.",
"Un chien noir refuse de te laisser passer devant une ruelle vide.",
"Une cloche sonne treize coups. Les habitants font semblant de ne pas l’entendre.",
"Sur un mur : « Lautrec ment lorsqu’il dit qu’il ne se souvient pas. »",
"Un inconnu t’appelle par ton ancien titre de noblesse puis s’enfuit.",
"Un quartier entier apparaît sur une carte à l’encre fraîche."
];
const questTemplates=[
["Le collectionneur de visages","Retrouver un voleur qui dérobe les portraits des habitants.","Quartier Bas"],
["La cloche de treize heures","Découvrir qui fait sonner une cloche qui n’existe sur aucun clocher.","Vieille Ville"],
["Le navire immobile","Monter sur un navire qui n’a pas bougé depuis vingt ans.","Port noir"],
["Les noms rayés","Identifier pourquoi certains habitants disparaissent des registres.","Archives"],
["Le chien du passage","Suivre le chien noir jusqu’à un lieu absent de la carte.","Souterrains"]
];

function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(state))}
function load(){try{return JSON.parse(localStorage.getItem(SAVE_KEY))}catch(e){return null}}
function toast(t){const e=document.getElementById("toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1800)}
function addXP(n){state.xp+=n;const lvl=1+Math.floor(state.xp/175);if(lvl>state.level){state.level=lvl;state.maxHp+=5;state.hp=state.maxHp;state.skills.discretion+=1;if(lvl%2===0)state.skills.perception+=1;toast(`Niveau ${lvl} !`)}}
function secret(t){if(!state.secrets.includes(t)){state.secrets.push(t);toast("Secret découvert")}}
function discover(t){if(!state.discovered.includes(t)){state.discovered.push(t);toast(`Lieu découvert : ${t}`)}}
function complete(id){let q=state.quests.find(q=>q.id===id);if(q)q.done=true}
function recruit(name){const c=state.companions[name];if(c&&!c.recruited){c.recruited=true;toast(`${name} rejoint le groupe`)}}
function journal(text){state.journal.unshift({text,time:Date.now()});state.journal=state.journal.slice(0,160)}
function log(text,kind=""){state.log.unshift({text,kind,time:Date.now()});state.log=state.log.slice(0,80)}
function labelSkill(s){return({perception:"Perception",rue:"Connaissance de la rue",discretion:"Discrétion",vol:"Vol",escamotage:"Escamotage",intuition:"Intuition",bluff:"Bluff",athletisme:"Athlétisme"})[s]||s}
function roll(skill=null,dc=null){let d=Math.ceil(Math.random()*20),bonus=skill?(state.skills[skill]||0):0,total=d+bonus;state.lastRoll=d;state.lastText=skill?`${labelSkill(skill)} : d20 ${d} + ${bonus} = ${total} / DD ${dc}`:`Jet libre : ${d}`;const die=document.getElementById("dice");if(die){die.classList.remove("shake");void die.offsetWidth;die.classList.add("shake")}return {d,total,ok:dc==null?true:total>=dc}}
function applyMoral(kind){if(kind==="kind"){state.morality+=1;state.factions["Habitants de Veyre"]+=2}else if(kind==="cruel"){state.morality-=1;state.factions["Guilde des assassins"]+=1}}
function injury(){const pool=["Côte fêlée — PV max -2","Entaille profonde — soins moins efficaces","Main tremblante — -1 temporaire en Escamotage"];const i=pool[Math.floor(Math.random()*pool.length)];if(!state.injuries.includes(i)){state.injuries.push(i);state.maxHp=Math.max(10,state.maxHp-2);state.hp=Math.min(state.hp,state.maxHp);toast("Blessure : "+i.split("—")[0])}}
function worldTick(){state.turns++;if(state.turns%4===0){const ev=randomEvents[Math.floor(Math.random()*randomEvents.length)];state.worldEvents.unshift(ev);state.worldEvents=state.worldEvents.slice(0,20)}if(state.turns%6===0)generateQuest()}
function generateQuest(){if(state.quests.filter(q=>!q.done).length>6)return;const t=questTemplates[Math.floor(Math.random()*questTemplates.length)];const id="p"+Date.now()+Math.random();state.quests.push({id,title:t[0],desc:t[1]+" — "+t[2],done:false,main:false});toast("Nouvelle quête")}
function dynamicScene(sc,id){if(id==="random")return randomEvents[Math.floor(Math.random()*randomEvents.length)];if(id==="procQuest"){const q=state.quests.filter(q=>!q.done&&!q.main).slice(-1)[0]||state.quests.find(q=>!q.done);return q?`${q.title}\n\n${q.desc}\n\nLa récompense annoncée est de ${12+state.level*4} pièces d’or.`:"Aucun contrat n’est disponible pour le moment."}return sc.text}
function enterScene(id){let sc=scenes[id]||scenes.streets;state.scene=id;state.chapter=parseInt((sc.chapter.match(/\d+/)||[state.chapter])[0])||state.chapter;if(sc.enter)sc.enter(state);if(sc.dynamic)sc.text=dynamicScene(sc,id);journal(`${sc.title} — ${(sc.text||"").split("\n")[0]}`);worldTick();save();render();if(!state.combat)showScreen("adventure")}
function choose(ch){const [txt,dest,skill,dc,moral]=ch;log(`Lautrec : ${txt}`,"me");if(moral)applyMoral(moral);if(skill&&skill!=="null"){const r=roll(skill,dc);log(`${labelSkill(skill)} — ${r.total} (${r.ok?"réussite":"échec"})`,r.ok?"good":"bad");if(r.ok)addXP(6);else{if(Math.random()<.35)state.hp=Math.max(1,state.hp-2);if(Math.random()<.18)injury()}}enterScene(dest)}
function startCombat(title,enemies,nextScene){state.combat={title,enemies:JSON.parse(JSON.stringify(enemies)),nextScene,turn:1,guard:false};showScreen("combat");save();render()}
function aliveParty(){return Object.values(state.companions).filter(c=>c.recruited&&c.hp>0)}
function playerAttack(){if(!state.combat)return;const e=state.combat.enemies.find(x=>x.hp>0);if(!e)return;const r=roll("discretion",e.def);let dmg=2+Math.ceil(Math.random()*6)+weaponPower();if(r.ok){e.hp=Math.max(0,e.hp-dmg);log(`Tu frappes ${e.name} pour ${dmg}.`,"good")}else log(`Tu rates ${e.name}.`,"bad");alliesTurn();enemyTurn();combatCheck();render()}
function weaponPower(){const w=state.inventory.find(i=>i.name===state.equipment.weapon);return w?.power||0}
function alliePower(c){return c.attack+Math.floor(state.level/2)}
function alliesTurn(){for(const c of aliveParty()){const e=state.combat?.enemies.find(x=>x.hp>0);if(!e)break;const dmg=Math.max(2,Math.ceil(Math.random()*alliePower(c)));e.hp=Math.max(0,e.hp-dmg);log(`${c.name} inflige ${dmg} à ${e.name}.`,"good")}}
function enemyTurn(){if(!state.combat)return;for(const e of state.combat.enemies.filter(x=>x.hp>0)){let targets=["Lautrec",...aliveParty().map(c=>c.name)],t=targets[Math.floor(Math.random()*targets.length)];let dmg=Math.max(1,Math.ceil(Math.random()*e.attack)-(state.combat.guard?2:0));if(t==="Lautrec"){state.hp=Math.max(0,state.hp-dmg);log(`${e.name} te blesse pour ${dmg}.`,"bad")}else{let c=state.companions[t];c.hp=Math.max(0,c.hp-dmg);log(`${e.name} frappe ${t} pour ${dmg}.`,"bad")}}state.combat.guard=false;state.combat.turn++}
function combatGuard(){if(!state.combat)return;state.combat.guard=true;log("Lautrec se met en garde.","me");alliesTurn();enemyTurn();combatCheck();render()}
function combatTrick(){if(!state.combat)return;let e=state.combat.enemies.find(x=>x.hp>0);const r=roll("escamotage",12);if(r.ok){let dmg=4+Math.ceil(Math.random()*6);e.hp=Math.max(0,e.hp-dmg);log(`Ruse réussie : ${dmg} dégâts et confusion.`,"good");state.combat.guard=true}else log("La ruse échoue.","bad");alliesTurn();enemyTurn();combatCheck();render()}
function combatFlee(){if(!state.combat)return;const r=roll("discretion",13);if(r.ok){log("Le groupe décroche du combat.","good");state.combat=null;enterScene("streets")}else{log("Impossible de fuir.","bad");enemyTurn();combatCheck();render()}}
function combatCheck(){if(!state.combat)return;if(state.hp<=0){state.hp=Math.max(1,Math.floor(state.maxHp/2));injury();journal("Lautrec s’effondre et se réveille plus tard, blessé.");state.combat=null;enterScene("streets");return}if(state.combat.enemies.every(e=>e.hp<=0)){const next=state.combat.nextScene;const reward=18+state.level*5;state.gold+=reward;addXP(45);journal(`Victoire : ${state.combat.title}. Récompense : ${reward} or.`);state.combat=null;toast("Victoire");enterScene(next)}}
function buyItem(id){const item=baseItems.find(x=>x.id===id);if(!item||state.gold<item.price)return toast("Pas assez d’or");state.gold-=item.price;if(item.type==="consumable"&&item.id==="tonic"){state.hp=Math.min(state.maxHp,state.hp+item.power);toast("PV restaurés")}else state.inventory.push({...item});save();render()}
function equipItem(name){const item=state.inventory.find(x=>x.name===name);if(!item)return;if(item.type==="weapon")state.equipment.weapon=item.name;else if(item.type==="armor")state.equipment.armor=item.name;else if(item.type==="trinket")state.equipment.trinket=item.name;toast("Équipé : "+item.name);save();render()}
function inferAction(raw){const t=raw.toLowerCase();if(/attaque|frappe|combat|tue/.test(t)&&!state.combat){startCombat("Rixe improvisée",[{name:"Agresseur",hp:12+state.level*2,maxHp:12+state.level*2,attack:4+state.level,def:11+Math.floor(state.level/2)}],"streets");return}
if(/mira/.test(t)&&state.companions.Mira.recruited){state.relations.Mira+=1;log("Mira répond avec prudence. Elle semble apprécier d’être consultée.","good");save();render();return}
let skill=null,dc=12;if(/observe|regarde|inspect|écoute|surveille|cherche/.test(t)){skill="perception";dc=13}else if(/vole|dérobe|pickpocket|fouille/.test(t)){skill="vol";dc=14}else if(/cache|discret|suis|infiltr/.test(t)){skill="discretion";dc=13}else if(/mens|bluff|convain|intimid/.test(t)){skill="bluff";dc=14}else if(/grimpe|frappe|casse|force|saute/.test(t)){skill="athletisme";dc=14}else if(/comprend|devine|analyse/.test(t)){skill="intuition";dc=13}else if(/rue|taverne|questionne|rumeur/.test(t)){skill="rue";dc=13}else if(/aléato|hasard|random/.test(t)){const e=randomEvents[Math.floor(Math.random()*randomEvents.length)];log(`Le hasard décide : ${e}`,"good");state.worldEvents.unshift(e);addXP(3);save();render();return}
let result="Ton initiative modifie la scène.";if(skill){const r=roll(skill,dc);result=`${labelSkill(skill)} : ${r.total} — ${r.ok?"réussite":"échec"}. ${r.ok?"Tu obtiens un avantage ou un nouvel indice.":"Le monde réagit, mais pas comme prévu."}`;if(r.ok)addXP(5);else if(Math.random()<.2)injury()}
log(`Lautrec : ${raw}`,"me");log(result,skill&&result.includes("échec")?"bad":"good");journal(`Action libre : ${raw} — ${result}`);worldTick();save();render()}
function showScreen(id){document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.id===id));document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.screen===id))}
function rarityClass(r){return "rarity-"+r}
function render(){const sc=scenes[state.scene]||scenes.awakening;document.getElementById("topStatus").textContent=`Niv. ${state.level} • ${state.xp} XP`;document.getElementById("chapterLabel").textContent=sc.chapter;document.getElementById("sceneTitle").textContent=sc.title;document.getElementById("storyText").textContent=sc.text||"";document.getElementById("hpStat").textContent=`${state.hp}/${state.maxHp}`;document.getElementById("xpStat").textContent=state.xp;document.getElementById("goldStat").textContent=state.gold;document.getElementById("repStat").textContent=state.rep;document.getElementById("dice").textContent=state.lastRoll??20;document.getElementById("diceText").textContent=state.lastText||"Aucun jet récent.";document.getElementById("homeLast").textContent=`${sc.chapter} — ${sc.title}`;document.getElementById("worldState").textContent=`Moralité ${state.morality>=0?"+":""}${state.morality} • ${state.discovered.length} lieux • ${state.secrets.length} secrets`;document.getElementById("homeComp").textContent=aliveParty().map(c=>c.name).join(", ")||"Lautrec voyage seul.";
let mb=document.getElementById("moralBox");mb.innerHTML=sc.moral?`<div class="moral">${sc.moral}</div>`:"";
let c=document.getElementById("choices");c.innerHTML="";(sc.choices||[]).forEach(ch=>{let b=document.createElement("button");b.className="choice";b.innerHTML=`<div>◆</div><div><b>${ch[0]}</b>${ch[2]&&ch[2]!=="null"?`<small>${labelSkill(ch[2])} • DD ${ch[3]}</small>`:""}</div>`;b.onclick=()=>choose(ch);c.appendChild(b)});
document.getElementById("log").innerHTML=state.log.length?state.log.map(x=>`<div class="entry ${x.kind}">${esc(x.text)}</div>`).join(""):`<div class="muted">Tes décisions apparaîtront ici.</div>`;
document.getElementById("locations").innerHTML=state.discovered.map((x,i)=>`<div class="quest"><b>${esc(x)}</b><span class="tag" style="float:right">${i<2?"Connu":"Découvert"}</span></div>`).join("");
document.getElementById("charStats").innerHTML=Object.entries(state.skills).map(([k,v])=>`<div class="item"><span>${labelSkill(k)}</span><b>+${v}</b></div>`).join("");
document.getElementById("equipment").innerHTML=Object.entries(state.equipment).map(([k,v])=>`<div class="item"><span>${k}</span><b>${esc(v||"—")}</b></div>`).join("");
document.getElementById("inventory").innerHTML=state.inventory.map(i=>`<div class="item"><span class="${rarityClass(i.rarity)}">${esc(i.name)} <small>(${i.rarity})</small></span>${["weapon","armor","trinket"].includes(i.type)?`<button class="btn small ghost" onclick="equipItem('${esc(i.name)}')">Équiper</button>`:""}</div>`).join("");
document.getElementById("companions").innerHTML=Object.values(state.companions).map(c=>`<div class="quest"><b>${c.recruited?"◆ ":""}${c.name}</b> — ${c.role}<div class="muted">${c.desc}</div><div class="progress"><i style="width:${Math.max(0,Math.min(100,c.loyalty+50))}%"></i></div></div>`).join("");
document.getElementById("relations").innerHTML=[...Object.entries(state.relations),...Object.entries(state.factions)].map(([k,v])=>`<div class="item"><span>${esc(k)}</span><b>${v>0?"+":""}${v}</b></div><div class="progress"><i style="width:${Math.max(4,Math.min(100,50+v))}%"></i></div>`).join("");
document.getElementById("talents").innerHTML=state.talents.map(x=>`<div class="quest">${esc(x)}</div>`).join("");document.getElementById("injuries").innerHTML=state.injuries.length?state.injuries.map(x=>`<div class="quest">${esc(x)}</div>`).join(""):`<div class="muted">Aucune blessure durable.</div>`;
document.getElementById("questList").innerHTML=state.quests.map(q=>`<div class="quest"><b>${q.done?"✓ ":""}${esc(q.title)}</b>${q.main?` <span class="badge">principale</span>`:""}<div class="muted">${esc(q.desc)}</div></div>`).join("");
document.getElementById("secretList").innerHTML=state.secrets.length?state.secrets.map(x=>`<div class="quest">${esc(x)}</div>`).join(""):`<div class="muted">Aucun secret consigné.</div>`;
document.getElementById("journal").innerHTML=state.journal.map(x=>`<div class="entry">${esc(x.text)}</div>`).join("");
document.getElementById("worldEvents").innerHTML=state.worldEvents.length?state.worldEvents.map(x=>`<div class="quest">${esc(x)}</div>`).join(""):`<div class="muted">La ville semble calme. Pour l’instant.</div>`;
document.getElementById("shop").innerHTML=baseItems.map(i=>`<div class="shop-card"><h4 class="${rarityClass(i.rarity)}">${i.name}</h4><div class="muted">${i.type} • puissance ${i.power}</div><button class="btn small gold" onclick="buyItem('${i.id}')">${i.price} or</button></div>`).join("");
renderCombat();save()}
function renderCombat(){let a=document.getElementById("combatArea"),p=document.getElementById("partyCombat"),acts=document.getElementById("combatActions");if(!state.combat){document.getElementById("combatTitle").textContent="Aucun combat";a.innerHTML='<div class="muted">Les combats apparaîtront ici.</div>';p.innerHTML="";acts.innerHTML="";return}document.getElementById("combatTitle").textContent=state.combat.title;a.innerHTML=state.combat.enemies.map(e=>`<div class="enemy"><b>${e.name}</b><div>${e.hp}/${e.maxHp} PV</div><div class="meter"><i style="width:${100*e.hp/e.maxHp}%"></i></div></div>`).join("");p.innerHTML=`<div class="quest"><b>Lautrec</b> ${state.hp}/${state.maxHp} PV<div class="meter blue"><i style="width:${100*state.hp/state.maxHp}%"></i></div></div>`+aliveParty().map(c=>`<div class="quest"><b>${c.name}</b> ${c.hp}/${c.maxHp} PV<div class="meter blue"><i style="width:${100*c.hp/c.maxHp}%"></i></div></div>`).join("");acts.innerHTML=`<button class="choice" onclick="playerAttack()">⚔ Attaquer</button><button class="choice" onclick="combatTrick()">✦ Ruse</button><button class="choice" onclick="combatGuard()">◈ Garde</button><button class="choice" onclick="combatFlee()">↝ Fuir</button>`}
function esc(s){return String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>showScreen(t.dataset.screen));
document.getElementById("continueBtn").onclick=()=>showScreen(state.combat?"combat":"adventure");
document.getElementById("newBtn").onclick=()=>{if(confirm("Créer une nouvelle chronologie ?")){state=initialState();enterScene("awakening")}};
document.getElementById("actBtn").onclick=()=>{let a=document.getElementById("freeAction");if(a.value.trim()){inferAction(a.value.trim());a.value=""}};
document.getElementById("rollBtn").onclick=()=>{roll();render()};
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
if(!state.journal.length)journal("La chronique de Lautrec commence.");render();
