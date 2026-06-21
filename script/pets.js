/* ══════════════════════════════════════════════════════════════
   pets.js — Haustiere
   Aktuell ein einziges, besonderes (geheim freigeschaltetes) Haustier:
   die Straßenkatze (siehe actions.js, Begegnungskette beim Schlafen auf
   der Straße). Eigene Kategorie "Besonders" pro Vorgabe — weitere,
   regulär gekaufte/gefundene Haustiere kämen später in eine eigene,
   ANDERE Kategorie auf dieser Seite.
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

/** Sammelbonus aller Haustiere auf die Schlafqualität (siehe actions.js,
    getSleepQualityTier()) — aktuell nur die Straßenkatze, aber als Summe
    über `pets` geschrieben, damit weitere Haustiere später einfach
    mitzählen, ohne diese Stelle ändern zu müssen. */
function getPetSleepBonus() {
  return Object.entries(pets).reduce((sum, [id, pet]) => {
    const def = PET_DEFS[id];
    if (!def) return sum;
    return sum + 1 + (pet.level || 0);
  }, 0);
}

/** Lässt ein Haustier eine Stufe aufsteigen (max. PET_MAX_LEVEL) — nur
    möglich, sobald der Skill "Tierfreund" erlernt wurde (experience.js).
    Bewusst ohne Kosten/Abklingzeit: das Aufleveln selbst ist die
    Belohnung für den bereits investierten Begegnungs-Aufwand, kein
    weiterer Grind-Schritt. */
function trainPet(petId) {
  if (!skills.petLover) return;
  const pet = pets[petId];
  if (!pet || pet.level >= PET_MAX_LEVEL) return;

  pet.level += 1;
  showToast(`${PET_DEFS[petId].name} ist jetzt enger mit dir vertraut (Stufe ${pet.level}/${PET_MAX_LEVEL}).`, 'event');
  render();
}

/* ── Haustiere-Seite ──────────────────────────────────────── */
function renderPets(el) {
  const ownedSpecial = Object.entries(pets).filter(([id]) => PET_DEFS[id]?.special);

  const cards = ownedSpecial.map(([id, pet]) => {
    const def = PET_DEFS[id];
    const maxed = pet.level >= PET_MAX_LEVEL;
    const trainBtn = skills.petLover
      ? `<button class="action-btn ${maxed ? 'btn-disabled' : ''}" onclick="trainPet('${id}')" ${maxed ? 'disabled' : ''}>
           ${maxed ? 'Maximal vertraut' : 'Zeit miteinander verbringen'}
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
      <div class="market-section-label">Besonders</div>
      <div class="action-grid">${cards}</div>
    </div>
  `;
}
