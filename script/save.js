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
      restStats,
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
      einsicht,
      wissensdurstSkills,
      alchemie,
      expedition,
      zeitkristalle,
      automation,
      ruf, kap2ResetCount, rufSkills, kap3ResetCount,
      einfluss, fraktionen, informanten,
      valdrisProfil, hafenStats,
      // combat wird NICHT gespeichert — aktiver Kampf bricht beim Laden ab
      gameFlags:      { ...gameFlags, isWorking: false }, // Laufende Arbeit nicht speichern
      shownDialogs,
      chronikButtonUnseen,
      chronikUnseenEntryIds,
      navLevel,
      currentCity,
      currentContent: currentContent === CONTENT.SETTINGS ? CONTENT.GESCHICHTE : currentContent,
      savedAt:        Date.now()
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(save));

    if (opts.silent) {
      showToast('💾 Automatisch gespeichert', TOAST.INFO);
    } else {
      showToast(`💾 Spielstand gespeichert (${new Date().toLocaleTimeString('de-DE')})`, TOAST.INFO);
    }
    render(); // Einstellungen-Ansicht aktualisieren (Laden-Button aktivieren)

  } catch (e) {
    showToast('⚠ Speichern fehlgeschlagen: ' + e.message, TOAST.ERROR);
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
    longShift: false, longerRest: 0,
    paranoid: false, aufmerksamkeit: false, instinkt: false, kaltbluetig: false, unzerstoerbar: false,
    ...save.skills
  };
  needs          = { hunger: 15, tiredness: 0, sleepDebt: 0, ...save.needs };
  gameClock      = { day: 1, hour: 7, minute: 0, ...save.gameClock };
  nightFlags     = { nightActivityUsedToday: false, recoveryDebuff: false, ...save.nightFlags };
  quests         = {
    nightWatch: { state: 'unstarted' }, miraLetter: { state: 'unstarted' }, foremanRaise: { state: 'unstarted' },
    kraemerinBusiness: { state: 'unstarted' }, guildRegistration: { state: 'unstarted' },
    commanderTraining: { state: 'unstarted' },
    oswinsAuftrag: { state: 'unstarted' }, erstesZuhause: { state: 'unstarted' },
    theftInvestigation: { state: 'unstarted' },
    gildePruefung: { state: 'unstarted' }, fremderGeheimnis: { state: 'unstarted' },
    miraSuche: { state: 'unstarted' }, kampfRoutine: { state: 'unstarted' },
    waldtrollJagd: { state: 'unstarted' }, gildaAufstieg: { state: 'unstarted' },
    brennenderMut: { state: 'unstarted', count: 0 }, kapitel2Finale: { state: 'unstarted' },
    varenaErstkontakt: { state: 'unstarted' }, alchemieInitiierung: { state: 'unstarted' },
    thessaGeheimnis: { state: 'unstarted' }, tier2Boss: { state: 'unstarted' },
    wissensdurst10: { state: 'unstarted' }, valdrisSpuren: { state: 'unstarted' },
    lethkarMarkt: { state: 'unstarted', goldTraded: 0 }, perethKontakt: { state: 'unstarted' },
    alchemieGeselle: { state: 'unstarted' }, kapitel3Abschluss: { state: 'unstarted' },
    gildeSchulden: { state: 'unstarted', wacheCount: 0 }, gildeInvestition: { state: 'unstarted', investDay: 0 },
    gildeKorruption: { state: 'unstarted', hinweisCount: 0 },
    bruderschaftBeweis: { state: 'unstarted', killCount: 0 },
    gorrsVergangenheit: { state: 'unstarted' }, gorrsEid: { state: 'unstarted' },
    archivRecherche: { state: 'unstarted', count: 0 }, seleWissen: { state: 'unstarted' },
    dasDokument: { state: 'unstarted' }, dieKonfrontation: { state: 'unstarted' },
    ...save.quests
  };
  npcFlags       = { miraDrinkGiven: false, fremderTalkCount: 0, oswingBusinessSeen: false, oswingHintNotified: false, ...save.npcFlags };
  workStats      = { count: 0, hungryWorkCount: 0, ...save.workStats };
  stadtwacheStats = { count: 0, ...save.stadtwacheStats };
  killStats      = { total: 0, ...save.killStats };
  nightWatchStats = { count: 0, ...save.nightWatchStats };
  restStats       = { count: 0, ...save.restStats };
  achievements   = save.achievements ?? {};
  achievementTab = save.achievementTab ?? ACH_CAT.NORMAL;
  pets           = save.pets ?? {};
  wildPets       = save.wildPets ?? [];
  streetCatProgress = { sleepCount: 0, encounters: 0, postAdoptionNights: 0, ...save.streetCatProgress };
  superSkills    = save.superSkills ?? {};
  settings       = {
    toastDurationMs: 5000,
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
    meinhaus: false, schmiede: false, expedition: false,
    alchemie: false, lethkar: false, velmark: false,
    valdrisProfil: false, velmark_hafen: false,
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
    commanderInviteShown: false, firstNightWatchShown: false, firstNightWatchLevelUpShown: false, commanderRecruitmentShown: false,
    resetAnimationSeen: false, kapitel2Unlocked: false, jagdgebietUnlocked: false,
    automationDiscovered: false, devModeEnabled: false,
    firstJagdgebietKill: false, firstCombatDefeated: false, korbinChapter2Talked: false, theftClueFoundInJagdgebiet: false,
    miraRevealedInfo: false, brakkaRevealedSuspect: false, fremderConfronted: false,
    chapter2Complete: false, waldtrollKilled: false, waffenschmiedRejected: false,
    stadtwacheAccepted: false, stadtwacheDeclined: false, isStadtwacheShift: false,
    fullInventoryReset: false,
    mirasBriefGiven: false, mirasBriefDecoded: false,
    lethkarUnlocked: false,
    varenaMetFirst: false, thessaMetFirst: false, perethMetFirst: false,
    varenaDecodedBrief: false, thessaTrustGained: false,
    perethQuestStarted: false, lagerhausVisited: false, chapter3StoryComplete: false,
    schmiedeWelcomeSeen: false,
    exhaustionDialogShown: false,
    robbery2Triggered: false, robbery3Triggered: false, robbery4Triggered: false,
    workBlockedByRobberies: false, newRobberySystemActive: false,
    fremderIdentityKnown: false, kapitel2FinaleStarted: false, kampfTrainingDone: false, consecutiveNightwatch: 0,
    thessaMetLethkar: false, valdrisSpurenGefunden: false, perethKontaktLethkar: false, lethkarHaendlerRabatt: false,
    hafenarbeitUnlocked: false, velmarkStadtwacheUnlocked: false, archivDurchsuchenUnlocked: false,
    unterweltVerhandlungUnlocked: false, gorrsEidGeleistet: false, valdrisDokumentGefunden: false, valdrisFinaleStarted: false,
    harroMet: false, harroSchuldenBezahlt: false, gorrMet: false, seleMet: false, yevaMetFirst: false,
    ...save.gameFlags, isWorking: false, isStadtwacheShift: false
  };
  // Konsistenz-Fix: Raub hat stattgefunden (robberyTriggered + storyState ≥ 20100),
  // aber resetLayerUnlocked wurde durch Autosave-Timing nicht gesetzt.
  if (gameFlags.robberyTriggered && storyState >= 20100 && !gameFlags.resetLayerUnlocked) {
    gameFlags.resetLayerUnlocked = true;
  }
  playerStats    = { hp: 30, maxHp: 30, ...save.playerStats };
  strength       = { xp: 0, level: 0, ...save.strength };
  mut            = { points: 0, totalEarned: 0, ...save.mut };
  einsicht           = { points: 0, totalEarned: 0, ...save.einsicht };
  wissensdurstSkills = { forschungsinstinkt: false, wissensspeicher: false, doppelteErkenntnis: false, aspektmeister: false, alchemistischesGedaechtnis: false, ...save.wissensdurstSkills };
  alchemie           = { unlocked: false, levels: { feuer:0,wasser:0,erde:0,luft:0,aether:0 }, progress: { feuer:0,wasser:0,erde:0,luft:0,aether:0 }, lastTick: null, ...save.alchemie };
  expedition     = { activeExpedition: null, storyCompleted: [], grindCounts: {}, ...save.expedition };
  zeitkristalle  = save.zeitkristalle ?? 0;
  automation     = { slots: [], ...save.automation };
  ruf            = save.ruf            ?? 0;
  kap2ResetCount = save.kap2ResetCount ?? 0;
  valdrisProfil  = { herkunft: false, netzwerk: false, motive: false, kontakte: false, schwaeche: false, aufenthaltsort: false, ...save.valdrisProfil };
  hafenStats     = { count: 0, ...save.hafenStats };
  rufSkills      = save.rufSkills      ?? {};
  kap3ResetCount = save.kap3ResetCount ?? 0;
  einfluss       = { points: 0, totalEarned: 0, ...save.einfluss };
  fraktionen     = { haendlergilde: 0, bruderschaft: 0, archiv: 0, ...save.fraktionen };
  informanten    = { count: 0, lastTick: null, ...save.informanten };
  // Migration: altes Format erlaubte mehrere Slots pro Aktion — jetzt max. 1 pro Aktion.
  { const seen = new Set(); automation.slots = automation.slots.filter(s => !seen.has(s.action) && seen.add(s.action)); }
  combat         = { active: false, enemyId: null, enemyHp: 0, log: [] };
  shownDialogs   = save.shownDialogs ?? [];
  chronikButtonUnseen   = save.chronikButtonUnseen ?? false;
  chronikUnseenEntryIds = save.chronikUnseenEntryIds ?? [];
  navLevel       = save.navLevel       ?? 0;
  currentCity    = save.currentCity    ?? 'treutheim';
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
    fixes.push('Spielfortschritt wurde repariert — die Ziele werden jetzt korrekt angezeigt.');
  }

  return fixes;
}

/* ══════════════════════════════════════════════════════════════
   PRESTIGE-RESET-SYSTEME
   Kap-2-Prestige (Ruf) und Kap-3-Prestige (Wissensdurst).
   Diese Resets sind BEWUSSTE Spieler-Aktionen, niemals automatisch.
   ══════════════════════════════════════════════════════════════ */

/** Führt einen Kap-2-Prestige-Reset durch: gibt Ruf, setzt Kap-2-State zurück,
    behält aber Gold×0.25, EP, Mut, Ruf, rufSkills, Kap-1-Flags. */
function performKap2PrestigeReset() {
  const earned = 3 + kap2ResetCount * 2;
  ruf          += earned;
  kap2ResetCount++;

  // ── Kap-2-spezifischen State zurücksetzen ────────────────────
  storyState = 20100;
  gameFlags.chapter2Complete       = false;
  gameFlags.waldtrollKilled        = false;
  gameFlags.firstJagdgebietKill    = false;
  gameFlags.korbinChapter2Talked   = false;
  gameFlags.theftClueFoundInJagdgebiet = false;
  gameFlags.miraRevealedInfo       = false;
  gameFlags.brakkaRevealedSuspect  = false;
  gameFlags.fremderConfronted      = false;
  gameFlags.mirasBriefGiven        = false;
  gameFlags.mirasBriefDecoded      = false;
  gameFlags.firstCombatDefeated    = false;

  quests.theftInvestigation = { state: 'unstarted' };
  quests.miraLetter         = { state: 'unstarted' };
  npcFlags.fremderTalkCount  = 0;

  combat    = defaultCombat();
  killStats = { total: 0 };
  strength  = defaultStrength();

  // ── Gold: 25 % behalten + Schnellstart-Bonus ────────────────
  resources.gold = Math.floor(resources.gold * 0.25) + getRufStartGold();

  // ── Bedürfnisse ──────────────────────────────────────────────
  needs.hunger    = 20;
  needs.tiredness = 10;
  needs.sleepDebt = 0;

  // ── playerStats neu berechnen (Ruf-Veteran-Bonus) ────────────
  const newMaxHp = getPlayerMaxHp();
  playerStats.maxHp = newMaxHp;
  playerStats.hp    = newMaxHp;

  showToast(`Ich kehre zurück — als Veteran. (+${earned} Ruf)`, TOAST.EVENT);
  saveGame({ silent: true });
  render();
}

/** Kauft eine Ruf-Fähigkeit. Kosten werden in `ruf` abgezogen. */
function buyRufSkill(id) {
  const def = RUF_SKILL_DEFS.find(s => s.id === id);
  if (!def || rufSkills[id] || ruf < def.cost) return;
  ruf          -= def.cost;
  rufSkills[id] = true;
  showToast(`${def.name} freigeschaltet!`, TOAST.EVENT);
  playSfx('achievement');
  render();
}

/** Führt einen Kap-3-Prestige-Reset durch: gibt Wissensdurst, setzt Kap-3-State zurück. */
function performKap3PrestigeReset() {
  const earned = 5 + kap3ResetCount * 3;
  einsicht.points      += earned;
  einsicht.totalEarned += earned;
  kap3ResetCount++;

  // ── Kap-3-spezifischen State zurücksetzen ────────────────────
  storyState = 30100;
  gameFlags.kap3Complete              = false;
  gameFlags.kap3ArrivalShown          = false; // falls vorhanden
  gameFlags.varenaMetFirst            = false;
  gameFlags.thessaMetFirst            = false;
  gameFlags.perethMetFirst            = false;
  gameFlags.varenaDecodedBrief        = false;
  gameFlags.thessaTrustGained         = false;
  gameFlags.perethQuestStarted        = false;
  gameFlags.lagerhausVisited          = false;
  gameFlags.chapter3StoryComplete     = false;
  gameFlags.valdrisOperationRaided    = false;
  gameFlags.varenaRevealedValdrisIdent= false;
  gameFlags.alchemieGeselleReached    = false;

  // Alchemie-Fortschritt zurücksetzen (Skills bleiben via wissensdurstSkills)
  const keepProgress = wissensdurstSkills.alchemistischesGedaechtnis;
  alchemie = {
    unlocked: false,
    levels:   keepProgress
      ? Object.fromEntries(Object.entries(alchemie.levels).map(([k,v]) => [k, Math.floor(v * 0.5)]))
      : { feuer:0, wasser:0, erde:0, luft:0, aether:0 },
    progress: { feuer:0, wasser:0, erde:0, luft:0, aether:0 },
    lastTick: null
  };

  // Lethkar bleibt freigeschaltet, aber Miras Brief muss neu entschlüsselt werden
  gameFlags.lethkarUnlocked   = true;

  showToast(`Ich kehre nach Lethkar zurück — wissbegieriger denn je. (+${earned} Wissensdurst ✦)`, TOAST.EVENT);
  saveGame({ silent: true });
  render();
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
    showToast('Spielstand neu gestartet — mein bisheriger Fortschritt bleibt erhalten.', TOAST.INFO);
  });
}

/** Lädt einen gespeicherten Spielstand aus localStorage. Bei Erfolg ganz
    normal; ist der Spielstand nicht mehr lesbar (korruptes JSON oder eine
    Form, die applySaveData() nicht zuordnen kann), erscheint ein Dialog
    statt eines stillen Fehlers, mit der Option, ganz neu anzufangen. */
function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    showToast('Kein Spielstand gefunden.', TOAST.ERROR);
    return;
  }

  try {
    const save = JSON.parse(raw);
    const loadedVersion = typeof save.version === 'number' ? save.version : 0;
    applySaveData(save);

    // Spielstände, die mit dem alten Ein-Raub-System in Kapitel 2 angekommen
    // sind (storyState >= 20100, aber nicht durch das neue 4-Raub-System),
    // können nicht automatisch migriert werden — Story-Reihenfolge stimmt
    // nicht mehr überein.
    if (storyState >= 20100 && !gameFlags.robbery4Triggered) {
      render();
      showStoryIncompatibleDialog(raw);
      return;
    }

    const migrationFixes = loadedVersion < CURRENT_SAVE_VERSION
      ? migrateSaveData(loadedVersion)
      : [];

    // Informanten-Tick nach dem Laden neu starten (falls freigeschaltet)
    if (gameFlags.informantenNetzFreigeschaltet && typeof setupInformantenTick === 'function') {
      setupInformantenTick();
    }

    const dateStr = new Date(save.savedAt).toLocaleString('de-DE');
    showToast(`📂 Spielstand geladen (gespeichert: ${dateStr})`, TOAST.INFO);
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
    if (isDevPreview) showToast('Keine Changelog-Einträge für diesen Bereich.', TOAST.INFO);
    return;
  }

  const allEntries = versions.flatMap(v => SAVE_CHANGELOG[v].map(e => ({ ...e, _version: v })));

  const generalEntries = allEntries.filter(e => !e.chapter);
  const chapterNums = [...new Set(allEntries.filter(e => e.chapter).map(e => e.chapter))].sort((a, b) => a - b);

  const renderCategoryGroups = (entries) => {
    const categories = [...new Set([...SAVE_CHANGELOG_CATEGORY_ORDER, ...entries.map(e => e.cat)])];
    return categories
      .map(cat => ({ cat, entries: entries.filter(e => e.cat === cat) }))
      .filter(g => g.entries.length > 0)
      .map(g => `
        <div class="changelog-category">${g.cat}</div>
        <ul class="changelog-list">${g.entries.map(changelogEntryHtml).join('')}</ul>
      `).join('');
  };

  const generalHtml = generalEntries.length > 0 ? renderCategoryGroups(generalEntries) : '';

  const isChapterRevealed = ch => {
    if (ch <= 1) return true;
    if (ch === 2) return !!gameFlags.kapitel2Unlocked;
    if (ch === 3) return !!gameFlags.lethkarUnlocked;
    return false;
  };

  const CHAPTER_NAMES = { 1: 'Treutheim — Die Anfänge', 2: 'Treutheim — Das Geheimnis', 3: 'Lethkar' };
  const chapterHtml = chapterNums.map(ch => {
    const entries = allEntries.filter(e => e.chapter === ch);
    const label = CHAPTER_NAMES[ch] || `Abschnitt ${ch}`;
    if (isChapterRevealed(ch)) {
      return `
        <div class="changelog-chapter-header">${label}</div>
        ${renderCategoryGroups(entries)}`;
    }
    return `
      <details class="changelog-chapter">
        <summary class="changelog-chapter-summary">${label} <span class="changelog-spoiler-hint">(Spoiler — zum Aufdecken klicken)</span></summary>
        ${renderCategoryGroups(entries)}
      </details>`;
  }).join('');

  const sectionsHtml = generalHtml + chapterHtml;

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
      Da der Spielstand automatisch korrigiert wurde, kann es sein, dass einige
      Szenen aus dem zweiten Abschnitt noch nicht erlebt wurden. Ein <strong>Sanfter Neustart</strong>
      setzt nur diesen Fortschritt zurück — EP, Skills, Gold und alles andere
      bleibt vollständig erhalten.
    </p>
  ` : '';

  const flushPendingActions = () => {
    if (window._pendingVersionUpdate) {
      const v = window._pendingVersionUpdate;
      window._pendingVersionUpdate = null;
      showVersionUpdateDialog(v);
    }
    if (window._pendingHealAction) {
      const fn = window._pendingHealAction;
      window._pendingHealAction = null;
      fn();
    }
  };

  const buttons = isDevPreview
    ? [{ label: 'Schließen', onClick: () => closeDialog(flushPendingActions) }]
    : [{ label: 'Spielstand aktualisieren und weiterspielen', onClick: () => closeDialog(() => {
        saveGame();
        flushPendingActions();
      }) }];

  if (resetOffered) {
    buttons.push({
      label: 'Sanfter Neustart (Treutheim-Geschichte)',
      onClick: () => {
        showDialog({
          title: 'Geschichte des zweiten Abschnitts neu starten?',
          text: [
            'EP-Fortschritt, Skills, Gold und alle Errungenschaften aus dem ersten Abschnitt bleiben erhalten.',
            'Nur die Story des zweiten Abschnitts, die Detektiv-Quest und die zugehörigen Errungenschaften werden zurückgesetzt.',
            'Wirklich neu starten?'
          ],
          buttons: [
            { label: 'Ja, neu starten', onClick: () => performGracefulReset() },
            { label: 'Abbrechen', onClick: () => closeDialog(() => showSaveChangelogDialog(loadedVersion, migrationFixes)) }
          ]
        });
      }
    });
  }

  showDialog({
    title: `Spielstand aktualisiert`,
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
    showToast('📥 Spielstand-Backup gespeichert.', TOAST.INFO);
  } catch (e) {
    showToast('⚠ Download fehlgeschlagen — Zwischenablage-Export als Alternative nutzen.', TOAST.ERROR);
  }
}

function showVersionUpdateDialog(fromVersion) {
  const parseVer = v => v.replace(/-[^.]*$/, '').split('.').map(Number);
  const fromParts = parseVer(fromVersion);
  const toParts   = parseVer(GAME_VERSION);

  // Minor-Sprung = unterschiedliche Minor- oder Major-Zahl (0.14 → 0.15)
  const isMinorBump = toParts[0] > fromParts[0] || toParts[1] > fromParts[1];

  const isNewer = v => {
    const p = parseVer(v);
    for (let i = 0; i < 3; i++) {
      if ((p[i] || 0) > (fromParts[i] || 0)) return true;
      if ((p[i] || 0) < (fromParts[i] || 0)) return false;
    }
    return false;
  };

  const newerVersions = Object.keys(VERSION_NOTES)
    .filter(isNewer)
    .sort((a, b) => {
      const pa = parseVer(a), pb = parseVer(b);
      for (let i = 0; i < 3; i++) {
        if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
      }
      return 0;
    });

  function buildSectionsHtml(notes) {
    if (!notes.length) return `<p style="color:var(--text-lo)">Kleinere Verbesserungen und Bugfixes.</p>`;
    const cats = [...new Set(notes.map(n => n.cat))];
    return cats.map(cat => `
      <div class="changelog-category">${cat}</div>
      <ul class="changelog-list">${
        notes.filter(n => n.cat === cat)
             .map(n => `<li class="changelog-entry">${n.text}</li>`)
             .join('')
      }</ul>`).join('');
  }

  if (isMinorBump) {
    // Minor-Update: zeigt nur die Highlights der neuen Minor-Version prominent.
    // Zwischenzeitliche Patches (selbe Minor-Zahl wie fromVersion) werden in
    // einem ausklappbaren Abschnitt versteckt, um nicht vom Neuen abzulenken.
    const majorNotes  = VERSION_NOTES[GAME_VERSION] ?? [];
    const patchNotes  = newerVersions
      .filter(v => parseVer(v)[1] === fromParts[1])
      .flatMap(v => VERSION_NOTES[v]);

    const patchBlock = patchNotes.length > 0
      ? `<details class="changelog-chapter" style="margin-top:12px">
           <summary class="changelog-chapter-summary">Ältere Patch-Notizen (v0.${fromParts[1]}.x)</summary>
           ${buildSectionsHtml(patchNotes)}
         </details>`
      : '';

    showDialog({
      title: `✦ v0.${toParts[1]} ist live!`,
      text:  buildSectionsHtml(majorNotes) + patchBlock,
      buttons: [{ label: 'Los geht\'s!', onClick: () => closeDialog() }]
    });
  } else {
    // Patch-Update: akkumulierte Änderungen seit letzter gespielter Version.
    const allNotes  = newerVersions.flatMap(v => VERSION_NOTES[v]);
    const toVersion = newerVersions.at(-1) ?? GAME_VERSION;
    showDialog({
      title:   `✦ Aktualisiert auf ${toVersion}`,
      text:    buildSectionsHtml(allNotes),
      buttons: [{ label: 'Weiter spielen', onClick: () => closeDialog() }]
    });
  }
}

/** Zeigt einen Dialog wenn der Spielstand wegen der Story-Überarbeitung
    (v0.15 — 4-Raub-System statt 1) nicht mehr weitergeführt werden kann.
    Der Spieler kann den Stand als Datei sichern und dann neu anfangen. */
function showStoryIncompatibleDialog(raw) {
  showDialog({
    title: '⚠ Spielstand nicht kompatibel',
    html: `
      <p>Die Geschichte wurde in v0.15 grundlegend überarbeitet — vier Raub-Ereignisse ersetzen den bisherigen einmaligen Raub, und der Handlungsverlauf hat sich dadurch verändert.</p>
      <p>Dieser Spielstand stammt aus einer Version vor dieser Überarbeitung und kann leider nicht automatisch angepasst werden, ohne die Story zu übergehen.</p>
      <p>Den Spielstand als Datei sichern — falls er für spätere Versionen aufgehoben werden soll.</p>
    `,
    buttons: [
      {
        label: '📥 Spielstand als Datei sichern',
        onClick: () => downloadCorruptedSave(raw)
      },
      {
        label: 'Neu anfangen',
        onClick: () => { closeDialog(); performHardReset(); render(); }
      }
    ]
  });
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
    showToast('Kein Spielstand zum Exportieren vorhanden — erst speichern.', TOAST.ERROR);
    return;
  }
  try {
    await navigator.clipboard.writeText(raw);
    showToast('📋 Spielstand in die Zwischenablage kopiert.', TOAST.INFO);
  } catch (e) {
    showToast('⚠ Export fehlgeschlagen — Zwischenablage nicht verfügbar.', TOAST.ERROR);
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
    showToast('⚠ Import fehlgeschlagen — Zwischenablage nicht verfügbar.', TOAST.ERROR);
    return;
  }
  if (!text || !text.trim()) {
    showToast('Zwischenablage ist leer.', TOAST.ERROR);
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
function defaultRestStats()      { return { count: 0 }; }
function defaultPlayerStats()  { return { hp: 30, maxHp: 30 }; }
function defaultStrength()     { return { xp: 0, level: 0 }; }
function defaultCombat()       { return { active: false, enemyId: null, enemyHp: 0, log: [] }; }
function defaultEquipment()    { return { hands: null, guertel: null }; }
function defaultSettings()     {
  return {
    toastDurationMs: 5000,
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
    meinhaus: false, schmiede: false, expedition: false,
    alchemie: false, lethkar: false
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
    commanderInviteShown: false, firstNightWatchShown: false, firstNightWatchLevelUpShown: false, commanderRecruitmentShown: false,
    resetAnimationSeen: false, oswingSuperHintShown: false, lehrerUnlocked: false,
    streetSweeperTalked: false,
    kapitel2Unlocked: false, jagdgebietUnlocked: false,
    automationDiscovered: false, devModeEnabled: false,
    waffenschmiedRejected: false,
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
    inventoryKeeper: false, sleepLikeARock: false, petLover: false, longShift: false, longerRest: 0
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
  restStats      = defaultRestStats();
  achievements  = {};
  achievementTab = ACH_CAT.NORMAL;
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
  const aetherResetBonus = typeof alchemieAetherResetBonus === 'function' && alchemieAetherResetBonus() ? 1 : 0;
  if (wissensdurstSkills.wissensspeicher) {
    einsicht = { points: einsicht.points + aetherResetBonus, totalEarned: einsicht.totalEarned + aetherResetBonus };
  } else {
    einsicht = { points: aetherResetBonus, totalEarned: aetherResetBonus };
  }
  const keepAlchemieProgress = wissensdurstSkills.alchemistischesGedaechtnis;
  alchemie = {
    unlocked: false,
    levels:   keepAlchemieProgress
      ? Object.fromEntries(Object.entries(alchemie.levels).map(([k, v]) => [k, Math.floor(v * 0.5)]))
      : { feuer:0,wasser:0,erde:0,luft:0,aether:0 },
    progress: { feuer:0,wasser:0,erde:0,luft:0,aether:0 },
    lastTick: null
  };
  expedition    = { activeExpedition: null, storyCompleted: [], grindCounts: {} };
  zeitkristalle = 0;
  automation    = { slots: [] };
  combat        = defaultCombat();
  // ruf, rufSkills, kap2ResetCount, kap3ResetCount sind permanente Meta-Progression
  // und überstehen auch einen harten Reset (wie EP, Mut, Wissensdurst).
  // (bleiben unverändert)
  einfluss      = { points: 0, totalEarned: 0 };
  fraktionen    = { haendlergilde: 0, bruderschaft: 0, archiv: 0 };
  informanten   = { count: 0, lastTick: null };
  shownDialogs  = [];
  chronikButtonUnseen   = false;
  chronikUnseenEntryIds = [];
  navLevel       = NAV_LEVEL.MENU;
  currentCity    = 'treutheim';
  currentContent = 'geschichte';
  marketVendor   = null;
  workProgress   = 0;

  localStorage.removeItem(SAVE_KEY);
  setupAutoSave();

  showToast('Spielstand zurückgesetzt. Eine neue Geschichte beginnt…', TOAST.INFO);
  render();
}
