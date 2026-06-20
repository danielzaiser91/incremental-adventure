/* ══════════════════════════════════════════════════════════════
   needs.js — Hunger & Müdigkeit
   Beide Werte laufen von 0 (bestens) bis 100 (kritisch).
   Wichtig: Müdigkeit blockiert Arbeit NIE hart — stattdessen dauert
   Arbeit nur länger, der Ertrag pro Durchgang bleibt gleich (Müdigkeit
   bestraft Zeit, nicht Lohn). Das verhindert einen Soft-Lock, bei dem
   der Spieler nie den Abend erreicht, und bestraft trotzdem das
   Ignorieren von Müdigkeit. Hunger wirkt stattdessen gestaffelt auf den
   Ertrag (siehe getHungerTier()/getWorkReward(), bis zu -90% bei 100%
   Hunger) UND beschleunigt den Müdigkeitsaufbau — das ist bewusst
   anders, weil Hunger eine andere Art von Schwäche darstellt als reine
   Erschöpfung (Kraft statt Zeit).
   ══════════════════════════════════════════════════════════════ */

'use strict';

function adjustHunger(delta) {
  needs.hunger = Math.max(0, Math.min(100, needs.hunger + delta));
}

function adjustTiredness(delta) {
  needs.tiredness = Math.max(0, Math.min(100, needs.tiredness + delta));
}

/**
 * Gestaffelter Hunger-Debuff. Schwächt anders als Müdigkeit den Ertrag pro
 * Durchgang (nicht die Dauer) UND beschleunigt den Müdigkeitsaufbau — Hunger
 * kostet Kraft, Müdigkeit kostet nur Zeit (siehe getTirednessTier()).
 * @param {number} hunger
 * @returns {{ id:string, label:string, rewardMult:number, tirednessGainMult:number }}
 */
function getHungerTier(hunger) {
  if (hunger >= 100) {
    return { id: 'verhungernd', label: 'Verhungernd', rewardMult: 0.1, tirednessGainMult: 2.0 };
  }
  if (hunger >= 80) {
    return { id: 'sehr-hungrig', label: 'Sehr hungrig', rewardMult: 0.5, tirednessGainMult: 1.5 };
  }
  if (hunger >= 50) {
    return { id: 'hungrig', label: 'Hungrig', rewardMult: 0.85, tirednessGainMult: 1.15 };
  }
  return { id: 'satt', label: 'Satt', rewardMult: 1, tirednessGainMult: 1 };
}

/** Ist der Spieler so hungrig, dass irgendein Hunger-Debuff aktiv ist? */
function isStarving() {
  return getHungerTier(needs.hunger).id !== 'satt';
}

/* Reihenfolge der Tier-IDs, 0 = kein Debuff. Dient nur der Stärke-Anzeige
   ("Müdigkeit 3/3", siehe stats.js) — die eigentlichen Spielwerte kommen
   weiterhin aus getHungerTier()/getTirednessTier(). */
const HUNGER_TIER_IDS     = ['satt', 'hungrig', 'sehr-hungrig', 'verhungernd'];
const TIREDNESS_TIER_IDS  = ['frisch', 'muede', 'sehr-muede', 'erschoepft'];
const NEEDS_TIER_MAX      = HUNGER_TIER_IDS.length - 1; // = TIREDNESS_TIER_IDS.length - 1

/** Liefert 0–3: wie stark der aktuelle Hunger-Debuff ist (0 = "Satt"). */
function getHungerTierIndex(hunger) {
  return HUNGER_TIER_IDS.indexOf(getHungerTier(hunger).id);
}

/** Liefert 0–3: wie stark der aktuelle Müdigkeits-Debuff ist (0 = "Ausgeruht"). */
function getTirednessTierIndex(tiredness) {
  return TIREDNESS_TIER_IDS.indexOf(getTirednessTier(tiredness).id);
}

/**
 * Gestaffelter Müdigkeits-Debuff. Blockiert nie, verlängert aber die
 * Arbeitsdauer, je höher die Müdigkeit ist — der Ertrag pro Durchgang
 * bleibt davon unangetastet (nur Hunger wirkt auf den Ertrag).
 * @param {number} tiredness
 * @returns {{ id:string, label:string, durationMult:number }}
 */
function getTirednessTier(tiredness) {
  if (tiredness >= 100) {
    return { id: 'erschoepft', label: 'Erschöpft', durationMult: 2.2 };
  }
  if (tiredness >= 80) {
    return { id: 'sehr-muede', label: 'Sehr müde', durationMult: 1.7 };
  }
  if (tiredness >= 50) {
    return { id: 'muede', label: 'Müde', durationMult: 1.3 };
  }
  return { id: 'frisch', label: 'Ausgeruht', durationMult: 1 };
}

