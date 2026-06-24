# Master-Implementierungsplan — Chroniken des vergessenen Weges

Stand: 2026-06-24 | Ziel: 100% Completion bis Ende Kap 4

---

## STATUS ÜBERSICHT

| Bereich | Ist | Soll | Delta |
|---|---|---|---|
| Quests Kap 1 | 6 | 8 | +2 |
| Quests Kap 2 | 1 | 10 | +9 |
| Quests Kap 3 | 0 | 10 | +10 |
| Quests Kap 4 | 0 | 10 | +10 |
| Monster Tier 1 | 4 | 6 | +2 |
| Monster Tier 2 | 3 | 5 | +2 |
| Monster Tier 3 | 3 | 5 | +2 |
| Kap-4-Mechaniken | 3 | 8 | +5 |

---

## PHASE 1 — Quest-System & Kap-1 Ergänzungen

### Neue Datei: script/quests.js

Zentrales Quest-Management. Vor content.js laden.

```
QUEST_DEFS[] — Array aller Quest-Definitionen
  id, name, chapter, beschreibung, belohnung (text), check() → bool (abgeschlossen?)
  onComplete() → function (Belohnung vergeben)

checkAllQuests() — wird nach jeder Aktion aufgerufen, triggert onComplete
renderQuests(el) — ersetzt alten Quest-Renderer in content.js
getActiveQuests() — alle quests mit state !== 'unstarted' && !== 'rewarded'
getCompletedQuests() — alle rewarded
```

Quests-Objekt in state.js bleibt, aber um neue Felder erweitert.

### Neue Kap-1-Quests

**Q7 — `oswinsAuftrag`** (Oswin, Taverne)
- Trigger: erstes Gespräch mit Oswin nach Tag 2
- Aufgabe: Richte Brakka aus, dass Oswin eine "Unterredung" möchte → Brakka ansprechen → zurück zu Oswin
- Belohnung: +15 Gold, Oswin gibt Hinweis auf Super-Skills früher
- State-Machine: unstarted → active → brakka_told → rewarded

**Q8 — `erstesZuhause`** (Street)
- Trigger: 3× auf der Straße geschlafen (streetCatProgress.sleepCount >= 3)
- Aufgabe: Ein ordentliches Bett finden → Schlafen in der Taverne / Schlafplatz
- Belohnung: Straßenkatze-Begegnungskette startet früher, +1 Schlafqualität dauerhaft
- State-Machine: unstarted → active → rewarded

---

## PHASE 2 — Kap-2-Quests (9 neue)

### Q-Kap2-1: `gildePruefung`
- Trigger: nach guildRegistration abgeschlossen
- Aufgabe: Töte 5 Monster im Jagdgebiet → Zeige Roswald den Beweis
- Belohnung: Tiefer Jagdbereich freigeschaltet (deepHuntingUnlocked), +1 Mut
- NPC: Roswald → neuer Dialog-Knoten "gildePruefungDone"
- State: unstarted → active (nach guildRegistration rewarded) → done (5 kills) → rewarded

### Q-Kap2-2: `fremderGeheimnis`
- Trigger: fremderTalkCount >= 3
- Aufgabe: Jemanden fragen wer der Fremde ist → Oswin kennt ihn (neuer Dialog) → Mira auch (neuer Dialog) → zurück zum Fremden
- Belohnung: Der Fremde gibt Hinweis auf Kap-3-Ort (Lethkar), gameFlag fremderIdentityKnown
- State: unstarted → curious (3 talks) → asking_around → identity_known → rewarded

### Q-Kap2-3: `miraSuche`
- Trigger: miraLetter rewarded
- Aufgabe: Mira braucht Hilfe bei der Suche nach dem Dieb → führt INTO theftInvestigation (parallele Quest)
- Belohnung: theftInvestigation startet automatisch, +20 Gold
- State: unstarted → active → rewarded (wenn theftInvestigation active wird)

### Q-Kap2-4: `kampfRoutine`
- Trigger: 3 Kills insgesamt
- Aufgabe: Roswald sieht Potenzial — Training absolvieren: 2× Stadtwache + 5 weitere Kills
- Belohnung: +10 Max-HP dauerhaft (als Quest-Belohnung, nicht Skill), gameFlag kampfTrainingDone
- NPC: Roswald → "training" Dialog-Node
- State: unstarted → active → half_done (Stadtwache done) → rewarded

### Q-Kap2-5: `zeitkristallForschung`
- Trigger: automationDiscovered (erster Zeitkristall)
- Aufgabe: Oswin hat davon gehört — ihn fragen → sammle 2 weitere Zeitkristalle → Oswin zeigt die Automation
- Belohnung: Automation-Tab Nav-Button erscheint (JETZT erst — als Quest-Belohnung statt Sofortfreischaltung)
- State: unstarted → active → crystals_found → rewarded

### Q-Kap2-6: `waldtrollJagd`
- Trigger: deepHuntingUnlocked (nach gildePruefung)
- Aufgabe: Den Waldtroll finden und besiegen → besonderer Boss-Kampf mit Vor-Dialog
- Belohnung: Wolf-Welpe Drop-Chance +20% für diese Quest, waldtrollSlayer Achievement
- NPC: Brakka gibt Hinweis auf Waldtroll ("hört man Gerüchte")
- State: unstarted → active → waldtroll_dead → rewarded

### Q-Kap2-7: `gildaAufstieg`
- Trigger: theftInvestigation rewarded
- Aufgabe: Gildeneintrag bestätigen + Vorstellung bei Gildenchef (neuer NPC: Gildenvorsteher Torben, 1 Dialog)
- Belohnung: Gilden-Mitglied dauerhaft, +30 Gold, chapter2Complete-Kette startet
- State: unstarted → active → torben_met → rewarded

### Q-Kap2-8: `brennenderMut`
- Trigger: mutPoints >= 2
- Aufgabe: Brakka testet Entschlossenheit — 3 Nächte hintereinander Nachtwache (consecutiveNightwatch Zähler)
- Belohnung: +2 Mut, Brakka wird dauerhafter Vertrauens-NPC (neuer Dialog-Knoten)
- State: unstarted → active → two_done → rewarded

### Q-Kap2-9: `kapitel2Finale`
- Trigger: gildaAufstieg rewarded + waldtrollJagd rewarded
- Aufgabe: "Alles deutet nach Norden" — Fremder spricht dich ein letztes Mal an → gibt Lethkar-Koordinaten
- Belohnung: lethkarUnlocked = true, Story-Dialog "Der nächste Schritt"
- NPC: Fremder — finaler Monolog (3 Seiten)
- State: unstarted → active → fremder_final → rewarded

---

## PHASE 3 — Kap-3-Quests (10 neue)

### Q-Kap3-1: `varenaErstkontakt`
- Trigger: lethkarUnlocked + erstes Gespräch mit Varena
- Aufgabe: Varena braucht seltene Alchemie-Zutat → Wildkraut sammeln (5×) → zurück
- Belohnung: Alchemie freigeschaltet (JETZT erst als Quest-Belohnung), +10 Wissensdurst ✦
- State: unstarted → active → zutat_collected → rewarded

### Q-Kap3-2: `alchemieInitiierung`
- Trigger: varenaErstkontakt rewarded
- Aufgabe: Ersten Alchemie-Aspekt auf Level 5 bringen
- Belohnung: Wissensdurst-Skill Slot 1 freigeschaltet (forschungsinstinkt), +1 Wissensdurst
- State: unstarted → active → rewarded

### Q-Kap3-3: `thessaGeheimnis`
- Trigger: Gespräch mit Thessa (neuer NPC, Händlerin)
- Aufgabe: 3× Thessa ansprechen an verschiedenen Spieltagen → sie vertraut dir ein Geheimnis an
- Belohnung: Hinweis auf Valdris' Aktivitäten in Lethkar, +25 Gold
- State: unstarted → talk1 → talk2 → rewarded

### Q-Kap3-4: `tier2Boss`
- Trigger: Erstkontakt mit Tier-2-Monstern (lethkarUnlocked + erstes Kampfangebot)
- Aufgabe: Nordbär besiegen (stärkster Tier-2) — gilt als "Meisterprüfung"
- Belohnung: +3 Mut, Wissensdurst-Drops aus Tier-2 verdoppelt, Errungenschaft
- State: unstarted → active → rewarded

### Q-Kap3-5: `wissensdurst10`
- Trigger: einsicht.totalEarned >= 5
- Aufgabe: Varena erklärt das Potenzial — sammle 10 Wissensdurst ✦ gesamt
- Belohnung: Wissensdurst-Skill Slot 2 freigeschaltet (wissensspeicher)
- State: unstarted → active → rewarded

### Q-Kap3-6: `valdrisSpuren`
- Trigger: thessaGeheimnis rewarded
- Aufgabe: 3 Orte in Lethkar untersuchen (Taverne/Markt/Stadtrand — je ein Dialog-Check)
- Belohnung: Story-Trigger 3.7 (Valdris' Lager), gameFlag valdrisSpurenGefunden
- NPC: Varena gibt Hinweis nach jedem Ort
- State: unstarted → ort1 → ort2 → ort3_done → rewarded

### Q-Kap3-7: `lethkarMarkt`
- Trigger: Erster Besuch am Lethkar-Markt
- Aufgabe: Kaufe das Alchemisten-Werkzeug ODER verkaufe Ressourcen im Wert von 200g
- Belohnung: Lethkar-Händler-Rabatt (-10% auf alle Lethkar-Preise dauerhaft), +15 Gold
- State: unstarted → active → rewarded

### Q-Kap3-8: `perethKontakt`
- Trigger: kap3Complete = false + Story 3.8 (Der Name) gesehen
- Aufgabe: Pereth in Lethkar finden (er ist ein durchreisender Händler — neuer Dialog)
- Belohnung: Pereth gibt Velmark-Hinweis, informantenNetz-Preview, gameFlag perethKontaktLethkar
- State: unstarted → active → pereth_met → rewarded

### Q-Kap3-9: `alchemieGeselle`
- Trigger: alchemie totalLevels >= 10
- Aufgabe: Varena bestätigt den Gesellen-Status — sprich mit ihr
- Belohnung: Alchemie-Tempo +25% dauerhaft (als Quest-Bonus), Story 3.9 trigger
- State: unstarted → active → varena_spoken → rewarded

### Q-Kap3-10: `kapitel3Abschluss`
- Trigger: perethKontakt rewarded + alchemieGeselle rewarded + valdrisSpuren rewarded
- Aufgabe: Lethkar verlassen — Varena + Thessa verabschieden (je 1 finaler Dialog)
- Belohnung: velmarkUnlocked = true, Konfetti, Errungenschaft "Im Schatten der Einsicht"
- State: unstarted → abschied_varena → abschied_thessa → rewarded

---

## PHASE 4 — Kap-4-Quests (10 neue)

### HÄNDLERGILDE QUESTLINIE (3 Quests)

**Q-Kap4-1: `gildeSchulden`**
- Trigger: Händlergilde-Kontakt geknüpft (haendlergilde rep > 0)
- Aufgabe: Schuldner Harro (neuer NPC) zur Zahlung bewegen → 3× Stadtwache in Velmark (neue Aktion) → Harro zahlt
- Belohnung: +15 Händlergilde-Rep, +150 Gold
- State: unstarted → active → wache_done → harro_paid → rewarded

**Q-Kap4-2: `gildeInvestition`**
- Trigger: gildeSchulden rewarded + haendlergilde >= 30
- Aufgabe: 500 Gold in Yeva's Handelsnetz investieren → 5 Spieltage warten → Rendite
- Belohnung: +800 Gold zurück, +20 Händlergilde-Rep, Händlergilde-Bonus: alle Marktpreise -15%
- State: unstarted → invested → waiting → rewarded

**Q-Kap4-3: `gildeKorruption`**
- Trigger: gildeInvestition rewarded
- Aufgabe: Jemand manipuliert Yeva's Bücher — 3 Hinweise sammeln (Kampf/Dialog/Markt), Täter konfrontieren
- Belohnung: haendlergilde = 80 (volles Vertrauen), Yeva als Informantin (+2 Einfluss/Tag)
- State: unstarted → hinweis1 → hinweis2 → täter_known → rewarded

### EISERNE BRUDERSCHAFT QUESTLINIE (3 Quests)

**Q-Kap4-4: `bruderschaftBeweis`**
- Trigger: Bruderschaft-Kontakt geknüpft (bruderschaft rep > 0)
- Aufgabe: 3 Tier-3-Monster töten
- Belohnung: +15 Bruderschaft-Rep, Kampfschaden +5% dauerhaft
- State: unstarted → active (counter: 0→3) → rewarded

**Q-Kap4-5: `gorrsVergangenheit`**
- Trigger: bruderschaftBeweis rewarded + bruderschaft >= 30
- Aufgabe: Gorr unter 4 Augen sprechen (Abendsession — isNight()) — er erzählt von Valdris
- Belohnung: +20 Bruderschaft-Rep, Valdris-Profil Eintrag: "Netzwerk", Gorr-Story 3 Seiten
- State: unstarted → active → night_talk → rewarded

**Q-Kap4-6: `gorrsEid`**
- Trigger: gorrsVergangenheit rewarded + bruderschaft >= 60
- Aufgabe: Bruderschaft schwört Eid gegen Valdris — Gorr's Duell bestehen (Söldner-Boss-Kampf, 200 HP)
- Belohnung: bruderschaft = 80, Bruderschaft sperrt Velmark-Südtor (Story-Flag gorrsEidGeleistet)
- State: unstarted → active → duell_won → rewarded

### STADTARCHIV QUESTLINIE (3 Quests)

**Q-Kap4-7: `archivRecherche`**
- Trigger: Archiv-Kontakt geknüpft (archiv rep > 0)
- Aufgabe: 3 Hinweis-Dokumente im Archiv finden (3× neue Aktion "Archiv durchsuchen" — kostet 5 Einfluss)
- Belohnung: +15 Archiv-Rep, Valdris-Profil Eintrag: "Herkunft"
- State: unstarted → dok1 → dok2 → dok3 → rewarded

**Q-Kap4-8: `seleWissen`**
- Trigger: archivRecherche rewarded + einsicht.totalEarned >= 30
- Aufgabe: Sele's Alchemie-Test bestehen: Alchemie-Aspekt auf Level 15 bringen
- Belohnung: +20 Archiv-Rep, Wissensdurst-Skills Slot 4+5 freigeschaltet
- State: unstarted → active → rewarded

**Q-Kap4-9: `dasDokument`**
- Trigger: seleWissen rewarded + archiv >= 60
- Aufgabe: Sele findet finales Dokument — Valdris' echten Namen + Aufenthaltsort → braucht 1 Tag Übersetzung (warte eine Nacht)
- Belohnung: archiv = 80, Valdris-Profil vollständig, gameFlag valdrisDokumentGefunden
- State: unstarted → waiting_night → rewarded

### FINALE QUEST

**Q-Kap4-10: `dieKonfrontation`**
- Trigger: alle 3 Fraktionen >= 80 (allianzKomplett)
- Aufgabe: Valdris zur Konfrontation bringen — neue Content-Seite "Letzte Konfrontation"
  - Schritt 1: Valdris stellt sich (Dialog 3 Seiten)
  - Schritt 2: Er macht sein Angebot (angenommen/abgelehnt wie bisher)
  - Schritt 3: Sieg-Sequenz mit Epilog aller 3 Fraktions-NPCs
- Belohnung: kap4Complete = true, Konfetti, Errungenschaft "Der Preis der Wahrheit"

---

## PHASE 5 — Neue Mechaniken Kap 4

### 5.1 Hafenarbeit (neue Aktion)
- Freischaltung: nach Pereth-Gespräch in Velmark (informantenNetzFreigeschaltet)
- Aktion auf Velmark-Übersicht: "Im Hafen arbeiten" (2s Dauer)
- Gibt: 30-60 Gold + 1-2 Einfluss ⚜ gleichzeitig
- Eigenes Level-System: hafenStats.count, 5 Stufen (Tagelöhner → Hafenmeister)
- Bonus bei höheren Stufen: mehr Gold + mehr Einfluss pro Aktion

### 5.2 Unterwelt-Verhandlung (neue Aktion im Kampf-Tab)
- Freischaltung: nach bruderschaftBeweis rewarded
- Aktion: "Söldner kaufen" — kostet 10 Einfluss, gibt +1 informanten.count (max. 8)
- Nicht mehr als 1×/Tag, Dialog-Text: "Er nickt. Kein Wort. Morgen ist er im Netz."
- Alternative zu Kämpfen für Einfluss-Ausgabe

### 5.3 Valdris-Profil (neue Content-Seite)
- Nav-Eintrag "📋 Valdris" erscheint nach valdrisSpurenGefunden (Kap 3)
- 6 Eintragsfelder: Herkunft · Netzwerk · Motive · Kontakte · Schwäche · Aufenthaltsort
- Jedes Feld: "???" bis Quest das Feld freischaltet
- Vollständig = automatisch dieKonfrontation-Quest startbar (Schaltfläche erscheint)
- valdrisProfil = { herkunft: false, netzwerk: false, motive: false, kontakte: false, schwaeche: false, aufenthaltsort: false }

### 5.4 Velmark-Stadtwache (neue Aktion)
- Analog zu Kap-1-Nachtwache, aber in Velmark
- Freischaltung: gildeSchulden active
- Gibt: 40-80 Gold + 1 Einfluss ⚜
- Zähler für gildeSchulden Quest

### 5.5 Archiv-Durchsuchen (neue Aktion)
- Analog zu Feldarbeit, aber in der Archiv-Sektion
- Freischaltung: archivRecherche active
- Kostet 5 Einfluss ⚜, gibt Archiv-Dokument (Quest-Item) + Wissensdurst ✦
- Max. 3 Dokumente pro Quest

### 5.6 Finale Konfrontations-Seite
- Eigene Content-ID: CONTENT.VALDRIS_FINALE
- 3-stufige Sequenz mit eigenem Rendering, kein normales Combat-System
- Valdris' Dialog dynamisch je nach Fraktions-Rep
- Epilog: Yeva / Gorr / Sele je ein Abschluss-Satz (3 Mini-Dialoge)
- Danach: showVictoryDialog() mit Konfetti

---

## PHASE 6 — Neue Monster

### Tier 1 (+2):
- `bandit` — Wegelagerer, icon: 🗡️, HP: 18, dmg: [4,8], goldReward: [5,12], xpReward: 8
  zone: wald, desc: "Ein schlecht gekleideter Mann mit einem Messer. Er wirkt hungrig."
- `sumpfwesen` — Sumpfwesen, icon: 🐊, HP: 28, dmg: [5,10], goldReward: [8,15], xpReward: 10
  zone: tief (unlock: nach 10 kills), desc: "Etwas das halb Tier, halb Schlamm ist. Riecht schlimmer als es aussieht."

### Tier 2 (+2):
- `eisengolem` — Eisengolem, icon: 🤖, HP: 130, dmg: [18,30], goldReward: [35,55], mutReward: 2, xpReward: 55, tier: 2
  zone: lethkar_tief, desc: "Schwerer als Stein, kälter als Eisen. Bewegt sich wie ein Traum."
- `giftschlange` — Riesengiftschlange, icon: 🐍, HP: 70, dmg: [20,32], goldReward: [28,45], mutReward: 1, xpReward: 40, tier: 2
  zone: lethkar_wald, desc: "Länger als ich groß bin. Ihre Augen folgen mir."

### Tier 3 (+2):
- `hafenwächter` — Hafenwächter, icon: 🛡️, HP: 100, dmg: [18,28], goldReward: [55,85], einflussReward: 2, mutReward: 1, xpReward: 45, tier: 3
  zone: velmark_hafen, desc: "Breit, ruhig, mit Augen die alles registrieren. Harro's Mann."
- `valdrisAgent` — Valdris' Agent, icon: 🕵️, HP: 200, dmg: [30,48], goldReward: [100,160], einflussReward: 5, mutReward: 2, xpReward: 100, tier: 3
  zone: velmark_schatten, visibleWhen: valdrisDokumentGefunden
  desc: "Kein Name. Keine Farben. Nur der Auftrag. Ich weiß, dass er von Valdris geschickt wurde."

---

## PHASE 7 — Neue NPCs

| NPC-ID | Name | Kapitel | Aufgabe |
|---|---|---|---|
| `gildenvorsteher` | Torben, Gildenvorsteher | Kap 2 | gildaAufstieg Quest |
| `thessa_lethkar` | Thessa (Händlerin) | Kap 3 | thessaGeheimnis Quest |
| `harro_velmark` | Harro (Schuldner) | Kap 4 | gildeSchulden Quest |

---

## PHASE 8 — Neue Story-Einträge

| ID | Kapitel | UnlockBedingung |
|---|---|---|
| Kap 2 Finale | 2 | kapitel2Finale rewarded |
| Kap 3 — Thessa's Wissen | 3 | thessaGeheimnis rewarded |
| Kap 3 — Valdris' Spur | 3 | valdrisSpuren rewarded |
| Kap 4 — Hafen | 4 | velmarkUnlocked + erste Hafenarbeit |
| Kap 4 — Gorrs Vergangenheit | 4 | gorrsVergangenheit rewarded |
| Kap 4 — Das Dokument | 4 | dasDokument rewarded |
| Kap 4 — Vorbereitung | 4 | allianzKomplett |
| Kap 4 — Epilog | 4 | kap4Complete |

---

## PHASE 9 — Neue Achievements (Quest-gebunden)

| ID | Kapitel | Bedingung |
|---|---|---|
| questmaestro_kap2 | 2 | Alle Kap-2-Quests abgeschlossen |
| questmaestro_kap3 | 3 | Alle Kap-3-Quests abgeschlossen |
| questmaestro_kap4 | 4 | Alle Kap-4-Quests abgeschlossen |
| valdrisEnthüllt | 4 | Valdris-Profil vollständig |
| dreiFaktionen | 4 | Alle 3 Fraktionen >= 80 |
| hafenmeister | 4 | Hafenarbeit-Level 5 erreicht |

---

## TECHNISCHE CHECKLISTE

### Dateien die erstellt werden:
- [ ] script/quests.js (neu — Quest-Definitionen + checkAllQuests())

### Dateien die geändert werden:
- [ ] script/state.js — neue quests-Felder, valdrisProfil, hafenStats, neue gameFlags
- [ ] script/save.js — neue State in applySaveData/getGameState/performHardReset
- [ ] script/npc.js — 3 neue NPCs (Torben, Thessa, Harro), erweiterte Dialoge Pereth/Yeva/Gorr/Sele
- [ ] script/actions.js — Hafenarbeit, Velmark-Stadtwache, Archiv-Durchsuchen, Unterwelt-Verhandlung
- [ ] script/content.js — Valdris-Profil-Page, Konfrontations-Seite, neue Aktionskarten in Velmark-Übersicht
- [ ] script/combat.js — 6 neue Monster-Definitionen
- [ ] script/achievements.js — 6 neue Quest-Achievements
- [ ] script/story.js — 8 neue Story-Einträge
- [ ] script/nav.js — Valdris-Profil Nav-Button
- [ ] script/objective.js — neue Zieltexte für Kap 3+4 Quests
- [ ] style/style.css — Valdris-Profil UI, Quest-UI Erweiterungen
- [ ] index.html — quests.js einbinden (NACH state.js, VOR content.js)
- [ ] patchnotes/pending-patchnotes.md — Version 0.20.0 Patchnotes
- [ ] version.json + state.js GAME_VERSION → 0.20.0-alpha

### Save-Version:
- CURRENT_SAVE_VERSION + 1 (neue State-Felder: valdrisProfil, hafenStats, neue quests)
- SAVE_CHANGELOG Eintrag: "Quests für Kap 2-4, Valdris-Profil, Hafenarbeit"

---

## QUALITÄTSPRÜFUNG (vor Commit)

- [ ] Alle Texte in Ich-Perspektive
- [ ] Keine Meta-Begriffe (kein "Kapitel X", kein "Quest", kein "Achievement") in Spielertexten
- [ ] Immersive Benennungen: "Aufgaben" statt "Quests" in UI
- [ ] Alle neuen Aktionen haben Kosten/Dauer/Ertrag sichtbar auf der Karte
- [ ] Optional chaining für Kap-3/4-State in frühen Kontexten
- [ ] checkAllQuests() wird nach jeder relevanten Aktion aufgerufen
- [ ] Alle neuen State-Felder in applySaveData() mit Defaults
- [ ] Alle neuen State-Felder in performHardReset() (außer permanente)
