/* ══════════════════════════════════════════════════════════════
   pets.js — Haustiere
   Zwei Kategorien:
   - Besonders: geheime Straßenkatze (Schlafbonus) + Wolf-Welpe (Kampfschaden)
   - Wildtiere: Hund, Rabe, Hase, Eichhörnchen, Katze, Eule
     (Katze: nach 15 Nachtwachen; Eule: nach 20 Nachtwachen)
   ══════════════════════════════════════════════════════════════ */

'use strict';

const PET_MAX_LEVEL = 3;

const PET_DEFS = {
  streetCat: {
    name: 'Straßenkatze', icon: '🐈', special: true,
    desc: 'Sie ist mir zugelaufen, in einer kalten Nacht, in der ich sie nicht erwartet hatte.',
    bonusText: level => `+${1 + level} Schlafqualitäts-Stufe${level ? ` (Stufe ${level}/${PET_MAX_LEVEL} verstärkt)` : ''}`
  },
  wolfWelpe: {
    name: 'Wolf-Welpe', icon: '🐺', special: true,
    desc: 'Er folgte mir aus dem tiefen Wald — nach dem Kampf mit dem Waldtroll war er plötzlich einfach da.',
    bonusText: level => `+${3 * (1 + level)} Kampfschaden (Stufe ${level}/${PET_MAX_LEVEL} verstärkt)`,
    unlockHint: 'Gefunden in den Tiefen des Jagdgebiets'
  }
};

const WILD_PET_DEFS = {
  hund:          { name: 'Hund',          icon: '🐕', bonusLabel: 'Kampfschaden', bonusFn: lvl => `+${5 * lvl} % Angriffsstärke`,           hint: 'Seltener Drop aus dem Jagdgebiet — Greta fragen' },
  rabe:          { name: 'Rabe',          icon: '🐦', bonusLabel: 'EP-Bonus',    bonusFn: lvl => `+${15 * lvl} % EP pro Neuanfang`,         hint: 'Seltener Drop aus dem Jagdgebiet — Greta fragen' },
  hase:          { name: 'Hase',          icon: '🐇', bonusLabel: 'Hunger',       bonusFn: lvl => `Hunger steigt ${10 * lvl} % langsamer`,   hint: 'Seltener Drop aus dem Jagdgebiet — Greta fragen' },
  eichhoernchen: { name: 'Eichhörnchen', icon: '🐿', bonusLabel: 'Rohstoffe',   bonusFn: lvl => `+${lvl} Rohstoff pro Sammelaktion`,        hint: 'Seltener Drop aus dem Jagdgebiet — Greta fragen' },
  katze:         { name: 'Hauskatze',     icon: '🐱', bonusLabel: 'Müdigkeit',   bonusFn: lvl => `Müdigkeit steigt ${8 * lvl} % langsamer`,  hint: 'Scheint nach vielen Nachtwachen aufzutauchen' },
  eule:          { name: 'Eule',          icon: '🦉', bonusLabel: 'Nachtwache',  bonusFn: lvl => `+${10 * lvl} % Gold aus Nachtwachen`,      hint: 'Erscheint bei besonders ausdauernden Nachtwächtern' }
};

/** Bonus-Multiplikator auf Angriffsstärke aus Hund-Haustier. */
function getWildPetCombatBonus() {
  const dog = wildPets.find(p => p.type === 'hund');
  return dog ? 1 + (dog.level * 0.05) : 1;
}

/** Bonus-Multiplikator auf EP aus Raben-Haustier. */
function getWildPetEpBonus() {
  const raven = wildPets.find(p => p.type === 'rabe');
  return raven ? 1 + (raven.level * 0.15) : 1;
}

/** Malus-Reduktion auf Hunger-Anstieg aus Hasen-Haustier. */
function getWildPetHungerReduction() {
  const rabbit = wildPets.find(p => p.type === 'hase');
  return rabbit ? rabbit.level * 0.10 : 0; // 0.10 = 10% langsamer
}

/** Bonus-Rohstoffe pro Sammelaktion aus Eichhörnchen. */
function getWildPetResourceBonus() {
  const squirrel = wildPets.find(p => p.type === 'eichhoernchen');
  return squirrel ? squirrel.level : 0;
}

/** Reduktion des Müdigkeitsanstiegs durch die Hauskatze (Wildtier). */
function getWildPetTirednessReduction() {
  const cat = wildPets.find(p => p.type === 'katze');
  return cat ? cat.level * 0.08 : 0; // 0.08 = 8% langsamer pro Level
}

/** Bonus-Multiplikator auf Gold aus Nachtwachen durch die Eule (Wildtier). */
function getWildPetNightWatchBonus() {
  const owl = wildPets.find(p => p.type === 'eule');
  return owl ? owl.level * 0.10 : 0; // 0.10 = 10% mehr Gold pro Level
}

/** Fester Schadenszuwachs durch Wolf-Welpen (besonderes Haustier). */
function getWildPetCombatDamageBonus() {
  const wolf = pets.wolfWelpe;
  return wolf ? 3 * (1 + (wolf.level || 0)) : 0;
}

/** Sammelbonus aller Haustiere auf die Schlafqualität. */
function getPetSleepBonus() {
  return Object.entries(pets).reduce((sum, [id, pet]) => {
    const def = PET_DEFS[id];
    if (!def) return sum;
    return sum + 1 + (pet.level || 0);
  }, 0);
}

/** Zeit mit einem Tier verbringen — einmal täglich GESAMT (alle Tiere teilen sich das Limit). */
function trainPet(petId) {
  if (!skills.petLover) return;
  const pet = pets[petId];
  if (!pet || pet.level >= PET_MAX_LEVEL) return;

  if (dailyPurchases.petTrainToday) {
    showToast('Für heute haben wir genug Zeit miteinander verbracht.', TOAST.INFO);
    return;
  }

  dailyPurchases.petTrainToday = true;
  pet.level += 1;
  showToast(`${PET_DEFS[petId].name} ist jetzt enger mit mir vertraut (Stufe ${pet.level}/${PET_MAX_LEVEL}).`, TOAST.EVENT);
  render();
}

/** Zeit mit einem Wildtier verbringen — teilt das Tageslimit mit Straßenkatze. */
function trainWildPet(type) {
  if (!skills.petLover) return;
  const pet = wildPets.find(p => p.type === type);
  if (!pet || pet.level >= PET_MAX_LEVEL) return;

  if (dailyPurchases.petTrainToday) {
    showToast('Für heute haben wir genug Zeit miteinander verbracht.', TOAST.INFO);
    return;
  }

  dailyPurchases.petTrainToday = true;
  pet.level += 1;
  const def = WILD_PET_DEFS[type];
  showToast(`${def.name} vertraut mir mehr (Stufe ${pet.level}/${PET_MAX_LEVEL}). ${def.bonusFn(pet.level)}`, TOAST.EVENT);
  render();
}

function setPetsTab(tab) {
  petsTab = tab;
  render();
}

/* ── Haustiere-Seite ──────────────────────────────────────── */
function renderPets(el) {
  const trainedToday = !!dailyPurchases.petTrainToday;

  // ── Wildtiere-Tab: Alle bekannten Wildtier-Typen ──────────────
  if (petsTab === 'wildtiere') {
    const wildTypeOrder = ['hund', 'rabe', 'hase', 'eichhoernchen', 'katze', 'eule'];
    const wildCards = wildTypeOrder.map(type => {
      const def = WILD_PET_DEFS[type];
      const owned = wildPets.find(p => p.type === type);

      if (!owned) {
        return `
          <div class="achievement-tile" style="opacity:0.5;cursor:default">
            <div class="achievement-tile-icon">${def.icon}</div>
            <div class="achievement-tile-name">${def.name}</div>
            <div style="font-size:0.7em;color:var(--muted);margin-top:2px">Noch nicht gefunden</div>
            <div style="font-size:0.65em;color:var(--muted);margin-top:2px;font-style:italic">${def.hint}</div>
          </div>`;
      }

      const maxed = owned.level >= PET_MAX_LEVEL;
      const trainDisabled = maxed || trainedToday;
      const trainLabel = maxed ? 'Maximal vertraut' : trainedToday ? 'Schon genug für heute' : 'Zeit verbringen';
      const trainBtn = skills.petLover
        ? `<button class="action-btn" style="font-size:0.75em;padding:4px 8px;margin-top:4px;${trainDisabled ? 'opacity:0.5;cursor:default' : ''}"
             ${trainDisabled ? 'disabled' : `onclick="trainWildPet('${type}')"`}>${trainLabel}</button>`
        : `<p style="font-size:0.7em;color:var(--muted);margin:4px 0 0">🔓 "Tierfreund" erlernen</p>`;

      return `
        <div class="achievement-tile unlocked" style="cursor:default;padding:10px 8px">
          <div class="achievement-tile-icon">${def.icon}</div>
          <div class="achievement-tile-name">${def.name}</div>
          <div style="font-size:0.7em;color:var(--muted)">Stufe ${owned.level}/${PET_MAX_LEVEL}</div>
          <div style="font-size:0.7em;color:var(--success,#4caf50);margin-top:2px">${def.bonusFn(owned.level)}</div>
          ${trainBtn}
        </div>`;
    }).join('');

    el.innerHTML = `
      <div class="feature-stage">
        <div class="feature-stage-label">Haustiere</div>
        <div class="tab-bar">
          <button class="tab-btn active" onclick="setPetsTab('wildtiere')">Wildtiere</button>
          <button class="tab-btn" onclick="setPetsTab('besonders')">Besonders</button>
        </div>
        <div class="tab-panel">
          ${gameFlags.kapitel2Unlocked && quests.kraemerinBusiness.state === QUEST_STATE.REWARDED
            ? `<div class="achievement-grid">${wildCards}</div>`
            : `<p style="color:var(--muted);font-style:italic;padding:8px 0">Wildtiere können erst nach dem Eintritt in die Gilde und mit Gretas Hilfe gefunden werden.</p>`
          }
        </div>
      </div>`;
    return;
  }

  // ── Besonders-Tab ──────────────────────────────────────────
  const allSpecialIds = Object.keys(PET_DEFS); // streetCat, wolfWelpe
  const specialCards = allSpecialIds.map(id => {
    const def = PET_DEFS[id];
    const pet = pets[id];

    if (!pet) {
      const hint = def.unlockHint || 'Wie man dieses Tier findet, ist noch ein Geheimnis.';
      return `
        <div class="action-card action-card-locked">
          <div class="action-card-icon">❔</div>
          <div class="action-card-name">???</div>
          <p class="action-card-desc">${hint}</p>
        </div>`;
    }

    const maxed = pet.level >= PET_MAX_LEVEL;
    const trainDisabled = maxed || trainedToday;
    const trainLabel = maxed ? 'Maximal vertraut' : trainedToday ? 'Schon genug für heute' : 'Zeit miteinander verbringen';
    const trainBtn = skills.petLover
      ? `<button class="action-btn ${trainDisabled ? 'btn-disabled' : ''}" onclick="trainPet('${id}')" ${trainDisabled ? 'disabled' : ''}>
           ${trainLabel}
         </button>`
      : `<p class="action-card-hint">🔓 "Tierfreund" im Erfahrungsbaum erlernen, um aufzuleveln</p>`;

    return `
      <div class="action-card">
        <div class="action-card-icon">${def.icon}</div>
        <div class="action-card-name">${def.name}</div>
        <p class="action-card-desc">${def.desc}</p>
        <div class="action-card-effect">${def.bonusText(pet.level || 0)}</div>
        ${trainBtn}
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Haustiere</div>
      <div class="tab-bar">
        <button class="tab-btn" onclick="setPetsTab('wildtiere')">Wildtiere</button>
        <button class="tab-btn active" onclick="setPetsTab('besonders')">Besonders</button>
      </div>
      <div class="tab-panel">
        <div class="action-grid">${specialCards}</div>
      </div>
    </div>`;
}
