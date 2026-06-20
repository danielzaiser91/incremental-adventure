/* ══════════════════════════════════════════════════════════════
   market.js — Marktplatz: Händler-Hub + einzelne Händler
   Der Marktplatz ist kein einzelner Laden, sondern ein Viertel mit
   mehreren spezialisierten Händlern. Neue Händler (z.B. Waffenschmied)
   reihen sich später als weitere Karten im Hub ein.
   ══════════════════════════════════════════════════════════════ */

'use strict';

const LEDERGLOVES_COST = 16;

const VENDORS = [
  { id: 'kraemer',       name: 'Krämer',        icon: '🧺', tagline: 'Verpflegung und kleine Ausrüstung für den Alltag.' },
  { id: 'schmiede',      name: 'Schmiede',      icon: '⚒',  tagline: 'Schwere Ausrüstung — nicht für jeden erschwinglich.' },
  {
    id: 'waffenschmied', name: 'Waffenschmied', icon: '🔒', locked: true,
    tagline: 'Der Waffenschmied verkauft seine Ware nur an registrierte Abenteurer.',
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
  }
];

/** Öffnet die Detailansicht eines Händlers. */
function openVendor(id) {
  marketVendor = id;
  render();
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
    if (v.locked) {
      return `
        <div class="action-card action-card-locked">
          <div class="action-card-icon">🔒</div>
          <div class="action-card-name">${v.name}</div>
          <p class="action-card-desc">${v.tagline}</p>
          <button class="action-btn btn-disabled" disabled>${v.lockReason || 'Gesperrt'}</button>
        </div>`;
    }
    // Solange der Spieler zum Essen gezwungen ist (mustEatBread), zeigt der
    // Krämer eine Hervorhebung — er ist schließlich der einzige Ort, der das
    // Problem lösen kann (siehe SKILL.md, "erzwungene Käufe").
    const needsBreadHighlight = v.id === 'kraemer' && gameFlags.mustEatBread;
    return `
      <div class="action-card${nightClosed ? ' action-card-locked' : ''}${needsBreadHighlight ? ' action-card-highlight' : ''}">
        <div class="action-card-icon">${v.icon}</div>
        <div class="action-card-name">${v.name}</div>
        <p class="action-card-desc">${v.tagline}</p>
        <button class="action-btn ${nightClosed ? 'btn-disabled' : ''}" onclick="openVendor('${v.id}')" ${nightClosed ? 'disabled' : ''}>
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

/* ── Krämer: Verpflegung & Kleinausrüstung ───────────────────── */
function renderVendorKraemer(el) {
  const nightClosed = isNight();

  const foodCards = FOOD_ITEMS.map(item => {
    const locked = item.unlockDay && gameClock.day < item.unlockDay;
    if (locked) {
      return `
        <div class="action-card action-card-locked">
          <div class="action-card-icon">${item.icon}</div>
          <div class="action-card-name">${item.name}</div>
          <p class="action-card-desc">Zurzeit ausverkauft. Wird in den nächsten Tagen geliefert (verfügbar ab Spieltag ${item.unlockDay}).</p>
          <button class="action-btn btn-disabled" disabled>Nicht verfügbar</button>
        </div>`;
    }
    const price = applyThrift(item.cost);
    const boughtToday = dailyPurchases[item.id] || 0;
    const limitReached = item.dailyLimit && boughtToday >= item.dailyLimit;
    const canAfford = resources.gold >= price && !nightClosed && !limitReached;
    const owned = resources.inventory[item.id] || 0;
    const effectParts = [`🍞 Hunger −${item.hungerRelief}%`];
    if (item.tirednessRelief) effectParts.push(`😴 Müdigkeit −${item.tirednessRelief}%`);
    const limitNote = item.dailyLimit
      ? `<div class="action-card-effect">Heute gekauft: ${boughtToday} / ${item.dailyLimit}</div>` : '';
    let buttonLabel = 'Kaufen';
    if (nightClosed) buttonLabel = 'Geschlossen';
    else if (limitReached) buttonLabel = 'Heute ausverkauft';
    const needsBreadHighlight = item.id === 'brot' && gameFlags.mustEatBread;
    return `
      <div class="action-card${needsBreadHighlight ? ' action-card-highlight' : ''}">
        <div class="action-card-icon">${item.icon}</div>
        <div class="action-card-name">${item.name}${owned ? ` <span class="inventory-count">×${owned} im Inventar</span>` : ''}</div>
        <p class="action-card-desc">${item.desc}</p>
        <div class="action-card-effect">${effectParts.join(' · ')}</div>
        ${limitNote}
        <div class="action-card-cost ${canAfford ? 'cost-ok' : 'cost-too-high'}">${price} Gold</div>
        <button class="action-btn ${canAfford ? '' : 'btn-disabled'}" onclick="buyFood('${item.id}')" ${canAfford ? '' : 'disabled'}>
          ${buttonLabel}
        </button>
      </div>`;
  }).join('');

  let gearSection = '';
  if (meta.resets >= 1) {
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
            : `<div class="action-card-cost ${canBuy ? 'cost-ok' : 'cost-too-high'}">${price} Gold</div>
               <button class="action-btn ${canBuy ? '' : 'btn-disabled'}" onclick="buyLedergloves()" ${canBuy ? '' : 'disabled'}>${nightClosed ? 'Geschlossen' : 'Kaufen'}</button>`
          }
        </div>
      </div>`;
  }

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Krämer — Verpflegung &amp; Kleinkram</div>
      <button class="action-btn vendor-back-btn" onclick="backToMarketHub()">◂ Zurück zum Marktplatz</button>
      ${nightClosed ? `<div class="status-badge status-badge-warning">⚠ Der Krämer hat für die Nacht geschlossen</div>` : ''}
      <div class="market-section-label">Verpflegung</div>
      <div class="action-grid">${foodCards}</div>
      ${gearSection}
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
