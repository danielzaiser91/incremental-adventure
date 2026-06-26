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

// Schlafplatz-Multiplikator für die Abschwächung des Nachtwache-Debuffs durch eigene Schlaf-Boni.
// Bessere Schlafplätze verstärken den Effekt der eigenen Boni (Stufe 1–3).
const NACHTWACHE_DEBUFF_LOC_MULT = {
  street:          1.0,
  inn:             2.0,
  lethkar_pension: 2.5,
  velmark_pension: 2.7,
  velmark_suite:   2.9,
  home:            3.0,
};

/** Eigene Schlaf-Boni (Skills + Haustier) ohne den Basis-Qualitätstier des Schlafplatzes. */
function getOwnSleepBonus() {
  return (skills.sleepLikeARock ? 1 : 0)
    + (superSkills.sleepLikeARock_super ? 1 : 0)
    + getPetSleepBonus();
}

/** Gibt den effektiven Nachtwache-Erholungs-Malus zurück (0–1).
    Eigene Schlaf-Boni können den Malus je nach Schlafplatz abschwächen
    (abnehmende Effektivität: n^0.58 × Orts-Mult × 1% Reduktion).
    Minimum 10%, Superpower "Eiserne Wacht" hebt ihn ganz auf. */
function getNightWatchRecoveryPenalty(sleepOpt) {
  if (superSkills.nightWatchLeveling_super) return 0;

  const base = NIGHTWATCH_RECOVERY_PENALTY;
  if (!sleepOpt) return base;

  const ownBonus = getOwnSleepBonus();
  if (ownBonus <= 0) return base;

  const locMult  = NACHTWACHE_DEBUFF_LOC_MULT[sleepOpt.id] ?? 1.0;
  const reduction = Math.pow(ownBonus, 0.58) * locMult * 0.01;
  return Math.max(0.10, base - reduction);
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
  const owlBonus = typeof getWildPetNightWatchBonus === 'function' ? getWildPetNightWatchBonus() : 0;
  return Math.max(1, Math.round(
    NIGHTWATCH_LEVELS[getNightWatchLevel(nightWatchStats.count)].goldBase * getAchievementGoldMult() * (1 + owlBonus)
  ));
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
  adjustHunger(Math.round(getStadtwacheHungerGain() * getSuperRestMult()));
  adjustTiredness(Math.round(tirednessGain * getSuperRestMult()));
  advanceClock(STADTWACHE_CLOCK_MINUTES);
  showToast(`+${reward} Gold erhalten (Stadtwache). Gesamt: ${resources.gold}.`, TOAST.REWARD);

  // brennenderMut-Quest: drei Stadtwache-Schichten
  if (quests.brennenderMut?.state === QUEST_STATE.ACTIVE) {
    quests.brennenderMut.count = (quests.brennenderMut.count || 0) + 1;
    if (quests.brennenderMut.count >= 3) {
      quests.brennenderMut.state = QUEST_STATE.DONE;
      showToast('Drei Schichten durchgehalten. Brakka Bescheid geben.', TOAST.EVENT);
    }
  }

  checkMilestones();
  maybeTriggerCommanderRecruitment(() => {
    maybeTriggerExhaustionDialog();
  });
  render();
}

/* Schlafqualität als unbegrenzte Stufe (0 = Straße, 1 = Absteige, +höher
   durch Skills und Haustier). Steigerungen haben abnehmenden Grenznutzen.
   Formel: 1 − 0.5 × 0.6^tier — konvergiert gegen 100%.
   Damit Schlafplatz-Typ trotz hohem Skill-Bonus spürbar unterschiedlich bleibt,
   hat jeder Ort ein maxRecovery-Cap. Skills verbessern innerhalb des Caps,
   aber die Qualität des Orts bleibt immer der limitierende Faktor. */

const SLEEP_MAX_RECOVERY = {
  street:          0.55,
  inn:             0.72,
  lethkar_pension: 0.82,
  velmark_pension: 0.88,
  velmark_suite:   0.94,
  home:            1.00,
};

/** Tatsächliche Schlafqualitäts-Stufe (0 aufwärts) inkl. Skill- und Haustier-Bonus. */
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

/** Faktor (0–1) für die tatsächliche Müdigkeits-Erholung dieses Orts.
    Wird durch SLEEP_MAX_RECOVERY gedeckelt — Ort ist immer limitierender Faktor. */
function getSleepQualityFactor(option) {
  const raw = sleepQualityToFactor(getSleepQualityTier(option));
  const cap = SLEEP_MAX_RECOVERY[option.id] ?? 1.0;
  return Math.min(raw, cap);
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
  if (isNight() || gameFlags.mustEatBread || needs.tiredness >= 100) return;
  const tool = TOOL_ITEMS.find(t => t.resource === resourceId);
  if (!tool || (resources.inventory[tool.id] || 0) <= 0) return;

  const erdeBonus     = typeof getAlchemieErdeRohstoffBonus === 'function' ? getAlchemieErdeRohstoffBonus() : 0;
  const squirrelBonus = typeof getWildPetResourceBonus === 'function' ? getWildPetResourceBonus() : 0;
  const totalAmount   = RESOURCE_GATHER_AMOUNT + erdeBonus + squirrelBonus;
  grantItem(resourceId, totalAmount);
  adjustTiredness(Math.round(RESOURCE_GATHER_TIREDNESS * getSuperRestMult()));
  adjustHunger(Math.round(RESOURCE_GATHER_HUNGER * getSuperRestMult()));
  advanceClock(RESOURCE_GATHER_MINUTES);

  const resourceName = RESOURCE_ITEMS.find(r => r.id === resourceId).name;
  showToast(`+${totalAmount} ${resourceName}.`, TOAST.REWARD);
  render();
  maybeTriggerExhaustionDialog();
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
  const alchemieGold = typeof getAlchemieLuftGoldBonus === 'function' ? getAlchemieLuftGoldBonus() : 0;
  let reward = level.goldBase
    + (equipment.hands === 'ledergloves' ? 1 : 0)
    + (equipment.guertel === 'arbeitsguertel' ? 1 : 0)
    + (gameFlags.foremanBonusGiven ? 1 : 0)
    + (skills.fieldPay ? 1 : 0)
    + (superSkills.fieldPay_super ? 1 : 0)
    + (skills.instinkt ? 1 : 0)
    + alchemieGold;
  reward *= getHungerTier(needs.hunger).rewardMult; // nur Hunger schwächt den Ertrag, Müdigkeit nur die Dauer
  reward *= level.specialRewardMult || 1;
  reward += level.specialFlatBonus || 0;
  reward *= getAchievementGoldMult();
  return Math.max(1, Math.round(reward));
}

/** Wie viel Job-Erfahrung (workStats.count) eine einzelne Feldarbeit
    gerade einbringen würde — normalerweise 1, erhöht durch den Skill
    "Schneller Lerner" (+10 %/Stufe) UND den Sonderbonus der Stufen 4/5
    (siehe WORK_LEVELS, specialXpMult). */
function getWorkXpGain(levelOverride) {
  const level = WORK_LEVELS[levelOverride ?? getWorkLevel(workStats.count)];
  const skillMult = 1 + getSkillLevel(SKILL_ID.QUICK_LEARNER) * 0.1 +
    (superSkills.quickLearner_super ? 0.25 : 0);
  const base = skills.jobXpBonus ? 2 : 1;
  const profiMult   = meta.feldarbeitProfi   ? 1000 : 1;
  const meisterMult = meta.feldarbeitMeister ? 100  : 1;
  return Math.max(1, Math.round(base * skillMult * (level.specialXpMult || 1) * profiMult * meisterMult));
}

/** Prüft nach jedem Feldarbeits-Durchgang, ob der Spieler gerade Stufe 4
    erreicht hat und noch keinen Körpergedächtnis-Durchbruch hatte.
    Wird in _completeWork() aufgerufen. setTimeout sorgt dafür, dass der
    Monolog erst erscheint, nachdem die synchrone maybeTrigger*-Kette
    abgearbeitet ist — kein Dialogkonflikt möglich. */
function maybeUnlockFeldarbeitMeister() {
  if (!meta.feldarbeitProfi) return;
  if (meta.feldarbeitMeister) return;
  if (!alchemie.unlocked) return;  // erst ab Kap 3.3 (Alchemie-Laboratorium freigeschaltet)
  if (getWorkLevel(workStats.count) < 4) return;

  meta.feldarbeitMeister = true;
  saveGame();

  setTimeout(() => {
    showMonologue('Eine Kleinigkeit verändert sich', [
      'Es passiert mitten in einer ganz gewöhnlichen Schaufelung. Kein besonderer Moment, kein Zeuge, kein Donner — nur dieses eine Mal, wo ich merke, dass ich gar nicht nachgedacht habe.',
      'Siverts Technik liegt nicht mehr im Kopf. Sie ist in den Händen, in der Schulter, im Atemrhythmus. Was ich einmal bewusst einüben musste, läuft einfach — als wäre es immer so gewesen.',
      'Das ist nicht mehr Fleiß. Das ist etwas anderes. Etwas, das man sich nicht kaufen kann — man muss es sich erarbeiten, Durchgang für Durchgang, bis der Körper aufhört zu fragen und einfach weiß.'
    ], () => {
      showToast('Körpergedächtnis freigeschaltet — Feldarbeit-Erfahrung massiv erhöht.', TOAST.EVENT);
      render();
    });
  }, 300);
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
  // Paranoid: dauernde Anspannung erhöht Müdigkeit um 15 % — entfällt wenn "Scharf beobachtet" gelernt
  const paranoidMult = (skills.paranoid && !skills.aufmerksamkeit) ? 1.15 : 1;
  // Hauskatze (Wildtier): reduziert Müdigkeitsanstieg
  const catReduction = 1 - (typeof getWildPetTirednessReduction === 'function' ? getWildPetTirednessReduction() : 0);
  return WORK_TIREDNESS_GAIN * effectiveHungerMult * level.gainMod * getSleepDebtMult() * paranoidMult * catReduction;
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

/** Monolog beim ersten Mal, dass Müdigkeit 100 % erreicht: erklärt, dass
    so nicht weitergearbeitet werden kann und eine kurze Pause nötig ist. */
function maybeTriggerExhaustionDialog() {
  if (gameFlags.exhaustionDialogShown || needs.tiredness < 100) return;
  gameFlags.exhaustionDialogShown = true;

  showMonologue('Völlig erschöpft', [
    'Der Körper streikt. Meine Beine tragen mich kaum noch, die Hände zittern — so kann ich nicht weiterarbeiten.',
    'Eine kurze Pause würde reichen. Nur ein paar Minuten ausruhen, dann geht es weiter.'
  ], render);
}

function maybeTriggerSchmiedeWelcomeDialog() {
  if (gameFlags.schmiedeWelcomeSeen) return;
  gameFlags.schmiedeWelcomeSeen = true;
  showMonologue('Die Schmiede', [
    'Ich schiebe die schwere Tür auf. Eisengeruch, frischer Mörtel. Und mittendrin: der Amboss — schwerer als ich erwartet hatte.',
    'Der Handwerker, den Oswin schickte, brauchte vier Stunden für den Aufbau. „So ein Stück liefern wir nur an feste Adressen", hatte er gesagt. Zum Glück habe ich jetzt eine.',
    'Der Ofen ist kalt. Noch. Ich lege meine Hand auf das kalte Eisen. Hier fängt etwas Neues an.'
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
  quests.foremanRaise.state    = QUEST_STATE.ACTIVE;
  // KEIN navUnseen.taverne hier — er ist nur ABENDS dort (siehe
  // checkEveningArrivals(), aufgerufen aus main.js render()).

  showMonologue('Ein Wort des Vorarbeiters', [
    'Nach Feierabend hält mich eine schwielige Hand am Ärmel fest — der Vorarbeiter.',
    '"Du schuftest ordentlich, das ist mir aufgefallen", sagt er. "Komm heute Abend in die Taverne, ich will mit dir reden."'
  ], () => { render(); onDone(); });
}

/** Immersiver Monolog nach der allerersten Nachtwache — kaum wachzuhalten,
    aber das Geld und das Ziel halten den Spieler aufrecht. */
function maybeTriggerFirstNightWatchDialog(onDone = () => {}) {
  if (gameFlags.firstNightWatchShown || nightWatchStats.count !== 1) { onDone(); return; }
  gameFlags.firstNightWatchShown = true;
  showMonologue('Die erste Nachtwache', [
    'Die Nacht ist träge. Schritt für Schritt gehe ich die Mauer ab — immer dieselbe Strecke, immer dieselben Schatten. Kein Laut außer meinen eigenen Schritten.',
    'Irgendwann um Mitternacht hört das Denken auf. Was bleibt, ist das dumpfe Gewicht der Müdigkeit. Ich kneife die Augen zusammen. Beiße die Zähne aufeinander. Weitermachen.',
    'Ich denke ans Gold. Nicht viel — nie viel — aber es ist da. Jede Stunde, die ich hier stehe, ist eine, die ich mir verdient habe. Niemand schenkt mir hier etwas.',
    'Ich werde nicht ewig derjenige sein, der friert und die Zähne zusammenbeißt. Eines Tages werde ich weiterziehen — weiter als dieses Stadttor, weiter als dieser Morgen. Aber bis dahin: stehen. Wachen. Nicht einschlafen.'
  ], () => { render(); onDone(); });
}

/** Monolog nach 3x Nachtwache: der Kommandant der Stadtwache wird auf den
    Spieler aufmerksam und lädt ihn in die Taverne ein (siehe npc.js,
    NPC "kommandant"). Schaltet noch nichts frei — das Gespräch selbst
    macht das (Quest "commanderTraining" wird dort erst aktiv). */
function maybeTriggerCommanderArrival(onDone = () => {}) {
  if (gameFlags.commanderInviteShown || nightWatchStats.count < COMMANDER_INVITE_THRESHOLD) { onDone(); return; }
  gameFlags.commanderInviteShown = true;
  quests.commanderTraining.state = QUEST_STATE.ACTIVE;

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

  showMonologue('Ein Ruf eilt voraus', [
    'Das Gerücht macht die Runde. Den Waldtroll im Jagdgebiet erlegt — das ist nicht nichts.',
    'Kommandant Roswald hat mich noch vor dem Stadttor abgepasst, auf dem Weg zurück. Wenig Worte, wie immer. Aber sein Blick hat sich verändert.',
    '"Komm heute Abend in die Taverne", hat er gesagt. Keine Bitte. Eine Aufforderung.'
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
    render();
    maybeShowStoryDialog('1.2');
  }

  // ── Neues Raub-System: 4 automatische Raub-Events ────────────
  // Jeder Raub löst sofort einen Reset aus. Die Reset-Karte bleibt verborgen,
  // bis der Spieler "Paranoid" kauft (nach dem 4. Raub, der Arbeit sperrt).
  // performManualReset() berechnet den EP-Gewinn aus dem AKTUELLEN Gold
  // (vor dem Reset). EP: Raub 1 immer 1 (isFirstReset), Raub 2-4 je 1 EP
  // wenn Gold >= 50 (Mindestgrenze).

  // Raub 1 — 50 totalGoldEarned (bestehende Logik, jetzt mit Auto-Reset)
  if (!gameFlags.robberyTriggered && resources.totalGoldEarned >= GOLD_MILESTONE_THRESHOLD && storyState === 10102) {
    gameFlags.robberyTriggered = true;
    gameFlags.newRobberySystemActive = true;
    storyState = 10103;
    gameFlags.resetLayerUnlocked = true;
    // setTimeout > 180ms: falls checkMilestones() aus einer NPC-Aktion heraus aufgerufen
    // wird (z.B. brakka.turnIn), läuft gerade noch ein closeDialog(180ms) — der Story-
    // Dialog darf erst danach öffnen, sonst geht der Reset-Callback verloren.
    setTimeout(() => maybeShowStoryDialog('1.4', () => {
      render();
      showToast('Ausgeraubt. Wieder von vorn — aber ich lerne dabei.', TOAST.EVENT);
      runManualResetWithAnimation();
    }), 250);
  }

  // Raub 2 — 200 Gold in der Hand
  if (!gameFlags.robbery2Triggered && resources.gold >= 200 && storyState === 10103) {
    gameFlags.robbery2Triggered = true;
    storyState = 10104;
    setTimeout(() => maybeShowStoryDialog('1.5', () => {
      render();
      showToast('Zum zweiten Mal ausgeraubt. Ich bin wütend — aber ich mache weiter.', TOAST.EVENT);
      runManualResetWithAnimation();
    }), 250);
  }

  // Raub 3 — 300 Gold in der Hand
  if (!gameFlags.robbery3Triggered && resources.gold >= 300 && storyState === 10104) {
    gameFlags.robbery3Triggered = true;
    storyState = 10105;
    setTimeout(() => maybeShowStoryDialog('1.6', () => {
      render();
      showToast('Dreimal ausgeraubt. Das hat System — ich muss mir etwas einfallen lassen.', TOAST.EVENT);
      runManualResetWithAnimation();
    }), 250);
  }

  // Raub 4 — 500 Gold in der Hand. Arbeit wird danach gesperrt.
  if (!gameFlags.robbery4Triggered && resources.gold >= 500 && storyState === 10105) {
    gameFlags.robbery4Triggered = true;
    storyState = 10106;
    gameFlags.workBlockedByRobberies = true;
    setTimeout(() => maybeShowStoryDialog('1.7', () => {
      render();
      showToast('Viermal ausgeraubt. Genug. Ich brauche einen anderen Weg.', TOAST.EVENT);
      runManualResetWithAnimation();
    }), 250);
  }
}

/* ── Arbeits-System ───────────────────────────────────────── */

const LONG_SHIFT_MULT = 2; // Faktor für die Lange Schicht (2h statt 1h)

function ausruhen() {
  const recovery = Math.round(10 * getRestRecoveryMult());
  adjustTiredness(-recovery);
  const hungerReduction = getRestHungerReduction();
  if (hungerReduction > 0) adjustHunger(-hungerReduction);
  if (getSkillLevel(SKILL_ID.LONGER_REST) >= 1) restStats.count += 1;
  advanceClock(getRestDurationMins());
  render();
}

/** Startet den Arbeitsvorgang. Bei 100 % Müdigkeit sowie bei Nacht und
    Hunger-Block wird früh abgebrochen; sonst gilt das Tier-System (weiche
    Debuffs auf Dauer, kein Hard-Block). */
function startWork() {
  if (gameFlags.isWorking || isNight() || needs.tiredness >= 100) return;

  if (gameFlags.mustEatBread) {
    maybeTriggerWorkBlockedDialog(() => {
      showToast('Ohne etwas im Magen bringt das nichts. Ich brauche Brot vom Marktplatz.', TOAST.ERROR);
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
      showToast('Ohne etwas im Magen bringt das nichts. Ich brauche Brot vom Marktplatz.', TOAST.ERROR);
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

  adjustHunger(Math.round(getWorkHungerGain(levelBefore) * mult * getSuperRestMult()));
  adjustTiredness(Math.round(tirednessGain * getSuperRestMult()));
  advanceClock(WORK_CLOCK_MINUTES * mult);

  const hungryNote = wasHungry ? ' Der Hunger schwächt mich und ermüdet mich schneller.' : '';
  showToast(`+${reward} Gold erhalten (Gesamt: ${resources.gold}).${hungryNote}`, TOAST.REWARD);
  playSfx('work');

  checkMilestones();
  maybeUnlockFeldarbeitMeister();
  render();

  // Verkettet statt parallel aufgerufen, damit sich nie zwei dieser
  // Ersteinblendungs-Monologe gegenseitig überschreiben (siehe Kommentar
  // über maybeTriggerFirstWorkDialog).
  maybeTriggerFirstWorkDialog(() => {
    maybeTriggerHungerDialog(() => {
      maybeTriggerFirstLevelUpDialog(() => {
        maybeTriggerForemanBonusDialog(() => {
          maybeTriggerCommanderRecruitment(() => {
            maybeTriggerFirstNightDialog(() => {
              maybeTriggerExhaustionDialog();
            });
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
  const allowed = state === QUEST_STATE.ACTIVE || state === 'rewarded';
  if (!isNight() || nightFlags.nightActivityUsedToday || !allowed) return;

  const reward = getNightWatchReward();
  resources.gold            += reward;
  resources.totalGoldEarned += reward;
  nightWatchStats.count     += 1;
  nightFlags.nightActivityUsedToday = true;
  nightFlags.recoveryDebuff         = true;

  if (state === QUEST_STATE.ACTIVE) {
    quests.nightWatch.state = QUEST_STATE.DONE;
    showToast(`Nachtwache gehalten (+${reward} Gold). Erzähl Brakka davon!`, TOAST.REWARD);
  } else {
    showToast(`Nachtwache gehalten (+${reward} Gold). Ich werde mich danach schlechter erholen.`, TOAST.REWARD);
  }
  playSfx('work');

  // brennenderMut wird jetzt über Stadtwache-Schichten gezählt (nicht Nachtwache)

  // Hauskatze: Drop nach 15 Nachtwachen
  if (nightWatchStats.count === 15 && !wildPets.find(p => p.type === 'katze')) {
    wildPets.push({ type: 'katze', level: 0 });
    showToast('Eine Hauskatze schleicht sich in mein Quartier... 🐱', TOAST.EVENT);
    navUnseen.pets = true;
  }
  // Eule: Drop nach 20 Nachtwachen
  if (nightWatchStats.count === 20 && !wildPets.find(p => p.type === 'eule')) {
    wildPets.push({ type: 'eule', level: 0 });
    showToast('Eine Eule hat sich auf meinem Fensterbrett eingenistet... 🦉', TOAST.EVENT);
    navUnseen.pets = true;
  }

  render();

  // checkMilestones() steht absichtlich AM ENDE der Dialog-Kette:
  // Falls hier Raub 1 ausgelöst wird (totalGoldEarned >= 50), darf der
  // Raub-Dialog nicht von maybeTriggerFirstNightWatchDialog() überschrieben
  // werden — showDialog() hat keine Warteschlange, der zweite Aufruf
  // ersetzt den ersten sofort und der Reset-Callback geht verloren.
  maybeTriggerFirstNightWatchDialog(() => {
    maybeTriggerCommanderArrival(() => {
      maybeTriggerFirstNightWatchLevelUpDialog(() => {
        checkMilestones();
      });
    });
  });
}

/* ── Schlafen: beendet den Spieltag ───────────────────────── */
/** Direkt-Sleep für externe Orte (Lethkar-Pension etc.) ohne SLEEP_OPTIONS-Lookup. */
function sleepAt(id, cost, qualityTier) {
  if (!isNight()) return;
  if (resources.gold < cost) { showToast('Nicht genug Gold.', TOAST.ERROR); return; }
  finishSleep({ id, cost, qualityTier, hungerPenalty: 0 });
}

function sleep(optionId) {
  if (!isNight()) return; // Schlafen ist erst nach Einbruch der Nacht möglich (siehe renderSchlafplatz)

  const option = SLEEP_OPTIONS.find(o => o.id === optionId);
  if (!option) return;
  if (option.requiresFlag && !gameFlags[option.requiresFlag]) return;

  if (option.cost > 0 && resources.gold < option.cost) {
    showToast(`Nicht genug Gold für: ${option.name}.`, TOAST.ERROR);
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
  const recoveryMult         = nightFlags.recoveryDebuff ? (1 - getNightWatchRecoveryPenalty(option)) : 1;
  const tirednessRelief      = 100 * recoveryMult * getSleepQualityFactor(option);

  if (option.cost > 0) resources.gold -= option.cost;
  adjustTiredness(-tirednessRelief);
  if (option.hungerPenalty) adjustHunger(option.hungerPenalty);
  nightFlags.recoveryDebuff = false;

  restoreHpFromSleep(option);      // Kampf-HP anteilig wiederherstellen (combat.js)
  updateSleepDebt(tirednessBeforeSleep); // Schlafschuld aktualisieren (needs.js)

  const isFirstSleep = !gameFlags.firstSleepTriggered;
  gameFlags.firstSleepTriggered = true;
  playSfx('sleep');

  startNewDay();
  currentContent = currentCity === 'lethkar' ? 'lethkar' : 'treutheim';
  navLevel       = NAV_LEVEL.STADT;

  render();

  const finishMorning = () => maybeTriggerHungerDialog(() => {
    showToast(`Ein neuer Tag beginnt (Tag ${gameClock.day}).`, TOAST.INFO);
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
/* ── Velmark-Aktionen ─────────────────────────────────────────────── */

/** Sucht Pereth in Velmark (Story-Aktion, einmalig). */
function findPerethInVelmark() {
  if (gameFlags.perethFoundInVelmark) {
    openVelmarkNpcDialog('pereth_velmark');
    return;
  }
  maybeShowStoryDialog('4.2', () => {
    gameFlags.perethFoundInVelmark = true;
    openVelmarkNpcDialog('pereth_velmark');
    render();
  });
}

/** Startet einen Kontaktaufbau (Einfluss gewinnen). */
function kontaktKnuepfen() {
  if (!gameFlags.informantenNetzFreigeschaltet) {
    showToast('Ich kenne noch niemanden hier. Ich sollte zuerst Pereth finden.', TOAST.INFO);
    return;
  }
  const base    = 2 + (informanten.count || 0);
  const falkeB  = typeof getStadtfalkeInfluenceBonus === 'function' ? getStadtfalkeInfluenceBonus() : 0;
  const gained  = Math.round(base * (1 + falkeB));
  einfluss.points     += gained;
  einfluss.totalEarned += gained;
  informanten.lastTick = Date.now();
  showToast(`+${gained} Einfluss gewonnen.`, TOAST.EVENT);
  checkAchievements();
  saveGame({ silent: true });
  render();
}

/** Kauft die Netzwerkerweiterung (Meta-Upgrade). */
function buyNetzwerkAusbau() {
  const cost = 20;
  if (meta.netzwerkErweitert) return;
  if (einfluss.points < cost) return;
  einfluss.points -= cost;
  meta.netzwerkErweitert = true;
  informanten.count = (informanten.count || 0) + 2;
  showToast('Netzwerk ausgebaut — drei Informanten aktiv.', TOAST.EVENT);
  saveGame({ silent: true });
  render();
}

/** Kauft Velmark-Ausrüstung. */
function buyVelmarkRuestung() {
  const cost = 300;
  if (resources.gold < cost) {
    showToast(`Nicht genug Gold. Benötigt: ${cost}g.`, TOAST.WARNING);
    return;
  }
  if (meta.velmarkRuestung) {
    showToast('Ich habe diese Ausrüstung bereits.', TOAST.INFO);
    return;
  }
  resources.gold -= cost;
  meta.velmarkRuestung = true;
  showToast('Neue Ausrüstung aus Velmark — ich bin besser geschützt.', TOAST.EVENT);
  saveGame({ silent: true });
  render();
}

/** Kauft Verpflegung in Velmark. */

/** Startet oder erneuert den Informanten-Tick-Timer. */
function setupInformantenTick() {
  if (window._informantenInterval) clearInterval(window._informantenInterval);
  window._informantenInterval = setInterval(tickInformanten, 60 * 1000); // jede Minute
}

/** Wird jede Minute aufgerufen; vergibt Einfluss + checkt Stadtfalke-Unlock. */
function tickInformanten() {
  if (!gameFlags.informantenNetzFreigeschaltet) return;
  const count = informanten.count || 0;
  if (count <= 0) return;

  const falkeB  = typeof getStadtfalkeInfluenceBonus === 'function' ? getStadtfalkeInfluenceBonus() : 0;
  const gained  = Math.round(count * (1 + falkeB));
  einfluss.points      += gained;
  einfluss.totalEarned += gained;
  informanten.lastTick  = Date.now();

  // Stadtfalke-Unlock: 5 % Chance pro Tick wenn count >= 5 und noch nicht vorhanden
  if (count >= 5 && !pets.stadtfalke) {
    if (Math.random() < 0.05) {
      pets.stadtfalke = { level: 0 };
      navUnseen.pets = true;
      showToast('Ein Stadtfalke hat mich gefunden — er folgt mir nun.', TOAST.EVENT);
      checkAchievements();
    }
  }

  checkAchievements();
  saveGame({ silent: true });
  render();
}

function raidValdrisLager() {
  if (gameFlags.valdrisOperationRaided) return;
  gameFlags.valdrisOperationRaided = true;
  navUnseen.lethkar = true;
  render();
  setTimeout(() => {
    maybeShowStoryDialog('3.7', () => {
      checkQuestTriggers();
      render();
    });
  }, 300);
}

function triggerChapter2Victory() {
  if (gameFlags.chapter2Complete) return;

  maybeShowStoryDialog('2.7', () => {
    gameFlags.chapter2Complete = true;
    quests.theftInvestigation.state = QUEST_STATE.REWARDED;
    storyState = 20200;
    render();

    launchConfetti();

    showDialog({
      title: '🏆 Ein langer Weg — und noch ist er nicht zu Ende.',
      boxClass: 'dialog-box-wide',
      html: `
        <p style="font-size:1.1em;text-align:center;margin-bottom:12px">
          Ich habe es geschafft.
        </p>
        <p>
          Als Niemand in Treutheim angekommen — mit leeren Taschen und
          großen Träumen. Bestohlen worden, neu angefangen, gekämpft,
          gefragt, gesucht. Und jetzt kenne ich die Wahrheit.
        </p>
        <p>
          <strong>Der Schatten</strong> ist noch da draußen. Aber er weiß, dass ich
          existiere. Und das verändert alles.
        </p>
        <hr style="border-color:var(--border);margin:12px 0">
        <p style="color:var(--text-mid);font-size:0.85em">
          <strong>Was als nächstes kommt:</strong><br>
          • Eine neue Stadt jenseits von Treutheim<br>
          • Die Abenteurergilde als echte Organisation<br>
          • Der Schatten — wer ist er wirklich?<br>
          • Mehr Verbündete, mehr Feinde, mehr Geheimnisse
        </p>
        <hr style="border-color:var(--border);margin:12px 0">
        <p style="color:var(--text-lo);font-size:0.85em;text-align:center">
          Bleib auf dem Laufenden über zukünftige Updates:<br>
          <a href="https://discord.gg/NHenxsPh" target="_blank" style="color:var(--c-reward)">👾 Discord — Chroniken des vergessenen Weges</a><br><br>
          Danke fürs Spielen — wir hoffen, es hat Spaß gemacht. ✨
        </p>
      `,
      buttons: [{
        label: 'Das Abenteuer geht weiter!',
        onClick: () => {
          closeDialog();
          achievements.chapter2Complete = true;
          navUnseen.errungenschaften = true;
          showToast('🏆 Errungenschaft freigeschaltet: Chroniken des vergessenen Weges!', TOAST.EVENT);
          render();
        }
      }]
    });
  });
}

// ═══════════════════════════════════════════════════
// VELMARK-AKTIONEN (Kapitel 4)
// ═══════════════════════════════════════════════════

const HAFEN_DURATION_MS      = 3000;
const HAFEN_CLOCK_MINUTES    = 120;
const VELMARK_WACHE_DURATION_MS   = 4000;
const VELMARK_WACHE_CLOCK_MINUTES = 240;

function hafenarbeit() {
  if (!gameFlags.hafenarbeitUnlocked) return;
  if (gameFlags.isWorking || gameFlags.isStadtwacheShift || gameFlags.isHafenarbeit || gameFlags.isVelmarkWache) return;
  if (isNight()) return;
  gameFlags.isHafenarbeit = true;
  hafenProgress  = 0;
  hafenStartTime = Date.now();
  render();
  _scheduleHafenarbeit();
}
function _scheduleHafenarbeit() {
  if (hafenRafId) cancelAnimationFrame(hafenRafId);
  hafenRafId = requestAnimationFrame(_animateHafenarbeit);
}
function _animateHafenarbeit() {
  if (!gameFlags.isHafenarbeit) return;
  hafenProgress = Math.min(((Date.now() - hafenStartTime) / HAFEN_DURATION_MS) * 100, 100);
  const bar = document.getElementById('hafen-progress-bar');
  const lbl = document.getElementById('hafen-progress-label');
  if (bar) bar.style.width = hafenProgress + '%';
  if (lbl) lbl.textContent = Math.floor(hafenProgress) + '%';
  if (hafenProgress >= 100) { _completeHafenarbeit(); }
  else { hafenRafId = requestAnimationFrame(_animateHafenarbeit); }
}
function _completeHafenarbeit() {
  if (hafenRafId) { cancelAnimationFrame(hafenRafId); hafenRafId = null; }
  const baseGold     = 30 + Math.floor(Math.random() * 31);
  const einflussGain = 1 + (Math.random() < 0.4 ? 1 : 0);
  gameFlags.isHafenarbeit    = false;
  hafenProgress              = 0;
  resources.gold            += baseGold;
  resources.totalGoldEarned += baseGold;
  einfluss.points           += einflussGain;
  einfluss.totalEarned      += einflussGain;
  hafenStats.count           = (hafenStats.count || 0) + 1;
  adjustTiredness(12);
  adjustHunger(8);
  advanceClock(HAFEN_CLOCK_MINUTES);
  showToast(`Hafenarbeit: +${baseGold} Gold, +${einflussGain} Einfluss.`, TOAST.REWARD);
  checkQuestTriggers();
  render();
}

function velmarkStadtwache() {
  if (!gameFlags.velmarkStadtwacheUnlocked) return;
  if (gameFlags.isWorking || gameFlags.isStadtwacheShift || gameFlags.isHafenarbeit || gameFlags.isVelmarkWache) return;
  if (isNight()) return;
  gameFlags.isVelmarkWache  = true;
  velmarkWacheProgress  = 0;
  velmarkWacheStartTime = Date.now();
  render();
  _scheduleVelmarkWache();
}
function _scheduleVelmarkWache() {
  if (velmarkWacheRafId) cancelAnimationFrame(velmarkWacheRafId);
  velmarkWacheRafId = requestAnimationFrame(_animateVelmarkWache);
}
function _animateVelmarkWache() {
  if (!gameFlags.isVelmarkWache) return;
  velmarkWacheProgress = Math.min(((Date.now() - velmarkWacheStartTime) / VELMARK_WACHE_DURATION_MS) * 100, 100);
  const bar = document.getElementById('velmarkwache-progress-bar');
  const lbl = document.getElementById('velmarkwache-progress-label');
  if (bar) bar.style.width = velmarkWacheProgress + '%';
  if (lbl) lbl.textContent = Math.floor(velmarkWacheProgress) + '%';
  if (velmarkWacheProgress >= 100) { _completeVelmarkWache(); }
  else { velmarkWacheRafId = requestAnimationFrame(_animateVelmarkWache); }
}
function _completeVelmarkWache() {
  if (velmarkWacheRafId) { cancelAnimationFrame(velmarkWacheRafId); velmarkWacheRafId = null; }
  const baseGold = 40 + Math.floor(Math.random() * 41);
  gameFlags.isVelmarkWache  = false;
  velmarkWacheProgress      = 0;
  resources.gold            += baseGold;
  resources.totalGoldEarned += baseGold;
  einfluss.points           += 1;
  einfluss.totalEarned      += 1;
  adjustTiredness(15);
  adjustHunger(10);
  advanceClock(VELMARK_WACHE_CLOCK_MINUTES);
  showToast(`Velmark-Stadtwache: +${baseGold} Gold, +1 Einfluss.`, TOAST.REWARD);
  checkQuestTriggers();
  render();
}

function archivDurchsuchen() {
  if (!gameFlags.archivDurchsuchenUnlocked) return;
  const kosten = 5;
  if (einfluss.points < kosten) {
    showToast(`Erfordert ${kosten} Einfluss.`, TOAST.ERROR);
    return;
  }
  einfluss.points -= kosten;

  if (quests.archivRecherche) {
    quests.archivRecherche.count = (quests.archivRecherche.count || 0) + 1;
    if (quests.archivRecherche.count >= 3 && quests.archivRecherche.state === QUEST_STATE.ACTIVE) {
      quests.archivRecherche.state = QUEST_STATE.DONE;
      showToast('Archiv durchsucht — genug Material gesammelt. Zu Sele!', TOAST.EVENT);
    } else {
      showToast(`Archiv-Eintrag gefunden (${quests.archivRecherche.count}/3). −${kosten} Einfluss.`, TOAST.EVENT);
    }
  } else {
    showToast(`Archiv durchsucht. −${kosten} Einfluss.`, TOAST.EVENT);
  }
  checkQuestTriggers();
  render();
}

function unterweltVerhandlung() {
  if (!gameFlags.unterweltVerhandlungUnlocked) return;
  const kosten = 10;
  if (einfluss.points < kosten) {
    showToast(`Erfordert ${kosten} Einfluss.`, TOAST.ERROR);
    return;
  }
  einfluss.points -= kosten;
  informanten.count = (informanten.count || 0) + 1;
  informanten.lastTick = Date.now();
  if (!gameFlags.informantenNetzFreigeschaltet) {
    gameFlags.informantenNetzFreigeschaltet = true;
    setupInformantenTick();
  }

  showToast(`Unterwelt-Verhandlung: +1 Informant. −${kosten} Einfluss.`, TOAST.EVENT);
  checkQuestTriggers();
  render();
}

function lethkarHandel() {
  if (!gameFlags.lethkarUnlocked) return;
  const baseGold = 15 + Math.floor(Math.random() * 16); // 15-30g
  resources.gold = (resources.gold || 0) + baseGold;
  resources.totalGoldEarned = (resources.totalGoldEarned || 0) + baseGold;
  needs.tiredness = Math.min(100, (needs.tiredness || 0) + 8);
  needs.hunger = Math.min(100, (needs.hunger || 0) + 5);

  if (quests.lethkarMarkt) {
    quests.lethkarMarkt.goldTraded = (quests.lethkarMarkt.goldTraded || 0) + baseGold;
    if (quests.lethkarMarkt.goldTraded >= 200 && quests.lethkarMarkt.state === QUEST_STATE.ACTIVE) {
      quests.lethkarMarkt.state = QUEST_STATE.DONE;
      showToast('Lethkarer Händlermarkt gemeistert (+200g Handelsvolumen). Bericht an Varena!', TOAST.EVENT);
    }
  }

  showToast(`Lethkar-Handel: +${baseGold} Gold.`, TOAST.REWARD);
  checkQuestTriggers();
  render();
}

function startValdrisFinale() {
  if (gameFlags.valdrisFinaleStarted) return;
  gameFlags.valdrisFinaleStarted = true;
  if (quests.dieKonfrontation?.state === QUEST_STATE.UNSTARTED)
    quests.dieKonfrontation.state = QUEST_STATE.ACTIVE;
  maybeShowStoryDialog('4.9');
  showToast('Die Konfrontation beginnt. Es gibt kein Zurück mehr.', TOAST.EVENT);
  render();
}

// ── Valdris-Finale: vollständiger Node-Graph ─────────────────────────────
const VALDRIS_FINALE_NODES = {
  start: {
    text: [
      'Das Treffen findet im alten Lagerhaus am Nordkai statt. Kein Zufall — es ist der Ort, den Valdris selbst gewählt hat.',
      'Er steht am Fenster, den Rücken zu mir. Dreht sich um, als ich eintrete. Sieht mich an — nicht überrascht. Erwartet.',
      '"Du hast dir Mühe gegeben." Seine Stimme ist ruhig. Keine Bedrohung. Keine Nervosität.',
      '"Drei Fraktionen. Das Dokument. Sele, Yeva, Gorr — alle auf deiner Seite." Er lächelt dünn.',
      '"Ich unterschätze selten. Dich habe ich unterschätzt."',
      'Eine lange Pause. Dann: "Was willst du?"'
    ],
    options: [
      { label: '"Dich vor Gericht bringen."', next: 'gericht_1' },
      { label: '"Velmark verlassen — für immer."', next: 'exil_1' }
    ]
  },

  // ── Pfad A: Gericht ──────────────────────────────────────────────────
  gericht_1: {
    text: [
      'Er hebt eine Augenbraue. Fast amüsiert.',
      '"Gericht." Er dreht sich wieder zum Fenster. "Du weißt, wen der Stadtrat hört. Wen er kennt."',
      '"Drei Jahre habe ich gebraucht, ihn zu kaufen. Einen nach dem anderen. Diskret. Geduldig."',
      '"Der Stadtrat hört auf mich."'
    ],
    options: [{ label: '"Das war früher."', next: 'gericht_2' }]
  },
  gericht_2: {
    text: [
      'Stille.',
      'Dann: Schritte. Die Tür öffnet sich.',
      'Yeva tritt ein — mit einem geschlossenen Aktenordner. Hinter ihr: Gorr, eine Hand am Schwertgriff. Sele, mit drei Dokumentenkopien unter dem Arm.',
      '"Heute nicht", sagt Yeva. Sie legt den Ordner auf den Tisch zwischen uns.',
      '"Der Stadtrat hat die Originale bereits erhalten."'
    ],
    options: [{ label: 'Ich trete vor. "Es ist vorbei, Valdris."', next: 'gericht_3' }]
  },
  gericht_3: {
    text: [
      'Er schaut die drei an. Dann mich. Dann wieder die drei.',
      'Und für einen Moment — einen einzigen, echten Moment — sieht er nicht wie ein Netzwerker aus. Nicht wie ein Strippenzieher.',
      'Er sieht müde aus.',
      '"Ihr habt das gut gemacht." Er streckt langsam die Hände aus.',
      '"Besser als ich erwartet hätte."'
    ],
    options: [{
      label: 'Gorr legt ihm die Hand auf die Schulter. Das war es.',
      next: null,
      action: () => { triggerValdrisSieg(false); }
    }]
  },

  // ── Pfad B: Exil ─────────────────────────────────────────────────────
  exil_1: {
    text: [
      'Stille. Er betrachtet mich neu. Länger.',
      '"Exil." Er wiederholt das Wort, als ob er seine Qualität prüfe.',
      '"Du bist... verhandlungsbereit. Das hätte ich nicht erwartet."',
      '"Wenn ich gehe — was garantierst du mir?"'
    ],
    options: [{ label: '"Dein Leben. Deine Freiheit. Nur nicht in Velmark."', next: 'exil_2' }]
  },
  exil_2: {
    text: [
      'Er geht zum Tisch. Lehnt sich drauf.',
      '"Heute Nacht. Nordtor. Mit zehn Leuten — nicht mehr. Vor Sonnenaufgang draußen."',
      '"Das Netz hier: ich löse es auf. Die Namen, die Schulden — ich lasse das fallen."',
      'Eine Pause. "Und du gibst mir dreißig Jahre Abstand."',
      '"Das ist das Abkommen."'
    ],
    options: [{ label: '"Abgemacht."', next: 'exil_3' }]
  },
  exil_3: {
    text: [
      'Er nickt. Einmal. Dann dreht er sich um und geht.',
      'Keine weitere Worte. Kein letzter Blick.',
      'Gorr tritt neben mich. "War das klug?"',
      'Ich brauche einen Moment.',
      '"Vielleicht nicht. Aber ich habe entschieden — nicht das Gesetz, nicht die Gilde. Sondern ich."',
      'Die Tür schließt sich. In drei Stunden ist er weg.'
    ],
    options: [{
      label: 'Den Rest der Nacht stehen wir Wache.',
      next: null,
      action: () => { triggerValdrisSieg(true); }
    }]
  }
};

function openValdrisNode(nodeId) {
  const node = VALDRIS_FINALE_NODES[nodeId];
  if (!node) return;
  const paragraphs = Array.isArray(node.text) ? node.text : [node.text];
  const buttons = node.options.map(opt => ({
    label: opt.label,
    onClick: () => {
      if (opt.action) opt.action();
      if (opt.next) openValdrisNode(opt.next);
      else closeDialog();
    }
  }));
  showPaginatedDialog('Die Konfrontation', splitLongDialogPages(paragraphs), buttons, null);
}

function launchValdrisKonfrontation() {
  if (!gameFlags.valdrisFinaleStarted) return;
  if (quests.dieKonfrontation?.state !== QUEST_STATE.ACTIVE) return;
  openValdrisNode('start');
}

function triggerValdrisSieg(exil) {
  closeDialog();
  quests.dieKonfrontation.state = QUEST_STATE.REWARDED;
  gameFlags.kap4Complete = true;
  render();

  maybeShowStoryDialog('4.10', () => {
    launchConfetti();

    const exilText = exil
      ? `<p>Valdris ist weg. Kein Urteil — aber auch kein Netz mehr. Manchmal ist das, was bleibt, wichtiger als das, was endet.</p>`
      : `<p>Valdris steht vor dem Stadtrat. Das Netz ist aufgedeckt. Was drei Fraktionen allein nicht konnten, hat eine Person zusammengebracht.</p>`;

    showDialog({
      title: '🏆 Das Ende eines Weges.',
      boxClass: 'dialog-box-wide',
      html: `
        <p style="font-size:1.1em;text-align:center;margin-bottom:12px">
          Von Treutheim nach Velmark. Von Niemand zu dem, der das Netz zerschnitten hat.
        </p>
        ${exilText}
        <p>
          Varena wird schreiben. Thessa auch, irgendwann. Pereth sitzt wahrscheinlich schon
          in der nächsten Stadt und wartet mit einem Bier.
        </p>
        <p>Und ich? Ich stehe im Morgenlicht von Velmark — und denke daran, was als nächstes kommt.</p>
        <hr style="border-color:var(--border);margin:12px 0">
        <p style="color:var(--text-mid);font-size:0.85em">
          <strong>Das war Kapitel 4.</strong><br>
          Das Spiel wird weiter wachsen — neue Kapitel, neue Gesichter, neue Geheimnisse.<br>
          Danke, dass du bis hierher dabei warst.
        </p>
        <hr style="border-color:var(--border);margin:12px 0">
        <p style="color:var(--text-lo);font-size:0.85em;text-align:center">
          Bleib auf dem Laufenden:<br>
          <a href="https://discord.gg/NHenxsPh" target="_blank" style="color:var(--c-reward)">👾 Discord — Chroniken des vergessenen Weges</a><br><br>
          Danke fürs Spielen. ✨
        </p>
      `,
      buttons: [{
        label: 'Das Abenteuer geht weiter.',
        onClick: () => {
          closeDialog();
          achievements.kap4Abschluss = true;
          navUnseen.errungenschaften = true;
          showToast('🏆 Errungenschaft freigeschaltet: Der Preis des Einflusses!', TOAST.EVENT);
          render();
        }
      }]
    });
  });
}

function sammleWildkraut() {
  if (quests.varenaErstkontakt?.state !== QUEST_STATE.ACTIVE) return;
  if ((questItems.wildkraut || 0) >= 5) return;
  questItems.wildkraut = (questItems.wildkraut || 0) + 1;
  needs.tiredness = Math.min(100, (needs.tiredness || 0) + 5);
  needs.hunger    = Math.min(100, (needs.hunger    || 0) + 3);
  const count = questItems.wildkraut;
  showToast(`Wildkraut gesammelt (${count}/5).`, TOAST.REWARD);
  if (count >= 5) {
    quests.varenaErstkontakt.state = QUEST_STATE.DONE;
    showToast('Genug Wildkraut! Varena in der Taverne aufsuchen.', TOAST.EVENT);
  }
  checkQuestTriggers();
  render();
}

function untersucheValdrisOrt(ort) {
  const qs = quests.valdrisSpuren?.state;
  if (!qs) return;
  if (ort === 1 && qs === 'ort1') {
    quests.valdrisSpuren.state = QUEST_STATE.ORT2;
    valdrisProfil.netzwerk = true;
    showToast('Valdris\' Spur: Taverne untersucht. Nächster Hinweis: der Markt.', TOAST.EVENT);
  } else if (ort === 2 && qs === 'ort2') {
    quests.valdrisSpuren.state = QUEST_STATE.ORT3;
    valdrisProfil.kontakte = true;
    showToast('Valdris\' Spur: Markt untersucht. Nächster Hinweis: der Stadtrand.', TOAST.EVENT);
  } else if (ort === 3 && qs === 'ort3') {
    showToast('Stadtrand untersucht. Das Bild wird klarer — Varena hat mehr dazu zu sagen.', TOAST.EVENT);
  }
  checkQuestTriggers();
  render();
}
