/* ══════════════════════════════════════════════════════════════
   main.js — Initialisierung & zentrale Render-Orchestrierung
   ══════════════════════════════════════════════════════════════ */

'use strict';

/**
 * Zentrale Render-Funktion. Wird nach jeder Aktion aufgerufen.
 * Rekonstruiert das gesamte UI aus storyState + resources + UI-State.
 */
function render() {
  renderNav();
  renderContent();
  renderStats();
  renderObjective();
}

function init() {
  render();
}

document.addEventListener('DOMContentLoaded', init);
