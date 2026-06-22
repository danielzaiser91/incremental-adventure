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
      stadtwacheStats,
      killStats,
      nightWatchStats,
      achievements,
      achievementTab,
      pets,
      wildPets,
      streetCatProgress,
      superSkills,
      settings,
      toastHistory,
      dialogHistory,
      navUnseen,
      dailyPurchases,
      overflowBag,
      questItems,
      playerStats,
      strength,
      mut,
      zeitkristalle,
      automation,
      // combat wird NICHT gespeichert — aktiver Kampf bricht beim Laden ab
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
  meta           = { resets: 0, fasterWorkUnlocked: false, hasHome: false, hasSmith: false, ...save.meta };
  equipment      = { hands: null, guertel: null, ...save.equipment };
  experience     = { points: 0, totalEarned: 0, ...save.experience };
  skills         = {
    jobLeveling: false, fieldworkMemory: false, ironWill: false, fieldPay: false, nightWatchLeveling: false,
    thrift: 0, quickLearner: 0, clearMind: false, goldBreakthrough: false, guildPrep: false,
    inventoryKeeper: false, sleepLikeARock: false, petLover: false, jobXpBonus: false,
    longShift: false, ...save.skills
  };
  needs          = { hunger: 15, tiredness: 0, sleepDebt: 0, ...save.needs };
  gameClock      = { day: 1, hour: 7, minute: 0, ...save.gameClock };
  nightFlags     = { nightActivityUsedToday: false, recoveryDebuff: false, ...save.nightFlags };
  quests         = {
    nightWatch: { state: 'unstarted' }, miraLetter: { state: 'unstarted' }, foremanRaise: { state: 'unstarted' },
    kraemerinBusiness: { state: 'unstarted' }, guildRegistration: { state: 'unstarted' },
    commanderTraining: { state: 'unstarted' }, theftInvestigation: { state: 'unstarted' },
    ...save.quests
  };
  npcFlags       = { miraDrinkGiven: false, fremderTalkCount: 0, ...save.npcFlags };
  workStats      = { count: 0, hungryWorkCount: 0, ...save.workStats };
  stadtwacheStats = { count: 0, ...save.stadtwacheStats };
  killStats      = { total: 0, ...save.killStats };
  nightWatchStats = { count: 0, ...save.nightWatchStats };
  achievements   = save.achievements ?? {};
  achievementTab = save.achievementTab ?? 'normal';
  pets           = save.pets ?? {};
  wildPets       = save.wildPets ?? [];
  streetCatProgress = { sleepCount: 0, encounters: 0, postAdoptionNights: 0, ...save.streetCatProgress };
  superSkills    = save.superSkills ?? {};
  settings       = {
    toastDurationMs: 2600,
    autoLoad: true,
    showResetAnimation: true,
    hideTextSelection: true,
    ...save.settings,
    warnBeforeReset: { erfahrung: true, ...save.settings?.warnBeforeReset },
    autoSave: { enabled: true, intervalMinutes: 1, ...save.settings?.autoSave }
  };
  applySelectionSetting();
  toastHistory   = save.toastHistory ?? [];
  dialogHistory  = save.dialogHistory ?? [];
  navUnseen      = {
    arbeitsplatz: true, marktplatz: true, schlafplatz: true,
    quests: true, inventar: true, erfahrung: true, taverne: false, rohstoffe: true,
    errungenschaften: true, pets: true, lehrer: false,
    jagdgebiet: false, automation: false, stadtwache: false,
    meinhaus: false, schmiede: false,
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
    resetAnimationSeen: false, kapitel2Unlocked: false, jagdgebietUnlocked: false,
    automationDiscovered: false, devModeEnabled: false,
    firstJagdgebietKill: false, korbinChapter2Talked: false, theftClueFoundInJagdgebiet: false,
    miraRevealedInfo: false, brakkaRevealedSuspect: false, fremderConfronted: false,
    chapter2Complete: false, waldtrollKilled: false, waffenschmiedRejected: false,
    foremanEveningAlerted: false,
    stadtwacheAccepted: false, stadtwacheDeclined: false, isStadtwacheShift: false,
    fullInventoryReset: false,
    mirasBriefGiven: false, mirasBriefDecoded: false,
    ...save.gameFlags, isWorking: false, isStadtwacheShift: false
  };
  playerStats    = { hp: 30, maxHp: 30, ...save.playerStats };
  strength       = { xp: 0, level: 0, ...save.strength };
  mut            = { points: 0, totalEarned: 0, ...save.mut };
  zeitkristalle  = save.zeitkristalle ?? 0;
  automation     = { slots: [], ...save.automation };
  // Migration: altes Format erlaubte mehrere Slots pro Aktion — jetzt max. 1 pro Aktion.
  { const seen = new Set(); automation.slots = automation.slots.filter(s => !seen.has(s.action) && seen.add(s.action)); }
  combat         = { active: false, enemyId: null, enemyHp: 0, log: [] };
  shownDialogs   = save.shownDialogs ?? [];
  chronikButtonUnseen   = save.chronikButtonUnseen ?? false;
  chronikUnseenEntryIds = save.chronikUnseenEntryIds ?? [];
  navLevel       = save.navLevel       ?? 0;
  currentContent = save.currentContent ?? 'geschichte';
  marketVendor   = null;
  workProgress   = 0;
}

/** Repariert bekannte veraltete Spielstände automatisch, soweit möglich.
    Wird NACH applySaveData() aufgerufen, wenn ein veralteter Spielstand
    geladen wurde. Gibt eine Liste der vorgenommenen Korrekturen zurück,
    damit der Spieler im Changelog-Dialog informiert werden kann. */
function migrateSaveData(loadedVersion) {
  const fixes = [];

  // v7→v8: storyState blieb durch Bug bei 10102 hängen, obwohl der Raub
  // längst stattgefunden hat und die Gilde bereits beigetreten wurde.
  if (loadedVersion < 8 &&
      storyState === 10102 &&
      gameFlags.kapitel2Unlocked &&
      gameFlags.robberyTriggered) {
    storyState = 20100;
    fixes.push('Dein Spielfortschritt wurde repariert — die Kapitel-2-Ziele werden jetzt korrekt angezeigt.');
  }

  return fixes;
}

/** Setzt nur den Kapitel-2-Fortschritt zurück, behält aber alles davor
    (EP, Skills, Errungenschaften, Geld, Ausrüstung). Gedacht für Spieler,
    die Kapitel 2 von Anfang an neu erleben möchten oder deren Story-Stand
    nicht automatisch repariert werden konnte. */
function performGracefulReset() {
  storyState = 20100;
  quests.theftInvestigation = { state: 'unstarted' };
  killStats  = { total: 0 };
  npcFlags.fremderTalkCount = 0;

  const ch2Flags = [
    'firstJagdgebietKill', 'korbinChapter2Talked', 'theftClueFoundInJagdgebiet',
    'miraRevealedInfo', 'brakkaRevealedSuspect', 'fremderConfronted',
    'chapter2Complete', 'waldtrollKilled'
  ];
  ch2Flags.forEach(f => { gameFlags[f] = false; });
  delete achievements.chapter2Complete;
  delete achievements.imSchatten;

  closeDialog(() => {
    saveGame({ silent: true });
    render();
    showToast('Kapitel 2 wurde neu gestartet — dein bisheriger Fortschritt bleibt erhalten.', 'info');
  });
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

    const migrationFixes = loadedVersion < CURRENT_SAVE_VERSION
      ? migrateSaveData(loadedVersion)
      : [];

    const dateStr = new Date(save.savedAt).toLocaleString('de-DE');
    showToast(`📂 Spielstand geladen (gespeichert: ${dateStr})`, 'info');
    render();

    if (loadedVersion < CURRENT_SAVE_VERSION) {
      showSaveChangelogDialog(loadedVersion, migrationFixes);
    }

  } catch (e) {
    render(); // Hintergrund-UI im Default-Zustand zeichnen, bevor der Dialog erscheint
    showIncompatibleSaveDialog(raw);
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
    vermerkten Version geändert hat.
    @param {number}   loadedVersion  - Version des geladenen Spielstands
    @param {string[]} migrationFixes - Korrekturen, die automatisch angewendet wurden */
function showSaveChangelogDialog(loadedVersion, migrationFixes = [], maxVersion = CURRENT_SAVE_VERSION, isDevPreview = false) {
  const versions = Object.keys(SAVE_CHANGELOG)
    .map(Number)
    .filter(v => v > loadedVersion && v <= maxVersion)
    .sort((a, b) => a - b);
  if (versions.length === 0) {
    if (isDevPreview) showToast('Keine Changelog-Einträge für diesen Bereich.', 'info');
    return;
  }

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

  // Automatisch vorgenommene Korrekturen anzeigen
  const fixesHtml = migrationFixes.length > 0 ? `
    <div class="changelog-category" style="color:var(--c-reward)">Automatische Korrekturen</div>
    <ul class="changelog-list">${migrationFixes.map(f =>
      `<li class="changelog-entry" style="color:var(--c-reward)">✓ ${f}</li>`
    ).join('')}</ul>
  ` : '';

  // Sanfter Neustart nur anbieten, wenn der Spielstand repariert wurde —
  // dann könnten Kapitel-2-Szenen verpasst worden sein.
  const resetOffered = migrationFixes.length > 0 && gameFlags.kapitel2Unlocked && !gameFlags.chapter2Complete;
  const gracefulResetHtml = resetOffered ? `
    <hr style="border-color:var(--border);margin:14px 0 10px">
    <p style="color:var(--text-lo);font-size:0.82em">
      Da dein Spielstand automatisch korrigiert wurde, kann es sein, dass du einige
      Kapitel-2-Szenen noch nicht erlebt hast. Ein <strong>Sanfter Neustart</strong>
      setzt nur den Kapitel-2-Fortschritt zurück — EP, Skills, Gold und alles andere
      bleibt vollständig erhalten.
    </p>
  ` : '';

  const buttons = isDevPreview
    ? [{ label: 'Schließen', onClick: () => closeDialog() }]
    : [{ label: 'Spielstand aktualisieren und weiterspielen', onClick: () => closeDialog(() => saveGame()) }];

  if (resetOffered) {
    buttons.push({
      label: 'Sanfter Neustart (Kapitel 2)',
      onClick: () => {
        showDialog({
          title: 'Kapitel 2 neu starten?',
          text: [
            'Dein EP-Fortschritt, deine Skills, dein Gold und alle Errungenschaften aus Kapitel 1 bleiben erhalten.',
            'Nur die Kapitel-2-Story, die Detektiv-Quest und die zugehörigen Errungenschaften werden zurückgesetzt.',
            'Möchtest du das wirklich?'
          ],
          buttons: [
            { label: 'Ja, Kapitel 2 neu starten', onClick: () => performGracefulReset() },
            { label: 'Abbrechen', onClick: () => closeDialog(() => showSaveChangelogDialog(loadedVersion, migrationFixes)) }
          ]
        });
      }
    });
  }

  showDialog({
    title: `Changelog von Version ${loadedVersion} zu Version ${maxVersion}`,
    html: sectionsHtml + fixesHtml + gracefulResetHtml,
    text: allEntries.map(e => e.text),
    buttons,
    boxClass: 'dialog-box-large'
  });
}

/** Zeigt einen Dialog, dass der gespeicherte Spielstand nicht geladen
    werden konnte, mit der Möglichkeit, direkt neu anzufangen. */
/** Speichert den rohen Spielstand-String als Textdatei auf den Rechner
    des Spielers — so bleibt der Fortschritt erhalten, auch wenn er nicht
    geladen werden kann, und kann als Bug-Report angehängt werden. */
function downloadCorruptedSave(raw) {
  try {
    const blob = new Blob([raw], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `spielstand-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Spielstand-Backup gespeichert.', 'info');
  } catch (e) {
    showToast('⚠ Download fehlgeschlagen — Zwischenablage-Export als Alternative nutzen.', 'error');
  }
}

function showIncompatibleSaveDialog(raw) {
  const hasRaw = !!raw;
  showDialog({
    title: 'Spielstand beschädigt',
    html: `
      <p>Der gespeicherte Spielstand konnte nicht gelesen werden — er ist vermutlich beschädigt oder stammt aus einer sehr alten Version.</p>
      <p>Das Spiel startet jetzt neu. Damit der Fortschritt nicht verloren geht: Sicherheitskopie herunterladen und im Discord melden.</p>
    `,
    buttons: [
      ...(hasRaw ? [{
        label: '📥 Spielstand sichern',
        onClick: () => downloadCorruptedSave(raw)
      }] : []),
      {
        label: '💬 Bug melden (Discord)',
        onClick: () => window.open('https://discord.gg/NHenxsPh', '_blank')
      },
      {
        label: 'Neu starten',
        onClick: () => { closeDialog(); performHardReset(); render(); }
      }
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

function applySelectionSetting() {
  document.body.classList.toggle('show-selection', !settings.hideTextSelection);
}

function setHideTextSelection(hide) {
  settings.hideTextSelection = hide;
  applySelectionSetting();
  render();
}

/* ══════════════════════════════════════════════════════════════
   RESET-HILFSFUNKTIONEN
   Pragmatische Alternative zur class-basierten Reset-Architektur:
   Statt privater Klassen-Felder gibt es hier benannte Funktionen,
   die einen kanonischen "frischen" State für jedes Objekt zurückgeben.
   `performHardReset()` nutzt sie, `startManualReset()` (experience.js)
   kann sie selektiv nutzen (z.B. nur Gold-State resetten, EP behalten).
   ══════════════════════════════════════════════════════════════ */

function defaultResources()    { return { gold: 0, totalGoldEarned: 0, inventory: {}, totalResourcesSold: 0 }; }
function defaultNeeds()        { return { hunger: 15, tiredness: 0, sleepDebt: 0 }; }
function defaultGameClock()    { return { day: 1, hour: 7, minute: 0 }; }
function defaultNightFlags()   { return { nightActivityUsedToday: false, recoveryDebuff: false }; }
function defaultWorkStats()    { return { count: 0, hungryWorkCount: 0 }; }
function defaultStadtwacheStats() { return { count: 0 }; }
function defaultNightWatchStats() { return { count: 0 }; }
function defaultPlayerStats()  { return { hp: 30, maxHp: 30 }; }
function defaultStrength()     { return { xp: 0, level: 0 }; }
function defaultCombat()       { return { active: false, enemyId: null, enemyHp: 0, log: [] }; }
function defaultEquipment()    { return { hands: null, guertel: null }; }
function defaultSettings()     {
  return {
    toastDurationMs: 2600,
    warnBeforeReset: { erfahrung: true },
    autoSave: { enabled: true, intervalMinutes: 1 },
    autoLoad: true,
    showResetAnimation: true,
    hideTextSelection: true
  };
}
function defaultNavUnseen()    {
  return {
    arbeitsplatz: true, marktplatz: true, schlafplatz: true,
    quests: true, inventar: true, erfahrung: true, taverne: false, rohstoffe: true,
    errungenschaften: true, pets: true, lehrer: false,
    jagdgebiet: false, automation: false, stadtwache: false,
    meinhaus: false, schmiede: false
  };
}
function defaultGameFlags()    {
  return {
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
    kapitel2Unlocked: false, jagdgebietUnlocked: false,
    automationDiscovered: false, devModeEnabled: false,
    waffenschmiedRejected: false, foremanEveningAlerted: false,
    stadtwacheAccepted: false, stadtwacheDeclined: false, isStadtwacheShift: false,
    fullInventoryReset: false,
    mirasBriefGiven: false, mirasBriefDecoded: false,
    isWorking: false
  };
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

  storyState    = 10100;
  resources     = defaultResources();
  meta          = { resets: 0, fasterWorkUnlocked: false, hasHome: false, hasSmith: false };
  equipment     = defaultEquipment();
  experience    = { points: 0, totalEarned: 0 };
  skills        = {
    jobLeveling: false, fieldworkMemory: false, ironWill: false, fieldPay: false, nightWatchLeveling: false,
    thrift: 0, jobXpBonus: false, quickLearner: 0, clearMind: false, goldBreakthrough: false, guildPrep: false,
    inventoryKeeper: false, sleepLikeARock: false, petLover: false, longShift: false
  };
  superSkills   = {};
  needs         = defaultNeeds();
  gameClock     = defaultGameClock();
  nightFlags    = defaultNightFlags();
  quests        = {
    nightWatch: { state: 'unstarted' }, miraLetter: { state: 'unstarted' }, foremanRaise: { state: 'unstarted' },
    kraemerinBusiness: { state: 'unstarted' }, guildRegistration: { state: 'unstarted' },
    commanderTraining: { state: 'unstarted' }, theftInvestigation: { state: 'unstarted' }
  };
  npcFlags      = { miraDrinkGiven: false };
  workStats     = defaultWorkStats();
  stadtwacheStats = defaultStadtwacheStats();
  nightWatchStats = defaultNightWatchStats();
  achievements  = {};
  achievementTab = 'normal';
  pets          = {};
  wildPets      = [];
  streetCatProgress = { sleepCount: 0, encounters: 0, postAdoptionNights: 0 };
  settings      = defaultSettings();
  toastHistory  = [];
  dialogHistory = [];
  navUnseen     = defaultNavUnseen();
  dailyPurchases = {};
  overflowBag   = {};
  questItems    = {};
  gameFlags     = defaultGameFlags();
  playerStats   = defaultPlayerStats();
  strength      = defaultStrength();
  mut           = { points: 0, totalEarned: 0 };
  zeitkristalle = 0;
  automation    = { slots: [] };
  combat        = defaultCombat();
  shownDialogs  = [];
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
