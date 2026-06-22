/* ══════════════════════════════════════════════════════════════
   inventory.js — Inventar des Spielers
   Gekaufte Nahrungsmittel landen hier statt sofort verzehrt zu werden.
   Ausrüstung landet hier ebenfalls unausgerüstet — erst das bewusste
   "Ausrüsten" verbindet sie mit einem Charakter-Slot und damit ihrem
   Effekt (siehe equipItem()).
   ══════════════════════════════════════════════════════════════ */

'use strict';

const EQUIPMENT_ITEMS = [
  {
    id: 'ledergloves', name: 'Lederhandschuhe', icon: '🧤', slot: 'hands', slotLabel: 'Hände',
    desc: 'Schonen die Hände, erlauben kräftigeres Zupacken.', effect: '+1 Gold pro Feldarbeit',
    cost: LEDERGLOVES_COST
  },
  {
    id: 'arbeitsguertel', name: 'Arbeitsgürtel', icon: '🪢', slot: 'guertel', slotLabel: 'Gürtel',
    desc: 'Handwerksarbeit aus Gretas neuem Sortiment. Verteilt das Gewicht besser, schont den Rücken.',
    effect: '+1 Gold pro Feldarbeit', cost: ARBEITSGUERTEL_COST
  }
];

/* Rückverkauf an Greta (siehe sellInventoryItem()) — bewusst die Hälfte
   des BASIS-Kaufpreises (vor Sparsamkeits-Rabatt), nicht des aktuell
   gültigen Preises, damit der Rückverkaufswert unabhängig vom jeweils
   gerade aktiven Skill-Stand stabil bleibt. Questgegenstände (QUEST_ITEMS)
   sind hier bewusst NICHT mit aufgeführt — sie haben keinen Kaufpreis und
   sollen grundsätzlich nie verkäuflich sein. */
function getItemBaseCost(itemId) {
  const item = FOOD_ITEMS.find(i => i.id === itemId) ||
    TOOL_ITEMS.find(i => i.id === itemId) ||
    EQUIPMENT_ITEMS.find(i => i.id === itemId);
  return item ? item.cost : null;
}

/** Verkauft EINEN Gegenstand aus dem Inventar an Greta, für die Hälfte
    seines Basis-Kaufpreises (mind. 1 Gold). Ausgerüstete Gegenstände
    müssen vorher abgelegt werden (siehe unequipItem()) — wer etwas trägt,
    kann es nicht gleichzeitig im Beutel verkaufen. */
function sellInventoryItem(itemId) {
  const baseCost = getItemBaseCost(itemId);
  const owned    = resources.inventory[itemId] || 0;
  if (!baseCost || owned <= 0) return;

  const price = Math.max(1, Math.floor(baseCost / 2));
  resources.inventory[itemId] = owned - 1;
  resources.gold            += price;
  resources.totalGoldEarned += price;

  const itemMeta = findItemMeta(itemId);
  showToast(`${itemMeta.name} an Greta verkauft (+${price} Gold).`, 'purchase');
  checkMilestones();
  render();
}

const EQUIPMENT_SLOTS = [
  { id: 'hands',   label: 'Hände',  emptyIcon: '✋' },
  { id: 'guertel', label: 'Gürtel', emptyIcon: '➖' }
];

/* Rohstoffe für Gretas Auftrag (siehe npc.js, market.js) — eigene Registry,
   weil sie weder Verbrauchsgut (kein "Verzehren") noch Ausrüstung sind. */
const RESOURCE_ITEMS = [
  { id: 'holz',    name: 'Holz',     icon: '🪵' },
  { id: 'stein',   name: 'Stein',    icon: '🪨' },
  { id: 'pflanze', name: 'Wildkraut', icon: '🌿' }
];

/** Anzahl belegter Inventar-Plätze — ein Platz pro BESESSENEM Gegenstands-
    TYP (Stapel zählen nicht doppelt), siehe INVENTORY_SLOT_COUNT. Zählt
    auch Werkzeuge (TOOL_ITEMS, market.js) und Rohstoffe mit, da beide
    ebenfalls in `resources.inventory` liegen. */
function getUsedInventorySlots() {
  const food      = FOOD_ITEMS.filter(i => (resources.inventory[i.id] || 0) > 0).length;
  const equip     = EQUIPMENT_ITEMS.filter(i => (resources.inventory[i.id] || 0) > 0).length;
  const res       = RESOURCE_ITEMS.filter(i => (resources.inventory[i.id] || 0) > 0).length;
  const tools     = TOOL_ITEMS.filter(i => (resources.inventory[i.id] || 0) > 0).length;
  return food + equip + res + tools;
}

/**
 * Fügt einen Gegenstand ins Inventar ein — ob gekauft oder geschenkt.
 * Ist kein Platz mehr frei (und der Spieler besitzt diesen Typ noch nicht),
 * landet er stattdessen im `overflowBag`: aufgezwungene Gegenstände (z.B.
 * NPC-Geschenke) dürfen nie einfach verloren gehen, auch wenn der reguläre
 * Beutel voll ist.
 */
function grantItem(itemId, qty = 1) {
  const alreadyHasSlot = (resources.inventory[itemId] || 0) > 0;
  if (!alreadyHasSlot && getUsedInventorySlots() >= INVENTORY_SLOT_COUNT) {
    overflowBag[itemId] = (overflowBag[itemId] || 0) + qty;
    showToast('Mein Beutel ist voll — das hier trage ich vorerst zusätzlich bei mir.', 'event');
    return;
  }
  resources.inventory[itemId] = (resources.inventory[itemId] || 0) + qty;
  gameFlags.everOwnedItem = true; // schaltet die Inventar-Navigation frei (siehe nav.js)
}

/** Versucht, einen Gegenstand aus dem überzähligen Beutel ins reguläre
    Inventar einzusortieren — klappt nur, wenn inzwischen wieder Platz ist. */
function moveFromOverflow(itemId) {
  const qty = overflowBag[itemId] || 0;
  if (qty <= 0) return;

  const alreadyHasSlot = (resources.inventory[itemId] || 0) > 0;
  if (!alreadyHasSlot && getUsedInventorySlots() >= INVENTORY_SLOT_COUNT) {
    showToast('Noch immer kein Platz im Beutel.', 'error');
    return;
  }

  resources.inventory[itemId] = (resources.inventory[itemId] || 0) + qty;
  delete overflowBag[itemId];
  render();
}

/** Findet Name/Icon eines Gegenstands über Food- oder Ausrüstungs-Registry
    (für die Anzeige im überzähligen Beutel, der beide Arten enthalten kann). */
function findItemMeta(itemId) {
  return FOOD_ITEMS.find(i => i.id === itemId) || EQUIPMENT_ITEMS.find(i => i.id === itemId) ||
    RESOURCE_ITEMS.find(i => i.id === itemId) || TOOL_ITEMS.find(i => i.id === itemId);
}

/** Rendert die Inventar-Seite: Slot-Übersicht, Ausrüstung, Verbrauchsgüter,
    Questgegenstände (separat) und ggf. den überzähligen Beutel. */
function renderInventar(el) {
  const ownedFood   = FOOD_ITEMS.filter(item => (resources.inventory[item.id] || 0) > 0);
  const ownedEquip  = EQUIPMENT_ITEMS.filter(item => (resources.inventory[item.id] || 0) > 0);
  // Ein Slot erscheint nur, sobald der Spieler je Zugriff auf einen
  // passenden Gegenstand hatte — sonst wäre ein leerer "Gürtel"-Platz ein
  // Spoiler für eine Mechanik, die er noch gar nicht kennt.
  const relevantSlots = EQUIPMENT_SLOTS.filter(slot =>
    equipment[slot.id] || EQUIPMENT_ITEMS.some(i => i.slot === slot.id && (resources.inventory[i.id] || 0) > 0));
  const hasAnyGear  = relevantSlots.length > 0;
  const ownedQuestItems = QUEST_ITEMS.filter(qi => (questItems[qi.id] || 0) > 0);
  const ownedResources = RESOURCE_ITEMS.filter(r => (resources.inventory[r.id] || 0) > 0);
  const ownedTools  = TOOL_ITEMS.filter(t => (resources.inventory[t.id] || 0) > 0);
  const overflowEntries = Object.entries(overflowBag).filter(([, qty]) => qty > 0);

  if (ownedFood.length === 0 && !hasAnyGear && ownedQuestItems.length === 0 &&
      ownedResources.length === 0 && ownedTools.length === 0 && overflowEntries.length === 0) {
    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Inventar</div>
        <p class="chronik-empty">
          Dein Inventar ist leer. Besuche einen Krämer, um Vorräte zu kaufen.
        </p>
      </div>
    `;
    return;
  }

  const usedSlots = getUsedInventorySlots();
  const slotCells = Array.from({ length: INVENTORY_SLOT_COUNT }, (_, i) =>
    `<div class="inv-slot-cell ${i < usedSlots ? 'filled' : 'empty'}"></div>`).join('');
  const slotOverview = `
    <div class="inv-slot-overview" title="${usedSlots} / ${INVENTORY_SLOT_COUNT} Plätze belegt">
      ${slotCells}
    </div>
    <div class="inv-slot-label">${usedSlots} / ${INVENTORY_SLOT_COUNT} Plätze belegt</div>`;

  let equipmentSection = '';
  if (hasAnyGear) {
    const slotCards = relevantSlots.map(slot => {
      const equippedId   = equipment[slot.id];
      const equippedItem = equippedId ? EQUIPMENT_ITEMS.find(i => i.id === equippedId) : null;
      if (equippedItem) {
        return `
          <div class="action-card action-card-compact">
            <div class="action-card-icon">${equippedItem.icon}</div>
            <div class="action-card-name">${equippedItem.slotLabel}: ${equippedItem.name}</div>
            <div class="action-card-effect">${equippedItem.effect}</div>
            <button class="action-btn" onclick="unequipItem('${slot.id}')">Ablegen</button>
          </div>`;
      }
      return `
        <div class="action-card action-card-compact action-card-locked">
          <div class="action-card-icon">${slot.emptyIcon}</div>
          <div class="action-card-name">${slot.label}: leer</div>
        </div>`;
    }).join('');

    equipmentSection = `
      <div class="market-section-label">Ausrüstung</div>
      <div class="action-grid">${slotCards}</div>`;
  }

  const foodCards = ownedFood.map(item => {
    const count = resources.inventory[item.id];
    const effectParts = [];
    if (item.hungerRelief) effectParts.push(`🍞 −${item.hungerRelief}%`);
    if (item.tirednessRelief) effectParts.push(`😴 −${item.tirednessRelief}%`);
    const sellPrice = Math.max(1, Math.floor(item.cost / 2));
    const useLabel = item.useLabel || 'Verzehren';

    return `
      <div class="action-card action-card-compact">
        <div class="action-card-icon">${item.icon}</div>
        <div class="action-card-name">${item.name} <span class="inventory-count">×${count}</span></div>
        <div class="action-card-effect">${effectParts.join(' · ')}</div>
        <button class="action-btn" onclick="useFood('${item.id}')">${useLabel}</button>
        <button class="action-btn inv-sell-btn" onclick="sellInventoryItem('${item.id}')">An Greta verkaufen (+${sellPrice}g)</button>
      </div>`;
  }).join('');

  const equipBagCards = ownedEquip.map(item => {
    const sellPrice = Math.max(1, Math.floor(item.cost / 2));
    return `
    <div class="action-card action-card-compact">
      <div class="action-card-icon">${item.icon}</div>
      <div class="action-card-name">${item.name}</div>
      <div class="action-card-effect">${item.effect}</div>
      <button class="action-btn" onclick="equipItem('${item.id}')">Ausrüsten</button>
      <button class="action-btn inv-sell-btn" onclick="sellInventoryItem('${item.id}')">An Greta verkaufen (+${sellPrice}g)</button>
    </div>`;
  }).join('');

  const questCards = ownedQuestItems.map(qi => `
    <div class="action-card action-card-compact action-card-quest">
      <div class="action-card-icon">${qi.icon}</div>
      <div class="action-card-name">${qi.name} <span class="inventory-count">×${questItems[qi.id]}</span></div>
      <p class="action-card-desc">${qi.desc}</p>
    </div>`).join('');

  const resourceCards = ownedResources.map(r => `
    <div class="action-card action-card-compact">
      <div class="action-card-icon">${r.icon}</div>
      <div class="action-card-name">${r.name} <span class="inventory-count">×${resources.inventory[r.id]}</span></div>
    </div>`).join('');

  const toolCards = ownedTools.map(t => {
    const sellPrice = Math.max(1, Math.floor(t.cost / 2));
    return `
    <div class="action-card action-card-compact">
      <div class="action-card-icon">${t.icon}</div>
      <div class="action-card-name">${t.name}</div>
      <button class="action-btn inv-sell-btn" onclick="sellInventoryItem('${t.id}')">An Greta verkaufen (+${sellPrice}g)</button>
    </div>`;
  }).join('');

  const overflowCards = overflowEntries.map(([itemId, qty]) => {
    const meta = findItemMeta(itemId);
    if (!meta) return '';
    return `
      <div class="action-card action-card-compact">
        <div class="action-card-icon">${meta.icon}</div>
        <div class="action-card-name">${meta.name} <span class="inventory-count">×${qty}</span></div>
        <button class="action-btn" onclick="moveFromOverflow('${itemId}')">Einsortieren</button>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Inventar</div>
      ${slotOverview}
      ${equipmentSection}
      ${foodCards ? `<div class="market-section-label">Verbrauchsgüter</div><div class="action-grid">${foodCards}</div>` : ''}
      ${equipBagCards ? `<div class="market-section-label">Im Beutel</div><div class="action-grid">${equipBagCards}</div>` : ''}
      ${toolCards ? `<div class="market-section-label">Werkzeug</div><div class="action-grid">${toolCards}</div>` : ''}
      ${resourceCards ? `<div class="market-section-label">Rohstoffe</div><div class="action-grid">${resourceCards}</div>` : ''}
      ${questCards ? `<div class="market-section-label">Questgegenstände</div><div class="action-grid">${questCards}</div>` : ''}
      ${overflowCards ? `
        <div class="market-section-label">Zusätzlich bei mir (Beutel voll)</div>
        <div class="action-grid">${overflowCards}</div>` : ''}
    </div>
  `;
}

/** Rüstet einen Gegenstand aus dem Inventar in seinen Charakter-Slot aus.
    Belegt der Slot bereits etwas anderes, wandert das zurück ins Inventar. */
function equipItem(itemId) {
  const item  = EQUIPMENT_ITEMS.find(i => i.id === itemId);
  const owned = item ? (resources.inventory[itemId] || 0) : 0;
  if (!item || owned <= 0) return;

  const previous = equipment[item.slot];
  if (previous) resources.inventory[previous] = (resources.inventory[previous] || 0) + 1;

  resources.inventory[itemId] = owned - 1;
  equipment[item.slot] = itemId;

  showToast(`${item.name} ausgerüstet.`, 'purchase');
  render();
}

/** Legt den Gegenstand aus einem Slot wieder ab — zurück ins Inventar. */
function unequipItem(slot) {
  const itemId = equipment[slot];
  if (!itemId) return;

  resources.inventory[itemId] = (resources.inventory[itemId] || 0) + 1;
  equipment[slot] = null;
  render();
}

/** Verzehrt ein Nahrungsmittel aus dem Inventar und wendet seine Effekte an. */
function useFood(itemId) {
  const item  = FOOD_ITEMS.find(i => i.id === itemId);
  const count = resources.inventory[itemId] || 0;
  if (!item || count <= 0) return;

  resources.inventory[itemId] = count - 1;
  if (item.hungerRelief) adjustHunger(-item.hungerRelief);
  if (item.tirednessRelief) adjustTiredness(-item.tirednessRelief);

  // Brot hebt den harten Arbeits-Block auf, der seit dem ersten
  // Hunger-Debuff gilt (siehe actions.js, startWork()/mustEatBread).
  const resolvedWorkBlock = itemId === 'brot' && gameFlags.mustEatBread;
  if (resolvedWorkBlock) gameFlags.mustEatBread = false;

  let toastMsg;
  if (resolvedWorkBlock)     toastMsg = `${item.name} verzehrt. Mit etwas im Magen kann ich wieder arbeiten.`;
  else if (item.hungerRelief && item.tirednessRelief) toastMsg = `${item.name} verzehrt. Hunger und Müdigkeit lassen nach.`;
  else if (item.tirednessRelief) toastMsg = `${item.name} getrunken. Die Müdigkeit lässt etwas nach.`;
  else                       toastMsg = `${item.name} verzehrt. Der Hunger lässt nach.`;
  showToast(toastMsg, 'purchase');
  render();
}
