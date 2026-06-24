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
  updateMusicForContext();
}

/** Heilt Spieler, bei denen Raub-Resets durch einen Bug nicht ausgelöst wurden.
 *  Erkennbar: Anzahl getriggerter Räube > meta.resets (jeder Raub muss einen
 *  Reset hinterlassen haben). Führt die fehlenden Resets mechanisch nach und
 *  zeigt den Story-Dialog des ersten verpassten Raubes (bypass seen-Flag). */
function maybehealRobberyBug() {
  const triggered = [
    gameFlags.robberyTriggered,
    gameFlags.robbery2Triggered,
    gameFlags.robbery3Triggered,
    gameFlags.robbery4Triggered,
  ].filter(Boolean).length;

  const missing = triggered - meta.resets;
  if (missing <= 0) return;

  const doHeal = () => {
    for (let i = 0; i < missing; i++) performManualReset();
    render();

    // Story-Dialog des ersten verpassten Raubes direkt zeigen (umgeht seen-Flag)
    const storyId = ['1.4', '1.5', '1.6', '1.7'][triggered - missing];
    const entry = storyId && STORY_ENTRIES.find(e => e.id === storyId);
    if (entry) {
      showStoryEntryDialog(entry, () => {
        showToast('Fortschritt korrigiert: ein übersprungener Neuanfang wurde nachgeholt.', TOAST.EVENT);
      });
    } else {
      showToast(
        `Fortschritt korrigiert: ${missing} übersprungener Neuanfang wurde nachgeholt.`,
        TOAST.EVENT
      );
    }
  };

  const dialogOpen = !document.getElementById('dialog-overlay').classList.contains('hidden');
  if (dialogOpen) {
    // Changelog oder anderer Dialog offen → nach dessen Schließen ausführen
    window._pendingHealAction = doHeal;
  } else {
    setTimeout(doHeal, 100);
  }
}

function init() {
  loadAudioSettings();
  if (shouldAutoLoad()) loadGame();
  else render();
  applySelectionSetting();
  setupAutoSave();
  setupAutomation();
  catchUpAlchemie();
  startAlchemieTick();
  setupDevKeyListener();
  startVersionCheck();
  setTimeout(maybehealRobberyBug, 200);
  // AutoPlay-Policy: AudioContext erst nach erster User-Interaktion aktivieren
  document.addEventListener('click', () => getAudioCtx(), { once: true });
  setTimeout(() => updateMusicForContext(), 100);

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
