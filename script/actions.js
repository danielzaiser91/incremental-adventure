/* ══════════════════════════════════════════════════════════════
   actions.js — Spielaktionen & Story-Trigger
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* Basiswerte pro Arbeitsgang — auch von content.js für die
   Transparenz-Anzeige ("Dauer: ... · Müdigkeit: +...%") genutzt. Hunger
   und Müdigkeit haben bewusst denselben Basiswert: Ziel ist, dass beide
   nach genau 4 Durchgängen denselben Ziel-Prozentsatz erreichen (siehe
   WORK_LEVELS.gainMod — 50% auf Stufe 0, danach −10%-Punkte je Stufe). */
const WORK_TIREDNESS_GAIN      = 12.5;
const WORK_HUNGER_GAIN         = 12.5;
const WORK_CLOCK_MINUTES       = 60;
const FOREMAN_BONUS_THRESHOLD  = 10; // Feldarbeiten bis zum Vorarbeiter-Bonus
const FOREMAN_BONUS_GOLD       = 5;  // Einmalige Gold-Gabe beim Auslösen

const NIGHTWATCH_RECOVERY_PENALTY = 0.4; // nächster Schlaf erholt 40% schlechter
/** Gibt 0 zurück wenn nightWatchLeveling_super aktiv (kein Debuff mehr). */
function getNightWatchRecoveryPenalty() {
  return superSkills.nightWatchLeveling_super ? 0 : NIGHTWATCH_RECOVERY_PENALTY;
}
const NIGHTWATCH_QUEST_REWARD     = 15;
const COMMANDER_INVITE_THRESHOLD  = 3; // Nachtwachen bis zur Einladung des Kommandanten

/* Erfahrungs-Level für die Nachtwache — analog zur Feldarbeit, aber erst
   nach dem Skill "Nächtliche Routine" relevant (siehe experience.js).
   Ohne den Skill bleibt sie auf Stufe 0 (Basis-Lohn), genau wie Feldarbeit
   ohne "Lehrreiche Rückschläge". Bewusst nur 3 Stufen (5x/10x Nachtwache) —
   die Stadtwache ist (noch) eine Nebentätigkeit, kein eigener Karriereweg. */
const NIGHTWATCH_LEVEL_THRESHOLDS = [0, 5, 10];
const NIGHTWATCH_LEVELS = [
  { label: 'Unerfahrene Wache', goldBase: 10 },
  { label: 'Erfahrene Wache',   goldBase: 14 },
  { label: 'Routinierte Wache', goldBase: 20 }
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

/* ── Stadtwache ─────────────────────────────────────────────
   Tagesjob in Kapitel 2 — modelliert analog zur Feldarbeit,
   aber mit eigenem Level-System und höherem Grundlohn.        */
const STADTWACHE_DURATION_BASE_MS  = 3500; // Basis-Dauer einer Schicht in Echtzeit-ms
const STADTWACHE_CLOCK_MINUTES     = 480;  // 8 Spielstunden pro Schicht
const STADTWACHE_TIREDNESS_GAIN    = 20;   // Basis-Müdigkeitsanstieg pro Schicht
const STADTWACHE_HUNGER_GAIN       = 15;   // Basis-Hungeranstieg pro Schicht

const STADTWACHE_LEVEL_THRESHOLDS = [0, 5, 20, 75, 500000, 100000000];
const STADTWACHE_LEVELS = [
  { label: 'Neuling',           goldBase: 25, durationMod: 1.4, gainMod: 1.3 },
  { label: 'Anwärter',          goldBase: 28, durationMod: 1.2, gainMod: 1.1 },
  { label: 'Wachmann',          goldBase: 30, durationMod: 1.0, gainMod: 1.0 },
  { label: 'Erfahrener Wächter',goldBase: 33, durationMod: 0.9, gainMod: 0.9 },
  { label: 'Veteran',           goldBase: 35, durationMod: 0.8, gainMod: 0.8 },
  { label: 'Elite-Wächter',     goldBase: 35, durationMod: 0.8, gainMod: 0.8 }
];

function getStadtwacheLevel(count) {
  let level = 0;
  for (let i = 1; i < STADTWACHE_LEVEL_THRESHOLDS.length; i++) {
    if (count >= STADTWACHE_LEVEL_THRESHOLDS[i]) level = i;
  }
  return level;
}

function getStadtwacheLevelProgress(count) {
  const level = getStadtwacheLevel(count);
  const from  = STADTWACHE_LEVEL_THRESHOLDS[level];
  const to    = STADTWACHE_LEVEL_THRESHOLDS[level + 1];
  if (!to) return { into: count - from, span: 1, pct: 100 };
  return { into: count - from, span: to - from, pct: Math.round(((count - from) / (to - from)) * 100) };
}

function getStadtwacheDurationMs() {
  const level = STADTWACHE_LEVELS[getStadtwacheLevel(stadtwacheStats.count)];
  return STADTWACHE_DURATION_BASE_MS * level.durationMod;
}

function getStadtwacheReward() {
  const level = STADTWACHE_LEVELS[getStadtwacheLevel(stadtwacheStats.count)];
  return level.goldBase;
}

function getStadtwacheTirednessGain() {
  const level = STADTWACHE_LEVELS[getStadtwacheLevel(stadtwacheStats.count)];
  return STADTWACHE_TIREDNESS_GAIN * level.gainMod;
}

function getStadtwacheHungerGain() {
  const level = STADTWACHE_LEVELS[getStadtwacheLevel(stadtwacheStats.count)];
  return STADTWACHE_HUNGER_GAIN * level.gainMod;
}

function startStadtwacheShift() {
  if (gameFlags.isStadtwacheShift || gameFlags.isWorking || isNight() || needs.tiredness >= 100) return;
  gameFlags.isStadtwacheShift = true;
  stadtwacheProgress          = 0;
  stadtwacheStartTime         = Date.now();
  render();
  scheduleStadtwache();
}

function scheduleStadtwache() {
  if (stadtwacheRafId) cancelAnimationFrame(stadtwacheRafId);
  stadtwacheRafId = requestAnimationFrame(animateStadtwache);
}

function animateStadtwache() {
  if (!gameFlags.isStadtwacheShift) return;
  const elapsed       = Date.now() - stadtwacheStartTime;
  stadtwacheProgress  = Math.min((elapsed / getStadtwacheDurationMs()) * 100, 100);
  const bar = document.getElementById('stadtwache-progress-bar');
  const lbl = document.getElementById('stadtwache-progress-label');
  if (bar) bar.style.width = stadtwacheProgress + '%';
  if (lbl) lbl.textContent = Math.floor(stadtwacheProgress) + '%';
  if (stadtwacheProgress >= 100) {
    completeStadtwache();
  } else {
    stadtwacheRafId = requestAnimationFrame(animateStadtwache);
  }
}

function completeStadtwache() {
  if (stadtwacheRafId) { cancelAnimationFrame(stadtwacheRafId); stadtwacheRafId = null; }
  const reward         = getStadtwacheReward();
  const tirednessGain  = Math.round(getStadtwacheTirednessGain());
  gameFlags.isStadtwacheShift   = false;
  stadtwacheProgress            = 0;
  resources.gold               += reward;
  resources.totalGoldEarned    += reward;
  stadtwacheStats.count        += 1;
  adjustHunger(Math.round(getStadtwacheHungerGain()));
  adjustTiredness(tirednessGain);
  advanceClock(STADTWACHE_CLOCK_MINUTES);
  showToast(`+${reward} Gold erhalten (Stadtwache). Gesamt: ${resources.gold}.`, 'reward');
  checkMilestones();
  maybeTriggerCommanderRecruitment(() => {});
  render();
}

/* Schlafqualität als unbegrenzte Stufe (0 = Straße, 1 = Absteige, +höher
   durch Skills und Haustier). Kein fixes Maximum — Incremental-Design:
   weitere Schlafplätze, Skills und Haustier-Level können die Stufe immer
   weiter erhöhen. Steigerungen haben bewusst abnehmenden Grenznutzen:
   0→1 bringt mehr als 4→5. Formel: 1 − 0.5 × 0.6^tier */

/** Tatsächliche Schlafqualitäts-Stufe (0 aufwärts, kein Cap) inkl.
    Skill- und Haustier-Bonus. */
function getSleepQualityTier(option) {
  const bonus = (skills.sleepLikeARock ? 1 : 0)
    + (superSkills.sleepLikeARock_super ? 1 : 0)
    + getPetSleepBonus();
  return option.qualityTier + bonus;
}

/** Faktor (0–1) für die tatsächliche Müdigkeits-Erholung bei dieser Stufe.
    Diminishing Returns: Tier 0→50%, 1→70%, 2→82%, 3→89%, 4→93%, 5→96%… */
function sleepQualityToFactor(tier) {
  if (tier <= 0) return 0.5;
  return 1 - 0.5 * Math.pow(0.6, tier);
}

/** Faktor (0–1) für die tatsächliche Müdigkeits-Erholung dieses Orts. */
function getSleepQualityFactor(option) {
  return sleepQualityToFactor(getSleepQualityTier(option));
}

/* Auf der Straße ist anfangs die EINZIGE Option (siehe renderSchlafplatz)
   — erst nachdem die Figur weiß, wie schlecht sich das anfühlt, erscheint
   die Absteige als bewusste Alternative. qualityTier 0 = Straße (50% Erholung),
   qualityTier 1 = Absteige (70% Erholung, Basis). */
const SLEEP_OPTIONS = [
  {
    id: 'street', name: 'Auf der Straße schlafen', icon: '🌌', cost: 0, qualityTier: 0,
    desc: 'Kostenlos, aber hart und kalt. Ich schlafe nie wirklich tief.', hungerPenalty: 10
  },
  {
    id: 'inn', name: 'Schäbige Absteige', icon: '🛏', cost: 5, qualityTier: 1,
    desc: 'Ein Strohsack unter einem Dach. Besser als die Straße.', hungerPenalty: 0,
    requiresFlag: 'firstSleepTriggered'
  },
  {
    id: 'home', name: 'Im eigenen Bett', icon: '🏠', cost: 0, qualityTier: 3,
    desc: 'Mein Bett. Mein Dach. Kein Lärm, keine fremden Atemzüge.', hungerPenalty: 0,
    requiresMeta: 'hasHome'
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
   `goldBase` verdoppelt sich pro Stufe (1 → 2 → 4 → 8 → 16 → 32), Dauer
   sinkt gleichzeitig. `gainMod` ist so kalibriert, dass OHNE jeden Debuff
   genau 4 Durchgänge auf einer Stufe Hunger UND Müdigkeit exakt auf den
   Zielwert bringen: Stufe 0 → 50%, Stufe 1 → 40%, … Stufe 4 → 10% (je
   −10 Prozentpunkte). Stufe 5 ("Legende") setzt das Muster fort (0%) —
   praktisch irrelevant, da ihre Schwelle ohnehin absurd hoch ist. Die
   Schwellen für Stufe 4/5 sind absichtlich absurd hoch — praktisch
   unerreichbar ohne ein zukünftiges Feature, das den Fortschritt
   beschleunigt (siehe SKILL.md). */
const WORK_LEVEL_THRESHOLDS = [0, 5, 10, 50, 500000, 100000000];
/* Stufen 4/5 ("Meister"/"Legende") bekommen zusätzlich zur normalen
   Basiswert-Progression einen eigenen Sonder-Bonus (`specialRewardMult`/
   `specialXpMult`, siehe getWorkReward()/getWorkXpGain()) — beide Stufen
   sind über ihre absurd hohen Schwellen ohnehin praktisch unerreichbar
   ohne ein zukünftiges Beschleuniger-Feature (siehe SKILL.md), die Boni
   liegen also schon bereit, bevor man sie je auslösen kann. */
const WORK_LEVELS = [
  { label: 'Ungeübt',                   goldBase: 1,  durationMod: 1.00, gainMod: 1.0 },
  { label: 'Angehender Feldarbeiter',   goldBase: 2,  durationMod: 0.90, gainMod: 0.8 },
  { label: 'Erfahrener Feldarbeiter',   goldBase: 4,  durationMod: 0.80, gainMod: 0.6 },
  { label: 'Gewiefter Feldarbeiter',    goldBase: 8,  durationMod: 0.65, gainMod: 0.4 },
  {
    label: 'Meister des Feldes', goldBase: 16, durationMod: 0.50, gainMod: 0.2,
    specialRewardMult: 2, specialXpMult: 2,
    specialEffect: 'Ich arbeite wie zwei Feldarbeiter zugleich: doppelter Ertrag, doppelte Job-Erfahrung pro Feldarbeit.'
  },
  {
    label: 'Legende der Felder', goldBase: 32, durationMod: 0.35, gainMod: 0.0,
    specialRewardMult: 3, specialXpMult: 3, specialFlatBonus: 5,
    specialEffect: 'Mein Ruf eilt mir voraus: dreifacher Ertrag, dreifache Job-Erfahrung — und egal wie die Arbeit läuft, ich bekomme grundsätzlich 5 Gold extra.'
  }
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
    + (gameFlags.foremanBonusGiven ? 1 : 0)
    + (skills.fieldPay ? 1 : 0)
    + (superSkills.fieldPay_super ? 1 : 0);
  reward *= getHungerTier(needs.hunger).rewardMult; // nur Hunger schwächt den Ertrag, Müdigkeit nur die Dauer
  reward *= level.specialRewardMult || 1;
  reward += level.specialFlatBonus || 0;
  return Math.max(1, Math.round(reward));
}

/** Wie viel Job-Erfahrung (workStats.count) eine einzelne Feldarbeit
    gerade einbringen würde — normalerweise 1, erhöht durch den Skill
    "Schneller Lerner" (+10 %/Stufe) UND den Sonderbonus der Stufen 4/5
    (siehe WORK_LEVELS, specialXpMult). */
function getWorkXpGain(levelOverride) {
  const level = WORK_LEVELS[levelOverride ?? getWorkLevel(workStats.count)];
  const skillMult = 1 + getSkillLevel('quickLearner') * 0.1 +
    (superSkills.quickLearner_super ? 0.25 : 0);
  const base = skills.jobXpBonus ? 2 : 1;
  return Math.max(1, Math.round(base * skillMult * (level.specialXpMult || 1)));
}

/** Wie viel Müdigkeit eine einzelne Arbeit gerade kosten würde (Hunger
    beschleunigt das — der Skill "Eiserner Wille" dämpft diese Beschleunigung
    um die Hälfte, lässt die Basis-Kosten aber unangetastet). Bewusst OHNE
    Rundung — die exakte Kalibrierung (siehe WORK_LEVELS) geht sonst beim
    Aufaddieren über mehrere Durchgänge verloren. Anzeigen runden selbst. */
function getWorkTirednessGain(levelOverride) {
  const level = WORK_LEVELS[levelOverride ?? getWorkLevel(workStats.count)];
  const hungerMult = getHungerTier(needs.hunger).tirednessGainMult;
  const effectiveHungerMult = 1 + (hungerMult - 1) * (superSkills.ironWill_super ? 0 : skills.ironWill ? 0.5 : 1);
  return WORK_TIREDNESS_GAIN * effectiveHungerMult * level.gainMod * getSleepDebtMult();
}

/** Wie viel Hunger eine einzelne Arbeit gerade kosten würde — für die
    Job-Info-Panel-Vorschau (siehe content.js). Ebenfalls ungerundet. */
function getWorkHungerGain(levelOverride) {
  const level = WORK_LEVELS[levelOverride ?? getWorkLevel(workStats.count)];
  return WORK_HUNGER_GAIN * level.gainMod;
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
  // KEIN navUnseen.taverne hier — er ist nur ABENDS dort (siehe
  // checkEveningArrivals(), aufgerufen aus main.js render()).

  showMonologue('Ein Wort des Vorarbeiters', [
    'Nach Feierabend hält mich eine schwielige Hand am Ärmel fest — der Vorarbeiter.',
    '"Du schuftest ordentlich, das ist mir aufgefallen", sagt er. "Komm heute Abend in die Taverne, ich will mit dir reden."'
  ], () => { render(); onDone(); });
}

/** Monolog nach 3x Nachtwache: der Kommandant der Stadtwache wird auf den
    Spieler aufmerksam und lädt ihn in die Taverne ein (siehe npc.js,
    NPC "kommandant"). Schaltet noch nichts frei — das Gespräch selbst
    macht das (Quest "commanderTraining" wird dort erst aktiv). */
function maybeTriggerCommanderArrival(onDone = () => {}) {
  if (gameFlags.commanderInviteShown || nightWatchStats.count < COMMANDER_INVITE_THRESHOLD) { onDone(); return; }
  gameFlags.commanderInviteShown = true;
  quests.commanderTraining.state = 'active';
  navUnseen.taverne = true;

  showMonologue('Ein wachsames Auge', [
    'Eine Gestalt in Uniform beobachtet mich vom Stadttor aus, schon die dritte Nacht in Folge.',
    '"Du da", ruft sie schließlich. "Komm mal in die Taverne, wenn du Zeit hast. Ich will mit dir reden."'
  ], () => { render(); onDone(); });
}

/** Monolog beim ersten Nachtwache-Level-Up: zeigt, dass auch hier
    Routine etwas bringt, analog zu maybeTriggerFirstLevelUpDialog(). */
function maybeTriggerFirstNightWatchLevelUpDialog(onDone = () => {}) {
  if (gameFlags.firstNightWatchLevelUpShown || getNightWatchLevel(nightWatchStats.count) < 1) { onDone(); return; }
  gameFlags.firstNightWatchLevelUpShown = true;

  showMonologue('Routine in der Dunkelheit', [
    'Die Nacht fühlt sich anders an als beim ersten Mal — ich weiß jetzt, wo ich hinschauen muss.',
    'Es wird leichter, je öfter ich es tue. Und es zahlt sich auch in Gold aus.'
  ], () => { render(); onDone(); });
}

/** Monolog nach dem Waldtroll-Sieg: Roswald hat es gerüchteweise erfahren
    und lädt den Spieler in die Taverne ein, um ein Stadtwache-Angebot zu machen. */
function maybeTriggerCommanderRecruitment(onDone = () => {}) {
  if (gameFlags.commanderRecruitmentShown || !gameFlags.waldtrollKilled) { onDone(); return; }
  gameFlags.commanderRecruitmentShown = true;
  navUnseen.taverne = true;

  showMonologue('Ein Ruf eilt voraus', [
    'Das Gerücht macht die Runde. Den Waldtroll im Jagdgebiet erlegt — das ist nicht nichts.',
    'Kommandant Roswald hat mich noch vor dem Stadttor abgepasst, auf dem Weg zurück. Wenig Worte, wie immer. Aber sein Blick hat sich verändert.',
    '"Komm heute Abend in die Taverne", hat er gesagt. Keine Bitte. Eine Aufforderung.'
  ], () => { render(); onDone(); });
}

/** Beleuchtet die Taverne-Nav genau einmal, sobald der Vorarbeiter
    tatsächlich antreffbar ist (er ist nur NACHTS dort, Zustand 'active' =
    Belohnung noch nicht abgeholt). Das einmalige Flag verhindert, dass
    der Hinweis nach dem Klick sofort wieder erscheint. */
function checkEveningArrivals() {
  if (quests.foremanRaise.state === 'active' && isNight() && !gameFlags.foremanEveningAlerted) {
    gameFlags.foremanEveningAlerted = true;
    navUnseen.taverne = true;
  }
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
  rohstoffe:    ['Holz, Stein, Kräuter — wenn ich das hier sammle, kann Greta mehr für mich tun.'],
  meinhaus:     [
    'Ein Schlüssel. Meiner. Ein Haus. Meins.',
    'Ich habe noch nie etwas besessen, das nicht in einen Rucksack gepasst hätte.',
    'Das hier ist kein gemietetes Bett. Das hier ist ein Zuhause.'
  ]
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
    storyState = 20100; // Kapitel 2 beginnt narrativ — Chronik zeigt Eintrag 1.4 ab jetzt
    maybeShowStoryDialog('1.4', () => {
      resources.gold = 0;
      gameFlags.resetLayerUnlocked = true;
      render();
      showToast('Mein Gold ist weg. Aber vielleicht kann ich aus alldem trotzdem etwas lernen.', 'event');
    });
  }
}

/* ── Arbeits-System ───────────────────────────────────────── */

const LONG_SHIFT_MULT = 2; // Faktor für die Lange Schicht (2h statt 1h)

function ausruhen() {
  adjustTiredness(-10);
  advanceClock(15);
  render();
}

/** Startet den Arbeitsvorgang. Bei 100 % Müdigkeit sowie bei Nacht und
    Hunger-Block wird früh abgebrochen; sonst gilt das Tier-System (weiche
    Debuffs auf Dauer, kein Hard-Block). */
function startWork() {
  if (gameFlags.isWorking || isNight() || needs.tiredness >= 100) return;

  if (gameFlags.mustEatBread) {
    maybeTriggerWorkBlockedDialog(() => {
      showToast('Ohne etwas im Magen bringt das nichts. Ich brauche Brot vom Marktplatz.', 'error');
    });
    return;
  }

  workShiftMult       = 1;
  gameFlags.isWorking = true;
  workProgress        = 0;
  workStartTime       = Date.now();

  render();
  scheduleWork();
}

/** Startet eine 2-Stunden-Schicht (Skill "Lange Schicht" vorausgesetzt).
    Doppelte Dauer, doppelter Ertrag, doppelte Kosten — sonst identisch mit startWork(). */
function startLongShift() {
  if (!skills.longShift || gameFlags.isWorking || isNight()) return;

  if (gameFlags.mustEatBread) {
    maybeTriggerWorkBlockedDialog(() => {
      showToast('Ohne etwas im Magen bringt das nichts. Ich brauche Brot vom Marktplatz.', 'error');
    });
    return;
  }

  workShiftMult       = LONG_SHIFT_MULT;
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
  workProgress  = Math.min((elapsed / (getWorkDurationMs() * workShiftMult)) * 100, 100);

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

  const mult          = workShiftMult;
  const reward        = getWorkReward() * mult;
  const wasHungry      = isStarving();
  const tirednessGain  = getWorkTirednessGain() * mult;
  const levelBefore    = getWorkLevel(workStats.count);

  gameFlags.isWorking        = false;
  workProgress               = 0;
  workShiftMult              = 1;
  resources.gold            += reward;
  resources.totalGoldEarned += reward;
  workStats.count            += getWorkXpGain(levelBefore) * mult;
  if (wasHungry) workStats.hungryWorkCount = (workStats.hungryWorkCount || 0) + 1;

  adjustHunger(getWorkHungerGain(levelBefore) * mult);
  adjustTiredness(tirednessGain);
  advanceClock(WORK_CLOCK_MINUTES * mult);

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
          maybeTriggerCommanderRecruitment(() => {
            maybeTriggerFirstNightDialog();
          });
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
    navUnseen.taverne = true; // Jetzt gibt es wirklich etwas bei Brakka zu berichten
    showToast(`Nachtwache gehalten (+${reward} Gold). Erzähl Brakka davon!`, 'reward');
  } else {
    showToast(`Nachtwache gehalten (+${reward} Gold). Ich werde mich danach schlechter erholen.`, 'reward');
  }

  checkMilestones();
  render();

  maybeTriggerCommanderArrival(() => {
    maybeTriggerFirstNightWatchLevelUpDialog();
  });
}

/* ── Schlafen: beendet den Spieltag ───────────────────────── */
/** Direkt-Sleep für externe Orte (Lethkar-Pension etc.) ohne SLEEP_OPTIONS-Lookup. */
function sleepAt(id, cost, qualityTier) {
  if (!isNight()) return;
  if (resources.gold < cost) { showToast('Nicht genug Gold.', 'error'); return; }
  finishSleep({ id, cost, qualityTier, hungerPenalty: 0 });
}

function sleep(optionId) {
  if (!isNight()) return; // Schlafen ist erst nach Einbruch der Nacht möglich (siehe renderSchlafplatz)

  const option = SLEEP_OPTIONS.find(o => o.id === optionId);
  if (!option) return;
  if (option.requiresFlag && !gameFlags[option.requiresFlag]) return;

  if (option.cost > 0 && resources.gold < option.cost) {
    showToast(`Nicht genug Gold für: ${option.name}.`, 'error');
    return;
  }

  if (option.id === 'street') {
    streetCatProgress.sleepCount += 1;
    const n = streetCatProgress.sleepCount;

    if (pets.streetCat) {
      // Nach der Adoption: Flavor-Texte (erste 3 Nächte immer, danach jede 2.)
      streetCatProgress.postAdoptionNights += 1;
      if (maybeTriggerPostAdoptionText(option)) return;
    } else if (n <= STREET_SLEEP_FLAVOR_TEXTS.length) {
      // Erste 4 Nächte: Eingewöhnungs-Flavor
      showMonologue('Auf der Straße', [STREET_SLEEP_FLAVOR_TEXTS[n - 1]], () => finishSleep(option));
      return;
    } else {
      if (maybeTriggerStreetWalk(option)) return; // Dialog übernimmt, ruft finishSleep() selbst auf
    }
  }

  finishSleep(option);
}

/** Zeigt einen Post-Adoption-Flavor-Text nach dem Schlafen auf der Straße mit Katze.
    Gibt true zurück, wenn ein Monolog übernommen hat (finishSleep() dann über Callback). */
function maybeTriggerPostAdoptionText(option) {
  const n = streetCatProgress.postAdoptionNights;
  let text = null;
  if (n <= STREET_CAT_POST_ADOPTION_EARLY.length) {
    text = STREET_CAT_POST_ADOPTION_EARLY[n - 1];
  } else {
    // Jede 2. Nacht ab der 4. (n=4, 6, 8, …)
    const laterIdx = n - STREET_CAT_POST_ADOPTION_EARLY.length - 1;
    if (laterIdx % 2 === 0) {
      text = STREET_CAT_POST_ADOPTION_LATER[Math.floor(laterIdx / 2) % STREET_CAT_POST_ADOPTION_LATER.length];
    }
  }
  if (!text) return false;
  showMonologue('Eine ruhige Nacht', [text], () => finishSleep(option));
  return true;
}

/** Führt einen bereits "entschiedenen" Schlafvorgang aus (Kosten,
    Erholung, Tageswechsel) — ausgelagert aus sleep(), weil die
    Straßenkatze-Begegnungskette (siehe maybeTriggerStreetWalk()) erst
    einen oder mehrere Dialoge dazwischenschalten kann, bevor der Tag
    tatsächlich endet. */
function finishSleep(option) {
  const tirednessBeforeSleep = needs.tiredness;
  const recoveryMult         = nightFlags.recoveryDebuff ? (1 - getNightWatchRecoveryPenalty()) : 1;
  const tirednessRelief      = 100 * recoveryMult * getSleepQualityFactor(option);

  if (option.cost > 0) resources.gold -= option.cost;
  adjustTiredness(-tirednessRelief);
  if (option.hungerPenalty) adjustHunger(option.hungerPenalty);
  nightFlags.recoveryDebuff = false;

  restoreHpFromSleep(option);      // Kampf-HP anteilig wiederherstellen (combat.js)
  updateSleepDebt(tirednessBeforeSleep); // Schlafschuld aktualisieren (needs.js)

  const isFirstSleep = !gameFlags.firstSleepTriggered;
  gameFlags.firstSleepTriggered = true;

  startNewDay();
  currentContent = currentCity === 'lethkar' ? 'lethkar' : 'treutheim';
  navLevel       = 2;

  render();

  const finishMorning = () => maybeTriggerHungerDialog(() => {
    showToast(`Ein neuer Tag beginnt (Tag ${gameClock.day}).`, 'info');
  });

  if (isFirstSleep) maybeShowStoryDialog('1.3', finishMorning);
  else finishMorning();
}

/* ── Geheime Begegnungskette: die Straßenkatze ───────────────
   Die ersten 4 Nächte auf der Straße zeigen kurze Flavor-Texte (Eingewöhnung).
   Ab Nacht 5 erscheint jede Nacht ein Walk-Dialog — jeder zweite davon führt
   zur Katze. Das ergibt 3 Begegnungen (Spaziergänge 1, 3, 5) bis zur Adoption.
   Jede Begegnung lässt sich NICHT überspringen, ohne die Eskalation zu
   verpassen: wer die Katze in Ruhe lässt, bleibt auf demselben
   Vertrauens-Stand stehen, bis er es bei der nächsten Begegnung erneut
   versucht. */
const STREET_CAT_WALK_FIRST    = 5; // Schlaf-Nr., bei der Walk-Dialoge beginnen
const STREET_CAT_WALK_INTERVAL = 1; // jede weitere Nacht auf der Straße

/* Flavor-Texte für die ersten 4 Nächte auf der Straße (index = sleepCount - 1) */
const STREET_SLEEP_FLAVOR_TEXTS = [
  'Die Pflastersteine unterm Rücken lassen mich nicht vergessen, wo ich bin. Der Schlaf kommt, aber er bleibt nicht lange.',
  'Schon wieder. Ein Teil von mir wünscht sich verzweifelt ein echtes Bett — irgendein Bett.',
  'Ich fange an, die Risse im Pflaster zu kennen. Die Katzen in der Ferne. Den besonderen Geruch nach Nacht. Das sollte mir Sorgen machen.',
  'In der Ferne raschelt es — zu groß für eine Ratte, zu leise für einen Menschen. Beim nächsten Mal werde ich dem nachgehen.'
];

/* Texte nach der Adoption: erste 3 Nächte speziell, danach abwechselnd */
const STREET_CAT_POST_ADOPTION_EARLY = [
  'Sie schläft neben mir, ein kleines warmes Gewicht an meiner Seite. Seltsam, wie viel das ausmacht.',
  'Wieder diese Steine — aber mit ihr ist es anders. Ruhiger irgendwie.',
  'Ich glaube, sie wartet auf mich, wenn ich komme. Das ist neu.'
];
const STREET_CAT_POST_ADOPTION_LATER = [
  'Sie liegt noch an derselben Stelle wie immer. Manche Dinge ändern sich nicht.',
  'Sie streckt sich einmal durch, als ich mich hinlege, und schläft sofort wieder ein.'
];

const STREET_CAT_GREET_TEXTS = {
  1: 'In einer Seitengasse raschelt es. Eine schmale Katze, struppig und misstrauisch, beobachtet mich aus dem Schatten.',
  2: 'Da ist sie wieder — dieselbe Katze wie letztes Mal. Sie bleibt diesmal etwas länger stehen, bevor sie sich entscheidet, ob sie bleibt.',
  3: 'Sie wartet schon auf mich, fast so, als hätte sie mich erwartet.'
};

const STREET_CAT_PET_FAIL_TEXTS = {
  1: 'Ich strecke langsam die Hand aus. Sie zuckt zurück und verschwindet im Schatten — aber sie ist nicht weit gelaufen. Vielleicht sollte ich es einfach weiter versuchen, ein bisschen Vertrauen aufbauen.',
  2: 'Diesmal bleibt sie länger. Ich berühre kurz ihr Fell, bevor sie sich losreißt und verschwindet. Ein kleiner Fortschritt — sie vertraut mir schon etwas mehr als beim ersten Mal.'
};

/** Bietet ggf. den "Spazieren gehen vs. Schlafen gehen"-Dialog an. Gibt
    `true` zurück, falls ein Dialog übernommen hat (sleep() darf dann
    NICHT selbst weiterlaufen — finishSleep() wird aus dem Dialog heraus
    aufgerufen), sonst `false`. */
function maybeTriggerStreetWalk(option) {
  if (pets.streetCat) return false; // schon adoptiert — keine weiteren Begegnungen nötig

  const count = streetCatProgress.sleepCount;
  if (count < STREET_CAT_WALK_FIRST) return false;
  if ((count - STREET_CAT_WALK_FIRST) % STREET_CAT_WALK_INTERVAL !== 0) return false;

  showDialog({
    title: 'Schon wieder hier draußen',
    text: ['Wieder diese kalten Pflastersteine unter mir. Wie oft jetzt schon? Ich verliere langsam den Überblick.'],
    buttons: [
      { label: 'Noch eine kleine Runde drehen.', onClick: () => closeDialog(() => takeStreetWalk(option)) },
      { label: 'Einfach schlafen gehen.', onClick: () => closeDialog(() => finishSleep(option)) }
    ]
  });
  return true;
}

/** Ein Spaziergang — nur jeder zweite führt tatsächlich zur Katze. */
function takeStreetWalk(option) {
  const walkNumber = Math.floor((streetCatProgress.sleepCount - STREET_CAT_WALK_FIRST) / STREET_CAT_WALK_INTERVAL) + 1;
  const isEncounterWalk = walkNumber % 2 === 1; // 1., 3., 5. Spaziergang

  if (!isEncounterWalk) {
    showMonologue('Ein kurzer Spaziergang', [
      'Ein paar stille Gassen, etwas kühle Nachtluft. Niemand hier außer mir, heute.'
    ], () => finishSleep(option));
    return;
  }

  streetCatProgress.encounters += 1;
  showStreetCatDialog(option);
}

/** Zeigt die Begegnung mit der Katze — Text + Vertrauens-Level wachsen
    mit jeder Begegnung (siehe STREET_CAT_GREET_TEXTS). */
function showStreetCatDialog(option) {
  const n = streetCatProgress.encounters;
  showPaginatedDialog('Ein streunendes Tier', splitLongDialogPages([STREET_CAT_GREET_TEXTS[n] || STREET_CAT_GREET_TEXTS[3]]), [
    { label: 'Vorsichtig die Hand ausstrecken.', onClick: () => closeDialog(() => resolveStreetCatPet(option)) },
    { label: 'Sie in Ruhe lassen.', onClick: () => closeDialog(() => finishSleep(option)) }
  ]);
}

/** Reagiert auf den Streichel-Versuch: bei der 3. Begegnung die Adoption,
    sonst ein wachsendes (aber noch nicht endgültiges) Vertrauen. */
function resolveStreetCatPet(option) {
  const n = streetCatProgress.encounters;
  if (n >= 3) {
    adoptStreetCat(option);
    return;
  }
  showMonologue('Ein streunendes Tier', [STREET_CAT_PET_FAIL_TEXTS[n] || STREET_CAT_PET_FAIL_TEXTS[1]], () => finishSleep(option));
}

/** Letzte Begegnung: die Katze bleibt — schaltet das Haustier UND (über
    checkAchievements(), main.js) die geheime Errungenschaft frei. */
function adoptStreetCat(option) {
  pets.streetCat = { level: 0 };
  navUnseen.pets = true;
  showMonologue('Ein neuer Freund', [
    'Sie schnurrt, lehnt sich gegen meine Hand und bleibt. Als hätte sie längst entschieden, dass ich bleiben darf.',
    'Ich glaube, ich habe gerade eine Mitbewohnerin bekommen.'
  ], () => finishSleep(option));
}

/* ── Kapitel-2-Sieg-Sequenz ───────────────────────────────────
   Wird nach dem Abschluss der Konfrontation mit dem Fremden aufgerufen.
   Zeigt Story 2.7, dann einen großen Sieg-Dialog mit Konfetti. */
function triggerChapter2Victory() {
  if (gameFlags.chapter2Complete) return;

  maybeShowStoryDialog('2.7', () => {
    gameFlags.chapter2Complete = true;
    quests.theftInvestigation.state = 'rewarded';
    storyState = 20200;
    render();

    launchConfetti();

    showDialog({
      title: '🏆 Kapitel 1 & 2 abgeschlossen!',
      boxClass: 'dialog-box-wide',
      html: `
        <p style="font-size:1.1em;text-align:center;margin-bottom:12px">
          Du hast es geschafft.
        </p>
        <p>
          Du bist als Niemand in Treutheim angekommen — mit leeren Taschen und
          großen Träumen. Du wurdest bestohlen, hast neu angefangen, hast gekämpft,
          gefragt, gesucht. Und jetzt kennst du die Wahrheit.
        </p>
        <p>
          <strong>Der Schatten</strong> ist noch da draußen. Aber er weiß, dass du
          existierst. Und das verändert alles.
        </p>
        <hr style="border-color:var(--border);margin:12px 0">
        <p style="color:var(--text-mid);font-size:0.85em">
          <strong>Was in Kapitel 3 auf dich wartet:</strong><br>
          • Eine neue Stadt jenseits von Treutheim<br>
          • Die Abenteurergilde als echte Organisation<br>
          • Der Schatten — wer ist er wirklich?<br>
          • Mehr Verbündete, mehr Feinde, mehr Geheimnisse
        </p>
        <hr style="border-color:var(--border);margin:12px 0">
        <p style="color:var(--text-lo);font-size:0.85em;text-align:center">
          Bleibe auf dem Laufenden über zukünftige Updates:<br>
          <a href="https://discord.gg/NHenxsPh" target="_blank" style="color:var(--c-reward)">👾 Discord — Chroniken des vergessenen Weges</a><br><br>
          Danke, dass du gespielt hast — wir hoffen, du hattest Spaß. ✨
        </p>
      `,
      buttons: [{
        label: 'Das Abenteuer geht weiter!',
        onClick: () => {
          closeDialog();
          achievements.chapter2Complete = true;
          navUnseen.errungenschaften = true;
          showToast('🏆 Errungenschaft freigeschaltet: Chroniken des vergessenen Weges!', 'event');
          render();
        }
      }]
    });
  });
}
