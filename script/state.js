/* ══════════════════════════════════════════════════════════════
   state.js — Zentraler Spielzustand
   Einzige Source of Truth für storyState + resources + meta.
   ══════════════════════════════════════════════════════════════ */

'use strict';

const SAVE_KEY = 'chronicles_v1';
const GAME_VERSION = '0.14.3-alpha';
const WORK_DURATION_BASE_MS = 2000;

/* Aktuelle Spielstand-Versionsnummer (siehe save.js). Dient NICHT der
   Zukunftssicherheit selbst (die kommt aus den Default-Merges in
   loadGame()/applySaveData()), sondern als Vergleichswert für
   SAVE_CHANGELOG: lädt ein Spielstand mit einer älteren Nummer, zeigt
   showSaveChangelogDialog() einmalig eine kurze Zusammenfassung, was sich
   seither geändert hat. Bei jedem spürbaren Inhalts-Update: Nummer um 1
   erhöhen UND einen neuen Eintrag in SAVE_CHANGELOG ergänzen. */
const CURRENT_SAVE_VERSION = 13;

/* Kurzer Changelog je Spielstand-Versionssprung — bewusst knapp (ein
   Halbsatz pro Punkt), nicht der volle Commit-Verlauf. Schlüssel = die
   Versionsnummer, AB der diese Punkte gelten (siehe
   showSaveChangelogDialog() in save.js). Ältere Inhalts-Updates, die vor
   Einführung dieses Systems ohne Versionssprung auskamen, sind gesammelt
   unter der ersten Nummer hinterlegt, bei der sauber mitgezählt wurde.
   Jeder Eintrag: `cat` (Neuerung/Änderung/Bugfix, frei erweiterbar),
   `text` (kurz!), optional `spoiler` — eine Funktion, die `true` liefert,
   solange der Spieler den betroffenen Inhalt noch nicht erreicht hat.
   Nur echte CONTENT-Spoiler (neue Charaktere/Orte/Quests) bekommen ein
   `spoiler`; reine Mechanik-/Balance-/UI-Änderungen nie, unabhängig vom
   Fortschritt. */
const SAVE_CHANGELOG = {
  4: [
    { cat: 'Neuerung', text: 'Greta, die Krämerin, hat eine eigene Sammel-Questkette.',
      spoiler: () => quests.kraemerinBusiness.state === 'unstarted' },
    { cat: 'Neuerung', text: 'Neuer Sammelplatz für Rohstoffe (Holz, Stein, Wildkraut).',
      spoiler: () => !gameFlags.resourceGatheringUnlocked },
    { cat: 'Neuerung', text: 'Kommandant Roswald und eine Nachtwache-Karriere.',
      spoiler: () => quests.commanderTraining.state === 'unstarted' },
    { cat: 'Änderung', text: 'Erfahrungs-Skillbaum auf drei Äste erweitert, mit Tab-Ansicht.' },
    { cat: 'Änderung', text: 'Feldarbeits-Boni neu kalibriert (Hunger/Müdigkeit ausgewogener).' },
    { cat: 'Neuerung', text: 'Automatisches Speichern/Laden, Export/Import per Zwischenablage.' },
    { cat: 'Neuerung', text: 'Getrennter Verlauf für Meldungen und Dialoge.' }
  ],
  5: [
    { cat: 'Neuerung', text: 'EP-Skills zeigen einen Hinweis auf weitere Folge-Skills.' },
    { cat: 'Bugfix',   text: 'Diverse Balance- und Dialog-Korrekturen.' },
    { cat: 'Neuerung', text: 'Dieser Update-Hinweis beim Laden alter Spielstände.' }
  ],
  6: [
    { cat: 'Neuerung', text: 'Super-Skills: Wenn eine Fähigkeit ihr Maximum erreicht, öffnet sich ein neuer Weg — frage Oswin in der Taverne.',
      spoiler: () => !gameFlags.oswingSuperHintShown },
    { cat: 'Neuerung', text: 'Das Lehrhaus ist jetzt in der Navigation erreichbar (nach einem Gespräch mit Oswin).',
      spoiler: () => !gameFlags.lehrerUnlocked },
    { cat: 'Neuerung', text: 'Errungenschaften zeigen jetzt ihren Gold-Bonus und sind nach Spielabschnitten gegliedert.' },
    { cat: 'Neuerung', text: 'Neuer Skill: "Aufmerksamer Lehrling" (Voraussetzung für "Schneller Lerner").' },
    { cat: 'Änderung', text: 'EP-Skillbaum kompakter gestaltet — Klick auf einen Knoten zeigt Details unten.' },
    { cat: 'Änderung', text: 'Autospeicher-Intervalle: 30 Sek, 1 Min, 2 Min, 5 Min.' }
  ],
  7: [
    { cat: 'Neuerung', text: 'Kapitel 2: Jagdgebiet mit Monstern und Kampfsystem — erreichbar nach dem Gildeneintritt.',
      spoiler: () => !gameFlags.kapitel2Unlocked },
    { cat: 'Neuerung', text: 'Zeitkristalle und Automatisierung — seltene Drops freischalten selbsttätige Aktionen.',
      spoiler: () => !gameFlags.automationDiscovered },
    { cat: 'Änderung', text: 'Müdigkeits-System überarbeitet: Schlafschuld, feinere Stufen, stärkere Erschöpfungs-Strafen.' }
  ],
  8: [
    { cat: 'Neuerung', text: 'Die Spur des Diebs: eine Detektiv-Quest durch Kapitel 2 mit Korbin, Mira, Brakka und dem zwielichtigen Mann.',
      spoiler: () => !gameFlags.kapitel2Unlocked },
    { cat: 'Neuerung', text: 'Sieg-Dialog und Konfetti am Ende von Kapitel 2 — mit Teaser für Kapitel 3.',
      spoiler: () => !gameFlags.chapter2Complete },
    { cat: 'Neuerung', text: 'Drei neue geheime Errungenschaften und eine große Normal-Errungenschaft für den Kapitel-Abschluss.' },
    { cat: 'Neuerung', text: 'Zieltext in der Leiste ist jetzt anklickbar — zeigt den vollständigen Text als Dialog.' },
    { cat: 'Bugfix',   text: 'Chronik-Eintrag "Der Raub" erscheint jetzt korrekt nach dem Raub, nicht erst nach dem Gildenbeitritt.' }
  ],
  9: [
    { cat: 'Neuerung', text: 'NPC-Kacheln in der Taverne zeigen farbige Verfügbarkeits-Punkte (grün/blau/gelb) mit Hover-Info.' },
    { cat: 'Neuerung', text: 'Bei 100 % Müdigkeit ist Arbeit blockiert — stattdessen erscheint "Kurz verschnaufen" (−10% Müdigkeit, +15 Min Spielzeit).' },
    { cat: 'Neuerung', text: 'Waffenschmied: erste Begehung zeigt Ablehnungs-Dialog; danach dauerhaft gesperrt.',
      spoiler: () => !gameFlags.kapitel2Unlocked },
    { cat: 'Neuerung', text: 'Neuer EP-Skill "Lange Schicht": ermöglicht eine 2-Stunden-Feldarbeit mit doppeltem Ertrag.' },
    { cat: 'Neuerung', text: 'Zwei neue Super-Skills: "Klarer Horizont" (Klarer Kopf) und "Traumloser Schlaf" (Ich schlafe wie ein Stein).' },
    { cat: 'Neuerung', text: 'Automatisierungs-Slots kosten keine Hunger/Müdigkeit mehr — erfordern aber Erfahrungs-Schwellen zum Freischalten.' },
    { cat: 'Änderung', text: 'Haustier-Training: maximal einmal pro Spieltag.' },
    { cat: 'Änderung', text: '"Erste Schwielen" erfordert jetzt das erste Feldarbeits-Level-Up statt nur die erste Arbeit.' },
    { cat: 'Änderung', text: 'Autospeicher-Standard auf 1 Minute geändert.' }
  ],
  10: [
    { cat: 'Neuerung', text: 'Stadtwache: neuer Tagesjob in Treutheim (Kapitel 2, nach Waldtroll-Sieg).',
      spoiler: () => !gameFlags.kapitel2Unlocked },
    { cat: 'Neuerung', text: 'Vier neue Super-Skills: Eiserner Wille+, Geschickte Hände+, Nächtliche Routine+, Fest verschnürt+.' },
    { cat: 'Neuerung', text: 'Eiserner Wille+: Hunger hat keinen Einfluss mehr auf den Müdigkeitsaufbau.' },
    { cat: 'Neuerung', text: 'Nächtliche Routine+: Nachtwache verursacht keinen Schlaf-Debuff mehr.' },
    { cat: 'Neuerung', text: 'Fest verschnürt+: +3 Inventarplätze (12 → 15).' }
  ],
  11: [
    { cat: 'Neuerung', text: 'Eigenes Zuhause: Oswin vermittelt Hauskauf (2000g), Schmiede-Umbau (1200g), Schlafplatz Tier 3.' },
    { cat: 'Neuerung', text: 'Haustiere (Wildtiere): Hund, Rabe, Hase, Eichhörnchen — seltene Drops im Jagdgebiet, Greta tauscht Spuren ein.' },
    { cat: 'Neuerung', text: 'Expeditionen: 2 Story-Expeditionen + 4 Grind-Expeditionen mit Echtzeit-Timer.',
      spoiler: () => !gameFlags.jagdgebietUnlocked },
    { cat: 'Neuerung', text: 'Kapitel 3: Lethkar freigeschaltet (nach Kap-2-Ende + 3 Mut).',
      spoiler: () => !gameFlags.lethkarUnlocked },
    { cat: 'Neuerung', text: 'Alchemie: 5 Aspekte mit Echtzeit-Fortschritt, erzeugt Wissensdurst als Prestige-Währung.',
      spoiler: () => !alchemie.unlocked },
    { cat: 'Neuerung', text: 'Lethkar: NPCs Varena, Thessa, Pereth — Story 3.0–3.5 + Valdris-Spur.',
      spoiler: () => !gameFlags.lethkarUnlocked },
    { cat: 'Neuerung', text: 'Tier-2-Monster im Jagdgebiet (Steingolem, Schattenwolf, Nordbär) nach Lethkar-Freischaltung.',
      spoiler: () => !gameFlags.lethkarUnlocked }
  ],
  12: [
    { cat: 'Neuerung', text: 'Kapitel 3 Abschluss: Perets Lagerhaus-Auftrag abschließbar — Belohnung + Story 3.6 "Die Schatten-Organisation".',
      spoiler: () => !gameFlags.lethkarUnlocked },
    { cat: 'Neuerung', text: 'Wissensdurst-Skillbaum: 5 permanente Fähigkeiten auf der Alchemie-Seite (Forschungsinstinkt, Wissensspeicher u.a.).',
      spoiler: () => !alchemie.unlocked }
  ],
  13: [
    { cat: 'Neuerung', text: 'Erste Nachtwache: immersiver Ich-Monolog — Erschöpfung, aber das Ziel hält wach.' },
    { cat: 'Bugfix',   text: 'Brakka-Ausrufezeichen erscheint erst nach dem Waffenschmied-Besuch.' },
    { cat: 'Bugfix',   text: 'Uhrzeit-Hinweise stapelten sich — werden jetzt im selben Element zusammengefasst.' },
    { cat: 'Bugfix',   text: 'Taverne-Tab leuchtet für den Vorarbeiter jetzt jeden Abend erneut bis das Gespräch geführt wurde.' }
  ]
};

/* Spieler-sichtbare Release-Notes pro Versions-String.
   Wird nach einem Update-Banner-Reload als Dialog angezeigt.
   Kein Spoiler-System nötig — der Spieler hat die Version bewusst geladen. */
const VERSION_NOTES = {
  '0.14.1-alpha': [
    { cat: 'Bugfix', text: 'Brakkas Questmarkierung erscheint erst nach dem Waffenschmied-Besuch.' },
    { cat: 'Bugfix', text: 'Uhrzeit-Hinweise stapeln sich nicht mehr bei schnellen Aktionen.' },
    { cat: 'Bugfix', text: 'Vorarbeiter-Tab in der Taverne leuchtet jetzt jeden Abend erneut.' }
  ],
  '0.14.2-alpha': [
    { cat: 'Bugfix',   text: 'Errungenschaften im Erfahrungs-Weg waren unsichtbar, obwohl bereits freigeschaltet.' },
    { cat: 'Neuerung', text: 'Update-Banner: das Spiel meldet sich automatisch, wenn eine neue Version verfügbar ist.' }
  ],
  '0.14.3-alpha': [
    { cat: 'Neuerung', text: 'Nach einem Update erscheint ein Dialog mit allen Änderungen seit der letzten gespielten Version.' },
    { cat: 'Bugfix',   text: 'Update-Dialog und Spielstand-Changelog erscheinen jetzt nacheinander statt sich zu überschreiben.' }
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
  resets:             0,     // Anzahl der bewusst vom Spieler ausgelösten Neuanfänge
  fasterWorkUnlocked: false, // Erleichterung nach dem 1. Neuanfang
  hasHome:            false, // Eigenheim in Treutheim gekauft (dauerhaft)
  hasSmith:           false  // Schmiede im Eigenheim ausgebaut (dauerhaft)
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
  fieldPay:         false, // +1 Gold pro Feldarbeit, dauerhaft
  nightWatchLeveling: false, // Schaltet ein Erfahrungs-Level-System für die Nachtwache frei
  thrift:           0,     // Marktplatz-Preise -10% je Stufe (max. Stufe 2)
  jobXpBonus:       false, // +1 Job-Erfahrung pro Feldarbeit (Voraussetzung für "Schneller Lerner")
  quickLearner:     0,     // +10% Job-Erfahrung pro Feldarbeit je Stufe (max. Stufe 5)
  clearMind:        false, // +1 EP bei jedem zukünftigen Neuanfang
  goldBreakthrough: false, // Gold-Meilensteine zählen einzeln statt nur "Grenze erreicht?"
  guildPrep:        false, // Teures Endknoten-Upgrade — schaltet die Gilden-Questkette bei Brakka frei
  inventoryKeeper:  false, // Inventar/Ausrüstung übersteht künftig einen Neuanfang
  sleepLikeARock:   false, // +1 Schlafqualitäts-Stufe bei jedem Schlafplatz
  petLover:         false, // Haustiere können aufleveln und ihren Bonus verstärken
  longShift:        false  // 2-Stunden-Feldarbeit freischalten
};

/* Freigeschaltete Super-Skill-Erweiterungen (Lehrer-System) — erst nach
   Abschluss der jeweiligen Lehrer-Quest verfügbar (siehe lehrer.js). */
let superSkills = {}; // id -> true wenn freigeschaltet

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
  firstNightWatchShown:        false, // Immersiver Monolog nach der 1. Nachtwache
  firstNightWatchLevelUpShown: false, // Monolog beim 1. Nachtwache-Level-Up
  commanderRecruitmentShown:   false, // Stadtwache-Beitritts-Angebot nach 1. Arbeit auf Nachtwache-Lvl 3
  resetAnimationSeen:          false, // Schaltet den "Reset-Animation anzeigen"-Schalter in den Einstellungen frei
  oswingSuperHintShown:        false, // Monolog "Oswin könnte Lehrer kennen" nur 1x zeigen
  lehrerUnlocked:              false, // Lehrer-Tab sichtbar (nach Oswin-Gespräch über Lehrmeisterin)
  streetSweeperTalked:         false, // Spieler hat mit dem Strassenkehrer gesprochen → Hinweis sichtbar
  kapitel2Unlocked:            false, // Akt II Inhalte freigeschaltet (nach Gildeneintritt)
  jagdgebietUnlocked:          false, // Jagdgebiet betretbar
  automationDiscovered:        false, // Ersten Zeitkristall gefunden → Automatisierungs-Tab erscheint
  devModeEnabled:              false, // Entwickler-Optionen über devMode() in der Konsole freigeschaltet
  isWorking:                   false,
  // ── Kapitel-2-Story-Flags ──────────────────────────────────
  firstJagdgebietKill:         false, // Erster Kill im Jagdgebiet → Story 2.1
  firstCombatDefeated:         false, // Erster Kampfverlust → Ich-Monolog
  korbinChapter2Talked:        false, // Korbin hat von der Raubserie erzählt → Story 2.2
  theftClueFoundInJagdgebiet:  false, // Münze des Spielers unter Räuber-Habe gefunden → Story 2.3
  miraRevealedInfo:            false, // Mira hat ihre Informationen geteilt → Story 2.4
  brakkaRevealedSuspect:       false, // Brakka hat den Fremden als Bindeglied benannt → Story 2.5
  fremderConfronted:           false, // Fremder mit Beweisen konfrontiert → Story 2.6
  chapter2Complete:            false, // Kapitel 2 vollständig abgeschlossen → Story 2.7 + Sieg-Dialog
  waldtrollKilled:             false, // Mindestens einen Waldtroll besiegt (Tor zur Endkonfrontation)
  waffenschmiedRejected:       false, // Spieler wurde vom Waffenschmied abgewiesen → Brakka bietet Gilde an
  foremanEveningAlerted:       false, // Taverne-Nav einmalig beleuchtet, sobald Vorarbeiter abends antreffbar war
  stadtwacheAccepted:          false, // Spieler hat das Stadtwache-Angebot von Roswald angenommen
  stadtwacheDeclined:          false, // Spieler hat das Angebot zunächst abgelehnt (Roswald fragt später nochmal)
  isStadtwacheShift:           false, // Läuft gerade eine Stadtwache-Schicht (Progressbar aktiv)
  fullInventoryReset:          false, // Spieler hat mindestens einmal mit vollem Inventar (12+) einen Neuanfang gemacht
  mirasBriefGiven:             false, // Mira hat dem Spieler den verschlüsselten Brief gegeben (nach Story 2.4)
  mirasBriefDecoded:           false, // Brief wurde in Lethkar von Varena entschlüsselt
  // ── Kapitel-3-Flags ───────────────────────────────────────
  lethkarUnlocked:             false, // Lethkar betreten (Mut >= 3 + Kap-2-Ende)
  varenaMetFirst:              false, // Varena zum ersten Mal angesprochen
  thessaMetFirst:              false, // Thessa zum ersten Mal angesprochen
  perethMetFirst:              false, // Pereth zum ersten Mal angesprochen
  varenaDecodedBrief:          false, // Varena hat den Brief entschlüsselt → Story 3.3
  thessaTrustGained:           false, // Thessa vertraut dem Spieler → Story 3.5
  perethQuestStarted:          false, // Pereth hat eine Aufgabe gegeben → Story 3.6
  lagerhausVisited:            false, // Spieler war im Lagerhaus → Bericht an Pereth möglich
  chapter3StoryComplete:       false, // Alle Story-Punkte in Lethkar gesehen
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
  rohstoffe:    true,
  errungenschaften: true, // erst sichtbar, sobald die 1. Errungenschaft erreicht ist
  pets:         true,     // erst sichtbar, sobald das 1. Haustier adoptiert wurde
  lehrer:       false,    // erst sichtbar nach Oswin-Gespräch (gameFlags.lehrerUnlocked)
  jagdgebiet:   false,    // erst sichtbar nach Gildeneintritt (gameFlags.jagdgebietUnlocked)
  automation:   false,    // erst sichtbar nach erstem Zeitkristall-Fund
  stadtwache:   false,    // erst sichtbar nach Roswalds Angebot angenommen
  meinhaus:     false,    // erst sichtbar nach Hauskauf (meta.hasHome)
  schmiede:     false,    // erst sichtbar nach Schmiede-Umbau (meta.hasSmith)
  expedition:   false,    // erst sichtbar nach erstem Jagdgebiet-Besuch
  alchemie:     false,    // erst sichtbar nach Varena-Alchemie-Unterricht
  lethkar:      false     // erst sichtbar nach Lethkar-Betreten
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

/* Bedürfnisse: 0 (bestens) bis 100 (kritisch).
   `sleepDebt` (0–2): Schlafschuld durch wiederholtes Einschlafen unter
   hoher Müdigkeit — erhöht den Müdigkeitsaufbau am Folgetag. */
let needs = {
  hunger:     15,
  tiredness:  0,
  sleepDebt:  0
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
  nightWatch:          { state: 'unstarted' },
  miraLetter:          { state: 'unstarted' },
  foremanRaise:        { state: 'unstarted' },
  kraemerinBusiness:   { state: 'unstarted' }, // 'unstarted' -> 'invited' -> 'active' -> 'rewarded'
  guildRegistration:   { state: 'unstarted' },
  commanderTraining:   { state: 'unstarted' },
  theftInvestigation:  { state: 'unstarted' } // 'unstarted' -> 'active' -> 'investigating' -> 'mira_consulted' -> 'brakka_consulted' -> 'confronted' -> 'rewarded'
};

/* Einmalige NPC-Interaktionen, die sich dauerhaft auf den Dialog auswirken */
let npcFlags = {
  miraDrinkGiven:    false,
  fremderTalkCount:  0    // Wie oft der Spieler den zwielichtigen Mann angesprochen hat
};

/* Fortschritt in der Feldarbeit (Erfahrungs-/Level-System, siehe actions.js) */
let workStats = {
  count: 0,           // Anzahl insgesamt abgeschlossener Feldarbeits-Durchgänge
  hungryWorkCount: 0  // Feldarbeiten im Hunger-Zustand (für ironWill_super-Quest)
};

/* Fortschritt in der Stadtwache (analog zu workStats, Kapitel 2) */
let stadtwacheStats = {
  count: 0 // Anzahl abgeschlossener Stadtwache-Schichten
};

/* Kampf-Statistiken (Kapitel 2) — Kill-Zähler pro Monster-Typ */
let killStats = {
  total: 0  // Gesamtzahl aller Kills (Monster-Typ-Tracking ggf. später)
};

/* Freigeschaltete Errungenschaften (siehe achievements.js): IDs aus
   ACHIEVEMENT_DEFS -> `true`. Bloße Anwesenheit eines Schlüssels bedeutet
   "freigeschaltet" — kein Eintrag heißt "noch nicht erreicht". */
let achievements = {};
let achievementTab = 'normal'; // 'normal' | 'secret' — siehe content.js, setAchievementTab()

/* Vom Spieler adoptierte Haustiere (siehe pets.js): id -> { name, level }.
   `level` startet bei 0 und steigt nur, sobald der Skill "Tierfreund"
   (experience.js) erlernt wurde (siehe pets.js, trainPet()). */
let pets = {};

/* Reguläre Wildtiere — gefangen im Jagdgebiet nach Greta-Quest.
   Jedes Tier: { type: 'hund'|'rabe'|'hase'|'eichhoernchen', level: 1 }
   level steigt durch "Zeit verbringen" (max. Level 3, 1x täglich GESAMT). */
let wildPets = [];

/* Fortschritt der geheimen Straßenkatze-Begegnungskette (siehe actions.js,
   maybeTriggerStreetWalk()/takeStreetWalk()) — eigenes kleines State-
   Objekt statt Felder in gameFlags, weil es Zähler sind, keine reinen
   Einmal-Flags. */
let streetCatProgress = {
  sleepCount: 0,        // Wie oft insgesamt auf der Straße geschlafen wurde
  encounters: 0,        // Wie oft die Katze bereits getroffen UND gestreichelt wurde (max. 3, dann adoptiert)
  postAdoptionNights: 0 // Wie oft nach der Adoption auf der Straße geschlafen wurde
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
  autoSave: { enabled: true, intervalMinutes: 1 },
  // Lädt beim Start automatisch den letzten Spielstand, falls vorhanden
  // (siehe save.js, shouldAutoLoad(), aufgerufen aus main.js init()).
  autoLoad: true,
  // Bildschirmfüllende Übergangs-Animation beim manuellen Neuanfang
  // (siehe experience.js, runManualResetWithAnimation()) — der Schalter
  // dafür erscheint in den Einstellungen erst, nachdem der Spieler die
  // Animation einmal gesehen hat (gameFlags.resetAnimationSeen).
  showResetAnimation: true,
  // Verhindert die blaue Browser-Textmarkierung bei schnellen Klicks.
  // Standard: true (kein sichtbares Marking).
  hideTextSelection: true
};

/* Verlauf der letzten Toast-Meldungen (neueste zuerst, max. 50). */
let toastHistory = [];

/* Verlauf der letzten Dialogseiten (neueste zuerst, max. 30) — bewusst
   GETRENNT von toastHistory (siehe Einstellungen, Verlaufs-Filter):
   Toasts sind kurze Reaktionen, Dialoge sind erzählte Szenen, beide
   gemeinsam in einer Liste wären unübersichtlich. */
let dialogHistory = [];

/* Welche einmaligen Story-Dialoge wurden bereits gezeigt (IDs aus story.js) */
let shownDialogs = [];

/* Hervorhebung des Chronik-Buttons in der Zielleiste (siehe objective.js) —
   wird auf `true` gesetzt, sobald ein NEUER Story-Eintrag freigeschaltet
   wird (story.js, maybeShowStoryDialog()), und erst beim Klick auf genau
   diesen Button wieder auf `false` (siehe nav.js, showContent()). Bewusst
   getrennt von `chronikUnseenEntryIds` unten: der Button merkt sich nur
   "wurde die Chronik seit der letzten Neuigkeit überhaupt geöffnet?",
   während einzelne Einträge sich erst durch Hover als gesehen markieren. */
let chronikButtonUnseen = false;

/* IDs neu hinzugekommener Chronik-Einträge, die in der Chronik-Liste noch
   nicht per Hover als "gesehen" markiert wurden (siehe content.js,
   renderChronik()/markChronikEntrySeen()). Jeder Eintrag verschwindet aus
   dieser Liste einzeln, sobald der Spieler mit der Maus darüber fährt —
   unabhängig vom Chronik-Button oben, der schon beim bloßen Öffnen der
   Chronik-Seite verschwindet. */
let chronikUnseenEntryIds = [];

/* ── Kapitel 2: Kampfsystem ───────────────────────────────── */

/* Spieler-Lebenspunkte (überstehen weder Gold-Resets noch Schlaf ohne
   Erholung — Schlafen stellt HP anteilig zur Schlafqualität wieder her). */
let playerStats = {
  hp:    30,
  maxHp: 30
};

/* Stärke-Progression — analog zu workStats für Feldarbeit, aber für
   Kämpfe. Übersteht Gold-Resets (wie `fieldworkMemory` für die Feldarbeit),
   sobald der entsprechende Skill aktiv ist. */
let strength = {
  xp:    0,
  level: 0
};

/* Mut — Prestige-Währung für Akt II, übersteht alle Resets (wie EP,
   aber separate Dimension: EP = Wissen, Mut = bewiesener Kampfgeist). */
let mut = {
  points:      0,
  totalEarned: 0
};

/* Expeditionen — Story-Expeditionen (einmalig) und Grind-Expeditionen
   (wiederholbar, produzieren Ressourcen/Gold/XP).
   activeExpedition: null | { id, startTime, durationMs, type }
   storyCompleted: Set-Objekt als Array gespeichert, grindCounts: {} */
let expedition = {
  activeExpedition: null,   // laufende Expedition
  storyCompleted:   [],     // IDs abgeschlossener Story-Expeditionen
  grindCounts:      {}      // id -> Anzahl abgeschlossener Grind-Runs
};

/* Wissensdurst — Prestige-Währung für Akt III (Lethkar), übersteht alle
   Resets. Wird durch Alchemie-Fortschritt erzeugt. */
let einsicht = {
  points:      0,
  totalEarned: 0
};

/* Wissensdurst-Skillbaum — permanent (übersteht Neuanfang). Freigeschaltet
   durch Wissensdurst-Punkte (einsicht.points), die durch Alchemie erzeugt werden. */
let wissensdurstSkills = {
  forschungsinstinkt:         false, // 1 ✦ → Aspekte +25% schneller
  wissensspeicher:            false, // 2 ✦ → Wissensdurst übersteht Neuanfang
  doppelteErkenntnis:         false, // 3 ✦ → Level-Up gibt +1 extra Wissensdurst
  aspektmeister:              false, // 5 ✦ → zusätzlich 2× Speed (stacks)
  alchemistischesGedaechtnis: false  // 4 ✦ → 50% Aspekt-Progress übersteht Neuanfang
};

/* Alchemie-Fortschritt — 5 Aspekte, je ein eigenständiger Fortschritt
   mit Echtzeit-Ticks (1 Pt/s, setInterval in alchemie.js).
   levels[aspect]: aktuelles Level (0–∞, Kosten: 3^level * 100)
   progress[aspect]: aktueller XP-Fortschritt im aktuellen Level
   lastTick: Unix-Timestamp des letzten Ticks (für Offline-Aufholen) */
let alchemie = {
  unlocked: false,
  levels:   { feuer: 0, wasser: 0, erde: 0, luft: 0, aether: 0 },
  progress: { feuer: 0, wasser: 0, erde: 0, luft: 0, aether: 0 },
  lastTick: null
};

/* Laufender Kampf — wird beim Speichern NICHT mitgesichert; ein
   gespeichertes Spiel startet immer kampffrei. */
let combat = {
  active:   false,
  enemyId:  null,
  enemyHp:  0,
  log:      []
};

/* Zeitkristalle — seltene Ressource (Drop aus Kämpfen), die
   Automatisierungs-Slots freischaltet. */
let zeitkristalle = 0;

/* Automatisierungs-Konfiguration. Jeder Slot führt eine Aktion
   periodisch selbst aus, solange ein Zeitkristall zugewiesen ist. */
let automation = {
  slots:     [], // [{ action: 'feldarbeit', enabled: true }, ...]
  clockAccum: 0  // akkumulierte Spielminuten seit letztem Tick
};

/* ── UI-State ─────────────────────────────────────────────── */
let selectedSkillId = null; // welcher Skill-Knoten im EP-Baum gerade ausgewählt ist

let navLevel       = 0;            // 0=Hauptmenü | 1=Weltkarte | 2=Stadt (Treutheim oder Lethkar)
let currentCity    = 'treutheim'; // 'treutheim' | 'lethkar' — welche Stadt gerade auf navLevel 2
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
let workShiftMult = 1; // 1 = normale Schicht, 2 = Lange Schicht

/* ── Stadtwache-Animation State ───────────────────────────── */
let stadtwacheProgress  = 0;
let stadtwacheStartTime = null;
let stadtwacheRafId     = null;

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
