/* ══════════════════════════════════════════════════════════════
   experience.js — Erfahrung (EP): manueller Neuanfang + Skillbaum
   Der Raub schaltet nur den Tab frei (siehe actions.js,
   checkMilestones()) — der eigentliche Neuanfang ist immer eine
   bewusste, vom Spieler ausgelöste Entscheidung, nie automatisch.
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* Jeder Knoten: `requires` zeigt auf eine andere Skill-ID (Stufe ≥1 davon
   nötig) oder ist `null` (Wurzel, immer kaufbar). `costs[i]` ist der Preis
   für den Aufstieg von Stufe i auf i+1 — bei `maxLevel:1` also `costs[0]`. */
const EP_SKILL_TREE = [
  {
    id: 'jobLeveling', name: 'Lehrreiche Rückschläge', icon: '📘',
    requires: null, maxLevel: 1, costs: [1],
    desc: 'Was ich bei der Arbeit lerne, bleibt nicht wirkungslos.',
    effect: 'Schaltet das Job-Level-System frei — Feldarbeit wird mit Wiederholung besser.'
  },
  {
    id: 'fieldworkMemory', name: 'Geschickte Hände', icon: '🤲',
    requires: 'jobLeveling', maxLevel: 1, costs: [3],
    desc: 'Was meine Hände einmal gelernt haben, vergessen sie nicht mehr.',
    effect: 'Mein Feldarbeits-Level übersteht künftig einen Neuanfang.'
  },
  {
    id: 'ironWill', name: 'Eiserner Wille', icon: '🛡',
    requires: 'fieldworkMemory', maxLevel: 1, costs: [10],
    desc: 'Hunger raubt mir nicht mehr so schnell die letzten Kräfte.',
    effect: 'Hunger beschleunigt den Müdigkeitsaufbau nur noch halb so stark.'
  },
  {
    id: 'nightWatchLeveling', name: 'Nächtliche Routine', icon: '🌒',
    requires: 'ironWill', maxLevel: 1, costs: [4],
    desc: 'Auch die Nacht lehrt mich etwas, wenn ich nur aufmerksam genug bin.',
    effect: 'Schaltet ein Erfahrungs-Level-System für die Nachtwache frei.'
  },
  {
    id: 'thrift', name: 'Sparsamkeit', icon: '🪙',
    requires: 'jobLeveling', maxLevel: 2, costs: [10, 16],
    desc: 'Ich weiß inzwischen, wo man beim Krämer ein gutes Wort einlegt.',
    effect: 'Marktplatz-Preise −10 % je Stufe (max. −20 %).'
  },
  {
    id: 'clearMind', name: 'Klarer Kopf', icon: '🧠',
    requires: 'thrift', maxLevel: 1, costs: [8],
    desc: 'Je öfter ich neu anfange, desto klarer sehe ich, was wirklich zählt.',
    effect: '+1 Erfahrung bei jedem zukünftigen Neuanfang.'
  },
  {
    id: 'goldBreakthrough', name: 'Weitblick', icon: '📈',
    requires: 'clearMind', maxLevel: 1, costs: [15],
    desc: 'Ich verstehe jetzt, dass mehr zurückgelassenes Gold auch mehr lehrt — nicht nur, OB ich eine Grenze überschritten habe.',
    effect: `Bei einem Neuanfang zählt jeder erreichte Gold-Meilenstein (${GOLD_MILESTONE_THRESHOLD}, ${GOLD_MILESTONE_THRESHOLD * 2}, ${GOLD_MILESTONE_THRESHOLD * 4}, …) als zusätzliche Erfahrung.`
  }
];

/* Die zwei Äste des Baums, von der Wurzel "Lehrreiche Rückschläge" aus
   nach unten wachsend (siehe renderSkillTree()): Arbeit (links) und
   Wirtschaft (rechts). Jeder Eintrag ist nur sichtbar, sobald sein
   Vorgänger erlernt wurde — die Wurzel selbst ist immer sichtbar. */
const EP_TREE_LEFT_BRANCH  = ['fieldworkMemory', 'ironWill', 'nightWatchLeveling'];
const EP_TREE_RIGHT_BRANCH = ['thrift', 'clearMind', 'goldBreakthrough'];

/* Mindest-Gold für überhaupt irgendeine Erfahrung bei einem (nicht-ersten)
   Neuanfang — bewusst identisch mit der Raub-Schwelle (siehe state.js):
   wer so viel Gold hat wie der Räuber für einen Überfall braucht, hat
   genug riskiert, um daraus etwas zu lernen. Ohne "Weitblick" bleibt der
   Gewinn trotz mehr Gold bei genau 1 EP (+1 mit "Klarer Kopf") gekappt —
   erst der Skill macht aus zusätzlichem Gold zusätzliche Erfahrung, über
   exponentiell wachsende Meilensteine. */
const RESET_MIN_GOLD = GOLD_MILESTONE_THRESHOLD;
const EP_GOLD_BREAKPOINTS = [1, 2, 4, 8, 16, 32, 64, 128].map(f => GOLD_MILESTONE_THRESHOLD * f);

/** Liefert die aktuelle Stufe eines Skills (0 = noch nicht erlernt). */
function getSkillLevel(id) {
  return typeof skills[id] === 'number' ? skills[id] : (skills[id] ? 1 : 0);
}

function setSkillLevel(id, level) {
  if (typeof skills[id] === 'number') skills[id] = level;
  else skills[id] = level >= 1;
}

/** Marktplatz-Preis-Multiplikator durch den Skill "Sparsamkeit". */
function getThriftMult() {
  return 1 - getSkillLevel('thrift') * 0.10;
}

/** Wendet den Sparsamkeits-Rabatt an und rundet auf min. 1 Gold. */
function applyThrift(cost) {
  return Math.max(1, Math.round(cost * getThriftMult()));
}

/** Kauft die nächste Stufe eines Skills, falls Voraussetzung + EP reichen. */
function buyNextSkillLevel(id) {
  const node = EP_SKILL_TREE.find(n => n.id === id);
  if (!node) return;

  const level = getSkillLevel(id);
  if (level >= node.maxLevel) return;
  if (node.requires && getSkillLevel(node.requires) < 1) return;

  const cost = node.costs[level];
  if (experience.points < cost) {
    showToast(`Nicht genug Erfahrung — benötigt: ${cost} EP.`, 'error');
    return;
  }

  experience.points -= cost;
  setSkillLevel(id, level + 1);

  const levelNote = node.maxLevel > 1 ? ` (Stufe ${level + 1})` : '';
  showToast(`${node.name}${levelNote} erlernt.`, 'event');
  render();
}

/** EP-Gewinn eines Neuanfangs. Der allererste gibt IMMER genau 1 EP,
    unabhängig vom gesammelten Gold. Danach gilt: unter RESET_MIN_GOLD gibt
    es nichts (geschenktes/zu wenig Gold lehrt nichts). Ab der Schwelle ist
    der Gewinn ohne "Weitblick" auf 1 EP gekappt, egal wie viel mehr Gold
    es ist — erst der Skill lässt jeden weiteren erreichten Meilenstein
    zusätzlich zählen. */
function computeEpGain(isFirstReset) {
  if (isFirstReset) return 1;
  if (resources.gold < RESET_MIN_GOLD) return 0;

  let gain = skills.goldBreakthrough
    ? EP_GOLD_BREAKPOINTS.filter(bp => resources.gold >= bp).length
    : 1;
  if (skills.clearMind) gain += 1;
  return gain;
}

/** Nächste Gold-Schwelle, ab der ein Neuanfang einen zusätzlichen EP
    abwerfen würde — für die Anzeige im Erfahrungs-Tab. `null` heißt:
    entweder bereits der höchste Meilenstein erreicht, oder (ohne
    "Weitblick") schlicht gekappt, solange die Mindestschwelle erfüllt ist. */
function getNextEpGoldTarget() {
  if (resources.gold < RESET_MIN_GOLD) return RESET_MIN_GOLD;
  if (!skills.goldBreakthrough) return null;
  return EP_GOLD_BREAKPOINTS.find(bp => bp > resources.gold) ?? null;
}

/** Tauscht das gesamte Gold gegen Erfahrung und beginnt von vorn. */
function performManualReset() {
  const isFirstReset = meta.resets === 0;
  const epGain = computeEpGain(isFirstReset);

  meta.resets += 1;
  meta.fasterWorkUnlocked = true;
  experience.points      += epGain;
  experience.totalEarned += epGain;

  resources.gold = 0;
  if (!skills.fieldworkMemory) workStats.count = 0;
  nightWatchStats.count = 0; // Nachtwache-Routine kennt (noch) kein Memory-Pendant
  if (storyState < 20100) storyState = 20100;
  currentContent = 'erfahrung';
  navLevel       = 0;

  render();
  showToast(`+${epGain} Erfahrung gewonnen. Mein Gold ist fort, aber das Gelernte bleibt.`, 'event');
}

/** Startet den Neuanfang — beim allerersten Mal mit ausführlicher
    Erklärung, danach nur noch mit kurzer Bestätigung. */
function startManualReset() {
  const isFirstReset = meta.resets === 0;
  const epGain = computeEpGain(isFirstReset);

  const showConfirm = () => showDialog({
    title: 'Neu anfangen?',
    text: [
      epGain > 0
        ? `Ich gebe mein gesamtes Gold auf und beginne von vorn. Dafür erhalte ich ${epGain} Erfahrung.`
        : 'Ich habe ohnehin nichts, das sich gegen Erfahrung eintauschen ließe — noch nicht.'
    ],
    buttons: epGain > 0
      ? [
          { label: 'Doch nicht.', onClick: () => closeDialog() },
          { label: 'Ja. Neu anfangen.', onClick: () => closeDialog(performManualReset) }
        ]
      : [{ label: 'Verstanden.', onClick: () => closeDialog() }]
  });

  if (!gameFlags.firstManualResetExplained) {
    gameFlags.firstManualResetExplained = true;
    showMonologue('Ein neuer Anfang', [
      'Mein Gold ist weg, kaum dass ich es verdient hatte. Münzen kann man mir nehmen.',
      'Aber was ich gelernt habe — wie man zupackt, wie man durchhält — das bleibt. Vielleicht sollte ich genau darauf setzen.',
      'Wenn ich jetzt alles aufgebe, was ich besitze, und ganz neu anfange — bringt mich das weiter, als es das Gold je könnte?'
    ], showConfirm);
  } else {
    showConfirm();
  }
}

/** Baut die Karte EINES Skill-Knotens. Wird nur für bereits SICHTBARE
    Knoten aufgerufen (siehe renderSkillTree()) — "gesperrt wegen fehlender
    Voraussetzung" kommt hier nicht mehr vor, weil unsichtbare Knoten gar
    nicht erst gerendert werden. */
function epNodeCardHtml(node) {
  const level = getSkillLevel(node.id);
  const maxed = level >= node.maxLevel;
  const cost  = maxed ? null : node.costs[level];
  const canBuy = !maxed && experience.points >= cost;
  const levelLabel = node.maxLevel > 1 ? ` (Stufe ${level}/${node.maxLevel})` : '';

  const buttonHtml = maxed
    ? `<button class="action-btn btn-disabled" disabled>Erworben ✓</button>`
    : `<button class="action-btn ${canBuy ? '' : 'btn-disabled'}" onclick="buyNextSkillLevel('${node.id}')" ${canBuy ? '' : 'disabled'}>Erlernen (${cost} EP)</button>`;

  return `
    <div class="action-card skill-node-card${maxed ? ' quest-card-done' : ''}">
      <div class="action-card-icon">${node.icon}</div>
      <div class="action-card-name">${node.name}${levelLabel}</div>
      <p class="action-card-desc">${node.desc}</p>
      <div class="action-card-effect">${node.effect}</div>
      ${buttonHtml}
    </div>`;
}

/**
 * Baut den Skillbaum als echten Baum: Wurzel oben zentral, darunter Zeile
 * für Zeile zwei Äste (Arbeit links, Wirtschaft rechts). Eine Zeile (und
 * ihre Verbindungslinien) erscheint erst, sobald mindestens einer ihrer
 * beiden Vorgänger erlernt wurde — pro Spalte unabhängig, siehe User-
 * Vorgabe: "Lernt man Geschickte Hände, wird Eiserner Wille sichtbar".
 */
function renderSkillTree() {
  const root = EP_SKILL_TREE.find(n => n.id === 'jobLeveling');
  let html = `<div class="skill-tree">
    <div class="skill-tree-row-root">${epNodeCardHtml(root)}</div>`;

  for (let i = 0; i < EP_TREE_LEFT_BRANCH.length; i++) {
    const leftNode  = EP_SKILL_TREE.find(n => n.id === EP_TREE_LEFT_BRANCH[i]);
    const rightNode = EP_SKILL_TREE.find(n => n.id === EP_TREE_RIGHT_BRANCH[i]);
    const leftVisible  = getSkillLevel(leftNode.requires) >= 1;
    const rightVisible = getSkillLevel(rightNode.requires) >= 1;
    if (!leftVisible && !rightVisible) break; // Kette endet hier auf beiden Seiten

    html += i === 0
      // Direkt unter der Wurzel verzweigt sich EIN Stamm in zwei Äste —
      // an dieser Stelle sind beide Spalten IMMER gleichzeitig sichtbar
      // (beide hängen an derselben Wurzel), daher feste Gabel-Grafik.
      ? `<div class="skill-connector skill-connector-fork">
           <div class="stl-stem-top"></div><div class="stl-bar"></div>
           <div class="stl-stem-left"></div><div class="stl-stem-right"></div>
         </div>`
      // Tiefere Zeilen sind reine Kettenfortsetzungen je Spalte, unabhängig
      // voneinander — daher pro Spalte eine eigene, ggf. fehlende Linie.
      : `<div class="skill-connector skill-connector-plain">
           <div class="stl-stem ${leftVisible ? '' : 'stl-stem-hidden'}"></div>
           <div class="stl-stem ${rightVisible ? '' : 'stl-stem-hidden'}"></div>
         </div>`;

    html += `<div class="skill-tree-row">
      <div class="skill-tree-cell">${leftVisible ? epNodeCardHtml(leftNode) : ''}</div>
      <div class="skill-tree-cell">${rightVisible ? epNodeCardHtml(rightNode) : ''}</div>
    </div>`;
  }

  return html + `</div>`;
}

/* ── Erfahrungs-Seite ─────────────────────────────────────── */
function renderErfahrung(el) {
  const isFirstReset = meta.resets === 0;
  const epGain = computeEpGain(isFirstReset);
  const canReset = isFirstReset || epGain > 0;

  let epEffectText;
  if (isFirstReset) {
    epEffectText = '+1 Erfahrung (erster Neuanfang)';
  } else if (resources.gold < RESET_MIN_GOLD) {
    epEffectText = `Noch ${RESET_MIN_GOLD - resources.gold} Gold bis zum ersten Erfahrungspunkt`;
  } else if (!skills.goldBreakthrough) {
    epEffectText = `+${epGain} Erfahrung — mehr Gold allein hilft mir ohne mehr Weitblick nicht weiter`;
  } else {
    const nextTarget = getNextEpGoldTarget();
    epEffectText = `+${epGain} Erfahrung` +
      (nextTarget ? ` — noch ${nextTarget - resources.gold} Gold bis zum nächsten Punkt` : ' (höchster Meilenstein erreicht)');
  }

  const resetCard = `
    <div class="action-card action-card-primary">
      <div class="action-card-icon">✦</div>
      <div class="action-card-name">Neu anfangen</div>
      <p class="action-card-desc">
        Ich gebe alles auf, was ich besitze — und behalte trotzdem, was ich daraus gelernt habe.
      </p>
      <div class="action-card-effect">${epEffectText}</div>
      <button class="action-btn action-btn-primary ${canReset ? '' : 'btn-disabled'}" onclick="startManualReset()" ${canReset ? '' : 'disabled'}>
        Neu anfangen
      </button>
    </div>`;

  let lifeLessonsSection = '';
  if (gameFlags.foremanBonusGiven) {
    lifeLessonsSection = `
      <div class="market-section-label" style="margin-top: 24px;">Was das Leben mich gelehrt hat</div>
      <div class="action-grid">
        <div class="action-card quest-card-done">
          <div class="action-card-icon">🍺</div>
          <div class="action-card-name">Anerkennung des Vorarbeiters</div>
          <p class="action-card-desc">Harte Arbeit ist dem Vorarbeiter aufgefallen — und er hat ein gutes Wort für mich eingelegt.</p>
          <div class="action-card-effect">+1 Gold pro Feldarbeit, dauerhaft</div>
        </div>
      </div>`;
  }

  const treeSection = meta.resets > 0
    ? `<div class="market-section-label" style="margin-top: 24px;">Was ich bewusst gelernt habe</div>${renderSkillTree()}`
    : '';

  el.innerHTML = `
    <div class="feature-stage">
      <div class="feature-stage-label">Erfahrung</div>
      <p class="location-card-desc" style="max-width: 480px; margin-bottom: 4px;">
        Was nützt mir noch Gold, das mir ohnehin gestohlen werden kann? Vielleicht sollte ich
        lieber in mich selbst investieren — Fähigkeiten, die mir niemand wegnehmen kann.
      </p>
      <div class="reward-info" style="margin-bottom: 18px;">
        Erfahrung: <span class="gold-amount">${experience.points} EP</span>
      </div>
      <div class="action-grid">${resetCard}</div>
      ${lifeLessonsSection}
      ${treeSection}
    </div>
  `;
}
