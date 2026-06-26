/* ══════════════════════════════════════════════════════════════
   state.js — Zentraler Spielzustand
   Einzige Source of Truth für storyState + resources + meta.
   ══════════════════════════════════════════════════════════════ */

'use strict';

const SAVE_KEY = 'chronicles_v1';
const GAME_VERSION = '0.22.1-alpha';
const WORK_DURATION_BASE_MS = 2000;

/* ── Enum-Konstanten — verhindert Tippfehler bei Magic Strings ──────────── */

/** Content-IDs für currentContent / showContent() / switch-Dispatcher */
const CONTENT = Object.freeze({
  GESCHICHTE:          'geschichte',
  WELTKARTE:           'weltkarte',
  TREUTHEIM:           'treutheim',
  ARBEITSPLATZ:        'arbeitsplatz',
  MARKTPLATZ:          'marktplatz',
  SCHLAFPLATZ:         'schlafplatz',
  ROHSTOFFE:           'rohstoffe',
  TAVERNE:             'taverne',
  INVENTAR:            'inventar',
  QUESTS:              'quests',
  ERFAHRUNG:           'erfahrung',
  ERRUNGENSCHAFTEN:    'errungenschaften',
  PETS:                'pets',
  LEHRER:              'lehrer',
  JAGDGEBIET:          'jagdgebiet',
  STADTWACHE:          'stadtwache',
  MEINHAUS:            'meinhaus',
  SCHMIEDE:            'schmiede',
  AUTOMATION:          'automation',
  EXPEDITION:          'expedition',
  LETHKAR:             'lethkar',
  ALCHEMIE:            'alchemie',
  LETHKAR_TAVERNE:     'lethkar_taverne',
  LETHKAR_MARKT:       'lethkar_markt',
  LETHKAR_SCHLAFPLATZ: 'lethkar_schlafplatz',
  VELMARK:              'velmark',
  VELMARK_FRAKTIONEN:   'velmark_fraktionen',
  VELMARK_JAGDGEBIET:   'velmark_jagdgebiet',
  VELMARK_MARKT:        'velmark_markt',
  VELMARK_SCHLAFPLATZ:  'velmark_schlafplatz',
  VELMARK_HAFEN:        'velmark_hafen',
  VALDRIS_PROFIL:       'valdrisProfil',
  VALDRIS_FINALE:       'valdrisFinale',
  CHRONIK:             'chronik',
  SETTINGS:            'settings',
  RUF_FAEHIGKEITEN:    'rufFaehigkeiten',
});

/** Quest-Zustände (state-Machine-Strings in quests.*) */
const QUEST_STATE = Object.freeze({
  UNSTARTED:        'unstarted',
  ACTIVE:           'active',
  DONE:             'done',
  REWARDED:         'rewarded',
  DELIVERED:        'delivered',
  INVESTIGATING:    'investigating',
  MIRA_CONSULTED:   'mira_consulted',
  BRAKKA_CONSULTED: 'brakka_consulted',
  CONFRONTED:       'confronted',
  INVITED:          'invited',
  // Neue States für erweiterte Quest-Lines
  CURIOUS:          'curious',
  ASKING_AROUND:    'asking_around',
  IDENTITY_KNOWN:   'identity_known',
  HALF_DONE:        'half_done',
  TALK1:            'talk1',
  TALK2:            'talk2',
  ABSCHIED_VARENA:  'abschied_varena',
  ABSCHIED_THESSA:  'abschied_thessa',
  INVESTED:         'invested',
  WAITING:          'waiting',
  WAITING_NIGHT:    'waiting_night',
  HINWEIS1:         'hinweis1',
  HINWEIS2:         'hinweis2',
  DOK1:             'dok1',
  DOK2:             'dok2',
  DOK3:             'dok3',
  ORT1:             'ort1',
  ORT2:             'ort2',
  ORT3:             'ort3',
  AKTIV:            'aktiv',
  NIGHT_TALK:       'night_talk',
  DUELL_WON:        'duell_won',
  STEP1:            'step1',
  STEP2:            'step2',
  STEP3:            'step3',
});

/** Zweiter Parameter von showToast() */
const TOAST = Object.freeze({
  EVENT:    'event',
  ERROR:    'error',
  REWARD:   'reward',
  INFO:     'info',
  PURCHASE: 'purchase',
});

/** Errungenschaften-Kategorien (cat-Feld in ACHIEVEMENT_DEFS) */
const ACH_CAT = Object.freeze({ NORMAL: 'normal', SECRET: 'secret' });

/** Navigationsebenen (navLevel) */
const NAV_LEVEL = Object.freeze({ MENU: 0, WELTKARTE: 1, STADT: 2 });

/** Skill-IDs für getSkillLevel() — nur die, die in Logik verglichen werden */
const SKILL_ID = Object.freeze({
  THRIFT:        'thrift',
  QUICK_LEARNER: 'quickLearner',
  LONGER_REST:   'longerRest',
  JOB_LEVELING:  'jobLeveling',
  IRON_WILL:     'ironWill',
});

/** Tabs in der Erfahrungs-Seite */
const EP_TAB = Object.freeze({ SKILLS: 'skills', LESSONS: 'lessons' });

/** Filter im Einstellungs-Verlauf */
const HISTORY_FILTER = Object.freeze({ TOASTS: 'toasts', DIALOGE: 'dialoge' });

/** Marktplatz-Händler-IDs (marketVendor) */
const VENDOR = Object.freeze({ KRAEMER: 'kraemer', SCHMIEDE: 'schmiede' });

/* Aktuelle Spielstand-Versionsnummer (siehe save.js). Dient NICHT der
   Zukunftssicherheit selbst (die kommt aus den Default-Merges in
   loadGame()/applySaveData()), sondern als Vergleichswert für
   SAVE_CHANGELOG: lädt ein Spielstand mit einer älteren Nummer, zeigt
   showSaveChangelogDialog() einmalig eine kurze Zusammenfassung, was sich
   seither geändert hat. Bei jedem spürbaren Inhalts-Update: Nummer um 1
   erhöhen UND einen neuen Eintrag in SAVE_CHANGELOG ergänzen. */
const CURRENT_SAVE_VERSION = 16;

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
    { cat: 'Neuerung', chapter: 1, text: 'Greta, die Krämerin, hat eine eigene Sammel-Questkette.',
      spoiler: () => quests.kraemerinBusiness.state === QUEST_STATE.UNSTARTED },
    { cat: 'Neuerung', chapter: 1, text: 'Neuer Sammelplatz für Rohstoffe (Holz, Stein, Wildkraut).',
      spoiler: () => !gameFlags.resourceGatheringUnlocked },
    { cat: 'Neuerung', chapter: 1, text: 'Kommandant Roswald und eine Nachtwache-Karriere.',
      spoiler: () => quests.commanderTraining.state === QUEST_STATE.UNSTARTED },
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
    { cat: 'Neuerung', chapter: 2, text: 'Kapitel 2: Jagdgebiet mit Monstern und Kampfsystem — erreichbar nach dem Gildeneintritt.',
      spoiler: () => !gameFlags.kapitel2Unlocked },
    { cat: 'Neuerung', chapter: 2, text: 'Zeitkristalle und Automatisierung — seltene Drops freischalten selbsttätige Aktionen.',
      spoiler: () => !gameFlags.automationDiscovered },
    { cat: 'Änderung', text: 'Müdigkeits-System überarbeitet: Schlafschuld, feinere Stufen, stärkere Erschöpfungs-Strafen.' }
  ],
  8: [
    { cat: 'Neuerung', chapter: 2, text: 'Die Spur des Diebs: eine Detektiv-Quest durch Kapitel 2 mit Korbin, Mira, Brakka und dem zwielichtigen Mann.',
      spoiler: () => !gameFlags.kapitel2Unlocked },
    { cat: 'Neuerung', chapter: 2, text: 'Sieg-Dialog und Konfetti am Ende von Kapitel 2 — mit Teaser für Kapitel 3.',
      spoiler: () => !gameFlags.chapter2Complete },
    { cat: 'Neuerung', text: 'Drei neue geheime Errungenschaften und eine große Normal-Errungenschaft für den Kapitel-Abschluss.' },
    { cat: 'Neuerung', text: 'Zieltext in der Leiste ist jetzt anklickbar — zeigt den vollständigen Text als Dialog.' },
    { cat: 'Bugfix',   text: 'Chronik-Eintrag "Der Raub" erscheint jetzt korrekt nach dem Raub, nicht erst nach dem Gildenbeitritt.' }
  ],
  9: [
    { cat: 'Neuerung', text: 'NPC-Kacheln in der Taverne zeigen farbige Verfügbarkeits-Punkte (grün/blau/gelb) mit Hover-Info.' },
    { cat: 'Neuerung', text: 'Bei 100 % Müdigkeit ist Arbeit blockiert — stattdessen erscheint "Kurz verschnaufen" (−10% Müdigkeit, +15 Min Spielzeit).' },
    { cat: 'Neuerung', chapter: 2, text: 'Waffenschmied: erste Begehung zeigt Ablehnungs-Dialog; danach dauerhaft gesperrt.',
      spoiler: () => !gameFlags.kapitel2Unlocked },
    { cat: 'Neuerung', text: 'Neuer EP-Skill "Lange Schicht": ermöglicht eine 2-Stunden-Feldarbeit mit doppeltem Ertrag.' },
    { cat: 'Neuerung', text: 'Zwei neue Super-Skills: "Klarer Horizont" (Klarer Kopf) und "Traumloser Schlaf" (Ich schlafe wie ein Stein).' },
    { cat: 'Neuerung', text: 'Automatisierungs-Slots kosten keine Hunger/Müdigkeit mehr — erfordern aber Erfahrungs-Schwellen zum Freischalten.' },
    { cat: 'Änderung', text: 'Haustier-Training: maximal einmal pro Spieltag.' },
    { cat: 'Änderung', text: '"Erste Schwielen" erfordert jetzt das erste Feldarbeits-Level-Up statt nur die erste Arbeit.' },
    { cat: 'Änderung', text: 'Autospeicher-Standard auf 1 Minute geändert.' }
  ],
  10: [
    { cat: 'Neuerung', chapter: 2, text: 'Stadtwache: neuer Tagesjob in Treutheim (Kapitel 2, nach Waldtroll-Sieg).',
      spoiler: () => !gameFlags.kapitel2Unlocked },
    { cat: 'Neuerung', text: 'Vier neue Super-Skills: Eiserner Wille+, Geschickte Hände+, Nächtliche Routine+, Fest verschnürt+.' },
    { cat: 'Neuerung', text: 'Eiserner Wille+: Hunger hat keinen Einfluss mehr auf den Müdigkeitsaufbau.' },
    { cat: 'Neuerung', text: 'Nächtliche Routine+: Nachtwache verursacht keinen Schlaf-Debuff mehr.' },
    { cat: 'Neuerung', text: 'Fest verschnürt+: +3 Inventarplätze (12 → 15).' }
  ],
  11: [
    { cat: 'Neuerung', text: 'Eigenes Zuhause: Oswin vermittelt Hauskauf (2000g), Schmiede-Umbau (1200g), Schlafplatz Tier 3.' },
    { cat: 'Neuerung', chapter: 2, text: 'Haustiere (Wildtiere): Hund, Rabe, Hase, Eichhörnchen — seltene Drops im Jagdgebiet, Greta tauscht Spuren ein.',
      spoiler: () => !gameFlags.jagdgebietUnlocked },
    { cat: 'Neuerung', chapter: 2, text: 'Expeditionen: 2 Story-Expeditionen + 4 Grind-Expeditionen mit Echtzeit-Timer.',
      spoiler: () => !gameFlags.jagdgebietUnlocked },
    { cat: 'Neuerung', chapter: 3, text: 'Kapitel 3: Lethkar freigeschaltet (nach Kap-2-Ende + 3 Mut).',
      spoiler: () => !gameFlags.lethkarUnlocked },
    { cat: 'Neuerung', chapter: 3, text: 'Alchemie: 5 Aspekte mit Echtzeit-Fortschritt, erzeugt Wissensdurst als Prestige-Währung.',
      spoiler: () => !alchemie.unlocked },
    { cat: 'Neuerung', chapter: 3, text: 'Lethkar: NPCs Varena, Thessa, Pereth — Story 3.0–3.5 + Valdris-Spur.',
      spoiler: () => !gameFlags.lethkarUnlocked },
    { cat: 'Neuerung', chapter: 3, text: 'Tier-2-Monster im Jagdgebiet (Steingolem, Schattenwolf, Nordbär) nach Lethkar-Freischaltung.',
      spoiler: () => !gameFlags.lethkarUnlocked }
  ],
  12: [
    { cat: 'Neuerung', chapter: 3, text: 'Kapitel 3 Abschluss: Perets Lagerhaus-Auftrag abschließbar — Belohnung + Story 3.6 "Die Schatten-Organisation".',
      spoiler: () => !gameFlags.lethkarUnlocked },
    { cat: 'Neuerung', chapter: 3, text: 'Wissensdurst-Skillbaum: 5 permanente Fähigkeiten auf der Alchemie-Seite (Forschungsinstinkt, Wissensspeicher u.a.).',
      spoiler: () => !alchemie.unlocked }
  ],
  13: [
    { cat: 'Neuerung', chapter: 1, text: 'Erste Nachtwache: immersiver Ich-Monolog — Erschöpfung, aber das Ziel hält wach.',
      spoiler: () => quests.nightWatch.state === QUEST_STATE.UNSTARTED },
    { cat: 'Bugfix',   text: 'Brakka-Ausrufezeichen erscheint erst nach dem Waffenschmied-Besuch.' },
    { cat: 'Bugfix',   text: 'Uhrzeit-Hinweise stapelten sich — werden jetzt im selben Element zusammengefasst.' },
    { cat: 'Bugfix',   text: 'Taverne-Tab leuchtet für den Vorarbeiter jetzt jeden Abend erneut bis das Gespräch geführt wurde.' }
  ],
  14: [
    { cat: 'Änderung', chapter: 1, text: 'Das Raub-System wurde grundlegend überarbeitet: 4 automatische Raub-Events ersetzen den bisherigen einmaligen Raub. Spielstände aus Kapitel 1 (vor dem ersten Neuanfang) sind davon nicht betroffen.' },
    { cat: 'Neuerung', chapter: 1, text: 'Neuer Skill-Ast „Paranoid" mit 5 Fähigkeiten — freigeschaltet nach dem 4. Raub.',
      spoiler: () => !gameFlags.robbery4Triggered && skills.paranoid < 1 },
    { cat: 'Neuerung', text: 'Achievement-Bonus jetzt multiplikativ (nicht mehr additiv) und wird tatsächlich auf Einnahmen angewendet.' },
    { cat: 'Neuerung', text: 'Krämer: Tab-System für Essen & Ausrüstung.' },
    { cat: 'Neuerung', text: '23 neue Errungenschaften (Kapitel 1 und Erfahrungs-Weg).' }
  ],
  15: [
    { cat: 'Neuerung', chapter: 3, text: 'Story 3.7–3.10: Valdris\' Lager, der Name, der Alchemie-Durchbruch und der Kapitel-3-Abschluss.',
      spoiler: () => !gameFlags.chapter3StoryComplete },
    { cat: 'Neuerung', chapter: 3, text: 'Tier-2-Monster geben jetzt Wissensdurst (✦) als Kampf-Drop.',
      spoiler: () => !gameFlags.lethkarUnlocked }
  ],
  16: [
    { cat: 'Neuerung', chapter: 4, text: 'Kapitel 4: Velmark — die finale Stadt. Fraktionssystem, Einfluss (⚜), Informantennetz, Story 4.1–4.10.',
      spoiler: () => !gameFlags.velmarkUnlocked },
    { cat: 'Neuerung', chapter: 4, text: 'Tier-3-Kämpfe in Velmarks Unterwelt: Kanalratte, Söldner des Netzwerks, Schattenkämpfer — alle geben ⚜ Einfluss.',
      spoiler: () => !gameFlags.velmarkUnlocked },
    { cat: 'Neuerung', chapter: 4, text: 'Velmarks Großer Markt: Kettenrüstung (−5 Kampfschaden), Geheimes Netzwerk (mehr Informanten), Hafenverpflegung.',
      spoiler: () => !gameFlags.velmarkUnlocked },
    { cat: 'Neuerung', chapter: 4, text: 'Velmark-Schlafplatz: Hafenpension und Herrschaftliche Suite für HP-Regeneration in der Stadt.',
      spoiler: () => !gameFlags.velmarkUnlocked }
  ]
};

/* Spieler-sichtbare Release-Notes pro Versions-String.
   Wird nach einem Update-Banner-Reload als Dialog angezeigt.
   Kein Spoiler-System nötig — der Spieler hat die Version bewusst geladen. */
const VERSION_NOTES = {
  '0.22.1-alpha': [
    { cat: 'Bugfix', text: 'Inventar: Werkzeuge (Axt, Spitzhacke, Sichel) belegten fälschlicherweise Inventarplätze — sie zählen jetzt nicht mehr gegen das Limit.' },
    { cat: 'Bugfix', text: 'Gildenprüfung: Kills wurden seit Spielstart gezählt statt ab Quest-Annahme. Außerdem fehlte der Abschluss-Trigger nach dem Kampf. Beides behoben — Quest zeigt jetzt Fortschritt (X/5).' },
    { cat: 'Bugfix', text: 'Quest "Ein Dach über dem Kopf" blieb auf "In Arbeit" obwohl ein Haus vorhanden war. Abschluss-Check behoben.' },
    { cat: 'Bugfix', text: 'Schmiede im Marktplatz zeigte "Erfordert ein eigenes Zuhause" auch nach dem Hauskauf. Hinweis führt jetzt korrekt zu Oswin weiter.' },
    { cat: 'Bugfix', text: 'Miras verschlüsselter Brief zeigte Funktionscode statt Beschreibung im Inventar. Behoben.' },
    { cat: 'Bugfix', text: 'Sieg-Dialog (Kap. 2 Ende) erschien nach der Fremden-Konfrontation zu früh — er wartet jetzt auf den Abschluss des Finales.' },
  ],
  '0.22.0-alpha': [
    { cat: 'Neuerung', text: 'Feldarbeit: Stufen 4 ("Meister des Feldes") und 5 ("Legende der Felder") sind jetzt in Kapitel 2/3 erreichbar — über neue narrative Freischaltungen.' },
    { cat: 'Neuerung', text: 'Neuer NPC Sivert in Roswalds Schenke (Treutheim) — Agrarberater auf Reisen, vermittelt eine Technik, die Feldarbeit-Erfahrung massiv beschleunigt.' },
    { cat: 'Bugfix', text: 'Schlafplatz Lethkar/Velmark: Nach Nachtwache zeigte die Karte die ungestörte Erholungsrate statt der tatsächlich reduzierten. Behoben.' },
    { cat: 'Neuerung', text: 'Nachtwache-Erholungs-Malus (−40%) wird durch eigene Schlaf-Boni (Skills/Haustier) abgeschwächt — je besser der Schlafplatz, desto stärker der Effekt. Minimum 10% Malus bleibt.' },
  ],
  '0.21.3-alpha': [
    { cat: 'Bugfix', text: 'Schlafqualität: Straße/Absteige/Bett erholten alle gleich viel bei hohem Skill-Bonus. Jeder Schlafplatz hat jetzt ein eigenes Maximum (Straße 55%, Absteige 72%, Eigenes Bett 100%).' },
  ],
  '0.21.2-alpha': [
    { cat: 'Bugfix', text: 'Schlafplatz: "Im eigenen Bett" erschien doppelt, sobald ein Zuhause vorhanden war. Behoben.' },
  ],
  '0.21.1-alpha': [
    { cat: 'Bugfix', text: 'Musik startete nach dem Laden der Seite nicht (Browser-Autoplay-Sperre). Behoben.' },
  ],
  '0.21.0-alpha': [
    { cat: 'Qualität', text: 'Alle NPC-Dialoge und Story-Texte komplett überarbeitet — natürlicheres, fließendes Deutsch auf Romanqualität.' },
    { cat: 'Bugfix', text: 'gildeInvestition: Quest konnte nie abgeschlossen werden (Timer lief nie). Behoben.' },
    { cat: 'Bugfix', text: 'gildeKorruption: Quest war durch falschen State-Namen blockiert. Behoben.' },
    { cat: 'Bugfix', text: 'brennenderMut: Kein Turn-in bei Brakka möglich. Behoben. Schwelle korrigiert (3 Nächte statt 5).' },
    { cat: 'Bugfix', text: 'oswinsAuftrag: Oswin reagierte nicht auf laufende Quest. Behoben.' },
  ],
  '0.20.0-alpha': [
    { cat: 'Neuerung', text: '29 neue Quests — Kap 2 (8), Kap 3 (10), Kap 4 (10) — mit vollständigen NPC-Dialogen, Quest-Ketten und Belohnungen.' },
    { cat: 'Neuerung', text: 'Neuer NPC Harro (Hafen-Schuldner), erweiterter Gorr/Sele/Yeva-Dialog mit 3-stufigen Quest-Ketten pro Fraktion.' },
    { cat: 'Neuerung', text: 'Velmarks Hafen: neue Spielfläche mit Hafenarbeit, Velmark-Stadtwache, Unterwelt-Verhandlung, Archiv-Durchsuchen.' },
    { cat: 'Neuerung', text: 'Valdris-Profil: 6 aufdeckbare Felder geben ein vollständiges Bild des Antagonisten.' },
    { cat: 'Neuerung', text: 'Finale Konfrontation: Vorbereitungsphase + Valdris-Finale als krönender Abschluss von Kapitel 4.' },
    { cat: 'Neuerung', text: '4 neue Tier-1/Tier-2 Monster (Bandit, Sumpfwesen, Eisengolem, Giftschlange) + 2 Tier-3 (Hafenwächter, Valdris-Agent).' },
    { cat: 'Neuerung', text: '5 neue Errungenschaften: Vollständigkeit Kap 2/3/4, Valdris enthüllt, Hafenmeister.' },
  ],
  '0.19.0-alpha': [
    { cat: 'Neuerung', text: 'Kap-2-Prestige: "Als Veteran zurückkehren" — Ruf als dauerhafte Metawährung, 5 Ruf-Fähigkeiten (Max-HP, Kampfschaden, Startgold, Tier-2-Drops u.a.).' },
    { cat: 'Neuerung', text: 'Kap-3-Prestige: Lethkar erneut besuchen — gibt Wissensdurst ✦, steigender Bonus pro Neustart.' },
    { cat: 'Neuerung', text: 'Velmark: Pereth als Kontakt, Fraktions-NPCs (Gildenmeisterin Yeva, Hauptmann Gorr, Archivarin Sele) mit Dialog-Bäumen.' },
    { cat: 'Neuerung', text: 'Neues Haustier: Stadtfalke — erscheint wenn das Informantennetz wächst, gibt dauerhaften Einfluss-Bonus.' },
    { cat: 'Neuerung', text: '4 neue Errungenschaften: Veteran, Dreifach erprobt, Wissbegierig, Freier Himmel.' },
    { cat: 'Neuerung', text: 'Informantennetz: tickt jede Minute automatisch Einfluss nach, solange Pereth freigeschaltet.' }
  ],
  '0.18.0-alpha': [
    { cat: 'Story',    text: 'Kapitel 3 Abschluss: Story 3.7–3.10 — Valdris\' Lager, Varenas Enthüllung, Alchemie-Durchbruch, Kap-3-Sieg-Dialog.' },
    { cat: 'Story',    text: 'Kapitel 4: Velmark — die finale Stadt. Fraktionssystem, Einfluss (⚜), Informantennetz, Story 4.1–4.10 inkl. vollständigem Sieg-Dialog.' },
    { cat: 'Neuerung', text: 'Audio-System: Hintergrundmusik (Ambient, Taverne, Kampf) + 11 Soundeffekte — synthetisch via Web Audio API, keine externen Dateien.' },
    { cat: 'Neuerung', text: '50+ neue Errungenschaften für alle Kapitel + 8 geheime Errungenschaften. Kompaktes Kachel-UI mit Klick-Detail-Panel + Layer-Filter-Tabs.' },
    { cat: 'Neuerung', text: 'Drei Fraktionen in Velmark: Händlergilde, Eiserne Bruderschaft, Stadtarchiv — je mit Reputationsbalken und NPC-Dialog-Baum.' },
    { cat: 'Neuerung', text: 'Tier-2-Monster geben Wissensdurst ✦ als Kampf-Drop. Tier-3-Kämpfe in Velmarks Unterwelt geben ⚜ Einfluss.' },
    { cat: 'Neuerung', text: 'Haustiere: Hauskatze (15 NW), Eule (20 NW), Wolf-Welpe (Waldtroll-Drop). Überarbeitete UI mit Wildtiere/Besonders-Tabs.' },
    { cat: 'Neuerung', text: 'Geschichte-Seite: zustandsbasierte Ich-Texte für jede Story-Phase.' },
    { cat: 'Bugfix',   text: 'Alchemisten-Werkzeug wird bei hartem Reset korrekt zurückgesetzt. Erstkontakt-Story (4.2) triggert jetzt korrekt. Erfahrungs-Baum: "Schaltet weitere Fähigkeiten frei" verschwindet nach Erwerb.' }
  ],
  '0.17.0-alpha': [
    { cat: 'Story',    text: 'Kapitel 3: Lethkar ist zugänglich (Kapitel 2 abgeschlossen + 3 Mut). Stadtübersicht, Taverne, Markt, Schlafplatz.' },
    { cat: 'Story',    text: 'NPCs in Lethkar: Varena (entschlüsselt Miras Brief), Thessa und Pereth mit vollständiger Story 3.0–3.6.' },
    { cat: 'Neuerung', text: 'Alchemie-System: 5 Aspekte (Feuer, Wasser, Erde, Luft, Äther) in Echtzeit — Wissensdurst als neue Prestige-Währung.' },
    { cat: 'Neuerung', text: 'Alchemie-Meilensteine: Level-Ups schalten Gameplay-Boni frei (Kampf-Schaden, MaxHP, Rohstoff-Bonus, Gold-Bonus u.a.).' },
    { cat: 'Neuerung', text: 'Wissensdurst-Fähigkeiten: 5 permanente Skills (Forschungsinstinkt, Wissensspeicher, Doppelte Erkenntnis …).' },
    { cat: 'Neuerung', text: 'Lethkar Markt: Alchemisten-Werkzeug (+50% Alchemie-Tempo) und Lethkarer Verpflegung.' },
    { cat: 'Bugfix',   text: 'Lethkar-NPC-Dialoge (Varena, Thessa, Pereth) konnten nicht geöffnet werden — openNpcDialogWithDef fehlte.' },
  ],
  '0.16.4-alpha': [
    { cat: 'Balance', text: 'EP-Mindestschwelle für Neuanfänge: 50 → 300 Gold. Raub 2 (200g) ergibt nun keine EP mehr — erst Raub 3 (300g) und Raub 4 (500g).' },
    { cat: 'Balance', text: '"Weitblick"-Breakpoints starten jetzt bei 300g (vorher 50g) und verdoppeln sich: 300, 600, 1200, 2400 …' },
    { cat: 'Bugfix', text: 'Schuften-Karte: Progressbar erscheint jetzt über dem Button statt darunter — kein Layout-Sprung mehr beim Klick.' },
  ],
  '0.16.3-alpha': [
    { cat: 'Bugfix', text: 'Zieltext nach dem 4. Raub und zu Beginn von Kapitel 2 enthielt UI-Begriffe ("Erfahrungs-Baum", "Reiter") — ersetzt durch immersive Formulierungen.' },
    { cat: 'Bugfix', text: 'Paranoid-Skill: Nachteil-Zeile bricht jetzt im Detail-Panel auf eine eigene Zeile um.' },
  ],
  '0.16.2-alpha': [
    { cat: 'Bugfix', text: 'Raub-Resets werden beim Laden automatisch nachgeholt, falls sie durch einen früheren Bug übersprungen wurden.' },
    { cat: 'Bugfix', text: 'Raub-Story-Dialoge öffnen zuverlässig nach NPC-Dialogen — kein verlorener Reset-Callback mehr aus brakka.turnIn.' },
  ],
  '0.16.1-alpha': [
    { cat: 'Bugfix', text: 'Erster Raub löst jetzt zuverlässig einen Reset aus, auch wenn gleichzeitig der Monolog zur ersten Nachtwache gezeigt wird.' },
  ],
  '0.16.0-alpha': [
    { cat: 'Bugfix',   text: 'Essen lindert jetzt leichte Müdigkeit statt sie zu erhöhen: Brot −4%, Fisch −8%, Honigkuchen −15%, Kaffee −16% (netto).' },
    { cat: 'Bugfix',   text: 'Taverne-Tab leuchtet nicht mehr, wenn Greta Rohstoffe erwartet, die noch nicht gesammelt wurden.' },
    { cat: 'Bugfix',   text: 'Dialogseiten-Guard: zuverlässiger umgeschrieben — kein DOM-Neuaufbau mehr, robuster bei schnellen Klickfolgen.' },
    { cat: 'Neuerung', text: 'Sammeln bei 100% Müdigkeit nicht mehr möglich — erst schlafen.' },
    { cat: 'Neuerung', text: 'Skill-Detail zeigt jetzt an, wenn ein Skill weitere Fähigkeiten freischaltet.' }
  ],
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
  ],
  '0.14.4-alpha': [
    { cat: 'Neuerung', text: '„Längere Pause" auf 4 Stufen erweitert: Stufe 3 verlängert auf 60 Min., Stufe 4 reduziert zusätzlich den Hunger. Super-Skill: Hunger & Müdigkeit steigen dauerhaft 10 % langsamer.' },
    { cat: 'Neuerung', text: 'Update-Banner erscheint jetzt im Dokumentenfluss statt als Overlay — überdeckt keine UI-Elemente mehr.' }
  ],
  '0.14.5-alpha': [
    { cat: 'Bugfix',   text: 'Der Raub-Dialog konnte bei ungünstigem Autosave-Timing nicht erscheinen und den Erfahrungs-Tab dauerhaft gesperrt lassen — das wird jetzt beim Laden automatisch repariert.' },
    { cat: 'Neuerung', text: 'Erster Besuch in der Schmiede wird mit einem kurzen Ich-Monolog begrüßt.' },
    { cat: 'Neuerung', text: 'Beim ersten Erreichen von 100 % Müdigkeit erscheint ein einmaliger Monolog.' },
    { cat: 'Neuerung', text: 'Gold- und EP-Gewinne werden als kurze schwebende Zahl in der Charakter-Anzeige animiert.' }
  ],
  '0.14.6-alpha': [
    { cat: 'Bugfix',   text: 'Raub: Gold verschwindet jetzt erst nach dem Dialog, nicht schon davor — der Kontostand beim Lesen war verwirrend.' },
    { cat: 'Bugfix',   text: 'Nach einem Neuanfang bleibt die Navigation in der aktuellen Stadt — kein ungewolltes Zurückfallen auf die Weltkarte.' },
    { cat: 'Neuerung', text: 'Mira zeigt jetzt ein ❗-Symbol, bevor man sie das erste Mal auf einen Drink eingeladen hat.' },
    { cat: 'Neuerung', text: 'Alle Zielleisten-Texte sind jetzt konsequent in Ich-Perspektive geschrieben.' }
  ],
  '0.15.4-alpha': [
    { cat: 'Neuerung', text: 'Essen erzeugt jetzt leichte Müdigkeit: Brot +4%, Fisch +8%, Honigkuchen +15%, Kaffee netto −16% (Linderung überwiegt).' },
    { cat: 'Bugfix',   text: 'Taverne-Tab leuchtet nur noch auf, wenn wirklich etwas zu tun ist — nicht mehr direkt nach dem Vorarbeiter-Gespräch tagsüber.' },
    { cat: 'Bugfix',   text: 'Erfahrung-Sidebar (EP-Zähler + Neu-anfangen) ist erst nach dem ersten Neuanfang sichtbar.' },
    { cat: 'Bugfix',   text: 'NPC-Dialoge: Letzte Seite aktiviert Antwort-Buttons erst nach kurzer Pause, verhindert versehentliches Schließen.' },
    { cat: 'Bugfix',   text: 'Icons (⚙ Einstellungen, Kap-Anzeige, Ziel) korrekt — Sonderzeichen-Kodierung wurde bei einem früheren Cache-Buster-Update korrumpiert.' }
  ],
  '0.15.3-alpha': [
    { cat: 'Bugfix',   text: 'Alte Spielstände aus Kapitel 2 (Einzel-Raub-System) werden jetzt als inkompatibel erkannt — Download-Option + Neustart statt stillem Weiterfahren.' },
    { cat: 'Bugfix',   text: 'Spielstand-Changelog erscheint jetzt auch für sehr alte Spielstände (v0.13.x), die die Änderungen in v0.14–v0.15 nie angezeigt bekamen.' },
    { cat: 'Bugfix',   text: 'Krämer öffnet jetzt immer mit dem Essen-Tab (statt dem zuletzt aktiven).' }
  ],
  '0.15.2-alpha': [
    { cat: 'Bugfix',   text: 'Der Paranoid-Skill-Ast erscheint jetzt erst nach dem 4. Raub (nicht schon nach dem 1.).' },
    { cat: 'Bugfix',   text: 'Feldarbeit-Infopanel («/») wird automatisch eingeklappt, wenn man zu erschöpft zum Arbeiten ist — der Toggle-Button verschwindet sonst.' },
    { cat: 'Bugfix',   text: 'Feldarbeit-Infopanel liegt jetzt korrekt über dem Verschnaufen-Button (z-index-Fix).' }
  ],
  '0.15.1-alpha': [
    { cat: 'Balance',  text: 'Raub 2/3/4 goldwerte angehoben: 200/300/500 Gold (war 75/100/125) — die Raub-Intervalle geben mehr Zeit zum Aufbauen.' },
    { cat: 'Bugfix',   text: '„Neu anfangen" war sofort sichtbar, bevor man Paranoid erlernte — jetzt korrekt verborgen bis zum Kauf.' }
  ],
  '0.15.0-alpha': [
    { cat: 'Story',    text: 'Neues Raub-System: 4 automatische Raub-Events (50/200/300/500 Gold), jeder mit eigenem Story-Dialog (Kapitel 1.5–1.7) und auto-Reset. Nach dem 4. Raub ist Arbeit gesperrt.' },
    { cat: 'Story',    text: 'Neuer Skill-Ast: „Paranoid" (5 Fähigkeiten) — kaufbar nach dem 4. Raub. Schaltet die „Neu anfangen"-Karte und den restlichen Erfahrungs-Baum frei. Eigener visueller Ast neben dem normalen Baum.' },
    { cat: 'Story',    text: 'Kapitel 1.8 „Paranoid" — Story-Chronik-Eintrag nach Kauf der gleichnamigen Fähigkeit.' },
    { cat: 'Neuerung', text: 'Jede erlernte Fähigkeit im Erfahrungs-Baum zeigt jetzt einen immersiven Ich-Perspektiv-Monolog.' },
    { cat: 'Neuerung', text: 'Errungenschaften: 23 neue Einträge (Kapitel 1 und Erfahrungs-Weg).' },
    { cat: 'Neuerung', text: 'Mira und Brakka erklären jetzt auf Nachfrage, warum Mira den Brief nicht selbst überbracht hat.' },
    { cat: 'Bugfix',   text: '„Wachsamer Geist" erscheint jetzt korrekt in der Kategorie „Erstes Kapitel".' },
    { cat: 'Bugfix',   text: 'Greta (Krämerin) und Kommandant Roswald zeigen jetzt korrekte ❗-Badges wenn ihre Quests auf Aufmerksamkeit warten.' },
    { cat: 'Bugfix',   text: '"Schritt für Schritt" in der Nachtwache-Beschreibung korrigiert.' }
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
  hasSmith:           false, // Schmiede im Eigenheim ausgebaut (dauerhaft)
  alchemieWerkzeug:   false, // Alchemisten-Werkzeug (Lethkar Markt, 500g) — +50% Alchemie-Tempo
  velmarkRuestung:    false, // Velmarker Kettenrüstung (Velmark Markt) — −5 Schaden im Kampf
  netzwerkErweitert:  false, // Geheimes Netzwerk (Velmark Markt) — Informanten-Max 5 → 8
  feldarbeitProfi:    false, // Siverts Lehre (Lethkar Taverne, 800g) — Feldarbeit-XP ×1000
  feldarbeitMeister:  false  // Körpergedächtnis-Durchbruch bei Stufe 4 — Feldarbeit-XP ×100.000
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
  longShift:        false, // 2-Stunden-Feldarbeit freischalten
  longerRest:       0,     // Pause verlängern (4 Stufen)
  // ── Paranoider Ast (freigeschaltet nach dem 4. Raub) ──────
  paranoid:         false, // Schaltet "Neu anfangen" + Reihe 2 des Normalbaums frei. Nachteil: +15 % Müdigkeit
  aufmerksamkeit:   false, // Hebt den Müdigkeitsmalus von Paranoid auf
  instinkt:         false, // +1 Gold pro Feldarbeit
  kaltbluetig:      false, // +1 EP bei jedem Neuanfang
  unzerstoerbar:    false  // +1 weiterer EP bei jedem Neuanfang
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
  chapter3StoryComplete:       false, // Pereth-Auftrag abgeschlossen → Story 3.6
  valdrisOperationRaided:      false, // Spieler hat Valdris' Lager gestürmt → Story 3.7
  varenaRevealedValdrisIdent:  false, // Varena hat Valdris als Netzwerk-Kopf enthüllt → Story 3.8
  alchemieGeselleReached:      false, // Alchemie-Geselle (10 Gesamtlevel) → Story 3.9
  kap3Complete:                false, // Kapitel 3 vollständig abgeschlossen → Story 3.10 + Konfetti
  // ── Kapitel-4-Flags (Velmark) ─────────────────────────────
  // ── Kap-2-Flags (neu) ─────────────────────────────────────
  fremderIdentityKnown:        false, // Der Fremde wurde identifiziert (fremderGeheimnis)
  kapitel2FinaleStarted:       false, // kapitel2Finale-Quest gestartet
  kampfTrainingDone:           false, // kampfRoutine-Quest abgeschlossen
  consecutiveNightwatch:       0,     // Zähler für aufeinanderfolgende Nachtwachen (brennenderMut)
  // ── Kap-3-Flags (neu) ─────────────────────────────────────
  thessaMetLethkar:            false, // Thessa in Lethkar getroffen
  valdrisSpurenGefunden:       false, // valdrisSpuren-Quest abgeschlossen
  perethKontaktLethkar:        false, // Pereth in Lethkar kontaktiert
  lethkarHaendlerRabatt:       false, // Händlerrabatt durch lethkarMarkt-Quest
  // ── Kap-4-Flags (mit Velmark-Original) ──────────────────
  velmarkUnlocked:             false, // Velmark betreten (kap3Complete + Weltkarte)
  perethFoundInVelmark:        false, // Pereth in Velmark gefunden und angesprochen
  informantenNetzFreigeschaltet: false, // Informanten-Tick aktiv (nach Pereth-Quest)
  gildekontaktGeknuepft:       false, // Händlergilde: erste Konversation
  bruderschaftkontaktGeknuepft: false, // Eiserne Bruderschaft: erste Konversation
  archivkontaktGeknuepft:      false, // Stadtarchiv: erste Konversation
  ersteAllianzGeknuepft:       false, // eine Fraktion ≥ 30 → Story 4.4
  valdrisBriefErhalten:        false, // Brief von Valdris → Story 4.5
  zweiAllianzGekuepft:         false, // zwei Fraktionen ≥ 60 → Story 4.6
  valdrisAngebotGemacht:       false, // Valdris' persönliches Angebot → Story 4.7
  valdrisAngebotAbgelehnt:     false, // Angebot abgelehnt → Story 4.8
  allianzKomplett:             false, // alle drei Fraktionen ≥ 80 → Story 4.9
  kap4Complete:                false, // Kapitel 4 vollständig abgeschlossen → Story 4.10 + Ende
  // ── Kap-4-Flags (neu) ─────────────────────────────────────
  hafenarbeitUnlocked:         false, // Hafenarbeit-Aktion freigeschaltet
  velmarkStadtwacheUnlocked:   false, // Velmark-Stadtwache freigeschaltet (gildeSchulden)
  archivDurchsuchenUnlocked:   false, // Archiv-Durchsuchen freigeschaltet (archivRecherche)
  unterweltVerhandlungUnlocked: false, // Unterwelt-Verhandlung freigeschaltet (bruderschaftBeweis)
  gorrsEidGeleistet:           false, // Gorrs Eid geleistet → Bruderschaft hält Südtor
  harroMet:                    false, // Harro am Hafen getroffen
  harroSchuldenBezahlt:        false, // Harrос Schulden übernommen (gildeSchulden)
  gorrMet:                     false, // Gorr zum ersten Mal gesprochen
  seleMet:                     false, // Sele zum ersten Mal gesprochen
  yevaMetFirst:                false, // Yeva zum ersten Mal gesprochen
  valdrisDokumentGefunden:     false, // Valdris-Dokument gefunden (dasDokument-Quest)
  valdrisFinaleStarted:        false, // Finale Konfrontation begonnen
  schmiedeWelcomeSeen:         false, // Willkommens-Monolog in der Schmiede beim ersten Betreten
  exhaustionDialogShown:       false, // Einmaliger Erschöpfungs-Monolog beim ersten Erreichen von 100% Müdigkeit
  firstTier2Kill:              false, // Erster Tier-2-Gegner besiegt (Achievement-Tracking)
  firstTier3Kill:              false, // Erster Tier-3-Gegner besiegt (Achievement-Tracking)
  deepHuntingUnlocked:         false, // Tiefe Jagdzone (Waldtroll) betreten (Achievement-Tracking)
  // ── Neues Raub-System (4 automatische Raub-Events) ────────
  robbery2Triggered:           false, // 2. Raub (200 Gold in der Hand) ausgelöst
  robbery3Triggered:           false, // 3. Raub (300 Gold in der Hand) ausgelöst
  robbery4Triggered:           false, // 4. Raub (500 Gold in der Hand) ausgelöst
  workBlockedByRobberies:      false, // Nach 4. Raub: Arbeit gesperrt bis Paranoid gekauft
  newRobberySystemActive:      true,  // true = neues 4-Raub-System; false nur bei Altständen ohne dieses Flag
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
  taverne:      false, // dynamisch berechnet in nav.js via isTaverneTabNew()
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
  lethkar:      false,    // erst sichtbar nach Lethkar-Betreten
  velmark:      false     // erst sichtbar nach Velmark-Betreten
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
let restStats = { count: 0 };

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
  // ── Kapitel 1 ─────────────────────────────────────────────
  nightWatch:          { state: 'unstarted' },
  miraLetter:          { state: 'unstarted' },
  foremanRaise:        { state: 'unstarted' },
  kraemerinBusiness:   { state: 'unstarted' }, // 'unstarted' -> 'invited' -> 'active' -> 'rewarded'
  guildRegistration:   { state: 'unstarted' },
  commanderTraining:   { state: 'unstarted' },
  oswinsAuftrag:       { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'done' -> 'rewarded'
  erstesZuhause:       { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'rewarded'
  // ── Kapitel 2 ─────────────────────────────────────────────
  theftInvestigation:  { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'investigating' -> 'mira_consulted' -> 'brakka_consulted' -> 'confronted' -> 'rewarded'
  gildePruefung:       { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'done' -> 'rewarded'
  fremderGeheimnis:    { state: 'unstarted' }, // 'unstarted' -> 'curious' -> 'asking_around' -> 'identity_known' -> 'rewarded'
  miraSuche:           { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'rewarded'
  kampfRoutine:        { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'half_done' -> 'rewarded'
  waldtrollJagd:       { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'done' -> 'rewarded'
  gildaAufstieg:       { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'done' -> 'rewarded'
  brennenderMut:       { state: 'unstarted', count: 0 }, // zählt Nachtwachen
  kapitel2Finale:      { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'done' -> 'rewarded'
  // ── Kapitel 3 ─────────────────────────────────────────────
  varenaErstkontakt:   { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'done' -> 'rewarded'
  alchemieInitiierung: { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'rewarded'
  thessaGeheimnis:     { state: 'unstarted' }, // 'unstarted' -> 'talk1' -> 'talk2' -> 'rewarded'
  tier2Boss:           { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'rewarded'
  wissensdurst10:      { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'rewarded'
  valdrisSpuren:       { state: 'unstarted' }, // 'unstarted' -> 'ort1' -> 'ort2' -> 'ort3' -> 'rewarded'
  lethkarMarkt:        { state: 'unstarted', goldTraded: 0 }, // 'unstarted' -> 'active' -> 'rewarded'
  perethKontakt:       { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'done' -> 'rewarded'
  alchemieGeselle:     { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'done' -> 'rewarded'
  kapitel3Abschluss:   { state: 'unstarted' }, // 'unstarted' -> 'abschied_varena' -> 'abschied_thessa' -> 'rewarded'
  // ── Kapitel 4 ─────────────────────────────────────────────
  gildeSchulden:       { state: 'unstarted', wacheCount: 0 },
  gildeInvestition:    { state: 'unstarted', investDay: 0 },
  gildeKorruption:     { state: 'unstarted', hinweisCount: 0 },
  bruderschaftBeweis:  { state: 'unstarted', killCount: 0 },
  gorrsVergangenheit:  { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'night_talk' -> 'rewarded'
  gorrsEid:            { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'duell_won' -> 'rewarded'
  archivRecherche:     { state: 'unstarted', count: 0 },
  seleWissen:          { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'rewarded'
  dasDokument:         { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'waiting_night' -> 'rewarded'
  dieKonfrontation:    { state: 'unstarted' }, // 'unstarted' -> 'active' -> 'step1' -> 'step2' -> 'rewarded'
};

/* Einmalige NPC-Interaktionen, die sich dauerhaft auf den Dialog auswirken */
let npcFlags = {
  miraDrinkGiven:       false,
  fremderTalkCount:     0,    // Wie oft der Spieler den zwielichtigen Mann angesprochen hat
  oswingBusinessSeen:   false, // Spieler hat "Sprich über Geschäfte" (100g) geklickt → ! erlischt
  oswingHintNotified:   false, // Taverne-Tab hat einmalig für Oswin-100g-Hint aufgeleuchtet
  brakkaGildeDetailsSeen: false // Einmaliger "Was macht die Abenteurergilde?"-Dialog
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
let achievementTab = ACH_CAT.NORMAL;
let achievementLayerFilter = null; // null = alle Layer, 0–4 = spezifischer Layer

/* Vom Spieler adoptierte Haustiere (siehe pets.js): id -> { name, level }.
   `level` startet bei 0 und steigt nur, sobald der Skill "Tierfreund"
   (experience.js) erlernt wurde (siehe pets.js, trainPet()). */
let pets = {};

/* Reguläre Wildtiere — gefangen im Jagdgebiet nach Greta-Quest.
   Jedes Tier: { type: 'hund'|'rabe'|'hase'|'eichhoernchen'|'katze'|'eule', level: 1 }
   level steigt durch "Zeit verbringen" (max. Level 3, 1x täglich GESAMT). */
let wildPets = [];

/* Aktiver Tab auf der Haustiere-Seite. */
let petsTab = 'wildtiere'; // 'wildtiere' oder 'besonders'

/* Fortschritt der geheimen Straßenkatze-Begegnungskette (siehe actions.js,
   maybeTriggerStreetWalk()/takeStreetWalk()) — eigenes kleines State-
   Objekt statt Felder in gameFlags, weil es Zähler sind, keine reinen
   Einmal-Flags. */
let streetCatProgress = {
  sleepCount: 0,        // Wie oft insgesamt auf der Straße geschlafen wurde
  encounters: 0,        // Wie oft die Katze bereits getroffen UND gestreichelt wurde (max. 3, dann adoptiert)
  postAdoptionNights: 0 // Wie oft nach der Adoption auf der Straße geschlafen wurde
};

/* Audio-Einstellungen — werden NICHT in den normalen Spielstand gespeichert,
   sondern in einem eigenen localStorage-Key ('audioSettings'). Damit überleben
   sie einen Hard-Reset (der SAVE_KEY löscht nur den Spielfortschritt).
   Laden/Speichern erfolgt über loadAudioSettings()/saveAudioSettings() in audio.js. */
let audioSettings = {
  musicEnabled: true,
  sfxEnabled:   true,
  musicVolume:  0.5,
  sfxVolume:    0.5
};

/* Spieler-Einstellungen, die das Spielgefühl betreffen (nicht den Fortschritt) */
let settings = {
  toastDurationMs: 5000,
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

/* ── Kap-2-Prestige: Ruf ─────────────────────────────────────
   Wird durch Kap-2-Prestige-Resets verdient (3 + kap2ResetCount*2 pro Reset).
   Übersteht alle Resets permanent (wie EP / Mut). */
let ruf = 0;
let kap2ResetCount = 0;
let rufSkills = {}; // { rufVeteran: true, rufKaempfer: true, … }

/* Kap-3-Prestige-Zähler */
let kap3ResetCount = 0;

/* Definitionen der Ruf-Fähigkeiten (Kap-2-Prestige). */
const RUF_SKILL_DEFS = [
  { id: 'rufVeteran',      name: 'Veteran',           cost: 3, desc: '+20 Max-HP dauerhaft.' },
  { id: 'rufKaempfer',     name: 'Kampferfahrung',    cost: 4, desc: '+10 % Kampfschaden dauerhaft.' },
  { id: 'rufGilde',        name: 'Gildenmitglied',    cost: 2, desc: 'Gildengebühr entfällt beim nächsten Kap-2-Start.' },
  { id: 'rufSchnellstart', name: 'Schnellstart',      cost: 3, desc: 'Startet mit 200 Gold nach jedem Prestige-Reset.' },
  { id: 'rufExperte',      name: 'Kampfexperte',      cost: 5, desc: 'Tier-2-Monster geben 50 % mehr Drops.' },
];

/* ── Ruf-Bonus-Hilfsfunktionen ────────────────────────────── */
function getRufMaxHpBonus()     { return rufSkills.rufVeteran      ? 20   : 0; }
function getRufCombatDmgBonus() { return rufSkills.rufKaempfer     ? 0.10 : 0; }
function getRufGildeFree()      { return !!rufSkills.rufGilde; }
function getRufStartGold()      { return rufSkills.rufSchnellstart ? 200  : 0; }
function getRufTier2DropBonus() { return rufSkills.rufExperte      ? 0.5  : 0; }

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

/* Einfluss — die Kapitel-4-Ressource (Velmark). Kein Reset-Prestige mehr —
   Einfluss wird direkt eingesetzt, um Fraktions-Reputation zu kaufen und
   Diplomatie-Aktionen freizuschalten. Übersteht Resets trotzdem (analog Mut). */
let einfluss = {
  points:      0,
  totalEarned: 0
};

/* Fraktionen — Velmark (Kapitel 4). Reputation 0–100 je Fraktion.
   ≥ 30: Bekannt (erste Quests verfügbar)
   ≥ 60: Verbündet (Diplomatie-Aktionen + Händler-Boni)
   ≥ 80: Vollverbündet (für Allianz gegen Valdris erforderlich) */
let fraktionen = {
  haendlergilde: 0, // Händlergilde — Gold-Fraktion
  bruderschaft:  0, // Eiserne Bruderschaft — Kampf-Fraktion
  archiv:        0  // Stadtarchiv — Wissen-Fraktion
};

/* Informantennetz — freigeschaltet nach Pereth-Quest in Velmark.
   count: Anzahl aktiver Informanten (jeder gibt 1 ⚜ / Minute passiv)
   lastTick: Unix-Timestamp des letzten Ticks (analog alchemie.lastTick) */
let informanten = {
  count:    0,
  lastTick: null
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

/* Valdris-Profil — Wissen über den Antagonisten, das durch Quests enthüllt wird.
   Jedes Feld: false (unbekannt → "???") oder true (bekannt → Text sichtbar). */
let valdrisProfil = {
  herkunft:     false, // enthüllt durch archivRecherche-Quest
  netzwerk:     false, // enthüllt durch gorrsVergangenheit-Quest
  motive:       false, // enthüllt durch dasDokument-Quest
  kontakte:     false, // enthüllt durch gildeKorruption-Quest
  schwaeche:    false, // enthüllt durch seleWissen-Quest
  aufenthaltsort: false // enthüllt durch dasDokument-Quest (finales Dokument)
};

/* Hafen-Statistiken — Velmark Kap 4. Analog zu workStats. */
let hafenStats = { count: 0 };

/* Automatisierungs-Konfiguration. Jeder Slot führt eine Aktion
   periodisch selbst aus, solange ein Zeitkristall zugewiesen ist. */
let automation = {
  slots:     [], // [{ action: 'feldarbeit', enabled: true }, ...]
  clockAccum: 0  // akkumulierte Spielminuten seit letztem Tick
};

/* ── UI-State ─────────────────────────────────────────────── */
let selectedSkillId = null; // welcher Skill-Knoten im EP-Baum gerade ausgewählt ist

let navLevel       = NAV_LEVEL.MENU;
let currentCity    = CONTENT.TREUTHEIM;
let currentContent = CONTENT.GESCHICHTE;
let marketVendor      = null;         // null=Markt-Übersicht | VENDOR.KRAEMER | VENDOR.SCHMIEDE
let marketKraemerTab  = 'essen';      // 'essen' | 'ausruestung'
let jobInfoPanelOpen = false;
let erfahrungTab     = EP_TAB.SKILLS;
let historyFilter    = HISTORY_FILTER.TOASTS;

/* ── Arbeits-Animation State ──────────────────────────────── */
let workProgress  = 0;
let workStartTime = null;
let workRafId     = null;
let workShiftMult = 1; // 1 = normale Schicht, 2 = Lange Schicht

/* ── Stadtwache-Animation State ───────────────────────────── */
let stadtwacheProgress  = 0;
let stadtwacheStartTime = null;
let stadtwacheRafId     = null;

/* ── Velmark-Aktions-Animation State ──────────────────────── */
let hafenProgress  = 0;
let hafenStartTime = null;
let hafenRafId     = null;

let velmarkWacheProgress  = 0;
let velmarkWacheStartTime = null;
let velmarkWacheRafId     = null;

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
