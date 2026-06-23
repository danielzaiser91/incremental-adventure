/* ══════════════════════════════════════════════════════════════
   pets.js — Haustiere
   Zwei Kategorien:
   - Besonders: geheime Straßenkatze (Schlafbonus)
   - Wildtiere: gefangen im Jagdgebiet nach Greta-Quest
     (Hund/Rabe/Hase/Eichhörnchen, je eigener Bonus)
   ══════════════════════════════════════════════════════════════ */

'use strict';

const PET_MAX_LEVEL = 3;

const PET_DEFS = {
  streetCat: {
    name: 'Straßenkatze', icon: '🐈', special: true,
    desc: 'Sie ist mir zugelaufen, in einer kalten Nacht, in der ich sie nicht erwartet hatte.',
    bonusText: level => `+${1 + level} Schlafqualitäts-Stufe${level ? ` (Stufe ${level}/${PET_MAX_LEVEL} verstärkt)` : ''}`
  }
};

const WILD_PET_DEFS = {
  hund:          { name: 'Hund',          icon: '🐕', bonusLabel: 'Kampfschaden', bonusFn: lvl => `+${5 * lvl} % Angriffsstärke` },
  rabe:          { name: 'Rabe',          icon: '🐦', bonusLabel: 'EP-Bonus',    bonusFn: lvl => `+${15 * lvl} % EP pro Neuanfang` },
  hase:          { name: 'Hase',          icon: '🐇', bonusLabel: 'Hunger',       bonusFn: lvl => `Hunger steigt ${10 * lvl} % langsamer` },
  eichhoernchen: { name: 'Eichhörnchen', icon: '🐿', bonusLabel: 'Rohstoffe',   bonusFn: lvl => `+${lvl} Rohstoff pro Sammelaktion` }
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
  showToast(`${PET_DEFS[petId].name} ist jetzt enger mit dir vertraut (Stufe ${pet.level}/${PET_MAX_LEVEL}).`, TOAST.EVENT);
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
  showToast(`${def.name} vertraut dir mehr (Stufe ${pet.level}/${PET_MAX_LEVEL}). ${def.bonusFn(pet.level)}`, TOAST.EVENT);
  render();
}

/* ── Haustiere-Seite ──────────────────────────────────────── */
function renderPets(el) {
  const ownedSpecial = Object.entries(pets).filter(([id]) => PET_DEFS[id]?.special);
  const trainedToday = !!dailyPurchases.petTrainToday;

  const specialCards = ownedSpecial.map(([id, pet]) => {
    const def = PET_DEFS[id];
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

  const wildCards = wildPets.map(p => {
    const def = WILD_PET_DEFS[p.type];
    if (!def) return '';
    const maxed = p.level >= PET_MAX_LEVEL;
    const trainDisabled = maxed || trainedToday;
    const trainLabel = maxed ? 'Maximal vertraut' : trainedToday ? 'Schon genug für heute' : 'Zeit miteinander verbringen';
    const trainBtn = skills.petLover
      ? `<button class="action-btn ${trainDisabled ? 'btn-disabled' : ''}" onclick="trainWildPet('${p.type}')" ${trainDisabled ? 'disabled' : ''}>
           ${trainLabel}
         </button>`
      : `<p class="action-card-hint">🔓 "Tierfreund" im Erfahrungsbaum erlernen, um aufzuleveln</p>`;
    return `
      <div class="action-card">
        <div class="action-card-icon">${def.icon}</div>
        <div class="action-card-name">${def.name} <span style="font-size:0.8em;color:var(--muted)">Stufe ${p.level}/${PET_MAX_LEVEL}</span></div>
        <div class="action-card-effect">${def.bonusFn(p.level)}</div>
        ${trainBtn}
      </div>`;
  }).join('');

  const wildSection = wildPets.length > 0
    ? `<div class="market-section-label">Wildtiere</div><div class="action-grid">${wildCards}</div>`
    : gameFlags.kapitel2Unlocked && quests.kraemerinBusiness.state === QUEST_STATE.REWARDED
      ? `<div class="market-section-label">Wildtiere</div>
         <p style="color:var(--muted);font-style:italic;padding:8px 0">Noch keine Wildtiere gefangen. Seltene Drops aus dem Jagdgebiet — sprich mit Greta, wenn du etwas findest.</p>`
      : '';

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Haustiere</div>
      ${ownedSpecial.length > 0 ? `<div class="market-section-label">Besonders</div><div class="action-grid">${specialCards}</div>` : ''}
      ${wildSection}
    </div>
  `;
}
