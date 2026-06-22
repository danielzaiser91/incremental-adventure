/* ══════════════════════════════════════════════════════════════
   market.js — Marktplatz: Händler-Hub + einzelne Händler
   Der Marktplatz ist kein einzelner Laden, sondern ein Viertel mit
   mehreren spezialisierten Händlern. Neue Händler (z.B. Waffenschmied)
   reihen sich später als weitere Karten im Hub ein.
   ══════════════════════════════════════════════════════════════ */

'use strict';

const LEDERGLOVES_COST = 16;
const ARBEITSGUERTEL_COST = 30;
const RESOURCE_SELL_THRESHOLD = 20; // kumulativ verkaufte Rohstoff-Einheiten, schaltet den Gürtel kaufbar
const RESOURCE_SELL_RATE = 1;       // Gold pro verkaufter Rohstoff-Einheit

/* Werkzeuge für den Sammelplatz (siehe content.js, renderRohstoffe()) —
   Kauf = sofortige Freischaltung der zugehörigen Sammel-Aktion, kein
   eigener Ausrüstungs-Schritt nötig (anders als Ledergloves/Gürtel,
   die einen spürbaren Effekt auf die Feldarbeit haben; Werkzeuge sind
   reine Zugangsvoraussetzungen). */
const TOOL_ITEMS = [
  { id: 'axt', name: 'Axt', icon: '🪓', cost: 10, resource: 'holz',
    desc: 'Zum Holzhacken am Waldrand.' },
  { id: 'spitzhacke', name: 'Spitzhacke', icon: '⛏', cost: 12, resource: 'stein',
    desc: 'Zum Lösen von Steinen im Geröll.' },
  { id: 'sichel', name: 'Sichel', icon: '🌾', cost: 8, resource: 'pflanze',
    desc: 'Zum Ernten von Wildkraut am Wegrand.' }
];

/* Gretas Sammel-Auftrag: wie viel von jedem Rohstoff sie für ihre
   Geschäftsidee braucht (siehe npc.js, NPC "greta"). */
const KRAEMERIN_QUEST_NEED = { holz: 5, stein: 5, pflanze: 5 };

function hasEnoughResourcesForQuest() {
  return Object.entries(KRAEMERIN_QUEST_NEED).every(([id, qty]) => (resources.inventory[id] || 0) >= qty);
}

/** Baut den Live-Fortschritt für Gretas "reminder"-Dialogknoten — als
    Trennstrich + Überschrift + Liste statt eines einzelnen, schwer
    lesbaren Fließtext-Satzes mit Punkt-Trennern. Landet als Teil EINER
    Dialogseite (siehe npc.js, Knoten `reminder`) — kein eigener
    `showDialog()`-Aufruf nötig, da `textEl.innerHTML` jeden Absatz-String
    ohnehin direkt als HTML einsetzt (siehe dialog.js). */
function kraemerinQuestListHtml() {
  const rows = Object.entries(KRAEMERIN_QUEST_NEED).map(([id, qty]) => {
    const have = resources.inventory[id] || 0;
    const item = RESOURCE_ITEMS.find(r => r.id === id);
    return `<li>${item.icon} ${item.name}: ${have}/${qty}</li>`;
  }).join('');
  return `<hr class="npc-dialog-sep">` +
    `<div class="npc-dialog-need-label">Für Questabschluss erforderlich</div>` +
    `<ul class="npc-dialog-need-list">${rows}</ul>`;
}

const VENDORS = [
  { id: 'kraemer',       name: 'Krämer',        icon: '🧺', tagline: 'Verpflegung und kleine Ausrüstung für den Alltag.' },
  { id: 'schmiede',      name: 'Schmiede',      icon: '⚒',  tagline: 'Schwere Ausrüstung — nicht für jeden erschwinglich.' },
  {
    id: 'waffenschmied', name: 'Waffenschmied', icon: '⚔',
    tagline: 'Klingen, Rüstungen, Spezialwerkzeug — für die, die wissen, was sie tun.',
    locked: () => gameFlags.waffenschmiedRejected,
    lockReason: 'Nur für Abenteurer'
  }
];

/* Preis/Leistung bewusst gestaffelt: Brot ist am effizientesten pro Gold,
   dafür streng limitiert (3/Tag). Fisch und Honigkuchen kosten mehr pro
   Hunger-Punkt, liefern aber mehr Erholung pro Kauf UND sind ebenfalls
   tageslimitiert — sonst würde reines Geld-Stapeln jedes Limit aushebeln. */
const FOOD_ITEMS = [
  {
    id: 'brot', name: 'Brot', icon: '🍞', cost: 2, hungerRelief: 30, dailyLimit: 3,
    desc: 'Frisch gebacken, noch warm. Stillt den größten Hunger.'
  },
  {
    id: 'fisch', name: 'Geräucherter Fisch', icon: '🐟', cost: 5, hungerRelief: 60, dailyLimit: 2, unlockDay: 3,
    desc: 'Herzhaft und sättigend — hält länger vor als Brot.'
  },
  {
    id: 'honigkuchen', name: 'Honigkuchen', icon: '🍯', cost: 12, hungerRelief: 80, tirednessRelief: 10, dailyLimit: 1, unlockDay: 5,
    desc: 'Ein süßer Genuss von reisenden Händlern. Stärkt Leib und Geist.'
  },
  {
    // unlockCond (Funktion → bool): zusätzliche Bedingung neben unlockDay.
    // Kaffee ist erst verfügbar, wenn Gretas Handelskette aufgebaut wurde —
    // kein Zulieferer, kein Kaffee.
    id: 'kaffee', name: 'Schwarzer Kaffee', icon: '☕', cost: 3,
    hungerRelief: 0, tirednessRelief: 20, dailyLimit: 2, useLabel: 'Trinken',
    unlockCond: () => quests.kraemerinBusiness.state === 'rewarded',
    lockedDesc: 'Noch kein Kaffee im Angebot. Wenn der Handel in Treutheim wächst, kommt auch das.',
    desc: 'Bitter und stark, in einem kleinen Tonbecher. Vertreibt die Müdigkeit, wenn Schlaf keine Option ist.'
  }
];

/** Baut den im Shop angezeigten Preis-Text — inkl. Hover-Tooltip, sobald
    der Sparsamkeits-Skill ihn gegenüber dem Basispreis verändert hat
    (siehe content.js, modifiedValueHtml()). Ohne den Skill bleibt der
    Wert ein normaler Text ohne Indikator. */
function priceDisplayHtml(baseCost) {
  const price = applyThrift(baseCost);
  const display = `${price} Gold`;
  const thriftLevel = getSkillLevel('thrift');
  if (thriftLevel <= 0) return display;

  return modifiedValueHtml(display, 'Basiskosten', `${baseCost}g`, [
    { label: `Sparsamkeit (Stufe ${thriftLevel})`, value: `-${thriftLevel * 10}%`, positive: true }
  ]);
}

/** Öffnet die Detailansicht eines Händlers. */
function openVendor(id) {
  marketVendor = id;
  render();
  if (id === 'kraemer') maybeTriggerKraemerinDialog();
}

/** Erster Besuch beim Waffenschmied: Abweisung, danach dauerhaft gesperrt. */
function visitWaffenschmied() {
  showDialog({
    title: 'Waffenschmied',
    text: [
      'Ein stämmiger Mann hinter dem Tresen hebt kaum den Blick. "Was willst du hier, Fremder?"',
      'Sein Blick wandert kurz über mich — und er verliert das Interesse sofort wieder.',
      '"Wir bedienen nur registrierte Abenteurer. Also verschwinde, bevor du mir die Zeit stiehlst."'
    ],
    buttons: [{ label: 'Verstanden.', onClick: () => {
      gameFlags.waffenschmiedRejected = true;
      navUnseen.taverne = true;
      closeDialog();
      render();
    }}]
  });
}

/** Zurück zur Marktplatz-Übersicht. */
function backToMarketHub() {
  marketVendor = null;
  render();
}

/* ── Marktplatz-Übersicht ─────────────────────────────────── */
function renderMarktplatzHub(el) {
  const nightClosed = isNight();

  const cards = VENDORS.map(v => {
    const isLocked = typeof v.locked === 'function' ? v.locked() : !!v.locked;
    if (isLocked) {
      return `
        <div class="action-card action-card-locked">
          <div class="action-card-icon">🔒</div>
          <div class="action-card-name">${v.name}</div>
          <p class="action-card-desc">${v.tagline}</p>
          <button class="action-btn btn-disabled" disabled>${v.lockReason || 'Gesperrt'}</button>
        </div>`;
    }
    // Solange der Spieler zum Essen gezwungen ist (mustEatBread) UND noch
    // kein Brot besitzt, zeigt der Krämer eine Hervorhebung — sobald ein
    // Brot im Inventar liegt, ist die FÜHRUNG erledigt (der harte
    // Arbeits-Block bleibt bis zum tatsächlichen Essen bestehen, siehe
    // useFood(), aber die Hervorhebung hat ihren Zweck schon erfüllt).
    const needsBreadHighlight = v.id === 'kraemer' && gameFlags.mustEatBread && (resources.inventory.brot || 0) === 0;
    const clickFn = v.id === 'waffenschmied' ? 'visitWaffenschmied()' : `openVendor('${v.id}')`;
    return `
      <div class="action-card${nightClosed ? ' action-card-locked' : ''}${needsBreadHighlight ? ' action-card-highlight' : ''}">
        <div class="action-card-icon">${v.icon}</div>
        <div class="action-card-name">${v.name}</div>
        <p class="action-card-desc">${v.tagline}</p>
        <button class="action-btn ${nightClosed ? 'btn-disabled' : ''}" onclick="${clickFn}" ${nightClosed ? 'disabled' : ''}>
          ${nightClosed ? 'Geschlossen' : 'Betreten'}
        </button>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Marktplatz — Händlerviertel</div>
      ${nightClosed ? `<div class="status-badge status-badge-warning">⚠ Die Händler haben für die Nacht geschlossen</div>` : ''}
      <div class="action-grid">${cards}</div>
    </div>
  `;
}

/** Prüft, ob ein Nahrungsmittel derzeit gesperrt ist (unlockDay ODER unlockCond). */
function isFoodItemLocked(item) {
  if (item.unlockDay && gameClock.day < item.unlockDay) return true;
  if (item.unlockCond && !item.unlockCond()) return true;
  return false;
}

/* ── Krämer: Verpflegung & Kleinausrüstung ───────────────────── */
function renderVendorKraemer(el) {
  const nightClosed = isNight();

  const foodCards = FOOD_ITEMS.map(item => {
    const locked = isFoodItemLocked(item);
    if (locked) {
      const lockedDesc = item.lockedDesc
        ?? `Zurzeit ausverkauft. Wird in den nächsten Tagen geliefert${item.unlockDay ? ` (verfügbar ab Spieltag ${item.unlockDay})` : ''}.`;
      return `
        <div class="action-card action-card-locked">
          <div class="action-card-icon">${item.icon}</div>
          <div class="action-card-name">${item.name}</div>
          <p class="action-card-desc">${lockedDesc}</p>
          <button class="action-btn btn-disabled" disabled>Nicht verfügbar</button>
        </div>`;
    }
    const price = applyThrift(item.cost);
    const boughtToday = dailyPurchases[item.id] || 0;
    const limitReached = item.dailyLimit && boughtToday >= item.dailyLimit;
    const canAfford = resources.gold >= price && !nightClosed && !limitReached;
    const owned = resources.inventory[item.id] || 0;
    const effectParts = [];
    if (item.hungerRelief) effectParts.push(`🍞 Hunger −${item.hungerRelief}%`);
    if (item.tirednessRelief) effectParts.push(`😴 Müdigkeit −${item.tirednessRelief}%`);
    const limitNote = item.dailyLimit
      ? `<div class="action-card-effect">Heute gekauft: ${boughtToday} / ${item.dailyLimit}</div>` : '';
    let buttonLabel = 'Kaufen';
    if (nightClosed) buttonLabel = 'Geschlossen';
    else if (limitReached) buttonLabel = 'Heute ausverkauft';
    const needsBreadHighlight = item.id === 'brot' && gameFlags.mustEatBread && owned === 0;
    return `
      <div class="action-card${needsBreadHighlight ? ' action-card-highlight' : ''}">
        <div class="action-card-icon">${item.icon}</div>
        <div class="action-card-name">${item.name}${owned ? ` <span class="inventory-count">×${owned} im Inventar</span>` : ''}</div>
        <p class="action-card-desc">${item.desc}</p>
        <div class="action-card-effect">${effectParts.join(' · ')}</div>
        ${limitNote}
        <div class="action-card-cost ${canAfford ? 'cost-ok' : 'cost-too-high'}">${priceDisplayHtml(item.cost)}</div>
        <button class="action-btn ${canAfford ? '' : 'btn-disabled'}" onclick="buyFood('${item.id}')" ${canAfford ? '' : 'disabled'}>
          ${buttonLabel}
        </button>
      </div>`;
  }).join('');

  let gearSection = '';
  if (gameFlags.kraemerinDialogShown) {
    const alreadyHave = (resources.inventory.ledergloves || 0) > 0 || equipment.hands === 'ledergloves';
    const price = applyThrift(LEDERGLOVES_COST);
    const canBuy = !alreadyHave && resources.gold >= price && !nightClosed;
    gearSection = `
      <div class="market-section-label">Kleinausrüstung</div>
      <div class="action-grid">
        <div class="action-card">
          <div class="action-card-icon">🧤</div>
          <div class="action-card-name">Lederhandschuhe</div>
          <p class="action-card-desc">Schonen die Hände, erlauben kräftigeres Zupacken. Muss im Inventar ausgerüstet werden.</p>
          <div class="action-card-effect">+1 Gold pro Feldarbeit, sobald ausgerüstet</div>
          ${alreadyHave
            ? `<div class="action-card-cost cost-ok">Erworben ✓</div><button class="action-btn btn-disabled" disabled>Erworben</button>`
            : `<div class="action-card-cost ${canBuy ? 'cost-ok' : 'cost-too-high'}">${priceDisplayHtml(LEDERGLOVES_COST)}</div>
               <button class="action-btn ${canBuy ? '' : 'btn-disabled'}" onclick="buyLedergloves()" ${canBuy ? '' : 'disabled'}>${nightClosed ? 'Geschlossen' : 'Kaufen'}</button>`
          }
        </div>
      </div>`;
  }

  let toolSection = '';
  if (gameFlags.resourceGatheringUnlocked) {
    const toolCards = TOOL_ITEMS.map(tool => {
      const owned = (resources.inventory[tool.id] || 0) > 0;
      const price = applyThrift(tool.cost);
      const canBuy = !owned && resources.gold >= price && !nightClosed;
      return `
        <div class="action-card">
          <div class="action-card-icon">${tool.icon}</div>
          <div class="action-card-name">${tool.name}</div>
          <p class="action-card-desc">${tool.desc}</p>
          ${owned
            ? `<div class="action-card-cost cost-ok">Erworben ✓</div><button class="action-btn btn-disabled" disabled>Erworben</button>`
            : `<div class="action-card-cost ${canBuy ? 'cost-ok' : 'cost-too-high'}">${priceDisplayHtml(tool.cost)}</div>
               <button class="action-btn ${canBuy ? '' : 'btn-disabled'}" onclick="buyTool('${tool.id}')" ${canBuy ? '' : 'disabled'}>${nightClosed ? 'Geschlossen' : 'Kaufen'}</button>`
          }
        </div>`;
    }).join('');
    toolSection = `<div class="market-section-label">Werkzeug</div><div class="action-grid">${toolCards}</div>`;
  }

  let gretaSection = '';
  if (quests.kraemerinBusiness.state === 'rewarded') {
    const totalOnHand = RESOURCE_ITEMS.reduce((sum, r) => sum + (resources.inventory[r.id] || 0), 0);
    const sellCard = `
      <div class="action-card">
        <div class="action-card-icon">💰</div>
        <div class="action-card-name">Rohstoffe verkaufen</div>
        <p class="action-card-desc">Greta kauft, was du gesammelt hast, und verkauft es an die Handwerker weiter.</p>
        <div class="action-card-effect">Vorrat: ${totalOnHand} Einheiten · insgesamt verkauft: ${resources.totalResourcesSold}/${RESOURCE_SELL_THRESHOLD}</div>
        <button class="action-btn ${totalOnHand > 0 ? '' : 'btn-disabled'}" onclick="sellResources()" ${totalOnHand > 0 ? '' : 'disabled'}>
          Verkaufen (+${totalOnHand * RESOURCE_SELL_RATE} Gold)
        </button>
      </div>`;

    const alreadyHaveGuertel = (resources.inventory.arbeitsguertel || 0) > 0 || equipment.guertel === 'arbeitsguertel';
    const enoughSold = resources.totalResourcesSold >= RESOURCE_SELL_THRESHOLD;
    const guertelPrice = applyThrift(ARBEITSGUERTEL_COST);
    const canBuyGuertel = !alreadyHaveGuertel && enoughSold && resources.gold >= guertelPrice && !nightClosed;
    const guertelCard = `
      <div class="action-card${enoughSold ? '' : ' action-card-locked'}">
        <div class="action-card-icon">🪢</div>
        <div class="action-card-name">Arbeitsgürtel</div>
        <p class="action-card-desc">Handwerksarbeit aus Gretas neuem Sortiment. Verteilt das Gewicht besser, schont den Rücken.</p>
        <div class="action-card-effect">+1 Gold pro Feldarbeit, sobald ausgerüstet</div>
        ${alreadyHaveGuertel
          ? `<div class="action-card-cost cost-ok">Erworben ✓</div><button class="action-btn btn-disabled" disabled>Erworben</button>`
          : enoughSold
            ? `<div class="action-card-cost ${canBuyGuertel ? 'cost-ok' : 'cost-too-high'}">${priceDisplayHtml(ARBEITSGUERTEL_COST)}</div>
               <button class="action-btn ${canBuyGuertel ? '' : 'btn-disabled'}" onclick="buyArbeitsguertel()" ${canBuyGuertel ? '' : 'disabled'}>${nightClosed ? 'Geschlossen' : 'Kaufen'}</button>`
            : `<div class="action-card-cost">Erfordert ${RESOURCE_SELL_THRESHOLD} verkaufte Rohstoffe (${resources.totalResourcesSold}/${RESOURCE_SELL_THRESHOLD})</div>
               <button class="action-btn btn-disabled" disabled>Noch nicht verfügbar</button>`}
      </div>`;

    gretaSection = `<div class="market-section-label">Gretas Werkstatt</div><div class="action-grid">${sellCard}${guertelCard}</div>`;
  }

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Krämer — Verpflegung &amp; Kleinkram</div>
      <button class="action-btn vendor-back-btn" onclick="backToMarketHub()">◂ Zurück zum Marktplatz</button>
      ${nightClosed ? `<div class="status-badge status-badge-warning">⚠ Der Krämer hat für die Nacht geschlossen</div>` : ''}
      <div class="market-section-label">Verpflegung</div>
      <div class="action-grid">${foodCards}</div>
      ${gearSection}
      ${toolSection}
      ${gretaSection}
    </div>
  `;
}

/* ── Schmiede: schwere Ausrüstung ─────────────────────────────── */
function renderVendorSchmiede(el) {
  const nightClosed = isNight();
  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Schmiede — Schwere Ausrüstung</div>
      <button class="action-btn vendor-back-btn" onclick="backToMarketHub()">◂ Zurück zum Marktplatz</button>
      ${nightClosed ? `<div class="status-badge status-badge-warning">⚠ Die Schmiede hat für die Nacht geschlossen</div>` : ''}
      <div class="action-grid">
        <div class="action-card action-card-locked">
          <div class="action-card-icon">🔒</div>
          <div class="action-card-name">Schmiedeofen</div>
          <p class="action-card-desc">???</p>
          <div class="action-card-cost">Erfordert ein eigenes Zuhause</div>
          <button class="action-btn btn-disabled" disabled>Gesperrt</button>
        </div>
      </div>
    </div>
  `;
}

/** Kauft ein Nahrungsmittel beim Krämer — landet im Inventar, wird nicht sofort verzehrt. */
function buyFood(itemId) {
  const item = FOOD_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  const price = applyThrift(item.cost);
  const boughtToday = dailyPurchases[itemId] || 0;
  const limitReached = item.dailyLimit && boughtToday >= item.dailyLimit;

  if (isNight()) {
    showToast('Der Krämer hat für die Nacht geschlossen.', 'error');
    return;
  }
  if (isFoodItemLocked(item)) {
    showToast(`${item.name} ist zurzeit nicht im Angebot.`, 'error');
    return;
  }
  if (limitReached) {
    showToast(`Mehr ${item.name} gibt es heute nicht — versuch es morgen wieder.`, 'error');
    maybeShowFoodLimitDialog(item.name);
    return;
  }
  if (resources.gold < price) {
    showToast(`Nicht genug Gold. Du benötigst ${price} Gold für ${item.name}.`, 'error');
    return;
  }

  resources.gold -= price;
  grantItem(item.id, 1);
  dailyPurchases[itemId] = boughtToday + 1;

  showToast(`${item.name} gekauft (−${price} Gold). Liegt jetzt in deinem Inventar bereit.`, 'purchase');
  render();

  if (item.dailyLimit && dailyPurchases[itemId] >= item.dailyLimit) maybeShowFoodLimitDialog(item.name);
}

/** Erklärt einmalig, warum der Krämer ein Tageslimit für Verpflegung hat —
    unabhängig davon, bei welchem Gut es zuerst zuschlägt. */
function maybeShowFoodLimitDialog(itemName) {
  if (gameFlags.breadLimitDialogShown) return;
  gameFlags.breadLimitDialogShown = true;

  showMonologue('Ausverkauft', [
    `Der Krämer schüttelt den Kopf. "Mehr ${itemName} habe ich heute nicht für dich — frag morgen wieder."`,
    'Scheint, als müsste ich mir mein Essen für den Tag besser einteilen.'
  ], render);
}

/** Kauft die Lederhandschuhe beim Krämer — landen unausgerüstet im Inventar
    (siehe inventory.js, equipItem()). */
function buyLedergloves() {
  const alreadyHave = (resources.inventory.ledergloves || 0) > 0 || equipment.hands === 'ledergloves';
  const price = applyThrift(LEDERGLOVES_COST);

  if (isNight()) {
    showToast('Der Krämer hat für die Nacht geschlossen.', 'error');
    return;
  }
  if (alreadyHave || resources.gold < price) {
    showToast(`Nicht genug Gold. Du benötigst ${price} Gold für die Lederhandschuhe.`, 'error');
    return;
  }

  resources.gold -= price;
  grantItem('ledergloves', 1);
  showToast(`Lederhandschuhe erworben (−${price} Gold). Im Inventar ausrüsten, damit sie wirken.`, 'purchase');
  render();
}

/** Kauft ein Werkzeug für den Sammelplatz — schaltet sofort die zugehörige
    Sammel-Aktion frei (siehe content.js, renderRohstoffe()). */
function buyTool(itemId) {
  const tool = TOOL_ITEMS.find(t => t.id === itemId);
  if (!tool) return;

  const alreadyHave = (resources.inventory[itemId] || 0) > 0;
  const price = applyThrift(tool.cost);

  if (isNight()) {
    showToast('Der Krämer hat für die Nacht geschlossen.', 'error');
    return;
  }
  if (alreadyHave || resources.gold < price) {
    showToast(`Nicht genug Gold. Du benötigst ${price} Gold für ${tool.name}.`, 'error');
    return;
  }

  resources.gold -= price;
  grantItem(itemId, 1);
  showToast(`${tool.name} erworben (−${price} Gold).`, 'purchase');
  render();
}

/** Verkauft alle gesammelten Rohstoffe an Greta — pauschal, kein Auswählen
    einzelner Mengen (Effekt: einfacher "alles zu Gold machen"-Klick). */
function sellResources() {
  const total = RESOURCE_ITEMS.reduce((sum, r) => sum + (resources.inventory[r.id] || 0), 0);
  if (total <= 0) {
    showToast('Nichts zu verkaufen.', 'error');
    return;
  }

  RESOURCE_ITEMS.forEach(r => { resources.inventory[r.id] = 0; });
  const gain = total * RESOURCE_SELL_RATE;
  resources.gold              += gain;
  resources.totalGoldEarned   += gain;
  resources.totalResourcesSold = (resources.totalResourcesSold || 0) + total;

  showToast(`${total} Rohstoffe verkauft (+${gain} Gold).`, 'purchase');
  render();
}

/** Kauft den Arbeitsgürtel — Gretas erstes Ausrüstungsstück, erst kaufbar
    nach genug verkauften Rohstoffen (siehe RESOURCE_SELL_THRESHOLD). */
function buyArbeitsguertel() {
  const alreadyHave = (resources.inventory.arbeitsguertel || 0) > 0 || equipment.guertel === 'arbeitsguertel';
  const enoughSold = resources.totalResourcesSold >= RESOURCE_SELL_THRESHOLD;
  const price = applyThrift(ARBEITSGUERTEL_COST);

  if (isNight()) {
    showToast('Der Krämer hat für die Nacht geschlossen.', 'error');
    return;
  }
  if (!enoughSold) {
    showToast(`Greta braucht erst noch mehr verkaufte Rohstoffe (${resources.totalResourcesSold}/${RESOURCE_SELL_THRESHOLD}).`, 'error');
    return;
  }
  if (alreadyHave || resources.gold < price) {
    showToast(`Nicht genug Gold. Du benötigst ${price} Gold für den Arbeitsgürtel.`, 'error');
    return;
  }

  resources.gold -= price;
  grantItem('arbeitsguertel', 1);
  showToast(`Arbeitsgürtel erworben (−${price} Gold). Im Inventar ausrüsten, damit er wirkt.`, 'purchase');
  render();
}

/** Ladentheken-Gespräch beim ersten Besuch des Krämers NACH dem ersten
    Neuanfang — dankt für die Treue, lenkt auf die Lederhandschuhe und lädt
    in die Taverne ein, wo Greta ihre eigentliche Geschäftsidee vorstellt
    (siehe npc.js, NPC "greta"). */
function maybeTriggerKraemerinDialog() {
  if (gameFlags.kraemerinDialogShown || meta.resets < 1) return;
  gameFlags.kraemerinDialogShown = true;

  const pages = [
    '"Du bist mir schon aufgefallen", sagt die Krämerin und wischt die Theke ab. "Kommst öfter vorbei als die meisten — und gehst nie ohne was zu kaufen."',
    'Sie deutet auf deine Hände. "Ist das nicht hart? Mit bloßen Händen auf dem Feld?" Sie zeigt zu einem Regal hinter sich. "Schau dir ruhig mein restliches Angebot an — manches davon könnte dir die Arbeit erleichtern."',
    '"Und wenn du mal Zeit hast — komm in die Taverne. Ich hab da eine Geschäftsidee, bei der du mir vielleicht helfen könntest."'
  ];

  showPaginatedDialog('Greta, die Krämerin', splitLongDialogPages(pages), [{
    label: 'Ich höre zu.',
    onClick: () => closeDialog(() => {
      quests.kraemerinBusiness.state = 'invited';
      navUnseen.taverne = true;
      render();
    })
  }]);
}
