/* ══════════════════════════════════════════════════════════════
   save.js — Spielstand speichern / laden / zurücksetzen
   Zukunftssicherheit: jedes Feld wird beim Laden mit Default-Werten
   gemerged (`{ ...defaults, ...save.feld }`), damit ein Spielstand aus
   einer älteren Version auch dann lädt, wenn neue Felder dazugekommen
   sind. Reicht das nicht (grundlegend andere Form, korruptes JSON),
   greift die Validierung in applySaveData() + der Try/Catch in
   loadGame() und zeigt einen Inkompatibilitäts-Dialog statt einfach
   abzustürzen oder einen halb kaputten Zustand zu laden.
   ══════════════════════════════════════════════════════════════ */

'use strict';

let autoSaveTimerId = null;

/** Speichert den aktuellen Spielstand in localStorage.
    @param {{silent?: boolean}} [opts] - `silent`: kein Erfolgs-Toast
    (für automatisches Speichern im Hintergrund). */
function saveGame(opts = {}) {
  try {
    const save = {
      version:      CURRENT_SAVE_VERSION,
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
      dialogHistory,
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

    if (opts.silent) {
      showToast('💾 Automatisch gespeichert', 'info');
    } else {
      showToast(`💾 Spielstand gespeichert (${new Date().toLocaleTimeString('de-DE')})`, 'info');
    }
    render(); // Einstellungen-Ansicht aktualisieren (Laden-Button aktivieren)

  } catch (e) {
    showToast('⚠ Speichern fehlgeschlagen: ' + e.message, 'error');
  }
}

/** Übernimmt ein geparstes Spielstand-Objekt in den globalen State. Wirft
    bei grundlegend unbrauchbarer Form (kein Objekt, fehlende Kernfelder),
    damit loadGame() das als Inkompatibilität behandeln kann — alles
    DARÜBER hinaus Fehlende wird einfach mit Default-Werten aufgefüllt. */
function applySaveData(save) {
  if (!save || typeof save !== 'object' ||
      typeof save.storyState !== 'number' ||
      typeof save.resources !== 'object' || save.resources === null) {
    throw new Error('Unbekanntes oder unvollständiges Speicherformat');
  }

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
  settings       = {
    toastDurationMs: 2600,
    autoLoad: true,
    ...save.settings,
    warnBeforeReset: { erfahrung: true, ...save.settings?.warnBeforeReset },
    autoSave: { enabled: true, intervalMinutes: 5, ...save.settings?.autoSave }
  };
  toastHistory   = save.toastHistory ?? [];
  dialogHistory  = save.dialogHistory ?? [];
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
}

/** Lädt einen gespeicherten Spielstand aus localStorage. Bei Erfolg ganz
    normal; ist der Spielstand nicht mehr lesbar (korruptes JSON oder eine
    Form, die applySaveData() nicht zuordnen kann), erscheint ein Dialog
    statt eines stillen Fehlers, mit der Option, ganz neu anzufangen. */
function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    showToast('Kein Spielstand gefunden.', 'error');
    return;
  }

  try {
    const save = JSON.parse(raw);
    applySaveData(save);

    const dateStr = new Date(save.savedAt).toLocaleString('de-DE');
    showToast(`📂 Spielstand geladen (gespeichert: ${dateStr})`, 'info');
    render();

  } catch (e) {
    showIncompatibleSaveDialog();
    render(); // Hintergrund-UI trotzdem mit dem aktuellen (Default-)Zustand zeichnen
  }
}

/** Zeigt einen Dialog, dass der gespeicherte Spielstand nicht geladen
    werden konnte, mit der Möglichkeit, direkt neu anzufangen. */
function showIncompatibleSaveDialog() {
  showDialog({
    title: 'Inkompatibler Spielstand',
    text: [
      'Dieser Spielstand passt nicht zur aktuellen Version des Spiels und konnte nicht geladen werden.',
      'Du kannst mit deinem aktuellen Fortschritt weiterspielen oder ganz neu beginnen.'
    ],
    buttons: [
      { label: 'Weiterspielen', onClick: () => closeDialog() },
      { label: 'Neu anfangen', onClick: () => closeDialog(performHardReset) }
    ]
  });
}

/** Kopiert den aktuell gespeicherten Spielstand als JSON in die
    Zwischenablage — exportiert bewusst das, was zuletzt GESPEICHERT
    wurde (`localStorage`), nicht den gerade laufenden Zustand, damit
    Export/Import exakt denselben Weg wie Speichern/Laden nehmen. */
async function exportSaveToClipboard() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    showToast('Kein Spielstand zum Exportieren vorhanden — erst speichern.', 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(raw);
    showToast('📋 Spielstand in die Zwischenablage kopiert.', 'info');
  } catch (e) {
    showToast('⚠ Export fehlgeschlagen — Zwischenablage nicht verfügbar.', 'error');
  }
}

/** Liest einen Spielstand aus der Zwischenablage und lädt ihn — nutzt
    dieselbe Validierung/Inkompatibilitäts-Behandlung wie loadGame(),
    indem der Text einfach an dieselbe Stelle in localStorage geschrieben
    und dann ganz normal geladen wird. */
async function importSaveFromClipboard() {
  let text;
  try {
    text = await navigator.clipboard.readText();
  } catch (e) {
    showToast('⚠ Import fehlgeschlagen — Zwischenablage nicht verfügbar.', 'error');
    return;
  }
  if (!text || !text.trim()) {
    showToast('Zwischenablage ist leer.', 'error');
    return;
  }

  localStorage.setItem(SAVE_KEY, text);
  loadGame();
}

/** Prüft beim Programmstart, ob automatisch geladen werden soll — liest
    dafür NUR die Einstellung direkt aus dem rohen JSON, ohne den
    Spielstand schon anzuwenden (sonst müsste man erst laden, um zu
    wissen, ob man laden soll). Bei korruptem JSON dennoch `true`, damit
    loadGame() den Inkompatibilitäts-Dialog zeigen kann, statt das
    Problem einfach zu verschweigen. */
function shouldAutoLoad() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.settings?.autoLoad !== false;
  } catch (e) {
    return true;
  }
}

/** Richtet den automatischen Speicher-Timer neu ein (z.B. nach einer
    Einstellungsänderung) — vorherigen Timer immer erst stoppen, sonst
    würden sich mehrere Intervalle überlagern. */
function setupAutoSave() {
  if (autoSaveTimerId) { clearInterval(autoSaveTimerId); autoSaveTimerId = null; }
  if (!settings.autoSave.enabled) return;
  autoSaveTimerId = setInterval(() => saveGame({ silent: true }), settings.autoSave.intervalMinutes * 60 * 1000);
}

function setAutoSaveEnabled(enabled) {
  settings.autoSave.enabled = enabled;
  setupAutoSave();
  render();
}

function setAutoSaveInterval(minutes) {
  settings.autoSave.intervalMinutes = minutes;
  setupAutoSave();
  render();
}

function setAutoLoad(enabled) {
  settings.autoLoad = enabled;
  render();
}

/** Setzt das Spiel vollständig zurück (nach Bestätigung). */
function resetGame() {
  if (!confirm(
    'Spielstand wirklich zurücksetzen?\n' +
    'Alle Fortschritte gehen unwiederbringlich verloren.'
  )) return;

  performHardReset();
}

/** Der eigentliche Reset-Vorgang, OHNE Bestätigungsabfrage — wird sowohl
    von resetGame() (nach `confirm()`) als auch vom Inkompatibilitäts-
    Dialog aufgerufen (dort hat der Spieler bereits über unseren eigenen
    Dialog bestätigt, ein zweites natives `confirm()` wäre redundant). */
function performHardReset() {
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
  settings       = {
    toastDurationMs: 2600, warnBeforeReset: { erfahrung: true },
    autoSave: { enabled: true, intervalMinutes: 5 }, autoLoad: true
  };
  toastHistory   = [];
  dialogHistory  = [];
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
  setupAutoSave();

  showToast('Spielstand zurückgesetzt. Eine neue Geschichte beginnt…', 'info');
  render();
}
