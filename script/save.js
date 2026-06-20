/* ══════════════════════════════════════════════════════════════
   save.js — Spielstand speichern / laden / zurücksetzen
   ══════════════════════════════════════════════════════════════ */

'use strict';

/** Speichert den aktuellen Spielstand in localStorage. */
function saveGame() {
  try {
    const save = {
      version:      3,
      storyState,
      resources,
      meta,
      equipment,
      experience,
      skills,
      needs,
      gameClock,
      nightFlags,
      quests,
      npcFlags,
      workStats,
      nightWatchStats,
      settings,
      toastHistory,
      navUnseen,
      dailyPurchases,
      overflowBag,
      questItems,
      gameFlags:      { ...gameFlags, isWorking: false }, // Laufende Arbeit nicht speichern
      shownDialogs,
      navLevel,
      currentContent: currentContent === 'settings' ? 'geschichte' : currentContent,
      savedAt:        Date.now()
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(save));

    showToast(`💾 Spielstand gespeichert (${new Date().toLocaleTimeString('de-DE')})`, 'info');
    render(); // Einstellungen-Ansicht aktualisieren (Laden-Button aktivieren)

  } catch (e) {
    showToast('⚠ Speichern fehlgeschlagen: ' + e.message, 'error');
  }
}

/** Lädt einen gespeicherten Spielstand aus localStorage. */
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      showToast('Kein Spielstand gefunden.', 'error');
      return;
    }

    const save = JSON.parse(raw);

    storyState     = save.storyState;
    resources      = { gold: 0, totalGoldEarned: 0, inventory: {}, totalResourcesSold: 0, ...save.resources };
    meta           = { resets: 0, fasterWorkUnlocked: false, ...save.meta };
    equipment      = { hands: null, guertel: null, ...save.equipment };
    experience     = { points: 0, totalEarned: 0, ...save.experience };
    skills         = {
      jobLeveling: false, fieldworkMemory: false, ironWill: false, nightWatchLeveling: false,
      thrift: 0, clearMind: false, goldBreakthrough: false, guildPrep: false,
      inventoryKeeper: false, sleepLikeARock: false, ...save.skills
    };
    needs          = { hunger: 15, tiredness: 0, ...save.needs };
    gameClock      = { day: 1, hour: 7, minute: 0, ...save.gameClock };
    nightFlags     = { nightActivityUsedToday: false, recoveryDebuff: false, ...save.nightFlags };
    quests         = {
      nightWatch: { state: 'unstarted' }, miraLetter: { state: 'unstarted' }, foremanRaise: { state: 'unstarted' },
      kraemerinBusiness: { state: 'unstarted' }, guildRegistration: { state: 'unstarted' },
      commanderTraining: { state: 'unstarted' },
      ...save.quests
    };
    npcFlags       = { miraDrinkGiven: false, ...save.npcFlags };
    workStats      = { count: 0, ...save.workStats };
    nightWatchStats = { count: 0, ...save.nightWatchStats };
    settings       = { toastDurationMs: 2600, warnBeforeReset: { erfahrung: true }, ...save.settings,
      warnBeforeReset: { erfahrung: true, ...save.settings?.warnBeforeReset } };
    toastHistory   = save.toastHistory ?? [];
    navUnseen      = {
      arbeitsplatz: true, marktplatz: true, schlafplatz: true,
      quests: true, inventar: true, erfahrung: true, taverne: false, rohstoffe: true,
      ...save.navUnseen
    };
    dailyPurchases = save.dailyPurchases ?? {};
    overflowBag    = save.overflowBag ?? {};
    questItems     = save.questItems ?? {};
    gameFlags      = {
      milestoneStrangerTriggered: false, robberyTriggered: false, firstSleepTriggered: false,
      jobSearchDialogShown: false, tavernVisited: false, jobUnlocked: false,
      firstWorkDialogShown: false, firstLevelUpDialogShown: false,
      firstNightDialogShown: false, hungerDialogShown: false, everOwnedItem: false,
      resetLayerUnlocked: false, firstManualResetExplained: false, breadLimitDialogShown: false,
      foremanInviteShown: false, foremanBonusGiven: false, mustEatBread: false, workBlockedDialogShown: false,
      kraemerinDialogShown: false, resourceGatheringUnlocked: false, guildExplainedByBrakka: false,
      commanderInviteShown: false, firstNightWatchLevelUpShown: false, commanderRecruitmentShown: false,
      ...save.gameFlags, isWorking: false
    };
    shownDialogs   = save.shownDialogs ?? [];
    navLevel       = save.navLevel       ?? 0;
    currentContent = save.currentContent ?? 'geschichte';
    marketVendor   = null;
    workProgress   = 0;

    const dateStr = new Date(save.savedAt).toLocaleString('de-DE');
    showToast(`📂 Spielstand geladen (gespeichert: ${dateStr})`, 'info');
    render();

  } catch (e) {
    showToast('⚠ Laden fehlgeschlagen: ' + e.message, 'error');
  }
}

/** Setzt das Spiel vollständig zurück (nach Bestätigung). */
function resetGame() {
  if (!confirm(
    'Spielstand wirklich zurücksetzen?\n' +
    'Alle Fortschritte gehen unwiederbringlich verloren.'
  )) return;

  if (workRafId) { cancelAnimationFrame(workRafId); workRafId = null; }

  storyState     = 10100;
  resources      = { gold: 0, totalGoldEarned: 0, inventory: {}, totalResourcesSold: 0 };
  meta           = { resets: 0, fasterWorkUnlocked: false };
  equipment      = { hands: null, guertel: null };
  experience     = { points: 0, totalEarned: 0 };
  skills         = {
    jobLeveling: false, fieldworkMemory: false, ironWill: false, nightWatchLeveling: false,
    thrift: 0, clearMind: false, goldBreakthrough: false, guildPrep: false,
    inventoryKeeper: false, sleepLikeARock: false
  };
  needs          = { hunger: 15, tiredness: 0 };
  gameClock      = { day: 1, hour: 7, minute: 0 };
  nightFlags     = { nightActivityUsedToday: false, recoveryDebuff: false };
  quests         = {
    nightWatch: { state: 'unstarted' }, miraLetter: { state: 'unstarted' }, foremanRaise: { state: 'unstarted' },
    kraemerinBusiness: { state: 'unstarted' }, guildRegistration: { state: 'unstarted' },
    commanderTraining: { state: 'unstarted' }
  };
  npcFlags       = { miraDrinkGiven: false };
  workStats      = { count: 0 };
  nightWatchStats = { count: 0 };
  settings       = { toastDurationMs: 2600, warnBeforeReset: { erfahrung: true } };
  toastHistory   = [];
  navUnseen      = {
    arbeitsplatz: true, marktplatz: true, schlafplatz: true,
    quests: true, inventar: true, erfahrung: true, taverne: false, rohstoffe: true
  };
  dailyPurchases = {};
  overflowBag    = {};
  questItems     = {};
  gameFlags      = {
    milestoneStrangerTriggered: false, robberyTriggered: false, firstSleepTriggered: false,
    jobSearchDialogShown: false, tavernVisited: false, jobUnlocked: false,
    firstWorkDialogShown: false, firstLevelUpDialogShown: false,
    firstNightDialogShown: false, hungerDialogShown: false, everOwnedItem: false,
    resetLayerUnlocked: false, firstManualResetExplained: false, breadLimitDialogShown: false,
    foremanInviteShown: false, foremanBonusGiven: false, mustEatBread: false, workBlockedDialogShown: false,
    kraemerinDialogShown: false, resourceGatheringUnlocked: false, guildExplainedByBrakka: false,
    commanderInviteShown: false, firstNightWatchLevelUpShown: false, commanderRecruitmentShown: false,
    isWorking: false
  };
  shownDialogs   = [];
  navLevel       = 0;
  currentContent = 'geschichte';
  marketVendor   = null;
  workProgress   = 0;

  localStorage.removeItem(SAVE_KEY);

  showToast('Spielstand zurückgesetzt. Eine neue Geschichte beginnt…', 'info');
  render();
}
