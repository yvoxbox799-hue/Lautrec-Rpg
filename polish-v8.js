/* Lautrec RPG V8 — finition jeu vidéo */
(() => {
  "use strict";
  const screen=document.getElementById("detective");if(!screen)return;
  const splash=document.createElement("div");splash.className="v8-splash";
  splash.innerHTML=`<div class="v8-logo"><span>LES MÉMOIRES DE L'OMBRE</span><h1>LAUTREC</h1><i></i><p>Une enquête dans la ville qui se souvient</p><button>CONTINUER</button><small>V8 · CHRONIQUES DE VEYRE</small></div>`;
  screen.appendChild(splash);
  const saveBadge=document.createElement("div");saveBadge.className="autosave-badge";saveBadge.innerHTML="<span>◇</span> Sauvegarde automatique";screen.appendChild(saveBadge);
  const sound=document.createElement("button");sound.className="game-sound";sound.setAttribute("aria-label","Activer ou couper l'ambiance");sound.textContent="♪";document.querySelector(".detective-hud")?.appendChild(sound);
  let ctx=null,master=null,soundOn=localStorage.getItem("lautrec_v8_sound")!=="off";
  function beginSound(){
    if(!soundOn||ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=.025;master.connect(ctx.destination);
    const hum=ctx.createOscillator(),gain=ctx.createGain();hum.type="sine";hum.frequency.value=55;gain.gain.value=.45;hum.connect(gain).connect(master);hum.start();
    const upper=ctx.createOscillator(),upperGain=ctx.createGain();upper.type="triangle";upper.frequency.value=110;upperGain.gain.value=.08;upper.connect(upperGain).connect(master);upper.start();
  }
  function chime(ok=true){if(!soundOn)return;beginSound();if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=ok?523:174;o.type="triangle";g.gain.setValueAtTime(.12,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.35);o.connect(g).connect(master);o.start();o.stop(ctx.currentTime+.36)}
  function markSaved(){saveBadge.classList.add("show");clearTimeout(markSaved.t);markSaved.t=setTimeout(()=>saveBadge.classList.remove("show"),1300)}
  splash.querySelector("button").onclick=()=>{beginSound();splash.classList.add("gone");sessionStorage.setItem("lautrec_v8_started","1");chime()};
  sound.onclick=()=>{soundOn=!soundOn;localStorage.setItem("lautrec_v8_sound",soundOn?"on":"off");sound.textContent=soundOn?"♪":"∅";if(soundOn)beginSound();if(master)master.gain.value=soundOn?.025:0};
  sound.textContent=soundOn?"♪":"∅";

  const observer=new MutationObserver(mutations=>{
    if(screen.classList.contains("active")&&!sessionStorage.getItem("lautrec_v8_started"))splash.classList.remove("gone");
    mutations.forEach(m=>{
      if(m.target.id==="dialogueText"&&m.target.textContent){m.target.classList.remove("typed");void m.target.offsetWidth;m.target.classList.add("typed");chime()}
      if(m.target.id==="clueScore"){markSaved();if(Number(m.target.textContent)===3)achievement("Œil du voleur","3 indices découverts")}
    });
  });
  observer.observe(screen,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["class"]});
  function achievement(title,detail){
    if(sessionStorage.getItem("achievement_"+title))return;sessionStorage.setItem("achievement_"+title,"1");
    const a=document.createElement("div");a.className="achievement";a.innerHTML=`<span>✦</span><div><small>ACCOMPLISSEMENT</small><b>${title}</b><em>${detail}</em></div>`;screen.appendChild(a);requestAnimationFrame(()=>a.classList.add("show"));setTimeout(()=>a.remove(),4200);chime();
  }
  screen.addEventListener("pointerdown",beginSound,{once:true});
  addEventListener("pagehide",()=>{try{save()}catch(_){}});
})();
