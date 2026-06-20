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
    // `extraLock` ist eine zusätzliche Bedingung NEBEN der normalen
    // Ast-Voraussetzung — der Knoten ist (über `ironWill`) zwar sichtbar,
    // aber erst kaufbar, nachdem Kommandant Roswald den Lehrgang gegeben
    // hat (siehe npc.js, NPC "kommandant"). So bleibt die Sichtbarkeits-
    // Logik des Baums unverändert, während der Kauf selbst zusätzlich an
    // ein Story-Ereignis gebunden ist.
    id: 'nightWatchLeveling', name: 'Nächtliche Routine', icon: '🌒',
    requires: 'ironWill', maxLevel: 1, costs: [4],
    desc: 'Auch die Nacht lehrt mich etwas, wenn ich nur aufmerksam genug bin.',
    effect: 'Schaltet ein Erfahrungs-Level-System für die Nachtwache frei.',
    extraLock: () => quests.commanderTraining.state !== 'rewarded',
    extraLockReason: 'Erfordert die Unterweisung durch Kommandant Roswald'
  },
  {
    id: 'inventoryKeeper', name: 'Fest verschnürt', icon: '🎒',
    requires: 'jobLeveling', maxLevel: 1, costs: [12],
    desc: 'Was ich mir mühsam zusammengetragen habe, lasse ich nicht einfach so zurück.',
    effect: 'Inventar UND Ausrüstung überstehen künftig einen Neuanfang.'
  },
  {
    id: 'sleepLikeARock', name: 'Ich schlafe wie ein Stein', icon: '🪨',
    requires: 'inventoryKeeper', maxLevel: 1, costs: [10],
    desc: 'Man sagt mir nach, ich schlafe wie ein Stein — früher war das kein Kompliment. Inzwischen hilft es mir.',
    effect: '+1 Schlafqualitäts-Stufe an jedem Schlafplatz (max. 3/3).'
  },
  {
    id: 'thrift', name: 'Sparsamkeit', icon: '🪙',
    requires: 'jobLeveling', maxLevel: 2, costs: [4, 8],
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
  },
  {
    // Einziger Knoten, der BEIDE Äste als Voraussetzung hat (`requiresAll`
    // statt `requires`) UND zusätzlich Gold statt nur EP kostet
    // (`goldCosts`) — siehe buyNextSkillLevel()/epNodeCardHtml(). Schaltet
    // keinen Spielmechanik-Bonus frei, sondern eine Story-Konsequenz: Brakka
    // erklärt danach endlich den Weg zur Abenteurergilde (siehe npc.js).
    id: 'guildPrep', name: 'Vorbereitung auf die Gilde', icon: '⚔',
    requiresAll: ['nightWatchLeveling', 'goldBreakthrough'], maxLevel: 1, costs: [100], goldCosts: [1000],
    desc: 'Reichtum und Routine allein machen noch keinen Abenteurer — aber sie sind ein Anfang.',
    effect: 'Schaltet den Weg zur Abenteurergilde frei. Brakka weiß mehr darüber.'
  }
];

/* Die Äste des Baums, von der Wurzel "Lehrreiche Rückschläge" aus nach
   unten wachsend (siehe renderSkillTree()): Arbeit (links), Besitz
   (Mitte), Wirtschaft (rechts). Jeder Eintrag ist nur sichtbar, sobald
   sein Vorgänger erlernt wurde — die Wurzel selbst ist immer sichtbar.
   Äste dürfen unterschiedlich lang sein (siehe Mitte, nur 2 Einträge) —
   renderSkillTree() iteriert bis zur längsten Kette und lässt kürzere
   Äste einfach leer auslaufen. */
const EP_TREE_BRANCHES = [
  ['fieldworkMemory', 'ironWill', 'nightWatchLeveling'],
  ['inventoryKeeper', 'sleepLikeARock'],
  ['thrift', 'clearMind', 'goldBreakthrough']
];

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

/** Liefert die Liste der Voraussetzungs-Skill-IDs eines Knotens — ein
    einzelner Ast normalerweise (`requires`), oder beide Äste bei einem
    Konvergenz-Knoten wie "guildPrep" (`requiresAll`). */
function getNodeRequirements(node) {
  return node.requiresAll || (node.requires ? [node.requires] : []);
}

/** Kauft die nächste Stufe eines Skills, falls Voraussetzung(en) sowie EP
    (und ggf. Gold, siehe `goldCosts`) reichen. */
function buyNextSkillLevel(id) {
  const node = EP_SKILL_TREE.find(n => n.id === id);
  if (!node) return;

  const level = getSkillLevel(id);
  if (level >= node.maxLevel) return;
  if (getNodeRequirements(node).some(reqId => getSkillLevel(reqId) < 1)) return;
  if (typeof node.extraLock === 'function' && node.extraLock()) return;

  const epCost   = node.costs[level];
  const goldCost = node.goldCosts ? node.goldCosts[level] : 0;
  if (experience.points < epCost) {
    showToast(`Nicht genug Erfahrung — benötigt: ${epCost} EP.`, 'error');
    return;
  }
  if (resources.gold < goldCost) {
    showToast(`Nicht genug Gold — benötigt: ${goldCost} Gold.`, 'error');
    return;
  }

  experience.points -= epCost;
  resources.gold    -= goldCost;
  setSkillLevel(id, level + 1);

  // "guildPrep" hat keinen Spielmechanik-Effekt, sondern stößt direkt
  // Brakkas Gilden-Questkette an (siehe npc.js).
  if (id === 'guildPrep') {
    quests.guildRegistration.state = 'active';
    navUnseen.taverne = true;
  }

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
  if (!skills.inventoryKeeper) {
    // Ausrüstung MUSS vor dem Leeren von resources.inventory abgelegt
    // werden, sonst zeigt equipment.* danach auf eine ID, die es im
    // (jetzt leeren) Inventar nie mehr gab — kein Bug, aber ein
    // inkonsistenter Zustand, den equipItem()/unequipItem() so nie
    // erzeugen würden.
    equipment = { hands: null, guertel: null };
    resources.inventory = {};
    overflowBag = {};
  }
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

  // Die ausführliche Erklärung kommt immer beim 1. Mal (Bildung, kein
  // Sicherheits-Schritt). Der eigentliche Bestätigungsdialog danach ist
  // optional — siehe Einstellungen, "Vor Neuanfang warnen".
  const proceed = () => {
    if (settings.warnBeforeReset.erfahrung) showConfirm();
    else performManualReset();
  };

  if (!gameFlags.firstManualResetExplained) {
    gameFlags.firstManualResetExplained = true;
    showMonologue('Ein neuer Anfang', [
      'Mein Gold ist weg, kaum dass ich es verdient hatte. Münzen kann man mir nehmen.',
      'Aber was ich gelernt habe — wie man zupackt, wie man durchhält — das bleibt. Vielleicht sollte ich genau darauf setzen.',
      'Wenn ich jetzt alles aufgebe, was ich besitze, und ganz neu anfange — bringt mich das weiter, als es das Gold je könnte?'
    ], proceed);
  } else {
    proceed();
  }
}

/** Schaltet um, ob vor einem Neuanfang dieser Reset-"Ebene" noch ein
    Bestätigungsdialog kommt (siehe Einstellungen). */
function toggleResetWarning(id) {
  settings.warnBeforeReset[id] = !settings.warnBeforeReset[id];
  render();
}

/** Baut die Karte EINES Skill-Knotens. Wird nur für bereits SICHTBARE
    Knoten aufgerufen (siehe renderSkillTree()) — "gesperrt wegen fehlender
    Voraussetzung" kommt hier nicht mehr vor, weil unsichtbare Knoten gar
    nicht erst gerendert werden. */
function epNodeCardHtml(node) {
  const level = getSkillLevel(node.id);
  const maxed = level >= node.maxLevel;
  const epCost   = maxed ? null : node.costs[level];
  const goldCost = maxed ? null : (node.goldCosts ? node.goldCosts[level] : 0);
  const extraLocked = !maxed && typeof node.extraLock === 'function' && node.extraLock();
  const canBuy = !maxed && !extraLocked && experience.points >= epCost && resources.gold >= goldCost;
  const levelLabel = node.maxLevel > 1 ? ` (Stufe ${level}/${node.maxLevel})` : '';
  const costLabel = goldCost ? `${epCost} EP + ${goldCost} Gold` : `${epCost} EP`;

  let buttonHtml;
  if (maxed) {
    buttonHtml = `<button class="action-btn btn-disabled" disabled>Erworben ✓</button>`;
  } else if (extraLocked) {
    buttonHtml = `<button class="action-btn btn-disabled" disabled>🔒 ${node.extraLockReason}</button>`;
  } else {
    buttonHtml = `<button class="action-btn ${canBuy ? '' : 'btn-disabled'}" onclick="buyNextSkillLevel('${node.id}')" ${canBuy ? '' : 'disabled'}>Erlernen (${costLabel})</button>`;
  }

  return `
    <div class="action-card skill-node-card${maxed ? ' quest-card-done' : ''}">
      <div class="action-card-icon">${node.icon}</div>
      <div class="action-card-name">${node.name}${levelLabel}</div>
      <p class="action-card-desc">${node.desc}</p>
      <div class="action-card-effect">${node.effect}</div>
      ${buttonHtml}
    </div>`;
}

/** Mittelpunkt einer von `total` gleich breiten Spalten, in Prozent —
    einzige Stelle, die "wo sitzt Spalte i" in eine Koordinate übersetzt,
    damit Fork-/Kettenlinien und Konvergenz-Linien dieselbe Geometrie
    benutzen, unabhängig von der Anzahl der Äste. */
function columnCenterPct(index, total) {
  return ((index + 0.5) / total) * 100;
}

/**
 * Baut den Skillbaum als echten Baum: Wurzel oben zentral, darunter Zeile
 * für Zeile N gleich breite Äste (siehe EP_TREE_BRANCHES). Eine Zeile (und
 * ihre Verbindungslinien) erscheint erst, sobald mindestens einer ihrer
 * Vorgänger erlernt wurde — pro Spalte unabhängig, siehe User-Vorgabe:
 * "Lernt man Geschickte Hände, wird Eiserner Wille sichtbar". Äste dürfen
 * unterschiedlich lang sein; kürzere laufen einfach leer aus.
 */
function renderSkillTree() {
  const total = EP_TREE_BRANCHES.length;
  const root = EP_SKILL_TREE.find(n => n.id === 'jobLeveling');
  let html = `<div class="skill-tree">
    <div class="skill-tree-row-root">${epNodeCardHtml(root)}</div>`;

  const maxRows = Math.max(...EP_TREE_BRANCHES.map(b => b.length));

  for (let row = 0; row < maxRows; row++) {
    const rowNodes = EP_TREE_BRANCHES.map(branch =>
      branch[row] ? EP_SKILL_TREE.find(n => n.id === branch[row]) : null);
    const visible = rowNodes.map(node => !!node && getSkillLevel(node.requires) >= 1);
    if (!visible.some(Boolean)) break; // Kette endet hier auf allen Spalten

    if (row === 0) {
      // Direkt unter der Wurzel verzweigt sich EIN Stamm in alle Äste auf
      // einmal — sie hängen alle an derselben Wurzel, werden also immer
      // gleichzeitig sichtbar, sobald diese erlernt ist.
      const stems = rowNodes.map((node, i) => node
        ? `<div class="stl-stem" style="left:${columnCenterPct(i, total)}%; top:11px; bottom:0;"></div>` : '').join('');
      html += `<div class="skill-connector">
        <div class="stl-stem" style="left:50%; top:0; height:11px;"></div>
        <div class="stl-bar" style="left:${columnCenterPct(0, total)}%; right:${100 - columnCenterPct(total - 1, total)}%; top:11px;"></div>
        ${stems}
      </div>`;
    } else {
      // Tiefere Zeilen sind reine Kettenfortsetzungen je Spalte, unabhängig
      // voneinander — daher pro Spalte eine eigene, ggf. fehlende Linie.
      const stems = visible.map((v, i) => v
        ? `<div class="stl-stem" style="left:${columnCenterPct(i, total)}%;"></div>` : '').join('');
      html += `<div class="skill-connector">${stems}</div>`;
    }

    const cells = rowNodes.map((node, i) =>
      `<div class="skill-tree-cell">${visible[i] ? epNodeCardHtml(node) : ''}</div>`).join('');
    html += `<div class="skill-tree-row" style="grid-template-columns: repeat(${total}, 1fr);">${cells}</div>`;
  }

  // Konvergenz-Knoten: erscheint erst, sobald ALLE Voraussetzungen erlernt
  // sind — gespiegelte Gabel-Grafik (zwei Stämme aus ihren jeweiligen
  // Ästen laufen zu einem zusammen).
  const guildNode = EP_SKILL_TREE.find(n => n.id === 'guildPrep');
  const guildReqs = getNodeRequirements(guildNode);
  const guildVisible = guildReqs.every(reqId => getSkillLevel(reqId) >= 1);
  if (guildVisible) {
    const idxA = EP_TREE_BRANCHES.findIndex(b => b.includes(guildReqs[0]));
    const idxB = EP_TREE_BRANCHES.findIndex(b => b.includes(guildReqs[1]));
    const pctA = columnCenterPct(idxA, total);
    const pctB = columnCenterPct(idxB, total);
    html += `<div class="skill-connector">
               <div class="stl-stem" style="left:${pctA}%; top:0; height:11px;"></div>
               <div class="stl-stem" style="left:${pctB}%; top:0; height:11px;"></div>
               <div class="stl-bar" style="left:${pctA}%; right:${100 - pctB}%; top:11px;"></div>
               <div class="stl-stem" style="left:50%; top:11px; bottom:0;"></div>
             </div>
             <div class="skill-tree-row-root">${epNodeCardHtml(guildNode)}</div>`;
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

  const hasTree    = meta.resets > 0;
  const hasLessons = gameFlags.foremanBonusGiven;

  const lifeLessonsHtml = () => `
    <div class="action-grid">
      <div class="action-card quest-card-done">
        <div class="action-card-icon">🍺</div>
        <div class="action-card-name">Anerkennung des Vorarbeiters</div>
        <p class="action-card-desc">Harte Arbeit ist dem Vorarbeiter aufgefallen — und er hat ein gutes Wort für mich eingelegt.</p>
        <div class="action-card-effect">+1 Gold pro Feldarbeit, dauerhaft</div>
      </div>
    </div>`;

  // Beide Bereiche gleichzeitig sichtbar → echte Tabs zum Umschalten
  // (siehe erfahrungTab, state.js). Ist nur einer der beiden relevant,
  // braucht es keine Tab-Leiste — eine einzelne Sektion reicht.
  let lowerSection = '';
  if (hasTree && hasLessons) {
    lowerSection = `
      <div class="tab-bar" style="margin-top: 24px;">
        <button class="tab-btn ${erfahrungTab === 'skills' ? 'active' : ''}" onclick="setErfahrungTab('skills')">Skillbaum</button>
        <button class="tab-btn ${erfahrungTab === 'lessons' ? 'active' : ''}" onclick="setErfahrungTab('lessons')">Was das Leben mich gelehrt hat</button>
      </div>
      <div class="tab-panel">${erfahrungTab === 'skills' ? renderSkillTree() : lifeLessonsHtml()}</div>`;
  } else if (hasTree) {
    lowerSection = `<div class="market-section-label" style="margin-top: 24px;">Was ich bewusst gelernt habe</div>${renderSkillTree()}`;
  } else if (hasLessons) {
    lowerSection = `<div class="market-section-label" style="margin-top: 24px;">Was das Leben mich gelehrt hat</div>${lifeLessonsHtml()}`;
  }

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
      ${lowerSection}
    </div>
  `;
}

/** Wechselt zwischen Skillbaum und "Was das Leben mich gelehrt hat". */
function setErfahrungTab(tab) {
  erfahrungTab = tab;
  render();
}
