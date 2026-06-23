/* ══════════════════════════════════════════════════════════════
   main.js — Initialisierung & zentrale Render-Orchestrierung
   ══════════════════════════════════════════════════════════════ */

'use strict';

/**
 * Zentrale Render-Funktion. Wird nach jeder Aktion aufgerufen.
 * Rekonstruiert das gesamte UI aus storyState + resources + UI-State.
 */
function render() {
  checkAchievements();    // vor renderNav(), liest/setzt navUnseen.errungenschaften
  renderNav();
  renderContent();
  renderStats();
  renderObjective();
}

/** Heilt Spieler, bei denen Raub-Resets durch einen Bug nicht ausgelöst wurden.
 *  Erkennbar: Anzahl getriggerter Räube > meta.resets (jeder Raub muss einen
 *  Reset hinterlassen haben). Führt die fehlenden Resets nach und zeigt einen
 *  erklärenden Toast. */
function maybehealRobberyBug() {
  const triggered = [
    gameFlags.robberyTriggered,
    gameFlags.robbery2Triggered,
    gameFlags.robbery3Triggered,
    gameFlags.robbery4Triggered,
  ].filter(Boolean).length;

  const missing = triggered - meta.resets;
  if (missing <= 0) return;

  for (let i = 0; i < missing; i++) performManualReset();
  showToast(
    `Spielstand-Fix: ${missing} übersprungene${missing > 1 ? ' Raub-Resets wurden' : 'r Raub-Reset wurde'} durch einen behobenen Bug nachgeholt.`,
    TOAST.EVENT
  );
  render();
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
  startVersionCheck();
  // Muss nach loadGame() + startVersionCheck() laufen (justUpdated-Check folgt danach)
  setTimeout(maybehealRobberyBug, 800);

  const justUpdated = sessionStorage.getItem('justUpdated');
  if (justUpdated) {
    sessionStorage.removeItem('justUpdated');
    const dialogOpen = !document.getElementById('dialog-overlay').classList.contains('hidden');
    if (dialogOpen) {
      window._pendingVersionUpdate = justUpdated;
    } else {
      showVersionUpdateDialog(justUpdated);
    }
  }
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
