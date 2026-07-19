/* ══════════════════════════════════════════════════════════════
   nav.js — Linke Navigationsspalte
   Zwei unabhängige Bereiche:
   - Globaler Bereich (Geschichte/Quests/Inventar/Chronik): immer
     sichtbar, unabhängig davon, wo man sich in der Welt befindet.
   - Orts-Bereich: zeigt die aktuelle Navigationsebene der Welt
     (Weltkarte → Treutheim → Arbeitsplatz/Marktplatz/...).
   Beide Bereiche bleiben beim Wechsel des jeweils anderen erhalten,
   damit man z.B. von "Quests" aus direkt zur zuletzt besuchten
   Örtlichkeit zurückkehren kann.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* Content-IDs, die zur Stadtebene (navLevel 2) gehören. */
const TOWN_CONTENT_IDS    = [CONTENT.TREUTHEIM, CONTENT.ARBEITSPLATZ, CONTENT.MARKTPLATZ, CONTENT.TAVERNE, CONTENT.SCHLAFPLATZ, CONTENT.ROHSTOFFE, CONTENT.JAGDGEBIET, CONTENT.STADTWACHE, CONTENT.MEINHAUS, CONTENT.SCHMIEDE];
const LETHKAR_CONTENT_IDS = [CONTENT.LETHKAR, CONTENT.ALCHEMIE, CONTENT.LETHKAR_MARKT, CONTENT.LETHKAR_TAVERNE, CONTENT.LETHKAR_SCHLAFPLATZ];
const VELMARK_CONTENT_IDS = [CONTENT.VELMARK, CONTENT.VELMARK_FRAKTIONEN, CONTENT.VELMARK_JAGDGEBIET, CONTENT.VELMARK_MARKT, CONTENT.VELMARK_SCHLAFPLATZ, CONTENT.VELMARK_HAFEN];

/* Content-IDs des immer sichtbaren globalen Navigationsbereichs.
   Chronik ist bewusst NICHT dabei — sie hängt als kleiner Buch-Button
   in der unteren Zielleiste (siehe objective.js/index.html), weil sie
   seltener gebraucht wird als Quests/Inventar/Geschichte. */
const GLOBAL_CONTENT_IDS = [CONTENT.GESCHICHTE, CONTENT.QUESTS, CONTENT.INVENTAR];

/** Rendert den Inhalt der linken Navigationsspalte (global + ortsbezogen). */
function renderNav() {
  const navContent = document.getElementById('nav-content');
  if (!navContent) return;

  navContent.innerHTML = renderGlobalNavSection() +
    '<hr class="nav-divider nav-divider-strong">' +
    renderLocationNavSection();

  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) {
    settingsBtn.classList.toggle('active', currentContent === CONTENT.SETTINGS);
  }
}

/** Immer sichtbarer Bereich: Geschichte, Quests, Inventar, Chronik.
    Quests/Inventar erscheinen erst, sobald sie etwas zu zeigen haben —
    eine leere "Quests"-Seite ohne je angenommene Aufgabe oder ein leeres
    "Inventar" ohne je besessenen Gegenstand wäre nur eine verfrühte
    Ankündigung eines Features, das noch nicht relevant ist (siehe
    SKILL.md, "Sichtbarkeit erst bei Relevanz"). */
function renderGlobalNavSection() {
  const item = (id, icon, label) => {
    const active = currentContent === id ? 'active' : '';
    const isNew  = navUnseen.hasOwnProperty(id) && navUnseen[id] ? 'nav-btn-new' : '';
    return `<button class="nav-btn ${active} ${isNew}" onclick="showContent('${id}')">${icon} ${label}</button>`;
  };

  const hasAnyQuest = Object.values(quests).some(q => q.state !== QUEST_STATE.UNSTARTED);

  // "Erfahrung" blinkt zusätzlich zur normalen Erstbesuchs-Hervorhebung
  // (navUnseen), sobald ein lohnender Neuanfang bereit liegt — unabhängig
  // davon, ob der Spieler den Tab schon mal besucht hat. Eigene Klasse statt
  // navUnseen, weil sie sich (anders als navUnseen) jederzeit wieder
  // ein- und ausschalten kann, je nachdem ob gerade genug Gold da ist.
  const erfahrungReady = gameFlags.resetLayerUnlocked && canPerformManualReset();
  const erfahrungBtn = gameFlags.resetLayerUnlocked
    ? `<button class="nav-btn ${currentContent === CONTENT.ERFAHRUNG ? 'active' : ''} ${navUnseen.erfahrung ? 'nav-btn-new' : ''} ${erfahrungReady ? 'nav-btn-reset-ready' : ''}" onclick="showContent('${CONTENT.ERFAHRUNG}')">✦ Erfahrung</button>`
    : '';

  const hasAnyAchievement = Object.keys(achievements).length > 0;
  const hasAnyPet         = Object.keys(pets).length > 0;
  const activeQuestCount  = Object.values(quests).filter(q => q.state === QUEST_STATE.ACTIVE).length;
  const questLabel = hasAnyQuest
    ? `🗒 Quests${activeQuestCount > 0 ? ` <span class="nav-badge">${activeQuestCount}</span>` : ''}`
    : '';

  return `
    <div class="nav-level-label">Spieler</div>
    ${item('geschichte', '📖', 'Geschichte')}
    ${hasAnyQuest ? `<button class="nav-btn ${currentContent === CONTENT.QUESTS ? 'active' : ''} ${navUnseen.quests ? 'nav-btn-new' : ''}" onclick="showContent('${CONTENT.QUESTS}')">${questLabel}</button>` : ''}
    ${gameFlags.everOwnedItem      ? item('inventar', '🎒', 'Inventar')    : ''}
    ${hasAnyPet                    ? item('pets', '🐾', 'Haustiere')      : ''}
    ${erfahrungBtn}
    ${gameFlags.lehrerUnlocked     ? item('lehrer', '📚', 'Lehrhaus')      : ''}
    ${hasAnyAchievement            ? item('errungenschaften', '🏆', 'Errungenschaften') : ''}
    ${gameFlags.automationDiscovered ? item('automation', '⌛', 'Automatisierung') : ''}
    ${gameFlags.jagdgebietUnlocked   ? item('expedition', '🗺', 'Expeditionen')   : ''}
    ${(kap2ResetCount > 0 || ruf > 0) ? item('rufFaehigkeiten', '⚔', 'Veteranen-Boni') : ''}
    ${gameFlags.valdrisSpurenGefunden ? `<button class="nav-btn ${currentContent === CONTENT.VALDRIS_PROFIL ? 'active' : ''} ${navUnseen.valdrisProfil ? 'nav-btn-new' : ''}" onclick="showContent('${CONTENT.VALDRIS_PROFIL}')">🎯 Valdris</button>` : ''}
  `;
}

/** Ortsbezogener Bereich: hängt von der aktuellen Navigationsebene (navLevel) ab. */
function renderLocationNavSection() {
  if (navLevel === NAV_LEVEL.MENU) {
    const mapHidden = storyState < 10101 ? 'hidden' : '';
    const active    = currentContent === CONTENT.WELTKARTE ? 'active' : '';
    return `
      <div class="nav-level-label">Welt</div>
      <button class="nav-btn ${active} ${mapHidden}" onclick="navTo(${NAV_LEVEL.WELTKARTE})">◈ Weltkarte</button>
    `;
  }

  if (navLevel === NAV_LEVEL.WELTKARTE) {
    const activeTreutheim = currentContent === CONTENT.TREUTHEIM ? 'active' : '';
    const activeLethkar   = currentContent === CONTENT.LETHKAR   ? 'active' : '';
    const activeVelmark   = currentContent === CONTENT.VELMARK   ? 'active' : '';
    return `
      <div class="nav-level-label">Weltkarte</div>
      <button class="nav-btn nav-btn-back" onclick="navTo(${NAV_LEVEL.MENU})">◂ Zurück</button>
      <hr class="nav-divider">
      <button class="nav-btn ${activeTreutheim}" onclick="enterCity('${CONTENT.TREUTHEIM}')">⚑ Treutheim</button>
      ${gameFlags.lethkarUnlocked ? `<button class="nav-btn ${activeLethkar}" onclick="enterCity('${CONTENT.LETHKAR}')">🏙 Lethkar</button>` : ''}
      ${gameFlags.velmarkUnlocked ? `<button class="nav-btn ${activeVelmark} ${navUnseen.velmark ? 'nav-btn-new' : ''}" onclick="enterCity('${CONTENT.VELMARK}')">🌆 Velmark</button>` : ''}
    `;
  }

  if (navLevel === NAV_LEVEL.STADT && currentCity === CONTENT.VELMARK) {
    const places = [
      [CONTENT.VELMARK,              '🌆', 'Übersicht'],
      [CONTENT.VELMARK_FRAKTIONEN,   '🤝', 'Fraktionen'],
      [CONTENT.VELMARK_JAGDGEBIET,   '⚔',  'Unterwelt'],
      [CONTENT.VELMARK_MARKT,        '🏪', 'Markt'],
      [CONTENT.VELMARK_HAFEN,        '⚓',  'Hafen'],
      [CONTENT.VELMARK_SCHLAFPLATZ,  '🛏',  'Schlafplatz']
    ];
    const buttons = places.map(([id, icon, label]) => {
      const active = currentContent === id ? 'active' : '';
      return `<button class="nav-btn ${active}" onclick="showContent('${id}')">${icon} ${label}</button>`;
    }).join('');
    return `
      <div class="nav-level-label">Velmark</div>
      <button class="nav-btn nav-btn-back" onclick="navTo(${NAV_LEVEL.WELTKARTE})">◂ Weltkarte</button>
      <hr class="nav-divider">
      ${buttons}
    `;
  }

  if (navLevel === NAV_LEVEL.STADT && currentCity === CONTENT.LETHKAR) {
    const places = [
      [CONTENT.LETHKAR,           '🏙', 'Übersicht'],
      ...(alchemie.unlocked         ? [[CONTENT.ALCHEMIE,         '⚗', 'Alchemie']]      : []),
      ...(gameFlags.lethkarUnlocked ? [[CONTENT.LETHKAR_TAVERNE,  '🍺', 'Taverne']]       : []),
      ...(gameFlags.lethkarUnlocked ? [[CONTENT.LETHKAR_MARKT,    '⚖', 'Marktplatz']]    : []),
      ...(gameFlags.lethkarUnlocked ? [[CONTENT.LETHKAR_SCHLAFPLATZ,'🛏','Schlafplatz']]  : [])
    ];
    const buttons = places.map(([id, icon, label]) => {
      const active = currentContent === id ? 'active' : '';
      const isNew  = navUnseen.hasOwnProperty(id) && navUnseen[id] ? 'nav-btn-new' : '';
      return `<button class="nav-btn ${active} ${isNew}" onclick="showContent('${id}')">${icon} ${label}</button>`;
    }).join('');
    return `
      <div class="nav-level-label">Lethkar</div>
      <button class="nav-btn nav-btn-back" onclick="navTo(${NAV_LEVEL.WELTKARTE})">◂ Weltkarte</button>
      <hr class="nav-divider">
      ${buttons}
    `;
  }

  // navLevel === NAV_LEVEL.STADT, currentCity === CONTENT.TREUTHEIM: innerhalb von Treutheim.
  navUnseen.taverne = isTaverneTabNew();
  const places = [
    [CONTENT.TREUTHEIM,    '⚑', 'Übersicht'],
    ...(gameFlags.jobUnlocked         ? [[CONTENT.ARBEITSPLATZ, '⚒', 'Arbeitsplatz']] : []),
    ...(gameFlags.hungerDialogShown   ? [[CONTENT.MARKTPLATZ,   '⚖', 'Marktplatz']]   : []),
    [CONTENT.TAVERNE,      '🍺', 'Taverne'],
    ...(gameFlags.firstNightDialogShown ? [[CONTENT.SCHLAFPLATZ, '🛏', 'Schlafplatz']] : []),
    ...(gameFlags.resourceGatheringUnlocked ? [[CONTENT.ROHSTOFFE, '🌲', 'Sammelplatz']] : []),
    ...(gameFlags.jagdgebietUnlocked        ? [[CONTENT.JAGDGEBIET, '⚔', 'Jagdgebiet']]  : []),
    ...(gameFlags.stadtwacheAccepted        ? [[CONTENT.STADTWACHE, '🛡', 'Stadtwache']]  : []),
    ...(meta.hasHome                        ? [[CONTENT.MEINHAUS,   '🏠', 'Mein Haus']]   : []),
    ...(meta.hasSmith                       ? [[CONTENT.SCHMIEDE,   '⚒', 'Schmiede']]     : [])
  ];
  const buttons = places.map(([id, icon, label]) => {
    const active = currentContent === id ? 'active' : '';
    const isNew  = navUnseen.hasOwnProperty(id) && navUnseen[id] ? 'nav-btn-new' : '';
    return `<button class="nav-btn ${active} ${isNew}" onclick="showContent('${id}')">${icon} ${label}</button>`;
  }).join('');

  return `
    <div class="nav-level-label">Treutheim</div>
    <button class="nav-btn nav-btn-back" onclick="navTo(${NAV_LEVEL.WELTKARTE})">◂ Zurück</button>
    <hr class="nav-divider">
    ${buttons}
  `;
}

/**
 * Wechselt die Navigationsebene der Welt (Weltkarte/Treutheim) und setzt
 * den dazu passenden Inhalt. Beeinflusst NICHT den globalen Bereich.
 * @param {number} level - Ziel-Navigationsebene (0, 1 oder 2)
 */
function navTo(level) {
  navLevel = level;

  if (level === NAV_LEVEL.MENU) {
    currentContent = CONTENT.GESCHICHTE;
  } else if (level === NAV_LEVEL.WELTKARTE) {
    currentContent = CONTENT.WELTKARTE;
  } else if (level === NAV_LEVEL.STADT) {
    const inCurrentCity = currentCity === CONTENT.LETHKAR
      ? LETHKAR_CONTENT_IDS.includes(currentContent)
      : currentCity === CONTENT.VELMARK
        ? VELMARK_CONTENT_IDS.includes(currentContent)
        : TOWN_CONTENT_IDS.includes(currentContent);
    if (!inCurrentCity) {
      if (currentCity === CONTENT.LETHKAR)      currentContent = CONTENT.LETHKAR;
      else if (currentCity === CONTENT.VELMARK) currentContent = CONTENT.VELMARK;
      else                                      currentContent = CONTENT.TREUTHEIM;
    }
  }

  render();

  if (level === NAV_LEVEL.STADT && currentCity === CONTENT.TREUTHEIM) maybeTriggerJobSearchDialog();
}

/** Wechselt die aktive Stadt und navigiert auf navLevel 2.
 *  Beim allerersten Betreten von Treutheim (storyState 10100→10101)
 *  wird auch der Story-State gesetzt und Story 1.1 ausgelöst. */
function enterCity(city) {
  currentCity    = city;
  navLevel       = NAV_LEVEL.STADT;
  if (city === CONTENT.LETHKAR)      currentContent = CONTENT.LETHKAR;
  else if (city === CONTENT.VELMARK) currentContent = CONTENT.VELMARK;
  else                               currentContent = CONTENT.TREUTHEIM;

  const triggerJobSearch = () => { if (city === CONTENT.TREUTHEIM) maybeTriggerJobSearchDialog(); };

  if (city === CONTENT.TREUTHEIM && storyState === 10100) {
    storyState = 10101;
    render();
    // Verkettet statt parallel (siehe SKILL.md, "Verkettete Ersteinblendungs-
    // Dialoge"): sonst überschreibt maybeTriggerJobSearchDialog() den gerade
    // erst geöffneten Story-1.1-Dialog noch im selben Tick, bevor der Spieler
    // ihn je zu sehen bekommt — Bug gefunden 19.07.2026 beim Testen der
    // Vertonungs-Einbindung.
    maybeShowStoryDialog('1.1', triggerJobSearch);
  } else {
    render();
    triggerJobSearch();
  }
}

/**
 * Setzt den aktiven Inhaltsbereich. Ortsbezogene IDs synchronisieren
 * dabei navLevel; globale IDs (Geschichte/Quests/Inventar/Chronik)
 * lassen navLevel unverändert, damit der Orts-Bereich darunter
 * erhalten bleibt und man bequem zurückkehren kann.
 * @param {string} id - Content-ID
 */
function showContent(id) {
  closeMobilePanels();
  const isFirstVisit = navUnseen.hasOwnProperty(id) && navUnseen[id];
  if (isFirstVisit) navUnseen[id] = false;

  currentContent = id;

  // Chronik-Button-Hervorhebung (siehe objective.js) verschwindet bereits
  // beim Öffnen der Seite — die einzelnen NEUEN Einträge darin bleiben
  // davon unberührt und verschwinden erst je einzeln per Hover.
  if (id === CONTENT.CHRONIK) chronikButtonUnseen = false;

  if (TOWN_CONTENT_IDS.includes(id)) {
    navLevel    = NAV_LEVEL.STADT;
    currentCity = CONTENT.TREUTHEIM;
  }
  if (LETHKAR_CONTENT_IDS.includes(id)) {
    navLevel    = NAV_LEVEL.STADT;
    currentCity = CONTENT.LETHKAR;
  }
  if (VELMARK_CONTENT_IDS.includes(id)) {
    navLevel    = NAV_LEVEL.STADT;
    currentCity = CONTENT.VELMARK;
  }

  // Marktplatz öffnet beim Anwählen über Navigation/Quick-Link immer die
  // Händler-Übersicht (Hub), nicht den zuletzt besuchten Händler.
  if (id === CONTENT.MARKTPLATZ) {
    marketVendor = null;
  }

  render();

  if (id === CONTENT.TAVERNE) maybeTriggerTavernArrivalDialog();
  if (id === CONTENT.SCHMIEDE && meta.hasSmith) maybeTriggerSchmiedeWelcomeDialog();
  if (isFirstVisit) maybeShowNavIntro(id);
}

/** Öffnet die Einstellungen, ohne Navigationsebene oder Ort zu ändern. */
function showSettings() {
  closeMobilePanels();
  currentContent = CONTENT.SETTINGS;
  render();
}
