/* ══════════════════════════════════════════════════════════════
   stats.js — Rechte Spalte: Charakter-Stats
   ══════════════════════════════════════════════════════════════ */

'use strict';

let _prevGold = null;
let _prevEP   = null;

function spawnStatFloat(anchorId, text) {
  const panel     = document.getElementById('stats-panel');
  const anchor    = document.getElementById(anchorId);
  const container = document.getElementById('stat-floats');
  if (!panel || !anchor || !container) return;
  const pRect = panel.getBoundingClientRect();
  const aRect = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className  = 'stat-float';
  el.textContent = text;
  el.style.top   = (aRect.top - pRect.top) + 'px';
  el.style.right = (pRect.right - aRect.right) + 'px';
  container.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function renderStats() {
  const el = document.getElementById('stats-content');
  if (!el) return;

  const hungerTier = getHungerTier(needs.hunger);
  const hungerWarning = hungerTier.id !== 'satt'
    ? `<div class="needs-note">⚠ ${hungerTier.label}: -${Math.round((1 - hungerTier.rewardMult) * 100)}% Ertrag, +${Math.round((hungerTier.tirednessGainMult - 1) * 100)}% Müdigkeitsaufbau</div>`
    : '';

  const tier = getTirednessTier(needs.tiredness);
  const tirednessWarning = tier.id !== 'frisch'
    ? `<div class="needs-note">⚠ ${tier.label}: ${Math.round((tier.durationMult - 1) * 100)}% längere Arbeit</div>`
    : '';

  // Stärke-Stufe (0–3) bestimmt sowohl die Farbabstufung (je höher, je
  // dunkler/dringlicher) als auch die "X/3"-Kennzahl daneben — der reine
  // Prozentwert allein sagt nicht, WIE schwer der aktuelle Debuff wiegt.
  const hungerStep    = getHungerTierIndex(needs.hunger);
  const tirednessStep = getTirednessTierIndex(needs.tiredness);
  const stepBadge = (step) => step > 0
    ? `<span class="needs-step-badge">${step}/${NEEDS_TIER_MAX}</span>` : '';

  const prevGold = _prevGold;
  const prevEP   = _prevEP;
  _prevGold = resources.gold;
  _prevEP   = experience.points;

  el.innerHTML = `
    <div class="stat-group">
      <div class="stat-section-label">Ressourcen</div>
      <div class="stat-row">
        <span class="stat-label">Gold</span>
        <span class="stat-value gold-value" id="stat-gold-val">
          ${resources.gold}<span class="gold-icon">◈</span>
        </span>
      </div>
    </div>

    <div class="stat-divider"></div>

    <div class="stat-group">
      <div class="stat-section-label">Bedürfnisse</div>
      <div class="stat-row">
        <span class="stat-label">Hunger</span>
        <span class="stat-value needs-tier-${hungerStep}">${Math.round(needs.hunger)}% ${stepBadge(hungerStep)}</span>
      </div>
      ${hungerWarning}
      <div class="stat-row">
        <span class="stat-label">Müdigkeit</span>
        <span class="stat-value needs-tier-${tirednessStep}">${Math.round(needs.tiredness)}% ${stepBadge(tirednessStep)}</span>
      </div>
      ${tirednessWarning}
    </div>

    ${gameFlags.resetLayerUnlocked ? `
      <div class="stat-divider"></div>
      <div class="stat-group">
        <div class="stat-section-label">Erfahrung</div>
        <div class="stat-row">
          <span class="stat-label">EP</span>
          <span class="stat-value gold-value" id="stat-ep-val">${experience.points}</span>
        </div>
        ${meta.resets > 0 ? `
          <div class="stat-row">
            <span class="stat-label">Neuanfänge</span>
            <span class="stat-value">${meta.resets}</span>
          </div>
        ` : ''}
      </div>
    ` : ''}
  `;

  if (prevGold !== null && resources.gold > prevGold)
    spawnStatFloat('stat-gold-val', `+${resources.gold - prevGold}◈`);
  if (prevEP !== null && gameFlags.resetLayerUnlocked && experience.points > prevEP)
    spawnStatFloat('stat-ep-val', `+${experience.points - prevEP} ✦`);
}
