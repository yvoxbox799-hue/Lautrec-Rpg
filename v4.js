/* Lautrec RPG V4 — extension non destructive de la V3 */
(() => {
  "use strict";

  const V4_KEY = "lautrec_rpg_v4_backup";
  let audioOn = localStorage.getItem("lautrec_audio") !== "off";
  let audioContext = null;

  function tone(frequency = 330, duration = 0.06, volume = 0.025) {
    if (!audioOn || !(window.AudioContext || window.webkitAudioContext)) return;
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  }

  function haptic(ms = 12) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  function migrate() {
    state.version = 4;
    state.flags ||= {};
    state.flags.blackBell ||= false;
    state.flags.valeriaMet ||= false;
    state.settings ||= { largeText: false };
    if (!state.quests.some(q => q.id === "q4")) {
      state.quests.push({
        id: "q4",
        title: "La Cloche noire",
        desc: "Découvrir pourquoi une cloche invisible appelle Lautrec par son vrai nom.",
        done: false,
        main: true
      });
    }
    localStorage.setItem(V4_KEY, JSON.stringify(state));
    save();
  }

  Object.assign(scenes, {
    bellStart: {
      chapter: "Chapitre IV — La Cloche noire",
      title: "Le treizième coup",
      enter: s => { discover("Beffroi absent"); s.flags.blackBell = true; },
      text: `À minuit, Veyre retient son souffle. Une cloche sonne treize fois, bien qu'aucun beffroi ne domine la ville.\n\nÀ chaque coup, un souvenir qui n'est pas le tien remonte : un enfant noble, une fenêtre brisée, puis le visage de Valeria sous la pluie.\n\nLe dernier son vient de sous tes pieds.`,
      choices: [
        ["Suivre les vibrations sous la place", "bellVault", "perception", 14],
        ["Chercher Valeria avant de descendre", "valeria", "rue", 13],
        ["Interroger les ombres du quartier", "bellWhisper", "intuition", 15]
      ]
    },
    valeria: {
      chapter: "Chapitre IV — La Cloche noire",
      title: "La flèche et le souvenir",
      enter: s => {
        if (!s.flags.valeriaMet) {
          s.flags.valeriaMet = true;
          recruit("Valeria");
          s.relations.Valeria += 12;
          addXP(25);
        }
      },
      text: `Valeria t'attend sur un toit, une flèche déjà encochée.\n\n« La cloche efface un nom à chaque sonnerie. Le prochain sera le tien. »\n\nElle range son arc et rejoint le groupe. Elle connaît une entrée oubliée sous les anciennes halles.`,
      choices: [
        ["Descendre avec Valeria", "bellVault", null, null],
        ["Lui demander ce qu'elle sait de mon passé", "bellWhisper", "intuition", 13]
      ]
    },
    bellWhisper: {
      chapter: "Chapitre IV — La Cloche noire",
      title: "Les noms dérobés",
      enter: () => secret("La cloche ne tue pas : elle retire ses victimes de la mémoire de Veyre."),
      text: `Les ombres répondent avec les voix des oubliés. Elles révèlent un passage sous les halles et un nom : Maître Orsenn, ancien archiviste royal.\n\nIl a construit la cloche pour réécrire la ville sans verser de sang.`,
      choices: [
        ["Entrer par le passage oublié", "bellVault", "discretion", 13],
        ["Prévenir les habitants", "bellVault", "bluff", 15, "kind"]
      ]
    },
    bellVault: {
      chapter: "Chapitre IV — La Cloche noire",
      title: "Le gardien sans nom",
      text: `Sous la place, un mécanisme immense bat comme un cœur. Un gardien couvert de plaques d'archives se détache de la cloche.\n\nSur son masque, quelqu'un a gravé : « Lautrec Ier ».`,
      enter: () => startCombat("Le Gardien sans nom", [
        { name: "Gardien des archives", hp: 30 + state.level * 3, maxHp: 30 + state.level * 3, attack: 6 + state.level, def: 14 }
      ], "bellChoice"),
      choices: []
    },
    bellChoice: {
      chapter: "Chapitre IV — La Cloche noire",
      title: "Ce que la ville doit oublier",
      moral: "La cloche peut effacer le quatrième Lautrec de toutes les mémoires, mais elle prendra aussi les souvenirs que tes compagnons ont de toi.",
      text: `Le battant de la cloche est entre tes mains. Mira détourne les yeux. Valeria attend. Dans le métal noir, ton reflet sourit avant toi.`,
      choices: [
        ["Détruire la cloche et accepter le danger", "bellFree", "athletisme", 15, "kind"],
        ["Effacer le quatrième Lautrec", "bellForgotten", "intuition", 15],
        ["Prendre le contrôle de la cloche", "bellMaster", "escamotage", 17, "cruel"]
      ]
    },
    bellFree: {
      chapter: "Épilogue IV",
      title: "La ville se souvient",
      enter: s => { complete("q4"); s.gold += 60; addXP(100); s.factions["Habitants de Veyre"] += 12; },
      text: `La cloche se fend. Des milliers de noms reviennent d'un seul coup dans les rues de Veyre.\n\nLa ville se souvient de ses absents — et de celui qui les a libérés. Mais quelque part, le quatrième Lautrec se souvient également de toi.`,
      choices: [["Retourner dans les rues de Veyre", "streets", null, null]]
    },
    bellForgotten: {
      chapter: "Épilogue IV",
      title: "Le prix d'un nom",
      enter: s => { complete("q4"); addXP(110); s.relations.Mira -= 4; s.relations.Valeria -= 4; },
      text: `Tu prononces le nom du quatrième. Le son traverse Veyre puis disparaît.\n\nLa menace n'existe plus. Tes compagnons te regardent pourtant comme un étranger qu'ils auraient envie de croire.`,
      choices: [["Reconstruire leur confiance", "streets", null, null]]
    },
    bellMaster: {
      chapter: "Épilogue IV",
      title: "Le maître des silences",
      enter: s => { complete("q4"); addXP(125); s.rep += 8; s.factions["Guilde des assassins"] += 10; },
      text: `Le mécanisme reconnaît tes mains. Désormais, un nom murmuré peut disparaître des registres, des portraits et des mémoires.\n\nMira recule d'un pas. Dans la cloche, ton reflet porte une couronne noire.`,
      choices: [["Régner depuis les ombres", "streets", null, null]]
    }
  });

  function downloadSave() {
    const payload = JSON.stringify({ game: "Lautrec RPG", version: 4, exportedAt: new Date().toISOString(), state }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `lautrec-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    tone(520, 0.1);
    toast("Sauvegarde exportée");
  }

  function importSave(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const next = parsed.state || parsed;
        if (!next.scene || !next.skills || !next.inventory) throw new Error("format");
        state = next;
        migrate();
        render();
        toast("Sauvegarde restaurée");
      } catch (_) { toast("Fichier de sauvegarde invalide"); }
    };
    reader.readAsText(file);
  }

  function camp() {
    const missing = state.maxHp - state.hp;
    const wounded = aliveParty().some(c => c.hp < c.maxHp);
    if (!missing && !wounded) return toast("Le groupe est déjà en pleine forme");
    if (state.gold < 10) return toast("Il faut 10 pièces d'or");
    state.gold -= 10;
    state.hp = Math.min(state.maxHp, state.hp + Math.max(8, Math.ceil(state.maxHp * 0.45)));
    aliveParty().forEach(c => c.hp = Math.min(c.maxHp, c.hp + Math.ceil(c.maxHp * 0.45)));
    journal("Le groupe a établi un camp et récupéré des forces.");
    tone(440, 0.18);
    haptic(20);
    save();
    render();
    toast("Le groupe récupère");
  }

  function createControls() {
    const worldCard = document.querySelector("#world .grid");
    if (worldCard && !document.getElementById("v4Tools")) {
      const panel = document.createElement("div");
      panel.id = "v4Tools";
      panel.className = "card span12 v4-panel";
      panel.innerHTML = `<div><div class="eyebrow">V4 • Outils du voyageur</div><h2>Chronologie & confort</h2></div>
        <div class="v4-actions">
          <button class="btn primary" id="chapter4Btn">🔔 Jouer le chapitre IV</button>
          <button class="btn ghost" id="campBtn">⛺ Camper • 10 or</button>
          <button class="btn ghost" id="exportBtn">↓ Exporter</button>
          <label class="btn ghost file-btn">↑ Importer<input id="importSave" type="file" accept="application/json"></label>
          <button class="btn ghost" id="textBtn">Aa Texte</button>
          <button class="btn ghost" id="soundBtn">${audioOn ? "♪ Son" : "Son coupé"}</button>
        </div>`;
      worldCard.appendChild(panel);
      document.getElementById("chapter4Btn").onclick = () => enterScene("bellStart");
      document.getElementById("campBtn").onclick = camp;
      document.getElementById("exportBtn").onclick = downloadSave;
      document.getElementById("importSave").onchange = e => e.target.files[0] && importSave(e.target.files[0]);
      document.getElementById("textBtn").onclick = () => {
        state.settings.largeText = !state.settings.largeText;
        document.body.classList.toggle("large-text", state.settings.largeText);
        save();
      };
      document.getElementById("soundBtn").onclick = e => {
        audioOn = !audioOn;
        localStorage.setItem("lautrec_audio", audioOn ? "on" : "off");
        e.currentTarget.textContent = audioOn ? "♪ Son" : "Son coupé";
        tone(620, 0.08);
      };
    }
  }

  const originalChoose = choose;
  choose = ch => { tone(300, 0.045); haptic(); originalChoose(ch); };
  const originalRender = render;
  render = () => {
    state.version = 4;
    state.flags ||= {};
    state.settings ||= { largeText: false };
    if (!state.quests.some(q => q.id === "q4")) {
      state.quests.push({ id: "q4", title: "La Cloche noire", desc: "Découvrir pourquoi une cloche invisible appelle Lautrec par son vrai nom.", done: false, main: true });
    }
    originalRender();
    createControls();
    document.body.classList.toggle("large-text", !!state.settings?.largeText);
    document.querySelectorAll("button").forEach(b => b.setAttribute("type", "button"));
  };

  document.addEventListener("keydown", event => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && document.activeElement?.id === "freeAction") {
      document.getElementById("actBtn").click();
    }
  });

  migrate();
  render();
  toast("Lautrec RPG V4 est prêt");
})();


/* V4.3 — retour immédiat du bouton Agir */
(() => {
  const haptic = ms => { if (navigator.vibrate) navigator.vibrate(ms); };
  const tone = (frequency, duration) => {
    if (localStorage.getItem("lautrec_audio") === "off" || !(window.AudioContext || window.webkitAudioContext)) return;
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.025, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + duration);
  };
  const box = document.querySelector(".actionbox");
  const button = document.getElementById("actBtn");
  const input = document.getElementById("freeAction");
  if (!box || !button || !input || document.getElementById("actionFeedback")) return;

  const feedback = document.createElement("div");
  feedback.id = "actionFeedback";
  feedback.className = "action-feedback";
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  box.insertAdjacentElement("afterend", feedback);

  const showFeedback = (text, kind = "good") => {
    feedback.className = "action-feedback show " + kind;
    feedback.innerHTML = "<span>" + (kind === "bad" ? "!" : "✓") + "</span><p>" + esc(text) + "</p>";
  };

  button.onclick = () => {
    const action = input.value.trim();
    if (!action) {
      showFeedback("Écris d'abord ce que Lautrec doit tenter.", "bad");
      input.classList.remove("input-alert");
      void input.offsetWidth;
      input.classList.add("input-alert");
      input.focus();
      haptic(30);
      return;
    }

    button.disabled = true;
    button.classList.add("acting");
    button.textContent = "Action…";
    feedback.className = "action-feedback show pending";
    feedback.innerHTML = "<span>◆</span><p>Le destin évalue ton action…</p>";
    haptic(12);

    setTimeout(() => {
      const previousScene = state.scene;
      inferAction(action);
      input.value = "";
      const latest = state.log[0];
      let message = latest?.text || "Ton action a bien été prise en compte.";
      let kind = latest?.kind === "bad" ? "bad" : "good";
      if (state.combat) message = "Ton action déclenche un combat. Ouvre l'onglet Combat.";
      else if (state.scene !== previousScene) message = "L'histoire avance : " + (scenes[state.scene]?.title || "nouvelle scène") + ".";
      showFeedback(message, kind);
      button.disabled = false;
      button.classList.remove("acting");
      button.textContent = "Agir";
      tone(kind === "bad" ? 190 : 520, 0.12);
    }, 180);
  };
})();
