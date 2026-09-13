/* Lautrec RPG V6.1 — résultats d'actions expliqués */
(() => {
  "use strict";
  const button = document.getElementById("actBtn");
  const input = document.getElementById("freeAction");
  const feedback = document.getElementById("actionFeedback");
  if (!button || !input || !feedback) return;

  const consequenceBySkill = {
    "Perception": "Lautrec repère un détail utile et obtient un nouvel indice.",
    "Vol": "Lautrec réussit à subtiliser ce qu'il cherchait sans être immédiatement découvert.",
    "Discrétion": "Lautrec progresse sans attirer l'attention.",
    "Bluff": "Son interlocuteur croit suffisamment Lautrec pour le laisser agir.",
    "Athlétisme": "Lautrec surmonte l'obstacle par la force ou l'agilité.",
    "Intuition": "Lautrec comprend ce qui se cache derrière les apparences.",
    "Connaissance de la rue": "Lautrec obtient une piste grâce aux rumeurs de Veyre."
  };
  const failureBySkill = {
    "Perception": "Le détail recherché lui échappe pour le moment.",
    "Vol": "La cible remarque la tentative et devient méfiante.",
    "Discrétion": "Un bruit ou un mouvement trahit sa présence.",
    "Bluff": "L'interlocuteur ne croit pas son histoire.",
    "Athlétisme": "L'obstacle résiste et la tentative peut blesser Lautrec.",
    "Intuition": "Lautrec interprète mal les signes.",
    "Connaissance de la rue": "Les rumeurs recueillies ne mènent nulle part."
  };

  function vibrate(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); }
  function escapeText(value) { return esc(String(value)); }
  function resultCard({ action, title, kind, rollLine, explanation, changes }) {
    feedback.className = "action-feedback explained show " + kind;
    feedback.innerHTML = `
      <header><span class="result-mark">${kind === "good" ? "✓" : kind === "bad" ? "×" : "◆"}</span>
      <div><small>RÉSULTAT DE L'ACTION</small><strong>${escapeText(title)}</strong></div></header>
      <p class="attempt"><b>Tu as tenté :</b> ${escapeText(action)}</p>
      ${rollLine ? `<div class="roll-explained">${rollLine}</div>` : ""}
      <p class="consequence"><b>Conséquence :</b> ${escapeText(explanation)}</p>
      ${changes ? `<p class="state-change">${escapeText(changes)}</p>` : ""}`;
  }

  button.onclick = () => {
    const action = input.value.trim();
    if (!action) {
      resultCard({ action: "—", title: "Action manquante", kind: "bad", explanation: "Écris ce que Lautrec doit faire dans la zone située au-dessus." });
      input.focus(); vibrate(30); return;
    }

    const before = { hp: state.hp, xp: state.xp, gold: state.gold, scene: state.scene, roll: state.lastText, logs: state.log.length };
    button.disabled = true; button.textContent = "Résolution…";
    feedback.className = "action-feedback explained show pending";
    feedback.innerHTML = '<div class="resolving"><span>◆</span><b>Le destin évalue ton action…</b></div>';

    setTimeout(() => {
      inferAction(action);
      input.value = "";
      const changes = [];
      if (state.xp > before.xp) changes.push("+" + (state.xp - before.xp) + " XP");
      if (state.gold !== before.gold) changes.push((state.gold > before.gold ? "+" : "") + (state.gold - before.gold) + " or");
      if (state.hp < before.hp) changes.push("-" + (before.hp - state.hp) + " PV");

      if (state.combat) {
        resultCard({ action, title: "Combat déclenché", kind: "bad", explanation: "Cette action provoque un affrontement. Le jeu ouvre maintenant l'écran Combat.", changes: changes.join(" · ") });
      } else {
        const match = state.lastText !== before.roll && state.lastText.match(/^(.+?) : d20 (\d+) \+ (\d+) = (\d+) \/ DD (\d+)$/);
        if (match) {
          const [, skill, die, bonus, total, difficulty] = match;
          const success = Number(total) >= Number(difficulty);
          const rollLine = `<span>Dé <b>${die}</b></span><i>+</i><span>${escapeText(skill)} <b>${bonus}</b></span><i>=</i><span>Total <b>${total}</b></span><em>Il fallait ${difficulty}</em>`;
          resultCard({
            action, title: success ? "Réussite" : "Échec", kind: success ? "good" : "bad", rollLine,
            explanation: success ? (consequenceBySkill[skill] || "L'action réussit et donne un avantage à Lautrec.") : (failureBySkill[skill] || "La tentative échoue et le monde réagit."),
            changes: changes.join(" · ")
          });
          vibrate(success ? [15,45,15] : [45,35,45]);
        } else {
          const latest = state.log[0]?.text || "L'action modifie la situation.";
          resultCard({ action, title: "Action prise en compte", kind: "good", explanation: latest, changes: changes.join(" · ") });
          vibrate(15);
        }
      }
      button.disabled = false; button.textContent = "Agir";
    }, 220);
  };
})();
