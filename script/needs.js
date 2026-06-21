/* ══════════════════════════════════════════════════════════════
   needs.js — Hunger & Müdigkeit
   Beide Werte laufen von 0 (bestens) bis 100 (kritisch).
   Müdigkeit blockiert Arbeit NIE hart — stattdessen dauert Arbeit
   länger je müder der Spieler ist (5 Stufen mit steileren Strafen
   als zuvor). Der Ertrag bleibt unangetastet; nur Hunger schwächt ihn.
   Hunger beschleunigt außerdem den Müdigkeitsaufbau.

   Schlafschuld (sleepDebt, 0–2): Wer mit >70 % Müdigkeit einschläft
   und unvollständig erholt aufwacht (>30 %), baut eine Schuld auf.
   Die Schuld erhöht am Folgetag den Müdigkeitsaufbau (+20 % / +40 %).
   Erst nach einer vollständigen Erholung (<30 % nach dem Schlafen)
   wird die Schuld schrittweise abgebaut.
   ══════════════════════════════════════════════════════════════ */

'use strict';

function adjustHunger(delta) {
  needs.hunger = Math.max(0, Math.min(100, needs.hunger + delta));
}

function adjustTiredness(delta) {
  needs.tiredness = Math.max(0, Math.min(100, needs.tiredness + delta));
}

/**
 * Gestaffelter Hunger-Debuff. Schwächt den Ertrag (nicht die Dauer) und
 * beschleunigt den Müdigkeitsaufbau.
 * @returns {{ id, label, rewardMult, tirednessGainMult }}
 */
function getHungerTier(hunger) {
  if (hunger >= 100) return { id: 'verhungernd',  label: 'Verhungernd',  rewardMult: 0.1,  tirednessGainMult: 2.0 };
  if (hunger >= 80)  return { id: 'sehr-hungrig', label: 'Sehr hungrig', rewardMult: 0.5,  tirednessGainMult: 1.5 };
  if (hunger >= 50)  return { id: 'hungrig',      label: 'Hungrig',      rewardMult: 0.85, tirednessGainMult: 1.15 };
  return                    { id: 'satt',          label: 'Satt',         rewardMult: 1,    tirednessGainMult: 1 };
}

/** Ist der Spieler so hungrig, dass irgendein Hunger-Debuff aktiv ist? */
function isStarving() {
  return getHungerTier(needs.hunger).id !== 'satt';
}

/* Tier-IDs, 0 = kein Debuff. Dient der Stärke-Anzeige ("Müdigkeit 3/4"). */
const HUNGER_TIER_IDS    = ['satt', 'hungrig', 'sehr-hungrig', 'verhungernd'];
const TIREDNESS_TIER_IDS = ['frisch', 'leicht-muede', 'muede', 'sehr-muede', 'erschoepft'];
const NEEDS_TIER_MAX     = HUNGER_TIER_IDS.length - 1;

/** 0–3: Stärke des Hunger-Debuffs (0 = kein). */
function getHungerTierIndex(hunger) {
  return HUNGER_TIER_IDS.indexOf(getHungerTier(hunger).id);
}

/** 0–4: Stärke des Müdigkeits-Debuffs (0 = kein). */
function getTirednessTierIndex(tiredness) {
  return TIREDNESS_TIER_IDS.indexOf(getTirednessTier(tiredness).id);
}

/**
 * Gestaffelter Müdigkeits-Debuff (5 Stufen).
 * Blockiert nie, verlängert aber die Arbeitsdauer deutlich stärker
 * als zuvor — der Ertrag pro Durchgang bleibt davon unangetastet.
 * Stufen-Schwellen und Multiplikatoren nach Spieltest überarbeitet:
 * - Debuff setzt früher ein (40 % statt 50 %)
 * - Erschöpfung schon ab 95 % (nicht erst 100 %)
 * - Steilerer Anstieg der Dauer-Strafe auf Spitze (2.8× statt 2.2×)
 * @returns {{ id, label, durationMult }}
 */
function getTirednessTier(tiredness) {
  if (tiredness >= 95) return { id: 'erschoepft',   label: 'Erschöpft',   durationMult: 2.8 };
  if (tiredness >= 75) return { id: 'sehr-muede',   label: 'Sehr müde',   durationMult: 1.9 };
  if (tiredness >= 55) return { id: 'muede',         label: 'Müde',         durationMult: 1.45 };
  if (tiredness >= 35) return { id: 'leicht-muede', label: 'Leicht müde', durationMult: 1.15 };
  return                      { id: 'frisch',        label: 'Ausgeruht',   durationMult: 1 };
}

/**
 * Multiplikator für den Müdigkeitsaufbau aus der Schlafschuld (0–2).
 * Wird in getWorkTirednessGain() (actions.js) angewendet.
 */
function getSleepDebtMult() {
  if (needs.sleepDebt >= 2) return 1.4;
  if (needs.sleepDebt >= 1) return 1.2;
  return 1;
}

/**
 * Aktualisiert die Schlafschuld nach dem Einschlafen.
 * Muss VOR startNewDay() aufgerufen werden (aus finishSleep in actions.js).
 * @param {number} tirednessBeforeSleep - Müdigkeit unmittelbar vor dem Schlafen
 */
function updateSleepDebt(tirednessBeforeSleep) {
  if (needs.tiredness < 30) {
    // Vollständige Erholung: Schuld um 1 abbauen
    needs.sleepDebt = Math.max(0, needs.sleepDebt - 1);
  } else if (tirednessBeforeSleep > 70) {
    // Mit hoher Müdigkeit eingeschlafen und nicht vollständig erholt
    needs.sleepDebt = Math.min(2, needs.sleepDebt + 1);
  }
  // Zwischen 30–70 vor dem Schlafen: Schuld bleibt unverändert
}
