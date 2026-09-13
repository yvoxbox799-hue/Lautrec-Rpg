/* Lautrec RPG V5 — interface cinématique HD-2D originale */
(() => {
  "use strict";
  const body = document.body;
  body.classList.add("cinematic-ui");

  const ambience = document.createElement("div");
  ambience.className = "world-ambience";
  ambience.setAttribute("aria-hidden", "true");
  ambience.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>';
  body.prepend(ambience);

  const shortcuts = document.createElement("nav");
  shortcuts.className = "quickbar";
  shortcuts.setAttribute("aria-label", "Raccourcis");
  shortcuts.innerHTML = `
    <button data-quick="inventory"><span>◈</span><small>Inventaire</small><b id="quickItemCount">0</b></button>
    <button data-quick="quests"><span>✦</span><small>Quêtes</small><b id="quickQuestCount">0</b></button>
    <button data-quick="map"><span>⌖</span><small>Carte</small></button>
    <button data-quick="character"><span>♟</span><small>Groupe</small></button>`;
  document.body.appendChild(shortcuts);

  const shade = document.createElement("div");
  shade.className = "drawer-shade";
  shade.innerHTML = `
    <aside class="game-drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
      <header><div><div class="eyebrow">Accès rapide</div><h2 id="drawerTitle">Inventaire</h2></div>
      <button class="drawer-close" aria-label="Fermer">×</button></header>
      <div id="drawerContent" class="drawer-content"></div>
    </aside>`;
  document.body.appendChild(shade);

  const result = document.createElement("section");
  result.className = "cinematic-result";
  result.setAttribute("role", "status");
  result.setAttribute("aria-live", "assertive");
  result.innerHTML = `<div class="result-sigil">✦</div><div><small>CONSÉQUENCE</small><p id="cinematicResultText"></p></div><button aria-label="Fermer">×</button>`;
  document.body.appendChild(result);

  let resultTimer;
  function showResult(text, kind = "good") {
    if (!text || /destin évalue/i.test(text)) return;
    document.getElementById("cinematicResultText").textContent = text;
    result.className = "cinematic-result visible " + kind;
    clearTimeout(resultTimer);
    resultTimer = setTimeout(() => result.classList.remove("visible"), 6500);
  }

  function itemIcon(item) {
    return ({ weapon: "⚔", armor: "⬡", tool: "⌘", trinket: "✦", consumable: "◆", quest: "◇" })[item.type] || "◈";
  }

  function openInventory() {
    const equipped = new Set(Object.values(state.equipment).filter(Boolean));
    document.getElementById("drawerTitle").textContent = "Sac de Lautrec";
    document.getElementById("drawerContent").innerHTML = `
      <div class="drawer-summary"><span><b>${state.inventory.length}</b> objets</span><span><b>${state.gold}</b> or</span></div>
      <div class="quick-inventory">${state.inventory.map((item, index) => `
        <article class="quick-item ${rarityClass(item.rarity)}">
          <div class="item-glyph">${itemIcon(item)}</div>
          <div><b>${esc(item.name)}</b><small>${esc(item.type)} · puissance ${item.power || 0}</small></div>
          ${["weapon", "armor", "trinket"].includes(item.type)
            ? `<button data-equip="${index}" ${equipped.has(item.name) ? "disabled" : ""}>${equipped.has(item.name) ? "Équipé" : "Équiper"}</button>`
            : ""}
        </article>`).join("") || '<p class="empty-drawer">Le sac est vide.</p>'}</div>`;
    shade.classList.add("open");
    shade.querySelector(".game-drawer").scrollTop = 0;
    shade.querySelectorAll("[data-equip]").forEach(button => {
      button.onclick = () => {
        const item = state.inventory[Number(button.dataset.equip)];
        if (item) {
          equipItem(item.name);
          openInventory();
          showResult(item.name + " est maintenant équipé.", "good");
        }
      };
    });
  }

  function openQuests() {
    const active = state.quests.filter(q => !q.done);
    document.getElementById("drawerTitle").textContent = "Quêtes actives";
    document.getElementById("drawerContent").innerHTML = active.map(q => `
      <article class="quick-quest"><span>${q.main ? "✦" : "◇"}</span><div><b>${esc(q.title)}</b>
      <p>${esc(q.desc)}</p></div>${q.main ? '<em>PRINCIPALE</em>' : ""}</article>`).join("") ||
      '<p class="empty-drawer">Toutes les quêtes sont terminées.</p>';
    shade.classList.add("open");
  }

  function closeDrawer() { shade.classList.remove("open"); }
  shade.querySelector(".drawer-close").onclick = closeDrawer;
  shade.onclick = event => { if (event.target === shade) closeDrawer(); };
  result.querySelector("button").onclick = () => result.classList.remove("visible");

  shortcuts.querySelectorAll("[data-quick]").forEach(button => {
    button.onclick = () => {
      const action = button.dataset.quick;
      if (action === "inventory") openInventory();
      else if (action === "quests") openQuests();
      else showScreen(action);
      if (navigator.vibrate) navigator.vibrate(10);
    };
  });

  function refreshQuickbar() {
    const itemCount = document.getElementById("quickItemCount");
    const questCount = document.getElementById("quickQuestCount");
    if (itemCount) itemCount.textContent = state.inventory.length;
    if (questCount) questCount.textContent = state.quests.filter(q => !q.done).length;
  }

  const previousRender = render;
  render = () => {
    previousRender();
    refreshQuickbar();
    const adventureCard = document.querySelector("#adventure .card.span8");
    if (adventureCard) adventureCard.classList.add("story-stage");
  };

  const feedback = document.getElementById("actionFeedback");
  if (feedback) {
    new MutationObserver(() => {
      if (!feedback.classList.contains("show") || feedback.classList.contains("pending")) return;
      const text = feedback.querySelector("p")?.textContent || feedback.textContent;
      showResult(text, feedback.classList.contains("bad") ? "bad" : "good");
    }).observe(feedback, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeDrawer();
      result.classList.remove("visible");
    }
    if (event.key.toLowerCase() === "i" && !/textarea|input/i.test(document.activeElement?.tagName)) openInventory();
  });

  render();
})();
