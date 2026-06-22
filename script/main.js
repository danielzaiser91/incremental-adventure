/* ══════════════════════════════════════════════════════════════
   main.js — Initialisierung & zentrale Render-Orchestrierung
   ══════════════════════════════════════════════════════════════ */

'use strict';

/**
 * Zentrale Render-Funktion. Wird nach jeder Aktion aufgerufen.
 * Rekonstruiert das gesamte UI aus storyState + resources + UI-State.
 */
function render() {
  checkEveningArrivals(); // muss vor renderNav() laufen, da diese navUnseen liest
  checkAchievements();    // ebenfalls vor renderNav(), liest/setzt navUnseen.errungenschaften
  renderNav();
  renderContent();
  renderStats();
  renderObjective();
}

function init() {
  if (shouldAutoLoad()) loadGame();
  else render();
  applySelectionSetting();
  setupAutoSave();
  setupAutomation();
  catchUpAlchemie();
  startAlchemieTick();
  setupDevKeyListener();
}

document.addEventListener('DOMContentLoaded', init);

/* ── MOBILE DRAWER STEUERUNG ──────────────────────────────────── */
function toggleMobileNav() {
  const open = document.body.classList.toggle('nav-open');
  document.body.classList.remove('stats-open');
  document.getElementById('mobile-nav-toggle').classList.toggle('active', open);
  document.getElementById('mobile-stats-toggle').classList.remove('active');
}

function toggleMobileStats() {
  const open = document.body.classList.toggle('stats-open');
  document.body.classList.remove('nav-open');
  document.getElementById('mobile-stats-toggle').classList.toggle('active', open);
  document.getElementById('mobile-nav-toggle').classList.remove('active');
}

function closeMobilePanels() {
  document.body.classList.remove('nav-open', 'stats-open');
  document.getElementById('mobile-nav-toggle').classList.remove('active');
  document.getElementById('mobile-stats-toggle').classList.remove('active');
}
