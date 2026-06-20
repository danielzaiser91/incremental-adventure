/* ══════════════════════════════════════════════════════════════
   state.js — Zentraler Spielzustand
   Einzige Source of Truth für storyState + resources + meta.
   ══════════════════════════════════════════════════════════════ */

'use strict';

const SAVE_KEY = 'chronicles_v1';
const WORK_DURATION_BASE_MS = 2000;

/* Aktuelle Spielstand-Versionsnummer (siehe save.js). Dient NICHT der
   Zukunftssicherheit selbst (die kommt aus den Default-Merges in
   loadGame()/applySaveData()), sondern als Vergleichswert für
   SAVE_CHANGELOG: lädt ein Spielstand mit einer älteren Nummer, zeigt
   showSaveChangelogDialog() einmalig eine kurze Zusammenfassung, was sich
   seither geändert hat. Bei jedem spürbaren Inhalts-Update: Nummer um 1
   erhöhen UND einen neuen Eintrag in SAVE_CHANGELOG ergänzen. */
const CURRENT_SAVE_VERSION = 5;

/* Kurzer Changelog je Spielstand-Versionssprung — bewusst knapp (ein
   Halbsatz pro Punkt), nicht der volle Commit-Verlauf. Schlüssel = die
   Versionsnummer, AB der diese Punkte gelten (siehe
   showSaveChangelogDialog() in save.js). Ältere Inhalts-Updates, die vor
   Einführung dieses Systems ohne Versionssprung auskamen, sind gesammelt
   unter der ersten Nummer hinterlegt, bei der sauber mitgezählt wurde. */
const SAVE_CHANGELOG = {
  4: [
    'Neue Charaktere: Greta (Krämerin) mit eigener Sammel-Questkette, Kommandant Roswald.',
    'Neuer Sammelplatz: Holz, Stein und Wildkraut sammeln (Werkzeug beim Krämer kaufen).',
    'Nachtwache hat jetzt ein eigenes Level-System und einen Weg zur Stadtwache.',
    'Erfahrungs-Skillbaum auf drei Äste erweitert, mit Tab-Ansicht für Skillbaum/Lebenserfahrungen.',
    'Feldarbeits-Boni neu kalibriert (Hunger/Müdigkeit ausgewogener gestaffelt).',
    'Automatisches Speichern/Laden sowie Export/Import über die Zwischenablage.',
    'Getrennter Verlauf für Meldungen und Dialoge in den Einstellungen.'
  ],
  5: [
    'EP-Skills zeigen jetzt einen Hinweis, wenn sie weitere Fähigkeiten freischalten.',
    'Kleinere Balance- und Dialog-Verbesserungen (u.a. günstigere Sparsamkeit, mehr NPC-Tiefe).',
    'Dieser Update-Hinweis beim Laden eines älteren Spielstands ist selbst neu.'
  ]
};

/* Gemeinsame Gold-Schwelle für den Raub UND das Minimum, ab dem ein
   Neuanfang überhaupt Erfahrung bringt (siehe actions.js/experience.js).
   Eine Konstante statt zwei, damit beide immer zusammenpassen. */
const GOLD_MILESTONE_THRESHOLD = 50;

/* Maximale Anzahl unterschiedlicher Gegenstands-Typen im Inventar (siehe
   inventory.js). Voll belegte Plätze verhindern neue NICHT — aufgezwungene
   Gegenstände (z.B. NPC-Geschenke) landen dann im `overflowBag`. */
const INVENTORY_SLOT_COUNT = 12;

/* storyState-Format: [Kapitel 1-stellig][Unterkapitel 2-stellig][Schritt 2-stellig]
   Beispiel: 10102 → Kapitel 1, Unterkapitel 01, Schritt 02 */
let storyState = 10100;

let resources = {
  gold:               0,
  totalGoldEarned:    0,  // Lebenszeit-Gold, übersteht Kapitel-Resets
  inventory:          {}, // itemId -> Anzahl, z.B. { brot: 2 }
  totalResourcesSold: 0   // Lebenszeit-Zähler verkaufter Rohstoffe (Greta), siehe market.js
};

/* Fortschritt, der Kapitel-Resets überlebt (Meta-Progression) */
let meta = {
  resets:            0,      // Anzahl der bewusst vom Spieler ausgelösten Neuanfänge
  fasterWorkUnlocked: false  // Erleichterung nach dem 1. Neuanfang
};

/* Ausrüstungs-Slots: itemId oder null. Ausgerüstetes wirkt sich aufs
   Spiel aus (siehe getWorkReward()), unausgerüstetes liegt nur im
   Inventar (siehe EQUIPMENT_ITEMS in inventory.js). */
let equipment = {
  hands:  null,
  guertel: null
};

/* Erfahrung (EP) — die Prestige-Währung des manuellen Neuanfangs (siehe
   experience.js). Übersteht Neuanfänge per Definition (sie ENTSTEHT erst
   durch sie). `points` ist ausgebbar, `totalEarned` ein reiner
   Lebenszeit-Zähler fürs Debug-Panel. */
let experience = {
  points:      0,
  totalEarned: 0
};

/* Erfahrungs-Skillbaum (siehe experience.js für Kosten/Effekte).
   `thrift` hat Stufen (0–2), der Rest ist ein einfacher Kauf-Flag. */
let skills = {
  jobLeveling:      false, // Grundvoraussetzung, damit Job-Level überhaupt wirken
  fieldworkMemory:  false, // Feldarbeits-Level übersteht einen Neuanfang
  ironWill:         false, // Hunger beschleunigt den Müdigkeitsaufbau nur noch halb so stark
  nightWatchLeveling: false, // Schaltet ein Erfahrungs-Level-System für die Nachtwache frei
  thrift:           0,     // Marktplatz-Preise -10% je Stufe (max. Stufe 2)
  clearMind:        false, // +1 EP bei jedem zukünftigen Neuanfang
  goldBreakthrough: false, // Gold-Meilensteine zählen einzeln statt nur "Grenze erreicht?"
  guildPrep:        false, // Teures Endknoten-Upgrade — schaltet die Gilden-Questkette bei Brakka frei
  inventoryKeeper:  false, // Inventar/Ausrüstung übersteht künftig einen Neuanfang
  sleepLikeARock:   false  // +1 Schlafqualitäts-Stufe bei jedem Schlafplatz
};

let gameFlags = {
  milestoneStrangerTriggered: false,
  robberyTriggered:            false,
  firstSleepTriggered:         false,
  jobSearchDialogShown:        false, // "Wo finde ich Arbeit?"-Monolog bei erstem Betreten Treutheims
  tavernVisited:               false, // Monolog beim ersten Betreten der Taverne
  jobUnlocked:                 false, // Wirt hat die Feldarbeit vermittelt -> Arbeitsplatz erscheint
  firstWorkDialogShown:        false, // Monolog nach der allerersten Feldarbeit
  firstLevelUpDialogShown:     false, // Monolog beim ersten Feldarbeits-Level-Up
  firstNightDialogShown:       false, // Monolog beim ersten Einbruch der Nacht; schaltet auch Schlafplatz frei
  hungerDialogShown:           false, // Monolog beim ersten Hunger-Debuff; schaltet auch Marktplatz frei
  everOwnedItem:               false, // War jemals etwas im Inventar -> schaltet Inventar-Nav frei
  resetLayerUnlocked:          false, // Nach dem Raub -> schaltet "Erfahrung"-Tab frei
  firstManualResetExplained:   false, // Großer Erklär-Monolog nur beim 1. manuellen Neuanfang
  breadLimitDialogShown:       false, // Hinweis-Monolog beim 1. Erreichen eines Verpflegungs-Tageslimits
  foremanInviteShown:          false, // Einladungs-Monolog nach 10 Feldarbeiten (noch keine Belohnung)
  foremanBonusGiven:           false, // Erst NACH dem Gespräch mit dem Vorarbeiter: +1 Gold dauerhaft
  mustEatBread:                false, // Blockiert Arbeit, bis nach dem 1. Hunger-Debuff Brot gegessen wurde
  workBlockedDialogShown:      false, // Erklär-Monolog beim 1. Mal, dass Arbeit wegen Hunger blockiert ist
  kraemerinDialogShown:        false, // Ladentheken-Gespräch nach dem 1. Neuanfang; schaltet Lederhandschuhe frei
  resourceGatheringUnlocked:   false, // Nach Gretas Taverne-Gespräch -> Sammelplatz-Nav erscheint
  guildExplainedByBrakka:      false, // Unterscheidet 1. Erklärung von späteren "bist du bereit?"-Nachfragen
  commanderInviteShown:        false, // Einladungs-Monolog nach 3x Nachtwache
  firstNightWatchLevelUpShown: false, // Monolog beim 1. Nachtwache-Level-Up
  commanderRecruitmentShown:   false, // Stadtwache-Beitritts-Angebot nach 1. Arbeit auf Nachtwache-Lvl 3
  isWorking:                   false
};

/* Welche progressiv freigeschalteten Nav-Elemente noch nicht angeklickt
   wurden (siehe nav.js) — solange `true`, zeigt der Button eine dezente
   Hervorhebung; ein Klick räumt sie auf und zeigt ggf. eine kurze
   Vorstellung des Features (siehe NAV_INTRO_TEXT in actions.js). */
let navUnseen = {
  arbeitsplatz: true,
  marktplatz:   true,
  schlafplatz:  true,
  quests:       true,
  inventar:     true,
  erfahrung:    true,
  taverne:      false, // wird ab Tag 2 erneut auf true gesetzt, siehe clock.js
  rohstoffe:    true
};

/* Wie oft heute bereits von welchem Marktplatz-Gut gekauft wurde —
   limitiert z.B. Brot pro Tag (siehe market.js). Wird in startNewDay()
   zurückgesetzt (clock.js). */
let dailyPurchases = {};

/* Gegenstände, die dem Spieler aufgezwungen wurden (z.B. NPC-Geschenke),
   während das normale Inventar bereits voll war (siehe inventory.js,
   grantItem()). Nur sichtbar, wenn nicht leer. */
let overflowBag = {};

/* Questgegenstände — bewusst getrennt vom normalen Inventar (siehe
   inventory.js): sie zählen nicht gegen INVENTORY_SLOT_COUNT und
   verschwinden automatisch, sobald die zugehörige Quest abgegeben wurde. */
let questItems = {};

/* Fortschritt der Nachtwache (Erfahrungs-Level analog zur Feldarbeit, aber
   erst nach dem Skill "Nächtliche Routine" relevant, siehe actions.js). */
let nightWatchStats = { count: 0 };

/* Bedürfnisse: 0 (bestens) bis 100 (kritisch) */
let needs = {
  hunger:     15,
  tiredness:  0
};

/* Tageszeit / Spieltag-Zähler */
let gameClock = {
  day:    1,
  hour:   7,
  minute: 0
};

/* Nächtliche Einmal-pro-Tag-Aktionen */
let nightFlags = {
  nightActivityUsedToday: false,
  recoveryDebuff:         false // Nachtwache schwächt die nächste Schlaf-Erholung
};

/* Quest-Fortschritt. Zustände je Quest: 'unstarted' | 'active' | 'done' | 'rewarded' */
let quests = {
  nightWatch:       { state: 'unstarted' },
  miraLetter:       { state: 'unstarted' },
  foremanRaise:     { state: 'unstarted' },
  kraemerinBusiness: { state: 'unstarted' }, // 'unstarted' -> 'invited' -> 'active' -> 'rewarded'
  guildRegistration: { state: 'unstarted' },
  commanderTraining: { state: 'unstarted' }
};

/* Einmalige NPC-Interaktionen, die sich dauerhaft auf den Dialog auswirken */
let npcFlags = {
  miraDrinkGiven: false
};

/* Fortschritt in der Feldarbeit (Erfahrungs-/Level-System, siehe actions.js) */
let workStats = {
  count: 0 // Anzahl insgesamt abgeschlossener Feldarbeits-Durchgänge
};

/* Spieler-Einstellungen, die das Spielgefühl betreffen (nicht den Fortschritt) */
let settings = {
  toastDurationMs: 2600,
  // Pro Reset-"Ebene" einzeln umschaltbar, ob vor dem Klick auf "Neu
  // anfangen" noch ein Bestätigungsdialog kommt (siehe experience.js,
  // startManualReset()). Aktuell gibt es nur die Kapitel-1-Ebene
  // ("erfahrung"), das Objekt ist aber bewusst erweiterbar für spätere
  // Akt-Übergänge.
  warnBeforeReset: { erfahrung: true },
  // Periodisches automatisches Speichern (siehe save.js, setupAutoSave()).
  autoSave: { enabled: true, intervalMinutes: 5 },
  // Lädt beim Start automatisch den letzten Spielstand, falls vorhanden
  // (siehe save.js, shouldAutoLoad(), aufgerufen aus main.js init()).
  autoLoad: true
};

/* Verlauf der letzten Toast-Meldungen (neueste zuerst, max. 100). */
let toastHistory = [];

/* Verlauf der letzten Dialogseiten (neueste zuerst, max. 100) — bewusst
   GETRENNT von toastHistory (siehe Einstellungen, Verlaufs-Filter):
   Toasts sind kurze Reaktionen, Dialoge sind erzählte Szenen, beide
   gemeinsam in einer Liste wären unübersichtlich. */
let dialogHistory = [];

/* Welche einmaligen Story-Dialoge wurden bereits gezeigt (IDs aus story.js) */
let shownDialogs = [];

/* ── UI-State ─────────────────────────────────────────────── */
let navLevel       = 0;            // 0=Hauptmenü | 1=Weltkarte | 2=Treutheim
let currentContent = 'geschichte'; // 'geschichte' | 'weltkarte' | 'treutheim' | 'arbeitsplatz' | 'marktplatz' |
                                    // 'taverne' | 'schlafplatz' | 'inventar' | 'quests' | 'chronik' | 'settings'
let marketVendor   = null;         // null=Markt-Übersicht | 'kraemer' | 'schmiede'
let jobInfoPanelOpen = false;      // UI-Klapp-Zustand des Level-Info-Panels auf der Job-Kachel
let erfahrungTab     = 'skills';   // 'skills' | 'lessons' — siehe experience.js, renderErfahrung()
let historyFilter    = 'toasts';   // 'toasts' | 'dialoge' — siehe content.js, renderSettings()

/* ── Arbeits-Animation State ──────────────────────────────── */
let workProgress  = 0;
let workStartTime = null;
let workRafId     = null;

/* ══════════════════════════════════════════════════════════════
   STATE-HILFSFUNKTIONEN
   ══════════════════════════════════════════════════════════════ */

/**
 * Dekodiert einen storyState-Integer in seine Bestandteile.
 * @param {number} s - Der Story-State
 * @returns {{ chapter, subchapter, step }}
 */
function decodeState(s) {
  return {
    chapter:    Math.floor(s / 10000),
    subchapter: Math.floor((s % 10000) / 100),
    step:       s % 100
  };
}

/** Setzt einen neuen storyState und triggert ein vollständiges UI-Update. */
function setState(newState) {
  storyState = newState;
  render();
}
