/* ══════════════════════════════════════════════════════════════
   stats.js — Rechte Spalte: Charakter-Stats
   ══════════════════════════════════════════════════════════════ */

'use strict';

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

  el.innerHTML = `
    <div class="stat-group">
      <div class="stat-section-label">Ressourcen</div>
      <div class="stat-row">
        <span class="stat-label">Gold</span>
        <span class="stat-value gold-value">
          ${resources.gold}<span class="gold-icon">◈</span>
        </span>
      </div>
    </div>

    <div class="stat-divider"></div>

    <div class="stat-group">
      <div class="stat-section-label">Bedürfnisse</div>
      <div class="stat-row">
        <span class="stat-label">Hunger</span>
        <span class="stat-value ${needsSeverityClass(needs.hunger)}">${needs.hunger}%</span>
      </div>
      ${hungerWarning}
      <div class="stat-row">
        <span class="stat-label">Müdigkeit</span>
        <span class="stat-value ${needsSeverityClass(needs.tiredness)}">${needs.tiredness}%</span>
      </div>
      ${tirednessWarning}
    </div>

    ${gameFlags.resetLayerUnlocked ? `
      <div class="stat-divider"></div>
      <div class="stat-group">
        <div class="stat-section-label">Erfahrung</div>
        <div class="stat-row">
          <span class="stat-label">EP</span>
          <span class="stat-value gold-value">${experience.points}</span>
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
}
