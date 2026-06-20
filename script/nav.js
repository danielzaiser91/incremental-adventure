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
const TOWN_CONTENT_IDS = ['treutheim', 'arbeitsplatz', 'marktplatz', 'taverne', 'schlafplatz', 'rohstoffe'];

/* Content-IDs des immer sichtbaren globalen Navigationsbereichs.
   Chronik ist bewusst NICHT dabei — sie hängt als kleiner Buch-Button
   in der unteren Zielleiste (siehe objective.js/index.html), weil sie
   seltener gebraucht wird als Quests/Inventar/Geschichte. */
const GLOBAL_CONTENT_IDS = ['geschichte', 'quests', 'inventar'];

/** Rendert den Inhalt der linken Navigationsspalte (global + ortsbezogen). */
function renderNav() {
  const navContent = document.getElementById('nav-content');
  if (!navContent) return;

  navContent.innerHTML = renderGlobalNavSection() +
    '<hr class="nav-divider nav-divider-strong">' +
    renderLocationNavSection();

  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) {
    settingsBtn.classList.toggle('active', currentContent === 'settings');
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

  const hasAnyQuest = Object.values(quests).some(q => q.state !== 'unstarted');

  return `
    <div class="nav-level-label">Spieler</div>
    ${item('geschichte', '📖', 'Geschichte')}
    ${hasAnyQuest                  ? item('quests', '🗒', 'Quests')        : ''}
    ${gameFlags.everOwnedItem      ? item('inventar', '🎒', 'Inventar')    : ''}
    ${gameFlags.resetLayerUnlocked ? item('erfahrung', '✦', 'Erfahrung')   : ''}
  `;
}

/** Ortsbezogener Bereich: hängt von der aktuellen Navigationsebene (navLevel) ab. */
function renderLocationNavSection() {
  if (navLevel === 0) {
    const mapHidden = storyState < 10101 ? 'hidden' : '';
    const active    = currentContent === 'weltkarte' ? 'active' : '';
    return `
      <div class="nav-level-label">Welt</div>
      <button class="nav-btn ${active} ${mapHidden}" onclick="navTo(1)">◈ Weltkarte</button>
    `;
  }

  if (navLevel === 1) {
    const active = currentContent === 'treutheim' ? 'active' : '';
    return `
      <div class="nav-level-label">Weltkarte</div>
      <button class="nav-btn nav-btn-back" onclick="navTo(0)">◂ Zurück</button>
      <hr class="nav-divider">
      <button class="nav-btn ${active}" onclick="navTo(2)">⚑ Treutheim</button>
    `;
  }

  // navLevel === 2: innerhalb von Treutheim. Jeder Ort erscheint erst,
  // sobald er spielerisch relevant wird, statt von Anfang an alle Optionen
  // auf einmal zu zeigen: Arbeitsplatz erst nach der Jobvermittlung beim
  // Wirt, Marktplatz erst beim ersten Hunger-Debuff, Schlafplatz erst beim
  // ersten Einbruch der Nacht. Die Taverne ist die einzige Ausnahme, weil
  // die Jobsuche selbst von Anfang an dorthin verweist.
  const places = [
    ['treutheim',    '⚑', 'Übersicht'],
    ...(gameFlags.jobUnlocked         ? [['arbeitsplatz', '⚒', 'Arbeitsplatz']] : []),
    ...(gameFlags.hungerDialogShown   ? [['marktplatz',   '⚖', 'Marktplatz']]   : []),
    ['taverne',      '🍺', 'Taverne'],
    ...(gameFlags.firstNightDialogShown ? [['schlafplatz', '🛏', 'Schlafplatz']] : []),
    ...(gameFlags.resourceGatheringUnlocked ? [['rohstoffe', '🌲', 'Sammelplatz']] : [])
  ];
  const buttons = places.map(([id, icon, label]) => {
    const active = currentContent === id ? 'active' : '';
    const isNew  = navUnseen.hasOwnProperty(id) && navUnseen[id] ? 'nav-btn-new' : '';
    return `<button class="nav-btn ${active} ${isNew}" onclick="showContent('${id}')">${icon} ${label}</button>`;
  }).join('');

  return `
    <div class="nav-level-label">Treutheim</div>
    <button class="nav-btn nav-btn-back" onclick="navTo(1)">◂ Zurück</button>
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

  if (level === 0) {
    currentContent = 'geschichte';
  } else if (level === 1) {
    currentContent = 'weltkarte';
  } else if (level === 2) {
    if (!TOWN_CONTENT_IDS.includes(currentContent)) {
      currentContent = 'treutheim';
    }
  }

  render();

  if (level === 2) maybeTriggerJobSearchDialog();
}

/**
 * Setzt den aktiven Inhaltsbereich. Ortsbezogene IDs synchronisieren
 * dabei navLevel; globale IDs (Geschichte/Quests/Inventar/Chronik)
 * lassen navLevel unverändert, damit der Orts-Bereich darunter
 * erhalten bleibt und man bequem zurückkehren kann.
 * @param {string} id - Content-ID
 */
function showContent(id) {
  const isFirstVisit = navUnseen.hasOwnProperty(id) && navUnseen[id];
  if (isFirstVisit) navUnseen[id] = false;

  currentContent = id;

  if (TOWN_CONTENT_IDS.includes(id)) {
    navLevel = 2;
  }

  // Marktplatz öffnet beim Anwählen über Navigation/Quick-Link immer die
  // Händler-Übersicht (Hub), nicht den zuletzt besuchten Händler.
  if (id === 'marktplatz') {
    marketVendor = null;
  }

  render();

  if (id === 'taverne') maybeTriggerTavernArrivalDialog();
  if (isFirstVisit) maybeShowNavIntro(id);
}

/** Öffnet die Einstellungen, ohne Navigationsebene oder Ort zu ändern. */
function showSettings() {
  currentContent = 'settings';
  render();
}
