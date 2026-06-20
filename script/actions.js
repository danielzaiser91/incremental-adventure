/* ══════════════════════════════════════════════════════════════
   actions.js — Spielaktionen & Story-Trigger
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* Basiswerte pro Arbeitsgang — auch von content.js für die
   Transparenz-Anzeige ("Dauer: ... · Müdigkeit: +...%") genutzt. */
const WORK_TIREDNESS_GAIN      = 15;
const WORK_HUNGER_GAIN         = 8;
const WORK_CLOCK_MINUTES       = 60;
const FOREMAN_BONUS_THRESHOLD  = 10; // Feldarbeiten bis zum Vorarbeiter-Bonus
const FOREMAN_BONUS_GOLD       = 5;  // Einmalige Gold-Gabe beim Auslösen

const NIGHTWATCH_RECOVERY_PENALTY = 0.4; // nächster Schlaf erholt 40% schlechter
const NIGHTWATCH_QUEST_REWARD     = 15;

/* Erfahrungs-Level für die Nachtwache — analog zur Feldarbeit, aber erst
   nach dem Skill "Nächtliche Routine" relevant (siehe experience.js).
   Ohne den Skill bleibt sie auf Stufe 0 (Basis-Lohn), genau wie Feldarbeit
   ohne "Lehrreiche Rückschläge". */
const NIGHTWATCH_LEVEL_THRESHOLDS = [0, 5, 15, 40];
const NIGHTWATCH_LEVELS = [
  { label: 'Unerfahrene Wache',  goldBase: 10 },
  { label: 'Aufmerksame Wache',  goldBase: 13 },
  { label: 'Erfahrene Wache',    goldBase: 17 },
  { label: 'Routinierte Wache',  goldBase: 22 }
];

function getNightWatchLevel(count) {
  if (!skills.nightWatchLeveling) return 0;
  let level = 0;
  for (let i = 1; i < NIGHTWATCH_LEVEL_THRESHOLDS.length; i++) {
    if (count >= NIGHTWATCH_LEVEL_THRESHOLDS[i]) level = i;
  }
  return level;
}

function getNightWatchReward() {
  return NIGHTWATCH_LEVELS[getNightWatchLevel(nightWatchStats.count)].goldBase;
}

/* Schlafqualität je Ort: niedrigerer Faktor heißt, dass eine Nacht die
   Müdigkeit nicht vollständig auf 0% senkt — die Straße ist bewusst die
   schlechteste, kostenlose Option, eine Absteige erholt vollständig.
   Auf der Straße ist anfangs die EINZIGE Option (siehe renderSchlafplatz) —
   erst nachdem die Figur weiß, wie schlecht sich das anfühlt, erscheint
   die Absteige als bewusste Alternative. */
const SLEEP_OPTIONS = [
  {
    id: 'street', name: 'Auf der Straße schlafen', icon: '🌌', cost: 0, quality: 0.6,
    desc: 'Kostenlos, aber hart und kalt. Ich schlafe nie wirklich tief.', hungerPenalty: 10
  },
  {
    id: 'inn', name: 'Schäbige Absteige', icon: '🛏', cost: 5, quality: 1.0,
    desc: 'Ein Strohsack unter einem Dach. Ich erhole mich vollständig.', hungerPenalty: 0,
    requiresFlag: 'firstSleepTriggered'
  }
];

/* ── Sammelplatz: Rohstoffe für Gretas Auftrag (siehe npc.js/market.js) ──
   Bewusst simpel gehalten — fester Ertrag pro Klick, kein eigenes
   Level-System wie bei Feldarbeit/Nachtwache, weil es sich um eine
   befristete Nebenaktivität für EINE Quest handelt, nicht um einen
   dauerhaften Kern-Loop. */
const RESOURCE_GATHER_AMOUNT    = 1;
const RESOURCE_GATHER_TIREDNESS = 5;
const RESOURCE_GATHER_HUNGER    = 3;
const RESOURCE_GATHER_MINUTES   = 20;

const RESOURCE_GATHER_LABELS = { holz: 'Holz hacken', stein: 'Steine sammeln', pflanze: 'Wildkraut sammeln' };
const RESOURCE_GATHER_DESC = {
  holz:    'Junge Bäume am Waldrand — genug für ein paar gute Scheite.',
  stein:   'Geröll am Hang, leicht zu lösen mit der richtigen Spitzhacke.',
  pflanze: 'Wildkraut am Wegrand, das Greta brauchen kann.'
};

/** Sammelt einen Rohstoff am Sammelplatz — erfordert das passende Werkzeug,
    blockiert nachts UND solange `mustEatBread` gilt (auch Sammeln ist
    körperliche Arbeit). */
function gatherResource(resourceId) {
  if (isNight() || gameFlags.mustEatBread) return;
  const tool = TOOL_ITEMS.find(t => t.resource === resourceId);
  if (!tool || (resources.inventory[tool.id] || 0) <= 0) return;

  grantItem(resourceId, RESOURCE_GATHER_AMOUNT);
  adjustTiredness(RESOURCE_GATHER_TIREDNESS);
  adjustHunger(RESOURCE_GATHER_HUNGER);
  advanceClock(RESOURCE_GATHER_MINUTES);

  const resourceName = RESOURCE_ITEMS.find(r => r.id === resourceId).name;
  showToast(`+${RESOURCE_GATHER_AMOUNT} ${resourceName}.`, 'reward');
  render();
}

/* Erfahrungs-Level für Feldarbeit: je öfter verrichtet, desto besser darin.
   `goldBase` verdoppelt sich pro Stufe (1 → 2 → 4 → 8 → 16 → 32), Dauer und
   Müdigkeitskosten sinken gleichzeitig. Die Schwellen für Stufe 4/5 sind
   absichtlich absurd hoch — praktisch unerreichbar ohne ein zukünftiges
   Feature, das den Fortschritt beschleunigt (siehe SKILL.md). */
const WORK_LEVEL_THRESHOLDS = [0, 5, 10, 50, 500000, 100000000];
const WORK_LEVELS = [
  { label: 'Ungeübt',                   goldBase: 1,  durationMod: 1.00, gainMod: 1.00 },
  { label: 'Angehender Feldarbeiter',   goldBase: 2,  durationMod: 0.90, gainMod: 0.75 },
  { label: 'Erfahrener Feldarbeiter',   goldBase: 4,  durationMod: 0.80, gainMod: 0.55 },
  { label: 'Gewiefter Feldarbeiter',    goldBase: 8,  durationMod: 0.65, gainMod: 0.40 },
  { label: 'Meister des Feldes',        goldBase: 16, durationMod: 0.50, gainMod: 0.25 },
  { label: 'Legende der Felder',        goldBase: 32, durationMod: 0.35, gainMod: 0.15 }
];

/** Ermittelt die aktuelle Feldarbeits-Stufe anhand der Gesamtzahl an Durchgängen.
    Ohne den Erfahrungs-Skill "Lehrreiche Rückschläge" (siehe experience.js)
    bleibt Feldarbeit dauerhaft auf Stufe 0 — der Skill ist die Voraussetzung
    dafür, dass Wiederholung überhaupt etwas bewirkt. */
function getWorkLevel(count) {
  if (!skills.jobLeveling) return 0;
  let level = 0;
  for (let i = 1; i < WORK_LEVEL_THRESHOLDS.length; i++) {
    if (count >= WORK_LEVEL_THRESHOLDS[i]) level = i;
  }
  return level;
}

/** Fortschritt innerhalb der aktuellen Stufe (für die Job-Kachel-Anzeige) —
    blendet nach jedem Level-Up sichtbar auf 0% zurück, statt den
    Lebenszeit-Zähler tatsächlich zu nullen (der bestimmt weiterhin die Stufe). */
function getWorkLevelProgress(count) {
  const level = getWorkLevel(count);
  const from  = WORK_LEVEL_THRESHOLDS[level];
  const to    = WORK_LEVEL_THRESHOLDS[level + 1];
  if (to === undefined) return { level, pct: 100, into: count - from, span: 0 };
  return { level, pct: Math.min(100, ((count - from) / (to - from)) * 100), into: count - from, span: to - from };
}

/* ── Abgeleitete Arbeits-Werte (Müdigkeit debufft, blockiert aber nie) ──
   Alle drei nehmen ein optionales `levelOverride`, damit content.js eine
   "Danach"-Vorschau für die nächste Stufe berechnen kann, ohne den
   tatsächlichen Fortschritt zu verändern (siehe renderArbeitsplatz()). */
function getWorkDurationMs(levelOverride) {
  const base = meta.fasterWorkUnlocked ? WORK_DURATION_BASE_MS * 0.6 : WORK_DURATION_BASE_MS;
  const level = WORK_LEVELS[levelOverride ?? getWorkLevel(workStats.count)];
  return Math.round(base * getTirednessTier(needs.tiredness).durationMult * level.durationMod);
}

function getWorkReward(levelOverride) {
  const level = WORK_LEVELS[levelOverride ?? getWorkLevel(workStats.count)];
  let reward = level.goldBase
    + (equipment.hands === 'ledergloves' ? 1 : 0)
    + (equipment.guertel === 'arbeitsguertel' ? 1 : 0)
    + (gameFlags.foremanBonusGiven ? 1 : 0);
  reward *= getHungerTier(needs.hunger).rewardMult; // nur Hunger schwächt den Ertrag, Müdigkeit nur die Dauer
  return Math.max(1, Math.round(reward));
}

/** Wie viel Müdigkeit eine einzelne Arbeit gerade kosten würde (Hunger
    beschleunigt das — der Skill "Eiserner Wille" dämpft diese Beschleunigung
    um die Hälfte, lässt die Basis-Kosten aber unangetastet). */
function getWorkTirednessGain(levelOverride) {
  const level = WORK_LEVELS[levelOverride ?? getWorkLevel(workStats.count)];
  const hungerMult = getHungerTier(needs.hunger).tirednessGainMult;
  const effectiveHungerMult = 1 + (hungerMult - 1) * (skills.ironWill ? 0.5 : 1);
  return Math.round(WORK_TIREDNESS_GAIN * effectiveHungerMult * level.gainMod);
}

/** Wie viel Hunger eine einzelne Arbeit gerade kosten würde — für die
    Job-Info-Panel-Vorschau (siehe content.js). */
function getWorkHungerGain(levelOverride) {
  const level = WORK_LEVELS[levelOverride ?? getWorkLevel(workStats.count)];
  return Math.round(WORK_HUNGER_GAIN * level.gainMod);
}

/* ── Stadttor betreten (State 10100 → 10101) ──────────────── */
function enterCity() {
  storyState = 10101;
  render();
  maybeShowStoryDialog('1.1');
}

/* ── Job-Suche: kleine, ortsgebundene Monolog-Kette zum Auftakt ──────
   Ersetzt den ursprünglich sofort sichtbaren "Arbeitsplatz"-Eintrag:
   die Figur weiß zu Beginn schlicht noch nicht, wo es hier Arbeit gibt,
   und muss sich erst durchfragen (Treutheim betreten → Taverne →
   Wirt). Diese Funktionen sind reine UI-Trigger, kein STORY_ENTRIES-
   Eintrag, weil sie nicht in der Chronik nachlesbar sein müssen. */
function maybeTriggerJobSearchDialog() {
  if (gameFlags.jobSearchDialogShown || storyState < 10101) return;
  gameFlags.jobSearchDialogShown = true;

  showMonologue('Auf Jobsuche', [
    'Wo finde ich hier bloß einen Job?',
    'Die Taverne! Dort weiß man immer, wer Leute sucht.'
  ], render);
}

function maybeTriggerTavernArrivalDialog() {
  if (gameFlags.tavernVisited) return;
  gameFlags.tavernVisited = true;

  showMonologue('In der Taverne', [
    'Stimmen, Gelächter, der Geruch von Bier. Wen frage ich hier wegen Arbeit?',
    'Der Wirt kennt sicher jeden in der Stadt. Er wird wissen, wie ich hier reich werde.'
  ], render);
}

/* Alle vier folgenden "Ersteinblendungs"-Monologe können theoretisch im
   selben Spielzug ausgelöst werden (z.B. die erste Arbeit, die gleichzeitig
   den ersten Hunger-Debuff verursacht). Damit sich Dialoge nie gegenseitig
   überschreiben (showDialog() ersetzt den Overlay-Inhalt sofort), nehmen
   alle einen `onDone`-Callback an: zeigen sie nichts, rufen sie ihn
   sofort auf; zeigen sie etwas, rufen sie ihn erst nach dem Schließen auf.
   Die Aufrufer verketten sie damit nacheinander statt parallel. */

/** Monolog nach der allerersten abgeschlossenen Feldarbeit: enttäuscht, aber
    entschlossen — sieht die Arbeit als notwendigen ersten Schritt, nicht als
    Endstation. */
function maybeTriggerFirstWorkDialog(onDone = () => {}) {
  if (gameFlags.firstWorkDialogShown) { onDone(); return; }
  gameFlags.firstWorkDialogShown = true;

  showMonologue('Erste Schwielen', [
    'Ausgerechnet das. Auf einem Acker schuften, genau wie zuhause.',
    'Aber anders als zuhause ist es hier nur eine Station, kein Lebenslänglich. Ich verdiene Gold, ich werde besser — und irgendwann brauche ich diese Arbeit nicht mehr.',
    'Also gut. Ärmel hoch. Das hier ist mein erster Schritt, nicht mein letzter.'
  ], () => { render(); onDone(); });
}

/** Monolog beim ersten Feldarbeits-Level-Up: motivierend, blickt nach vorn. */
function maybeTriggerFirstLevelUpDialog(onDone = () => {}) {
  if (gameFlags.firstLevelUpDialogShown || getWorkLevel(workStats.count) < 1) { onDone(); return; }
  gameFlags.firstLevelUpDialogShown = true;

  showMonologue('Spürbar besser', [
    'Das ging schon leichter. Meine Hände wissen jetzt, was sie tun.',
    'Wenn ich hier schon besser werde, ohne es zu wollen — was geht erst, wenn ich es wirklich will?',
    'Genug Gold sammeln, dann weiterziehen. Das hier ist nur der Anfang.'
  ], () => { render(); onDone(); });
}

/** Klappt das Level-Effekte-Info-Panel auf der Job-Kachel auf/zu. */
function toggleJobInfoPanel() {
  jobInfoPanelOpen = !jobInfoPanelOpen;
  render();
}

/** Monolog beim ersten Einbruch der Nacht: erklärt die Schlafmechanik UND
    deutet die Nachtwache an. Schaltet außerdem den Schlafplatz frei (siehe
    nav.js/content.js, die auf dasselbe Flag prüfen) — vorher ist Schlafen
    schlicht noch nicht relevant. */
function maybeTriggerFirstNightDialog(onDone = () => {}) {
  if (gameFlags.firstNightDialogShown || !isNight()) { onDone(); return; }
  gameFlags.firstNightDialogShown = true;
  navUnseen.taverne = true; // Mira ist ab jetzt in der Taverne ansprechbar

  showMonologue('Die Nacht bricht an', [
    'Die Sonne ist verschwunden. Es wird kalt, und meine Augen werden schwer.',
    'Ich sollte mir einen Schlafplatz suchen, bevor ich vor Erschöpfung umfalle.',
    'Oder bleibe ich wach? Es heißt, manche verdienen sich nachts ein paar Münzen dazu — wer weiß, was sich im Dunkeln sonst noch tun lässt.'
  ], () => { render(); onDone(); });
}

/** Monolog beim ersten Hunger-Debuff: erklärt, warum Essen jetzt sinnvoll
    wird, und verweist auf den Marktplatz. Schaltet den Marktplatz frei
    (siehe nav.js/content.js) — vorher gibt es schlicht noch keinen Grund,
    dorthin zu gehen. Setzt außerdem `mustEatBread`: ab jetzt blockiert
    Hunger die Arbeit hart, bis tatsächlich etwas gegessen wurde — reines
    Zureden reicht nicht mehr, die Figur muss wirklich zum Krämer. */
function maybeTriggerHungerDialog(onDone = () => {}) {
  if (gameFlags.hungerDialogShown || getHungerTier(needs.hunger).id === 'satt') { onDone(); return; }
  gameFlags.hungerDialogShown = true;
  gameFlags.mustEatBread      = true;

  showMonologue('Hunger', [
    'Mir knurrt der Magen. Das macht sich langsam bemerkbar.',
    'Weiterarbeiten bringt wenig, wenn mir die Kraft fehlt. Ohne etwas im Magen schaffe ich das nicht mehr.',
    'Ich brauche Brot — und das gibt es nur auf dem Marktplatz.'
  ], () => { render(); onDone(); });
}

/** Monolog beim ERSTEN blockierten Arbeitsversuch wegen `mustEatBread` —
    danach reicht ein kurzer Toast (siehe startWork()). */
function maybeTriggerWorkBlockedDialog(onDone = () => {}) {
  if (gameFlags.workBlockedDialogShown || !gameFlags.mustEatBread) { onDone(); return; }
  gameFlags.workBlockedDialogShown = true;

  showMonologue('Zu schwach', [
    'Meine Hände zittern. Ohne etwas im Magen schaffe ich keinen einzigen Spatenstich mehr.',
    'Erst Brot vom Krämer, dann zurück aufs Feld.'
  ], () => { render(); onDone(); });
}

/** Monolog nach der 10. Feldarbeit: lädt nur EIN, gibt noch keine Belohnung.
    Die eigentliche Belohnung (siehe `vorarbeiter`-NPC in npc.js) gibt es erst
    nach einem echten Gespräch in der Taverne — bewusst kein Reflex-Beifall
    "Arbeit Nr. 10 abgeschlossen, hier ist dein Bonus", sondern eine kurze
    Szene mit eigenem Quest-Zustand (`quests.foremanRaise`). */
function maybeTriggerForemanBonusDialog(onDone = () => {}) {
  if (gameFlags.foremanInviteShown || workStats.count < FOREMAN_BONUS_THRESHOLD) { onDone(); return; }
  gameFlags.foremanInviteShown = true;
  quests.foremanRaise.state    = 'active';
  navUnseen.taverne = true; // Der Vorarbeiter wartet jetzt in der Taverne

  showMonologue('Ein Wort des Vorarbeiters', [
    'Nach Feierabend hält mich eine schwielige Hand am Ärmel fest — der Vorarbeiter.',
    '"Du schuftest ordentlich, das ist mir aufgefallen", sagt er. "Komm heute Abend in die Taverne, ich will mit dir reden."'
  ], () => { render(); onDone(); });
}

/* Kurze Ich-Bemerkungen beim allerersten Anklicken eines neu erschienenen
   Nav-Elements (siehe nav.js, `navUnseen`). Jede Stelle, die ein Feature
   per Flag freischaltet, erklärt es bereits an Ort und Stelle per Monolog
   (z.B. maybeTriggerHungerDialog für den Marktplatz) — hier geht es nur um
   die zusätzliche, einheitliche Kurzbemerkung direkt beim ersten Klick auf
   den jeweiligen Nav-Button selbst, unabhängig davon. */
const NAV_INTRO_TEXT = {
  arbeitsplatz: ['Hier also verdiene ich mein Gold — Tag für Tag, Schwiele für Schwiele.'],
  marktplatz:   ['Reihen von Verkaufsständen. Hier müsste es etwas zu essen geben.'],
  schlafplatz:  ['Hier kann ich mich für die Nacht niederlegen.'],
  quests:       ['Aufgaben, die ich angenommen habe, sollte ich im Auge behalten.'],
  inventar:     ['Was ich bei mir trage, sollte ich griffbereit haben.'],
  erfahrung:    ['Hier könnte ich festhalten, was ich aus allem gelernt habe.'],
  rohstoffe:    ['Holz, Stein, Kräuter — wenn ich das hier sammle, kann Greta mehr für mich tun.']
};

/** Zeigt die Kurzbemerkung zu einem Nav-Element, falls eine existiert. */
function maybeShowNavIntro(id) {
  const pages = NAV_INTRO_TEXT[id];
  if (!pages) return;
  showMonologue('Gedanke', pages, render);
}

/* ── Meilenstein-System ───────────────────────────────────── */

/** Prüft nach jedem Gold-Gewinn, ob ein automatischer Story-Trigger ausgelöst wird. */
function checkMilestones() {
  // Ein Fremder beginnt, den Spieler zu beobachten.
  if (
    !gameFlags.milestoneStrangerTriggered &&
    resources.totalGoldEarned >= 10 &&
    storyState === 10101
  ) {
    gameFlags.milestoneStrangerTriggered = true;
    storyState = 10102;
    navUnseen.taverne = true; // Der zwielichtige Mann sitzt jetzt in der Taverne
    render();
    maybeShowStoryDialog('1.2');
  }

  // Der Raub: nimmt das Gold, schaltet aber NUR den "Erfahrung"-Tab frei.
  // Der eigentliche Neuanfang (Reset gegen EP) bleibt eine bewusste
  // Spielerentscheidung — siehe experience.js/startManualReset(). Die Figur
  // selbst zieht hier nur den Schluss, dass Gold allein sie nicht weiterbringt.
  if (
    !gameFlags.robberyTriggered &&
    resources.totalGoldEarned >= GOLD_MILESTONE_THRESHOLD &&
    storyState === 10102
  ) {
    gameFlags.robberyTriggered = true;
    maybeShowStoryDialog('1.4', () => {
      resources.gold = 0;
      gameFlags.resetLayerUnlocked = true;
      render();
      showToast('Mein Gold ist weg. Aber vielleicht kann ich aus alldem trotzdem etwas lernen.', 'event');
    });
  }
}

/* ── Arbeits-System ───────────────────────────────────────── */

/** Startet den Arbeitsvorgang. Müdigkeit blockiert nie hart — Hunger ab dem
    ersten Debuff aber sehr wohl, bis tatsächlich Brot gegessen wurde (siehe
    `mustEatBread`, gesetzt in maybeTriggerHungerDialog(), gelöscht in
    useFood()). Die Nacht blockiert ebenfalls hart, wie schon zuvor. */
function startWork() {
  if (gameFlags.isWorking || isNight()) return;

  if (gameFlags.mustEatBread) {
    maybeTriggerWorkBlockedDialog(() => {
      showToast('Ohne etwas im Magen bringt das nichts. Ich brauche Brot vom Marktplatz.', 'error');
    });
    return;
  }

  gameFlags.isWorking = true;
  workProgress        = 0;
  workStartTime       = Date.now();

  render();
  scheduleWork();
}

function scheduleWork() {
  if (workRafId) cancelAnimationFrame(workRafId);
  workRafId = requestAnimationFrame(animateWork);
}

/**
 * Animations-Loop via requestAnimationFrame.
 * Aktualisiert den Fortschrittsbalken direkt im DOM (kein voller Re-Render).
 */
function animateWork() {
  if (!gameFlags.isWorking) return;

  const elapsed = Date.now() - workStartTime;
  workProgress  = Math.min((elapsed / getWorkDurationMs()) * 100, 100);

  const bar = document.getElementById('progress-bar');
  const lbl = document.getElementById('progress-label');
  if (bar) bar.style.width = workProgress + '%';
  if (lbl) lbl.textContent = Math.floor(workProgress) + '%';

  if (workProgress >= 100) {
    completeWork();
  } else {
    workRafId = requestAnimationFrame(animateWork);
  }
}

/** Wird aufgerufen, wenn der Fortschrittsbalken 100 % erreicht hat. */
function completeWork() {
  if (workRafId) { cancelAnimationFrame(workRafId); workRafId = null; }

  const reward        = getWorkReward();
  const wasHungry      = isStarving();
  const tirednessGain  = getWorkTirednessGain();
  const levelBefore    = getWorkLevel(workStats.count);

  gameFlags.isWorking        = false;
  workProgress               = 0;
  resources.gold            += reward;
  resources.totalGoldEarned += reward;
  workStats.count            += 1;

  adjustHunger(getWorkHungerGain(levelBefore));
  adjustTiredness(tirednessGain);
  advanceClock(WORK_CLOCK_MINUTES);

  const hungryNote = wasHungry ? ' Der Hunger schwächt dich und ermüdet dich schneller.' : '';
  showToast(`+${reward} Gold erhalten (Gesamt: ${resources.gold}).${hungryNote}`, 'reward');

  checkMilestones();
  render();

  // Verkettet statt parallel aufgerufen, damit sich nie zwei dieser
  // Ersteinblendungs-Monologe gegenseitig überschreiben (siehe Kommentar
  // über maybeTriggerFirstWorkDialog).
  maybeTriggerFirstWorkDialog(() => {
    maybeTriggerHungerDialog(() => {
      maybeTriggerFirstLevelUpDialog(() => {
        maybeTriggerForemanBonusDialog(() => {
          maybeTriggerFirstNightDialog();
        });
      });
    });
  });
}

/* ── Nachtwache: einmal pro Nacht verfügbare Alternativ-Aktion ──
   Erst freigeschaltet, nachdem Brakka in der Taverne sie erklärt hat.
   Da auf die Nachtwache ohnehin nur noch Schlaf folgen kann, hat sie
   keine eigene "Dauer" oder Müdigkeit mehr — ihr Preis ist eine
   schlechtere Erholung beim nächsten Schlaf (siehe sleep()). */
function nightWatch() {
  const state = quests.nightWatch.state;
  // Vor der ersten Belohnung durch Brakka ist die Nachtwache nur EIN Mal
  // möglich — danach muss erst berichtet werden, bevor man es wieder tut.
  // Nach der Belohnung ("rewarded") ist sie jede Nacht verfügbar.
  const allowed = state === 'active' || state === 'rewarded';
  if (!isNight() || nightFlags.nightActivityUsedToday || !allowed) return;

  const reward = getNightWatchReward();
  resources.gold            += reward;
  resources.totalGoldEarned += reward;
  nightWatchStats.count     += 1;
  nightFlags.nightActivityUsedToday = true;
  nightFlags.recoveryDebuff         = true;

  if (state === 'active') {
    quests.nightWatch.state = 'done';
    showToast(`Nachtwache gehalten (+${reward} Gold). Erzähl Brakka davon!`, 'reward');
  } else {
    showToast(`Nachtwache gehalten (+${reward} Gold). Ich werde mich danach schlechter erholen.`, 'reward');
  }

  checkMilestones();
  render();
}

/* ── Schlafen: beendet den Spieltag ───────────────────────── */
function sleep(optionId) {
  if (!isNight()) return; // Schlafen ist erst nach Einbruch der Nacht möglich (siehe renderSchlafplatz)

  const option = SLEEP_OPTIONS.find(o => o.id === optionId);
  if (!option) return;
  if (option.requiresFlag && !gameFlags[option.requiresFlag]) return;

  const recoveryMult    = nightFlags.recoveryDebuff ? (1 - NIGHTWATCH_RECOVERY_PENALTY) : 1;
  const tirednessRelief = 100 * recoveryMult * option.quality;

  if (option.cost > 0) {
    if (resources.gold < option.cost) {
      showToast(`Nicht genug Gold für: ${option.name}.`, 'error');
      return;
    }
    resources.gold -= option.cost;
  }
  adjustTiredness(-tirednessRelief);
  if (option.hungerPenalty) adjustHunger(option.hungerPenalty);
  nightFlags.recoveryDebuff = false;

  const isFirstSleep = !gameFlags.firstSleepTriggered;
  gameFlags.firstSleepTriggered = true;

  startNewDay();
  currentContent = 'treutheim';
  navLevel       = 2;

  render();

  const finishMorning = () => maybeTriggerHungerDialog(() => {
    showToast(`Ein neuer Tag beginnt (Tag ${gameClock.day}).`, 'info');
  });

  if (isFirstSleep) maybeShowStoryDialog('1.3', finishMorning);
  else finishMorning();
}
