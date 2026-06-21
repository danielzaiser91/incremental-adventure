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
      achievements,
      achievementTab,
      pets,
      streetCatProgress,
      superSkills,
      settings,
      toastHistory,
      dialogHistory,
      navUnseen,
      dailyPurchases,
      overflowBag,
      questItems,
      gameFlags:      { ...gameFlags, isWorking: false }, // Laufende Arbeit nicht speichern
      shownDialogs,
      chronikButtonUnseen,
      chronikUnseenEntryIds,
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
    jobLeveling: false, fieldworkMemory: false, ironWill: false, fieldPay: false, nightWatchLeveling: false,
    thrift: 0, quickLearner: 0, clearMind: false, goldBreakthrough: false, guildPrep: false,
    inventoryKeeper: false, sleepLikeARock: false, petLover: false, jobXpBonus: false, ...save.skills
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
  achievements   = save.achievements ?? {};
  achievementTab = save.achievementTab ?? 'normal';
  pets           = save.pets ?? {};
  streetCatProgress = { sleepCount: 0, encounters: 0, ...save.streetCatProgress };
  superSkills    = save.superSkills ?? {};
  settings       = {
    toastDurationMs: 2600,
    autoLoad: true,
    showResetAnimation: true,
    ...save.settings,
    warnBeforeReset: { erfahrung: true, ...save.settings?.warnBeforeReset },
    autoSave: { enabled: true, intervalMinutes: 5, ...save.settings?.autoSave }
  };
  toastHistory   = save.toastHistory ?? [];
  dialogHistory  = save.dialogHistory ?? [];
  navUnseen      = {
    arbeitsplatz: true, marktplatz: true, schlafplatz: true,
    quests: true, inventar: true, erfahrung: true, taverne: false, rohstoffe: true,
    errungenschaften: true, pets: true, lehrer: false,
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
    resetAnimationSeen: false,
    ...save.gameFlags, isWorking: false
  };
  shownDialogs   = save.shownDialogs ?? [];
  chronikButtonUnseen   = save.chronikButtonUnseen ?? false;
  chronikUnseenEntryIds = save.chronikUnseenEntryIds ?? [];
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
    const loadedVersion = typeof save.version === 'number' ? save.version : 0;
    applySaveData(save);

    const dateStr = new Date(save.savedAt).toLocaleString('de-DE');
    showToast(`📂 Spielstand geladen (gespeichert: ${dateStr})`, 'info');
    render();

    if (loadedVersion < CURRENT_SAVE_VERSION) showSaveChangelogDialog(loadedVersion);

  } catch (e) {
    showIncompatibleSaveDialog();
    render(); // Hintergrund-UI trotzdem mit dem aktuellen (Default-)Zustand zeichnen
  }
}

/* Reihenfolge, in der Kategorien im Changelog-Dialog erscheinen — neue
   Kategorien in SAVE_CHANGELOG-Einträgen tauchen automatisch HINTER
   diesen dreien auf (kein Eintrag geht verloren, nur die Sortierung
   wird dann beliebig). */
const SAVE_CHANGELOG_CATEGORY_ORDER = ['Neuerung', 'Änderung', 'Bugfix'];

/** Baut die HTML-Zeile eines einzelnen Changelog-Punkts. Spoiler-Einträge
    (Inhalt, den der Spieler laut `entry.spoiler()` noch nicht erreicht
    hat) werden verschwommen mit einer Spoiler-Markierung dargestellt —
    ein Klick deckt sie auf (`revealed`-Klasse, siehe style.css). Jeder
    Eintrag bekommt zusätzlich ein kleines, gestrichelt umrahmtes
    Versions-Badge (eigenes `title`-Tooltip) als Hinweis, dass sich genau
    dieser Punkt hovern lässt, um zu sehen, aus welcher Version er stammt —
    unabhängig vom Spoiler-Klick, der den TEXT selbst betrifft. */
function changelogEntryHtml(entry) {
  const versionTag = `<span class="changelog-version-tag" title="Aus Version ${entry._version}">v${entry._version}</span>`;
  const isSpoiler = typeof entry.spoiler === 'function' && entry.spoiler();
  if (!isSpoiler) return `<li class="changelog-entry">${entry.text}${versionTag}</li>`;

  return `
    <li class="changelog-entry changelog-spoiler" onclick="this.classList.toggle('revealed')" title="Spoiler — zum Anzeigen klicken">
      <span class="changelog-spoiler-tag">Spoiler</span><span class="changelog-spoiler-text">${entry.text}</span>${versionTag}
    </li>`;
}

/** Zeigt einmalig (direkt nach dem Laden) eine kurze, nach Kategorie
    gruppierte Zusammenfassung dessen, was sich seit der im Spielstand
    vermerkten Version geändert hat. Der Titel "Spielstand aktualisiert"
    wäre an dieser Stelle falsch — aktualisiert ist er erst, NACHDEM der
    Spieler den Button gedrückt hat (siehe unten, saveGame()-Aufruf). */
function showSaveChangelogDialog(loadedVersion) {
  const versions = Object.keys(SAVE_CHANGELOG)
    .map(Number)
    .filter(v => v > loadedVersion && v <= CURRENT_SAVE_VERSION)
    .sort((a, b) => a - b);
  if (versions.length === 0) return;

  const allEntries = versions.flatMap(v => SAVE_CHANGELOG[v].map(e => ({ ...e, _version: v })));
  const categories = [...new Set([
    ...SAVE_CHANGELOG_CATEGORY_ORDER,
    ...allEntries.map(e => e.cat)
  ])];

  const sectionsHtml = categories
    .map(cat => ({ cat, entries: allEntries.filter(e => e.cat === cat) }))
    .filter(group => group.entries.length > 0)
    .map(group => `
      <div class="changelog-category">${group.cat}</div>
      <ul class="changelog-list">${group.entries.map(changelogEntryHtml).join('')}</ul>
    `).join('');

  showDialog({
    title: `Changelog von Version ${loadedVersion} zu Version ${CURRENT_SAVE_VERSION}`,
    html: sectionsHtml,
    text: allEntries.map(e => e.text), // fürs dialogHistory-Log (siehe dialog.js)
    buttons: [{
      label: 'Spielstand aktualisieren und weiterspielen',
      // Schreibt JETZT explizit die aktuelle Versionsnummer fest, statt
      // erst beim nächsten ohnehin fälligen Speichervorgang — der
      // Dialog-Titel verspricht "aktualisieren", also muss der Klick das
      // auch sofort einlösen.
      onClick: () => closeDialog(() => saveGame())
    }],
    boxClass: 'dialog-box-large'
  });
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
  autoSaveTimerId = setInterval(() => {
    // Während ein Dialog/Overlay offen ist (z.B. der Changelog-Hinweis beim
    // Laden), nicht automatisch speichern — sonst würde mitten in einer
    // Ich-Monolog-Seite oder einem noch unbestätigten Hinweis gespeichert.
    if (document.body.classList.contains('dialog-open')) return;
    saveGame({ silent: true });
  }, settings.autoSave.intervalMinutes * 60 * 1000);
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
    jobLeveling: false, fieldworkMemory: false, ironWill: false, fieldPay: false, nightWatchLeveling: false,
    thrift: 0, jobXpBonus: false, quickLearner: 0, clearMind: false, goldBreakthrough: false, guildPrep: false,
    inventoryKeeper: false, sleepLikeARock: false, petLover: false
  };
  superSkills    = {};
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
  achievements   = {};
  achievementTab = 'normal';
  pets           = {};
  streetCatProgress = { sleepCount: 0, encounters: 0 };
  settings       = {
    toastDurationMs: 2600, warnBeforeReset: { erfahrung: true },
    autoSave: { enabled: true, intervalMinutes: 5 }, autoLoad: true, showResetAnimation: true
  };
  toastHistory   = [];
  dialogHistory  = [];
  navUnseen      = {
    arbeitsplatz: true, marktplatz: true, schlafplatz: true,
    quests: true, inventar: true, erfahrung: true, taverne: false, rohstoffe: true,
    errungenschaften: true, pets: true, lehrer: false
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
    resetAnimationSeen: false, oswingSuperHintShown: false, lehrerUnlocked: false,
    streetSweeperTalked: false,
    isWorking: false
  };
  shownDialogs   = [];
  chronikButtonUnseen   = false;
  chronikUnseenEntryIds = [];
  navLevel       = 0;
  currentContent = 'geschichte';
  marketVendor   = null;
  workProgress   = 0;

  localStorage.removeItem(SAVE_KEY);
  setupAutoSave();

  showToast('Spielstand zurückgesetzt. Eine neue Geschichte beginnt…', 'info');
  render();
}
