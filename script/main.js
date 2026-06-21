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
  setupAutoSave();
  setupAutomation();
}

document.addEventListener('DOMContentLoaded', init);
